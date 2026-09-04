import { createRecorder, MemoryStore } from "../src/index";

const rec = createRecorder({ store: new MemoryStore() });

async function chargeCard(amount: number): Promise<{ ref: string }> {
  if (amount > 100) throw new Error("over per-transaction cap");
  return { ref: "ch_" + amount };
}

async function main() {
  await rec.wrap("charge-card", { amount: 20 }, () => chargeCard(20));
  try {
    await rec.wrap("charge-card", { amount: 500 }, () => chargeCard(500));
  } catch {
    // recorded as an error, then re-thrown; swallowed here for the demo
  }

  console.log("Recorded actions:");
  for (const r of rec.all()) {
    console.log(`  ${r.payload.action}  ${r.payload.outcome}${r.payload.error ? " (" + r.payload.error + ")" : ""}  ${r.payload.latencyMs}ms`);
  }

  console.log("\nverify() on the untouched log:", rec.verify());

  // Tamper with a record, then verify again.
  rec.all()[0]!.payload.action = "refund-card";
  console.log("verify() after editing a record:", rec.verify());
}
main();
