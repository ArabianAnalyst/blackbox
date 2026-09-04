import { createRecorder } from "../src/recorder";
import { MemoryStore } from "../src/store";
import { hashRecord, GENESIS } from "../src/hash";

let passed = 0, failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.error(`  FAIL ${name}`); }
}

let seq = 0;
const fixed = () => ({ now: () => "2026-07-28T00:00:00.000Z", newId: () => `id-${++seq}` });

async function main() {
  // record assigns fields and chains
  seq = 0;
  const store = new MemoryStore();
  const rec = createRecorder({ store, ...fixed() });
  const r1 = rec.record({ action: "charge", outcome: "ok", cost: 20 });
  check("record returns generated id", r1.id === "id-1");
  check("first prevHash is GENESIS", r1.prevHash === GENESIS);
  const { hash: _h1, ...rest1 } = r1;
  check("hash matches recompute", r1.hash === hashRecord(rest1));
  const r2 = rec.record({ action: "email", outcome: "ok" });
  check("second prevHash chains to first hash", r2.prevHash === r1.hash);

  // wrap ok: returns result, records outcome + latency
  seq = 0;
  const recW = createRecorder({ store: new MemoryStore(), ...fixed() });
  const out = await recW.wrap("work", { x: 1 }, async () => 42);
  check("wrap returns fn result", out === 42);
  check("wrap recorded ok outcome", recW.all()[0]!.payload.outcome === "ok");
  check("wrap captured latencyMs", typeof recW.all()[0]!.payload.latencyMs === "number");

  // wrap error: records error and re-throws
  seq = 0;
  const recE = createRecorder({ store: new MemoryStore(), ...fixed() });
  let threw = false;
  try { await recE.wrap("boom", undefined, async () => { throw new Error("nope"); }); }
  catch { threw = true; }
  check("wrap re-throws the error", threw === true);
  check("wrap recorded error outcome", recE.all()[0]!.payload.outcome === "error");
  check("wrap recorded error message", recE.all()[0]!.payload.error === "nope");

  // query filters
  seq = 0;
  const recQ = createRecorder({ store: new MemoryStore(), ...fixed() });
  recQ.record({ action: "a", outcome: "ok" });
  recQ.record({ action: "a", outcome: "error", error: "x" });
  recQ.record({ action: "b", outcome: "ok" });
  check("query by action", recQ.query({ action: "a" }).length === 2);
  check("query by outcome", recQ.query({ outcome: "ok" }).length === 2);
  check("query by action and outcome", recQ.query({ action: "a", outcome: "error" }).length === 1);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}
main();
