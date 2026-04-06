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

async function main() {
  const { processNext } = await import("../src/pipeline/orchestrator");

  console.log("\n=== GütenBites Orchestrator ===\n");
  console.log("Picking next title to process...");

  const result = await processNext();

  if (!result.processed) {
    if (result.error === "No titles to process") {
      console.log("Queue is empty. Nothing to process.");
    } else {
      console.error(`Failed: ${result.error}`);
      console.error(`Title: ${result.title} (${result.titleId})`);
      console.error(`Status: ${result.fromStatus} -> ${result.toStatus}`);
    }
    process.exit(result.error === "No titles to process" ? 0 : 1);
  }

  console.log(`\nProcessed: ${result.title}`);
  console.log(`Status: ${result.fromStatus} -> ${result.toStatus}`);
  console.log(`Stages: ${result.stages.join(" -> ")}`);
}

main().catch((e) => {
  console.error("Orchestrator error:", e.message);
  process.exit(1);
});
