# Running this repo locally

The cloud container and a local session are not the same machine, and for MALACHII
the difference is not convenience — it is capability. This file is the handover.

## Why local matters here

Checked in the cloud container, 22 Aug 2026:

```
/dev/bus/usb        does not exist
HTTPS_PROXY         http://127.0.0.1:33991
ollama.com          000 (blocked)
disk                reclaimed when the session ends
```

No USB bus means **SUAF §3 hardware signing is not merely hard, it is impossible**
there. §§2 and 7 now pass, which was the stated precondition for adding hardware.
That gate is the reason to move.

## Setup

```bash
git clone <this repo> && cd website-factory-template
pnpm install                 # root install; the kernel uses ../node_modules/.bin
cd malachii-cma002r && npm run gate
```

`npm run gate` is the real one — build, 130 tests, the 25-mutation campaign, and
a re-bound tree hash. Takes a few minutes. Everything else is fast.

| Command | What it does |
|---|---|
| `npm run typecheck` | strict tsc, no emit |
| `npm run test` | build + 130 tests (~6s) |
| `npm run mutate` | the 25-mutation campaign — proves the tests are load-bearing |
| `npm run gate` | all of the above + rehash. **Run before committing.** |
| `npm run rehash` | re-bind `CHALLENGER_TREE_SHA256.txt` after any source change |

## What the hooks do

Configured in `.claude/settings.json`, all three proven against real failures:

- **SessionStart** — reports whether you are local or in a container, whether a
  YubiKey is reachable, and whether the tree still matches its recorded hash.
  Never blocks; a startup hook that can lock you out of your own repo is worse
  than none.
- **PostToolUse (Write|Edit)** — typechecks the kernel the moment it is edited,
  and only then. Every other edit in this repo exits immediately.
- **Stop** — build + full test suite whenever `malachii-cma002r/` has uncommitted
  changes. Blocks with the actual failure if anything is red.

The mutation campaign is deliberately **not** on Stop. It takes minutes, and a
gate slow enough to resent is a gate people disable. It lives in `npm run gate`.

To review or disable any of them: `/hooks`.

## First thing to do locally: SUAF §3

`src/superUserApproval.ts` already has `algorithm` and `keyId` on the approval
object, and verification already rebuilds the signed payload from the record. The
hardware path is an adapter, not a redesign.

```bash
brew install ykman     # or: apt install yubikey-manager
ykman list
ykman piv info
```

Then replace the software `sign()` call in `signSuperUserApproval` with a PIV
signature requiring touch. Verification does not change — it already checks a
signature against a registered public key. What changes is what the signature
*means*: today it proves key custody, afterwards it proves a human was present.

Until that ships, do not describe the approval gate as hardware-verified. The
build report says so and it should stay true.

## MCP

`.mcp.json.example` → copy to `.mcp.json`. Prefer `claude mcp add` over hand-editing;
it resolves the current package for you. Scope filesystem paths deliberately —
anything you add can read what you point it at.

## What local does not give you

Straight, since it is easy to assume otherwise: **the model is the same**. Same
Opus 5, same context window, same usage limits. What changes is reach — hardware,
persistent disk, unrestricted network, real processes — not horsepower.
