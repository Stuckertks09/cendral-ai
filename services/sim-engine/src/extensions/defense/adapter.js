// extensions/defense/adapter.js

export default class DefenseAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.defense = {
      ...(this.persona.extensions.defense || {}),
      ...data
    };
  }

  /**
   * Adjust perceived threat level for a given theater or actor.
   * @param {string} key - e.g. "eastern_europe", "indo_pacific", "cyber"
   * @param {number} delta - signed delta in [-1,1] domain
   */
  shiftThreatPerception(key, delta) {
    const posture = this.persona.extensions.defense?.threatPerception || [];
    const t = posture.find(p => p.key === key);
    if (!t) return;

    t.level = this._clamp01(t.level + delta);
  }

  /**
   * Adjust escalation preference (how quickly this persona supports force).
   */
  shiftEscalationPreference(delta) {
    const ext = this.persona.extensions.defense;
    if (!ext) return;
    ext.posture.escalationPreference = this._clamp01(
      (ext.posture.escalationPreference ?? 0.5) + delta
    );
  }

  _clamp01(v) {
    return Math.max(0, Math.min(1, v));
  }

  /**
   * Defense-specific reaction hook.
   * Later you can plug arbitrator / cognition rules in here.
   */
  updateFromEvent(event) {
    if (!event || !event.type) return;
    const ext = this.persona.extensions.defense;
    if (!ext) return;

    const { theater, severity = 0.2 } = event.payload || {};

    switch (event.type) {
      case "border_incident":
      case "airspace_violation":
      case "naval_encounter": {
        if (theater) {
          this.shiftThreatPerception(theater, severity * 0.2);
        }
        this.shiftEscalationPreference(severity * 0.05);
        break;
      }

      case "military_exercise": {
        if (theater) {
          this.shiftThreatPerception(theater, severity * 0.1);
        }
        break;
      }

      case "treaty_signed":
      case "ceasefire": {
        if (theater) {
          this.shiftThreatPerception(theater, -severity * 0.15);
        }
        this.shiftEscalationPreference(-severity * 0.05);
        break;
      }

      case "terror_attack":
      case "cyber_attack": {
        const domainKey = event.type === "cyber_attack" ? "cyber" : theater;
        if (domainKey) {
          this.shiftThreatPerception(domainKey, severity * 0.25);
        }
        this.shiftEscalationPreference(severity * 0.05);
        break;
      }

      default:
        // noop for now
        break;
    }
  }

  toJSON() {
    return this.persona.extensions?.defense || {};
  }
}
