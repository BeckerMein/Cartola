export const POSITION_LABELS: Record<number, string> = {
  1: "Goleiro",
  2: "Lateral",
  3: "Zagueiro",
  4: "Meia",
  5: "Atacante",
  6: "Técnico",
};

export const POSITION_GROUPS = {
  GK: [1],
  DEF: [2, 3],
  MID: [4],
  FWD: [5],
};

export type PositionGroup = keyof typeof POSITION_GROUPS;
