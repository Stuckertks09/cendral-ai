import DefenseSettingsPanel from "@/components/defense/DefensePanel";

export default function DefenseDomainPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-semibold text-white">
        Defense Domain Settings
      </h1>

      <p className="text-sm text-slate-400">
        Configure baseline topic weights and uncertainty priors
        used by all defense simulations.
      </p>

      <DefenseSettingsPanel />
    </div>
  );
}
