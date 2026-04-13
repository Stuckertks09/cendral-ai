// models/CoreWorldState.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1 };
const boundedSigned = { type: Number, min: -1, max: 1 };

/** -----------------------------
 * Universal Global Emotional Climate
 * (every domain uses these)
 * ----------------------------- */
const GlobalEmotionSchema = new Schema({
  valence: { ...boundedSigned, default: 0 },    // -1 unpleasant → +1 pleasant
  arousal: { ...bounded01, default: 0.3 },      // energy level
  tension: { ...bounded01, default: 0.2 },      // global stress
  cohesion: { ...bounded01, default: 0.5 },     // togetherness
  entropy: { ...bounded01, default: 0.1 },      // unpredictability / disorder
}, { _id: false });

/** -----------------------------
 * Key-value global variables
 * dynamic misc fields for the environment
 * ----------------------------- */
const EnvironmentVarSchema = new Schema({
  key: { type: String, required: true },
  value: Schema.Types.Mixed
}, { _id: false });

/** -----------------------------
 * Domain layer placeholders
 * each domain extension adds its own schema here
 * ----------------------------- */
const DomainLayersSchema = new Schema({
  political: Schema.Types.Mixed,
  therapeutic: Schema.Types.Mixed,
  marketing: Schema.Types.Mixed,
  enterprise: Schema.Types.Mixed,
  consumer: Schema.Types.Mixed,
  game: Schema.Types.Mixed,
  economic: Schema.Types.Mixed, 
}, { _id: false });

/** -----------------------------
 * Core World State
 * ----------------------------- */
const CoreWorldStateSchema = new Schema({
  runId: { type: Schema.Types.ObjectId, ref: 'SimulationRun', index: true },
  stepIndex: { type: Number, index: true },

  basedOnEvent: { type: Schema.Types.ObjectId, ref: 'Event' },

  config: {
  packageId: { type: Schema.Types.ObjectId, ref: 'ConfigPackage' },
  cognitionSettingsId: { type: Schema.Types.ObjectId },
  systemSettingsId: { type: Schema.Types.ObjectId },
  memorySettingsId: { type: Schema.Types.ObjectId },
},

  // UNIVERSAL CLIMATE
  globalEmotion: GlobalEmotionSchema,

  // flexible environment fields
  envVars: { type: [EnvironmentVarSchema], default: [] },

  // PLUGGABLE EXTENSIONS
  domains: DomainLayersSchema,

  // persona snapshots (cheap logging)
  personaSnapshots: [{
    personaId: String,
    summary: String
  }],

  createdAt: { type: Date, default: Date.now }
});

CoreWorldStateSchema.index({ runId: 1, stepIndex: 1 }, { unique: true });

const CoreWorldState =
  mongoose.models.CoreWorldState ||
  mongoose.model('CoreWorldState', CoreWorldStateSchema);

export default CoreWorldState;
