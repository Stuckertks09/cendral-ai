import mongoose from "mongoose";

const GameWorldStateSchema = new mongoose.Schema({
  morale:      { type: Number, default: 0.5, min: 0, max: 1 },
  tension:     { type: Number, default: 0.3, min: 0, max: 1 },
  resources:   { type: Number, default: 0.5, min: 0, max: 1 },
  progress:    { type: Number, default: 0.0, min: 0, max: 1 },

  lastUpdated: { type: Number, default: () => Date.now() }
});

export default GameWorldStateSchema;
