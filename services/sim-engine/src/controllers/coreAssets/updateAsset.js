// src/controllers/coreAssets/updateAsset.js
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

export async function updateAsset(req, res) {
  try {
    const { type, id } = req.params;
    const patch = req.body;

    if (!repos[type]) {
      return res.status(400).json({ error: "Invalid asset type" });
    }

    const updated = await repos[type].update(id, patch);
    if (!updated) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ updateAsset error", err);
    res.status(500).json({ error: "Failed to update asset" });
  }
}
