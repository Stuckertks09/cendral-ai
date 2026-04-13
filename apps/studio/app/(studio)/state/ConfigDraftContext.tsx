// src/studio/state/ConfigDraftContext.tsx
'use client';

import React, {
  createContext,
} from 'react';

import type { ConfigPackage } from '@/types/configPackage';

type UpdatePath =
  | { section: 'cognition'; key: keyof ConfigPackage['cognition'] }
  | { section: 'memory'; key: keyof ConfigPackage['memory'] }
  | { section: 'systems'; key: keyof ConfigPackage['systems'] }
  | { section: 'domains'; key: keyof ConfigPackage['domains'] };

type ConfigDraftContextValue = {
  draft: ConfigPackage;
  original: ConfigPackage;

  setDraft: React.Dispatch<React.SetStateAction<ConfigPackage>>;

  updateSection: (
    path: UpdatePath,
    value: unknown
  ) => void;

  resetDraft: () => void;
};

const ConfigDraftContext =
  createContext<ConfigDraftContextValue | null>(null);
