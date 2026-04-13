// src/core/systems/EnvironmentSystem.js

/**
 * EnvironmentSystem
 * -----------------
 * Tracks environmental & resource conditions:
 *  - seasonality
 *  - temperature & precipitation indices
 *  - disaster risk & active disasters
 *  - energy / food / water stress
 *
 * Designed to interact with:
 *  - EconomicSystem (via resource shocks)
 *  - PopulationSystem (via disasters, climate)
 *  - Personas (via event ingestion)
 */

export default class EnvironmentSystem {
  constructor(worldState, settings = {}) {
    this.worldState = worldState;
    this.settings = {
      seasonDriftRate: 0.02,      // how fast seasons cycle around [0,1]
      baseDisasterRate: 0.001,    // probability per step
      disasterMaxRate: 0.05,
      climateTrendStrength: 0.001,
      resourceSensitivity: 1.0,
      disasterDecayRate: 0.05,
      envNoise: 0.01,
      ...settings
    };
  }

  bindWorldState(ws) {
    this.worldState = ws;
  }

  update(event) {
    const env = this.#ensure();
    this.#advanceSeason(env);
    this.#applyClimateTrend(env);
    this.#maybeSpawnDisaster(env, event);
    this.#decayDisasters(env);
    this.#applyEvent(event, env);
    this.#applyNoise(env);
    env.lastUpdated = new Date();
  }

  /* -------------------------------
     ENSURE STRUCTURE
  ------------------------------- */

  #ensure() {
    const domains = this.worldState.domains || (this.worldState.domains = {});
    if (!domains.environment) {
      domains.environment = {
        seasonIndex: 0.0,               // 0..1 → cyclical year
        temperatureIndex: 0.5,          // normalized
        precipitationIndex: 0.5,
        disasterRisk: 0.1,              // baseline risk
        activeDisasters: [],            // { type, severity, region, decayRate }
        energyStress: 0.2,
        foodStress: 0.2,
        waterStress: 0.2,
        climateTrend: 0.0,              // + warming, - cooling
        lastUpdated: new Date()
      };
    }
    return domains.environment;
  }

  /* -------------------------------
     SEASON + CLIMATE
  ------------------------------- */

  #advanceSeason(env) {
    env.seasonIndex += this.settings.seasonDriftRate;
    if (env.seasonIndex > 1) env.seasonIndex -= 1;

    // Simple seasonal effect on temperature & precipitation
    const s = env.seasonIndex;
    // Rough sinusoidal approximations
    env.temperatureIndex = this.#clamp01(0.5 + 0.3 * Math.sin(2 * Math.PI * s) + env.climateTrend);
    env.precipitationIndex = this.#clamp01(0.5 + 0.2 * Math.cos(2 * Math.PI * s));
  }

  #applyClimateTrend(env) {
    // Climate trend slowly nudges temp upward/downward
    env.climateTrend += this.settings.climateTrendStrength;
    env.climateTrend = this.#clampSigned(env.climateTrend, -0.3, 0.3);
  }

  /* -------------------------------
     DISASTERS
  ------------------------------- */

  #maybeSpawnDisaster(env, event) {
    // event-triggered higher risk
    if (event?.type === 'climate_anomaly') {
      env.disasterRisk = this.#clamp01(env.disasterRisk + 0.1);
    }

    const baseRate = this.settings.baseDisasterRate;
    const dynamicRate = Math.min(
      this.settings.disasterMaxRate,
      baseRate + env.disasterRisk * 0.02
    );

    if (Math.random() < dynamicRate) {
      const severity = this.#clamp01(0.3 + Math.random() * 0.5);

      env.activeDisasters.push({
        type: this.#randomDisasterType(),
        severity,
        region: event?.region || 'global',
        decayRate: this.settings.disasterDecayRate,
        startedAt: new Date()
      });

      // disasters immediately raise stress on resources
      env.energyStress = this.#clamp01(env.energyStress + severity * 0.2);
      env.foodStress = this.#clamp01(env.foodStress + severity * 0.2);
      env.waterStress = this.#clamp01(env.waterStress + severity * 0.3);
    }
  }

  #decayDisasters(env) {
    env.activeDisasters = env.activeDisasters
      .map(d => ({
        ...d,
        severity: this.#clamp01(d.severity * (1 - d.decayRate))
      }))
      .filter(d => d.severity > 0.02);

    // As disasters fade, slowly reduce resource stress
    env.energyStress = this.#clamp01(env.energyStress - 0.01);
    env.foodStress = this.#clamp01(env.foodStress - 0.01);
    env.waterStress = this.#clamp01(env.waterStress - 0.015);
  }

  /* -------------------------------
     EVENT HANDLING
  ------------------------------- */

  #applyEvent(event, env) {
    if (!event) return;

    switch (event.type) {
      case 'natural_disaster': {
        const severity = this.#clamp01(event.magnitude || 0.4);
        env.activeDisasters.push({
          type: event.subtype || 'unspecified',
          severity,
          region: event.region || 'global',
          decayRate: this.settings.disasterDecayRate,
          startedAt: new Date()
        });
        env.disasterRisk = this.#clamp01(env.disasterRisk + severity * 0.2);
        env.energyStress = this.#clamp01(env.energyStress + severity * 0.2);
        env.foodStress = this.#clamp01(env.foodStress + severity * 0.3);
        env.waterStress = this.#clamp01(env.waterStress + severity * 0.3);
        break;
      }

      case 'resource_shortage': {
        const mag = event.magnitude || 0.2;
        if (event.resource === 'energy') {
          env.energyStress = this.#clamp01(env.energyStress + mag * this.settings.resourceSensitivity);
        } else if (event.resource === 'food') {
          env.foodStress = this.#clamp01(env.foodStress + mag * this.settings.resourceSensitivity);
        } else if (event.resource === 'water') {
          env.waterStress = this.#clamp01(env.waterStress + mag * this.settings.resourceSensitivity);
        }
        break;
      }

      default:
        break;
    }
  }

  /* -------------------------------
     NOISE
  ------------------------------- */

  #applyNoise(env) {
    const n = this.settings.envNoise;
    if (!n) return;

    env.energyStress = this.#clamp01(env.energyStress + (Math.random() - 0.5) * n);
    env.foodStress = this.#clamp01(env.foodStress + (Math.random() - 0.5) * n);
    env.waterStress = this.#clamp01(env.waterStress + (Math.random() - 0.5) * n);
    env.disasterRisk = this.#clamp01(env.disasterRisk + (Math.random() - 0.5) * n * 0.5);
  }

  /* -------------------------------
     HELPERS
  ------------------------------- */

  #randomDisasterType() {
    const types = ['storm', 'flood', 'drought', 'heatwave', 'wildfire', 'earthquake'];
    return types[Math.floor(Math.random() * types.length)];
  }

  #clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  #clampSigned(v, min, max) {
    if (v < min) return min;
    if (v > max) return max;
    return v;
  }
}
