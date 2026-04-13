// src/models/GeoActor.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const bounded = (min, max, def) => ({ type: Number, min, max, default: def });

const RelationSchema = new Schema(
  {
    target: String,                                 // e.g. "usa", "china"
    type: { type: String, enum: ["ally", "rival", "neutral"], default: "neutral" },
    trust: bounded(0, 1, 0.5),
    hostility: bounded(0, 1, 0.2)
  },
  { _id: false }
);

const TheaterPresenceSchema = new Schema(
  {
    theaterKey: String,
    forceLevel: bounded(0, 1, 0.5),
    posture: { type: String, enum: ["defensive", "offensive", "watching"], default: "defensive" }
  },
  { _id: false }
);

const GeoActorSchema = new Schema({
  key: { type: String, required: true, unique: true },      // "usa", "china"
  label: { type: String, required: true },                  // "United States"

  type: {
    type: String,
    enum: ["state", "bloc", "nonstate"],
    required: true
  },

  // -------------------------
  // Leaders (references)
  // -------------------------
  leaders: [
    {
      leaderKey: { type: String, required: true }, // reference to GeoLeader.key
      isPrimary: { type: Boolean, default: false }
    }
  ],

  // -------------------------
  // Capabilities
  // -------------------------
  military: {
    strength: bounded(0, 1, 0.5),
    readiness: bounded(0, 1, 0.5),
    nuclearPosture: bounded(0, 1, 0.2),
    cyberCapability: bounded(0, 1, 0.5),
    navalStrength: bounded(0, 1, 0.5)
  },

  // -------------------------
  // National Doctrine
  // -------------------------
  doctrine: {
    hawkishness: bounded(-1, 1, 0),
    autonomy: bounded(-1, 1, 0),
    escalationTolerance: bounded(0, 1, 0.3)
  },

  // -------------------------
  // Relations
  // -------------------------
  relations: [RelationSchema],

  // -------------------------
  // Presence by theater
  // -------------------------
  presence: [TheaterPresenceSchema],

  updatedAt: { type: Date, default: Date.now }
});

GeoActorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.GeoActor ||
  mongoose.model("GeoActor", GeoActorSchema);
