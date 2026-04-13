// models/CorePersona.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

/* -----------------------------------------------------
   1. IDENTITY
----------------------------------------------------- */

const DemographicsSchema = new Schema({
  age: Number,
  ageBand: { type: String, enum: ['18-29','30-44','45-64','65+'] },

  gender: String,
  sex: String,
  pronouns: String,

  ethnicity: String,
  race: String,

  nationality: String,
  citizenship: [String],
  immigrationStatus: String,

  maritalStatus: String,

  household: {
    adults: Number,
    children: Number,
    dependents: Number,
    incomeBand: String,
    livingSituation: String
  },

  socioeconomic: {
    classSelfImage: {
      type: String,
      enum: ['working','middle','upper','uncertain']
    },
    objectiveClass: String,
    wealthScore: { ...bounded(0, 1) }
  },

  religion: {
    affiliation: String,
    activityLevel: { ...bounded(0, 1) }
  },

  geography: {
    country: String,
    state: String,
    county: String,
    region_major: String,
    region_sub: String,
    urbanicity: { type: String, enum: ['urban','suburban','rural'] }
  }
}, { _id: false });


const IdentitySchema = new Schema({
  name: { type: String, required: true, trim: true },
  aliases: [{ type: String, trim: true }],
  avatarUrl: String,

  demographics: DemographicsSchema,

  selfImage: {
    narrative: String,
    othersView: String
  }
}, { _id: false });


/* -----------------------------------------------------
   2. BACKGROUND
----------------------------------------------------- */

const KeyEventSchema = new Schema({
  title: { type: String, required: true, trim: true },
  year: Number,
  type: String,
  impact: bounded(0, 1),
  notes: String
}, { _id: false });

const BackgroundSchema = new Schema({
  upbringing: {
    stability: String,
    socioeconomic: String,
    trauma: [String]
  },
  family: Schema.Types.Mixed,

  education: [{
    institution: String,
    field: String,
    level: String,
    graduationYear: Number
  }],

  cultureAndIdentity: {
    religion: String,
    practices: [String],
    culturalInfluences: [String]
  },

  keyEvents: [KeyEventSchema]
}, { _id: false });


/* -----------------------------------------------------
   3. VALUES, BELIEFS, GOALS
----------------------------------------------------- */

const ValueSchema = new Schema({
  name: { type: String, required: true },
  priority: { ...bounded(0, 1), default: 0.5 }
}, { _id: false });

const BeliefSchema = new Schema({
  domain: { type: String, required: true, index: true },
  statement: { type: String, required: true, trim: true },
  salience: bounded(0, 1),
  confidence: bounded(0, 1),
  intensity: bounded(0, 1),
  plasticity: bounded(0, 1),
  contradictions: [String]
}, { _id: false });

const GoalSchema = new Schema({
  name: { type: String, required: true },
  priority: { ...bounded(0, 1), default: 0.5 }
}, { _id: false });


/* -----------------------------------------------------
   4. PSYCHOLOGY
----------------------------------------------------- */

const TraitsSchema = new Schema({
  openness: bounded(0, 1),
  conscientiousness: bounded(0, 1),
  extraversion: bounded(0, 1),
  agreeableness: bounded(0, 1),
  neuroticism: bounded(0, 1)
}, { _id: false });


const IntentSchema = new Schema({
  intent: String,
  freq: Number,
  lastUsed: Date
}, { _id: false });


const PsychologySchema = new Schema({
  traits: TraitsSchema,

  baselineMood: String,
  currentMood: String,

  arousal: bounded(0, 1),
  valence: { type: Number, min: -1, max: 1 },

  fears: [String],
  triggers: [String],
  regulationStyle: String,

  intentProfile: [IntentSchema]
}, { _id: false });


/* -----------------------------------------------------
   5. REASONING ENGINE FIELDS
----------------------------------------------------- */

const PolicyRuleSchema = new Schema({
  trigger: String,
  action: String,
  threshold: bounded(0, 1)
}, { _id: false });

const WorldSensitivitySchema = new Schema({
  economic: bounded(0, 1),
  social: bounded(0, 1),
  threat: bounded(0, 1),
  institutional: bounded(0, 1),
  novelty: bounded(0, 1)
}, { _id: false });


