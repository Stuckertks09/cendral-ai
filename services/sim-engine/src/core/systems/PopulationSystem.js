// src/core/systems/PopulationSystem.js

/**
 * PopulationSystem
 * ----------------
 * Maintains high-level demographic and social structure:
 *  - total population
 *  - age bands
 *  - migration flows
 *  - urbanization
 *  - fertility & mortality
 *  - inequality & diversity
 *  - social trust
 *
 * This is an aggregate system — no individual persons here.
 */

export default class PopulationSystem {
  constructor(worldState, settings = {}) {
    this.worldState = worldState;
    this.settings = {
      baselineGrowthRate: 0.005,      // ~0.5% per step
      fertilityBase: 0.02,
      mortalityBase: 0.01,
      migrationVolatility: 0.02,
      urbanizationDrift: 0.002,
      trustReversionRate: 0.02,
      demoShockSensitivity: 1.0,
      inequalityDrift: 0.005,
      diversityDrift: 0.002,
      randomNoise: 0.01,
      ...settings
    };
  }

  bindWorldState(ws) {
    this.worldState = ws;
  }

  update(event) {
    const dom = this.#ensure();
    this.#applyEvent(event, dom);
    this.#applyBaselineDynamics(dom);
    this.#applyRandomNoise(dom);
    dom.lastUpdated = new Date();
  }

  /* -------------------------------
     ENSURE STRUCTURE
  ------------------------------- */

  #ensure() {
    const domains = this.worldState.domains || (this.worldState.domains = {});
    if (!domains.population) {
      domains.population = {
        total: 10_000_000,
        ageBands: {
          "0_17": 0.2,
          "18_29": 0.2,
          "30_44": 0.25,
          "45_64": 0.2,
          "65_plus": 0.15
        },
        migration: {
          netRate: 0.0,
          internal: 0.0,
          external: 0.0
        },
        urbanizationRate: 0.6,
        fertilityRate: 1.9,
        mortalityRate: 0.009,
        laborForceParticipation: 0.62,
        diversityIndex: 0.5,
        inequalityIndex: 0.45,
        socialTrust: 0.5,
        lastUpdated: new Date()
      };
    }
    return domains.population;
  }

  /* -------------------------------
     EVENT HANDLING
  ------------------------------- */

  #applyEvent(event, pop) {
    if (!event) return;

    switch (event.type) {
      case 'demographic_shock': {
        const mag = (event.magnitude || 0.01) * this.settings.demoShockSensitivity;
        // Could be birth shock or death shock depending on sign
        pop.fertilityRate += (event.direction === 'positive' ? 1 : -1) * mag;
        break;
      }

      case 'pandemic_event': {
        const mag = (event.magnitude || 0.02) * this.settings.demoShockSensitivity;
        pop.mortalityRate += mag;
        pop.socialTrust -= mag * 0.5;
        pop.laborForceParticipation -= mag * 0.3;
        break;
      }

      case 'conflict_event': {
        const mag = (event.magnitude || 0.03) * this.settings.demoShockSensitivity;
        pop.migration.external += mag;
        pop.socialTrust -= mag * 0.7;
        pop.inequalityIndex += mag * 0.2;
        break;
      }

      case 'migration_event': {
        const mag = (event.magnitude || 0.01);
        pop.migration.netRate += mag;
        pop.migration.external += mag;
        pop.diversityIndex += mag * 0.3;
        break;
      }

      default:
        break;
    }

    // Clamp some key fields
    pop.socialTrust = this.#clamp01(pop.socialTrust);
    pop.inequalityIndex = this.#clamp01(pop.inequalityIndex);
    pop.diversityIndex = this.#clamp01(pop.diversityIndex);
  }

  /* -------------------------------
     BASELINE DYNAMICS
  ------------------------------- */

  #applyBaselineDynamics(pop) {
    // Net population change
    const births = pop.total * pop.fertilityRate * this.settings.fertilityBase;
    const deaths = pop.total * pop.mortalityRate * this.settings.mortalityBase;
    const migrationNet = pop.total * pop.migration.netRate;

    const delta = births - deaths + migrationNet + pop.total * this.settings.baselineGrowthRate;
    pop.total = Math.max(0, pop.total + delta);

    // Age progression (very simplified)
    // shift a bit of younger cohorts into older ones
    const shift = 0.01;
    const bands = pop.ageBands;

    const move_0_17_to_18_29 = bands["0_17"] * shift;
    const move_18_29_to_30_44 = bands["18_29"] * shift;
    const move_30_44_to_45_64 = bands["30_44"] * shift;
    const move_45_64_to_65_plus = bands["45_64"] * shift;

    bands["0_17"] = this.#clamp01(bands["0_17"] - move_0_17_to_18_29 + births / pop.total * 0.5);
    bands["18_29"] = this.#clamp01(bands["18_29"] + move_0_17_to_18_29 - move_18_29_to_30_44);
    bands["30_44"] = this.#clamp01(bands["30_44"] + move_18_29_to_30_44 - move_30_44_to_45_64);
    bands["45_64"] = this.#clamp01(bands["45_64"] + move_30_44_to_45_64 - move_45_64_to_65_plus);
    bands["65_plus"] = this.#clamp01(bands["65_plus"] + move_45_64_to_65_plus);

    // Normalize age bands to 1.0
    const sumBands = Object.values(bands).reduce((a, b) => a + b, 0) || 1;
    for (const key of Object.keys(bands)) {
      bands[key] = this.#clamp01(bands[key] / sumBands);
    }

    // Urbanization slowly drifts up
    pop.urbanizationRate = this.#clamp01(
      pop.urbanizationRate + this.settings.urbanizationDrift
    );

    // Inequality & diversity small drifts
    pop.inequalityIndex = this.#clamp01(
      pop.inequalityIndex + this.settings.inequalityDrift * (Math.random() - 0.5)
    );
    pop.diversityIndex = this.#clamp01(
      pop.diversityIndex + this.settings.diversityDrift * (Math.random() - 0.5)
    );

    // Social trust reverts toward 0.5
    pop.socialTrust += (0.5 - pop.socialTrust) * this.settings.trustReversionRate;
    pop.socialTrust = this.#clamp01(pop.socialTrust);
  }

  /* -------------------------------
     RANDOM NOISE
  ------------------------------- */

  #applyRandomNoise(pop) {
    const noise = this.settings.randomNoise;
    if (!noise) return;

    pop.migration.netRate += (Math.random() - 0.5) * noise * 0.1;
    pop.migration.internal += (Math.random() - 0.5) * noise * 0.1;
    pop.migration.external += (Math.random() - 0.5) * noise * 0.1;

    pop.fertilityRate += (Math.random() - 0.5) * noise * 0.05;
    pop.mortalityRate += (Math.random() - 0.5) * noise * 0.05;

    pop.migration.netRate = this.#clampSigned(pop.migration.netRate, -0.1, 0.1);
    pop.fertilityRate = Math.max(0, pop.fertilityRate);
    pop.mortalityRate = Math.max(0, pop.mortalityRate);
  }

  /* -------------------------------
     HELPERS
  ------------------------------- */

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
