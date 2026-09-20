export type TimerMode = "countdown" | "count-up";

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const rest = (safeSeconds % 60).toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes}:${rest}`;
  }

  return `${minutes}:${rest}`;
}
