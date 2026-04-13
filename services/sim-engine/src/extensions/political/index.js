import PoliticalSchema from './schema.js';
import PoliticalAdapter from './adapter.js';
import PoliticalWorldState from './worldState.js';
import PoliticalWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'political',
  schema: PoliticalSchema,
  adapter: PoliticalAdapter,
  worldState: PoliticalWorldState,
  worldStateAdapter: PoliticalWorldStateAdapter
};
