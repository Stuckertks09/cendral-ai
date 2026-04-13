// =======================================================
// Persona Snapshot
// =======================================================
export interface PersonaSnapshot {
  personaId: string;
  summary?: string;
}

// =======================================================
// POLITICAL DOMAIN
// =======================================================
export interface PoliticalMetrics {
  polarization: number;
  radicalization: number;
  instability: number;
}

export interface PoliticalTopic {
  topic: string;
  label: string;
  stance: number;
  certainty: number;
  volatility: number;
}

export interface PoliticalSlice {
  topics?: PoliticalTopic[];
  topicEdges?: Array<unknown>;
  metrics?: PoliticalMetrics;
}

export type UnknownRecord = Record<string, unknown>;

// =======================================================
// DEFENSE DOMAIN (for visualization)
// =======================================================
export interface DefenseTheater {
  key: string;
  label: string;
  region?: string;

  tension: number;
  stability: number;
  conflictProbability: number;
  alliedPresence: number;
  adversaryPresence: number;
  escalationRisk: number;
}

export interface DefenseMetrics {
  systemEscalationRisk: number;
  allianceCohesion: number;
  deterrenceBalance: number;
  activeConflictCount?: number;
}

export interface DefenseDebugLayer {
  perception?: unknown;
  arguments?: unknown;
  arbitration?: unknown;
}

export interface DefenseSlice {
  theaters: DefenseTheater[];
  metrics: DefenseMetrics;
  relations?: unknown[];
}

// =======================================================
// WORLD STATE
// (Unified + Modular + No Duplicates)
// =======================================================
export interface WorldState {
  stepIndex: number;
  runId?: string;
  basedOnEvent?: string;
  createdAt?: string;

  // Emotional global fields (optional)
  globalEmotion?: {
    valence: number;
    arousal: number;
    tension: number;
    cohesion: number;
    entropy: number;
  };

  // Optional environment variables
  envVars?: Array<{ key: string; value: unknown }>;

  // DOMAIN SLICES
  political?: PoliticalSlice;
  defense?: DefenseSlice;
  consumer?: Record<string, unknown>;
  content?: Record<string, unknown>;
  enterprise?: Record<string, unknown>;
  marketing?: Record<string, unknown>;
  therapeutic?: Record<string, unknown>;
  game?: Record<string, unknown>;
  economic?: Record<string, unknown>;

  // Persona snapshots (for persona evolution panel)
  personaSnapshots?: PersonaSnapshot[];

  // Debug containers (LLM traces, arbitration details)
  debug?: {
    political?: unknown;
    defense?: DefenseDebugLayer;
    [key: string]: unknown;
  };

  // Catch-all for future arbitrary domains
  [key: string]: unknown;
}

// =======================================================
// Persona Summary for UI Lists
// =======================================================
export interface PersonaSummary {
  _id: string;
  identity?: {
    name: string;
    avatarUrl?: string;
  };
}

// =======================================================
// Diff Object (for visualization)
// =======================================================
export type WorldStateDiff = Record<
  string,
  {
    before: unknown;
    after: unknown;
  }
>;
