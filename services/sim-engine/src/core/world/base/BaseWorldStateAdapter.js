export default class BaseWorldStateAdapter {
  constructor(worldState) {
    this.worldState = worldState;
  }

  // optional override points
  onEvent() {}
  onPersonaChanged() {}

  toJSON() {
    return {};
  }
}
