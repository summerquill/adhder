import { describe, expect, it } from "vitest";

import {
  addMonths,
  buildMonthGrid,
  formatDateLabel,
  getLocalDateKey,
  isDateKey,
  parseDateKey,
} from "./calendar";

describe("calendar domain", () => {
  it("uses local date keys and round-trips dates", () => {
    const dateKey = getLocalDateKey(new Date(2026, 8, 20));
    expect(dateKey).toBe("2026-09-20");
    expect(parseDateKey(dateKey).getDate()).toBe(20);
    expect(formatDateLabel(dateKey)).toContain("9月");
  });

  it("validates date keys", () => {
    expect(isDateKey("2026-09-20")).toBe(true);
    expect(isDateKey("2026/09/20")).toBe(false);
    expect(isDateKey(20260920)).toBe(false);
    expect(isDateKey(null)).toBe(false);
  });

  it("builds a six-week month grid and navigates months", () => {
    const month = new Date(2026, 8, 1);
    const days = buildMonthGrid(month);

    expect(days).toHaveLength(42);
    expect(days.some((day) => day.dateKey === "2026-09-20" && day.inCurrentMonth)).toBe(true);
    expect(addMonths(month, 1).getMonth()).toBe(9);
  });
});
