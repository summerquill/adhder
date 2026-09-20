import { describe, expect, it } from "vitest";

import { getRepeatModeLabel, normalizeRepeatMode } from "./repeat";

describe("repeat mode", () => {
  it("normalizes supported and legacy values", () => {
    expect(normalizeRepeatMode("daily")).toBe("daily");
    expect(normalizeRepeatMode("weekdays")).toBe("weekdays");
    expect(normalizeRepeatMode(undefined)).toBe("none");
    expect(normalizeRepeatMode("unsupported")).toBe("none");
  });

  it("returns readable labels", () => {
    expect(getRepeatModeLabel("none")).toBe("不循环");
    expect(getRepeatModeLabel("weekly")).toBe("每周");
  });
});
