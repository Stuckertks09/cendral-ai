// src/routes/relationshipRoutes.js
import express from "express";

// Correct model imports
import CorePersona from "../core/persona/CorePersona.js";
import GeoActor from "../core/actors/GeoActor.js";
import GeoLeader from "../core/actors/GeoLeader.js";

// Service
import RelationshipBuilder from "../services/RelationshipBuilder.js";

export default function relationshipRoutes({ llmClient, graphMemory }) {
  const router = express.Router();

  if (!llmClient?.raw) {
    console.error("❌ relationshipRoutes: llmClient.raw is missing");
  }
  if (!graphMemory) {
    console.error("❌ relationshipRoutes: graphMemory is missing");
  }

  // Instantiate builder using the same pattern as cognitionRoutes
  const builder = new RelationshipBuilder({
    openai: llmClient.raw,
    graphMemory
  });

  // -----------------------------------------
  // POST /api/relationships/generate
  // -----------------------------------------
  router.post("/generate", async (req, res) => {
    try {
      // Load Mongo data
      const personas = await CorePersona.find().lean();
      const actors = await GeoActor.find().lean();
      const leaders = await GeoLeader.find().lean();

      // Build graph JSON using the LLM
      const graphJSON = await builder.generateRelationships({
        personas,
        actors,
        leaders
      });

      // Apply relationships to Neo4j
      await builder.applyToGraph(graphJSON);

      return res.json({
        success: true,
        graph: graphJSON
      });

    } catch (err) {
      console.error("❌ Relationship generation failed:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  return router;
}
