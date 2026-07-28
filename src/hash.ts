import { createHash } from "node:crypto";
import type { ActionRecord, VerifyResult } from "./types";

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

// Walk the chain: each record's stored hash must match a recompute of its
// contents, and each prevHash must equal the previous record's hash. Any
// edit, insertion, deletion, or reorder breaks one of those and is reported.
export function verifyChain(records: ActionRecord[]): VerifyResult {
  let prev = GENESIS;
  for (const rec of records) {
    if (rec.prevHash !== prev) {
      return { ok: false, brokenAt: rec.id, reason: "prevHash does not match previous record" };
    }
    const { hash, ...rest } = rec;
    if (hashRecord(rest) !== hash) {
      return { ok: false, brokenAt: rec.id, reason: "record hash does not match its contents" };
    }
    prev = rec.hash;
  }
  return { ok: true };
}
