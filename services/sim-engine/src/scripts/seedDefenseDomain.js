// src/scripts/seedDefenseDomain.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import DomainConfig from "../models/DomainConfig.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

/* ---------------------------------------------------------
   DEFENSE DOMAIN CONFIG
--------------------------------------------------------- */

const DEFENSE_THEATERS = [
  {
    key: "indo_pacific",
    label: "Indo-Pacific",
    category: "theater",
    description:
      "Primary theater of strategic competition involving China, U.S., Japan, Australia, Taiwan, and regional partners.",
    isPrimary: true,
    defaults: { stance: 0, certainty: 0.5, volatility: 0.5 },
    tags: ["china", "naval", "alliances"],
    metadata: {
      tension: 0.6,
      stability: 0.5,
      conflictProbability: 0.3,
      alliedPresence: 0.8,
      adversaryPresence: 0.7,
      escalationRisk: 0.4,
      hotspots: ["taiwan_strait", "south_china_sea", "korean_peninsula"],
    },
  },
  {
    key: "taiwan_strait",
    label: "Taiwan Strait",
    category: "sub-theater",
    defaults: { stance: 0, certainty: 0.6, volatility: 0.7 },
    metadata: {
      tension: 0.75,
      stability: 0.35,
      conflictProbability: 0.5,
      alliedPresence: 0.7,
      adversaryPresence: 0.9,
      escalationRisk: 0.6,
    },
  },
  {
    key: "south_china_sea",
    label: "South China Sea",
    category: "sub-theater",
    defaults: { stance: 0, certainty: 0.5, volatility: 0.6 },
    metadata: {
      tension: 0.7,
      stability: 0.4,
      conflictProbability: 0.35,
      alliedPresence: 0.6,
      adversaryPresence: 0.8,
    },
  },
  {
    key: "eastern_europe",
    label: "Eastern Europe",
    category: "theater",
    isPrimary: true,
    defaults: { stance: 0, certainty: 0.5, volatility: 0.7 },
    metadata: {
      tension: 0.8,
      stability: 0.3,
      conflictProbability: 0.6,
      alliedPresence: 0.8,
      adversaryPresence: 0.8,
      escalationRisk: 0.55,
    },
  },
  {
    key: "ukraine",
    label: "Ukraine Conflict Zone",
    category: "sub-theater",
    defaults: { stance: 0, certainty: 0.7, volatility: 0.8 },
    metadata: {
      tension: 0.9,
      stability: 0.2,
      conflictProbability: 0.95,
      escalationRisk: 0.65,
    },
  },
  {
    key: "middle_east",
    label: "Middle East",
    category: "theater",
    isPrimary: true,
    defaults: { stance: 0, certainty: 0.5, volatility: 0.7 },
    metadata: {
      tension: 0.75,
      stability: 0.25,
      conflictProbability: 0.5,
      hotspots: ["gaza", "red_sea", "iran_israel"],
    },
  },
  {
    key: "gaza",
    label: "Gaza Conflict",
    category: "sub-theater",
    defaults: { stance: 0, certainty: 0.7, volatility: 0.8 },
    metadata: {
      tension: 0.9,
      stability: 0.1,
      conflictProbability: 0.95,
      escalationRisk: 0.7,
    },
  },
  {
    key: "red_sea",
    label: "Red Sea / Bab al-Mandab",
    category: "sub-theater",
    defaults: { stance: 0, certainty: 0.5, volatility: 0.5 },
    metadata: {
      tension: 0.6,
      stability: 0.4,
      conflictProbability: 0.3,
    },
  },
  {
    key: "cyber",
    label: "Global Cyber Domain",
    category: "domain",
    isPrimary: true,
    defaults: { stance: 0, certainty: 0.6, volatility: 0.5 },
    metadata: {
      tension: 0.4,
      stability: 0.7,
      conflictProbability: 0.5,
      adversaryPresence: 0.8,
      alliedPresence: 0.5,
    },
  },
  {
    key: "space",
    label: "Space Domain",
    category: "domain",
    defaults: { stance: 0, certainty: 0.5, volatility: 0.6 },
    metadata: {
      tension: 0.3,
      stability: 0.8,
      conflictProbability: 0.2,
    },
  },
  {
    key: "arctic",
    label: "Arctic & North Atlantic",
    category: "theater",
    defaults: { stance: 0, certainty: 0.5, volatility: 0.4 },
    metadata: {
      tension: 0.4,
      stability: 0.7,
      conflictProbability: 0.15,
    },
  },
  {
    key: "latin_america",
    label: "Latin America",
    category: "theater",
    defaults: { stance: 0, certainty: 0.5, volatility: 0.4 },
    metadata: {
      tension: 0.2,
      stability: 0.6,
      conflictProbability: 0.1,
    },
  },
  {
    key: "sahel",
    label: "Sahel Region",
    category: "theater",
    defaults: { stance: 0, certainty: 0.5, volatility: 0.6 },
    metadata: {
      tension: 0.5,
      stability: 0.3,
      conflictProbability: 0.25,
      adversaryPresence: 0.6,
    },
  },
];

const DEFENSE_INFLUENCES = [
  {
    from: "eastern_europe",
    to: "indo_pacific",
    weight: 0.15,
    rationale: "Russian pressure encourages greater Indo-Pacific balancing.",
  },
  {
    from: "indo_pacific",
    to: "eastern_europe",
    weight: 0.1,
    rationale: "Chinese aggression affects NATO deterrence posture.",
  },
  {
    from: "cyber",
    to: "indo_pacific",
    weight: 0.05,
    rationale: "Cyber attacks elevate tension across geopolitical rivals.",
  },
  {
    from: "gaza",
    to: "middle_east",
    weight: 0.3,
    rationale: "Flashpoints drive regional escalation dynamics.",
  },
  {
    from: "ukraine",
    to: "eastern_europe",
    weight: 0.4,
    rationale: "Direct conflict drives NATO posture and readiness.",
  },
  {
    from: "arctic",
    to: "nato",
    weight: 0.1,
    rationale: "Arctic militarization affects northern alliance cohesion.",
  },
];

const DEFENSE_METRIC_DEFAULTS = {
  polarizationBaseline: 0.1,
  radicalizationBaseline: 0.15,
  instabilityBaseline: 0.25,
};

const DEFENSE_PROMPTS = {
  perception: `
Interpret this defense-related event considering: 
- threat perception
- alliance structures
- military doctrine
- escalation logic
- regional vs global strategic implications
`,
  argument: `
Generate competing defense arguments describing how this event should shift:
- theater tensions
- stability metrics
- conflict probability
- alliance cohesion
- deterrence balance
`,
  arbitration: `
Aggregate arguments into a coherent update for the Defense WorldState. 
Output adjustments for:
- tension
- stability
- conflict probability
- escalation risk
- alliance cohesion
- deterrence balance
`,
};

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

    console.log("Clearing existing Defense DomainConfig…");
    await DomainConfig.deleteMany({ domain: "defense" });

    console.log("Seeding Defense DomainConfig…");

    await DomainConfig.create({
      domain: "defense",
      displayName: "Defense & Strategic Cognition",
      description:
        "Models geopolitical theaters, alliance cohesion, conflict probability, and escalation dynamics.",
      version: 1,
      isActive: true,
      topics: DEFENSE_THEATERS,
      influences: DEFENSE_INFLUENCES,
      metricDefaults: DEFENSE_METRIC_DEFAULTS,
      prompts: DEFENSE_PROMPTS,
      context: { environment: "prod" },
      meta: { createdBy: "seed_script" },
    });

    console.log("✔ Defense DomainConfig seeded successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

run();
