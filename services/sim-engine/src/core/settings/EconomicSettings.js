// src/core/settings/EconomicSettings.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max, def = (min + max) / 2) => ({
  type: Number,
  min,
  max,
  default: def
});

const EconomicSettingsSchema = new Schema({

  /* -----------------------------
     1. MACRO SENSITIVITIES
  ----------------------------- */

  inflationSensitivity: bounded(0, 3, 1),       // how strongly shocks move inflation
  growthSensitivity: bounded(0, 3, 1),          // gdp reaction to events/shocks
  unemploymentElasticity: bounded(0, 3, 1),     // joblessness response to policy

  monetaryTransmission: bounded(0, 3, 1),       // effect of interest rate changes
  fiscalTransmission: bounded(0, 3, 1),         // effect of fiscal policy

  /* -----------------------------
     2. MARKET DYNAMICS
  ----------------------------- */

  marketMomentumWeight: bounded(0, 3, 1),       // price trend reinforcement
  volatilityDecayRate: bounded(0, 1, 0.03),     // how fast volatility mean reverts
  liquiditySensitivity: bounded(0, 3, 1),       // markets become unstable if low liquidity

  shockPropagationStrength: bounded(0, 3, 1),   // correlations amplify shocks
  correlationStrengthMultiplier: bounded(0, 3, 1),

  /* -----------------------------
     3. SECTOR + STRESS SYSTEMS
  ----------------------------- */

  sectorOutputElasticity: bounded(0, 3, 1),     // shocks → output changes
  sectorStressAmplifier: bounded(0, 3, 1),

  householdStressSensitivity: bounded(0, 3, 1),
  corporateStressSensitivity: bounded(0, 3, 1),
  sovereignStressSensitivity: bounded(0, 3, 1),

  /* -----------------------------
     4. SHOCK BEHAVIOR
  ----------------------------- */

  shockDecayModifier: bounded(0, 3, 1),         // multiply shock decayRate
  shockAmplification: bounded(0, 3, 1),         // multiply shock magnitude

  /* -----------------------------
     5. RANDOMNESS (MODEL UNCERTAINTY)
  ----------------------------- */

  economicNoise: bounded(0, 1, 0.05),           // gaussian random drift
  marketNoise: bounded(0, 1, 0.05),
  shockNoise: bounded(0, 1, 0.05),

  updatedAt: { type: Date, default: Date.now }

});

EconomicSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const EconomicSettings =
  mongoose.models.EconomicSettings ||
  mongoose.model('EconomicSettings', EconomicSettingsSchema);

export default EconomicSettings;
