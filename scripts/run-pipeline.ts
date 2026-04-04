import "dotenv/config";
import { ingestTitle } from "../src/pipeline/ingest";
import { cleanTitle } from "../src/pipeline/clean";
import { segmentTitle } from "../src/pipeline/segment";
import { enrichTitle } from "../src/pipeline/enrich";
import { qaTitle } from "../src/pipeline/qa";
import { synthesizeTitle } from "../src/pipeline/synthesize";
import { postprocessTitle } from "../src/pipeline/postprocess";
import { publishTitle } from "../src/pipeline/publish";

async function runPipeline(gutenbergId: number, feedSlug: string) {
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
    console.log("6/8 Synthesizing audio (this may take several minutes)...");
    await synthesizeTitle(titleId);
    console.log("7/8 Post-processing audio...");
    await postprocessTitle(titleId);
    console.log("8/8 Publishing...");
    await publishTitle(titleId);
    console.log(`\n=== COMPLETE: "${gutenbergId}" is now published ===`);
    console.log(`RSS feed: https://gutenbites.com/api/rss/${feedSlug}`);
  } catch (error) {
    console.error("\n=== PIPELINE FAILED ===");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

const gutenbergId = parseInt(process.argv[2], 10);
const feedSlug = process.argv[3] || "classics";
if (isNaN(gutenbergId)) {
  console.error("Usage: npm run pipeline -- <gutenberg_id> [feed_slug]");
  process.exit(1);
}
runPipeline(gutenbergId, feedSlug);
