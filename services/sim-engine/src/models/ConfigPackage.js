// src/models/ConfigPackage.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * ConfigPackage
 * -------------
 * Immutable snapshot of all engine configuration
 * required to deterministically run a scenario.
 */
const ConfigPackageSchema = new Schema(
  {
    // ---------- Identity ----------
    name: { type: String, required: true },
    description: { type: String },
    tags: [String],

    // Optional lineage (forking / evolution)
    parentPackageId: { type: Schema.Types.ObjectId, ref: 'ConfigPackage' },

    // ---------- Cognition ----------
    cognition: {
      type: Object,
      required: true
      // snapshot of CognitionSettings (FULL object)
    },

    // ---------- Memory ----------
    memory: {
      type: Object,
      required: true
      // snapshot of MemorySettings
    },

    // ---------- Systems ----------
    systems: {
      type: Object,
      required: true
      // keys = SystemClass.name
      // values = settings object
    },

    // ---------- Domain Settings ----------
    domains: {
      defense: {
        topics: [
          {
            key: String,
            label: String,
            stance: Number,
            certainty: Number,
            volatility: Number,
            category: String,
            tags: [String]
          }
        ]
      },

      // future:
      // political: {}
      // economic: {}
      // content: {}
    },

    // ---------- Runtime Flags ----------
    enabledSystems: [String], // e.g. ["EconomicSystem", "InfoFlowSystem"]

    // ---------- Metadata ----------
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String }, // user id / email / system
    version: { type: Number, default: 1 }
  },
  {
    strict: true,
    minimize: false // keep empty objects for diffing
  }
);

export default mongoose.models.ConfigPackage ||
  mongoose.model('ConfigPackage', ConfigPackageSchema);
