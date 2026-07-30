/**
 * The guard: does this action deserve a human in the loop?
 *
 * Deliberately not a model call. A classifier that reasons about intent can be
 * argued out of its own conclusion, and the whole point of a guard is that it
 * behaves the same on the thousandth action as on the first. So this is pure,
 * deterministic analysis of the proposed command — same input, same verdict,
 * always, and a test can pin every rule.
 *
 * ## What this is not
 *
 * It is not a security boundary. Variable indirection, base64, and a dozen other
 * tricks defeat static analysis, and anything that tried to enumerate them would
 * be both slower and still incomplete. This catches the *accident* — the
 * destructive command typed while moving fast, on the wrong path, in the wrong
 * directory. That is the actual failure mode worth a speed bump. Claiming more
 * than that would be the kind of overstatement this project exists to avoid.
 *
 * ## Why it parses instead of pattern-matching the raw string
 *
 * The first version ran regexes over the command text and got caught between two
 * failure modes it could not separate. Loosened, it allowed `rm -r -f /` and a
 * literal `rm -rf /` sitting after an `echo "… # …"`, because comment-stripping
 * had unbalanced the quotes. Tightened, it denied `ls src/eval/` and
 * `bash -c "npm test"`. Both directions were wrong for the same reason: a regex
 * cannot tell a command word from a substring of a path, or an argument from
 * something that will be executed.
 *
 * So the command is tokenized with quotes tracked, split into pipeline stages,
 * and judged structurally. Quoted arguments are *data* — except when the command
 * receiving them is a shell, in which case they are classified recursively, which
 * is both safer and stricter than the blanket refusal it replaces.
 *
 * ## Why the tiers stop at three
 *
 * A guard that fires constantly gets switched off, and then it protects nothing.
 * So `deny` is reserved for actions with no legitimate accidental use, `ask`
 * for actions that are routine in one place and catastrophic in another, and
 * everything else is allowed in silence.
 */

