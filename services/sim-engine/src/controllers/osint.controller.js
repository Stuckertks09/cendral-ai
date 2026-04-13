import { OSINTFeed } from "../models/OSINTFeed.js";
import { RawSignal } from "../models/RawSignal.js";
import { runOsintIngestion } from "../services/OSINT/ingestRunner.js";

export async function listFeeds(req, res) {
  const feeds = await OSINTFeed.find({}).sort({ createdAt: -1 }).lean();
  res.json({ feeds });
}

export async function createFeed(req, res) {
  const { source, name, query, enabled = true, maxPerRun = 5, domain = "defense", tags = [] } = req.body || {};
  if (!source || !name || !query) return res.status(400).json({ error: "Missing source/name/query" });

  const feed = await OSINTFeed.create({ source, name, query, enabled, maxPerRun, domain, tags });
  res.json({ feed });
}

export async function updateFeed(req, res) {
  const { id } = req.params;
  const updates = req.body || {};
  const feed = await OSINTFeed.findByIdAndUpdate(id, updates, { new: true });
  if (!feed) return res.status(404).json({ error: "Feed not found" });
  res.json({ feed });
}

export async function deleteFeed(req, res) {
  const { id } = req.params;
  await OSINTFeed.findByIdAndDelete(id);
  res.json({ ok: true });
}

export async function ingestNow(req, res) {
  const out = await runOsintIngestion();
  res.json(out);
}

export async function inbox(req, res) {
  const min = Number(req.query.minRelevance ?? 0.6);
  const limit = Math.min(Number(req.query.limit ?? 50), 200);

  const signals = await RawSignal.find({
    processed: true,
    dismissed: false,
    promoted: false,
    relevanceScore: { $gte: min },
  })
    .sort({ publishedAt: -1 })
    .limit(limit)
    .lean();

  res.json({ minRelevance: min, signals });
}

export async function dismissSignal(req, res) {
  const { id } = req.params;
  await RawSignal.updateOne({ _id: id }, { dismissed: true });
  res.json({ ok: true });
}
