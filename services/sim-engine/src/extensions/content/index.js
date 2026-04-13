import ContentSchema from './schema.js';
import ContentAdapter from './adapter.js';
import ContentWorldState from './worldState.js';
import ContentWorldStateAdapter from './worldStateAdapter.js';

export default {
  name: 'content',
  schema: ContentSchema,
  adapter: ContentAdapter,
  worldState: ContentWorldState,
  worldStateAdapter: ContentWorldStateAdapter
};
