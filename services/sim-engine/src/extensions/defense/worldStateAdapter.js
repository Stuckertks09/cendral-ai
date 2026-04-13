// extensions/defense/worldStateAdapter.js

export default class DefenseWorldStateAdapter {
  constructor(worldState) {
    // worldState should match DefenseWorldStateSchema
    this.state = worldState;
  }

  applyEvent(event) {
    if (!event || !event.type) return;

    switch (event.type) {
      case "border_incident":
      case "airspace_violation":
      case "naval_encounter":
        this._applyBorderIncident(event);
        break;

      case "military_exercise":
        this._applyMilitaryExercise(event);
        break;

      case "cyber_attack":
        this._applyCyberAttack(event);
        break;

      case "terror_attack":
        this._applyTerrorAttack(event);
        break;

      case "treaty_signed":
      case "ceasefire":
        this._applyDeescalation(event);
        break;

      case "war_outbreak":
      case "offensive_launched":
        this._applyMajorConflict(event);
        break;

      default:
        // unknown event type -> no-op for now
        break;
    }

    this._updateMetrics();
  }

  // ----------------------------
  // EVENT HANDLERS
  // ----------------------------

  _applyBorderIncident(event) {
    const { theater, severity = 0.2 } = event.payload || {};
    const node = this._getTheater(theater);
    if (!node) return;

    node.tension = this._clamp01(node.tension + severity * 0.3);
    node.stability = this._clamp01(node.stability - severity * 0.2);
    node.escalationRisk = this._clamp01(node.escalationRisk + severity * 0.25);

    this._propagateFromTheater(theater, severity);
  }

  _applyMilitaryExercise(event) {
    const { theater, perceivedAggression = 0.2 } = event.payload || {};
    const node = this._getTheater(theater);
    if (!node) return;

    node.tension = this._clamp01(node.tension + perceivedAggression * 0.2);
    node.escalationRisk = this._clamp01(
      node.escalationRisk + perceivedAggression * 0.15
    );

    this._propagateFromTheater(theater, perceivedAggression * 0.7);
  }

  _applyCyberAttack(event) {
    const { theater, severity = 0.3 } = event.payload || {};
    // cyber might be global, but allow optional theater targeting
    if (theater) {
      const node = this._getTheater(theater);
      if (node) {
        node.tension = this._clamp01(node.tension + severity * 0.25);
        node.escalationRisk = this._clamp01(node.escalationRisk + severity * 0.2);
      }
    }

    // even if localized, cyber attacks slightly raise system risk
    this.state.metrics.systemEscalationRisk = this._clamp01(
      (this.state.metrics.systemEscalationRisk ?? 0) + severity * 0.05
    );
  }

  _applyTerrorAttack(event) {
    const { theater, severity = 0.4 } = event.payload || {};
    const node = this._getTheater(theater);
    if (!node) return;

    node.tension = this._clamp01(node.tension + severity * 0.35);
    node.stability = this._clamp01(node.stability - severity * 0.3);
    node.escalationRisk = this._clamp01(node.escalationRisk + severity * 0.25);

    this.state.metrics.activeConflictCount = Math.max(
      0,
      (this.state.metrics.activeConflictCount ?? 0) + 1
    );

    this._propagateFromTheater(theater, severity);
  }

  _applyDeescalation(event) {
    const { theater, magnitude = 0.3 } = event.payload || {};
    const node = this._getTheater(theater);
    if (!node) return;

    node.tension = this._clamp01(node.tension - magnitude * 0.4);
    node.stability = this._clamp01(node.stability + magnitude * 0.3);
    node.escalationRisk = this._clamp01(node.escalationRisk - magnitude * 0.35);

    this._propagateFromTheater(theater, -magnitude);
  }

  _applyMajorConflict(event) {
    const { theater, severity = 0.7 } = event.payload || {};
    const node = this._getTheater(theater);
    if (!node) return;

    node.tension = this._clamp01(node.tension + severity * 0.5);
    node.stability = this._clamp01(node.stability - severity * 0.5);
    node.conflictProbability = this._clamp01(
      node.conflictProbability + severity * 0.3
    );
    node.escalationRisk = this._clamp01(node.escalationRisk + severity * 0.4);

    this.state.metrics.activeConflictCount = Math.max(
      0,
      (this.state.metrics.activeConflictCount ?? 0) + 1
    );

    this._propagateFromTheater(theater, severity);
  }

  // ----------------------------
  // PROPAGATION
  // ----------------------------

