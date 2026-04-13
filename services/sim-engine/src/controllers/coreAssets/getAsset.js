// src/controllers/coreAssets/getAsset.js
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

export async function getAsset(req, res) {
  try {
    const { type, id } = req.params;

    if (!repos[type]) {
      return res.status(400).json({ error: "Invalid asset type" });
    }

    const item = await repos[type].getById(id);
    if (!item) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(item);
  } catch (err) {
    console.error("❌ getAsset error", err);
    res.status(500).json({ error: "Failed to fetch asset" });
  }
}
