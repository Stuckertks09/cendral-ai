import { OSINTFeed } from "../../models/OSINTFeed.js";
import { ingestNewsapiFeed } from "./ingestNewsapiFeed.js";
import { ingestTwitterFeed } from "./ingestTwitterFeed.js";

const MAX_SIGNALS_PER_RUN = Number(process.env.OSINT_MAX_SIGNALS_PER_RUN || 50);
const MAX_LLM_CALLS_PER_RUN = Number(process.env.OSINT_MAX_LLM_CALLS_PER_RUN || 50);

export async function runOsintIngestion() {
  const feeds = await OSINTFeed.find({
    enabled: true,
    adhoc: { $ne: true }   // 👈 DO NOT re-run ad-hoc feeds
  })
    .sort({ updatedAt: -1 })
    .lean();

  let signalsRemaining = MAX_SIGNALS_PER_RUN;
  let llmRemaining = MAX_LLM_CALLS_PER_RUN;

  const results = [];

  for (const feed of feeds) {
    if (signalsRemaining <= 0 || llmRemaining <= 0) break;

    const ctx = {
      maxSignalsRemaining: signalsRemaining,
      maxLlmRemaining: llmRemaining
    };

    let r = { inserted: 0, processed: 0 };

    const hydrated = await OSINTFeed.findById(feed._id);
    if (!hydrated) continue;

    if (hydrated.source === "newsapi") {
      r = await ingestNewsapiFeed(hydrated, ctx);
    } else if (hydrated.source === "twitter") {
      r = await ingestTwitterFeed(hydrated, ctx);
    }

    signalsRemaining -= r.inserted;
    llmRemaining -= r.processed;

    results.push({
      feedId: hydrated._id,
      source: hydrated.source,
      name: hydrated.name,
      ...r
    });
  }

  return {
    maxSignalsPerRun: MAX_SIGNALS_PER_RUN,
    maxLlmCallsPerRun: MAX_LLM_CALLS_PER_RUN,
    results
  };
}
