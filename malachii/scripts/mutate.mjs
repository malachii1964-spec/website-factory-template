#!/usr/bin/env node
/**
 * Constitutional mutation testing (spec section 57).
 *
 * Each mutation deliberately disables one governance control. The suite must
 * FAIL for every one of them. A mutation that survives means the control it
 * disabled is decorative — no test actually depends on it — and the required
 * kill rate is therefore 100%, not "high".
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vitest = join(root, "..", "node_modules", ".bin", "vitest");

/** @type {{id:string,control:string,file:string,find:string,replace:string}[]} */
const MUTATIONS = [
  {
    id: "MUT-01",
    control: "Super-User approval verification",
    file: "src/memory/receipts.ts",
    find: "  verify(receipt: SignedApprovalReceipt, binding: ApprovalBinding): void {",
    replace: "  verify(receipt: SignedApprovalReceipt, binding: ApprovalBinding): void {\n    return;",
  },
  {
    id: "MUT-02",
    control: "imported history does not confer trust",
    file: "src/ledger/replay.ts",
    find: "          effectiveMaturity: \"M0_OBSERVATION\",\n          status: \"active\",\n          historicalStoredMaturity: event.historicalStoredMaturity,\n          legacy: true,",
    replace: "          effectiveMaturity: event.historicalStoredMaturity,\n          status: \"active\",\n          historicalStoredMaturity: event.historicalStoredMaturity,\n          legacy: true,",
  },
  {
    id: "MUT-03",
    control: "independent-root corroboration threshold",
    file: "src/trust/constitution.ts",
    find: "corroborationThreshold: input.corroborationThreshold ?? 2,",
    replace: "corroborationThreshold: input.corroborationThreshold ?? 1,",
  },
  {
    id: "MUT-04",
    control: "unresolved contradictions block promotion",
    file: "src/memory/promotionEngine.ts",
    find: "      if (unresolvedContradictions > 0) {",
    replace: "      if (false) {",
  },
  {
    id: "MUT-05",
    control: "phantom evidence is an error, not a silent skip",
    file: "src/memory/evidence.ts",
    find: "    return evidenceIds.map((id) => this.resolve(id));",
    replace:
      "    return evidenceIds.flatMap((id) => { try { return [this.resolve(id)]; } catch { return []; } });",
  },
  {
    id: "MUT-06",
    control: "reading a memory does not promote it",
    file: "src/memory/fabric.ts",
    find: "    this.#telemetry.set(memoryId, next);\n    this.#save();",
    replace:
      "    this.#telemetry.set(memoryId, next);\n    const r = this.#records.get(memoryId);\n    if (r) this.#records.set(memoryId, { ...r, storedMaturity: \"M1_CANDIDATE\" });\n    this.#save();",
  },
  {
    id: "MUT-07",
    control: "global scope is not a wildcard",
    file: "src/retrieval/retrieval.ts",
    find: "    if (scope === GLOBAL_SCOPE) return includeGlobal && context.mayReadGlobal;",
    replace: "    if (scope === GLOBAL_SCOPE) return true;",
  },
  {
    id: "MUT-08",
    control: "blank query rejection",
    file: "src/retrieval/retrieval.ts",
    find: "  if (query.query.trim().length === 0) {",
    replace: "  if (false) {",
  },
  {
    id: "MUT-09",
    control: "revoked memory is unreachable",
    file: "src/memory/types.ts",
    find: "export const NON_RETRIEVABLE_STATUSES: ReadonlySet<MemoryStatus> = new Set([\n  \"quarantined\",\n  \"archived\",\n  \"revoked\",\n]);",
    replace: "export const NON_RETRIEVABLE_STATUSES: ReadonlySet<MemoryStatus> = new Set([]);",
  },
  {
    id: "MUT-10",
    control: "startup reconciliation detects divergence",
    file: "src/memory/fabric.ts",
    find: "    if (touched.length === 0)",
    replace: "    if (true)",
  },
  {
    id: "MUT-11",
    control: "a request cannot widen authenticated authority",
    file: "src/trust/authority.ts",
    find: "    if (widened.length > 0) {",
    replace: "    if (false) {",
  },
  {
    id: "MUT-12",
    control: "caller-supplied trust fields are rejected",
    file: "src/trust/forbiddenFields.ts",
    find: "export function assertNoTrustBearingFields(payload: unknown, label = \"request\"): void {",
    replace:
      "export function assertNoTrustBearingFields(payload: unknown, label = \"request\"): void {\n  return;",
  },
  {
    id: "MUT-13",
    control: "promotion advances exactly one level",
    file: "src/memory/promotionEngine.ts",
    find: "    if (targetRank !== currentRank + 1) {",
    replace: "    if (targetRank <= currentRank) {",
  },
  {
    id: "MUT-14",
    control: "outcome receipt signature verification",
    file: "src/memory/receipts.ts",
    find: "  verify(receipt: SignedOutcomeReceipt): void {",
    replace: "  verify(receipt: SignedOutcomeReceipt): void {\n    return;",
  },
  {
    id: "MUT-15",
    control: "ledger hash-chain integrity",
    file: "src/ledger/ledger.ts",
    find: "  verifyIntegrity(): void {",
    replace: "  verifyIntegrity(): void {\n    return;",
  },
  {
    id: "MUT-16",
    control: "a torn ledger tail is repaired on disk, not merely skipped",
    file: "src/ledger/persistence.ts",
    find: "    if (load.truncatedTail) {",
    replace: "    if (false) {",
  },
  {
    id: "MUT-17",
    control: "an unparseable ledger line is corruption, not a torn tail",
    file: "src/ledger/persistence.ts",
    find: "        throw new LedgerIntegrityError(`unparseable ledger record at line ${index + 1}`);",
    replace: "        return;",
  },
  {
    id: "MUT-18",
    control: "cache records the ledger never saw are discarded",
    file: "src/memory/fabric.ts",
    find: "        orphaned.push(memoryId);",
    replace: "        continue;",
  },
  {
    id: "MUT-19",
    control: "records missing from the cache are restored from the ledger",
    file: "src/memory/fabric.ts",
    find: "      if (!this.#records.has(memoryId)) missing.push(memoryId);",
    replace: "      if (false) missing.push(memoryId);",
  },
  {
    id: "MUT-20",
    control: "the whole record is compared to the ledger, not just its maturity",
    file: "src/memory/fabric.ts",
    find: "      if (canonicalize(truth.record) !== canonicalize(record)) divergent.push(memoryId);",
    replace: "      if (truth.effectiveMaturity !== record.storedMaturity) divergent.push(memoryId);",
  },
];

