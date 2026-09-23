"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { STAGES } from "@/lib/stages";
import { createPost } from "@/lib/social-posts";

type MediaRow = { kind: "photo" | "video"; url: string };

export function PostComposer({ strainNames }: { strainNames: string[] }) {
  const router = useRouter();
  const listId = useId();
  const [body, setBody] = useState("");
  const [stage, setStage] = useState("");
  const [strainName, setStrainName] = useState("");
  const [media, setMedia] = useState<MediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function addMediaRow() {
    if (media.length >= 10) return;
    setMedia((rows) => [...rows, { kind: "photo", url: "" }]);
  }

  function updateMediaRow(index: number, patch: Partial<MediaRow>) {
    setMedia((rows) =>
      rows.map((r, i) => (i === index ? { ...r, ...patch } : r)),
    );
  }

  function removeMediaRow(index: number) {
    setMedia((rows) => rows.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleanMedia = media.filter((m) => m.url.trim().length > 0);
    startTransition(async () => {
      const result = await createPost({
        body,
        stage,
        strainName,
        media: cleanMedia,
      });
      if (result.ok) {
        router.push("/community/feed");
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
          What&apos;s happening with your grow?
        </span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Flipped to 12/12 today, trichomes are just starting to show..."
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 p-4 text-frost placeholder:text-frost-dim/60 focus:border-iris focus:outline-none"
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
            Stage (optional)
          </span>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-frost focus:border-iris focus:outline-none"
          >
            <option value="">No stage</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
            Strain (optional)
          </span>
          <input
            list={listId}
            value={strainName}
            onChange={(e) => setStrainName(e.target.value)}
            maxLength={80}
            placeholder="Wedding Cake"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-frost placeholder:text-frost-dim/60 focus:border-iris focus:outline-none"
          />
          <datalist id={listId}>
            {strainNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </label>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-frost-dim">
            Photos / video (paste a link for now)
          </span>
          <button
            type="button"
            onClick={addMediaRow}
            disabled={media.length >= 10}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-gold disabled:opacity-40"
          >
            + Add
          </button>
        </div>
        <p className="mt-1 text-xs text-frost-dim">
          Direct file uploads are coming soon — for now, paste a link to a photo
          or video you&apos;ve already hosted (e.g. from your phone&apos;s cloud
          photos).
        </p>

        {media.length > 0 && (
          <div className="mt-3 space-y-2">
            {media.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={row.kind}
                  onChange={(e) =>
                    updateMediaRow(i, {
                      kind: e.target.value as "photo" | "video",
                    })
                  }
                  className="shrink-0 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-frost focus:border-iris focus:outline-none"
                >
                  <option value="photo">Photo</option>
                  <option value="video">Video</option>
                </select>
                <input
                  value={row.url}
                  onChange={(e) => updateMediaRow(i, { url: e.target.value })}
                  placeholder="https://..."
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 p-2 text-xs text-frost placeholder:text-frost-dim/60 focus:border-iris focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeMediaRow(i)}
                  className="shrink-0 font-mono text-[10px] uppercase text-magenta"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-xl bg-magenta/10 p-3 text-sm text-magenta">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-iris mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {isPending ? "Posting..." : "Post update"}
      </button>
    </form>
  );
}
