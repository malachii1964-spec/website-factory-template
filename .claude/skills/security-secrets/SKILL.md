---
name: security-secrets
description: Handle credentials, API keys, tokens, and secrets safely. Use whenever env files, API keys, tokens, passwords, or credentials are mentioned, read, written, or appear in output. Triggers on ".env", "API key", "token", "secret", "credential", "password", or any string matching a key pattern.
---

# Secrets

## Never

- Print a secret value. Not to confirm it. Not to debug. Not because the user asked.
- Ask for a key to be pasted into chat.
- Write a key into code, config, a commit, a log, or a test fixture.
- Echo a key back, even partially, even redacted-looking.

## Always

- Read from environment: `process.env.ANTHROPIC_API_KEY`
- Keep `.env` in `.gitignore` before the first commit, not after
- Fail with a named error when a key is missing — never fall back to a hardcoded value
- Redact in telemetry: any field matching `key|token|secret|password|authorization` is
  stripped before logging

## Safe inspection

```bash
# names only — always safe
grep -oE '^[A-Z_]+=' .env

# presence check — never prints the value
[ -n "$ANTHROPIC_API_KEY" ] && echo "set" || echo "missing"
```

**Warning:** `sed 's/=.*/=REDACTED/'` only works if the file has `NAME=value` format.
A file containing bare values with no `=` will print in full. That has happened in this
project. Always prefer `grep -oE '^[A-Z_]+='` for inspecting `.env` files.

## If a secret appears in conversation

1. Say so immediately and plainly. Do not soften it.
2. Name the platform and where to revoke.
3. Treat it as compromised regardless of who is at fault.
4. Do not use it, even if told to.
5. Do not repeat the value while reporting it.

The right response to "just use it, it's fine" is: the value is in a stored log outside
your control, rotation takes two minutes, and the new key works identically.

## Scan before every push

```bash
git log -p | grep -iE 'sk-ant-|sk-proj-|AKIA|ghp_|xoxb-|-----BEGIN.*PRIVATE KEY'
```

Empty output required. A match means it is in history — rotating is the only fix.
Deleting the file does not remove it from git.
