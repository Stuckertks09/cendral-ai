// extensions/defense/worldState.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1, default: 0 };
const boundedSigned = { type: Number, min: -1, max: 1, default: 0 };

const TheaterSchema = new Schema(
  {
    key: { type: String, required: true },     // "eastern_europe", "indo_pacific"
    label: { type: String, trim: true },
    region: { type: String, trim: true },      // "Europe", "Asia-Pacific" etc.

    tension: bounded01,                        // overall temperature in this theater
    stability: bounded01,                      // inverse of fragility
    conflictProbability: bounded01,            // model's view of war likelihood

    alliedPresence: bounded01,                 // normalized strength of allied forces
    adversaryPresence: bounded01,              // normalized strength of adversaries

    escalationRisk: bounded01                  // local risk of escalation in this theater
  },
  { _id: false }
);

const DefenseRelationSchema = new Schema(
  {
    from: { type: String, required: true },    // country / bloc key
    to: { type: String, required: true },
    type: { type: String, enum: ["alliance", "rivalry", "proxy", "neutral"], required: true },
    weight: boundedSigned                      // positive for stabilizing, negative for destabilizing
  },
  { _id: false }
);

const DefenseMetricsSchema = new Schema(
  {
    systemEscalationRisk: bounded01,           // global risk of major war / escalation
    allianceCohesion: bounded01,               // how stable alliances are overall
    deterrenceBalance: boundedSigned,          // perceived balance of deterrence (e.g. West vs adversaries)
    activeConflictCount: { type: Number, min: 0, default: 0 }
  },
  { _id: false }
);

const DefenseWorldStateSchema = new Schema({
  theaters: { type: [TheaterSchema], default: [] },
  relations: { type: [DefenseRelationSchema], default: [] },

  metrics: {
    type: DefenseMetricsSchema,
    default: () => ({
      systemEscalationRisk: 0,
      allianceCohesion: 0.5,
      deterrenceBalance: 0,
      activeConflictCount: 0
    })
  }
});

export default DefenseWorldStateSchema;
