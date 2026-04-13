import ConsumerSchema from './schema.js';
import ConsumerAdapter from './adapter.js';
import ConsumerWorldState from './worldState.js';
import ConsumerWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'consumer',
  schema: ConsumerSchema,
  adapter: ConsumerAdapter,
  worldState: ConsumerWorldState,
  worldStateAdapter: ConsumerWorldStateAdapter
};
