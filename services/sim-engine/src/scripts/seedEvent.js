// src/scripts/seedDeescalationEvent.ts
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import EventModel from "../core/events/CoreEvents.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DB || "agent_platform",
    });
    console.log("✔ Connected");

    // -----------------------------------------
    // De-escalation defense event
    // -----------------------------------------
    const event = {
      type: "news_update",
      domain: "defense",
      topic: "indo_pacific",
      severity: 0.3, // lower severity than crisis

      rawText:
        "Following days of high tension, naval vessels from both sides have withdrawn from the South China Sea flashpoint after successful emergency talks brokered by regional diplomats.",

      source: {
        origin: "seed_script",
        author: "system",
      },

      parsed: {
        sentiment: 0.35,
        summary:
          "Emergency diplomacy leads to mutual naval drawdown and a clear commitment to avoid further escalation in the South China Sea.",
        keywords: [
          "naval_withdrawal",
          "deescalation",
          "diplomatic_talks",
          "south_china_sea",
          "confidence_building"
        ],
      },
    };

    const created = await EventModel.create(event);

    console.log("✔ De-escalation event seeded:");
    console.log(created);

    console.log("\nUse this eventId in Postman:");
    console.log(created._id.toString());

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

run();
