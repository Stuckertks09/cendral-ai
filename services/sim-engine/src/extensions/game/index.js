import GameSchema from './schema.js';
import GameAdapter from './adapter.js';
import GameWorldState from './worldState.js';
import GameWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'game',
  schema: GameSchema,
  adapter: GameAdapter,
  worldState: GameWorldState,
  worldStateAdapter: GameWorldStateAdapter
};
