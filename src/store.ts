import { appendFileSync, readFileSync, existsSync } from "node:fs";
import { GENESIS } from "./hash";
import type { ActionRecord, Store } from "./types";

// In-memory append-only store. lastHash() returns the tip of the chain.
export class MemoryStore implements Store {
  protected records: ActionRecord[] = [];

  lastHash(): string {
    const last = this.records[this.records.length - 1];
    return last ? last.hash : GENESIS;
  }

  append(rec: ActionRecord): void {
    this.records.push(rec);
  }

  all(): ActionRecord[] {
    return [...this.records];
  }
}

// Persists to an append-only JSONL file, one record per line. Reloads any
// existing file on construction so the chain survives process restarts.
export class JsonlStore extends MemoryStore {
  constructor(private path: string) {
    super();
    if (existsSync(path)) {
      const lines = readFileSync(path, "utf8").split("\n").filter(Boolean);
      this.records = lines.map((l) => JSON.parse(l) as ActionRecord);
    }
  }

  append(rec: ActionRecord): void {
    super.append(rec);
    appendFileSync(this.path, JSON.stringify(rec) + "\n");
  }
}
