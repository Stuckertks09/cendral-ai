// src/core/systems/EconomicSystem.js

export default class EconomicSystem {
  // Used by SystemRegistry as a key: SystemClass.name === "EconomicSystem"
  static name = "EconomicSystem";

  constructor(worldState, settings = {}) {
    this.worldState = worldState;

    // UI / DB can override any of these via SystemRegistry.settings.EconomicSystem
    this.settings = {
      // sensitivities
      inflationSensitivity: 1,
      growthSensitivity: 1,
      unemploymentElasticity: 1,
      marketMomentumWeight: 1,

      // decay & propagation
      volatilityDecayRate: 0.03,
      liquiditySensitivity: 1,
      shockPropagationStrength: 1,
      shockDecayModifier: 1,
      shockAmplification: 1,

      // cross-market coupling
      correlationStrengthMultiplier: 1,
      sectorOutputElasticity: 1,
      sectorStressAmplifier: 1,
      householdStressSensitivity: 1,
      corporateStressSensitivity: 1,
      sovereignStressSensitivity: 1,

      // noise
      economicNoise: 0.02,
      marketNoise: 0.02,
      shockNoise: 0.02,

      // allow overrides from SystemSettings / UI
      ...settings
    };
  }

  bindWorldState(ws) {
    this.worldState = ws;
  }

  /**
   * Update economics based on event & internal drifts
   */
  update(event) {
    const econ = this.#ensure(); // 🔹 always get a baseline slice

    // -----------------------------
    // 1. EVENT-DRIVEN SHOCKS
    // -----------------------------
    if (event?.type === "inflation_shock") {
      this.#applyInflationShock(event.magnitude || 0.2);
    }

    if (event?.type === "supply_shock") {
      this.#applySupplyShock(event.magnitude || 0.3);
    }

    if (event?.type === "financial_shock") {
      this.#applyFinancialShock(event.magnitude || 0.4);
    }

    // -----------------------------
    // 2. BASE DRIFT (every step)
    // -----------------------------
    this.#decayVolatility(econ);
    this.#decayShocks(econ);
    this.#applyMarketMomentum(econ);
    this.#applyRandomNoise(econ);
  }

  /* ===============================
     BASELINE ENSURE
  =============================== */

  #ensure() {
    const domains = this.worldState.domains || (this.worldState.domains = {});
    if (!domains.economic) {
      domains.economic = {
        inflation: 0.02,          // ~2% baseline inflation
        growth: 0.02,             // ~2% baseline growth
        unemployment: 0.05,       // ~5% unemployment
        marketVolatility: 0.1,    // normalized 0–1
        marketMomentum: 0.5,      // neutral momentum
        liquidity: 0.8,           // decent liquidity
        shocks: []                // active economic shocks
      };
    }
    return domains.economic;
  }

  /* ===============================
     PRIVATE METHODS
  =============================== */

  #applyInflationShock(m) {
    const econ = this.#ensure();

    econ.inflation += m * this.settings.inflationSensitivity;
    econ.marketVolatility += m * 0.2 * this.settings.shockPropagationStrength;
    econ.shocks.push({
      type: "inflation",
      magnitude: m * this.settings.shockAmplification,
      decayRate: 0.1 * this.settings.shockDecayModifier
    });
  }

  #applySupplyShock(m) {
    const econ = this.#ensure();

    econ.growth -= m * this.settings.growthSensitivity;
    econ.unemployment += m * 0.4 * this.settings.unemploymentElasticity;

    econ.shocks.push({
      type: "supply",
      magnitude: m,
      decayRate: 0.08 * this.settings.shockDecayModifier
    });
  }

  #applyFinancialShock(m) {
    const econ = this.#ensure();

    econ.marketVolatility += m * this.settings.shockPropagationStrength;
    econ.liquidity -= m * this.settings.liquiditySensitivity;

    econ.shocks.push({
      type: "financial",
      magnitude: m,
      decayRate: 0.12 * this.settings.shockDecayModifier
    });
  }

  #decayVolatility(econ) {
    econ.marketVolatility = Math.max(
      0,
      econ.marketVolatility * (1 - this.settings.volatilityDecayRate)
    );
  }

  #decayShocks(econ) {
    econ.shocks = econ.shocks
      .map((s) => ({
        ...s,
        magnitude: Math.max(
          0,
          s.magnitude - (s.decayRate ?? 0.1) * this.settings.shockDecayModifier
        )
      }))
      .filter((s) => s.magnitude > 0.001);
  }

  #applyMarketMomentum(econ) {
    econ.marketMomentum =
      econ.marketMomentum * this.settings.marketMomentumWeight;
  }

  #applyRandomNoise(econ) {
    // macro drift noise
    econ.inflation += (Math.random() - 0.5) * this.settings.economicNoise;
    econ.growth += (Math.random() - 0.5) * this.settings.economicNoise;

    econ.marketVolatility +=
      (Math.random() - 0.5) * this.settings.marketNoise;
  }
}
