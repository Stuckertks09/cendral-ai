import DomainConfig from "../models/DomainConfig.js";

/**
 * GET /defense/topics
 * Returns normalized topic objects with merged defaults.
 */
export async function getDefenseTopics(req, res) {
  try {
    const doc = await DomainConfig.findOne({ domain: "defense" }).lean();

    if (!doc) {
      return res.status(404).json({ error: "Defense domain not found" });
    }

    const topics = (doc.topics || []).map(t => ({
      key: t.key,
      label: t.label,
      category: t.category,
      tags: t.tags || [],
      weight: t.weight,
      isPrimary: t.isPrimary,
      isActive: t.isActive,

      // Defaults merged with safe fallbacks
      stance: t.defaults?.stance ?? 0,
      certainty: t.defaults?.certainty ?? 0,
      volatility: t.defaults?.volatility ?? 0,
    }));

    return res.json(topics);
  } catch (err) {
    console.error("❌ getDefenseTopics error:", err);
    return res.status(500).json({ error: "Failed to load defense topics" });
  }
}

/**
 * POST /defense/topics
 * Updates ONLY the defaults (stance, certainty, volatility)
 * without overwriting the rest of the topic structure.
 */
export async function updateDefenseTopics(req, res) {
  try {
    const { topics } = req.body;

    if (!Array.isArray(topics)) {
      return res.status(400).json({ error: "topics must be an array" });
    }

    const doc = await DomainConfig.findOne({ domain: "defense" });

    if (!doc) {
      return res.status(404).json({ error: "Defense domain not found" });
    }

    // Map updates back into the domain doc
    doc.topics = doc.topics.map(existing => {
      const incoming = topics.find(t => t.key === existing.key);
      if (!incoming) return existing;

      return {
        ...existing,
        defaults: {
          stance: incoming.stance ?? 0,
          certainty: incoming.certainty ?? 0,
          volatility: incoming.volatility ?? 0,
        },
      };
    });

    await doc.save();

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ updateDefenseTopics error:", err);
    return res.status(500).json({ error: "Failed to update topics" });
  }
}
