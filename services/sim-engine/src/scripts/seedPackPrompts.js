// src/scripts/seedPromptPackDefense.js

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import PromptPack from "../models/PromptPack.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

async function run() {
  console.log("Connecting to MongoDB...");

  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB || "agent_platform",
  });

  console.log("✔ Connected");

  console.log("Clearing existing Defense PromptPacks…");
  await PromptPack.deleteMany({ domain: "defense" });

  console.log("Seeding Defense PromptPack (default_v1)…");

  const defensePack = {
    domain: "defense",
    key: "default_v1",
    environment: "prod",

    systemPrompt: `
You are a strategic cognition engine specializing in defense analysis.
You evaluate:
- geopolitical theaters
- strategic intent
- escalation dynamics
- alliance cohesion
- adversary response patterns
- deterrence signals

Always output STRICT JSON with no commentary.
    `.trim(),

    perceptionPrompt: `
Analyze the defense-related event and produce a structured perception model:

Focus on:
- Threat origin and type (kinetic, cyber, political, proxy, naval, airspace)
- Likely intent (probing, signaling, coercion, accidental, preparation)
- Affected theaters
- Severity and uncertainty
- Time horizon (immediate / near-term / long-term)

Output STRICT JSON:
{
  "threatFactors": {
    "type": "...",
    "intent": "...",
    "capabilityShift": 0-1,
    "surprise": 0-1
  },
  "primaryTheaters": ["indo_pacific", "eastern_europe"],
  "riskAssessment": {
    "immediacy": 0-1,
    "severity": 0-1,
    "uncertainty": 0-1
  }
}
    `.trim(),

    argumentPrompt: `
Generate competing defense interpretations.

For each viewpoint, analyze:
- How the event shifts theater tension
- What it implies about escalation or stability
- How actors and leaders might react
- Impact on alliances, deterrence, or adversary confidence

Output STRICT JSON:
{
  "arguments": [
    {
      "theater": "indo_pacific",
      "direction": "increase_tension" | "decrease_tension",
      "magnitude": 0-1,
      "rationale": "string"
    }
  ]
}
    `.trim(),

    arbitrationPrompt: `
Merge all reasoning into final world-state deltas.

Consider:
- Perception stage factors
- Strength of arguments
- Leader intent and doctrine
- Actor relations and alliances
- Escalation dynamics
- System-level effects

Output STRICT JSON:
{
  "topicUpdates": {
    "theater_key": {
      "stanceDelta": -1 to 1,
      "certaintyDelta": -1 to 1,
      "volatilityDelta": -1 to 1
    }
  },
  "metrics": {
    "systemEscalationDelta": -1 to 1,
    "allianceCohesionDelta": -1 to 1,
    "deterrenceBalanceDelta": -1 to 1
  }
}
    `.trim(),

    metadata: {
      version: 1,
      author: "seed_script",
      notes: "Default v1 defense arbitration prompt pack",
      createdAt: new Date(),
    },
  };

  await PromptPack.create(defensePack);

  console.log("✔ Defense PromptPack seeded");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
