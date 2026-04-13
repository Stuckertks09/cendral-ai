// extensions/PoliticalExtension.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const TopicSchema = new Schema({
  topic: { type: String, required: true },
  stance: { type: Number, min: -1, max: 1, default: 0 },
  certainty: bounded(0, 1),
  volatility: bounded(0, 1)
}, { _id: false });

const PoliticalExtensionSchema = new Schema({
  ideology: {
    leftRight: bounded(-1, 1),
    authoritarianLibertarian: bounded(-1, 1),
    populistElite: bounded(-1, 1)
  },

  partyAffiliation: String,
  mediaDiet: [{
    source: String,
    trust: bounded(0, 1),
    exposure: bounded(0, 1)
  }],

  topics: [TopicSchema],

  influenceBias: {
    emotional: bounded(0, 1),
    identity: bounded(0, 1),
    authority: bounded(0, 1),
    groupLoyalty: bounded(0, 1)
  }
}, { _id: false });

export default PoliticalExtensionSchema;
