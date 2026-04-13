import crypto from "crypto";
import { fetchTrackedAccountTweets } from "../../providers/twitter_tracked.js";
import { RawSignal } from "../../models/RawSignal.js";
import { computeRelevance } from "./llmRelevance.js";

function makeDedupeKey(source, url) {
  return crypto
    .createHash("sha1")
    .update(`${source}:${url}`)
    .digest("hex");
}

export async function ingestTwitterFeed(feed, { maxSignalsRemaining, maxLlmRemaining }) {
  const maxResults = Math.min(feed.maxPerRun || 5, maxSignalsRemaining);
  if (maxResults <= 0) return { inserted: 0, processed: 0 };

  const handle = feed.query.replace(/^@/, "").trim();
  const tweets = await fetchTrackedAccountTweets({ handle, maxResults });

  let inserted = 0;
  let processed = 0;

  for (const t of tweets) {
    if (inserted >= maxResults) break;

    const dedupeKey = makeDedupeKey(feed.source, s.url);

    const existing = await RawSignal.findOne({ dedupeKey }).select("_id").lean();
    if (existing) continue;

    const doc = await RawSignal.create({
      source: "twitter",
      feedId: feed._id,
      headline: t.headline,
      description: t.description || "",
      url: t.url,
      author: t.author || "",
      publishedAt: t.publishedAt,
      dedupeKey,
      processed: false,
    });

    inserted++;

    if (maxLlmRemaining - processed <= 0) continue;

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

  feed.lastFetchedAt = new Date();
  await feed.save();

  return { inserted, processed };
}
