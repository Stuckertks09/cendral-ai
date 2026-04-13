// extensions/game/worldStateAdapter.js

import GameWorldState from './worldState.js';

/**
 * Applies game-like events to the world:
 * battles, discoveries, crises, teamwork, etc.
 */

export default class GameWorldStateAdapter {
  constructor(worldState = new GameWorldState()) {
    this.state = worldState;
  }

  applyEvent(event) {
    if (!event?.type) return;

    switch (event.type) {
      case 'battle':
        // Increase tension, drop morale & resources
        this.state.tension = Math.min(1, this.state.tension + 0.2);
        this.state.morale = Math.max(0, this.state.morale - 0.1);
        this.state.resources = Math.max(0, this.state.resources - 0.1);
        break;

      case 'victory':
        // Big morale spike, slightly reduce tension, progress forward
        this.state.morale = Math.min(1, this.state.morale + 0.2);
        this.state.tension = Math.max(0, this.state.tension - 0.1);
        this.state.progress = Math.min(1, this.state.progress + 0.1);
        break;

      case 'discovery':
        // Increase resources & progress
        this.state.resources = Math.min(1, this.state.resources + 0.15);
        this.state.progress = Math.min(1, this.state.progress + 0.05);
        break;

      case 'crisis':
        // Sharp rise in tension, drop morale & resources
        this.state.tension = Math.min(1, this.state.tension + 0.25);
        this.state.morale = Math.max(0, this.state.morale - 0.2);
        this.state.resources = Math.max(0, this.state.resources - 0.15);
        break;

      case 'teamwork':
        // Boost morale, reduce tension
        this.state.morale = Math.min(1, this.state.morale + 0.1);
        this.state.tension = Math.max(0, this.state.tension - 0.05);
        break;

      case 'resource_gain':
        this.state.resources = Math.min(1, this.state.resources + 0.1);
        break;

      case 'resource_loss':
        this.state.resources = Math.max(0, this.state.resources - 0.1);
        break;

      default:
        break;
    }

    this.state.lastUpdated = Date.now();
  }

  toJSON() {
    return {
      morale: this.state.morale,
      tension: this.state.tension,
      resources: this.state.resources,
      progress: this.state.progress,
      lastUpdated: this.state.lastUpdated
    };
  }
}
