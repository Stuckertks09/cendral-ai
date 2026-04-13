import mongoose from "mongoose";

const MarketingWorldStateSchema = new mongoose.Schema({
  sentiment: { type: Number, default: 0.5, min: 0, max: 1 },
  virality: { type: Number, default: 0.3, min: 0, max: 1 },
  trust: { type: Number, default: 0.5, min: 0, max: 1 },
  lastUpdated: { type: Number, default: Date.now }
});

export default MarketingWorldStateSchema;
