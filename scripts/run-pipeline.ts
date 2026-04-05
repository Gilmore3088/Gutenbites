import { readFileSync } from "fs";

// Load .env.local BEFORE any other imports (ES imports are hoisted,
// so we use synchronous env loading in the top-level scope)
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
  // Dynamic imports so env is set before modules load
  const { ingestTitle } = await import("../src/pipeline/ingest");
  const { cleanTitle } = await import("../src/pipeline/clean");
  const { segmentTitle } = await import("../src/pipeline/segment");
  const { enrichTitle } = await import("../src/pipeline/enrich");
  const { qaTitle } = await import("../src/pipeline/qa");
  const { synthesizeTitle } = await import("../src/pipeline/synthesize");
  const { postprocessTitle } = await import("../src/pipeline/postprocess");
  const { publishTitle } = await import("../src/pipeline/publish");

  const gutenbergId = parseInt(process.argv[2], 10);
  const feedSlug = process.argv[3] || "classics";

  if (isNaN(gutenbergId)) {
    console.error("Usage: npm run pipeline -- <gutenberg_id> [feed_slug]");
    process.exit(1);
  }

  console.log(`\n=== GütenBites Pipeline: Gutenberg #${gutenbergId} ===\n`);

  try {
    console.log("1/8 Ingesting from Gutenberg...");
    const titleId = await ingestTitle(gutenbergId, feedSlug);
    console.log(`   Title ID: ${titleId}`);

    console.log("2/8 Cleaning text...");
    await cleanTitle(titleId);

    console.log("3/8 Segmenting chapters...");
    await segmentTitle(titleId);

    console.log("4/8 Generating editorial intro...");
    await enrichTitle(titleId);

    console.log("5/8 Running QA scan...");
    await qaTitle(titleId);

    console.log("6/8 Synthesizing audio (this may take a few minutes)...");
    await synthesizeTitle(titleId);

    console.log("7/8 Post-processing audio...");
    await postprocessTitle(titleId);

    console.log("8/8 Publishing...");
    await publishTitle(titleId);

    console.log(`\n=== COMPLETE: Gutenberg #${gutenbergId} is now published ===`);
    console.log(`RSS feed: http://localhost:3000/api/rss/${feedSlug}`);
  } catch (error) {
    console.error("\n=== PIPELINE FAILED ===");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
