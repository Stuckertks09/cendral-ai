// lib/objectPath.ts
import { EditorValue, Path } from "@/types/editor";

export function getAtPath(
  obj: EditorValue,
  path: Path
): EditorValue | undefined {
  let current: EditorValue | undefined = obj;

  for (const key of path) {
    if (current == null) return undefined;

    if (Array.isArray(current) && typeof key === "number") {
      current = current[key];
    } else if (
      typeof current === "object" &&
      !Array.isArray(current) &&
      typeof key === "string"
    ) {
      current = (current as Record<string, EditorValue>)[key];
    } else {
      return undefined;
    }
  }

  return current;
}

export function setAtPath(
  obj: EditorValue,
  path: Path,
  value: EditorValue
): EditorValue {
  if (path.length === 0) return value;

  const [head, ...rest] = path;

  if (Array.isArray(obj) && typeof head === "number") {
    const copy = [...obj];
    copy[head] = setAtPath(copy[head], rest, value);
    return copy;
  }

  if (typeof obj === "object" && obj !== null && typeof head === "string") {
    return {
      ...obj,
      [head]: setAtPath((obj as Record<string, EditorValue>)[head], rest, value),
    };
  }

  return obj;
}