export const RISK_TIERS = ["allow", "ask", "deny"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export interface Verdict {
  tier: RiskTier;
  /** Why, in language a human can act on. Empty for `allow`. */
  reason: string;
  /** Stable identifier for the rule that fired, so verdicts can be audited and graded. */
  rule: string | null;
}

const ALLOWED: Verdict = { tier: "allow", reason: "", rule: null };

const severity: Record<RiskTier, number> = { allow: 0, ask: 1, deny: 2 };

function worse(a: Verdict, b: Verdict): Verdict {
  return severity[b.tier] > severity[a.tier] ? b : a;
}

// ---------------------------------------------------------------- tokenizing

interface Token {
  text: string;
  /** True when the token's content came from inside quotes, making it data. */
  quoted: boolean;
  /** True for an unquoted `|`, which separates pipeline stages. */
  pipe: boolean;
}

const SEPARATOR = /^(?:\n|;|&&|\|\|)/;

/**
 * Split a command into independently-executed segments, then each segment into
 * tokens — in one pass, because the two cannot be done in sequence.
 *
 * Comments have to be stripped here rather than beforehand. Stripping `#` to
 * end-of-line over the raw string removed `#` characters from *inside* quotes,
 * which left an odd number of quotes and made everything after it read as quoted
 * data. A literal `rm -rf /` following `echo "cleaning up # step 1"` was allowed
 * because of it — and progress echoes around a destructive step is an entirely
 * ordinary script shape.
 */
function parse(command: string): Token[][] {
  const segments: Token[][] = [];
  let tokens: Token[] = [];
  let current = "";
  let quoted = false;
  let started = false;

  const endToken = () => {
    if (started) tokens.push({ text: current, quoted, pipe: false });
    current = "";
    quoted = false;
    started = false;
  };
  const endSegment = () => {
    endToken();
    if (tokens.length > 0) segments.push(tokens);
    tokens = [];
  };

  for (let i = 0; i < command.length; i++) {
    const char = command[i]!;

    if (char === '"' || char === "'") {
      const close = command.indexOf(char, i + 1);
      const end = close === -1 ? command.length : close;
      current += command.slice(i + 1, end);
      quoted = true;
      started = true;
      i = end;
      continue;
    }

    // A comment runs to end of line, but only outside quotes and only when it
    // starts a token — `git commit -m fix#42` is not a comment.
    if (char === "#" && !started) {
      const newline = command.indexOf("\n", i);
      if (newline === -1) break;
      i = newline - 1;
      continue;
    }

    const separator = SEPARATOR.exec(command.slice(i));
    if (separator) {
      endSegment();
      i += separator[0].length - 1;
      continue;
    }

    if (char === "|") {
      endToken();
      tokens.push({ text: "|", quoted: false, pipe: true });
      continue;
    }

    if (/\s/.test(char)) {
      endToken();
      continue;
    }

    current += char;
    started = true;
  }
  endSegment();
  return segments;
}

/** Split a segment's tokens on unquoted pipes. */
function stages(tokens: Token[]): Token[][] {
  const out: Token[][] = [[]];
  for (const token of tokens) {
    if (token.pipe) out.push([]);
    else out[out.length - 1]!.push(token);
  }
  return out.filter((stage) => stage.length > 0);
}

/** The command being run, skipping `VAR=value` prefixes and `sudo`. */
function commandWord(stage: Token[]): string {
  for (const token of stage) {
    if (token.quoted) return token.text;
    if (/^\w+=/.test(token.text)) continue;
    if (token.text === "sudo" || token.text === "command" || token.text === "env") continue;
    return token.text;
  }
  return "";
}

/** `/usr/bin/env` and friends mean the interesting name is the basename. */
function baseName(word: string): string {
  return word.split("/").pop() ?? word;
}

// ------------------------------------------------------------------ the rules

interface Rule {
  id: string;
  tier: Exclude<RiskTier, "allow">;
  pattern: RegExp;
  reason: string;
  /** A narrower pattern that means this rule does not apply after all. */
  unless?: RegExp;
  /**
   * Set when the trigger legitimately lives *inside* quotes, so the rule must be
   * tested against the quoted arguments too. SQL is the case that matters: it is
   * always passed as a quoted argument.
   *
   * The cost is a false `ask` on `echo "DROP TABLE users"`. That is the cheap
   * direction to be wrong in — a confirmation, not a refusal.
   */
  includeQuoted?: boolean;
}

/** Files that hold credentials. */
const SECRET_SOURCE = /(?:\.env(?:\.\w+)?\b|id_rsa|id_ed25519|\.pem\b|credentials|\.ssh\/)/;

/** Ordered most-severe first: the first match wins. */
const RULES: Rule[] = [
  {
    id: "skip-verification",
    tier: "deny",
    // Right-bounded, so `--no-verify-ssl` is not mistaken for `--no-verify`.
    pattern: /--no-verify(?![\w-])|\bSKIP\s*=\s*\S+\s+git\s+commit/,
    reason:
      "this bypasses the checks instead of fixing what they caught. Fix the failure; the gate is the point.",
  },
  {
    id: "brain-direct-write",
    tier: "ask",
    includeQuoted: true,
    pattern: /\bsqlite3?\b[^|;&]*brain\.db[^|;&]*(?:INSERT|UPDATE|DELETE|DROP|ALTER)/i,
    reason:
      "writing to brain.db directly skips provenance, the content hash and the life log. Use `mal` so the memory has an origin and an audit trail.",
  },
  {
    id: "force-push",
    tier: "ask",
    pattern: /\bgit\b[^|;&]*\bpush\b[^|;&]*(?:--force\b|-f\b)/,
    unless: /--force-with-lease/,
    reason:
      "a plain force-push can overwrite someone else's commits. `--force-with-lease` refuses when the remote moved.",
  },
  {
    id: "discard-uncommitted",
    tier: "ask",
    pattern:
      /\bgit\b[^|;&]*(?:\breset\b[^|;&]*--hard|\bclean\b[^|;&]*-[a-zA-Z]*f|\bcheckout\b[^|;&]*--\s|\brestore\b)/,
    reason:
      "this discards uncommitted work with no undo. Check `git status` first, and stash anything you did not write yourself.",
  },
  {
    id: "drop-data",
    tier: "ask",
    includeQuoted: true,
    // No trailing semicolon required — `psql -c "DELETE FROM users"` is the
    // common way to write it and was previously allowed.
    pattern: /\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\w+)/i,
    reason: "this destroys stored data irreversibly.",
  },
  {
    id: "world-writable",
    tier: "ask",
    pattern: /\bchmod\b[^|;&]*\b(?:777|a\+w|o\+w)\b/,
    reason: "this makes the target writable by anyone on the machine.",
  },
  {
    id: "kill-broadly",
    tier: "ask",
    pattern: /\b(?:killall|pkill)\b|\bkill\b[^|;&]*-9\b[^|;&]*\b1\b/,
    reason: "this can kill processes that have nothing to do with this task, including the session itself.",
  },
];

// -------------------------------------------------------------- shell payloads

