'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from 'recharts';

import { DefenseTimeline } from '@/components/analytics/DefenseTimeline';
import DefenseActorResponses from '@/components/analytics/DefenseActorResponses';
import {
  DefensePoint,
  DefenseTimelineStep,
  DefenseArgument,
  DefenseDomainState,
  DefenseDebugPayload
} from '@/types/defense';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';

/** ECONOMIC TYPES */

type EconomicMacro = {
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  realWageGrowth: number;
  consumerConfidence: number;
  businessConfidence: number;
  marketVolatility: number;
  creditSpreadLevel: number;
  housingStress: number;
  tradeBalanceIndex: number;
  monetaryStance: number;
  fiscalStance: number;
  shortRate: number;
  longRate: number;
};

type EconomicStress = {
  financialSystemStress: number;
  householdStress: number;
  corporateStress: number;
  sovereignStress: number;
  externalBalanceStress: number;
  systemicRiskIndex: number;
};

type EconomicDomainState = {
  macro: EconomicMacro;
  stress: EconomicStress;
  markets?: unknown[];
  sectors?: unknown[];
  households?: Record<string, unknown>;
  corporates?: Record<string, unknown>;
  policy?: Record<string, unknown>;
  activeShocks?: unknown[];
  correlations?: unknown[];
  lastUpdated?: string;
};

/** GENERIC DOMAIN SLICE */

type DomainSlice<T, D = unknown> = {
  stepIndex: number;
  createdAt: string;
  state: T;
  debug?: D;
};

type WorldStateSummary = {
  _id: string;
  runId: string | null;
  stepIndex: number;
  createdAt: string;
};

/** API RESPONSE */

interface WorldRunResponse {
  runId: string;
  steps: WorldStateSummary[];
  domains: {
    defense?: DomainSlice<DefenseDomainState, DefenseDebugPayload>[];
    economic?: DomainSlice<EconomicDomainState>[];
    political?: DomainSlice<Record<string, unknown>>[];
    therapeutic?: DomainSlice<Record<string, unknown>>[];
    marketing?: DomainSlice<Record<string, unknown>>[];
    game?: DomainSlice<Record<string, unknown>>[];
    content?: DomainSlice<Record<string, unknown>>[];
  };
}

type TabKey =
  | 'defense'
  | 'economic'
  | 'political'
  | 'marketing'
  | 'therapeutic'
  | 'game'
  | 'content';

type EconomicPoint = {
  stepIndex: number;
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  financialSystemStress: number;
};

