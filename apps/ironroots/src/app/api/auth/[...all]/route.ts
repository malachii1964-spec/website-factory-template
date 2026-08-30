import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

function notConfigured() {
  return NextResponse.json(
    {
      error:
        "Accounts aren't connected yet. Add DATABASE_URL to your environment to enable sign-in.",
      code: "auth_not_configured",
    },
    { status: 503 },
  );
}

const handlers = auth ? toNextJsHandler(auth.handler) : null;

export const GET = handlers ? handlers.GET : notConfigured;
export const POST = handlers ? handlers.POST : notConfigured;
