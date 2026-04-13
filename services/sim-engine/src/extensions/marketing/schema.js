// extensions/MarketingExtension.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const MarketingExtensionSchema = new Schema({
  toneGuidelines: {
    voice: String,
    persona: String,
    do: [String],
    dont: [String]
  },

  contentPillars: [{
    name: String,
    examples: [String]
  }],

  hooks: [String],

  preferredFormats: [String], // threads, shorts, carousels, etc.

  ctas: [String],

  evidencePatterns: [{
    claim: String,
    receipt: String,
    impact: bounded(0, 1)
  }]
}, { _id: false });

export default MarketingExtensionSchema;
