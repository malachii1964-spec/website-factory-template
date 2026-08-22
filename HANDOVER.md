# Handover to a local session

A fresh Claude Code session on your machine starts cold — it has this repo, and
nothing else. Paste the block below as your first message and it picks up exactly
where the cloud session left off.

Setup first (once):

```bash
git clone https://github.com/malachii1964-spec/website-factory-template
cd website-factory-template
git checkout claude/chatgpt-collaboration-review-10x04u
pnpm install
```

Then open Claude Code **in that folder** and paste:

---

```
Read LOCAL_SETUP.md and malachii-cma002r/CMA-002R_v1.1_BUILD_REPORT.md first.

Context: malachii-cma002r/ is a memory trust kernel. Promotion to M4/M5 requires
an Ed25519 SuperUserApproval whose canonical payload is rebuilt from the record,
so an approval binds to one memory, one target maturity, and one exact rule text.
SUAF sections 2 and 7 pass: 130 tests, 25/25 constitutional mutations killed.

Verify before doing anything:
  cd malachii-cma002r && npm run gate

Task: implement SUAF section 3 — hardware signing. Today a signature proves key
custody. It must prove a human was present.

  1. Check for a YubiKey: ykman list && ykman piv info
  2. Add a PIV signing adapter behind the existing signSuperUserApproval seam in
     src/superUserApproval.ts. algorithm and keyId are already on the approval
     object and verification already checks a signature against a registered
     public key — this is an adapter, not a redesign.
  3. Signing must require physical touch. Verification logic must not change.
  4. Keep the software path for tests and dev; hardware is opt-in by config.
  5. Add tests. Run npm run gate — the mutation campaign must stay at 100%.
  6. Update the build report: it currently states plainly that a signature proves
     key custody and not human presence. Only change that sentence once the
     hardware path is real and tested.

Do not modify the frozen CMA-001 baseline. Do not promote the challenger.
```

---

## If you do not have a YubiKey

Then do **DIR-0 instead** — it needs no hardware and it is the higher-value move
anyway. Paste this instead:

```
Read LOCAL_SETUP.md and CLAUDE.md.

Task: put the MALACHII kernel (malachii-cma002r/) behind the "Decisions made
(do not relitigate)" block in CLAUDE.md.

Each decision becomes a memory. New ones enter at M0. Ones a real build has
validated get outcome attestation from the build itself. Contradictions with an
existing validated decision must surface before code is written.

Start by proposing the smallest design that actually works, then build it.
Run npm run gate before committing.
```

Hardware is the gate that unlocks the strongest claim. DIR-0 is the one that
gives the kernel a user. If you can only do one, do DIR-0.
