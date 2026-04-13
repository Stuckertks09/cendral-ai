import mongoose from "mongoose";

const OSINTFeedSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ["newsapi", "twitter"], required: true },
    name: { type: String, required: true },

    // For newsapi: query string; for twitter: handle (no @)
    query: { type: String, required: true },

    enabled: { type: Boolean, default: true },

    // Hard caps
    maxPerRun: { type: Number, default: 5 },

    // Watermark to avoid re-pulling old items
    lastFetchedAt: { type: Date, default: null },
    adhoc: {
  type: Boolean,
  default: false,
  index: true
},


    // Optional classification hints
    domain: { type: String, default: "defense" },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

OSINTFeedSchema.index({ source: 1, enabled: 1 });

export const OSINTFeed = mongoose.model("OSINTFeed", OSINTFeedSchema);
