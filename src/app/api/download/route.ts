import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  verifyDownloadToken,
  downloadFileName,
  storageKey,
} from "@/lib/downloads";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing download token." }, { status: 400 });
  }

  const valid = verifyDownloadToken(token);
  if (!valid) {
    return NextResponse.json(
      { error: "This download link is invalid or has expired. Check your email for the latest link, or contact support." },
      { status: 403 },
    );
  }

  const key = storageKey(valid.slug);

  // Preferred: a private bucket. The token gate already authorized the request.
  const bucket = process.env.DOWNLOAD_STORAGE_URL;
  if (bucket) {
    return NextResponse.redirect(`${bucket.replace(/\/$/, "")}/${key}`);
  }

  // Fallback: a private local directory (self-hosted / files committed privately).
  const dir = process.env.DOWNLOADS_DIR || path.join(process.cwd(), "private", "downloads");
  try {
    const file = await readFile(path.join(dir, key));
    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${downloadFileName(valid.slug)}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Your purchase is confirmed, but this file hasn't been uploaded yet. Please contact support and we'll send it right over." },
      { status: 404 },
    );
  }
}
