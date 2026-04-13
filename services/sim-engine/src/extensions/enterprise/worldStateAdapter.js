// extensions/enterprise/worldState.js

/**
 * Minimal Enterprise WorldState segment.
 * This represents how the personas or org-level structures
 * evolve in enterprise / workplace simulations.
 */

export default class EnterpriseWorldState {
  constructor(data = {}) {
    this.orgHealth = data.orgHealth ?? 0.5;        // org culture cohesion 0..1
    this.conflictLevel = data.conflictLevel ?? 0.3; // workplace friction
    this.productivity = data.productivity ?? 0.5;   // overall team efficiency

    this.lastUpdated = data.lastUpdated ?? Date.now();
  }

  clone() {
    return new EnterpriseWorldState(JSON.parse(JSON.stringify(this)));
  }
}
