import { beforeEach, describe, expect, it } from "vitest";

import { statuses, type Task } from "../domain/task";
import {
  SELECTED_TASK_STORAGE_KEY,
  TASK_STORAGE_KEY,
  loadSelectedTaskId,
  loadTasks,
  saveSelectedTaskId,
  saveTasks,
} from "./taskStorage";

const storedTask: Task = {
  id: "stored-1",
  title: "恢复任务",
  status: statuses[0],
  nextStep: "打开文件",
  inToday: true,
  createdAt: "2026-09-19T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
};

describe("task storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and restores tasks", () => {
    saveTasks([storedTask]);

    expect(loadTasks()).toEqual([storedTask]);
    expect(window.localStorage.getItem(TASK_STORAGE_KEY)).toContain("恢复任务");
  });

  it("falls back to seed tasks when saved data is invalid", () => {
    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify([{ title: "缺少字段" }]));

    const tasks = loadTasks();

    expect(tasks.length).toBeGreaterThan(0);
    expect(tasks[0]?.id).toBe("seed-1");
  });

  it("restores a valid selected task and falls back to the first task", () => {
    saveTasks([storedTask]);
    saveSelectedTaskId(storedTask.id);

    expect(loadSelectedTaskId([storedTask])).toBe(storedTask.id);

    window.localStorage.setItem(SELECTED_TASK_STORAGE_KEY, "missing-task");
    expect(loadSelectedTaskId([storedTask])).toBe(storedTask.id);
  });
});
