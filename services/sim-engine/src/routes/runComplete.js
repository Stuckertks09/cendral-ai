// src/routes/runComplete.js
import express from "express";
import CorePersona from "../core/persona/CorePersona.js";
import PerceptionEngine from "../core/perception/PerceptionEngine.js";
import DebateGenerator from "../arbitration/DebateGenerator.js";



export default function runCompleteRoute({
  simService,
  arbitrationEngine,
  systemRegistry
}) {
  const router = express.Router();

  // We keep these small and stateless
  const perceptionEngine = new PerceptionEngine();
  const debateGenerator = new DebateGenerator({ llm: arbitrationEngine.llm });

  /**
   * POST /api/sim/run-complete
   *
   * Body (optional):
   * {
   *   "domain": "political",
   *   "event": {
   *     "type": "breaking_news",
   *     "headline": "...",
   *     "topic": "civil_liberties"
   *   }
   * }
   */
  router.post("/run-complete", async (req, res) => {
    const { domain = "political", event: eventPayload } = req.body || {};

    try {
      // 1) Get latest state
      const prevState = await simService.getState();

      // 2) Create next step doc via worldStateManager
      const nextState =
        await simService.worldStateManager.createNextStep(prevState);

      // 3) Load personas
      const personas = await CorePersona.find({});

      // 4) Build/normalize event
      const event = normalizeEvent(eventPayload, domain);

      // 5) Generate perceptions + arguments
      const argsWithPerception = [];
      for (const persona of personas) {
        const perception = perceptionEngine.generate({
          persona,
          event,
          worldState: nextState,
          domain
        });

        const [argument] = await debateGenerator.generateArguments({
          personas: [persona],
          event
        });

        argsWithPerception.push({
          personaId: argument.personaId,
          personaName: argument.personaName,
          domain,
          perception,
          argument: argument.argument
        });
      }

      // 6) Run arbitration on the *next* worldstate doc
      const arbitration = await arbitrationEngine.arbitrate({
        event,
        argumentsList: argsWithPerception,
        worldState: nextState,
        personas,
        domain
      });

      // 7) Run domain systems over the updated nextState
      if (systemRegistry) {
        systemRegistry.bindWorldState(nextState);
        systemRegistry.update(event);
      }

      // 8) Persist changes
      await Promise.all([nextState.save(), ...personas.map((p) => p.save())]);

      // 9) Respond with a nice payload for your UI
      res.json({
        success: true,
        event,
        domain,
        arguments: argsWithPerception,
        arbitration,
        updatedWorldState: nextState.toObject()
      });
    } catch (err) {
      console.error("❌ /run-complete error:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}

/**
 * Normalize incoming event payload and fill defaults.
 */
function normalizeEvent(raw, domain) {
  if (!raw || typeof raw !== "object") {
    return {
      type: "breaking_news",
      domain,
      headline: "Synthetic event from simulator",
      topic: "civil_liberties"
    };
  }

  return {
    type: raw.type || "breaking_news",
    domain: raw.domain || domain,
    headline: raw.headline || raw.title || "Untitled event",
    topic: raw.topic || "civil_liberties",
    topicLabel: raw.topicLabel
  };
}
