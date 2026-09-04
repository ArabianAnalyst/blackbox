import type { Receipt, Store as ReceiptStore, VerifyResult as ReceiptVerifyResult } from "@olurabian/receipt";

// The unit of spend/outcome for a single agent action.
export type Outcome = "ok" | "error" | "blocked";

/** The payload of a blackbox action receipt, the `payload` of an @olurabian/receipt envelope. */
export interface ActionPayload {
  action: string;
  input?: unknown;
  outcome: Outcome;
  error?: string;
  latencyMs?: number;
  cost?: number;
  meta?: Record<string, unknown>;
}

/**
 * A committed record: a Deadlatch receipt of kind "action". The action fields
 * live under `payload`; `prevHash` and `hash` are on the envelope and together
 * form a tamper-evident chain.
 */
export type ActionRecord = Receipt<ActionPayload>;

// The caller-owned fields for record(). The recorder assigns id/ts/prevHash/hash.
export type RecordInput = ActionPayload;

// A pluggable append-only store.
export type Store = ReceiptStore<ActionPayload>;

export type VerifyResult = ReceiptVerifyResult;

export interface Query {
  action?: string;
  outcome?: Outcome;
}
