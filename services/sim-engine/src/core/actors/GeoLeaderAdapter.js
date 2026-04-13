// core/actors/GeoLeaderAdapter.js

export default class GeoLeaderAdapter {
  constructor(actors, leaders) {
    this.actors = actors;   // array of GeoActor docs or plain objects
    this.leaders = leaders; // array of GeoLeader docs or plain objects
  }

  runLeaderUpdates(event) {
    for (const leader of this.leaders) {
      this.#updateLeaderState(leader, event);
      this.#applyLeaderInfluenceToActor(leader);
    }
  }

  #updateLeaderState(leader, event) {
    if (!event) return;

    // Example: military crisis increases stress + escalation tendency
    if (
      ["border_incident", "airspace_violation", "naval_encounter"]
        .includes(event.type)
    ) {
      leader.approval = Math.max(0, leader.approval - 0.02);
      leader.crisisResponse.escalationBias = Math.min(
        1,
        leader.crisisResponse.escalationBias + 0.05
      );
    }

    if (event.type === "treaty_signed" || event.type === "ceasefire") {
      leader.crisisResponse.diplomacyBias = Math.min(
        1,
        leader.crisisResponse.diplomacyBias + 0.05
      );
    }

    // Add more crisis → leader psychological mappings as needed
  }

  #applyLeaderInfluenceToActor(leader) {
    const actor = this.actors.find(a => a.key === leader.actorKey);
    if (!actor) return;

    // Leader’s ideology modifies actor doctrine
    actor.doctrine.hawkishness += leader.ideology.hawkishness * 0.05;
    actor.doctrine.escalationTolerance += leader.ideology.riskTolerance * 0.05;

    // Leader crisis profile modifies actor overall posture
    actor.doctrine.escalationTolerance += leader.crisisResponse.escalationBias * 0.03;
    actor.doctrine.autonomy += leader.crisisResponse.allianceLoyalty * -0.02;

    // Leader “doctrineInfluence” explicitly overrides certain actor traits
    actor.military.readiness += leader.doctrineInfluence.militaryPosture * 0.03;
    actor.military.strength += leader.doctrineInfluence.militaryPosture * 0.02;

    // Keep clamped
    this.#clampActor(actor);
  }

  #clampActor(actor) {
    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    actor.doctrine.hawkishness = clamp(actor.doctrine.hawkishness, -1, 1);
    actor.doctrine.autonomy = clamp(actor.doctrine.autonomy, -1, 1);
    actor.doctrine.escalationTolerance = clamp(actor.doctrine.escalationTolerance, 0, 1);

    actor.military.readiness = clamp(actor.military.readiness, 0, 1);
    actor.military.strength = clamp(actor.military.strength, 0, 1);
  }
}
