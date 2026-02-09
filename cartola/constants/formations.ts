export const FORMATIONS = ["4-3-3", "4-4-2", "5-3-2", "5-2-3", "4-5-1"] as const;

export type Formation = (typeof FORMATIONS)[number];

export const FORMATION_LIMITS: Record<Formation, { DEF: number; MID: number; FWD: number }> = {
  "4-3-3": { DEF: 4, MID: 3, FWD: 3 },
  "4-4-2": { DEF: 4, MID: 4, FWD: 2 },
  "5-3-2": { DEF: 5, MID: 3, FWD: 2 },
  "5-2-3": { DEF: 5, MID: 2, FWD: 3 },
  "4-5-1": { DEF: 4, MID: 5, FWD: 1 },
};

export const DEFAULT_FORMATION: Formation = "4-3-3";
