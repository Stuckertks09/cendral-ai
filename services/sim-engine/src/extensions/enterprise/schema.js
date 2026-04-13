// extensions/EnterpriseExtension.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const EnterpriseExtensionSchema = new Schema({
  role: String,
  seniority: String,
  department: String,
  industry: String,

  decisionMaker: { type: Boolean, default: false },

  buyingTriggers: [{
    signal: String,
    weight: bounded(0, 1)
  }],

  riskTolerance: bounded(0, 1),

  workflow: [{
    stage: String,
    friction: bounded(0, 1),
    authorityNeeded: Boolean
  }],

  painPoints: [String]
}, { _id: false });

export default EnterpriseExtensionSchema;
