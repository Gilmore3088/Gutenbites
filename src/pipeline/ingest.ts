import { uploadToR2 } from "@/lib/r2";
import { getSupabase, logPipelineEvent } from "@/lib/supabase";

export interface GutenbergMetadata {
  title: string;
  author: string;
  language: string;
  subjects: string[];
}

export function parseGutenbergMetadata(rdf: string): GutenbergMetadata {
  const titleMatch = rdf.match(/<dcterms:title>([^<]+)<\/dcterms:title>/);
  const authorMatch = rdf.match(/<pgterms:name>([^<]+)<\/pgterms:name>/);
  const languageMatch = rdf.match(/<rdf:value>([a-z]{2})<\/rdf:value>/);

  const subjectMatches = [...rdf.matchAll(/<dcterms:subject>[\s\S]*?<rdf:value>([^<]+)<\/rdf:value>[\s\S]*?<\/dcterms:subject>/g)];
  const subjects = subjectMatches.map((m) => m[1].trim());

  return {
    title: titleMatch ? titleMatch[1].trim() : "",
    author: authorMatch ? authorMatch[1].trim() : "",
    language: languageMatch ? languageMatch[1].trim() : "",
    subjects,
  };
}

export async function fetchGutenbergText(gutenbergId: number): Promise<string> {
  const url = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.txt`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Gutenberg text for id ${gutenbergId}: ${response.status}`);
  }
  return response.text();
}

export async function fetchGutenbergMetadata(gutenbergId: number): Promise<GutenbergMetadata> {
  const url = `https://www.gutenberg.org/cache/epub/${gutenbergId}/pg${gutenbergId}.rdf`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Gutenberg metadata for id ${gutenbergId}: ${response.status}`);
  }
  const rdf = await response.text();
  return parseGutenbergMetadata(rdf);
}

export async function ingestTitle(gutenbergId: number, feedSlug: string): Promise<string> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from("titles")
    .select("id")
    .eq("gutenberg_id", gutenbergId)
    .maybeSingle();

  if (existing) {
    throw new Error(`Title with gutenberg_id ${gutenbergId} already exists: ${existing.id}`);
  }

  const [metadata, text] = await Promise.all([
    fetchGutenbergMetadata(gutenbergId),
    fetchGutenbergText(gutenbergId),
  ]);

  const rawKey = `texts/raw/${gutenbergId}.txt`;
  await uploadToR2(rawKey, text, "text/plain");

  const { data: inserted, error } = await supabase
    .from("titles")
    .insert({
      gutenberg_id: gutenbergId,
      title: metadata.title,
      author: metadata.author,
      language: metadata.language,
      feed_slug: feedSlug,
      status: "ingested",
      raw_r2_key: rawKey,
      priority_score: 0,
      retry_count: 0,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to insert title: ${error?.message}`);
  }

  await logPipelineEvent(inserted.id, "ingest_complete", "queued", "ingested", {
    gutenberg_id: gutenbergId,
    title: metadata.title,
  });

  return inserted.id;
}
