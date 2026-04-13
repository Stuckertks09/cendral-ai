// memory/relational/graphQueries.js
export function getAllianceStrength(relation) {
  return relation.trust - relation.hostility;
}

export function getEscalationRisk(relation) {
  return relation.hostility * (1 - relation.trust);
}

export function computeNetworkCohesion(relations) {
  if (!relations.length) return 0;
  let sum = 0;

  relations.forEach((r) => {
    sum += r.trust - r.hostility;
  });

  return sum / relations.length;
}
