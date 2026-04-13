// extensions/political/worldState.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1, default: 0 };
const boundedSigned = { type: Number, min: -1, max: 1, default: 0 };

const PoliticalTopicSchema = new Schema({
  topic: { type: String, required: true },   // machine key
  label: { type: String, trim: true },       // <--- ADD THIS
  stance: boundedSigned,
  certainty: bounded01,
  volatility: bounded01
}, { _id: false });

const PoliticalEdgeSchema = new Schema({
  from: String,
  to: String,
  weight: boundedSigned
}, { _id: false });

const PoliticalMetricsSchema = new Schema({
  polarization: bounded01,
  radicalization: bounded01,
  instability: bounded01
}, { _id: false });

const PoliticalWorldStateSchema = new Schema({
  topics: { type: [PoliticalTopicSchema], default: [] },
  topicEdges: { type: [PoliticalEdgeSchema], default: [] },

  metrics: {
    type: PoliticalMetricsSchema,
    default: () => ({
      polarization: 0,
      radicalization: 0,
      instability: 0
    })
  }
});

export default PoliticalWorldStateSchema;
