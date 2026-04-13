// src/world/extensions/index.js

import consumer from '../../../extensions/consumer/index.js';
import content from '../../../extensions/content/index.js';
import enterprise from '../../../extensions/enterprise/index.js';
import marketing from '../../../extensions/marketing/index.js';
import political from '../../../extensions/political/index.js';
import therapeutic from '../../../extensions/therapeutic/index.js';
import game from '../../../extensions/game/index.js';
import economic from '../../../extensions/economic/schema.js';
import defense from '../../../extensions/defense/index.js';

// Registry of world-level extensions
export const WORLD_EXTENSIONS = {
  consumer,
  content,
  enterprise,
  marketing,
  political,
  therapeutic,
  game,
  economic,
  defense 
};

export function getWorldExtension(name) {
  return WORLD_EXTENSIONS[name];
}

export function listWorldExtensions() {
  return Object.keys(WORLD_EXTENSIONS);
}

// ⭐ Add this so your imports work:
export default WORLD_EXTENSIONS;
