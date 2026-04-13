// src/models/DomainConfig.js
import mongoose from "mongoose";

const { Schema } = mongoose;

/**
 * Topic configuration for a given domain.
 * This is NOT the live worldstate – it's the blueprint
 * for how topics should be seeded and interpreted.
 */
const TopicConfigSchema = new Schema(
  {
    // Stable machine key: e.g. "civil_liberties", "elections"
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Human-readable label: e.g. "Civil Liberties"
    label: {
      type: String,
      required: true,
      trim: true,
    },

    // Optional description for UIs / docs
    description: {
      type: String,
      trim: true,
    },

    // Optional grouping: "rights", "economy", "culture", etc.
    category: {
      type: String,
      trim: true,
    },

    // How important this topic is in this domain (for weighting, sampling, etc.)
    weight: {
      type: Number,
      min: 0,
      max: 1,
      default: 1,
    },

    // Whether this topic is a “headline” topic in visualizations
    isPrimary: {
      type: Boolean,
      default: false,
    },

    // Whether this topic should be used at all
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Initial worldstate defaults for this topic
    defaults: {
      stance: { type: Number, min: -1, max: 1, default: 0 },
      certainty: { type: Number, min: 0, max: 1, default: 0.5 },
      volatility: { type: Number, min: 0, max: 1, default: 0.5 },
    },

    // Freeform metadata for adapters / UI
    tags: [String],
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

/**
 * Cross-topic influence configuration.
 * This is the *static* influence graph; the live weights can
 * be adjusted in the worldstate over time if you want.
 */
const TopicInfluenceSchema = new Schema(
  {
    from: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // -1 (strongly negative) … 0 (none) … +1 (strongly reinforcing)
    weight: {
      type: Number,
      min: -1,
      max: 1,
      required: true,
    },

    // Optional explanation for debugging / UI
    rationale: {
      type: String,
      trim: true,
    },

    // If true, engine may mirror this influence (to → from) unless explicitly overridden
    isSymmetric: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/**
 * Per-domain configuration:
 * - which topics exist
 * - how they are seeded
 * - how they influence each other
 * - optional domain-specific prompts & defaults
 */
const DomainConfigSchema = new Schema(
  {
    // Logical domain key: "political", "economic", "enterprise", etc.
    domain: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Optional nicer label: "Political Cognition"
    displayName: {
      type: String,
      trim: true,
    },

    // Optional domain description for docs / UI
    description: {
      type: String,
      trim: true,
    },

    // Versioning so you can evolve domain configs over time
    version: {
      type: Number,
      default: 1,
      index: true,
    },

    // Soft activation flag (handy in multi-tenant setups)
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Topics defined for this domain
    topics: {
      type: [TopicConfigSchema],
      default: [],
    },

    // Static influence graph
    influences: {
      type: [TopicInfluenceSchema],
      default: [],
    },

    // Domain-level metric defaults (these map nicely to your political metrics)
    metricDefaults: {
      polarizationBaseline: { type: Number, min: 0, max: 1, default: 0.2 },
      radicalizationBaseline: { type: Number, min: 0, max: 1, default: 0.1 },
      instabilityBaseline: { type: Number, min: 0, max: 1, default: 0.1 },
    },

    // Optional domain-specific prompt templates for LLM layers
    prompts: {
      perception: { type: String, trim: true },
      argument: { type: String, trim: true },
      arbitration: { type: String, trim: true },
    },

    // Optional multi-tenant / environment context
    context: {
      tenantId: { type: String, index: true },
      projectId: { type: String, index: true },
      environment: {
        type: String,
        enum: ["dev", "staging", "prod"],
        default: "dev",
        index: true,
      },
    },

    // Meta for audits
    meta: {
      schemaVersion: { type: Number, default: 1 },
      createdBy: { type: String },
      updatedBy: { type: String },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true, // adds createdAt / updatedAt at root
  }
);

/* -------------------------------------------------------
   INDEXES
------------------------------------------------------- */

// One active config per domain+environment+tenant is the common pattern;
// you can relax/adjust this if you want multiple versions live.
DomainConfigSchema.index(
  {
    domain: 1,
    "context.tenantId": 1,
    "context.environment": 1,
    version: -1,
  },
  {
    name: "domain_context_version",
  }
);

// Ensure topic keys are unique within a domain
DomainConfigSchema.index(
  {
    domain: 1,
    "topics.key": 1,
  },
  {
    unique: true,
    sparse: true,
    name: "domain_topic_key_unique",
  }
);

/* -------------------------------------------------------
   HOOKS
------------------------------------------------------- */

DomainConfigSchema.pre("save", function () {
  this.meta = this.meta || {};
  this.meta.updatedAt = new Date();
});


/* -------------------------------------------------------
   MODEL EXPORT
------------------------------------------------------- */

const DomainConfig =
  mongoose.models.DomainConfig ||
  mongoose.model("DomainConfig", DomainConfigSchema);

export default DomainConfig;
