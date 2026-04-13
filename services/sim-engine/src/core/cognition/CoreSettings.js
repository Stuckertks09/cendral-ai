// src/models/CoreSettings.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const bounded = (min, max) => ({
  type: Number,
  min,
  max,
  default: (min + max) / 2
});

/**
 * CognitionSettings
 *
 * Global and pack-specific sliders that control how strongly
 * cognition rules fire. This is effectively a singleton document.
 */
const CognitionSettingsSchema = new Schema({
  // GLOBAL SLIDERS
  emotionalReactivity: bounded(0, 2),      // scales mood/arousal changes
  beliefPlasticity: bounded(0, 2),         // scales belief updates
  crossTopicInfluence: bounded(0, 3),      // how much topics affect each other
  moodDecayRate: bounded(0, 2),            // how fast mood normalizes
  trustWeight: bounded(0, 2),              // how trust amplifies persuasion
  identityProtection: bounded(0, 2),       // resistance to belief change
  noveltySensitivity: bounded(0, 2),       // responsiveness to new events
  globalChaos: bounded(0, 2),              // amplifies randomness

  // DOMAIN PACK SLIDERS
  defensePack: {
    threatSensitivity: bounded(0, 2),
    allianceReliance: bounded(0, 2),
    escalationBias: bounded(0, 2),
    doctrineShift: bounded(0, 2),
    intelReactivity: bounded(0, 2)
  },

  // PACK-SPECIFIC OVERRIDES (future shape is pack-defined)
  politicalPack: Schema.Types.Mixed,
  contentPack: Schema.Types.Mixed,
  therapeuticPack: Schema.Types.Mixed,
  enterprisePack: Schema.Types.Mixed,

  updatedAt: { type: Date, default: Date.now }
});

CognitionSettingsSchema.pre('save', function preSave() {
  this.updatedAt = new Date();
});

const CognitionSettingsModel =
  mongoose.models.CognitionSettings ||
  mongoose.model('CognitionSettings', CognitionSettingsSchema);

/**
 * Convenience: load the singleton doc, or create it with defaults.
 */
export async function getOrCreateCognitionSettings() {
  let doc = await CognitionSettingsModel.findOne();
  if (!doc) {
    doc = new CognitionSettingsModel({});
    await doc.save();
  }
  return doc;
}

export default CognitionSettingsModel;