  _propagateFromTheater(originKey, magnitude) {
    const relations = this.state.relations || [];
    relations.forEach(rel => {
      if (rel.type !== "alliance" && rel.type !== "rivalry") return;

      // simple model: tensions propagate through alliances & rivalries
      const weight = rel.weight ?? 0;
      if (weight === 0) return;

      // For now we don't distinguish direction strongly; you can later
      // interpret "from/to" as states and map to theaters externally.
      const influencedTheaters = this.state.theaters || [];
      influencedTheaters.forEach(th => {
        if (th.key === originKey) return;

        const influence = magnitude * weight * 0.1;
        th.tension = this._clamp01(th.tension + influence);
        th.escalationRisk = this._clamp01(th.escalationRisk + influence * 0.8);
      });
    });
  }

  // ----------------------------
  // METRICS
  // ----------------------------

  _updateMetrics() {
    const theaters = this.state.theaters || [];
    if (theaters.length === 0) return;

    const tensions = theaters.map(t => t.tension ?? 0);
    const stabilities = theaters.map(t => t.stability ?? 0);
    const escalationRisks = theaters.map(t => t.escalationRisk ?? 0);

    const avg = arr =>
      arr.reduce((sum, v) => sum + v, 0) / Math.max(1, arr.length);

    const metrics = this.state.metrics || {};

    metrics.systemEscalationRisk = this._clamp01(avg(escalationRisks));

    // crude measure of alliance cohesion: 1 - stddev of tensions
    const meanTension = avg(tensions);
    const variance =
      tensions.reduce((sum, v) => sum + (v - meanTension) ** 2, 0) /
      Math.max(1, tensions.length - 1);
    const stdDev = Math.sqrt(variance);
    metrics.allianceCohesion = this._clamp01(1 - stdDev);

    // deterrence balance: placeholder (0 = balanced; +/- tilts)
    // you can later compute based on alliedPresence vs adversaryPresence
    metrics.deterrenceBalance = this._clampSigned(metrics.deterrenceBalance ?? 0);

    this.state.metrics = metrics;
  }

   // ----------------------------
  // FEEDBACK LOOP
  // --------

 applyArbitration({ topicUpdates = {}, metrics = {} }) {
  if (!topicUpdates || typeof topicUpdates !== "object") return;

  // --- LLM → world mapping weights (easy to tweak globally)
  const W_STANCE = 0.5;        // stanceDelta → tension
  const W_CERTAINTY = 0.5;     // certaintyDelta → stability
  const W_VOLATILITY = 0.5;    // volatilityDelta → escalationRisk

  // --------------------------------------------
  // Apply per-theater deltas
  // --------------------------------------------
  for (const [theaterKey, deltas] of Object.entries(topicUpdates)) {
    const node = this._getTheater(theaterKey);
    if (!node || !deltas) continue;

    const stanceDelta = Number(deltas.stanceDelta ?? 0);
    const certaintyDelta = Number(deltas.certaintyDelta ?? 0);
    const volatilityDelta = Number(deltas.volatilityDelta ?? 0);

    // Tension ↑ means threat perception ↑ (stanceDelta)
    node.tension = this._clamp01(
      node.tension + stanceDelta * W_STANCE
    );

    // Stability ↑ if certainty increases (LLM reading = more clarity)
    // You can invert this if you want certainty → fragility instead
    node.stability = this._clamp01(
      node.stability + certaintyDelta * W_CERTAINTY
    );

    // Volatility maps cleanly to escalation risk
    node.escalationRisk = this._clamp01(
      node.escalationRisk + volatilityDelta * W_VOLATILITY
    );
  }

  // --------------------------------------------
  // Apply domain-level defense metrics
  // --------------------------------------------
  if (metrics && this.state.metrics) {
    const m = this.state.metrics;

    const sysEsc = Number(metrics.systemEscalationDelta ?? 0);
    const coh = Number(metrics.allianceCohesionDelta ?? 0);
    const det = Number(metrics.deterrenceBalanceDelta ?? 0);

    m.systemEscalationRisk = this._clamp01(
      m.systemEscalationRisk + sysEsc
    );

    m.allianceCohesion = this._clamp01(
      m.allianceCohesion + coh
    );

    m.deterrenceBalance = this._clampSigned(
      m.deterrenceBalance + det
    );
  }
}


  // ----------------------------
  // HELPERS
  // ----------------------------

  _getTheater(key) {
    if (!key) return null;
    return this.state.theaters?.find(t => t.key === key) || null;
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
