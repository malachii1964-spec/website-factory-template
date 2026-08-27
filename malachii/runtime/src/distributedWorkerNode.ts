import { WorkerDaemonServer, type ExecutionAdapter, type ExecutionStep } from "./index.js";

const workerId=process.env.MALACHII_WORKER_ID??"worker";
const secret=process.env.MALACHII_WORKER_SECRET??"";
if(!secret)throw new Error("MALACHII_WORKER_SECRET_required");
const mode=process.env.MALACHII_WORKER_MODE??"ok";
const adapter:ExecutionAdapter={id:`inner.${workerId}`,capabilities:["distributed.compute"],async execute(step:ExecutionStep){if(mode==="fail")throw new Error("configured_worker_failure");const value=String((step.input as any)?.value??"");return {output:{workerId,value,length:value.length},evidenceIds:[`worker-compute:${workerId}:${value.length}`]};}};
const server=new WorkerDaemonServer({workerId,secret,adapters:[adapter],scopes:["public"],allowedDataScopes:["public"],tags:["distributed-process"]});
const endpoint=await server.start();
console.log(JSON.stringify({schema:"malachii.worker.ready.v1",workerId,endpoint,capabilities:server.capabilities}));
const shutdown=async()=>{await server.close();process.exit(0);};
process.on("SIGTERM",()=>{void shutdown();});process.on("SIGINT",()=>{void shutdown();});
