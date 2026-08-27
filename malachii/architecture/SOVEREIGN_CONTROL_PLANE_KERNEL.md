# MALACHII Sovereign Control-Plane Kernel — RC1.4

## RC1.5 placement

RC1.5 retains this Control-Plane Kernel unchanged in architectural authority and adds `LIVE_CONTROL_FABRIC.md` beneath/around it: durable state, health/circuits, governed adapters and live local execution. Statements below that RC1.4 had only A2A/MCP contracts are historical to RC1.4; RC1.5 now includes reference HTTP transports, while real remote interoperability remains unverified.

## Purpose

RC1.4 moves MALACHII from an execution-plane-led reference into a **control-plane-led architecture**. The RC1.3 Autonomous Execution Plane remains intact beneath this layer and performs the raw work. The Control Plane decides what must happen, which governed resource may perform it, whether policy permits it, what actually happened, and whether observed state converges on the authorized objective.

## Core invariant

> **Control decides and reconciles. Execution performs. Evidence reports reality back to control.**

A successful process exit is not equivalent to objective completion.

## Executable vertical slice

`ControlObjectiveSpec -> ControlPlaneRegistry -> Cognitive Route -> Policy Decision -> ExecutionPlan -> Execution Plane -> Evidence Receipts -> Observed State -> Reconciliation -> Quality/Release Decision`

Implemented in `runtime/src/controlPlane.ts`.

## Current controllers / responsibilities

### Objective contract
Typed desired outcome, success criteria, risk tier, quality floor, capability requirements, data scopes, budgets, release policy and verification policy.

### Registry
Registers models/agents/tools/execution planes/skills/data sources as governed resources. A resource carries explicit capability/scope, availability, evidence assurance, trust domain, measured history, data scope, optional workload identity and an execution-adapter binding.

### Cognitive route
Routes by eligibility first, score second. Hard exclusions include:
- unavailable resource
- capability or scope mismatch
- A0/A1/A2 capability assurance
- expired/unusable workload identity
- forbidden data scope
- task cost/latency budget violation
- missing execution binding
- independence collision when two tasks belong to the same independence group

Authorization violations never become a small score penalty.

### Policy controller
Enforces capability/scope/data boundaries and consequence-aware approval before execution. High-impact/external/T3 work fails closed without an explicit approval identifier.

### Independent verification
Tasks may belong to an `independenceGroup`. The router will not silently select the same resource twice inside that group. When independent verification is required, convergence can require a minimum number of distinct independent evidence-producing resources.

### Observed state / reconciliation
The desired state requires:
- successful required execution
- minimum evidence receipts
- minimum independent evidence sources when configured
- every declared required capability actually executed
- measured Quality Floor at or above threshold
- named hard gates true
- release qualification
- explicit objective success-criterion verification

Any gap produces `needs_reconciliation`; an optional repair planner can submit a new governed round.

### Release
External publication is still separately authorized. Excellent quality cannot bypass a missing publish grant.

## Truth boundary

This is a **local executable Control-Plane Kernel reference**. It does not bundle:
- a production distributed consensus store
- SPIFFE/SPIRE
- live A2A networking
- live MCP networking
- a cloud VM/browser fleet
- durable queue/bus infrastructure
- a live provider/model fleet
- the Agent Foundry

A2A and MCP are adapter contracts in RC1.4, not claimed network implementations. Workload identity is a SPIFFE-ready abstraction, not a claim that SPIRE is deployed.

## Target beyond RC1.4

The target architecture remains a **Sovereign Adaptive Cognitive Control Fabric**: distributed governance above an elastic cognitive mesh and multiple execution planes. Dynamic topology and Agent Foundry come only after registry, policy, identity, routing, evidence, observability and reconciliation prove reliable with live adapters.
