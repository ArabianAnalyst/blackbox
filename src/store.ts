import { MemoryStore as BaseMemoryStore, JsonlStore as BaseJsonlStore } from "@olurabian/receipt";
import type { ActionPayload } from "./types.js";

// In-memory append-only store. lastHash() returns the tip of the chain.
export class MemoryStore extends BaseMemoryStore<ActionPayload> {}

// Persists to an append-only JSONL file, one record per line. Reloads any
// existing file on construction so the chain survives process restarts.
export class JsonlStore extends BaseJsonlStore<ActionPayload> {
  constructor(path: string) {
    super(path);
  }
}
