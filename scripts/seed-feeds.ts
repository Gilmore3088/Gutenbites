import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

async function seedFeeds() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const feeds = [{
    slug: "classics",
    name: "GütenBites Classics",
    description: "The greatest works of classic literature, narrated by AI.",
    voice_id: process.env.ELEVENLABS_VOICE_ID!,
    rss_url: "https://gutenbites.com/api/rss/classics",
  }];
  for (const feed of feeds) {
    const { error } = await supabase.from("feeds").upsert(feed);
    if (error) console.error(`Failed to seed feed ${feed.slug}:`, error.message);
    else console.log(`Seeded feed: ${feed.slug}`);
  }
}
seedFeeds().catch(console.error);
