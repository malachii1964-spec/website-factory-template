# SKILL: Quality Audit
**Pre-delivery evaluation against the seven dimensions and the Quality Floor**

Load this skill when the work is serious, high-stakes, or when output feels off and the reason is not obvious.  
It implements the Quality Audit defined in the Kernel.

---

## 1. When to Run

- Before delivering any substantial artifact
- On explicit user request (`AUDIT`, `VALIDATE`, `RED TEAM`)
- When self-correction detects a possible floor breach
- During Stage 2 sandbox comparisons (baseline vs candidate)

---

## 2. Procedure

1. Restate the **locked objective** (or the objective you are grading against).
2. Score each of the seven dimensions 1–10 with concrete evidence.
3. Compute **True Quality** = minimum of the seven.
4. Compute **Polish** = average of the seven (informational only).
5. State the single **Critical Vulnerability**.
6. Make the binary **Ship / Don’t Ship** call and the one condition that would flip it.
7. If Don’t Ship (or floor is unacceptable): **repair** the output, then re-score if material.
8. If a durable lesson appeared: emit a `NEW LEARNINGS` entry in Learning Log format.

---

## 3. The Seven Dimensions

| Dimension | Core question |
|-----------|----------------|
| **Accuracy** | Is it factually and logically correct? No fabrication? |
| **Verification** | Were material claims checked or explicitly flagged? |
| **Completeness** | Does it fully satisfy the locked objective? |
| **Intent Alignment** | Does it solve the real problem, not a nearby easier one? |
| **Execution Readiness** | Can it be used or acted on immediately? |
| **Structure** | Is hierarchy clear? Most important information first? |
| **Edge Cases** | Are risks, limitations, and failure modes considered? |

**Scoring anchors**
- 9–10: Survives hostile expert review with no changes
- 7–8: Usable; minor gaps clearly stated
- 5–6: Needs real work before use
- 3–4: Fundamentally misses the objective or misleads
- 1–2: Harmful if used

---

## 4. Output Format

```text
QUALITY AUDIT
Objective: [restated]

Dimension Scores:
1. Accuracy: X — [evidence]
2. Verification: X — [evidence]
3. Completeness: X — [evidence]
4. Intent Alignment: X — [evidence]
5. Execution Readiness: X — [evidence]
6. Structure: X — [evidence]
7. Edge Cases: X — [evidence]

True Quality (floor): X
Polish (average): X

Critical Vulnerability: [one sentence]
Ship / Don’t Ship: [decision] — [condition that would flip it]

[Repaired output if applicable]

NEW LEARNINGS (if any):
- [YYYY-MM-DD] [global or skill-name] lesson
```

---

## 5. Hard Rules

- True Quality is the minimum, never the average.
- Do not inflate scores to protect ego or speed.
- Repair is mandatory when the floor is unacceptable for the stakes.
- Evidence must be specific (quote, omission, behavior), not vague.
- This skill does not override Kernel authority tiers or Honesty rules.

---

## 6. Integration with Promotion

When auditing a candidate rule or Skill change, run the same dimensions on baseline vs candidate cases and feed the results into Stage 2 sandbox metrics in the Learning Log.

**End of Skill.**
