// src/core/persona/PersonaFactory.js
import CorePersona from './CorePersona.js';
import { EXTENSIONS, getExtension } from '../../extensions/index.js';

export default class PersonaFactory {
  constructor(extensions = EXTENSIONS) {
    this.extensions = extensions;
  }

  /**
   * Create a brand new persona with extension adapters attached.
   */
  create(coreData = {}, extensionsMap = {}) {
    const persona = new CorePersona(coreData);

    // Ensure structures exist
    persona.extensions = persona.extensions || {};
    persona.adapters = persona.adapters || {};

    // Attach extension adapters + defaults
    for (const [name, extData] of Object.entries(extensionsMap)) {
      const manifest = getExtension(name);
      if (!manifest) {
        console.warn(`[PersonaFactory] Unknown extension "${name}" – skipping.`);
        continue;
      }

      const Adapter = manifest.adapter;
      const adapter = new Adapter(persona);

      adapter.applyDefaults(extData || {});
      persona.adapters[name] = adapter;
    }

    return persona;
  }

  /**
   * Hydrate a persona loaded from MongoDB (doc or plain object),
   * preserving and rehydrating all extension adapters.
   */
  loadFromObject(raw) {
    if (!raw) {
      throw new Error("PersonaFactory.loadFromObject: raw object is null or undefined");
    }

    let persona;

    // Case 1: already a Mongoose document (instanceof CorePersona)
    if (raw instanceof CorePersona) {
      persona = raw;
    }
    // Case 2: plain object from .lean()
    else {
      persona = new CorePersona(raw);
    }

    // Ensure extension structures exist
    persona.extensions = persona.extensions || {};
    persona.adapters = {};

    // Rehydrate adapters
    for (const [name, data] of Object.entries(persona.extensions)) {
      const manifest = getExtension(name);
      if (!manifest) continue;

      const Adapter = manifest.adapter;
      const adapter = new Adapter(persona);

      adapter.applyDefaults(data || {});
      persona.adapters[name] = adapter;
    }

    return persona;
  }

  /**
   * Create from generic payload structure.
   */
  fromPayload(payload = {}) {
    const { core = {}, extensions = {} } = payload;
    return this.create(core, extensions);
  }

  /**
   * Prepare persona for API/UI responses.
   */
  toPublicJSON(persona) {
    const obj = persona.toObject ? persona.toObject() : { ...persona };
    delete obj.adapters; // runtime only
    return obj;
  }
}
