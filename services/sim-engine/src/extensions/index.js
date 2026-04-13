// src/extensions/index.js

import therapeutic from './therapeutic/index.js';
import consumer from './consumer/index.js';
import enterprise from './enterprise/index.js';
import marketing from './marketing/index.js';
import content from './content/index.js';
import game from './game/index.js';
import defense from './defense/index.js';

// Map of extensionName -> manifest { name, schema, adapter }
export const EXTENSIONS = {
  therapeutic,
  consumer,
  enterprise,
  marketing,
  content,
  game,
  defense
};

/**
 * Get a single extension manifest by name.
 * Returns undefined if not registered.
 */
export function getExtension(name) {
  return EXTENSIONS[name];
}

/**
 * List all registered extension names.
 */
export function listExtensions() {
  return Object.keys(EXTENSIONS);
}

export default EXTENSIONS;
