/**
 * The guard: does this action deserve a human in the loop?
 *
 * Deliberately not a model call. A classifier that reasons about intent can be
 * argued out of its own conclusion, and the whole point of a guard is that it
 * behaves the same on the thousandth action as on the first. So this is pure,
 * deterministic pattern matching over the proposed command — same input, same
 * verdict, always, and a test can pin every rule.
 *
 * ## What this is not
 *
 * It is not a security boundary. Shell quoting, variable indirection, base64 and
 * a dozen other tricks defeat pattern matching, and anything that tried to
 * enumerate them would be both slower and still incomplete. This catches the
 * *accident* — the destructive command typed while moving fast, on the wrong
 * path, in the wrong directory. That is the actual failure mode worth a speed
 * bump. Claiming more than that would be the kind of overstatement this project
 * exists to avoid.
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

interface Rule {
  id: string;
  tier: Exclude<RiskTier, "allow">;
  pattern: RegExp;
  reason: string;
  /** A narrower pattern that means this rule does not apply after all. */
  unless?: RegExp;
  /**
   * Set when the trigger legitimately lives *inside* quotes, so the
   * quoted-text carve-out must not apply. SQL is the case that matters: it is
   * always passed as a quoted argument, so "the trigger vanished when quotes
   * were stripped" is normal rather than evidence that it is only text.
   *
   * The cost is a false `ask` on `echo "DROP TABLE users"`. That is the cheap
   * direction to be wrong in — a confirmation, not a refusal.
   */
  triggerIsQuotedByNature?: boolean;
}

/**
 * Ordered most-severe first: the first match wins, so a command that trips both
 * a deny and an ask is denied.
 */
