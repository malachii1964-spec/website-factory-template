import type { CouncilCandidate, CouncilResult, ExecutionMode } from "./types.js";

export interface Worker { id:string; role:string; run(objective:string, context?:string):Promise<CouncilCandidate>; }
export interface Critic { critique(objective:string,candidates:CouncilCandidate[]):Promise<string>; }
export interface Verifier { verify(objective:string,candidates:CouncilCandidate[],critique:string):Promise<string>; }
export interface Arbiter { synthesize(objective:string,candidates:CouncilCandidate[],critique:string,verification:string):Promise<string>; }

export async function runCouncil(mode:ExecutionMode, objective:string, workers:Worker[], critic:Critic, verifier:Verifier, arbiter:Arbiter):Promise<CouncilResult> {
  const candidates=await Promise.all(workers.map(w=>w.run(objective))); // independent first-pass contexts are the adapter's responsibility
  const critique=await critic.critique(objective,candidates);
  const verification=await verifier.verify(objective,candidates,critique);
  const final=await arbiter.synthesize(objective,candidates,critique,verification);
  return {mode,candidates,critique,verification,final};
}
