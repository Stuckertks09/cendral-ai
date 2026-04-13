// extensions/Content/schema.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const bounded = (min, max) => ({ type: Number, min, max });

const ContentExtensionSchema = new Schema({
  writingStyle: {
    tone: String,
    cadence: String,
    vocabularyLevel: String
  },

  frameworks: [{
    name: String,
    steps: [String]
  }],

  editorialPreferences: {
    structure: String,
    wantsHeadlines: Boolean,
    prefersExamples: Boolean
  },

  domainExpertise: [{
    topic: String,
    depth: bounded(0, 1)
  }],

  storyMemory: [{
    arc: String,
    characters: [String],
    details: [String]
  }]
}, { _id: false });

export default ContentExtensionSchema;
