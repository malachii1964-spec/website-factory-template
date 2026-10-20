// Opaque keyset cursor for feeds: base64url("<created_at ISO>|<post uuid>").

export type FeedCursor = { at: string; id: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function encodeCursor(cursor: FeedCursor): string {
  return Buffer.from(`${cursor.at}|${cursor.id}`, "utf8").toString("base64url");
}

/** Returns null for anything malformed — never throws on user input. */
export function decodeCursor(value: string | null | undefined): FeedCursor | null {
  if (!value || value.length > 200) return null;
  let decoded: string;
  try {
    decoded = Buffer.from(value, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const [at, id, ...rest] = decoded.split("|");
  if (rest.length > 0 || !at || !id || !UUID.test(id)) return null;
  if (Number.isNaN(Date.parse(at))) return null;
  return { at, id };
}
