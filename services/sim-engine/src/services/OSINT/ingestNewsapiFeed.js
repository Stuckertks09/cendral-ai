import crypto from "crypto";
import { fetchNewsSignals } from "../../providers/newsapi.js";
import { RawSignal } from "../../models/RawSignal.js";
import { computeRelevance } from "./llmRelevance.js";

function makeDedupeKey(source, url) {
  return crypto
    .createHash("sha1")
    .update(`${source}:${url}`)
    .digest("hex");
}

export async function ingestNewsapiFeed(feed, { maxSignalsRemaining, maxLlmRemaining }) {
  const pageSize = Math.min(feed.maxPerRun || 5, maxSignalsRemaining);
  if (pageSize <= 0) return { inserted: 0, processed: 0 };

  const from = feed.lastFetchedAt || null;
  const signals = await fetchNewsSignals({ query: feed.query, from, pageSize });

  let inserted = 0;
  let processed = 0;

  for (const s of signals) {
    if (inserted >= pageSize) break;

    if (!s.url || !s.headline) continue;

    const dedupeKey = makeDedupeKey(feed.source, s.url);

    // Upsert: if exists, skip
    const existing = await RawSignal.findOne({ dedupeKey }).select("_id").lean();
    if (existing) continue;

    const doc = await RawSignal.create({
      source: "newsapi",
      feedId: feed._id,
      headline: s.headline,
      description: s.description || "",
      url: s.url,
      author: s.author || "",
      publishedAt: s.publishedAt,
      dedupeKey,
      processed: false,
    });

    inserted++;

    if (maxLlmRemaining - processed <= 0) continue;

    // LLM relevance pass (headline + description only)
    const rel = await computeRelevance({ headline: doc.headline, description: doc.description });

    await RawSignal.updateOne(
      { _id: doc._id },
      {
        processed: true,
        relevant: !!rel.relevant,
        relevanceScore: rel.relevance_score ?? 0,
        llmMeta: rel,
      }
    );

    processed++;
  }

  // Update watermark conservatively: now
  feed.lastFetchedAt = new Date();
  await feed.save();

  return { inserted, processed };
}
