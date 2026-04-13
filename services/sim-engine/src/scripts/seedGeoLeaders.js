// src/scripts/seedGeoLeaders.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import GeoLeader from "../core/actors/GeoLeader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/* ---------------------------------------------------------
   LEADER SEED DATA
--------------------------------------------------------- */

const LEADERS = [
  {
    key: "biden",
    actorKey: "usa",
    name: "Joe Biden",
    title: "President",
    approval: 0.42,
    stability: 0.7,
    ideology: {
      hawkishness: 0.2,
      authoritarianism: -0.3,
      nationalism: 0.4,
      riskTolerance: 0.3,
    },
    crisisResponse: {
      escalationBias: 0.3,
      diplomacyBias: 0.7,
      allianceLoyalty: 0.9,
      deterrenceFocus: 0.6,
    },
    doctrineInfluence: {
      militaryPosture: 0.4,
      economicPosture: 0.5,
      globalOrderEngagement: 0.9,
    },
    term: { startYear: 2021, active: true },
  },

  {
    key: "xi_jinping",
    actorKey: "china",
    name: "Xi Jinping",
    title: "General Secretary",
    approval: 0.8,
    stability: 0.95,
    ideology: {
      hawkishness: 0.6,
      authoritarianism: 0.9,
      nationalism: 0.85,
      riskTolerance: 0.55,
    },
    crisisResponse: {
      escalationBias: 0.55,
      diplomacyBias: 0.4,
      allianceLoyalty: 0.3,
      deterrenceFocus: 0.7,
    },
    doctrineInfluence: {
      militaryPosture: 0.8,
      economicPosture: 0.6,
      globalOrderEngagement: 0.7,
    },
    term: { startYear: 2012, active: true },
  },

  {
    key: "putin",
    actorKey: "russia",
    name: "Vladimir Putin",
    title: "President",
    approval: 0.6,
    stability: 0.9,
    ideology: {
      hawkishness: 0.8,
      authoritarianism: 0.95,
      nationalism: 0.9,
      riskTolerance: 0.75,
    },
    crisisResponse: {
      escalationBias: 0.75,
      diplomacyBias: 0.25,
      allianceLoyalty: 0.2,
      deterrenceFocus: 0.8,
    },
    doctrineInfluence: {
      militaryPosture: 0.85,
      economicPosture: 0.4,
      globalOrderEngagement: 0.3,
    },
    term: { startYear: 2000, active: true },
  },

  {
    key: "netanyahu",
    actorKey: "israel",
    name: "Benjamin Netanyahu",
    title: "Prime Minister",
    approval: 0.35,
    stability: 0.6,
    ideology: {
      hawkishness: 0.7,
      authoritarianism: 0.4,
      nationalism: 0.7,
      riskTolerance: 0.6,
    },
    crisisResponse: {
      escalationBias: 0.7,
      diplomacyBias: 0.4,
      allianceLoyalty: 0.8,
      deterrenceFocus: 0.7,
    },
    doctrineInfluence: {
      militaryPosture: 0.8,
      economicPosture: 0.3,
      globalOrderEngagement: 0.5,
    },
    term: { startYear: 2022, active: true },
  },

  {
    key: "khamenei",
    actorKey: "iran",
    name: "Ali Khamenei",
    title: "Supreme Leader",
    approval: 0.3,
    stability: 0.9,
    ideology: {
      hawkishness: 0.75,
      authoritarianism: 0.95,
      nationalism: 0.6,
      riskTolerance: 0.7,
    },
    crisisResponse: {
      escalationBias: 0.8,
      diplomacyBias: 0.3,
      allianceLoyalty: 0.2,
      deterrenceFocus: 0.75,
    },
    doctrineInfluence: {
      militaryPosture: 0.85,
      economicPosture: 0.4,
      globalOrderEngagement: 0.2,
    },
    term: { startYear: 1989, active: true },
  },

  {
    key: "zelensky",
    actorKey: "ukraine",
    name: "Volodymyr Zelensky",
    title: "President",
    approval: 0.55,
    stability: 0.5,
    ideology: {
      hawkishness: 0.45,
      authoritarianism: -0.1,
      nationalism: 0.7,
      riskTolerance: 0.5,
    },
    crisisResponse: {
      escalationBias: 0.5,
      diplomacyBias: 0.6,
      allianceLoyalty: 0.9,
      deterrenceFocus: 0.6,
    },
    doctrineInfluence: {
      militaryPosture: 0.7,
      economicPosture: 0.5,
      globalOrderEngagement: 0.6,
    },
    term: { startYear: 2019, active: true },
  },

  {
    key: "sunak",
    actorKey: "uk",
    name: "Rishi Sunak",
    title: "Prime Minister",
    approval: 0.3,
    stability: 0.6,
    ideology: {
      hawkishness: 0.3,
      authoritarianism: 0.2,
      nationalism: 0.4,
      riskTolerance: 0.3,
    },
    crisisResponse: {
      escalationBias: 0.3,
      diplomacyBias: 0.7,
      allianceLoyalty: 0.8,
      deterrenceFocus: 0.5,
    },
    doctrineInfluence: {
      militaryPosture: 0.4,
      economicPosture: 0.6,
      globalOrderEngagement: 0.7,
    },
    term: { startYear: 2022, active: true },
  },

  {
    key: "stoltenberg",
    actorKey: "nato",
    name: "Jens Stoltenberg",
    title: "Secretary General",
    approval: 0.7,
    stability: 0.85,
    ideology: {
      hawkishness: 0.25,
      authoritarianism: -0.2,
      nationalism: 0.3,
      riskTolerance: 0.25,
    },
    crisisResponse: {
      escalationBias: 0.2,
      diplomacyBias: 0.8,
      allianceLoyalty: 1.0,
      deterrenceFocus: 0.7,
    },
    doctrineInfluence: {
      militaryPosture: 0.6,
      economicPosture: 0.4,
      globalOrderEngagement: 1.0,
    },
    term: { startYear: 2014, active: true },
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

    console.log("Clearing existing GeoLeaders…");
    await GeoLeader.deleteMany({});

    console.log("Seeding GeoLeaders…");
    await GeoLeader.insertMany(LEADERS);

    console.log("✔ GeoLeaders seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

run();
