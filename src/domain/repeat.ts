export const repeatModes = ["none", "daily", "weekdays", "weekly"] as const;

export type RepeatMode = (typeof repeatModes)[number];

export const repeatModeLabels: Record<RepeatMode, string> = {
  none: "不循环",
  daily: "每天",
  weekdays: "工作日",
  weekly: "每周",
};

export function normalizeRepeatMode(value: unknown): RepeatMode {
  return typeof value === "string" && repeatModes.includes(value as RepeatMode)
    ? (value as RepeatMode)
    : "none";
}

export function getRepeatModeLabel(mode: RepeatMode): string {
  return repeatModeLabels[mode];
}
