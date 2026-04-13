// src/repositories/coreAssets/personaRepo.js
import CorePersona from "../../core/persona/CorePersona.js";

export const personaRepo = {
  async listSummaries() {
    return CorePersona.find(
      {},
      { _id: 1, "identity.name": 1 }
    ).lean();
  },

  async getById(id) {
    return CorePersona.findById(id).lean();
  },

  async update(id, patch) {
    return CorePersona.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    }).lean();
  },
};
