// studio/lib/splitFields.ts
export function splitKnownUnknown<T extends Record<string, unknown>>(
  data: T,
  knownKeys: readonly string[]
): {
  known: Partial<T>;
  unknown: Partial<T>;
} {
  const known: Partial<T> = {};
  const unknown: Partial<T> = {};

  (Object.keys(data) as Array<keyof T>).forEach((key) => {
    if (knownKeys.includes(key as string)) {
      known[key] = data[key];
    } else {
      unknown[key] = data[key];
    }
  });

  return { known, unknown };
}
