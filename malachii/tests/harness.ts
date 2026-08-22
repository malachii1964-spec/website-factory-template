import { generateSigningKeyPair, type KeyPair } from "../src/crypto/signing";
import { EventLedger } from "../src/ledger/ledger";
import {
  EvidenceResolver,
  EvidenceStore,
  SourceRegistry,
  type EvidenceKind,
} from "../src/memory/evidence";
import { MemoryFabric } from "../src/memory/fabric";
import { PromotionEngine } from "../src/memory/promotionEngine";
import {
  ApprovalVerifier,
  NonceLedger,
  OutcomeVerifier,
  WorkerKeyRegistry,
  signApprovalReceipt,
  signOutcomeReceipt,
  type ApprovalReceiptBody,
  type OutcomeReceiptBody,
  type SignedApprovalReceipt,
  type SignedOutcomeReceipt,
} from "../src/memory/receipts";
import {
  deriveSecurityContext,
  PrincipalRegistry,
  type SecurityContext,
} from "../src/trust/authority";
import { defineConstitution } from "../src/trust/constitution";
import type { Maturity } from "../src/memory/types";

export const ALL_SCOPES = [
  "memory.create",
  "memory.import",
  "memory.promote",
  "memory.lifecycle",
  "memory.retrieve",
  "memory.list",
  "project.alpha",
  "project.beta",
] as const;

export interface Harness {
  readonly ledger: EventLedger;
  readonly fabric: MemoryFabric;
  readonly evidence: EvidenceStore;
  readonly sources: SourceRegistry;
  readonly resolver: EvidenceResolver;
  readonly workers: WorkerKeyRegistry;
  readonly nonces: NonceLedger;
  readonly rootKey: KeyPair;
  readonly workerA: KeyPair;
  readonly workerB: KeyPair;
  readonly root: SecurityContext;
  readonly operator: SecurityContext;
  readonly agent: SecurityContext;
  now(): number;
  setNow(t: number): void;
  putEvidence(id: string, sourceId: string, kind?: EvidenceKind, content?: string): void;
  registerSource(sourceId: string, derivedFrom?: string): void;
  outcome(
    kind: SignedOutcomeReceipt["kind"],
    signer: KeyPair,
    overrides?: Partial<OutcomeReceiptBody>,
  ): SignedOutcomeReceipt;
  approval(
    memoryId: string,
    objectHash: string,
    targetState: Maturity,
    overrides?: Partial<ApprovalReceiptBody>,
    signer?: KeyPair,
  ): SignedApprovalReceipt;
}

export function makeHarness(): Harness {
  let clock = 1_700_000_000_000;
  const now = () => clock;

  const rootKey = generateSigningKeyPair();
  const workerA = generateSigningKeyPair();
  const workerB = generateSigningKeyPair();

  const constitution = defineConstitution({ rootPublicKeys: [rootKey.publicKey] });
  const nonces = new NonceLedger();
  const workers = new WorkerKeyRegistry();
  workers.register(workerA.publicKey);
  workers.register(workerB.publicKey);

  const evidence = new EvidenceStore();
  const sources = new SourceRegistry();
  const resolver = new EvidenceResolver(evidence, sources);

  const approvals = new ApprovalVerifier(constitution, nonces, now);
  const outcomes = new OutcomeVerifier(workers);
  const engine = new PromotionEngine(constitution, resolver, approvals, outcomes);

  const ledger = new EventLedger(now);
  const fabric = new MemoryFabric(ledger, engine, now);

  const principals = new PrincipalRegistry();
  principals.register({
    principalId: "malachi",
    role: "root",
    credential: "root-credential-0001",
    grantedScopes: ALL_SCOPES,
    mayReadGlobal: true,
  });
  principals.register({
    principalId: "operator-1",
    role: "operator",
    credential: "operator-credential-0001",
    grantedScopes: ALL_SCOPES,
    mayReadGlobal: false,
  });
  principals.register({
    principalId: "agent-1",
    role: "agent",
    credential: "agent-credential-0001",
    grantedScopes: ["memory.create", "memory.retrieve", "project.alpha"],
    mayReadGlobal: false,
  });

  let counter = 0;

  return {
    ledger,
    fabric,
    evidence,
    sources,
    resolver,
    workers,
    nonces,
    rootKey,
    workerA,
    workerB,
    root: deriveSecurityContext(principals.authenticate("root-credential-0001")),
    operator: deriveSecurityContext(principals.authenticate("operator-credential-0001")),
    agent: deriveSecurityContext(principals.authenticate("agent-credential-0001")),
    now,
    setNow(t) {
      clock = t;
    },
    registerSource(sourceId, derivedFrom) {
      sources.register(derivedFrom === undefined ? { sourceId } : { sourceId, derivedFrom });
    },
    putEvidence(id, sourceId, kind = "artifact", content = `content-of-${id}`) {
      if (!sources.has(sourceId)) sources.register({ sourceId });
      evidence.put({ evidenceId: id, kind, content, sourceId, createdAt: now() });
    },
    outcome(kind, signer, overrides: Partial<OutcomeReceiptBody> = {}) {
      counter += 1;
      return signOutcomeReceipt(
        {
          receiptId: `rcpt_${counter}`,
          kind,
          objectiveId: "obj_1",
          workOrderId: "wo_1",
          executionId: `exec_${counter}`,
          workerId: "worker",
          result: "success",
          outputHash: "0".repeat(64),
          evidenceIds: ["ev_out"],
          timestamp: now(),
          signerFingerprint: signer.fingerprint,
          ...overrides,
        },
        signer.privateKey,
      );
    },
    approval(memoryId, objectHash, targetState, overrides: Partial<ApprovalReceiptBody> = {}, signer = rootKey) {
      counter += 1;
      return signApprovalReceipt(
        {
          version: 1,
          approvalId: `apr_${counter}`,
          action: "memory.promote",
          resourceId: memoryId,
          targetState,
          scope: "constitutional",
          objectHash,
          nonce: `nonce_${counter}_${Math.random().toString(36).slice(2)}`,
          issuedAt: now(),
          expiresAt: now() + 60_000,
          signerFingerprint: signer.fingerprint,
          ...overrides,
        },
        signer.privateKey,
      );
    },
  };
}
