// src/repositories/coreAssets/leaderRepo.js
import GeoLeader from "../../core/actors/GeoLeader.js";

export const leaderRepo = {
  async listSummaries() {
    return GeoLeader.find(
      {},
      { _id: 1, key: 1, name: 1, actorKey: 1, isPrimary: 1 }
    ).lean();
  },

  async getById(id) {
    return GeoLeader.findById(id).lean();
  },

  async update(id, patch) {
    return GeoLeader.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean();
  },
};
