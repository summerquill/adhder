import type { Task } from "../domain/task";

export function makeTask(overrides: Partial<Task> = {}): Task {
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
