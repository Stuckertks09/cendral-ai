// src/scripts/printBaselineConfigPackage.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import ConfigPackage from "../models/ConfigPackage.js";

// -----------------------------
// ENV SETUP
// -----------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// -----------------------------
// SCRIPT
// -----------------------------
async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI not set");
  }

  await mongoose.connect(process.env.MONGO_URI, {
          dbName: process.env.MONGO_DB || "agent_platform",
        });
  console.log("🔌 Connected to MongoDB");

  // Find baseline (adjust filter if needed)
  const baseline = await ConfigPackage.findOne({
    tags: "baseline"
  }).lean();

  if (!baseline) {
    console.error("❌ No baseline ConfigPackage found");
    process.exit(1);
  }

  console.log("\n📦 BASELINE CONFIG PACKAGE\n");
  console.log(JSON.stringify(baseline, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
