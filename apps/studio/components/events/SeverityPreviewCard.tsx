interface SeverityPreviewCardProps {
  severity: {
    magnitude: number;
    direction: string;
    inputs: Record<string, number>;
    ruleBasedSeverity: number;
    llmSeverity: number;
    ruleWeight: number;
    llmWeight: number;
    noveltyScore: number;
  };
}

export const SeverityPreviewCard: React.FC<SeverityPreviewCardProps> = ({
  severity
}) => {
  const pct = (v: number) => Math.round(v * 100);

  return (
    <div className="space-y-4 text-sm">
      {/* HEADLINE */}
      <div>
        <div className="text-gray-400 text-xs">Severity</div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-mono text-gray-100">
            {severity.magnitude.toFixed(2)}
          </span>
          <span className="text-xs text-gray-500 capitalize">
            {severity.direction}
          </span>
        </div>
      </div>

      {/* DRIVERS */}
      <div>
        <div className="text-xs text-gray-400 mb-2">Drivers</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
          {Object.entries(severity.inputs).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-2">
              <span className="text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </span>
              <span className="font-mono text-gray-300">
                {pct(value)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* MODEL MIX */}
      <div className="pt-2 border-t border-gray-800">
        <div className="text-xs text-gray-400 mb-1">Model Mix</div>
        <div className="text-[12px] text-gray-300 space-y-1">
          <div>Rule-based: {pct(severity.ruleWeight)}</div>
          <div>LLM-based: {pct(severity.llmWeight)}</div>
          <div>Novelty: {pct(severity.noveltyScore)}</div>
        </div>
      </div>
    </div>
  );
};
