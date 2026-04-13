export type RawSignal = {
  _id: string;
  source: 'newsapi' | 'twitter';
  headline: string;
  relevanceScore: number;
  llmMeta: {
    one_sentence_brief: string;
    actors: string[];
    topics: string[];
    location: string | null;
    event_type: string | null;
  };
  author?: string;
  publishedAt: string;
};

export type SeverityInputs = {
  impactMagnitude: number;
  scope: number;
  immediacy: number;
  reversibility: number;
  novelty: number;
  escalationFactor: number;
};

export type SeverityAnalysis = {
  magnitude: number;
  direction: string;
  inputs: SeverityInputs;
  sentiment: number | null;
  modelVersion: string;
  ruleBasedSeverity: number;
  llmSeverity: number;
  llmWeight: number;
  ruleWeight: number;
  noveltyScore: number;
};

export type SeverityPreview = {
  severity: SeverityAnalysis;
};