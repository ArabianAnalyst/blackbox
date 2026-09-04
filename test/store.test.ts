import { MemoryStore, JsonlStore } from "../src/store";
import { GENESIS } from "../src/hash";
import type { ActionRecord } from "../src/types";
import { rmSync, existsSync } from "node:fs";

let passed = 0, failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.error(`  FAIL ${name}`); }
}

const rec = (id: string, prevHash: string): ActionRecord => ({
  id, ts: "2026-07-28T00:00:00.000Z", kind: "action", payload: { action: "a", outcome: "ok" }, prevHash, hash: "h" + id,
});

const m = new MemoryStore();
check("empty store lastHash is GENESIS", m.lastHash() === GENESIS);
m.append(rec("1", GENESIS));
m.append(rec("2", "h1"));
check("lastHash is last record hash", m.lastHash() === "h2");
check("all returns 2 records", m.all().length === 2);
check("all returns a fresh array", m.all() !== m.all());

const path = "./.tmp-store.jsonl";
if (existsSync(path)) rmSync(path);
const j1 = new JsonlStore(path);
j1.append(rec("1", GENESIS));
j1.append(rec("2", "h1"));
const j2 = new JsonlStore(path);
check("JsonlStore reloads from file", j2.all().length === 2);
check("reloaded lastHash matches", j2.lastHash() === "h2");
check("reloaded record round-trips", j2.all()[0]!.id === "1");
rmSync(path);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
