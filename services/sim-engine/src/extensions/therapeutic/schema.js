// extensions/TherapeuticExtension.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const TherapeuticExtensionSchema = new Schema({
  attachmentStyle: {
    type: String,
    enum: ['secure','anxious','avoidant','fearful','disorganized']
  },

  coping: [{
    strategy: String,
    effectiveness: bounded(0, 1),
    usage: bounded(0, 1)
  }],

  schemas: [{
    type: String,  // abandonment, mistrust, failure, etc.
    severity: bounded(0, 1)
  }],

  emotionalSensitivity: bounded(0, 1),

  therapeuticGoals: [{
    goal: String,
    priority: bounded(0, 1)
  }]
}, { _id: false });

export default TherapeuticExtensionSchema;
