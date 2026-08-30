"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AuthForms() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "");

    const result =
      mode === "sign-in"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name });

    setLoading(false);
    if (result.error) {
      setError(result.error.message ?? "Something went wrong. Please try again.");
      return;
    }
    window.location.href = "/account";
  }

  return (
    <div className="panel mx-auto max-w-sm p-6">
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-md bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setMode("sign-in")}
          className={cn(
            "rounded-sm py-2 text-sm font-medium transition-colors",
            mode === "sign-in" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("sign-up")}
          className={cn(
            "rounded-sm py-2 text-sm font-medium transition-colors",
            mode === "sign-up" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground",
          )}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "sign-up" && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-foreground">
              Name
            </label>
            <Input id="name" name="name" type="text" required autoComplete="name" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-500">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={cn(buttonVariants({ size: "lg" }), "mt-1 w-full")}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {mode === "sign-in" ? "Signing in…" : "Creating account…"}
            </>
          ) : mode === "sign-in" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </button>
      </form>
    </div>
  );
}
