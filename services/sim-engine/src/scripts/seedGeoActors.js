// src/scripts/seedGeoActors.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import GeoActor from "../core/actors/GeoActor.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/* ---------------------------------------------------------
   ACTOR SEED DATA
--------------------------------------------------------- */

const ACTORS = [
  {
    key: "usa",
    label: "United States",
    type: "state",
    leaders: [{ leaderKey: "biden", isPrimary: true }],
    military: {
      strength: 0.95,
      readiness: 0.8,
      nuclearPosture: 0.6,
      cyberCapability: 0.9,
      navalStrength: 0.95,
    },
    doctrine: {
      hawkishness: 0.2,
      autonomy: -0.3, // multilateral leaning
      escalationTolerance: 0.4,
    },
    relations: [
      { target: "china", type: "rival", trust: 0.2, hostility: 0.6 },
      { target: "russia", type: "rival", trust: 0.1, hostility: 0.7 },
      { target: "israel", type: "ally", trust: 0.8, hostility: 0.1 },
      { target: "uk", type: "ally", trust: 0.9, hostility: 0.05 },
      { target: "nato", type: "ally", trust: 0.95, hostility: 0.05 },
    ],
    presence: [
      { theaterKey: "indo_pacific", forceLevel: 0.8, posture: "defensive" },
      { theaterKey: "eastern_europe", forceLevel: 0.7, posture: "defensive" },
      { theaterKey: "middle_east", forceLevel: 0.6, posture: "watching" },
      { theaterKey: "cyber", forceLevel: 0.9, posture: "offensive" },
    ],
  },

  {
    key: "china",
    label: "People's Republic of China",
    type: "state",
    leaders: [{ leaderKey: "xi_jinping", isPrimary: true }],
    military: {
      strength: 0.9,
      readiness: 0.75,
      nuclearPosture: 0.4,
      cyberCapability: 0.85,
      navalStrength: 0.92,
    },
    doctrine: {
      hawkishness: 0.5,
      autonomy: 0.6, // unilateral leaning
      escalationTolerance: 0.5,
    },
    relations: [
      { target: "usa", type: "rival", trust: 0.15, hostility: 0.7 },
      { target: "russia", type: "ally", trust: 0.65, hostility: 0.2 },
      { target: "nato", type: "rival", trust: 0.15, hostility: 0.5 },
      { target: "taiwan", type: "rival", trust: 0.05, hostility: 0.9 },
    ],
    presence: [
      { theaterKey: "indo_pacific", forceLevel: 0.9, posture: "offensive" },
      { theaterKey: "taiwan_strait", forceLevel: 0.95, posture: "offensive" },
      { theaterKey: "south_china_sea", forceLevel: 0.9, posture: "offensive" },
      { theaterKey: "cyber", forceLevel: 0.85, posture: "offensive" },
    ],
  },

  {
    key: "russia",
    label: "Russian Federation",
    type: "state",
    leaders: [{ leaderKey: "putin", isPrimary: true }],
    military: {
      strength: 0.75,
      readiness: 0.6,
      nuclearPosture: 0.8,
      cyberCapability: 0.7,
      navalStrength: 0.5,
    },
    doctrine: {
      hawkishness: 0.7,
      autonomy: 0.7,
      escalationTolerance: 0.8,
    },
    relations: [
      { target: "china", type: "ally", trust: 0.6, hostility: 0.2 },
      { target: "usa", type: "rival", trust: 0.1, hostility: 0.8 },
      { target: "nato", type: "rival", trust: 0.05, hostility: 0.9 },
      { target: "ukraine", type: "rival", trust: 0.05, hostility: 0.95 },
    ],
    presence: [
      { theaterKey: "eastern_europe", forceLevel: 0.95, posture: "offensive" },
      { theaterKey: "arctic", forceLevel: 0.7, posture: "defensive" },
      { theaterKey: "cyber", forceLevel: 0.8, posture: "offensive" },
    ],
  },

  {
    key: "israel",
    label: "Israel",
    type: "state",
    leaders: [{ leaderKey: "netanyahu", isPrimary: true }],
    military: {
      strength: 0.8,
      readiness: 0.85,
      nuclearPosture: 0.4,
      cyberCapability: 0.9,
      navalStrength: 0.4,
    },
    doctrine: {
      hawkishness: 0.6,
      autonomy: 0.4,
      escalationTolerance: 0.65,
    },
    relations: [
      { target: "usa", type: "ally", trust: 0.9, hostility: 0.05 },
      { target: "iran", type: "rival", trust: 0.05, hostility: 0.95 },
      { target: "gaza", type: "rival", trust: 0.05, hostility: 0.95 },
    ],
    presence: [
      { theaterKey: "middle_east", forceLevel: 0.9, posture: "offensive" },
      { theaterKey: "cyber", forceLevel: 0.8, posture: "offensive" },
    ],
  },

  {
    key: "iran",
    label: "Iran",
    type: "state",
    leaders: [{ leaderKey: "khamenei", isPrimary: true }],
    military: {
      strength: 0.6,
      readiness: 0.55,
      nuclearPosture: 0.5,
      cyberCapability: 0.7,
      navalStrength: 0.3,
    },
    doctrine: {
      hawkishness: 0.65,
      autonomy: 0.8,
      escalationTolerance: 0.7,
    },
    relations: [
      { target: "israel", type: "rival", trust: 0.05, hostility: 0.95 },
      { target: "usa", type: "rival", trust: 0.1, hostility: 0.8 },
      { target: "russia", type: "ally", trust: 0.4, hostility: 0.2 },
    ],
    presence: [
      { theaterKey: "middle_east", forceLevel: 0.7, posture: "offensive" },
      { theaterKey: "cyber", forceLevel: 0.7, posture: "offensive" },
    ],
  },

  {
    key: "ukraine",
    label: "Ukraine",
    type: "state",
    leaders: [{ leaderKey: "zelensky", isPrimary: true }],
    military: {
      strength: 0.45,
      readiness: 0.8,
      nuclearPosture: 0,
      cyberCapability: 0.6,
      navalStrength: 0.1,
    },
    doctrine: {
      hawkishness: 0.4,
      autonomy: -0.2,
      escalationTolerance: 0.3,
    },
    relations: [
      { target: "russia", type: "rival", trust: 0.05, hostility: 0.95 },
      { target: "usa", type: "ally", trust: 0.85, hostility: 0.1 },
      { target: "nato", type: "ally", trust: 0.9, hostility: 0.1 },
    ],
    presence: [
      { theaterKey: "ukraine", forceLevel: 1.0, posture: "defensive" },
      { theaterKey: "cyber", forceLevel: 0.7, posture: "defensive" },
    ],
  },

  {
    key: "uk",
    label: "United Kingdom",
    type: "state",
    leaders: [{ leaderKey: "sunak", isPrimary: true }],
    military: {
      strength: 0.6,
      readiness: 0.7,
      nuclearPosture: 0.5,
      cyberCapability: 0.7,
      navalStrength: 0.6,
    },
    doctrine: {
      hawkishness: 0.3,
      autonomy: -0.3,
      escalationTolerance: 0.35,
    },
    relations: [
      { target: "usa", type: "ally", trust: 0.9, hostility: 0.05 },
      { target: "nato", type: "ally", trust: 0.95, hostility: 0.05 },
      { target: "china", type: "rival", trust: 0.2, hostility: 0.6 },
      { target: "russia", type: "rival", trust: 0.1, hostility: 0.7 },
    ],
    presence: [
      { theaterKey: "eastern_europe", forceLevel: 0.6, posture: "defensive" },
      { theaterKey: "cyber", forceLevel: 0.8, posture: "offensive" },
    ],
  },

  {
    key: "nato",
    label: "NATO Alliance",
    type: "bloc",
    leaders: [{ leaderKey: "stoltenberg", isPrimary: true }],
    military: {
      strength: 0.99,
      readiness: 0.75,
      nuclearPosture: 0.7,
      cyberCapability: 0.85,
      navalStrength: 0.9,
    },
    doctrine: {
      hawkishness: 0.25,
      autonomy: -0.8, // deeply multilateral
      escalationTolerance: 0.25,
    },
    relations: [
      { target: "russia", type: "rival", trust: 0.1, hostility: 0.85 },
      { target: "usa", type: "ally", trust: 0.95, hostility: 0.05 },
      { target: "uk", type: "ally", trust: 0.95, hostility: 0.05 },
    ],
    presence: [
      { theaterKey: "eastern_europe", forceLevel: 0.85, posture: "defensive" },
      { theaterKey: "arctic", forceLevel: 0.4, posture: "watching" },
      { theaterKey: "cyber", forceLevel: 0.8, posture: "offensive" },
    ],
  },
];

/* ---------------------------------------------------------
   SEED SCRIPT
--------------------------------------------------------- */

async function run() {
  try {
    console.log("Connecting to MongoDB…");

    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || "agent_platform",
    });

    console.log("✔ Connected");

    console.log("Clearing existing GeoActors…");
    await GeoActor.deleteMany({});

    console.log("Seeding GeoActors…");
    await GeoActor.insertMany(ACTORS);

    console.log("✔ GeoActors seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

run();
