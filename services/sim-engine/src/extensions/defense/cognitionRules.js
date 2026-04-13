// extensions/defense/rules.js

export default [
  {
    name: "attack_raises_threat_perception",
    trigger: { eventType: "terror_attack" },
    effect: {
      target: "persona.extensions.defense.threatPerception[theater].level",
      operator: "add",
      value: 0.2,
      bounds: [0, 1]
    },
    weight: 1.0,
    slider: "threatSensitivity"
  },

  {
    name: "alliance_buffers_escalation",
    trigger: { eventType: "border_incident" },
    effect: {
      target: "persona.extensions.defense.posture.escalationPreference",
      operator: "add",
      value: -0.1,
      bounds: [0, 1]
    },
    weight: 0.7,
    slider: "allianceReliance"
  },

  {
    name: "exercises_raise_tension_but_not_doctrine",
    trigger: { eventType: "military_exercise" },
    effect: {
      target: "world.defense.theaters[theater].tension",
      operator: "add",
      value: 0.1,
      bounds: [0, 1]
    },
    weight: 0.8,
    slider: "exerciseSensitivity"
  },

  {
    name: "treaties_reduce_threat_and_escalation",
    trigger: { eventType: "treaty_signed" },
    effect: {
      target: "persona.extensions.defense.posture.escalationPreference",
      operator: "add",
      value: -0.15,
      bounds: [0, 1]
    },
    weight: 1.0,
    slider: "cooperationPreference"
  }
];
