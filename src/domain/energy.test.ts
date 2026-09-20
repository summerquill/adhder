import { describe, expect, it } from "vitest";

import {
  createEnergyRecord,
  getEnergyRecordsForDate,
  getEnergyStateForDate,
  getLatestEnergyRecord,
  normalizeEnergyRecord,
  normalizeEnergyRecords,
  type EnergyRecord,
} from "./energy";

const full: EnergyRecord = {
  id: "energy-1",
  dateKey: "2026-09-20",
  state: "full",
  changedAt: "2026-09-20T01:00:00.000Z",
};

const low: EnergyRecord = {
  id: "energy-2",
  dateKey: "2026-09-20",
  state: "low",
  changedAt: "2026-09-20T09:00:00.000Z",
  reason: "睡眠不足",
};

describe("energy domain", () => {
  it("normalizes valid records and trims optional text", () => {
    expect(
      normalizeEnergyRecord({
        id: "energy-3",
        dateKey: "2026-09-20",
        state: "holding",
        changedAt: "2026-09-20T03:00:00.000Z",
        reason: "  开会  ",
        note: "   ",
      }),
    ).toEqual({
      id: "energy-3",
      dateKey: "2026-09-20",
      state: "holding",
      changedAt: "2026-09-20T03:00:00.000Z",
      reason: "开会",
    });
  });

  it("rejects unknown states and malformed records", () => {
    expect(normalizeEnergyRecord(null)).toBeNull();
    expect(normalizeEnergyRecord({ ...full, state: "未知" })).toBeNull();
    expect(normalizeEnergyRecord({ ...full, dateKey: "2026/09/20" })).toBeNull();
    expect(normalizeEnergyRecord({ ...full, id: "" })).toBeNull();
    expect(normalizeEnergyRecord({ ...full, changedAt: 1 })).toBeNull();
  });

  it("creates records with generated id and optional context", () => {
    const record = createEnergyRecord("low", {
      dateKey: "2026-09-20",
      changedAt: "2026-09-20T10:00:00.000Z",
      reason: "  噪音  ",
      note: "会议中",
    });

    expect(record).toMatchObject({
      dateKey: "2026-09-20",
      state: "low",
      changedAt: "2026-09-20T10:00:00.000Z",
      reason: "噪音",
      note: "会议中",
    });
    expect(record.id).toBeTruthy();
    expect(createEnergyRecord("full").dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("drops empty optional text instead of storing blank strings", () => {
    const record = createEnergyRecord("full", { reason: "   ", note: "" });

    expect(record).not.toHaveProperty("reason");
    expect(record).not.toHaveProperty("note");
  });

  it("returns the latest record for a date, not the last written", () => {
    expect(getEnergyRecordsForDate([low, full], "2026-09-20").map((record) => record.id)).toEqual([
      "energy-1",
      "energy-2",
    ]);
    expect(getLatestEnergyRecord([low, full], "2026-09-20")).toEqual(low);
    expect(getEnergyStateForDate([low, full], "2026-09-20")).toBe("low");
  });

  it("keeps insertion order when timestamps match", () => {
    const first = { ...full, id: "a" };
    const second = { ...full, id: "b" };

    expect(getLatestEnergyRecord([first, second], "2026-09-20")?.id).toBe("b");
    expect(getLatestEnergyRecord([second, first], "2026-09-20")?.id).toBe("a");
  });

  it("ignores records from other dates and empty input", () => {
    expect(getEnergyRecordsForDate([low, full], "2026-09-21")).toEqual([]);
    expect(getLatestEnergyRecord([low, full], "2026-09-21")).toBeNull();
    expect(getEnergyStateForDate([], "2026-09-20")).toBeNull();
  });

  it("filters invalid entries from stored arrays", () => {
    expect(normalizeEnergyRecords([full, { id: "bad" }, low])).toEqual([full, low]);
    expect(normalizeEnergyRecords("not-an-array")).toEqual([]);
  });
});
