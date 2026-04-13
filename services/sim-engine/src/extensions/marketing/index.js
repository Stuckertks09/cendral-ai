import MarketingSchema from './schema.js';
import MarketingAdapter from './adapter.js';
import MarketingWorldState from './worldState.js';
import MarketingWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'marketing',
  schema: MarketingSchema,
  adapter: MarketingAdapter,
  worldState: MarketingWorldState,
  worldStateAdapter: MarketingWorldStateAdapter
};
