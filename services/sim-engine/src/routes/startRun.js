// routes/startRun.js
import express from "express";
import SimulationRun from "../core/simulation/SimulationRun.js";

export default function startRunRoute({ simService }) {
  const router = express.Router();

  /**
   * POST /api/sim/start-run
   * -----------------------
   * 1. Creates SimulationRun (run metadata)
   * 2. Delegates to SimulationService.createInitialState()
   *    → which internally calls:
   *       worldStateManager.factory.createInitialWorldState()
   *       and saves the worldstate
   */
  router.post("/start-run", async (req, res) => {
    try {
      // 1) Create SimulationRun entry
      const run = await SimulationRun.create({
        startedAt: new Date(),
        status: "running"
      });

      // 2) Create the *initial* world state via SimulationService
      const initialState = await simService.createInitialState({
        runId: run._id
      });

      // 3) Update run with initial worldstate reference
      run.initialState = initialState._id;
      await run.save();

      res.json({
        success: true,
        run,
        initialState: initialState.toObject()
      });
    } catch (err) {
      console.error("❌ /start-run error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
