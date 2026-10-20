"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { createPost } from "@/actions/posts";
import { Avatar } from "@/components/avatar";
import { toast } from "@/components/toaster";
import { Button } from "@/components/ui/button";
import { ACCEPTED_TYPES, prepareImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LIMITS } from "@/lib/validation";

type Photo = {
  key: string;
  previewUrl: string;
  status: "uploading" | "ready" | "error";
  path?: string;
  w?: number;
  h?: number;
  alt: string;
  error?: string;
};

export function Composer({
  viewer,
  replyToId,
  autoFocus = false,
  placeholder = "What's growing?",
}: {
  viewer: { id: string; displayName: string; avatarPath: string | null };
  replyToId?: string;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);
  const textareaId = useId();
  const errorId = useId();

  // Revoke preview URLs on unmount.
  const previews = useRef(new Set<string>());
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  const remaining = LIMITS.postBody - body.length;
  const uploading = photos.some((p) => p.status === "uploading");
  const readyPhotos = photos.filter((p) => p.status === "ready");
  const canPost = !pending && !uploading && remaining >= 0 && (body.trim().length > 0 || readyPhotos.length > 0);

  async function addFiles(files: FileList | null) {
    if (!files) return;
    const room = LIMITS.photosPerPost - photos.length;
    const picked = Array.from(files).slice(0, room);
    if (files.length > room) setError(`You can add up to ${LIMITS.photosPerPost} photos per post.`);
    const supabase = createClient();

    for (const file of picked) {
      const key = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      previews.current.add(previewUrl);
      setPhotos((all) => [...all, { key, previewUrl, status: "uploading", alt: "" }]);
      try {
        const prepared = await prepareImage(file);
        const path = `${viewer.id}/${crypto.randomUUID()}.webp`;
        const { error: uploadError } = await supabase.storage
          .from("post-media")
          .upload(path, prepared.blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
        if (uploadError) throw new Error("Upload failed. Check your connection and try again.");
        setPhotos((all) =>
          all.map((p) => (p.key === key ? { ...p, status: "ready", path, w: prepared.w, h: prepared.h } : p)),
        );
      } catch (e) {
        setPhotos((all) =>
          all.map((p) => (p.key === key ? { ...p, status: "error", error: (e as Error).message } : p)),
        );
      }
    }
  }

  function removePhoto(key: string) {
    const photo = photos.find((p) => p.key === key);
    setPhotos((all) => all.filter((p) => p.key !== key));
    if (photo?.path) void createClient().storage.from("post-media").remove([photo.path]);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!canPost) return;
    setError(undefined);
    startTransition(async () => {
      const result = await createPost({
        body,
        replyToId,
        media: readyPhotos.map((p) => ({ path: p.path!, w: p.w!, h: p.h!, alt: p.alt })),
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setBody("");
      setPhotos([]);
      toast(replyToId ? "Reply posted." : "Posted.");
    });
  }

  return (
    <form onSubmit={submit} className="flex gap-3 border-b border-border px-4 py-4 sm:px-5" aria-label={replyToId ? "Reply" : "New post"}>
      <Avatar path={viewer.avatarPath} name={viewer.displayName} className="mt-1" />
      <div className="min-w-0 flex-1">
        <label htmlFor={textareaId} className="sr-only">
          {replyToId ? "Your reply" : "Your post"}
        </label>
        <textarea
          id={textareaId}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={2}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="field-sizing-content block max-h-80 min-h-14 w-full resize-none bg-transparent pt-2 text-[1.05rem] leading-relaxed placeholder:text-muted focus:outline-none"
        />

        {photos.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {photos.map((p) => (
              <li key={p.key} className="space-y-1.5">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={p.previewUrl} alt="" className={cn("size-full object-cover", p.status !== "ready" && "opacity-50")} />
                  {p.status === "uploading" ? (
                    <span className="absolute inset-x-2 bottom-2 rounded-lg bg-background/80 px-2 py-1 text-xs">Removing metadata & uploading…</span>
                  ) : null}
                  {p.status === "error" ? (
                    <span role="alert" className="absolute inset-x-2 bottom-2 rounded-lg bg-background/90 px-2 py-1 text-xs text-danger">
                      {p.error}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removePhoto(p.key)}
                    aria-label="Remove photo"
                    className="absolute right-1.5 top-1.5 grid size-8 place-items-center rounded-full bg-background/80 text-foreground hover:bg-background"
                  >
                    <X aria-hidden="true" className="size-4" />
                  </button>
                </div>
                {p.status === "ready" ? (
                  <input
                    value={p.alt}
                    maxLength={LIMITS.altText}
                    onChange={(e) =>
                      setPhotos((all) => all.map((x) => (x.key === p.key ? { ...x, alt: e.target.value } : x)))
                    }
                    placeholder="Describe the photo (alt text)"
                    aria-label="Alt text for this photo"
                    className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-xs placeholder:text-muted focus-visible:border-accent focus-visible:outline-none"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {error ? (
          <p id={errorId} role="alert" className="mt-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              multiple
              hidden
              onChange={(e) => {
                void addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={photos.length >= LIMITS.photosPerPost}
              className="grid size-10 place-items-center rounded-full text-accent transition-colors hover:bg-surface-2 disabled:opacity-40"
              aria-label="Add photos"
              title="Add photos (location data is removed)"
            >
              <ImagePlus aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span
              aria-live="polite"
              className={cn("text-sm tabular-nums", remaining < 0 ? "text-danger" : remaining <= 40 ? "text-foreground" : "text-muted")}
            >
              {remaining <= 100 ? remaining : ""}
              <span className="sr-only">{remaining} characters left</span>
            </span>
            <Button type="submit" size="sm" disabled={!canPost}>
              {pending ? "Posting…" : replyToId ? "Reply" : "Post"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
