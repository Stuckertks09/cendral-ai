// src/core/CognitionModule.js
export default class CognitionModule {
  constructor({ persona, worldState, event, rules, settings }) {
    this.persona = persona;
    this.worldState = worldState;
    this.event = event;
    this.rules = rules;       // base rules + extension rules
    this.settings = settings; // sliders snapshot for this run
  }

  run() {
    for (const rule of this.rules) {
      if (this.#matchesTrigger(rule.trigger)) {
        this.#applyRule(rule);
      }
    }
  }

  #matchesTrigger(trigger) {
    if (!trigger) return true;

    // EVENT TYPE MATCH
    if (trigger.eventType && trigger.eventType !== this.event.type) return false;

    // TOPIC MATCH
    if (trigger.topic && trigger.topic !== this.event.topic) return false;

    // TRAIT MATCH
    if (trigger.trait) {
      const traits = this.persona?.psychology?.traits || {};
      const val = traits[trigger.trait.name];
      if (!this.#compare(val, trigger.trait)) return false;
    }

    return true;
  }

  #compare(value, condition) {
    if (value === undefined || value === null) return false;
    if (condition.gt !== undefined && !(value > condition.gt)) return false;
    if (condition.lt !== undefined && !(value < condition.lt)) return false;
    return true;
  }

  #applyRule(rule) {
    const effect = rule.effect;
    if (!effect || !effect.target) return;

    // Resolve path (supports persona.xxx.yyy or world.xxx)
    const targetRef = this.#resolvePath(effect.target);
    if (!targetRef.obj || !(targetRef.key in targetRef.obj)) return;

    // Compute delta: base * rule.weight * sliderValue * chaos
    const sliderValue = this.#getSliderValue(rule.slider);
    const base = effect.value || 0;
    const weight = rule.weight ?? 1;

    const chaosFactor = this.#sampleChaos();
    const delta = base * weight * sliderValue * chaosFactor;

    if (effect.operator === 'add') {
      const current = Number(targetRef.obj[targetRef.key]) || 0;
      targetRef.obj[targetRef.key] = this.#clamp(
        current + delta,
        effect.bounds
      );
    }
    // TODO: support other operators ('set', 'scale') later
  }

  #resolvePath(path) {
    const parts = String(path).split('.');
    let target =
      parts[0] === 'persona'
        ? this.persona
        : parts[0] === 'world' || parts[0] === 'worldState'
          ? this.worldState
          : null;

    if (!target) return {};

    for (let i = 1; i < parts.length - 1; i += 1) {
      target = target?.[parts[i]];
      if (!target) return {};
    }

    const key = parts[parts.length - 1];
    return { obj: target, key };
  }

  #clamp(value, bounds) {
    if (!bounds || !Array.isArray(bounds) || bounds.length !== 2) return value;
    const [min, max] = bounds;
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Safely read a slider value by name.
   * Supports nested keys like "defensePack.threatSensitivity".
   * Falls back to 1 if missing or not numeric.
   */
  #getSliderValue(name) {
    if (!name || !this.settings) return 1;

    const parts = String(name).split('.');
    let current = this.settings;

    for (const part of parts) {
      if (current == null) return 1;
      current = current[part];
    }

    return typeof current === 'number' ? current : 1;
  }

  /**
   * Samples a multiplicative chaos factor around 1.0
   * based on globalChaos slider.
   */
  #sampleChaos() {
    const chaos = this.#getSliderValue('globalChaos');
    if (chaos <= 0) return 1;

    // Simple: uniform in [1 - chaos/4, 1 + chaos/4]
    const spread = chaos / 4;
    const min = 1 - spread;
    const max = 1 + spread;
    return min + Math.random() * (max - min);
  }
}
