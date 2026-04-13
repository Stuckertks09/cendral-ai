// src/scripts/seedConfigState.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import {
  getOrCreateCognitionSettings
} from "../core/cognition/CoreSettings.js";
import {
  getOrCreateMemorySettings
} from "../models/MemorySettings.js";
import {
  getOrCreateSystemSettings
} from "../core/systems/systemSettings.js";

import DomainConfig from "../models/DomainConfig.js";
import ConfigPackage from "../models/ConfigPackage.js";

/* --------------------------------------------------
 * ENV BOOTSTRAP
 * -------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../../../.env"),
});

if (!process.env.MONGO_URI) {
  throw new Error("❌ MONGO_URI is not defined");
}

/* --------------------------------------------------
 * SCRIPT
 * -------------------------------------------------- */

async function run() {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: process.env.MONGO_DB || "agent_platform",
  });

  console.log("📦 Seeding baseline ConfigPackage…");

  /* ---------------------------------------------
   * LOAD CANONICAL SINGLETON SETTINGS
   * --------------------------------------------- */

  const cognitionDoc = await getOrCreateCognitionSettings();
  const memoryDoc = await getOrCreateMemorySettings();
  const systemDoc = await getOrCreateSystemSettings();

  if (!cognitionDoc || !memoryDoc || !systemDoc) {
    throw new Error("❌ Missing canonical settings documents");
  }

  // Convert to plain objects (strip mongoose internals)
  const cognition = cognitionDoc.toObject({ depopulate: true });
  const memory = memoryDoc.toObject({ depopulate: true });

  /**
   * 🔑 CRITICAL SYSTEM MAPPING
   *
   * SystemRegistry resolves settings via:
   *   settings[SystemClass.name]
   *
   * Therefore:
   *  - DB keys (economic, environment, etc) are CANONICAL
   *  - ConfigPackage keys MUST be runtime system names
   */
  const systems = {
    EconomicSystem: systemDoc.economic ?? {},
    EnvironmentSystem: systemDoc.environment ?? {},
    InfoFlowSystem: systemDoc.info ?? {},
    PopulationSystem: systemDoc.population ?? {},
  };

  /* ---------------------------------------------
   * DOMAIN CONFIGS (STRUCTURAL SEEDS)
   * --------------------------------------------- */

  const defenseDomain = await DomainConfig.findOne({
    domain: "defense",
    isActive: true,
  })
    .sort({ version: -1 })
    .lean();

  /* ---------------------------------------------
   * CREATE BASELINE PACKAGE
   * --------------------------------------------- */

  const baseline = await ConfigPackage.create({
    name: "Baseline (v1)",
    description: "Initial frozen baseline derived from canonical settings",
    tags: ["baseline", "default"],
    version: 1,

    cognition,
    memory,
    systems,

    /**
     * Domains are SEEDS, not live settings.
     * We store references or shallow snapshots only.
     */
    domains: {
      defense: defenseDomain
        ? { domainConfigId: defenseDomain._id }
        : {},
    },

    /**
     * Explicit enable list ensures determinism
     */
    enabledSystems: Object.keys(systems),

    createdBy: "system",
  });

  console.log("✅ Baseline ConfigPackage created:", baseline._id.toString());

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(async (err) => {
  console.error("❌ Failed to seed baseline config:", err);
  await mongoose.disconnect();
  process.exit(1);
});
