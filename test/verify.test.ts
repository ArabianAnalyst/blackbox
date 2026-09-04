import { createRecorder } from "../src/recorder";
import { MemoryStore } from "../src/store";
import { verifyChain } from "../src/hash";

let passed = 0, failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.error(`  FAIL ${name}`); }
}

let seq = 0;
const rec = createRecorder({
  store: new MemoryStore(),
  now: () => "2026-07-28T00:00:00.000Z",
  newId: () => `id-${++seq}`,
});
rec.record({ action: "a", outcome: "ok" });
rec.record({ action: "b", outcome: "ok", cost: 3 });
rec.record({ action: "c", outcome: "error", error: "x" });

check("clean chain verifies via recorder", rec.verify().ok === true);

// tamper a field on a record (all() shares element references with the store)
const recs = rec.all();
recs[1]!.payload.cost = 999;
check("edited field is detected", rec.verify().ok === false);
check("edited field reports the index and id", rec.verify().brokenAt === 1 && rec.verify().id === "id-2");
recs[1]!.payload.cost = 3; // restore
check("restored chain verifies again", rec.verify().ok === true);

// verifyChain directly on arrays
const snapshot = rec.all();
check("verifyChain accepts a valid array", verifyChain(snapshot).ok === true);
const deleted = [snapshot[0]!, snapshot[2]!];
check("deleting the middle record breaks the chain", verifyChain(deleted).ok === false);
const reordered = [snapshot[1]!, snapshot[0]!, snapshot[2]!];
check("reordering records breaks the chain", verifyChain(reordered).ok === false);
const empty: typeof snapshot = [];
check("an empty chain verifies", verifyChain(empty).ok === true);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
