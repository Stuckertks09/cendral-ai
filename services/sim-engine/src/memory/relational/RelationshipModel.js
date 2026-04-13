// memory/relational/RelationshipModel.js
export const RELATION_TYPES = {
  ALLY: "ally",
  RIVAL: "rival",
  NEUTRAL: "neutral",
};

export function classifyRelation({ trust, hostility }) {
  if (trust > 0.7 && hostility < 0.3) return RELATION_TYPES.ALLY;
  if (hostility > 0.6) return RELATION_TYPES.RIVAL;
  return RELATION_TYPES.NEUTRAL;
}