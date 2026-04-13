// src/routes/cognitionRoutes.js
import express from "express";
import SimulationEngine from "../core/simulation/SimulationEngine.js";
import EventModel from "../core/events/CoreEvents.js";
import ScenarioModel from "../core/scenarios/CoreScenarios.js";
import { runScenarioSimulation } from "../core/scenarios/scenarioSimulation.js";

export default function cognitionRoutes({
  worldExtensions,
  llmClient,
  personaRules,
  personaSettings,
}) {
  const router = express.Router();

  const simEngine = new SimulationEngine({
    extensions: worldExtensions,
    openai: llmClient.raw,
    personaRules: personaRules || [],
    personaSettings: personaSettings || {},
  });

  // ---------- single-step (unchanged) ----------
  router.post("/run-step", async (req, res) => {
    try {
      const { eventId, runId, sliders } = req.body;

      if (!eventId) {
        return res.status(400).json({ error: "eventId is required" });
      }

      const exists = await EventModel.exists({ _id: eventId });
      if (!exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      if (sliders && typeof sliders === "object") {
        simEngine.personaSettings = {
          ...simEngine.personaSettings,
          ...sliders,
        };
      }

      const worldState = await simEngine.runStep({
        eventId,
        runId: runId || null,
      });

      return res.json({ ok: true, worldState });
    } catch (err) {
      console.error("❌ cognition.run-step error:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ---------- SCENARIO RUN (fixed to use events) ----------
  router.post("/run-scenario", async (req, res) => {
    try {
      const { scenarioId, runId, sliders, maxSteps } = req.body || {};

      if (!scenarioId) {
        return res.status(400).json({ error: "scenarioId is required" });
      }

      const scenario = await ScenarioModel.findById(scenarioId).lean();
      if (!scenario) {
        return res.status(404).json({ error: "Scenario not found" });
      }

      // Support both new `events` and old `steps`, prefer `events`
      const stepsDef = Array.isArray(scenario.events)
        ? scenario.events
        : Array.isArray(scenario.steps)
        ? scenario.steps
        : [];

      if (!stepsDef.length) {
        return res
          .status(400)
          .json({ error: "Scenario has no steps/events configured" });
      }

      if (sliders && typeof sliders === "object") {
        simEngine.personaSettings = {
          ...simEngine.personaSettings,
          ...sliders,
        };
      }

      const result = await runScenarioSimulation({
        simEngine,
        scenario,
        runId: runId || null,
        maxSteps:
          typeof maxSteps === "number" && maxSteps > 0 ? maxSteps : null,
      });

      return res.json({
        ok: true,
        scenarioId,
        runId: result.runId,
        stepCount: result.steps.length,
        steps: result.steps,
      });
    } catch (err) {
      console.error("❌ cognition.run-scenario error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  });

  return router;
}
