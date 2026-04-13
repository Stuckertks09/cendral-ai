import EnterpriseSchema from './schema.js';
import EnterpriseAdapter from './adapter.js';
import EnterpriseWorldState from './worldState.js';
import EnterpriseWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'enterprise',
  schema: EnterpriseSchema,
  adapter: EnterpriseAdapter,
  worldState: EnterpriseWorldState,
  worldStateAdapter: EnterpriseWorldStateAdapter
};
