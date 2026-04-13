// src/repositories/coreAssets/actorRepo.js
import GeoActor from "../../core/actors/GeoActor.js";

export const actorRepo = {
  async listSummaries() {
    return GeoActor.find(
      {},
      { _id: 1, key: 1, label: 1, type: 1 }
    ).lean();
  },

  async getById(id) {
    return GeoActor.findById(id).lean();
  },

  async update(id, patch) {
    return GeoActor.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean();
  },
};
