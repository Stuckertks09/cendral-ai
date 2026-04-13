// extensions/therapeutic/worldState.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1 };

// Represents the emotional climate of a therapeutic environment.
const TherapeuticClimateSchema = new Schema({
  stressLevel: { ...bounded01, default: 0.3 },
  trustLevel: { ...bounded01, default: 0.5 },
  sessionIntensity: { ...bounded01, default: 0.4 },
  safetyPerception: { ...bounded01, default: 0.6 },
}, { _id: false });

// Represents high-level session themes from events or interactions.
const TherapeuticThemeSchema = new Schema({
  label: { type: String, required: true },
  salience: { ...bounded01, default: 0.5 }
}, { _id: false });

// The world-state node for the therapeutic domain.
const TherapeuticWorldStateSchema = new Schema({
  climate: { type: TherapeuticClimateSchema, default: {} },

  themes: { type: [TherapeuticThemeSchema], default: [] },

  metrics: {
    emotionalProgress: { ...bounded01, default: 0.0 },
    dysregulation: { ...bounded01, default: 0.0 },
    relationshipRepair: { ...bounded01, default: 0.0 }
  },

  updatedAt: { type: Date, default: Date.now }
});

export default TherapeuticWorldStateSchema;
