// src/routes/sim.js
import express from 'express';
import SimulationService from '../core/simulation/SimulationService.js';

export default function simulationRoutes({ personaFactory, worldStateFactory }) {
  const router = express.Router();
  const simService = new SimulationService({ personaFactory, worldStateFactory });

  /**
   * POST /api/sim/run
   * body: { eventId, steps?, personaFilter? }
   */
  router.post('/run', async (req, res) => {
    try {
      const { eventId, steps = 1, personaFilter = {} } = req.body;

      const result = await simService.runSimulation({
        eventId,
        steps,
        personaFilter
      });

      res.json({ success: true, ...result });
    } catch (err) {
      console.error('❌ Simulation run error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  /**
   * GET /api/sim/run/:runId
   * fetch run metadata + worldstate IDs
   */
  router.get('/run/:runId', async (req, res) => {
    try {
      const result = await simService.getRun(req.params.runId);
      if (!result) {
        return res.status(404).json({ success: false, error: 'Run not found' });
      }

      res.json({
        success: true,
        run: result.run,
        worldStates: result.worldStates
      });
    } catch (err) {
      console.error('❌ Simulation fetch error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
