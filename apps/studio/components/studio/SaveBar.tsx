export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  label,
}: {
  dirty: boolean;
  saving: boolean;
  label: string;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!dirty) return null;

  return (
    <div className="border-t border-gray-800 bg-black/80 backdrop-blur-sm px-6 py-3 flex items-center justify-between">
      <span className="text-xs text-gray-300">{label}</span>
      <div className="flex gap-3">
        <button
          onClick={onDiscard}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-md border border-gray-700 text-gray-200 hover:bg-gray-800"
        >
          Discard
        </button>
        <button
          onClick={onSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded-md bg-emerald-500 text-black font-medium hover:bg-emerald-400 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
