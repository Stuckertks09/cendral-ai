// memory/relational/graphSignals.js
import {
  getAllianceStrength,
  getEscalationRisk,
  computeNetworkCohesion,
} from "./graphQueries.js";

export function computeActorSignals(relations) {
  return {
    cohesion: computeNetworkCohesion(relations),
    avgTrust:
      relations.reduce((s, r) => s + r.trust, 0) / relations.length || 0,
    avgHostility:
      relations.reduce((s, r) => s + r.hostility, 0) / relations.length || 0,
    escalationRisk:
      relations.reduce((s, r) => s + getEscalationRisk(r), 0) /
        relations.length || 0,
  };
}

export function computeDyadicSignal(relation) {
  return {
    allianceStrength: getAllianceStrength(relation),
    escalationRisk: getEscalationRisk(relation),
  };
}
