// src/core/simulation/createInitialWorldState.js
import mongoose from "mongoose";

/**
 * Create a deterministic baseline world state (step 0).
 * This is persisted before any simulation steps run.
 */
export function createInitialWorldState({
  runId,
  configPackage,
  domains = {},
} = {}) {
  if (!runId) {
    throw new Error("createInitialWorldState requires runId");
  }

  return {
    _id: new mongoose.Types.ObjectId(),

    runId,
    stepIndex: 0,
    basedOnEvent: null,

    // --- CONFIG PROVENANCE ---
    config: {
      packageId: configPackage?._id,
      cognitionSettingsId: configPackage?.cognition?._id,
      systemSettingsId: configPackage?.systems?._id,
      memorySettingsId: configPackage?.memory?._id,
    },

    // --- UNIVERSAL CLIMATE (defaults come from schema) ---
    globalEmotion: undefined,

    // --- DOMAIN STATE (systems self-initialize) ---
    domains: {
      economic: null,
      environment: null,
      info: null,
      population: null,

      // allow package-level domain seeding (optional)
      ...domains,
    },

    envVars: [],
    personaSnapshots: [],

    createdAt: new Date(),
  };
}
