// src/models/GeoLeader.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const bounded = (min, max, def) => ({ type: Number, min, max, default: def });

const GeoLeaderSchema = new Schema({
  key: { type: String, required: true, unique: true },     // "biden", "xi_jinping"
  actorKey: { type: String, required: true, index: true }, // "usa", "china"

  name: { type: String, required: true },
  title: { type: String, default: "President" },           // PM, General Sec, Supreme Leader, etc.

  isPrimary: { type: Boolean, default: true },             // primary decision-maker

  // -------------------------
  // Leadership Attributes
  // -------------------------
  approval: bounded(0, 1, 0.5),
  stability: bounded(0, 1, 0.7), // likelihood of remaining in power

  ideology: {
    hawkishness: bounded(-1, 1, 0),       // dovish → hawkish
    authoritarianism: bounded(-1, 1, 0),  // libertarian → authoritarian
    nationalism: bounded(0, 1, 0.5),
    riskTolerance: bounded(0, 1, 0.4)
  },

  // -------------------------
  // Crisis Response Profile
  // -------------------------
  crisisResponse: {
    escalationBias: bounded(0, 1, 0.3),   // willingness to escalate in crises
    diplomacyBias: bounded(0, 1, 0.5),
    allianceLoyalty: bounded(0, 1, 0.6),
    deterrenceFocus: bounded(0, 1, 0.5)
  },

  // -------------------------
  // Influence in the actor’s doctrine
  // -------------------------
  doctrineInfluence: {
    militaryPosture: bounded(0, 1, 0.5),
    economicPosture: bounded(0, 1, 0.5),
    globalOrderEngagement: bounded(0, 1, 0.5)
  },

  // -------------------------
  // Internal Metadata
  // -------------------------
  term: {
    startYear: { type: Number },
    endYear: { type: Number },
    active: { type: Boolean, default: true }
  },

  updatedAt: { type: Date, default: Date.now }
});

GeoLeaderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.GeoLeader ||
  mongoose.model("GeoLeader", GeoLeaderSchema);
