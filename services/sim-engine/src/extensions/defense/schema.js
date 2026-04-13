// extensions/defense/schema.js
import mongoose from "mongoose";

const { Schema } = mongoose;

const bounded = (min, max, def) => ({
  type: Number,
  min,
  max,
  default: def
});

const ThreatPerceptionSchema = new Schema(
  {
    key: { type: String, required: true }, // e.g. "eastern_europe", "indo_pacific", "cyber"
    label: { type: String, trim: true },   // human label
    level: bounded(0, 1, 0.5),             // perceived threat intensity
    volatility: bounded(0, 1, 0.5)         // how fast perception shifts
  },
  { _id: false }
);

const AllianceSchema = new Schema(
  {
    partner: { type: String, required: true }, // machine key: "nato", "japan", "australia"
    label: { type: String, trim: true },
    commitment: bounded(0, 1, 0.7),           // how strongly they support this alliance
    dependence: bounded(0, 1, 0.5)            // how much they rely on this partner
  },
  { _id: false }
);

const CapabilityPreferenceSchema = new Schema(
  {
    domain: { type: String, required: true }, // "land", "air", "sea", "cyber", "space"
    investmentPreference: bounded(0, 1, 0.5), // where they'd put more resources
    riskTolerance: bounded(0, 1, 0.5)         // willingness to use this domain first
  },
  { _id: false }
);

const DefensePostureSchema = new Schema(
  {
    escalationPreference: bounded(0, 1, 0.5),     // how quickly they escalate militarily
    deterrenceEmphasis: bounded(0, 1, 0.6),       // preference for deterrence vs. appeasement
    preemptionWillingness: bounded(0, 1, 0.3),    // willingness to strike first
    civilianRiskTolerance: bounded(0, 1, 0.2),    // tolerance for civilian harm
    multilateralPreference: bounded(0, 1, 0.7),   // preference to act through alliances
    secrecyPreference: bounded(0, 1, 0.5)         // covert vs overt ops
  },
  { _id: false }
);

const DefenseExtensionSchema = new Schema(
  {
    doctrine: {
      // high-level orientation
      hawkishDovish: bounded(-1, 1, 0),          // -1 very dovish, +1 very hawkish
      interventionistIsolationist: bounded(-1, 1, 0),
      unilateralMultilateral: bounded(-1, 1, 0)
    },

    role: {
      // how they see their country in the world
      greatPowerAspirations: bounded(0, 1, 0.5),
      regionalStabilityPriority: bounded(0, 1, 0.6),
      globalOrderCommitment: bounded(0, 1, 0.6)
    },

    posture: DefensePostureSchema,

    /**
     * Regional/domain threat maps
     */
    threatPerception: [ThreatPerceptionSchema],

    /**
     * Alliances & security partnerships
     */
    alliances: [AllianceSchema],

    /**
     * Capability preferences: which tools they favor
     */
    capabilityPreferences: [CapabilityPreferenceSchema],

    /**
     * Exposure to security / defense information sources
     */
    intelFeeds: [
      {
        source: { type: String, required: true }, // "official_briefings", "media", "social"
        trust: bounded(0, 1, 0.7),
        frequency: bounded(0, 1, 0.5)            // how often they rely on it
      }
    ]
  },
  { _id: false }
);

export default DefenseExtensionSchema;
