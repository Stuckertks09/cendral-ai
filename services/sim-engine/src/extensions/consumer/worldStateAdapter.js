// extensions/consumer/worldStateAdapter.js

export default class ConsumerWorldStateAdapter {
  constructor(worldState) {
    this.worldState = worldState;
  }

  applyEvent(event) {
    // placeholder logic
    this.worldState.updatedAt = new Date();
  }

  toJSON() {
    return this.worldState;
  }
}
