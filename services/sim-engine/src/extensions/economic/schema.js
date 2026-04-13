// src/extensions/economic/schema.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const bounded01 = { type: Number, min: 0, max: 1 };
const boundedSigned = { type: Number, min: -1, max: 1 };

/**
 * Basic helper: normalized percentage in [0, 1]
 * e.g. 0.03 => 3% (keep your own convention consistent across the engine)
 */
const pct01 = (defaultVal = 0) => ({ ...bounded01, default: defaultVal });

/**
 * ------------------------------
 * 1. Macro Environment
 * ------------------------------
 */
const MacroEconomySchema = new Schema({
  gdpGrowth: { ...boundedSigned, default: 0 },            // -1 = deep recession, +1 = boom (normalized)
  inflationRate: pct01(0.03),                             // normalized, e.g. 0.03 = 3%
  unemploymentRate: pct01(0.06),
  realWageGrowth: { ...boundedSigned, default: 0 },

  consumerConfidence: pct01(0.5),
  businessConfidence: pct01(0.5),

  marketVolatility: pct01(0.3),                           // aggregate volatility index (e.g. vix-like)
  creditSpreadLevel: pct01(0.3),                          // higher → more risk stress

  housingStress: pct01(0.3),                              // affordability + default pressure
  tradeBalanceIndex: { ...boundedSigned, default: 0 },    // -1 = big deficit, +1 = big surplus

  monetaryStance: { ...boundedSigned, default: 0 },       // -1 = very loose, +1 = very tight
  fiscalStance: { ...boundedSigned, default: 0 },         // -1 = large stimulus, +1 = austerity

  shortRate: { type: Number, default: 0.02 },             // policy rate (raw, not normalized)
  longRate: { type: Number, default: 0.03 },              // 10y+ equivalent
}, { _id: false });

/**
 * ------------------------------
 * 2. Market Regimes
 * ------------------------------
 */
const MarketBucketSchema = new Schema({
  name: { type: String, required: true, enum: [
    'equities',
    'bonds',
    'credit',
    'real_estate',
    'commodities',
    'fx',
    'crypto',
    'other'
  ]},
  levelIndex: { ...bounded01, default: 0.5 },             // normalized price level / index
  trend: { ...boundedSigned, default: 0 },                // recent directional bias
  volatility: pct01(0.3),
  liquidity: pct01(0.6),
  riskPremium: { ...boundedSigned, default: 0 },          // higher = more compensation for risk
}, { _id: false });

/**
 * ------------------------------
 * 3. Sector Health
 * ------------------------------
 */
const SectorSchema = new Schema({
  code: { type: String, required: true },                 // e.g. "TECH", "ENERGY"
  label: { type: String, required: true },
  outputIndex: { ...bounded01, default: 0.5 },            // relative output vs baseline
  employmentShare: pct01(0.1),
  sentiment: pct01(0.5),
  stress: pct01(0.3),                                     // sector-specific financial/operational stress
  investmentLevel: pct01(0.5),                            // capex / investment appetite
  exportExposure: pct01(0.2),
}, { _id: false });

/**
 * ------------------------------
 * 4. Household & Firm Balance Sheets
 * ------------------------------
 */
const HouseholdBlockSchema = new Schema({
  realIncomeIndex: { ...bounded01, default: 0.5 },        // relative to long-run baseline
  savingsRate: pct01(0.08),
  debtToIncome: pct01(0.9),                               // 0–1 = normalized to a stress threshold
  debtServiceRatio: pct01(0.25),
  defaultRate: pct01(0.03),
  housingAffordability: pct01(0.4),                       // lower = worse affordability
  inequalityIndex: pct01(0.5),                            // e.g. normalized Gini / top-share
  financialStress: pct01(0.4),
}, { _id: false });

const CorporateBlockSchema = new Schema({
  leverageIndex: pct01(0.5),                              // normalized leverage metrics
  profitMarginIndex: pct01(0.5),
  capexIndex: pct01(0.5),
  defaultRate: pct01(0.02),
  fundingTightness: pct01(0.3),
  financialStress: pct01(0.4),
}, { _id: false });