function suitePasses() {
  try {
    execFileSync(vitest, ["run", "--reporter=dot"], { cwd: root, stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

console.log("baseline: verifying the unmutated suite passes ...");
if (!suitePasses()) {
  console.error("baseline suite is red; fix that before mutation testing means anything.");
  process.exit(2);
}
console.log("baseline green.\n");

const results = [];
for (const mutation of MUTATIONS) {
  const path = join(root, mutation.file);
  const original = readFileSync(path, "utf8");
  if (!original.includes(mutation.find)) {
    results.push({ ...mutation, status: "NOT_APPLIED" });
    console.log(`${mutation.id}  NOT APPLIED  (anchor missing in ${mutation.file})`);
    continue;
  }
  writeFileSync(path, original.replace(mutation.find, mutation.replace));
  let killed;
  try {
    killed = !suitePasses();
  } finally {
    writeFileSync(path, original);
  }
  results.push({ ...mutation, status: killed ? "KILLED" : "SURVIVED" });
  console.log(`${mutation.id}  ${killed ? "KILLED  " : "SURVIVED"}  ${mutation.control}`);
}

const killed = results.filter((r) => r.status === "KILLED").length;
const rate = (killed / results.length) * 100;
console.log(`\nconstitutional mutation kill rate: ${killed}/${results.length} (${rate.toFixed(1)}%)`);

writeFileSync(
  join(root, "MUTATION_RESULTS.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: results.length,
      killed,
      killRate: rate,
      requiredKillRate: 100,
      pass: killed === results.length,
      results: results.map(({ id, control, file, status }) => ({ id, control, file, status })),
    },
    null,
    2,
  )}\n`,
);

process.exit(killed === results.length ? 0 : 1);
