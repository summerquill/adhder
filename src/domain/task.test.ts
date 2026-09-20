import { describe, expect, it } from "vitest";

import { getLocalDateKey } from "./calendar";
import { makeTask } from "../test/fixtures";
import {
  addTimeSpent,
  createTask,
  getTodayTasks,
  isTaskScheduledForDate,
  isValidTask,
  normalizeTask,
} from "./task";

describe("task domain", () => {
  it("does not impose a maximum number of today tasks", () => {
    const tasks = Array.from({ length: 5 }, (_, index) =>
      makeTask({ id: `task-${index}`, inToday: true }),
    );

    expect(getTodayTasks(tasks)).toHaveLength(5);
  });

  it("orders today tasks by status, then by creation time", () => {
    const tasks = [
      makeTask({ id: "done", status: "完成", inToday: true, createdAt: "2026-09-20T01:00:00.000Z" }),
      makeTask({
        id: "pending-old",
        status: "未开始",
        inToday: true,
        createdAt: "2026-09-20T02:00:00.000Z",
      }),
      makeTask({
        id: "active",
        status: "进行中",
        inToday: true,
        createdAt: "2026-09-20T05:00:00.000Z",
      }),
      makeTask({
        id: "pending-new",
        status: "未开始",
        inToday: true,
        createdAt: "2026-09-20T03:00:00.000Z",
      }),
      makeTask({
        id: "paused",
        status: "暂时放下",
        inToday: true,
        createdAt: "2026-09-20T00:00:00.000Z",
      }),
    ];

    expect(getTodayTasks(tasks).map((task) => task.id)).toEqual([
      "active",
      "pending-old",
      "pending-new",
      "paused",
      "done",
    ]);
  });

  it("creates valid tasks that join today by default", () => {
    const task = createTask("整理厨房台面");

    expect(task).toMatchObject({
      title: "整理厨房台面",
      status: "未开始",
      inToday: true,
    });
    expect(task.timeSpentSeconds).toBe(0);
    expect(isValidTask(task)).toBe(true);
    expect(isValidTask({ ...task, status: "未知状态" })).toBe(false);
  });

  it("migrates legacy tasks without execution time", () => {
    const {
      plannedDate: _plannedDate,
      repeatMode: _repeatMode,
      tagIds: _legacyTagIds,
      timeSpentSeconds: _timeSpentSeconds,
      ...legacyTask
    } = makeTask({ inToday: true });

    expect(normalizeTask(legacyTask)).toMatchObject({
      id: legacyTask.id,
      plannedDate: getLocalDateKey(),
      repeatMode: "none",
      tagIds: [],
      timeSpentSeconds: 0,
    });
  });

  it("calculates recurring task occurrences by date", () => {
    const base = makeTask({
      plannedDate: "2026-09-21",
      repeatMode: "none",
    });

    expect(isTaskScheduledForDate(base, "2026-09-21")).toBe(true);
    expect(isTaskScheduledForDate(base, "2026-09-22")).toBe(false);
    expect(
      isTaskScheduledForDate({ ...base, repeatMode: "daily" }, "2026-09-25"),
    ).toBe(true);
    expect(
      isTaskScheduledForDate({ ...base, repeatMode: "weekdays" }, "2026-09-25"),
    ).toBe(true);
    expect(
      isTaskScheduledForDate({ ...base, repeatMode: "weekdays" }, "2026-09-26"),
    ).toBe(false);
    expect(
      isTaskScheduledForDate({ ...base, repeatMode: "weekly" }, "2026-09-28"),
    ).toBe(true);
    expect(
      isTaskScheduledForDate({ ...base, repeatMode: "weekly" }, "2026-09-29"),
    ).toBe(false);
  });

  it("adds execution time without dropping existing task data", () => {
    const task = makeTask({ title: "保留标题", timeSpentSeconds: 15 });

    expect(addTimeSpent(task, 10)).toMatchObject({
      title: "保留标题",
      timeSpentSeconds: 25,
    });
  });
});
