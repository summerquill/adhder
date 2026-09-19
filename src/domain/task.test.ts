import { describe, expect, it } from "vitest";

import { canAddToToday, createTask, getTodayTasks, isValidTask, type Task } from "./task";

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "测试任务",
    status: "未开始",
    nextStep: "先看一眼",
    inToday: false,
    createdAt: "2026-09-19T00:00:00.000Z",
    updatedAt: "2026-09-19T00:00:00.000Z",
    ...overrides,
  };
}

describe("task domain", () => {
  it("limits today's plan to three tasks", () => {
    const twoToday = [task({ id: "1", inToday: true }), task({ id: "2", inToday: true })];
    const threeToday = [...twoToday, task({ id: "3", inToday: true })];

    expect(canAddToToday(twoToday)).toBe(true);
    expect(canAddToToday(threeToday)).toBe(false);
    expect(getTodayTasks(threeToday)).toHaveLength(3);
  });

  it("creates a valid task and only adds it to today when space is available", () => {
    const openPlan = createTask("整理厨房台面", [task({ inToday: true })]);
    const fullPlanTasks = [
      task({ id: "1", inToday: true }),
      task({ id: "2", inToday: true }),
      task({ id: "3", inToday: true }),
    ];
    const fullPlan = createTask("买牛奶", fullPlanTasks);

    expect(openPlan).toMatchObject({
      title: "整理厨房台面",
      status: "未开始",
      inToday: true,
    });
    expect(fullPlan.inToday).toBe(false);
    expect(isValidTask(openPlan)).toBe(true);
    expect(isValidTask({ ...openPlan, status: "未知状态" })).toBe(false);
  });
});