const RULES: Rule[] = [
  {
    id: "pipe-to-shell",
    tier: "deny",
    // Any pipe into a shell, not only a download. Narrowing this to curl/wget
    // would leave `echo '<something destructive>' | sh` allowed, which matters
    // because the quoted-text carve-out below deliberately ignores quoted
    // content — this rule is what still catches it, since the `| sh` that would
    // execute that content is itself unquoted.
    pattern: /\|\s*(?:sudo\s+)?(?:ba|z|k|da)?sh\b|\beval\b|\b(?:ba|z|k|da)?sh\s+-c\b/,
    reason:
      "piping text into a shell, or eval'ing it, runs code nobody has read. Write it to a file, read the file, then run it.",
  },
  {
    id: "skip-verification",
    tier: "deny",
    pattern: /--no-verify|--no-gpg-sign\b.*--no-verify|\bSKIP\s*=\s*\S+\s+git\s+commit/,
    reason:
      "this bypasses the checks instead of fixing what they caught. Fix the failure; the gate is the point.",
  },
  {
    id: "secret-exfiltration",
    tier: "deny",
    pattern:
      /(?:\.env(?:\.\w+)?|id_rsa|id_ed25519|\.pem|credentials|\.ssh\/)[^|;&]*\|[^|;&]*\b(?:curl|wget|nc|ncat|netcat|ssh|mail)\b/,
    reason:
      "this sends credentials off the machine. If something genuinely needs a key, pass it as an environment variable instead.",
  },
  {
    id: "brain-direct-write",
    tier: "ask",
    triggerIsQuotedByNature: true,
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
    triggerIsQuotedByNature: true,
    pattern: /\b(?:DROP\s+(?:TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE|DELETE\s+FROM\s+\w+\s*;)/i,
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

/**
 * Comments can hide a rule's trigger text, and a `#` inside a quoted string is
 * not a comment. Strip only what is unambiguously trailing commentary.
 */
function stripComments(command: string): string {
  return command.replace(/(^|\s)#[^\n]*/g, "$1");
}

/** Removes quoted spans, leaving the part of a command the shell actually executes. */
function stripQuoted(text: string): string {
  return text.replace(/'[^']*'|"[^"]*"/g, " ");
}

/**
 * Whether a rule's trigger exists only inside quotes — making it an argument,
 * not a command.
 *
 * This exists because the guard blocked the very commands written to test it,
 * and would block writing any test fixture, doc example, or error message that
 * quotes a destructive command. A false positive on `deny` is the expensive
 * kind: it stops the work outright rather than asking.
 *
 * The question that matters is not which command it is — an earlier attempt
 * keyed this on `echo`/`printf` and still blocked a script passing a multi-line
 * program to `node -e`. It is whether the trigger survives quote-stripping. If
 * `rm -rf` is still there once the quotes are gone, it is being run; if it
 * vanishes, it was text being passed to something.
 *
 * Two things keep this from becoming a bypass. `rm` targets are unquoted
 * individually, so `rm -rf "/"` is still read as deleting the root. And the
 * pipe-to-shell rule composes correctly rather than needing an exception: in
 * `echo 'rm -rf /' | sh` the `rm` is quoted so its own rule stands down, but
 * `| sh` is not, so that rule fires and the command is denied anyway.
 */
function triggerIsOnlyQuoted(text: string, pattern: RegExp): boolean {
  return pattern.test(text) && !pattern.test(stripQuoted(text));
}

/**
 * Split a command into independently-executed segments.
 *
 * Judging a whole multi-line script as one string was wrong: a dangerous command
 * further down a script escaped a check that only looked at the beginning. But
 * splitting on separators *blindly* was wrong in the opposite direction — a
 * newline inside a quoted multi-line program passed to `node -e` became its own
 * "segment", and a line of that program was then judged as if it were a shell
 * command.
 *
 * So separators are only separators outside quotes. A single `|` is deliberately
 * not one at all: the pipe-to-shell rule has to see both sides of it.
 */
function segments(text: string): string[] {
  const out: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quote) {
      current += char;
      if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === "\n" || char === ";") {
      out.push(current);
      current = "";
      continue;
    }
    const pair = text.slice(i, i + 2);
    if (pair === "&&" || pair === "||") {
      out.push(current);
      current = "";
      i++;
      continue;
    }
    current += char;
  }
  out.push(current);
  return out.filter((segment) => segment.trim());
}

const RECURSIVE_FORCE = /\brm\b[^|;&]*\s-[a-zA-Z]*(?:[rR][a-zA-Z]*f|f[a-zA-Z]*[rR])/;

/** Directories whose whole purpose is to be thrown away. */
const DISPOSABLE = /^(?:\/tmp\/|\/var\/tmp\/|\/var\/folders\/|\$\{?(?:TMPDIR|SCRATCH)\b)/;
/** A target that cannot escape the working directory. */
const CLEARLY_RELATIVE = /^(?:\.\/|[\w.@-]+\/|[\w.@-]+$)/;

/**
 * `rm -rf` needs judgement about its target, not a single pattern.
 *
 * The first attempt denied every absolute path, which blocked cleaning up a
 * scratch directory — ordinary work here, and exactly the kind of false positive
 * that gets a guard switched off. But allowing every absolute path would wave
 * through `rm -rf /var/lib`.
 *
 * So the target decides the tier. Depth is the signal that separates a mistake
 * from an intention: `/` and `/var/lib` are places you land by accident when a
 * variable came back empty, while a four-segment path is something someone
 * typed deliberately. Deliberate still gets a confirmation — just not a refusal.
 */
function classifyRemoval(segment: string): Verdict {
  if (!RECURSIVE_FORCE.test(segment)) return ALLOWED;

  const targets = segment
    .replace(/\brm\b/, "")
    .split(/\s+/)
    .filter((token) => token && !token.startsWith("-"));

  if (targets.length === 0) {
    return {
      tier: "deny",
      reason: "a recursive force-delete with no target at all.",
      rule: "rm-rf-no-target",
    };
  }

  let worst: Verdict = ALLOWED;
  for (const raw of targets) {
    const target = raw.replace(/^["']|["']$/g, "");
    if (DISPOSABLE.test(target) || CLEARLY_RELATIVE.test(target)) continue;

    // `~`, `$HOME`, `/`, or a bare variable that could expand to any of them.
    const depth = target.startsWith("/") ? target.split("/").filter(Boolean).length : 0;
    const homeOrRoot = /^(?:\/|~|\$\{?HOME\b|\$\{?\w+\}?\/?$)/.test(target);
    if (homeOrRoot && depth < 3) {
      return {
        tier: "deny",
        reason: `"${target}" is the filesystem root, a home directory, or an unexpanded variable that could be either. Name the exact path instead.`,
        rule: "rm-rf-root",
      };
    }
    if (depth > 0 && depth < 3) {
      return {
        tier: "deny",
        reason: `"${target}" is a top-level system directory. Name a deeper, specific path if this is really what you want.`,
        rule: "rm-rf-system",
      };
    }
    worst = {
      tier: "ask",
      reason: `this recursively force-deletes "${target}", which cannot be undone.`,
      rule: "rm-rf-path",
    };
  }
  return worst;
}

function classifySegment(segment: string): Verdict {
  const removal = classifyRemoval(segment);
  if (removal.tier !== "allow" && !triggerIsOnlyQuoted(segment, RECURSIVE_FORCE)) {
    return removal;
  }

  for (const rule of RULES) {
    if (!rule.pattern.test(segment)) continue;
    if (rule.unless?.test(segment)) continue;
    if (!rule.triggerIsQuotedByNature && triggerIsOnlyQuoted(segment, rule.pattern)) continue;
    return { tier: rule.tier, reason: rule.reason, rule: rule.id };
  }
  return ALLOWED;
}

/** Classify a shell command. Pure: no I/O, no clock, no randomness. */
export function classifyCommand(command: string): Verdict {
  const text = stripComments(command);
  if (!text.trim()) return ALLOWED;

  let worst = ALLOWED;
  for (const segment of segments(text)) {
    const verdict = classifySegment(segment);
    if (verdict.tier === "deny") return verdict;
    if (verdict.tier === "ask" && worst.tier === "allow") worst = verdict;
  }
  return worst;
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
      return {
        tier: "ask",
        reason: `${path} is ${what}.`,
        rule: "protected-path",
      };
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
