import { GENESIS, hashRecord } from "../src/hash";

let passed = 0, failed = 0;
function check(name: string, cond: boolean) {
  if (cond) { passed++; console.log(`  ok   ${name}`); }
  else { failed++; console.error(`  FAIL ${name}`); }
}

const base = {
  id: "id-1", ts: "2026-07-28T00:00:00.000Z", kind: "action",
  payload: { action: "charge-card", outcome: "ok" as const },
  prevHash: GENESIS,
};

check("GENESIS is 64 zeros", GENESIS === "0".repeat(64));
check("hash is 64 hex chars", /^[0-9a-f]{64}$/.test(hashRecord(base)));
check("hash is deterministic", hashRecord(base) === hashRecord(base));
check("changing action changes hash", hashRecord(base) !== hashRecord({ ...base, payload: { ...base.payload, action: "refund" } }));
check("changing prevHash changes hash", hashRecord(base) !== hashRecord({ ...base, prevHash: "1".repeat(64) }));
check("changing cost changes hash", hashRecord(base) !== hashRecord({ ...base, payload: { ...base.payload, cost: 5 } }));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