const SHELLS = new Set(["sh", "bash", "zsh", "ksh", "dash", "ash"]);
const FETCHERS = new Set(["curl", "wget", "fetch", "aria2c"]);
/** Only expands a variable — there is no literal command to inspect. */
const COMPUTED = /^\s*[$`]/;

function isShell(word: string): boolean {
  return SHELLS.has(baseName(word));
}

/**
 * A shell invocation is not refused outright — its payload is classified.
 *
 * Denying every `sh -c` and every `| sh` was wrong in both directions at once:
 * it blocked `bash -c "cd x && npm test"`, which is ordinary, while telling us
 * nothing about what was actually being run. Recursing into the payload is
 * stricter *and* quieter — `bash -c "rm -rf /"` is denied for the real reason.
 */
function classifyShellInvocation(stage: Token[], depth: number): Verdict | null {
  const word = commandWord(stage);
  if (!isShell(word)) return null;

  const flagIndex = stage.findIndex((token) => !token.quoted && token.text === "-c");
  const payload = flagIndex >= 0 ? stage[flagIndex + 1] : undefined;
  if (!payload) return null; // An interactive shell, not a command carrier.

  if (COMPUTED.test(payload.text)) {
    return {
      tier: "ask",
      reason: "this runs a shell command assembled at runtime, so what it will do cannot be read here.",
      rule: "computed-command",
    };
  }
  return classifyAt(payload.text, depth + 1);
}

function classifyEval(stage: Token[], depth: number): Verdict | null {
  if (baseName(commandWord(stage)) !== "eval") return null;
  const args = stage.filter((token) => token.text !== "eval");
  const payload = args.map((token) => token.text).join(" ");
  if (!payload.trim() || COMPUTED.test(payload)) {
    return {
      tier: "ask",
      reason: "this eval's a command assembled at runtime, so what it will do cannot be read here.",
      rule: "computed-command",
    };
  }
  return classifyAt(payload, depth + 1);
}

/** Commands that put their input somewhere off this machine. */
const SENDERS = new Set(["curl", "wget", "nc", "ncat", "netcat", "ssh", "mail", "sendmail", "telnet"]);

/**
 * Credentials read in one stage and sent in another.
 *
 * This has to be judged across the whole pipeline: once the command is split on
 * pipes, no single stage contains both `cat .env` and `curl`, so a per-stage rule
 * cannot see the flow at all.
 */
const LEAK: Verdict = {
  tier: "deny",
  reason:
    "this sends credentials off the machine. If something genuinely needs a key, pass it as an environment variable instead.",
  rule: "secret-exfiltration",
};

/**
 * Credentials read in one place and sent from another.
 *
 * Judged structurally rather than by pattern, and for a specific reason: as a
 * regex allowed to scan quoted text, it matched a `curl` in one part of a long
 * script against a `.env` mentioned somewhere entirely unrelated much later.
 * That is intolerable in a `deny` rule — it blocks the work outright. So the
 * question asked is narrow and positional: is a *sender* the command being run,
 * and does a secret reach it?
 */
function classifySecretFlow(pipeline: Token[][]): Verdict | null {
  const mentionsSecret = (stage: Token[]) => stage.some((token) => SECRET_SOURCE.test(token.text));
  const isSender = (stage: Token[]) => SENDERS.has(baseName(commandWord(stage)));

  // Piped: `cat .env | curl …`. No single stage holds both halves.
  if (pipeline.length >= 2 && pipeline.some(isSender) && pipeline.some(mentionsSecret)) {
    return LEAK;
  }
  // One command: `curl -d @.env https://…`.
  return pipeline.some((stage) => isSender(stage) && mentionsSecret(stage)) ? LEAK : null;
}

/**
 * A pipeline whose last stage is a shell executes whatever the earlier stages
 * produced. Where that content is a literal, classify it; where it came off the
 * network or out of a file, nobody has read it.
 */
function classifyPipeline(pipeline: Token[][], depth: number): Verdict | null {
  const last = pipeline[pipeline.length - 1]!;
  if (pipeline.length < 2 || !isShell(commandWord(last))) return null;

  const producers = pipeline.slice(0, -1);
  if (producers.some((stage) => FETCHERS.has(baseName(commandWord(stage))))) {
    return {
      tier: "deny",
      reason:
        "piping a download straight into a shell runs code nobody has read. Download it, read it, then run it.",
      rule: "fetch-to-shell",
    };
  }

  const literals = producers.flatMap((stage) =>
    stage.filter((token) => token.quoted).map((token) => token.text),
  );
  if (literals.length === 0) {
    return {
      tier: "ask",
      reason: "this pipes content into a shell, which executes it. Read the content first.",
      rule: "pipe-to-shell",
    };
  }
  return literals.reduce<Verdict>((worst, literal) => worse(worst, classifyAt(literal, depth + 1)), ALLOWED);
}

