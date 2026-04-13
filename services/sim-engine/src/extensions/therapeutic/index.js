import TherapeuticSchema from './schema.js';
import TherapeuticAdapter from './adapter.js';
import TherapeuticWorldState from './worldState.js';
import TherapeuticWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'therapeutic',
  schema: TherapeuticSchema,
  adapter: TherapeuticAdapter,
  worldState: TherapeuticWorldState,
  worldStateAdapter: TherapeuticWorldStateAdapter
};
