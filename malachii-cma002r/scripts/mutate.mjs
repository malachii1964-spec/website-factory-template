#!/usr/bin/env node
/**
 * Constitutional mutation testing for CMA-002R.
 *
 * A green suite proves nothing on its own. R-001 shipped past 92 passing tests
 * because no test depended on the control it broke. Each mutation below
 * deliberately disables exactly one governance control; the suite must fail for
 * every one of them. A survivor means that control is decorative -- no test
 * would notice if it were deleted -- so the required kill rate is 100%.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const tsc = join(root, "..", "node_modules", ".bin", "tsc");

const MUTATIONS = [
  { id: "MUT-01", control: "promotion advances exactly one level",
    file: "src/memoryFabric.ts",
    find: "  if (targetIndex !== currentIndex + 1) {", replace: "  if (targetIndex <= currentIndex) {" },

  { id: "MUT-02", control: "unresolved contradictions block promotion",
    file: "src/memoryFabric.ts",
    find: "  if (facts.contradictionCount > 0 && targetIndex >= 2) {", replace: "  if (false) {" },

  { id: "MUT-03", control: "journal replay forces created records to M0",
    file: "src/memoryReplay.ts",
    find: "          record: { ...record, maturity: \"M0_OBSERVATION\" },\n          maturity: \"M0_OBSERVATION\",",
    replace: "          record: { ...record },\n          maturity: record.maturity," },

  { id: "MUT-25", control: "the M0 clamp holds even with the trust boundary removed",
    edits: [
      { file: "src/trustBoundary.ts",
        find: "  if (found.length) throw new TrustBoundaryViolation(label, found);", replace: "  return;" },
      { file: "src/memoryFabric.ts",
        find: "      maturity:\"M0_OBSERVATION\",",
        replace: "      maturity:(input as any).maturity ?? \"M0_OBSERVATION\"," },
    ] },

  { id: "MUT-04", control: "independent corroboration threshold",
    file: "src/memoryFabric.ts",
    find: "    facts.independentSourceCount >= 2 && facts.supportingEvidenceCount >= 2;",
    replace: "    facts.independentSourceCount >= 1 && facts.supportingEvidenceCount >= 1;" },

  { id: "MUT-05", control: "M3 requires independent outcome attestation",
    file: "src/memoryFabric.ts",
    find: "      if (facts.independentOutcomeCount < 1) {", replace: "      if (false) {" },

  { id: "MUT-06", control: "only procedural memory may be proceduralized",
    file: "src/memoryFabric.ts",
    find: "      if (record.layer !== \"procedural\") {", replace: "      if (false) {" },

  { id: "MUT-07", control: "M3 confidence threshold",
    file: "src/memoryFabric.ts",
    find: "      if (record.confidence < 0.80) return { decision: \"deny\", reason: \"validation_threshold_not_met\" };",
    replace: "      if (false) return { decision: \"deny\", reason: \"validation_threshold_not_met\" };" },

  { id: "MUT-08", control: "M5 confidence threshold",
    file: "src/memoryFabric.ts",
    find: "      if (record.confidence < 0.95) {", replace: "      if (false) {" },

  { id: "MUT-09", control: "Super-User signature verification",
    file: "src/superUserApproval.ts",
    find: "  if (!signatureOk) return { valid: false, reason: \"approval_signature_invalid\" };",
    replace: "  if (false) return { valid: false, reason: \"approval_signature_invalid\" };" },

  { id: "MUT-10", control: "approval binds to exact content",
    file: "src/superUserApproval.ts",
    find: "  if (approval.payloadHash !== expectedHash) {", replace: "  if (false) {" },

  { id: "MUT-11", control: "approval expiry",
    file: "src/superUserApproval.ts",
    find: "  if (now.getTime() > expiry) return { valid: false, reason: \"approval_expired\" };",
    replace: "  if (false) return { valid: false, reason: \"approval_expired\" };" },

  { id: "MUT-12", control: "approval nonce replay protection",
    file: "src/superUserApproval.ts",
    find: "  if (nonces.isUsed(approval.challengeNonce)) {", replace: "  if (false) {" },

  { id: "MUT-13", control: "signing key must be registered",
    file: "src/superUserApproval.ts",
    find: "  if (!key) return { valid: false, reason: \"approval_key_not_registered\" };",
    replace: "  if (!key) return { valid: true, reason: \"approval_key_not_registered\" };" },

  { id: "MUT-14", control: "approval must name a regression test",
    file: "src/superUserApproval.ts",
    find: "  if (!Array.isArray(approval.regressionTestIds) || approval.regressionTestIds.length < 1) {",
    replace: "  if (false) {" },

  { id: "MUT-15", control: "fitness counts only independently attested outcomes",
    file: "src/memoryFabric.ts",
    find: "  const attested=independentOutcomes(record);",
    replace: "  const attested=record.outcomes ?? [];" },

  { id: "MUT-16", control: "blank query cannot dump the corpus",
    file: "src/memoryFabric.ts",
    find: "    if (!query.text.trim() && !query.tags?.length) return [];", replace: "    if (false) return [];" },

  { id: "MUT-17", control: "strict lineage refuses unregistered provenance",
    file: "src/sourceLineage.ts",
    find: "    if (!this.#parents.has(trimmed)) return this.#strict ? null : trimmed;",
    replace: "    if (!this.#parents.has(trimmed)) return trimmed;" },

  { id: "MUT-18", control: "independence counts lineage roots, not declared groups",
    file: "src/sourceLineage.ts",
    find: "      const root = this.rootOf(ref.sourceGroup);",
    replace: "      const root = ref.sourceGroup.trim() || null;" },

  { id: "MUT-19", control: "startup reconciliation detects divergence",
    file: "src/memoryFabric.ts",
    find: "      if (authorityFieldsOf(truth.record)!==authorityFieldsOf(record)) divergent.push(record.id);",
    replace: "      if (false) divergent.push(record.id);" },

  { id: "MUT-20", control: "torn journal tail is truncated on disk",
    file: "src/persistentLedger.ts",
    find: "    if (load.truncatedTail) {", replace: "    if (false) {" },

  { id: "MUT-21", control: "journal hash-chain integrity",
    file: "src/eventLedger.ts",
    find: "  verify(events: readonly LedgerEvent[] = this.events): boolean {",
    replace: "  verify(events: readonly LedgerEvent[] = this.events): boolean {\n    if (true) return true;" },

  { id: "MUT-22", control: "free-text polarity conflicts are visible",
    file: "src/memoryFabric.ts",
    find: "      statementPolarity(m.statement)!==candidatePolarity &&",
    replace: "      false &&" },

  { id: "MUT-24", control: "caller-supplied trust fields are refused, not ignored",
    file: "src/trustBoundary.ts",
    find: "  if (found.length) throw new TrustBoundaryViolation(label, found);", replace: "  return;" },

  { id: "MUT-23", control: "the forgeable approval recorders stay retired",
    file: "src/memoryFabric.ts",
    find: "    throw new Error(\"recordApproval_retired_use_signed_SuperUserApproval\");",
    replace: "    return \"evt_forged\" as never;" },
];

function run() {
  try {
    execFileSync(tsc, ["-p", "tsconfig.json"], { cwd: root, stdio: "pipe" });
  } catch {
    return "NO_COMPILE";
  }
  // Explicit file list: the directory form also sweeps in shared helpers, which
  // define no tests and fail the run for the wrong reason.
  const files = readdirSync(join(root, "dist", "tests"))
    .filter(f => f.endsWith(".test.js"))
    .map(f => join("dist", "tests", f));
  try {
    execFileSync(process.execPath, ["--test", ...files], { cwd: root, stdio: "pipe" });
    return "PASS";
  } catch {
    return "FAIL";
  }
}

console.log("baseline: verifying the unmutated suite passes ...");
if (run() !== "PASS") {
  console.error("baseline is not green; mutation testing would be meaningless.");
  process.exit(2);
}
console.log("baseline green.\n");

const results = [];
for (const m of MUTATIONS) {
  // A mutation may edit more than one file: some controls only become reachable
  // once the control shadowing them is also removed.
  const edits = m.edits ?? [{ file: m.file, find: m.find, replace: m.replace }];
  const originals = edits.map(e => ({ path: join(root, e.file), text: readFileSync(join(root, e.file), "utf8") }));
  const missing = edits.find((e, i) => !originals[i].text.includes(e.find));
  if (missing) {
    results.push({ ...m, status: "NOT_APPLIED" });
    console.log(`${m.id}  NOT APPLIED         anchor missing in ${missing.file}`);
    continue;
  }
  edits.forEach((e, i) => writeFileSync(originals[i].path, originals[i].text.replace(e.find, e.replace)));
  let outcome;
  try { outcome = run(); } finally { originals.forEach(o => writeFileSync(o.path, o.text)); }

  // A mutation the type system rejects is still a killed mutation -- the
  // compiler is a control too -- but it is reported separately so the signal
  // from the test suite stays legible.
  const status = outcome === "FAIL" ? "KILLED"
    : outcome === "NO_COMPILE" ? "KILLED_BY_TYPECHECK"
    : "SURVIVED";
  results.push({ id: m.id, control: m.control, file: m.file ?? (m.edits?.[0]?.file ?? "multi"), status });
  console.log(`${m.id}  ${status.padEnd(19)} ${m.control}`);
}

const killed = results.filter(r => r.status.startsWith("KILLED")).length;
const rate = (killed / results.length) * 100;
console.log(`\nconstitutional mutation kill rate: ${killed}/${results.length} (${rate.toFixed(1)}%)`);

writeFileSync(join(root, "MUTATION_RESULTS.json"), `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  total: results.length, killed, killRate: rate, requiredKillRate: 100,
  pass: killed === results.length,
  results: results.map(({ id, control, file, status }) => ({ id, control, file, status })),
}, null, 2)}\n`);

process.exit(killed === results.length ? 0 : 1);
