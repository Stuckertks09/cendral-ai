export type EventParsed = {
  summary?: string;
  sentiment?: number;
  keywords?: string[];
  entities?: string[];
};

export type EventSummary = {
  _id: string;
  type?: string;
  domain?: string;
  topic?: string;
  severity?: number;
  rawText?: string;
  parsed?: EventParsed;
};

export type ScenarioStep = {
  _id?: string;
  clientId?: string; // 👈 REQUIRED
  label?: string;
  order?: number;
  injectAtStep?: number;
  eventId?: string;
  tags?: string[];
};

export type Scenario = {
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  domain: string;
  tags: string[];
  isActive: boolean;
  runConfig?: {
    autoAdvance?: boolean;
    maxSteps?: number | null;
  };
  steps: ScenarioStep[];
};

export type ScenarioWithLegacyEvents = Scenario & {
  events?: ScenarioStep[];
};
