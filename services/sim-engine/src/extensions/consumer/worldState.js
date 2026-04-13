// extensions/consumer/worldState.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1 };

const DemandSchema = new Schema({
  category: String,
  demand: bounded01
}, { _id: false });

const ConsumerWorldStateSchema = new Schema({
  buyingIntent: bounded01,
  brandTrust: bounded01,
  demandMap: [DemandSchema],
  churnRisk: bounded01
});

export default ConsumerWorldStateSchema;
