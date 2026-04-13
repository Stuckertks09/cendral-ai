// src/core/arbitration/utils.js

// Clamp helpers
const clamp = (v, min, max) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

/**
 * Apply topic-level updates into a worldState document.
 *
 * Expected shape:
 * topicUpdates = {
 *   "<topic>": {
 *     stanceDelta?: number,
 *     certaintyDelta?: number,
 *     volatilityDelta?: number
 *   }
 * }
 *
 * By default we target the "political" extension: worldState.political.topics[]
 */
export function applyTopicUpdates(worldStateDoc, topicUpdates = {}, domain = 'political') {
  if (!worldStateDoc[domain]) worldStateDoc[domain] = {};
  const ext = worldStateDoc[domain];

  if (!Array.isArray(ext.topics)) {
    ext.topics = [];
  }

  for (const [topic, deltas] of Object.entries(topicUpdates)) {
    let node = ext.topics.find(t => t.topic === topic);
    if (!node) {
      node = {
        topic,
        stance: 0,
        certainty: 0.5,
        volatility: 0.5
      };
      ext.topics.push(node);
    }

    const { stanceDelta = 0, certaintyDelta = 0, volatilityDelta = 0 } = deltas;

    node.stance = clamp((node.stance ?? 0) + stanceDelta, -1, 1);
    node.certainty = clamp((node.certainty ?? 0.5) + certaintyDelta, 0, 1);
    node.volatility = clamp((node.volatility ?? 0.5) + volatilityDelta, 0, 1);
  }
}

/**
 * Apply macro metrics (e.g. polarization, radicalization, instability).
 *
 * metricsDelta = {
 *   polarizationDelta?: number,
 *   radicalizationDelta?: number,
 *   instabilityDelta?: number
 * }
 */
export function applyMetricUpdates(worldStateDoc, metricsDelta = {}, domain = 'political') {
  if (!worldStateDoc[domain]) worldStateDoc[domain] = {};
  const ext = worldStateDoc[domain];

  const {
    polarizationDelta = 0,
    radicalizationDelta = 0,
    instabilityDelta = 0
  } = metricsDelta;

  const bounded01 = v => clamp(v, 0, 1);

  ext.polarization = bounded01((ext.polarization ?? 0) + polarizationDelta);
  ext.radicalization = bounded01((ext.radicalization ?? 0) + radicalizationDelta);
  ext.instability = bounded01((ext.instability ?? 0) + instabilityDelta);
}

/**
 * Apply persona-level deltas like mood changes.
 *
 * personaUpdates = {
 *   "<personaId>": {
 *     valenceDelta?: number,
 *     arousalDelta?: number
 *   }
 * }
 */
export function applyPersonaUpdates(personas = [], personaUpdates = {}) {
  for (const persona of personas) {
    const update = personaUpdates[persona._id] || personaUpdates[String(persona._id)];
    if (!update) continue;

    const psych = persona.psychology || (persona.psychology = {});
    const { valenceDelta = 0, arousalDelta = 0 } = update;

    psych.valence = clamp((psych.valence ?? 0) + valenceDelta, -1, 1);
    psych.arousal = clamp((psych.arousal ?? 0) + arousalDelta, 0, 1);
  }
}
