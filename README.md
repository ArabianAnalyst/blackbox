# blackbox

A tamper-evident flight recorder for AI agents. Record every action an agent takes to a hash-chained log you can prove was not altered afterward. Zero dependencies.

Purse enforces what an agent may spend. blackbox records what any agent action did.

## Why not just log?

Two things a plain log cannot do:

1. **Prove integrity.** blackbox hash-chains every record. Edit, insert, delete or reorder anything and `verify()` tells you the exact record where the chain broke.
2. **Catch silent failures.** blackbox records every attempt with its outcome, latency and cost, not just the errors. The ok-but-wrong result and the slow cost creep leave a trace instead of vanishing.

## Install

```bash
npm install @olurabian/blackbox
```

## Use

```ts
import { createRecorder, JsonlStore } from "@olurabian/blackbox";

const rec = createRecorder({ store: new JsonlStore("agent.jsonl") });

// wrap any action: latency and success/failure captured automatically
const out = await rec.wrap("charge-card", { amount: 20 }, () => chargeCard(20));

// or record directly
rec.record({ action: "send-email", outcome: "ok", latencyMs: 120, cost: 0.002 });

// prove the log was not touched
rec.verify();   // { ok: true }  or  { ok: false, brokenAt, reason }

rec.query({ outcome: "error" });
```

## Tamper detection

`verify()` walks the chain. Change one field and it fails at that record:

```
verify() on the untouched log: { ok: true }
verify() after editing a record: { ok: false, brokenAt: 'id-1', reason: 'record hash does not match its contents' }
```

Run the demo: `npm run demo`.

## API

- `createRecorder({ store })` -> `{ record, wrap, query, all, verify }`
- `MemoryStore` / `JsonlStore(path)` — pluggable, or implement the `Store` interface yourself
- `verifyChain(records)` — verify a raw array of records

## License

MIT
