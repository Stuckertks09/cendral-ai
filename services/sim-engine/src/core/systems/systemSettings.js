// src/core/systems/systemSettings.js (or src/models/SystemSettings.js)
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * Canonical system defaults – must mirror the system constructors.
 */
const DEFAULT_SYSTEM_SETTINGS = {
  economic: {
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
    shockNoise: 0.02
  },

  environment: {
    seasonDriftRate: 0.02,      // how fast seasons cycle around [0,1]
    baseDisasterRate: 0.001,    // probability per step
    disasterMaxRate: 0.05,
    climateTrendStrength: 0.001,
    resourceSensitivity: 1.0,
    disasterDecayRate: 0.05,
    envNoise: 0.01
  },

  info: {
    attentionVolatility: 0.1,
    disinfoSensitivity: 1.0,
    censorshipImpact: 1.0,
    connectivityResilience: 0.9,
    baseEntropyDrift: 0.02,
    noise: 0.02
  },

  population: {
    baselineGrowthRate: 0.005,  // ~0.5% per step
    fertilityBase: 0.02,
    mortalityBase: 0.01,
    migrationVolatility: 0.02,
    urbanizationDrift: 0.002,
    trustReversionRate: 0.02,
    demoShockSensitivity: 1.0,
    inequalityDrift: 0.005,
    diversityDrift: 0.002,
    randomNoise: 0.01
  }
};

/**
 * SystemSettings
 * --------------
 * Optional overrides for macro systems:
 *  - economic
 *  - environment
 *  - info
 *  - population
 *
 * Each field is a loose object matching that system's `settings` shape.
 */
const SystemSettingsSchema = new Schema({
  economic: { type: Schema.Types.Mixed, default: {} },
  environment: { type: Schema.Types.Mixed, default: {} },
  info: { type: Schema.Types.Mixed, default: {} },
  population: { type: Schema.Types.Mixed, default: {} },
  updatedAt: { type: Date, default: Date.now }
});

SystemSettingsSchema.pre('save', function preSave() {
  this.updatedAt = new Date();
});

const SystemSettingsModel =
  mongoose.models.SystemSettings ||
  mongoose.model('SystemSettings', SystemSettingsSchema);

export async function getOrCreateSystemSettings() {
  let doc = await SystemSettingsModel.findOne();

  if (!doc) {
    doc = new SystemSettingsModel(DEFAULT_SYSTEM_SETTINGS);
    await doc.save();
    return doc;
  }

  let changed = false;

  for (const key of ["economic", "environment", "info", "population"]) {
    if (
      !doc[key] ||
      Object.keys(doc[key]).length === 0
    ) {
      doc[key] = DEFAULT_SYSTEM_SETTINGS[key];
      changed = true;
    }
  }

  if (changed) {
    await doc.save();
  }

  return doc;
}

export default SystemSettingsModel;
