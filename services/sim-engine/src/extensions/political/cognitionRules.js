export default [
  {
    name: "conflict_increases_arousal",
    trigger: { eventType: "conflict" },
    effect: {
      target: "persona.psychology.arousal",
      operator: "add",
      value: 0.1,
      bounds: [0, 1]
    },
    weight: 1.0,
    slider: "emotionalReactivity"
  },

  {
    name: "trust_amplifies_persuasion",
    trigger: { eventType: "political_content" },
    effect: {
      target: "persona.beliefs[topic].confidence",
      operator: "add",
      value: 0.05,
      bounds: [0, 1]
    },
    weight: 0.6,
    slider: "beliefPlasticity"
  }
];
