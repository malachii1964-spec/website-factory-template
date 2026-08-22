import { createHash } from "node:crypto";
import { canonicalize } from "./canonical";

/** Hash of arbitrary text. Used for raw artefact content. */
export function sha256Text(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

/** Hash of a structured value via its canonical form. */
export function sha256Object(value: unknown): string {
  return sha256Text(canonicalize(value));
}
