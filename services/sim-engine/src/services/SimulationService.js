// src/services/SimulationService.js
import WorldStateManager from './WorldStateManager.js';

export default class SimulationService {
  constructor({ personaFactory, worldStateFactory, systemRegistry }) {
    this.personaFactory = personaFactory;
    this.worldStateFactory = worldStateFactory;
    this.worldStateManager = new WorldStateManager(worldStateFactory);
    this.systemRegistry = systemRegistry; // for domain system updates
  }

  // ----------------------------
  // GET CURRENT STATE
  // ----------------------------

 async createInitialState({ runId, event = null } = {}) {
  return await this.worldStateManager.createInitialWorldState({ runId, event });
}

  async getState() {
    const state = await this.worldStateManager.getLatest();
    if (!state) {
      return this.worldStateManager.reset(); // auto-init if empty
    }
    return state;
  }

  // ----------------------------
  // RESET SIMULATION
  // ----------------------------
  async reset(event = null) {
    return await this.worldStateManager.reset(event);
  }

  // ----------------------------
  // STEP SIMULATION
  // ----------------------------
  async step(event = null) {
    const prev = await this.getState();

    // Clone → new world state for stepIndex+1
    const next = await this.worldStateManager.createNextStep(prev);

    // Bind new state to system registry
    this.systemRegistry.bindWorldState(next);

    // Run domain systems update
    this.systemRegistry.update(event);

    // Save changes
    await next.save();

    return next.toObject();
  }
}
