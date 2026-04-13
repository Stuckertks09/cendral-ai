// extensions/GameExtension.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const GameExtensionSchema = new Schema({
  faction: String,
  alignment: { type: String, enum: ['lawful','neutral','chaotic'] },
  moralAxis: { type: String, enum: ['good','neutral','evil'] },

  skills: [{
    name: String,
    level: bounded(0, 1)
  }],

  inventory: [String],

  questState: [{
    questId: String,
    status: { type: String, enum: ['not_started','active','complete','failed'] },
    notes: String
  }]
}, { _id: false });

export default GameExtensionSchema;
