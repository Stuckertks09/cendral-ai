// src/core/simulation/SimulationRun.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const SimulationRunSchema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'Event', index: true },
  label: String, // optional human label, e.g. "Debate over X"

  startedAt: { type: Date, default: Date.now },
  finishedAt: { type: Date },

  steps: { type: Number, default: 0 },

  // just to know what mode we used (political, therapeutic, mixed, etc.)
  mode: { type: String, default: 'general' },

  // snapshot of cognition settings used for this run
  settingsSnapshot: Schema.Types.Mixed
});

const SimulationRun =
  mongoose.models.SimulationRun ||
  mongoose.model('SimulationRun', SimulationRunSchema);

export default SimulationRun;
