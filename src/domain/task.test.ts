import { describe, expect, it } from "vitest";

import { makeTask } from "../test/fixtures";
import { addTimeSpent, createTask, getTodayTasks, isValidTask, normalizeTask } from "./task";

describe("task domain", () => {
  it("does not impose a maximum number of today tasks", () => {
    const tasks = Array.from({ length: 5 }, (_, index) =>
      makeTask({ id: `task-${index}`, inToday: true }),
    );

    expect(getTodayTasks(tasks)).toHaveLength(5);
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
      repeatMode: _repeatMode,
      tagIds: _legacyTagIds,
      timeSpentSeconds: _timeSpentSeconds,
      ...legacyTask
    } = makeTask();

    expect(normalizeTask(legacyTask)).toMatchObject({
      id: legacyTask.id,
      repeatMode: "none",
      tagIds: [],
      timeSpentSeconds: 0,
    });
  });

  it("adds execution time without dropping existing task data", () => {
    const task = makeTask({ title: "保留标题", timeSpentSeconds: 15 });

    expect(addTimeSpent(task, 10)).toMatchObject({
      title: "保留标题",
      timeSpentSeconds: 25,
    });
  });
});
