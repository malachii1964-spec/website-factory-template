"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOwnProfile } from "@/lib/social-profiles";

export function ProfileSettingsForm({
  initialHandle,
  initialBio,
  initialLocation,
}: {
  initialHandle: string;
  initialBio: string;
  initialLocation: string;
}) {
  const router = useRouter();
  const [handle, setHandle] = useState(initialHandle);
  const [bio, setBio] = useState(initialBio);
  const [location, setLocation] = useState(initialLocation);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateOwnProfile({ handle, bio, location });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass iris-border mt-8 rounded-3xl p-6 sm:p-8"
    >
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
          Handle
        </span>
        <div className="mt-2 flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-3">
          <span className="text-frost-dim">@</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            maxLength={20}
            pattern="[a-z0-9_]{3,20}"
            className="min-w-0 flex-1 bg-transparent text-frost focus:outline-none"
          />
        </div>
        <p className="mt-1 text-xs text-frost-dim">
          3-20 characters: lowercase letters, digits, underscore.
        </p>
      </label>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
          Bio
        </span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={280}
          rows={3}
          placeholder="Living soil, WNY, 3 tents running..."
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-frost placeholder:text-frost-dim/60 focus:border-iris focus:outline-none"
        />
      </label>

      <label className="mt-4 block">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
          Location (optional)
        </span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={80}
          placeholder="Western New York"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-frost placeholder:text-frost-dim/60 focus:border-iris focus:outline-none"
        />
      </label>

      {error && (
        <p className="mt-4 rounded-xl bg-magenta/10 p-3 text-sm text-magenta">
          {error}
        </p>
      )}
      {saved && <p className="mt-4 text-sm text-lime">Saved.</p>}

      <button
        type="submit"
        disabled={isPending}
        className="btn-iris mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
