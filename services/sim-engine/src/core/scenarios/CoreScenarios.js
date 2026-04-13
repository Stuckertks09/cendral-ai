// src/core/scenarios/CoreScenarios.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * A Scenario is a named, reusable package of events.
 * It does NOT assume a specific domain, but can be tagged / scoped.
 */

const ScenarioEventSchema = new Schema(
  {
    // Human-readable label for this step (for UI)
    label: { type: String },

    description: { type: String },

    // Order in scenario (0,1,2...) – also used as default injectAtStep
    order: { type: Number, default: 0, index: true },

    // When to inject this event into a run (step-wise)
    injectAtStep: { type: Number },

    // Reference to an existing Event (recommended)
    eventId: { type: Schema.Types.ObjectId, ref: 'Event' },

    // Optional inline event payload (if you want scenarios to own their own events)
    inlineEvent: {
      type: Schema.Types.Mixed,
    },

    // Optional tags for this step (e.g. "trigger", "response")
    tags: [{ type: String }],
  },
  { _id: true },
);

const ScenarioSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, index: true },
    description: { type: String },

    // High-level domain the scenario is meant for (but events can cross domains)
    domain: {
      type: String,
      enum: [
        'political',
        'therapeutic',
        'enterprise',
        'marketing',
        'consumer',
        'content',
        'game',
        'defense',
        'general',
        'multi',
      ],
      default: 'general',
      index: true,
    },

    // Freeform tags (e.g. "taiwan", "escalation", "training")
    tags: [{ type: String, index: true }],

    // Whether this should be shown / selectable by default
    isActive: { type: Boolean, default: true, index: true },

    // Optional run configuration hints for the sim
    runConfig: {
      maxSteps: { type: Number },
      autoAdvance: { type: Boolean, default: true },
      stepIntervalMs: { type: Number },
      notes: { type: String },
      // Anything else you want later
      metadata: { type: Schema.Types.Mixed },
    },

    // Ordered list of scenario steps
    events: [ScenarioEventSchema],

    // Optional ownership / provenance
    createdBy: { type: String },
    updatedBy: { type: String },

    archivedAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

ScenarioSchema.index({ domain: 1, isActive: 1, createdAt: -1 });
ScenarioSchema.index({ slug: 1 }, { unique: false });

/**
 * Simple slug generator; you can replace with something fancier later.
 */
ScenarioSchema.pre('save', function () {
  // `this` is the scenario document
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')   // replace non-alphanum with dashes
      .replace(/^-+|-+$/g, '')       // trim leading/trailing dashes
      .substring(0, 80);             // cap length
  }
});

const ScenarioModel =
  mongoose.models.Scenario || mongoose.model('Scenario', ScenarioSchema);

export default ScenarioModel;
