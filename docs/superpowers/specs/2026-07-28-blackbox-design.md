# blackbox — design spec

**Date:** 2026-07-28
**Package:** `@olurabian/blackbox`
**Status:** approved design, pre-implementation
**Sibling:** `@olurabian/purse` (this reuses Purse's proven hash-chain audit pattern, generalised)

## Overview

blackbox is a standalone, zero-dependency TypeScript library that records what an AI agent actually did. Every action is written to a tamper-evident, hash-chained log, so you can prove after the fact that the record was not altered, and so the silent failures (ok-but-wrong outcomes, cost drift, latency creep) leave a trace instead of vanishing.

The flight recorder for agents. Purse enforces what an agent may spend. blackbox records what any agent action did.

## Problem it solves

Most teams "log" agent behaviour with ordinary application logs. Two failures follow:
1. **No integrity.** A plain log can be edited, truncated, or partially written, and you cannot prove it wasn't. When an agent does something costly or wrong, "the logs" are evidence only if nobody could have touched them.
2. **Silent failures leave nothing.** An agent that returns a 200 with the wrong shape, retries a small wrong action, or slowly gets more expensive throws no error. If you only log errors, you log nothing when it matters most.

blackbox records **every attempt** (ok, error, blocked) with outcome, latency and cost, and hash-chains the records so tampering is detectable.

## Non-goals (v1)

Explicitly out of scope for the first version, noted so we don't build them:
- Drift / anomaly detection (the "this action used to succeed" signal). Phase 2.
- Remote sinks (HTTP, OpenTelemetry export). Phase 2.
- A Purse adapter so Purse emits into blackbox. Phase 2.
- A CLI to inspect a log. Phase 2.
- Redaction / PII scrubbing helpers. Phase 2 (callers control what they put in `input`/`meta` for now).

## The record

```ts
type Outcome = "ok" | "error" | "blocked";

interface ActionRecord {
  id: string;            // uuid v4
  ts: string;            // ISO 8601 timestamp
  action: string;        // action name, e.g. "charge-card"
  input?: unknown;       // optional, caller-supplied summary of the input (keep small)
  outcome: Outcome;
  error?: string;        // present when outcome === "error"
  latencyMs?: number;    // measured automatically by wrap()
  cost?: number;         // caller-supplied unit of spend (USD, tokens, tx amount)
  meta?: Record<string, unknown>; // arbitrary tags
  prevHash: string;      // hash of the previous record (GENESIS for the first)
  hash: string;          // sha256 over this record's fields + prevHash
}
```

## Integrity model

Same approach Purse already ships and proves:
- `GENESIS = "0".repeat(64)`.
- `hash = sha256(JSON.stringify({ id, ts, action, input, outcome, error, latencyMs, cost, meta, prevHash }))`, computed over every field except `hash` itself.
- Each new record's `prevHash` is the previous record's `hash`.
- `verify()` walks the chain: recompute each record's hash from its own fields, confirm it matches the stored `hash`, and confirm each `prevHash` equals the actual previous record's `hash`. Any edit, insertion, or deletion breaks the chain and is reported with the offending record id.

## Public API (v1)

```ts
import { createRecorder, JsonlStore, MemoryStore } from "@olurabian/blackbox";

const rec = createRecorder({ store: new JsonlStore("agent.jsonl") });

// wrap any action: measures latency, captures ok/error automatically
const out = await rec.wrap("charge-card", { amount: 20 }, () => chargeCard(20));

// record directly (for actions you time yourself, or blocked ones)
rec.record({ action: "send-email", outcome: "ok", latencyMs: 120, cost: 0.002 });

// integrity
rec.verify();            // { ok: true } | { ok: false, brokenAt: string, reason: string }

// read
rec.all();               // ActionRecord[]
rec.query({ action: "charge-card", outcome: "error" }); // filtered
```

`record(entry)` takes only the caller-owned fields — `{ action, input?, outcome, error?, latencyMs?, cost?, meta? }` — and the recorder assigns `id`, `ts`, `prevHash` (from `store.lastHash()`) and `hash` before appending. Callers never set the chain fields themselves.

`wrap(action, input, fn)`:
- starts a timer, runs `fn`
- on success: records `{ action, input, outcome: "ok", latencyMs }`, returns the result
- on throw: records `{ action, input, outcome: "error", error: message, latencyMs }`, then re-throws (never swallows the caller's error)

## Architecture — four small units

| File | Responsibility | Depends on |
|---|---|---|
| `src/types.ts` | `ActionRecord`, `Outcome`, `Store` interface | nothing |
| `src/hash.ts` | `GENESIS`, `hashRecord()` | `node:crypto`, types |
| `src/store.ts` | `MemoryStore`, `JsonlStore` (append-only, in-memory or file) | `node:fs`, types |
| `src/recorder.ts` | `createRecorder()` → `record` / `wrap` / `verify` / `query` / `all` | hash, types |
| `src/index.ts` | public exports | all |

`Store` interface (mirrors Purse's `AuditStore`):
```ts
interface Store {
  lastHash(): string;      // hash of most recent record, or GENESIS
  append(rec: ActionRecord): void;
  all(): ActionRecord[];
}
```

## Conventions (identical to Purse)

- Zero runtime dependencies. `node:crypto` and `node:fs` only.
- ESM (`"type": "module"`), TypeScript, `tsc` → `dist/`.
- Tests run with `tsx test/*.test.ts`, plain assertions (Node's `assert`), no test framework.
- MIT, Node >=18, `publishConfig.access = public`, scope `@olurabian`.
- Repo: `github.com/ArabianAnalyst/blackbox`.

## File layout

```
blackbox/
  src/       types.ts  hash.ts  store.ts  recorder.ts  index.ts
  test/      hash.test.ts  store.test.ts  recorder.test.ts  verify.test.ts
  examples/  demo.ts
  package.json  tsconfig.json  README.md  LICENSE
```

## Testing plan (TDD)

- **hash.test** — `hashRecord` is deterministic; changing any field changes the hash; GENESIS handling.
- **store.test** — MemoryStore append/all/lastHash; JsonlStore persists to file and reloads identically; empty store returns GENESIS.
- **recorder.test** — `record` sets id/ts/prevHash/hash and chains correctly; `wrap` captures latency and an ok outcome; `wrap` on a throwing fn records `error` + re-throws; `query` filters by action and outcome.
- **verify.test** — a clean chain verifies ok; editing a record's field makes verify fail at that id; deleting a middle record breaks the chain; a reordered record breaks the chain.

## Success criteria

- `npm test` green, all four suites.
- `npm run build` produces `dist/` with types.
- A 20-line `examples/demo.ts` shows wrapping a fake agent action, an induced failure, and a `verify()` that passes, then a hand-tampered record that makes `verify()` fail.
- README leads with the differentiator (provable integrity + every-attempt capture), a 10-second usage block, and the tamper-detection demo output.
