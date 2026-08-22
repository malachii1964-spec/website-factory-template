/**
 * Runs as a real, separate OS process under plain `node` — no bundler, no test
 * runner, no shared memory with the parent. That is the whole point: a restart
 * test that stays inside one process proves nothing about restarts.
 *
 * Usage: node child.ts <seed|inspect> <directory>
 */
import { generateSigningKeyPair } from "../../src/crypto/signing.ts";
import { openPersistentKernel } from "../../src/kernel.ts";
import { deriveSecurityContext, PrincipalRegistry } from "../../src/trust/authority.ts";

const [, , mode, directory] = process.argv;
if (!mode || !directory) {
  console.error("usage: child.ts <seed|inspect> <directory>");
  process.exit(2);
}

const SCOPES = [
  "memory.create",
  "memory.import",
  "memory.promote",
  "memory.lifecycle",
  "memory.retrieve",
  "memory.list",
  "project.alpha",
];

const principals = new PrincipalRegistry();
principals.register({
  principalId: "malachi",
  role: "root",
  credential: "root-credential-restart",
  grantedScopes: SCOPES,
  mayReadGlobal: true,
});
const root = deriveSecurityContext(principals.authenticate("root-credential-restart"));

// The root key is irrelevant to this test (nothing is promoted to M5), but the
// constitution requires one, so each process mints a throwaway.
const kernel = openPersistentKernel({
  directory,
  rootPublicKeys: [generateSigningKeyPair().publicKey],
});

const startup = kernel.startup();

if (mode === "seed") {
  const { fabric, evidence, sources } = kernel;

  sources.register({ sourceId: "source.a" });
  sources.register({ sourceId: "source.b" });
  for (const [id, sourceId] of [
    ["e1", "source.a"],
    ["e2", "source.b"],
  ] as const) {
    evidence.put({ evidenceId: id, kind: "artifact", content: `content-${id}`, sourceId, createdAt: 1 });
  }

  const keep = fabric.createMemory(root, {
    layer: "semantic",
    statement: "deploys require a signed release receipt",
    scope: "project.alpha",
  });
  const promoted = fabric.createMemory(root, {
    layer: "semantic",
    statement: "retries use exponential backoff",
    scope: "project.alpha",
  });
  const revoked = fabric.createMemory(root, {
    layer: "semantic",
    statement: "the staging token is shared with contractors",
    scope: "project.alpha",
  });

  fabric.promote(root, {
    memoryId: promoted.memoryId,
    targetMaturity: "M1_CANDIDATE",
    evidenceRefIds: ["e1"],
    reason: "one verified source",
  });
  fabric.promote(root, {
    memoryId: promoted.memoryId,
    targetMaturity: "M2_CORROBORATED",
    evidenceRefIds: ["e1", "e2"],
    reason: "two independent roots",
  });
  fabric.transition(root, revoked.memoryId, "revoked", "credential leaked");

  console.log(
    JSON.stringify({
      startup,
      keep: keep.memoryId,
      promoted: promoted.memoryId,
      revoked: revoked.memoryId,
    }),
  );
} else {
  const { fabric } = kernel;
  console.log(
    JSON.stringify({
      startup,
      records: fabric
        .records()
        .map((r) => ({
          memoryId: r.memoryId,
          statement: r.statement,
          scope: r.scope,
          storedMaturity: r.storedMaturity,
          effectiveMaturity: fabric.effectiveMaturity(r.memoryId),
          status: r.status,
        }))
        .sort((a, b) => a.memoryId.localeCompare(b.memoryId)),
    }),
  );
}

kernel.close();
