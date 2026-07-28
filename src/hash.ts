import { createHash } from "node:crypto";
import type { ActionRecord } from "./types";

export const GENESIS = "0".repeat(64);

// Deterministic SHA-256 over every field except `hash` itself. Undefined
// fields are omitted by JSON.stringify, so optional fields do not shift the
// hash of records that never set them.
export function hashRecord(rec: Omit<ActionRecord, "hash">): string {
  const payload = JSON.stringify({
    id: rec.id,
    ts: rec.ts,
    action: rec.action,
    input: rec.input,
    outcome: rec.outcome,
    error: rec.error,
    latencyMs: rec.latencyMs,
    cost: rec.cost,
    meta: rec.meta,
    prevHash: rec.prevHash,
  });
  return createHash("sha256").update(payload).digest("hex");
}
