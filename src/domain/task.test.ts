import { describe, expect, it } from "vitest";

import { makeTask } from "../test/fixtures";
import { createTask, getTodayTasks, isValidTask } from "./task";

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
    expect(isValidTask(task)).toBe(true);
    expect(isValidTask({ ...task, status: "未知状态" })).toBe(false);
  });
});
