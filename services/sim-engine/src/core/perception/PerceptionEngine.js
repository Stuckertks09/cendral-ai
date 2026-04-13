// src/core/perception/PerceptionEngine.js

/**
 * PerceptionEngine
 * ----------------
 * Lightweight, deterministic-ish perception generator.
 *
 * For now:
 *  - Uses persona traits + domain metrics to derive threat/opportunity.
 *  - Returns a compact JSON block that can be attached to arguments
 *    and shown in your UI.
 *
 * This is intentionally non-LLM so your "cognitive physics"
 * isn’t just prompt glue.
 */

export default class PerceptionEngine {
  constructor() {
    // In the future you can pass config, noise seeds, etc.
  }

  /**
   * @param {Object} params
   * @param {Object} params.persona - CorePersona mongoose doc
   * @param {Object} params.event   - event object (type, topic, etc.)
   * @param {Object} params.worldState - full worldstate doc
   * @param {string} params.domain  - e.g. "political"
   */
  generate({ persona, event, worldState, domain }) {
    const slice = worldState[domain] || {};
    const metrics = slice.metrics || {};

    // Pull some simple psychological features
    const traits = persona.psychology?.traits || {};
    const neuroticism = clamp01(traits.neuroticism ?? 0.5);
    const openness     = clamp01(traits.openness ?? 0.5);

    // Basic signals from world metrics
    const polarization = clamp01(metrics.polarization ?? 0);
    const instability  = clamp01(metrics.instability ?? 0);

    // Heuristic threat/opportunity computation
    const baseThreat =
      0.3 * polarization +
      0.3 * instability +
      0.4 * neuroticism;

    const baseOpportunity =
      0.4 * openness +
      0.3 * (1 - polarization) +
      0.3 * (1 - instability);

    const perceivedThreat = clamp01(baseThreat);
    const perceivedOpportunity = clamp01(baseOpportunity);

    const name =
      persona.identity?.name ||
      persona._id?.toString() ||
      "Unknown Persona";

    const topicLabel =
      event?.topicLabel || event?.topic || "general";

    const summary = `${name} views this ${event?.type || "event"} in the "${topicLabel}" space as ` +
      `${perceivedThreat > perceivedOpportunity ? "more threatening" : "potentially beneficial"}, ` +
      `with moderate uncertainty.`;

    return {
      domain,
      eventType: event?.type || "generic_event",
      topic: event?.topic || null,
      perceivedThreat,
      perceivedOpportunity,
      summary
    };
  }
}

function clamp01(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