const WorldRunDashboardPage: React.FC = () => {
  const params = useParams<{ runId: string }>();
  const runId = params?.runId;

  const [data, setData] = useState<WorldRunResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('defense');

  useEffect(() => {
    if (!runId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE}/api/world/runs/${runId}`);
        if (!res.ok) {
          throw new Error(`Failed to load world run: ${res.status}`);
        }

        const json: WorldRunResponse = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load run.';
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  /** DEFENSE SERIES */

  const defenseSeries = useMemo<DefensePoint[]>(() => {
    if (!data?.domains.defense) return [];
    return data.domains.defense.map((d) => ({
      stepIndex: d.stepIndex ?? 0,
      systemEscalationRisk: d.state.metrics?.systemEscalationRisk ?? 0,
      allianceCohesion: d.state.metrics?.allianceCohesion ?? 0,
      deterrenceBalance: d.state.metrics?.deterrenceBalance ?? 0
    }));
  }, [data]);

  const defenseTimelineSteps = useMemo<DefenseTimelineStep[]>(() => {
    if (!data?.domains.defense) return [];
    return data.domains.defense.map((d) => ({
      stepIndex: d.stepIndex ?? 0,
      createdAt: d.createdAt,
      metrics: {
        systemEscalationRisk: d.state.metrics?.systemEscalationRisk ?? 0,
        allianceCohesion: d.state.metrics?.allianceCohesion ?? 0,
        deterrenceBalance: d.state.metrics?.deterrenceBalance ?? 0
      }
    }));
  }, [data]);

  const defenseActorArguments = useMemo<DefenseArgument[]>(() => {
    const def = data?.domains.defense;
    if (!def || def.length === 0) return [];
    const last = def[def.length - 1];
    const args = last.debug?.arguments?.arguments;
    return Array.isArray(args) ? args : [];
  }, [data]);

  /** ECONOMIC SERIES */

  const economicSeries = useMemo<EconomicPoint[]>(() => {
    if (!data?.domains.economic) return [];
    return data.domains.economic.map((d) => ({
      stepIndex: d.stepIndex ?? 0,
      gdpGrowth: d.state.macro?.gdpGrowth ?? 0,
      inflationRate: d.state.macro?.inflationRate ?? 0,
      unemploymentRate: d.state.macro?.unemploymentRate ?? 0,
      financialSystemStress:
        d.state.stress?.financialSystemStress ?? 0
    }));
  }, [data]);

  const lastDefense = defenseSeries[defenseSeries.length - 1];
  const lastEconomic = economicSeries[economicSeries.length - 1];

  if (loading && !data) {
    return (
      <div className="p-6 text-sm text-gray-300">
        Loading world run…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 text-sm text-red-400">
        {error || 'Unable to load world run.'}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            World Run: {data.runId}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Step-by-step evolution of domains for this simulation run.
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-gray-900 border border-gray-700 text-gray-200">
            Steps: {data.steps.length}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6 py-2 flex gap-3 text-xs">
        {(
          [
            'defense',
            'economic',
            'political',
            'marketing',
            'therapeutic',
            'game',
            'content'
          ] as TabKey[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'px-2 py-1 rounded-md capitalize ' +
              (tab === t
                ? 'bg-emerald-500 text-black'
                : 'bg-transparent text-gray-300 hover:bg-gray-900')
            }
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 overflow-auto px-6 py-4 space-y-6">
        {tab === 'defense' && (
          <DefenseTab
            series={defenseSeries}
            latest={lastDefense}
            timelineSteps={defenseTimelineSteps}
            actorArguments={defenseActorArguments}
          />
        )}

        {tab === 'economic' && (
          <EconomicTab series={economicSeries} latest={lastEconomic} />
        )}

        {/* TODO: implement other tabs similarly */}
      </main>
    </div>
  );
};

/** DEFENSE TAB */

interface DefenseTabProps {
  series: DefensePoint[];
  latest?: DefensePoint;
  timelineSteps: DefenseTimelineStep[];
  actorArguments: DefenseArgument[];
}

function DefenseTab(props: DefenseTabProps) {
  const { series, latest, timelineSteps, actorArguments } = props;

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MetricCard
            label="System Escalation Risk"
            value={latest.systemEscalationRisk}
          />
          <MetricCard
            label="Alliance Cohesion"
            value={latest.allianceCohesion}
          />
          <MetricCard
            label="Deterrence Balance"
            value={latest.deterrenceBalance}
          />
        </div>
      )}

      {/* Chart + Timeline */}
      <ChartCard title="Defense Metrics Over Steps">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stepIndex" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="systemEscalationRisk"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="allianceCohesion"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="deterrenceBalance"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Scenario timeline directly under chart */}
        <div className="mt-4">
          <DefenseTimeline steps={timelineSteps} />
        </div>
      </ChartCard>

      {/* Actor reasoning cards */}
      <DefenseActorResponses actorArguments={actorArguments} />
    </div>
  );
}

/** ECONOMIC TAB */

interface EconomicTabProps {
  series: EconomicPoint[];
  latest?: EconomicPoint;
}

const EconomicTab: React.FC<EconomicTabProps> = ({ series, latest }) => {
  return (
    <div className="space-y-6">
      {latest && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <MetricCard label="GDP Growth" value={latest.gdpGrowth} />
          <MetricCard label="Inflation" value={latest.inflationRate} />
          <MetricCard
            label="Unemployment"
            value={latest.unemploymentRate}
          />
          <MetricCard
            label="Financial System Stress"
            value={latest.financialSystemStress}
          />
        </div>
      )}

      <ChartCard title="Macro & Stress Over Steps">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stepIndex" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="gdpGrowth" dot={false} />
            <Line type="monotone" dataKey="inflationRate" dot={false} />
            <Line
              type="monotone"
              dataKey="unemploymentRate"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="financialSystemStress"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};

/** SHARED CARDS */

interface MetricCardProps {
  label: string;
  value: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value }) => (
  <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 flex flex-col gap-1">
    <span className="text-[11px] text-gray-400">{label}</span>
    <span className="text-lg font-semibold text-white">
      {Number.isFinite(value) ? value.toFixed(2) : '—'}
    </span>
  </div>
);

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => (
  <div className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3">
    <h3 className="text-xs text-gray-300 mb-2">{title}</h3>
    {children}
  </div>
);

export default WorldRunDashboardPage;
