// core/actors/ActorInfluenceEngine.js

export default class ActorInfluenceEngine {
  constructor(actors) {
    this.actors = actors;
  }

  propagate() {
    for (const actor of this.actors) {
      for (const rel of actor.relations) {
        const target = this.actors.find(a => a.key === rel.target);
        if (!target) continue;

        // trust reduces tension, hostility increases tension
        const delta = (rel.hostility - rel.trust) * 0.05;

        actor.doctrine.hawkishness = this.#clamp(actor.doctrine.hawkishness + delta, -1, 1);
        target.doctrine.hawkishness = this.#clamp(target.doctrine.hawkishness + delta, -1, 1);

        // Rivalry → more autonomy
        if (rel.type === "rival") {
          actor.doctrine.autonomy = this.#clamp(actor.doctrine.autonomy + 0.02, -1, 1);
        }

        // Ally → more alliance cooperation (less autonomy)
        if (rel.type === "ally") {
          actor.doctrine.autonomy = this.#clamp(actor.doctrine.autonomy - 0.02, -1, 1);
        }
      }
    }
  }

  #clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }
}
