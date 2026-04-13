// src/scripts/seedDomainConfig.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import DomainConfig from "../models/DomainConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

async function run() {
  console.log("Connecting to MongoDB...");

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB || "agent_platform",
  });

  console.log("Connected ✔");

  console.log("Clearing existing DomainConfigs...");
  await DomainConfig.deleteMany({ domain: "political" });

  console.log("Seeding fresh DomainConfig...");

  const political = {
    domain: "political",
    displayName: "Political Cognition",
    description: "Simulated political stance & topic interactions.",

    topics: [
      {
        key: "civil_liberties",
        label: "Civil Liberties",
        description: "Rights, freedoms, government overreach.",
        defaults: { stance: 0, certainty: 0.4, volatility: 0.7 },
      },
      {
        key: "immigration",
        label: "Immigration",
        description: "Border policy, migration, labor effects.",
        defaults: { stance: 0, certainty: 0.5, volatility: 0.6 },
      },
      {
        key: "economy",
        label: "Economy",
        description: "Jobs, growth, inflation, wages.",
        defaults: { stance: 0, certainty: 0.6, volatility: 0.5 },
      },
      {
        key: "healthcare",
        label: "Healthcare",
        description: "Access, insurance, medical policy.",
        defaults: { stance: 0, certainty: 0.4, volatility: 0.6 },
      },
      {
        key: "policing",
        label: "Policing & Security",
        description: "Law enforcement, crime, justice reform.",
        defaults: { stance: 0, certainty: 0.5, volatility: 0.7 },
      },
      {
        key: "elections",
        label: "Elections & Voting",
        description: "Legitimacy, voting rights, institutions.",
        defaults: { stance: 0, certainty: 0.5, volatility: 0.6 },
      },
      {
        key: "foreign_policy",
        label: "Foreign Policy",
        description: "Conflict, alliances, global strategy.",
        defaults: { stance: 0, certainty: 0.5, volatility: 0.6 },
      },
    ],

    influences: [
      { from: "immigration", to: "economy", weight: 0.4 },
      { from: "policing", to: "civil_liberties", weight: -0.3 },
      { from: "economy", to: "elections", weight: 0.5 },
      { from: "foreign_policy", to: "elections", weight: 0.2 },
      { from: "civil_liberties", to: "policing", weight: -0.4 },
    ],
  };

  await DomainConfig.create(political);

  console.log("Political DomainConfig seeded ✔");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
