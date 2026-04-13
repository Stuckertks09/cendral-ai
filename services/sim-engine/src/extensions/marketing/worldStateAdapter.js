// extensions/marketing/worldStateAdapter.js

import MarketingWorldState from './worldState.js';

/**
 * Adapter to apply marketing-relevant events
 * that influence sentiment, virality, and trust.
 */
export default class MarketingWorldStateAdapter {
  constructor(worldState = new MarketingWorldState()) {
    this.state = worldState;
  }

  applyEvent(event) {
    if (!event?.type) return;

    switch (event.type) {
      case 'campaign_launch':
        // Positive bump to sentiment + virality
        this.state.sentiment = Math.min(1, this.state.sentiment + 0.05);
        this.state.virality = Math.min(1, this.state.virality + 0.1);
        break;

      case 'negative_press':
        // Drop trust + sentiment, raise virality (bad news spreads)
        this.state.trust = Math.max(0, this.state.trust - 0.15);
        this.state.sentiment = Math.max(0, this.state.sentiment - 0.1);
        this.state.virality = Math.min(1, this.state.virality + 0.05);
        break;

      case 'influencer_boost':
        // Big virality spike, small sentiment increase
        this.state.virality = Math.min(1, this.state.virality + 0.2);
        this.state.sentiment = Math.min(1, this.state.sentiment + 0.03);
        break;

      case 'consumer_backlash':
        // Trust and sentiment crater
        this.state.trust = Math.max(0, this.state.trust - 0.2);
        this.state.sentiment = Math.max(0, this.state.sentiment - 0.15);
        break;

      default:
        break;
    }

    this.state.lastUpdated = Date.now();
  }

  toJSON() {
    return {
      sentiment: this.state.sentiment,
      virality: this.state.virality,
      trust: this.state.trust,
      lastUpdated: this.state.lastUpdated
    };
  }
}
