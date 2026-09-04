<div align="center">
  <img src="assets/logo.png" width="118" alt="blackbox" />
  <h1>blackbox</h1>
  <p><b>A tamper-evident record of what your AI agent actually did.</b></p>
  <p>
    <a href="https://www.npmjs.com/package/@olurabian/blackbox"><img src="https://img.shields.io/npm/v/@olurabian/blackbox?style=for-the-badge&label=npm&color=F2B33D" alt="npm version" /></a>
    <img src="https://img.shields.io/badge/dependencies-zero-F2B33D?style=for-the-badge" alt="zero dependencies" />
    <img src="https://img.shields.io/npm/l/@olurabian/blackbox?style=for-the-badge&label=license&color=2E3742" alt="MIT license" />
    <a href="https://github.com/ArabianAnalyst/blackbox/actions"><img src="https://img.shields.io/github/actions/workflow/status/ArabianAnalyst/blackbox/ci.yml?style=for-the-badge&label=build&branch=main" alt="build status" /></a>
  </p>
  <p><sub>Part of <a href="https://deadlatch.dev"><b>Deadlatch</b></a> &nbsp;·&nbsp; enforce &nbsp;·&nbsp; <b>prove</b> &nbsp;·&nbsp; watch</sub></p>
</div>

A tamper-evident flight recorder for AI agents. Record every action an agent takes to a hash-chained log you can prove was not altered afterward. Zero dependencies.

Purse enforces what an agent may spend. blackbox records what any agent action did.

**[Try the interactive demo](https://arabiananalyst.github.io/blackbox/demo/).** Click any value, tamper with it, and watch `verify()` break the chain at that exact record. Real SHA-256, running in your browser, the same logic as the package. The source lives in [`demo/`](demo/index.html), and the same demo is the hero of [olurabian.com/blackbox](https://www.olurabian.com/blackbox).

## Why not just log?

Two things a plain log cannot do:

1. **Prove integrity.** blackbox hash-chains every record. Edit, insert, delete or reorder anything and `verify()` tells you the exact record where the chain broke. Truncation at the tail is the one edit a chain cannot detect on its own. That is what an outside witness anchoring the chain head is for.
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
rec.verify();   // { ok: true }  or  { ok: false, brokenAt, id, reason }

rec.query({ outcome: "error" });
```

## Tamper detection

`verify()` walks the chain. Change one field and it fails at that record:

```
verify() on the untouched log: { ok: true }
verify() after editing a record: { ok: false, brokenAt: 0, id: 'id-1', reason: 'hash mismatch (a record was altered)' }
```

Two ways to see it. The browser demo at [arabiananalyst.github.io/blackbox/demo](https://arabiananalyst.github.io/blackbox/demo/) lets you tamper by clicking any value. The CLI version runs with `npm run demo`.

## Postgres

The recorder takes any receipt store. This needs `@olurabian/receipt` 0.2 or newer installed alongside blackbox. For Postgres, open a `PostgresStore` from `@olurabian/receipt` and pass it in. Call `store.flush()` before the process exits.

```js
import pg from "pg";
import { PostgresStore } from "@olurabian/receipt";
import { createRecorder } from "@olurabian/blackbox";

const store = await PostgresStore.open(new pg.Pool({ connectionString: process.env.DATABASE_URL }), { stream: "blackbox" });
const rec = createRecorder({ store });
rec.record({ action: "ping", outcome: "ok" });
await store.flush();
```

## The receipt

Every record is a [Deadlatch receipt](https://github.com/ArabianAnalyst/receipt), `{ id, ts, kind: "action", payload, prevHash, hash }`. The action fields (`action`, `outcome`, `latencyMs`, `cost`, `error`, `meta`) live under `payload`. `hash` is SHA-256 over `JSON.stringify({ id, ts, kind, payload, prevHash })`, so anyone can verify a blackbox log with `npm i @olurabian/receipt` and nothing from you.

## API

- `createRecorder({ store })` -> `{ record, wrap, query, all, verify }`
- `MemoryStore` / `JsonlStore(path)` — pluggable, or implement the `Store` interface yourself
- `verifyChain(records)` — verify a raw array of records

## The Deadlatch stack

blackbox is the **prove** in Deadlatch, the open runtime governance stack for AI agents. Adopt one, or run all three.

- **[Purse](https://github.com/ArabianAnalyst/purse)**, enforce. Stop the action off-policy, at the moment it happens.
- **blackbox**, prove. A tamper-evident record of what happened, verifiable outside the tool.
- **[Tripwire](https://github.com/ArabianAnalyst/tripwire)**, watch. Catch the silent wrong action before a customer does.

## License

MIT
