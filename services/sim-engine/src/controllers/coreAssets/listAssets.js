// src/controllers/coreAssets/listAssets.js
import {
  personaRepo,
  actorRepo,
  leaderRepo,
} from "../../repositories/coreAssets/index.js";

const repos = {
  persona: personaRepo,
  actor: actorRepo,
  leader: leaderRepo,
};

export async function listAssets(req, res) {
  try {
    const { type } = req.query;

    if (!repos[type]) {
      return res.status(400).json({ error: "Invalid asset type" });
    }

    const items = await repos[type].listSummaries();
    res.json(items);
  } catch (err) {
    console.error("❌ listAssets error", err);
    res.status(500).json({ error: "Failed to list assets" });
  }
}
