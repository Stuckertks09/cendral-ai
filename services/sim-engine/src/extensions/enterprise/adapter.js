export default class EnterpriseAdapter {
  constructor(persona) {
    this.persona = persona;
  }

  applyDefaults(data = {}) {
    this.persona.extensions = this.persona.extensions || {};
    this.persona.extensions.enterprise = {
      ...(this.persona.extensions.enterprise || {}),
      ...data
    };
  }

  updateRoleCompetency(role, delta) {
    const ext = this.persona.extensions.enterprise;
    if (!ext?.competencies) return;

    const comp = ext.competencies.find(c => c.role === role);
    if (comp) {
      comp.score = Math.min(1, Math.max(0, comp.score + delta));
    }
  }

  updateOrgRelationship(name, delta) {
    const ext = this.persona.extensions.enterprise;
    if (!ext?.relationships) return;

    const rel = ext.relationships.find(r => r.with === name);
    if (rel) {
      rel.trust = Math.min(1, Math.max(0, rel.trust + delta));
    }
  }

  updateFromEvent(event) {
    // corporate conflicts, feedback cycles, etc.
  }

  toJSON() {
    return this.persona.extensions?.enterprise || {};
  }
}
