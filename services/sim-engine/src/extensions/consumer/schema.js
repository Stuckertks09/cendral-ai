// src/extensions/consumer/schema.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const ConsumerExtensionSchema = new Schema({
  deviceGraph: [{
    type: { type: String }, // phone, laptop, TV, etc.
    os: String,
    brand: String,
    primary: Boolean
  }],

  contentAffinities: [{
    category: String,
    heat: bounded(0, 1),
    examples: [String]
  }],

  purchaseBehavior: {
    impulseScore: bounded(0, 1),
    priceSensitivity: bounded(0, 1),
    brandLoyalty: bounded(0, 1),
    ecoPreference: bounded(0, 1)
  },

  channels: [{
    type: String, // youtube, tiktok, email, etc.
    engagement: bounded(0, 1)
  }],

  adPreferences: {
    tone: String,
    cta: String,
    remarketingTolerance: bounded(0, 1)
  }
}, { _id: false });

export default ConsumerExtensionSchema;
