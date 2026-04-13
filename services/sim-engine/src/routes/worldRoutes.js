// src/routes/world.js
import express from 'express';
import {
  listWorldStates,
  createWorldState,
  getRunWorldStates,
} from '../controllers/worldController.js';

export default function worldRoutes(worldFactory) {
  const router = express.Router();

  // 🔹 Attach worldFactory to req so controllers can use it
  router.use((req, res, next) => {
    req.worldFactory = worldFactory;
    next();
  });

  // GET /api/world → list latest world states (or whatever your list() does)
  router.get('/', listWorldStates);

  // POST /api/world → create an initial world state manually (optional)
  router.post('/', createWorldState);

  // GET /api/world/runs/:runId → grouped-by-domain series for dashboard
  router.get('/runs/:runId', getRunWorldStates);

  return router;
}