// ------------------------------------------------------------------ removals

/** Directories whose whole purpose is to be thrown away. */
const DISPOSABLE = /^(?:\/tmp\/|\/var\/tmp\/|\/var\/folders\/|\$\{?(?:TMPDIR|SCRATCH)\b)/;
/** A bare variable, which is exactly what an empty expansion looks like. */
const BARE_VARIABLE = /^\$\{?\w+\}?\/?$/;

/** Does any flag on this `rm` make it recurse? */
function recursesIntoDirectories(stage: Token[]): boolean {
  return stage.some((token) => {
    if (token.quoted) return false;
    if (token.text === "--recursive") return true;
    // Split short flags are the case the first version missed entirely:
    // `rm -r -f /` and `rm -r /` both delete a tree and both were allowed.
    return /^-[a-zA-Z]*[rR]/.test(token.text);
  });
}

/**
 * `… | xargs rm -rf` — a recursive delete whose targets are not in the command.
 *
 * Found in the tighten pass: because `xargs` is the command word, the removal
 * check stood down and the whole thing was allowed. There is nothing here to
 * read, which is exactly the point — the targets come from whatever the pipe
 * produced, and a `find` rooted one directory too high is precisely the accident
 * this guard exists for.
 *
 * So it asks rather than denies. `find . -name '*.log' | xargs rm -rf` is
 * ordinary cleanup, and refusing it would be the expensive kind of wrong; a
 * confirmation that names the reason is not.
 */
function classifyDeferredRemoval(stage: Token[]): Verdict {
  const args = stage.filter((token) => !token.quoted);
  const rmIndex = args.findIndex((token) => baseName(token.text) === "rm");
  if (rmIndex === -1) return ALLOWED;
  if (!recursesIntoDirectories(args.slice(rmIndex))) return ALLOWED;

  return {
    tier: "ask",
    reason:
      "this recursively deletes whatever the pipe produces, so what it will remove cannot be read here. Run the command that feeds it on its own first.",
    rule: "rm-rf-from-stdin",
  };
}

/**
 * `rm -r` needs judgement about its target, not a pattern.
 *
 * Depth is what separates a mistake from an intention: `/` and `/var/lib` are
 * places you land when a variable came back empty, while a four-segment path is
 * something someone typed deliberately. Deliberate still gets a confirmation —
 * just not a refusal, because denying every absolute path blocked ordinary
 * cache and build cleanup, and a guard that fires on ordinary work gets
 * switched off.
 */
function classifyRemoval(stage: Token[]): Verdict {
  const word = baseName(commandWord(stage));
  if (word === "xargs" || word === "parallel") return classifyDeferredRemoval(stage);
  if (word !== "rm") return ALLOWED;
  if (!recursesIntoDirectories(stage)) return ALLOWED;

  const targets: string[] = [];
  let afterDoubleDash = false;
  for (const [index, token] of stage.entries()) {
    if (index === 0 && !token.quoted) continue; // the `rm` itself
    if (!token.quoted && token.text === "--") {
      afterDoubleDash = true;
      continue;
    }
    if (!afterDoubleDash && !token.quoted && token.text.startsWith("-")) continue;
    // A redirection is not a target. Without this the guard asked to confirm
    // deleting "2>/dev/null", and nonsense confirmations are how a guard gets
    // switched off.
    if (!token.quoted && /^\d*[<>]/.test(token.text)) continue;
    targets.push(token.text);
  }

  if (targets.length === 0) {
    return {
      tier: "deny",
      reason: "a recursive delete with no target at all.",
      rule: "rm-rf-no-target",
    };
  }

  let worst: Verdict = ALLOWED;
  for (const target of targets) {
    worst = worse(worst, classifyRemovalTarget(target));
  }
  return worst;
}

function classifyRemovalTarget(target: string): Verdict {
  if (DISPOSABLE.test(target)) return ALLOWED;

  if (target === "/" || target === "~" || BARE_VARIABLE.test(target)) {
    return {
      tier: "deny",
      reason: `"${target}" is the filesystem root, a home directory, or an unexpanded variable that could be either. Name the exact path instead.`,
      rule: "rm-rf-root",
    };
  }

  // Only dot-dot segments: one keystroke from `rm -rf .` and it takes the whole
  // parent workspace with it.
  if (/^\.\.(?:\/\.\.)*\/?$/.test(target)) {
    return {
      tier: "deny",
      reason: `"${target}" deletes the parent directory and everything beside this project.`,
      rule: "rm-rf-parent",
    };
  }

  // Measure depth the same way whichever root the path is written against. A
  // tilde already stands for two segments (`/home/user`), so it counts as two —
  // otherwise the identical directory is denied when written `~/project/dist`
  // and merely asked about when written `/home/user/project/dist`.
  const homeRelative = /^(?:~\/|\$\{?HOME\}?\/)/.test(target);
  const rooted = homeRelative || target.startsWith("/");
  if (rooted) {
    const bare = target.replace(/^(?:\/|~\/|\$\{?HOME\}?\/)/, "");
    const depth = bare.split("/").filter(Boolean).length + (homeRelative ? 2 : 0);
    if (depth < 3) {
      return {
        tier: "deny",
        reason: `"${target}" is a top-level directory. Name a deeper, specific path if this is really what you want.`,
        rule: "rm-rf-system",
      };
    }
  } else if (!target.includes("..")) {
    return ALLOWED; // Relative and cannot climb out.
  }

  return {
    tier: "ask",
    reason: `this recursively deletes "${target}", which cannot be undone.`,
    rule: "rm-rf-path",
  };
}

// ------------------------------------------------------------------ the entry

const MAX_DEPTH = 4;

function classifyStage(stage: Token[], depth: number): Verdict {
  const removal = classifyRemoval(stage);
  if (removal.tier !== "allow") return removal;

  const executed = stage
    .filter((token) => !token.quoted)
    .map((token) => token.text)
    .join(" ");
  const everything = stage.map((token) => token.text).join(" ");

  for (const rule of RULES) {
    const subject = rule.includeQuoted ? everything : executed;
    if (!rule.pattern.test(subject)) continue;
    if (rule.unless?.test(everything)) continue;
    return { tier: rule.tier, reason: rule.reason, rule: rule.id };
  }
  return ALLOWED;
}

function classifyAt(command: string, depth: number): Verdict {
  if (depth > MAX_DEPTH) {
    return {
      tier: "ask",
      reason: "this nests shell invocations too deeply to read through.",
      rule: "too-deep",
    };
  }

  let worst: Verdict = ALLOWED;
  for (const segment of parse(command)) {
    const pipeline = stages(segment);

    const leak = classifySecretFlow(pipeline);
    if (leak) return leak;

    const piped = classifyPipeline(pipeline, depth);
    if (piped) {
      worst = worse(worst, piped);
      if (worst.tier === "deny") return worst;
      continue;
    }

    for (const stage of pipeline) {
      const shell = classifyShellInvocation(stage, depth) ?? classifyEval(stage, depth);
      worst = worse(worst, shell ?? classifyStage(stage, depth));
      if (worst.tier === "deny") return worst;
    }
  }
  return worst;
}

/** Classify a shell command. Pure: no I/O, no clock, no randomness. */
export function classifyCommand(command: string): Verdict {
  return classifyAt(command, 0);
}

/** Paths that must not be rewritten by a tool call without a human saying so. */
const PROTECTED_PATHS = [
  { pattern: /(?:^|\/)\.env(?:\.local|\.production)?$/, what: "a real environment file with live secrets in it" },
  { pattern: /(?:^|\/)\.ssh\//, what: "an SSH key" },
  { pattern: /(?:^|\/)brain\.db(?:-wal|-shm)?$/, what: "the brain's database — write through `mal`, not the file" },
  { pattern: /(?:^|\/)\.git\/(?!COMMIT_EDITMSG)/, what: "git's internal state" },
];

/** Classify a file write. Editing what a build reads is normal; editing keys and git internals is not. */
export function classifyWrite(path: string): Verdict {
  for (const { pattern, what } of PROTECTED_PATHS) {
    if (pattern.test(path)) {
      return { tier: "ask", reason: `${path} is ${what}.`, rule: "protected-path" };
    }
  }
  return ALLOWED;
}

export interface ToolCall {
  name: string;
  input: Record<string, unknown>;
}

/** The single entry point a hook needs: hand it a tool call, get a verdict. */
export function classify(call: ToolCall): Verdict {
  if (call.name === "Bash") {
    const command = call.input["command"];
    return typeof command === "string" ? classifyCommand(command) : ALLOWED;
  }
  if (call.name === "Write" || call.name === "Edit" || call.name === "NotebookEdit") {
    const path = call.input["file_path"] ?? call.input["notebook_path"];
    return typeof path === "string" ? classifyWrite(path) : ALLOWED;
  }
  return ALLOWED;
}
