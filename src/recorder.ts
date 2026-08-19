import { randomUUID } from "node:crypto";
import { hashRecord, verifyChain } from "./hash.js";
import type { ActionRecord, RecordInput, Store, Query, VerifyResult } from "./types.js";

export interface RecorderOptions {
  store: Store;
  now?: () => string;   // injectable clock (tests inject a fixed value)
  newId?: () => string; // injectable id (tests inject a fixed sequence)
}

export interface Recorder {
  record(entry: RecordInput): ActionRecord;
  wrap<T>(action: string, input: unknown, fn: () => T | Promise<T>): Promise<T>;
  query(q: Query): ActionRecord[];
  all(): ActionRecord[];
  verify(): VerifyResult;
}

export function createRecorder(opts: RecorderOptions): Recorder {
  const { store } = opts;
  const now = opts.now ?? (() => new Date().toISOString());
  const newId = opts.newId ?? (() => randomUUID());

  function record(entry: RecordInput): ActionRecord {
    const base: Omit<ActionRecord, "hash"> = {
      id: newId(),
      ts: now(),
      action: entry.action,
      input: entry.input,
      outcome: entry.outcome,
      error: entry.error,
      latencyMs: entry.latencyMs,
      cost: entry.cost,
      meta: entry.meta,
      prevHash: store.lastHash(),
    };
    const rec: ActionRecord = { ...base, hash: hashRecord(base) };
    store.append(rec);
    return rec;
  }

  async function wrap<T>(action: string, input: unknown, fn: () => T | Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      record({ action, input, outcome: "ok", latencyMs: Date.now() - start });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      record({ action, input, outcome: "error", error: message, latencyMs: Date.now() - start });
      throw err;
    }
  }

  function query(q: Query): ActionRecord[] {
    return store.all().filter((r) =>
      (q.action === undefined || r.action === q.action) &&
      (q.outcome === undefined || r.outcome === q.outcome)
    );
  }

  function all(): ActionRecord[] {
    return store.all();
  }

  function verify(): VerifyResult {
    return verifyChain(store.all());
  }

  return { record, wrap, query, all, verify };
}
