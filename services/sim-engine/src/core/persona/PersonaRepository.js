import PersonaModel from '../models/Persona.js';   // your CorePersona mongoose model
import PersonaFactory from './PersonaFactory.js';

class PersonaRepository {
  
  /**
   * Fetch a single persona by ID and hydrate with adapters.
   */
  static async getById(id) {
    const doc = await PersonaModel.findById(id);
    if (!doc) return null;
    return PersonaFactory.hydrateFromDocument(doc);
  }

  /**
   * Fetch multiple personas using a query.
   */
  static async list(filter = {}, options = {}) {
    const docs = await PersonaModel.find(filter, null, options);
    return docs.map(doc => PersonaFactory.hydrateFromDocument(doc));
  }

  /**
   * Create a new persona from core + extension data.
   */
  static async create({ core, extensions }) {
    const persona = PersonaFactory.create(core, extensions);
    const doc = new PersonaModel(persona);
    await doc.save();
    return PersonaFactory.hydrateFromDocument(doc);
  }

  /**
   * Save an updated persona back to Mongo.
   * Strips runtime adapter instances.
   */
  static async save(persona) {
    const json = PersonaFactory.toPublicJSON(persona);
    await PersonaModel.updateOne({ _id: persona._id }, json, { upsert: true });
    return persona;
  }

  /**
   * Delete a persona.
   */
  static async delete(id) {
    await PersonaModel.deleteOne({ _id: id });
  }

  /**
   * Bulk save (for simulation batches)
   */
  static async saveMany(personas) {
    for (const persona of personas) {
      await PersonaRepository.save(persona);
    }
  }

  /**
   * Raw JSON export — useful for UI devtools or debugging.
   */
  static async export(id) {
    const persona = await PersonaRepository.getById(id);
    return PersonaFactory.toPublicJSON(persona);
  }
}

export default PersonaRepository;
