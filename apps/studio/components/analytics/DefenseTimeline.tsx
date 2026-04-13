interface DefenseTimelineStep {
  stepIndex: number;
  createdAt?: string;
  metrics: {
    systemEscalationRisk: number;
    allianceCohesion: number;
    deterrenceBalance: number;
  };
}

interface DefenseTimelineProps {
  steps: DefenseTimelineStep[];
}

export function DefenseTimeline(props: DefenseTimelineProps) {
  const { steps } = props;

  if (!steps || steps.length === 0) {
    return null;
  }

  const formatVal = (v: number) =>
    Number.isFinite(v) ? v.toFixed(2) : '—';

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString();
  };

  const EPS = 0.001;

  return (
    <section className="space-y-3">
      <h3 className="text-xs text-gray-300 font-semibold">
        Scenario Timeline
      </h3>
      <p className="text-[11px] text-gray-400">
        Step-by-step evolution of escalation risk, alliance cohesion, and deterrence balance
        across this run.
      </p>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const prev = index > 0 ? steps[index - 1] : undefined;
          const isBaseline = index === 0;

          const { systemEscalationRisk, allianceCohesion, deterrenceBalance } =
            step.metrics;

          const lines: string[] = [];

          if (isBaseline) {
            lines.push(
              `Baseline escalation risk: ${formatVal(systemEscalationRisk)}`,
              `Baseline alliance cohesion: ${formatVal(allianceCohesion)}`,
              `Baseline deterrence balance: ${formatVal(deterrenceBalance)}`
            );
          } else if (prev) {
            const prevM = prev.metrics;

            if (
              Math.abs(prevM.systemEscalationRisk - systemEscalationRisk) >
              EPS
            ) {
              lines.push(
                `Escalation risk: ${formatVal(
                  prevM.systemEscalationRisk
                )} → ${formatVal(systemEscalationRisk)}`
              );
            }

            if (
              Math.abs(prevM.allianceCohesion - allianceCohesion) >
              EPS
            ) {
              lines.push(
                `Alliance cohesion: ${formatVal(
                  prevM.allianceCohesion
                )} → ${formatVal(allianceCohesion)}`
              );
            }

            if (
              Math.abs(prevM.deterrenceBalance - deterrenceBalance) >
              EPS
            ) {
              lines.push(
                `Deterrence balance: ${formatVal(
                  prevM.deterrenceBalance
                )} → ${formatVal(deterrenceBalance)}`
              );
            }

            if (lines.length === 0) {
              lines.push('No significant metric change from previous step.');
            }
          }

          return (
            <div
              key={step.stepIndex}
              className="border border-gray-800 rounded-lg bg-black/40 px-4 py-3"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-100">
                    {isBaseline
                      ? `Step ${step.stepIndex} · Baseline`
                      : `Step ${step.stepIndex}`}
                  </span>
                  {step.createdAt && (
                    <span className="text-[10px] text-gray-500">
                      {formatDate(step.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 text-[10px] text-gray-400">
                  <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800">
                    Esc: {formatVal(systemEscalationRisk)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800">
                    Coh: {formatVal(allianceCohesion)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800">
                    Det: {formatVal(deterrenceBalance)}
                  </span>
                </div>
              </div>

              <ul className="mt-1 space-y-1 text-[11px] text-gray-300">
                {lines.map((line, i) => (
                  <li key={i} className="flex gap-1">
                    <span className="mt-0.5 text-gray-500">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
