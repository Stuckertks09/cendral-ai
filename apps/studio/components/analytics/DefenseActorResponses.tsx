import React from 'react';

export interface DefenseArgument {
  actorKey: string;
  actorLabel?: string;
  theater?: string;
  direction?: string;
  magnitude?: number;
  rationale?: string;
}

export interface DefenseActorResponsesProps {
  title?: string;
  subtitle?: string;
  actorArguments: DefenseArgument[];
}

export const DefenseActorResponses: React.FC<DefenseActorResponsesProps> = ({
  title = 'Actor Responses',
  subtitle = 'How key actors interpreted and reacted to the scenario.',
  actorArguments
}) => {
  if (!actorArguments || actorArguments.length === 0) {
    return null;
  }

  const formatMagnitude = (m?: number) =>
    m != null && Number.isFinite(m) ? m.toFixed(2) : '—';

  const prettifyDirection = (d?: string) => {
    if (!d) return '—';
    return d.replace(/_/g, ' ');
  };

  return (
    <section className="space-y-3">
      <h3 className="text-xs text-gray-300 font-semibold">{title}</h3>
      <p className="text-[11px] text-gray-400">{subtitle}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {actorArguments.map((arg, idx) => (
          <div
            key={`${arg.actorKey}-${idx}`}
            className="border border-gray-800 rounded-xl bg-black/40 px-4 py-3 flex flex-col gap-2"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-gray-100">
                  {arg.actorLabel || arg.actorKey}
                </span>
                {arg.theater && (
                  <span className="text-[10px] text-gray-500">
                    Theater: {arg.theater}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 text-[10px] text-gray-400">
                <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800">
                  {prettifyDirection(arg.direction)}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800">
                  Magnitude: {formatMagnitude(arg.magnitude)}
                </span>
              </div>
            </div>

            {/* Rationale */}
            {arg.rationale && (
              <p className="text-[11px] text-gray-300 leading-snug">
                {arg.rationale}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default DefenseActorResponses;
