export type Scalar = string | number | boolean | null;

export type EditorValue =
  | Scalar
  | EditorValue[]
  | { [key: string]: EditorValue };

export type Path = Array<string | number>;
