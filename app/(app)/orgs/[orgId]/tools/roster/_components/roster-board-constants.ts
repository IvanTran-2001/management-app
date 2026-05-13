/**
 * roster-board-constants.ts
 * Cell size constants exported so the same grid can be reused for template mode.
 */

export const ROSTER_CELL_WIDTH = 160; // px — each week column
export const ROSTER_DAY_LABEL_WIDTH = 120; // px — left day label column
export const ROSTER_CELL_MIN_HEIGHT = 64; // px — minimum row height

export const DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const DAY_KEYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
