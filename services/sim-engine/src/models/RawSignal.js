import mongoose from "mongoose";

const RawSignalSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ["newsapi", "twitter"], required: true },
    feedId: { type: mongoose.Schema.Types.ObjectId, ref: "OSINTFeed", required: true },

    headline: { type: String, required: true },
    description: { type: String, default: "" },
    url: { type: String, required: true },

    author: { type: String, default: "" },
    publishedAt: { type: Date, required: true },

    // Dedupe: stable unique key per item
    dedupeKey: { type: String, required: true, unique: true },

    // LLM relevance outputs (NO severity)
    processed: { type: Boolean, default: false },
    relevant: { type: Boolean, default: null },
    relevanceScore: { type: Number, default: null }, // 0..1
    llmMeta: { type: Object, default: null },

    // Inbox lifecycle
    dismissed: { type: Boolean, default: false },
    promoted: { type: Boolean, default: false },
    promotedEventId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true }
);

RawSignalSchema.index({ feedId: 1, publishedAt: -1 });
RawSignalSchema.index({ processed: 1, relevanceScore: -1 });
RawSignalSchema.index({ dismissed: 1, promoted: 1 });

export const RawSignal = mongoose.model("RawSignal", RawSignalSchema);
