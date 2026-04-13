// src/types/configPackage.ts

export type CognitionSettings = {
  emotionalReactivity: number;
  beliefPlasticity: number;
  crossTopicInfluence: number;
  moodDecayRate: number;
  trustWeight: number;
  identityProtection: number;
  noveltySensitivity: number;
  globalChaos: number;

  // optional packs (defense, etc.)
  defensePack?: Record<string, number>;
};

export type MemorySettings = {
  useSemanticMemory: boolean;
  useGraphMemory: boolean;
  semanticTopKPersona: number;
  semanticTopKActor: number;
  semanticTopKLeader: number;
  semanticTopKEvents: number;
  semanticWeight: number;
  relationalWeight: number;
  episodicWeight: number;
};

export type SystemSettings = {
  EconomicSystem: Record<string, number>;
  EnvironmentSystem: Record<string, number>;
  InfoFlowSystem: Record<string, number>;
  PopulationSystem: Record<string, number>;
};

export type DomainSettings = {
  defense?: {
    domainConfigId?: string;
    topics?: unknown[];
  };
};

export type ConfigPackage = {
  _id?: string;
  name: string;
  description?: string;
  tags?: string[];

  cognition: CognitionSettings;
  memory: MemorySettings;
  systems: SystemSettings;
  domains: DomainSettings;

  enabledSystems: string[];

  parentPackageId?: string;
  version: number;
  createdBy?: string;
};