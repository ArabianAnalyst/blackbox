// The unit of spend/outcome for a single agent action.
export type Outcome = "ok" | "error" | "blocked";

// A committed record. `prevHash` links to the previous record; `hash` covers
// every other field. Together they form a tamper-evident chain.
export interface ActionRecord {
  id: string;
  ts: string;
  action: string;
  input?: unknown;
  outcome: Outcome;
  error?: string;
  latencyMs?: number;
  cost?: number;
  meta?: Record<string, unknown>;
  prevHash: string;
  hash: string;
}

// The caller-owned fields for record(). The recorder assigns id/ts/prevHash/hash.
export interface RecordInput {
  action: string;
  input?: unknown;
  outcome: Outcome;
  error?: string;
  latencyMs?: number;
  cost?: number;
  meta?: Record<string, unknown>;
}

// A pluggable append-only store.
export interface Store {
  lastHash(): string;
  append(rec: ActionRecord): void;
  all(): ActionRecord[];
}

export interface VerifyResult {
  ok: boolean;
  brokenAt?: string;
  reason?: string;
}

export interface Query {
  action?: string;
  outcome?: Outcome;
}
