// src/core/events/CoreEvents.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const bounded = (min, max, extra = {}) => ({
  type: Number,
  min,
  max,
  ...extra,
});

// Lightweight parsed info (machine-derived, not user-tuned)
const ParsedSchema = new Schema(
  {
    summary: { type: String },
    sentiment: bounded(-1, 1),
    keywords: [{ type: String }],
    entities: [{ type: String }],
  },
  { _id: false }
);

// Inputs the severity engine derives (not user-supplied)
const SeverityInputsSchema = new Schema(
  {
    impactMagnitude: bounded(0, 1),
    scope: bounded(0, 1),
    immediacy: bounded(0, 1),
    reversibility: bounded(0, 1),
    novelty: bounded(0, 1),
    escalationFactor: { type: Number, min: -1, max: 1 },
  },
  { _id: false }
);

// Severity analysis output
const SeverityAnalysisSchema = new Schema(
  {
    magnitude: bounded(0, 1),
    direction: {
      type: String,
      enum: ['escalatory', 'deescalatory', 'neutral'],
      default: 'neutral',
    },
    inputs: SeverityInputsSchema,
    sentiment: bounded(-1, 1),
    modelVersion: { type: String },
    computedAt: { type: Date },
    // Optional weights/meta if you want traceability
    ruleBasedSeverity: bounded(0, 1),
    llmSeverity: bounded(0, 1),
    llmWeight: bounded(0, 1),
    ruleWeight: bounded(0, 1),
    noveltyScore: bounded(0, 2),
    notes: { type: String },
  },
  { _id: false }
);

const EventSchema = new Schema(
  {
    // Required classification
    type: { type: String, required: true, index: true },

    // Domain classification (defense, economic, content, etc.)
    domain: {
      type: String,
      enum: [
        'political',
        'therapeutic',
        'enterprise',
        'marketing',
        'consumer',
        'content',
        'game',
        'defense',
        'general',
      ],
      default: 'general',
      index: true,
    },

    topic: { type: String, index: true },

    // Optional actor metadata (works for defense, enterprise, etc.)
    actor: { type: String, index: true },
    target: { type: String, index: true },

    // Optional spatial fields (generic enough to be reused)
    theater: { type: String, index: true },
    subTheater: { type: String },

    // 🔹 Effective severity used by sims (computed, not user-provided)
    severity: bounded(0, 1, { default: null }),

    // Event category (whatever taxonomy you use)
    category: { type: String, index: true },

    // Raw external content (immutable “what the world said”)
    rawText: { type: String, required: true },

    // Lightweight parsing (summary/keywords/entities/sentiment)
    parsed: ParsedSchema,

    // Source metadata (pipe, URL, author, etc.)
    source: {
      origin: { type: String }, // 'twitter', 'rss', 'manual', 'system', ...
      url: { type: String },
      author: { type: String },
      externalId: { type: String },
    },

    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },

    tags: [{ type: String, index: true }],

    // 🔎 Machine-generated analysis (not intended for manual editing)
    analysis: {
      severity: SeverityAnalysisSchema,
    },

    // Optional override if you *really* want manual correction someday
    overrides: {
      severityMagnitude: bounded(0, 1),
      severityDirection: {
        type: String,
        enum: ['escalatory', 'deescalatory', 'neutral'],
      },
    },
  },
  {
    timestamps: true,
  }
);

EventSchema.index({ domain: 1, topic: 1, timestamp: -1 });

const EventModel =
  mongoose.models.Event || mongoose.model('Event', EventSchema);

export default EventModel;
