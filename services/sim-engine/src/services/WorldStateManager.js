// src/services/WorldStateManager.js
import mongoose from "mongoose";

export default class WorldStateManager {
  constructor(worldStateFactory) {
    this.factory = worldStateFactory;

    if (!worldStateFactory.WorldStateModel) {
      throw new Error("WorldStateManager: WorldStateModel missing. Call buildSchema() before creating manager.");
    }

    this.WorldStateModel = worldStateFactory.WorldStateModel;
  }

  get model() {
    return this.WorldStateModel;
  }

  async getLatest() {
    return this.model.findOne().sort({ stepIndex: -1 });
  }

  // 🔥 ADD THIS — wrapper around factory
  async createInitialWorldState({ runId = null, event = null } = {}) {
    const doc = await this.factory.createInitialWorldState({ runId, event });
    await doc.save();
    return doc;
  }

  async reset(event = null) {
    await this.WorldStateModel.deleteMany({});
    return this.createInitialWorldState({ event });
  }

  async createNextStep(prevState) {
    if (!prevState.runId) {
      throw new Error("WorldState missing runId — cannot create next step.");
    }

    const nextDoc = this.factory.cloneWorldState(prevState);

    nextDoc.runId = prevState.runId;
    nextDoc.stepIndex = prevState.stepIndex + 1;
    nextDoc.createdAt = new Date();

    await nextDoc.save();
    return nextDoc;
  }

  async listHistory() {
    return this.model.find().sort({ stepIndex: 1 }).lean();
  }
}