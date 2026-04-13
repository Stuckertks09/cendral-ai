import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1 };
const boundedSigned = { type: Number, min: -1, max: 1 };

const ContentTopicSchema = new Schema({
  topic: { type: String, required: true, trim: true }, 
  heat: { ...bounded01, default: 0.3 },          // how “hot” this topic is in the environment
  saturation: { ...bounded01, default: 0.2 },    // feed saturation (algorithm pushing it)
  polarity: { ...boundedSigned, default: 0 },    // positive/negative sentiment in the ecosystem
}, { _id: false });

const CreatorSchema = new Schema({
  creatorId: String,
  influence: { ...bounded01, default: 0.3 },       // how influential across personas
  trust: { ...bounded01, default: 0.5 },
  virality: { ...bounded01, default: 0.2 },        // prob content spreads globally
}, { _id: false });

const FeedDynamicsSchema = new Schema({
  recencyBias: { ...bounded01, default: 0.7 },
  noveltyBias: { ...bounded01, default: 0.5 },
  diversityBias: { ...bounded01, default: 0.3 },
  personalizationStrength: { ...bounded01, default: 0.6 }
}, { _id: false });

const ContentWorldStateSchema = new Schema({
  topics: { type: [ContentTopicSchema], default: [] },
  creators: { type: [CreatorSchema], default: [] },

  feedDynamics: FeedDynamicsSchema,

  // global content climate
  sentiment: {
    positive: { ...bounded01, default: 0.4 },
    negative: { ...bounded01, default: 0.3 },
    ironic: { ...bounded01, default: 0.2 },
    outrage: { ...bounded01, default: 0.2 }
  },

  trends: [{
    label: String,
    strength: { ...bounded01, default: 0.3 },
    spreadRate: { ...bounded01, default: 0.2 },
    decayRate: { ...bounded01, default: 0.5 }
  }]
}, { _id: false });

export default ContentWorldStateSchema;
