import mongoose from 'mongoose';

const { Schema } = mongoose;

// Keep defaults here so UI + engine can share the same baseline
export const DEFAULT_MEMORY_SETTINGS = {
  useSemanticMemory: true,
  useGraphMemory: true,

  semanticTopKPersona: 5,
  semanticTopKActor: 5,
  semanticTopKLeader: 5,
  semanticTopKEvents: 5,

  semanticWeight: 1,
  relationalWeight: 1,
  episodicWeight: 1
};

/**
 * MemorySettings
 * --------------
 * Controls how the engine uses:
 *  - semantic memory (Pinecone)
 *  - relational memory (Neo4j)
 *  - episodic memory (recent world states)
 */
const MemorySettingsSchema = new Schema({
  useSemanticMemory: {
    type: Boolean,
    default: DEFAULT_MEMORY_SETTINGS.useSemanticMemory
  },
  useGraphMemory: {
    type: Boolean,
    default: DEFAULT_MEMORY_SETTINGS.useGraphMemory
  },

  semanticTopKPersona: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.semanticTopKPersona,
    min: 1,
    max: 64
  },
  semanticTopKActor: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.semanticTopKActor,
    min: 1,
    max: 64
  },
  semanticTopKLeader: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.semanticTopKLeader,
    min: 1,
    max: 64
  },
  semanticTopKEvents: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.semanticTopKEvents,
    min: 1,
    max: 64
  },

  semanticWeight: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.semanticWeight,
    min: 0,
    max: 2
  },
  relationalWeight: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.relationalWeight,
    min: 0,
    max: 2
  },
  episodicWeight: {
    type: Number,
    default: DEFAULT_MEMORY_SETTINGS.episodicWeight,
    min: 0,
    max: 2
  },

  updatedAt: { type: Date, default: Date.now }
});

MemorySettingsSchema.pre('save', function preSave() {
  this.updatedAt = new Date();
});

// Helper to always have a doc
MemorySettingsSchema.statics.getOrCreate = async function getOrCreate() {
  let doc = await this.findOne();
  if (!doc) {
    doc = new this({}); // defaults fill in
    await doc.save();
  }
  return doc;
};

const MemorySettingsModel =
  mongoose.models.MemorySettings ||
  mongoose.model('MemorySettings', MemorySettingsSchema);

export async function getOrCreateMemorySettings() {
  return MemorySettingsModel.getOrCreate();
}

export default MemorySettingsModel;
