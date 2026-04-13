// apps/studio/lib/api/settings.ts

export const updateSettings = async (
  system: string,
  settings: Record<string, unknown>
): Promise<void> => {
  await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, settings }),
  });
};
