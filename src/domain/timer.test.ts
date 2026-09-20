import { describe, expect, it } from "vitest";

import { formatDuration } from "./timer";

describe("formatDuration", () => {
  it("formats minutes and hours consistently", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(65)).toBe("01:05");
    expect(formatDuration(3661)).toBe("01:01:01");
    expect(formatDuration(-10)).toBe("00:00");
  });
});
