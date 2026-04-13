// extensions/political/worldStateAdapter.js

/**
 * Political WorldState Adapter
 * Applies political events to the political world graph:
 * topics, edges, and macro metrics.
 */

export default class PoliticalWorldStateAdapter {
  constructor(worldState) {
    this.state = worldState; // This should already match PoliticalWorldStateSchema structure
  }

  /**
   * Apply an incoming event to update topic states
   */
  applyEvent(event) {
    if (!event || !event.type) return;

    switch (event.type) {
      case "news_story":
        this._applyNewsStory(event);
        break;

      case "scandal":
        this._applyScandal(event);
        break;

      case "economic_report":
        this._applyEconomicReport(event);
        break;

      case "foreign_crisis":
        this._applyForeignCrisis(event);
        break;

      case "policy_passed":
        this._applyPolicyPassed(event);
        break;

      default:
        // unrecognized political event → no-op
        break;
    }

    // Always update macro metrics at the end
    this._updateMetrics();
  }

  // ----------------------------
  // EVENT HANDLERS
  // ----------------------------

  _applyNewsStory(event) {
    const { topic, sentiment = 0 } = event.payload || {};
    if (!topic) return;

    const node = this._getTopic(topic);
    if (!node) return;

    // sentiment pushes stance slightly
    node.stance = this._clampSigned(node.stance + sentiment * 0.1);
    node.certainty = this._clamp01(node.certainty + 0.05);

    this._propagate(topic);
  }

  _applyScandal(event) {
    const { topic, magnitude = 0.3 } = event.payload || {};
    if (!topic) return;

    const node = this._getTopic(topic);
    if (!node) return;

    // Scandals usually cause negative stance + increased volatility
    node.stance = this._clampSigned(node.stance - magnitude * 0.2);
    node.volatility = this._clamp01(node.volatility + 0.1);

    this._propagate(topic);
  }

  _applyEconomicReport(event) {
    const { impact = 0 } = event.payload || {};

    const econ = this._getTopic("economy");
    if (!econ) return;

    econ.stance = this._clampSigned(econ.stance + impact * 0.15);
    econ.certainty = this._clamp01(econ.certainty + 0.05);

    this._propagate("economy");
  }

  _applyForeignCrisis(event) {
    const { severity = 0.2 } = event.payload || {};

    const fp = this._getTopic("foreign_policy");
    if (!fp) return;

    fp.stance = this._clampSigned(fp.stance - severity * 0.1);
    fp.volatility = this._clamp01(fp.volatility + severity * 0.2);

    this._propagate("foreign_policy");
  }

  _applyPolicyPassed(event) {
    const { topic, direction = 0.2 } = event.payload || {};
    if (!topic) return;

    const node = this._getTopic(topic);
    if (!node) return;

    node.stance = this._clampSigned(node.stance + direction * 0.1);
    node.certainty = this._clamp01(node.certainty + 0.1);

    this._propagate(topic);
  }

  // ----------------------------
  // PROPAGATION MODEL
  // ----------------------------

  _propagate(originTopic) {
    const edges = this.state.topicEdges || [];

    edges.forEach(edge => {
      if (edge.from !== originTopic) return;

      const source = this._getTopic(edge.from);
      const target = this._getTopic(edge.to);
      if (!source || !target) return;

      // influence = source stance * weight * volatility
      const influence =
        source.stance * edge.weight * Math.max(0.1, target.volatility);

      target.stance = this._clampSigned(target.stance + influence * 0.1);
      target.certainty = this._clamp01(target.certainty - 0.02); // uncertainty when influenced
    });
  }

  // ----------------------------
  // METRIC COMPUTATION
  // ----------------------------

  _updateMetrics() {
    const topics = this.state.topics || [];
    if (topics.length === 0) return;

    const stances = topics.map(t => t.stance ?? 0);
    const volatility = topics.map(t => t.volatility ?? 0);

    // Polarization: variance of stances
    const mean = stances.reduce((a, b) => a + b, 0) / stances.length;
    const variance =
      stances.reduce((sum, v) => sum + (v - mean) ** 2, 0) /
      Math.max(1, stances.length - 1);

    this.state.polarization = this._clamp01(variance);

    // Radicalization: mean absolute position
    this.state.radicalization = this._clamp01(
      stances.reduce((sum, v) => sum + Math.abs(v), 0) / stances.length
    );

    // Instability: mean volatility
    this.state.instability = this._clamp01(
      volatility.reduce((sum, v) => sum + v, 0) / volatility.length
    );
  }

  // ----------------------------
  // HELPERS
  // ----------------------------

  _getTopic(name) {
    return this.state.topics?.find(t => t.topic === name);
  }

  _clamp01(n) {
    return Math.max(0, Math.min(1, n));
  }

  _clampSigned(n) {
    return Math.max(-1, Math.min(1, n));
  }

  toJSON() {
    return {
      ...this.state
    };
  }
}
