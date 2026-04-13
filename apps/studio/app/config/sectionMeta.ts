// studio/config/sectionMeta.ts
export type SectionMeta = {
  title: string;
  keys: string[];
};

export const PERSONA_SECTIONS: SectionMeta[] = [
  {
    title: "Identity",
    keys: ["identity"],
  },
  {
    title: "Demographics",
    keys: ["demographics"],
  },
  {
    title: "Geography",
    keys: ["geography"],
  },
  {
    title: "Values",
    keys: ["values"],
  },
];
