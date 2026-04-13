// src/core/systems/InfoFlowSystem.js

/**
 * InfoFlowSystem
 * --------------
 * Models information environment:
 *  - attention across topics
 *  - overall media load
 *  - misinformation intensity
 *  - censorship / friction
 *  - connectivity / outage effects
 *
 * Can optionally read from:
 *  - domains.content (or root content) to align attention with content topics.
 */

export default class InfoFlowSystem {
  constructor(worldState, settings = {}) {
    this.worldState = worldState;
    this.settings = {
      attentionVolatility: 0.1,
      disinfoSensitivity: 1.0,
      censorshipImpact: 1.0,
      connectivityResilience: 0.9,
      baseEntropyDrift: 0.02,
      noise: 0.02,
      ...settings
    };
  }

  bindWorldState(ws) {
    this.worldState = ws;
  }

  update(event) {
    const info = this.#ensure();
    const contentState = this.#getContentState();

    this.#alignAttentionWithContent(info, contentState);
    this.#applyEvent(info, event);
    this.#driftEntropy(info);
    this.#applyNoise(info);

    info.lastUpdated = new Date();
  }

  /* -------------------------------
     ENSURE STRUCTURE
  ------------------------------- */

  #ensure() {
    const domains = this.worldState.domains || (this.worldState.domains = {});
    if (!domains.info) {
      domains.info = {
        topics: [],                 // [{ topic, share }]
        mediaLoad: 0.4,             // how saturated the environment is
        misinformationIndex: 0.2,
        censorshipIndex: 0.1,
        connectivityIndex: 0.9,
        attentionEntropy: 0.5,      // 0 = all attention on one topic, 1 = evenly spread
        lastUpdated: new Date()
      };
    }
    return domains.info;
  }

  #getContentState() {
    // Try domains.content first, then root content (depending on your wiring)
    const domains = this.worldState.domains || {};
    return domains.content || this.worldState.content || null;
  }

  /* -------------------------------
     ALIGN ATTENTION WITH CONTENT
  ------------------------------- */

  #alignAttentionWithContent(info, contentState) {
    if (!contentState || !Array.isArray(contentState.topics)) {
      // no content model, just lightly normalize topics
      this.#normalizeTopics(info);
      return;
    }

    const attention = new Map();

    // Content topics: { topic, heat, saturation, polarity }
    for (const t of contentState.topics) {
      const weight = (t.heat || 0.1) + (t.saturation || 0.1);
      attention.set(t.topic, (attention.get(t.topic) || 0) + weight);
    }

    const total = Array.from(attention.values()).reduce((a, b) => a + b, 0) || 1;

    info.topics = Array.from(attention.entries()).map(([topic, val]) => ({
      topic,
      share: val / total
    }));

    this.#normalizeTopics(info);
    info.attentionEntropy = this.#entropy(info.topics.map(t => t.share));
  }

  /* -------------------------------
     EVENT HANDLING
  ------------------------------- */

  #applyEvent(info, event) {
    if (!event) return;

    switch (event.type) {
      case 'media_event': {
        // e.g. breaking news → spike media load & attention skew
        const mag = event.magnitude || 0.2;
        info.mediaLoad = this.#clamp01(info.mediaLoad + mag);
        if (event.topic) {
          this.#boostTopic(info, event.topic, mag * 2);
        }
        break;
      }

      case 'disinfo_campaign': {
        const mag = (event.magnitude || 0.2) * this.settings.disinfoSensitivity;
        info.misinformationIndex = this.#clamp01(info.misinformationIndex + mag);
        info.mediaLoad = this.#clamp01(info.mediaLoad + mag * 0.5);
        break;
      }

      case 'censorship_event': {
        const mag = (event.magnitude || 0.3) * this.settings.censorshipImpact;
        info.censorshipIndex = this.#clamp01(info.censorshipIndex + mag);
        // censorship can reduce entropy (fewer topics allowed)
        info.attentionEntropy = this.#clamp01(info.attentionEntropy - mag * 0.2);
        break;
      }

      case 'infrastructure_outage': {
        const mag = event.magnitude || 0.3;
        info.connectivityIndex = this.#clamp01(
          info.connectivityIndex - mag * (1 - this.settings.connectivityResilience)
        );
        info.mediaLoad = this.#clamp01(info.mediaLoad - mag * 0.3);
        break;
      }

      default:
        break;
    }

    // keep result sane
    this.#normalizeTopics(info);
  }

  /* -------------------------------
     DRIFT & NOISE
  ------------------------------- */

  #driftEntropy(info) {
    // entropy drifts back toward mid-level (0.5)
    info.attentionEntropy += (0.5 - info.attentionEntropy) * this.settings.baseEntropyDrift;
    info.attentionEntropy = this.#clamp01(info.attentionEntropy);
  }

  #applyNoise(info) {
    const n = this.settings.noise;
    if (!n) return;

    info.misinformationIndex = this.#clamp01(
      info.misinformationIndex + (Math.random() - 0.5) * n
    );
    info.censorshipIndex = this.#clamp01(
      info.censorshipIndex + (Math.random() - 0.5) * n * 0.5
    );
    info.mediaLoad = this.#clamp01(
      info.mediaLoad + (Math.random() - 0.5) * n
    );
  }

  /* -------------------------------
     HELPERS
  ------------------------------- */

  #normalizeTopics(info) {
    if (!Array.isArray(info.topics) || info.topics.length === 0) return;

    // soft attention volatility: add small random noise then renormalize
    const vol = this.settings.attentionVolatility;
    let total = 0;
    for (const t of info.topics) {
      t.share = Math.max(0, t.share + (Math.random() - 0.5) * vol * 0.05);
      total += t.share;
    }
    if (!total) total = 1;

    for (const t of info.topics) {
      t.share = t.share / total;
    }

    info.attentionEntropy = this.#entropy(info.topics.map(t => t.share));
  }

  #boostTopic(info, topic, amount) {
    if (!Array.isArray(info.topics) || info.topics.length === 0) {
      info.topics = [{ topic, share: 1.0 }];
      return;
    }
    let found = false;
    for (const t of info.topics) {
      if (t.topic === topic) {
        t.share += amount;
        found = true;
      }
    }
    if (!found) {
      info.topics.push({ topic, share: amount });
    }
    this.#normalizeTopics(info);
  }

  #entropy(probs) {
    let e = 0;
    for (const p of probs) {
      if (p > 0) e -= p * Math.log2(p);
    }
    // maximum entropy for N topics is log2(N); normalize to [0,1]
    const maxE = Math.log2(probs.length || 1) || 1;
    return this.#clamp01(e / maxE);
  }

  #clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }
}
