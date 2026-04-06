import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  if (line.startsWith("#") || !line.includes("=")) continue;
  const eqIndex = line.indexOf("=");
  const key = line.slice(0, eqIndex).trim();
  const value = line.slice(eqIndex + 1).trim();
  if (key && !process.env[key]) {
    process.env[key] = value;
  }
}
process.env.MOCK_TTS = "true";

async function main() {
  const { processNext } = await import("../src/pipeline/orchestrator");
  console.log("\n=== Orchestrator (Mock TTS) ===\n");
  const result = await processNext();
  if (result.processed) {
    console.log(`SUCCESS: ${result.title}`);
    console.log(`Stages: ${result.stages.join(" -> ")}`);
    console.log(`Final status: ${result.toStatus}`);
  } else {
    console.log(`RESULT: ${result.error}`);
    if (result.titleId) console.log(`Title: ${result.title} -> ${result.toStatus}`);
  }
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
