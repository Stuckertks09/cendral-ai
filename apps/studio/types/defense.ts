// apps/studio/components/analytics/defenseTypes.ts

export interface DefenseMetrics {
  systemEscalationRisk: number;
  allianceCohesion: number;
  deterrenceBalance: number;
  activeConflictCount?: number;
}

export interface DefenseDomainState {
  metrics: DefenseMetrics;
  theaters?: unknown[];
  relations?: unknown[];
}

export interface DefensePoint {
  stepIndex: number;
  systemEscalationRisk: number;
  allianceCohesion: number;
  deterrenceBalance: number;
}

export interface DefenseTimelineStep {
  stepIndex: number;
  createdAt?: string;
  metrics: {
    systemEscalationRisk: number;
    allianceCohesion: number;
    deterrenceBalance: number;
  };
}

export interface DefenseArgument {
  actorKey: string;
  actorLabel?: string;
  theater?: string;
  direction?: string;
  magnitude?: number;
  rationale?: string;
}

// debug payload we expect on world state slices
export interface DefenseDebugPayload {
  arguments?: {
    arguments?: DefenseArgument[];
  };
}
