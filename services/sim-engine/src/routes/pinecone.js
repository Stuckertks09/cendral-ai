import express from "express";
import CorePersona from "../core/persona/CorePersona.js";
import GeoActor from "../core/actors/GeoActor.js";
import GeoLeader from "../core/actors/GeoLeader.js";
import PineconeSeeder from "../services/PineconeSeeder.js";

export default function pineconeRoutes({ semanticMemory }) {
  const router = express.Router();
  const seeder = new PineconeSeeder({ semanticMemory });

  router.post("/seed", async (req, res) => {
    try {
      const personas = await CorePersona.find();
      const actors = await GeoActor.find();
      const leaders = await GeoLeader.find();

      const personaCount = await seeder.seedPersonas(personas);
      const actorCount = await seeder.seedActors(actors);
      const leaderCount = await seeder.seedLeaders(leaders);

      res.json({
        success: true,
        personaCount,
        actorCount,
        leaderCount,
      });

    } catch (err) {
      console.error("Pinecone seeding failed:", err);
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