/* -----------------------------------------------------
   6. SOCIAL GRAPH
----------------------------------------------------- */

const RelationshipSchema = new Schema({
  targetType: { type: String, enum: ['persona','external'], required: true },
  targetId: { type: String, required: true },
  targetName: String,

  type: { 
    type: String, 
    enum: ['friend','enemy','ally','mentor','mentee','colleague','rival'], 
    required: true 
  },

  category: {
    type: String,
    enum: ['family','friend','acquaintance','colleague','neighbor','romantic','rival','enemy','ally'],
    default: 'friend'
  },

  score: bounded(0, 1),
  confidence: bounded(0, 1),

  since: { type: Date, default: Date.now },
  lastInteraction: Date,
  notes: String
}, { _id: false });


/* -----------------------------------------------------
   7. COMMUNICATION STYLE
----------------------------------------------------- */

const CommunicationSchema = new Schema({
  style: [String],
  conflictStyle: String,

  voiceSliders: {
    wit: bounded(0, 1),
    authority: bounded(0, 1),
    warmth: bounded(0, 1),
    playfulness: bounded(0, 1),
    brevity: bounded(0, 1),
    formality: bounded(0, 1)
  }
}, { _id: false });


/* -----------------------------------------------------
   8. MEMORY INTERFACE
----------------------------------------------------- */

const MemorySchema = new Schema({
  episodic: [String],   // references to memory documents
  semantic: [String],
  working: [String]
}, { _id: false });


/* -----------------------------------------------------
   9. ACTION SPACE
----------------------------------------------------- */

const ActionSpaceSchema = new Schema({
  actions: [String] // allowed cognitive/simulation actions
}, { _id: false });


/* -----------------------------------------------------
   10. EXTENSIONS CONTAINER
----------------------------------------------------- */

const ExtensionsSchema = new Schema({
  political: Schema.Types.Mixed,
  consumer: Schema.Types.Mixed,
  enterprise: Schema.Types.Mixed,
  marketing: Schema.Types.Mixed,
  content: Schema.Types.Mixed,
  game: Schema.Types.Mixed,
  therapeutic: Schema.Types.Mixed
}, { _id: false });


/* -----------------------------------------------------
   CORE PERSONA SCHEMA
----------------------------------------------------- */

const CorePersonaSchema = new Schema({
  _id: { type: String, required: true }, // stable slug

  identity: IdentitySchema,
  background: BackgroundSchema,

  values: [ValueSchema],
  beliefs: [BeliefSchema],
  goals: [GoalSchema],

  psychology: PsychologySchema,

  policies: [PolicyRuleSchema],
  worldSensitivity: WorldSensitivitySchema,

  social: {
    relationships: [RelationshipSchema]
  },

  communication: CommunicationSchema,

  memory: MemorySchema,
  actionSpace: ActionSpaceSchema,

  extensions: ExtensionsSchema,

  meta: {
    schemaVersion: { type: Number, default: 1 },
    updatedAt: { type: Date, default: Date.now }
  }
}, { timestamps: true });

CorePersonaSchema.pre('save', function() {
  this.meta = this.meta || {};
  this.meta.updatedAt = new Date();
});

// TEMP: mock cognition methods so simulation runs
CorePersonaSchema.methods.generatePerception = async function(event, domain) {
  return {
    domain,
    eventType: event.type || "unknown",
    perceivedThreat: Math.random() * 0.4,   // 0–0.4
    perceivedOpportunity: Math.random() * 0.4,
    summary: `Mock perception for ${this.identity?.name}`
  };
};

CorePersonaSchema.methods.generateArgument = async function({ event, perception, worldState, domain }) {
  return {
    personaId: this._id,
    domain,
    position: {
      support: (Math.random() * 2 - 1).toFixed(3), // -1 to 1
      certainty: Math.random().toFixed(3)
    },
    reasoning: [
      "Personal core values",
      "Mock external factors",
      "Domain worldview filter"
    ],
    perception
  };
};


const CorePersona =
  mongoose.models.CorePersona ||
  mongoose.model('CorePersona', CorePersonaSchema);

export default CorePersona;
