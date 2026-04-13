import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 * PromptPack
 * ----------
 * Domain-specific set of LLM prompts used for:
 *  - perception
 *  - argument generation
 *  - arbitration
 *  - system-level guidance
 *
 * Packs are versioned and environment-aware.
 */

const PromptPackSchema = new Schema(
  {
    domain: {
      type: String,
      required: true,
      index: true,
      trim: true,
      lowercase: true,
      enum: [
        "political",
        "defense",
        "enterprise",
        "marketing",
        "content",
        "therapeutic",
        "consumer",
        "game",
        "general"
      ]
    },

    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },

    // Core prompts
    perceptionPrompt: { type: String, required: true },
    argumentPrompt: { type: String, required: true },
    arbitrationPrompt: { type: String, required: true },
    systemPrompt: { type: String, required: true },

    // Optional metadata for version tracking
    metadata: {
      version: { type: Number, default: 1 },
      author: { type: String },
      notes: { type: String },
      createdAt: { type: Date, default: Date.now }
    },

    // Environment (prod, dev, etc.)
    environment: {
      type: String,
      enum: ["prod", "staging", "dev"],
      default: "prod",
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Unique: domain + key + environment
PromptPackSchema.index(
  { domain: 1, key: 1, environment: 1 },
  { unique: true }
);

const PromptPack =
  mongoose.models.PromptPack ||
  mongoose.model("PromptPack", PromptPackSchema);

export default PromptPack;
