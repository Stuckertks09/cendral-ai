// core/actors/GeoActorAdapter.js

export default class GeoActorAdapter {
  constructor(actors) {
    this.actors = actors;
  }

  applyEvent(event) {
    for (const actor of this.actors) {
      this.#applyDirectEvent(actor, event);
    }
  }

  #applyDirectEvent(actor, event) {
    if (!event) return;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    // Example: sanctions
    if (event.type === "economic_sanction" && event.target === actor.key) {
      actor.doctrine.autonomy = clamp(actor.doctrine.autonomy + 0.05, -1, 1);
      actor.relations.forEach(rel => {
        if (rel.type === "ally") rel.trust = clamp(rel.trust - 0.02, 0, 1);
      });
    }

    // Example: border incident → affects doctrine & readiness
    if (event.type === "border_incident" && event.actor === actor.key) {
      actor.military.readiness = clamp(actor.military.readiness + 0.05, 0, 1);
      actor.doctrine.hawkishness = clamp(actor.doctrine.hawkishness + 0.05, -1, 1);
    }

    // Example: cyber attack → cyber capability awareness
    if (event.type === "cyber_attack" && event.target === actor.key) {
      actor.military.cyberCapability = clamp(actor.military.cyberCapability + 0.03, 0, 1);
      actor.doctrine.escalationTolerance = clamp(actor.doctrine.escalationTolerance + 0.02, 0, 1);
    }

    // Modify presence in theater if event specifies
    if (event.payload?.theater && event.type === "military_exercise") {
      const presence = actor.presence.find(p => p.theaterKey === event.payload.theater);
      if (presence) {
        presence.forceLevel = clamp(presence.forceLevel + 0.05, 0, 1);
        presence.posture = "offensive";
      }
    }
  }
}
