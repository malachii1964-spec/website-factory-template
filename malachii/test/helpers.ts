import { loadConfig } from "../src/core/config.ts";
import { openBrain } from "../src/core/db.ts";
import { LocalEmbedder } from "../src/memory/embed.ts";
import { MemoryStore } from "../src/memory/store.ts";

/** A throwaway brain in RAM. No files, no key, no network. */
export function testStore(): MemoryStore {
  const config = { ...loadConfig(), dbPath: ":memory:" };
  return new MemoryStore(openBrain(":memory:"), new LocalEmbedder(), config);
}
