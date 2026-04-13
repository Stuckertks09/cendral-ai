// extensions/defense/index.js
import DefenseSchema from "./schema.js";
import DefenseAdapter from "./adapter.js";
import DefenseWorldState from "./worldState.js";
import DefenseWorldStateAdapter from "./worldStateAdapter.js";

export default {
  name: "defense",
  schema: DefenseSchema,
  adapter: DefenseAdapter,
  worldState: DefenseWorldState,
  worldStateAdapter: DefenseWorldStateAdapter
};