/**
 * ------------------------------
 * 5. Policy & Guidance
 * ------------------------------
 */
const PolicyMoveSchema = new Schema({
  type: {
    type: String,
    enum: [
      'rate_hike',
      'rate_cut',
      'qe',
      'qt',
      'fiscal_stimulus',
      'fiscal_consolidation',
      'tax_cut',
      'tax_hike',
      'targeted_support',
      'regulatory_change',
      'other'
    ],
    required: true
  },
  magnitude: { ...boundedSigned, default: 0 },            // normalized size, sign indicates direction
  description: String,
  at: { type: Date, default: Date.now }
}, { _id: false });

const PolicyBlockSchema = new Schema({
  regimeLabel: {
    type: String,
    enum: ['easing', 'tightening', 'neutral', 'mixed'],
    default: 'neutral'
  },
  lastMoves: { type: [PolicyMoveSchema], default: [] },
  forwardGuidanceSentiment: { ...boundedSigned, default: 0 }, // -1 dovish, +1 hawkish in tone
}, { _id: false });

/**
 * ------------------------------
 * 6. Shocks & Events
 * ------------------------------
 */
const EconomicShockSchema = new Schema({
  label: { type: String, required: true },                // "oil_price_spike", "banking_crisis", etc.
  type: {
    type: String,
    enum: [
      'commodity',
      'financial',
      'policy',
      'geopolitical',
      'natural_disaster',
      'pandemic',
      'technology',
      'other'
    ],
    required: true
  },
  magnitude: pct01(0.5),                                  // overall size of the shock
  direction: {
    type: String,
    enum: ['positive', 'negative', 'mixed'],
    default: 'negative'
  },
  affectedSectors: { type: [String], default: [] },       // sector codes
  affectedMarkets: { type: [String], default: [] },       // market bucket names
  decayRate: pct01(0.3),                                  // 0 = permanent, 1 = instant fade
  startedAt: { type: Date, default: Date.now },
  expectedDurationDays: { type: Number, default: 30 },
}, { _id: false });

/**
 * ------------------------------
 * 7. Stress & Risk Indices
 * ------------------------------
 */
const StressBlockSchema = new Schema({
  financialSystemStress: pct01(0.3),
  householdStress: pct01(0.3),
  corporateStress: pct01(0.3),
  sovereignStress: pct01(0.2),
  externalBalanceStress: pct01(0.2),
  systemicRiskIndex: pct01(0.3),                           // composite / leading indicator
}, { _id: false });

/**
 * ------------------------------
 * 8. Correlations (optional but powerful)
 * ------------------------------
 */
const CorrelationEdgeSchema = new Schema({
  from: { type: String, required: true },                  // "oil_price", "housingStress"
  to: { type: String, required: true },                    // "inflationRate", "consumerConfidence"
  strength: { ...boundedSigned, default: 0 },              // -1..1
  lastUpdated: { type: Date, default: Date.now },
}, { _id: false });

/**
 * ------------------------------
 * Economic WorldState Fragment
 * ------------------------------
 */
export const EconomicWorldSchema = new Schema({
  macro: { type: MacroEconomySchema, default: () => ({}) },
  markets: { type: [MarketBucketSchema], default: [] },
  sectors: { type: [SectorSchema], default: [] },

  households: { type: HouseholdBlockSchema, default: () => ({}) },
  corporates: { type: CorporateBlockSchema, default: () => ({}) },

  policy: { type: PolicyBlockSchema, default: () => ({}) },
  activeShocks: { type: [EconomicShockSchema], default: [] },

  stress: { type: StressBlockSchema, default: () => ({}) },
  correlations: { type: [CorrelationEdgeSchema], default: [] },

  lastUpdated: { type: Date, default: Date.now }
}, { _id: false });

/**
 * Default export used by your extensions registry.
 * WorldStateFactory (or CoreWorldState) can mount this under domains.economic.
 */
export default {
  name: 'economic',
  worldState: EconomicWorldSchema
  // You can later add:
  // persona: EconomicPersonaSchema,
  // worldStateAdapter: EconomicWorldStateAdapter
};
