import { beforeEach, describe, expect, it } from "vitest";

import { statuses, type Task } from "../domain/task";
import {
  LocalTaskRepository,
  SELECTED_TASK_STORAGE_KEY,
  TASK_STORAGE_KEY,
} from "./localTaskRepository";

const storedTask: Task = {
  id: "stored-1",
  title: "恢复任务",
  status: statuses[0],
  nextStep: "打开文件",
  inToday: true,
  createdAt: "2026-09-19T00:00:00.000Z",
  updatedAt: "2026-09-19T00:00:00.000Z",
};

describe("LocalTaskRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves and restores tasks", async () => {
    const repository = new LocalTaskRepository();
    await repository.saveTasks([storedTask]);

    await expect(repository.load()).resolves.toEqual({
      tasks: [storedTask],
      selectedTaskId: storedTask.id,
    });
    expect(window.localStorage.getItem(TASK_STORAGE_KEY)).toContain("恢复任务");
  });

  it("falls back to seed tasks when saved data is invalid", async () => {
    const repository = new LocalTaskRepository();
    window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify([{ title: "缺少字段" }]));

    const snapshot = await repository.load();

    expect(snapshot.tasks.length).toBeGreaterThan(0);
    expect(snapshot.tasks[0]?.id).toBe("seed-1");
  });

  it("restores a valid selected task and falls back to the first task", async () => {
    const repository = new LocalTaskRepository();
    await repository.saveTasks([storedTask]);
    await repository.saveSelectedTaskId(storedTask.id);

    await expect(repository.load()).resolves.toMatchObject({
      selectedTaskId: storedTask.id,
    });

    window.localStorage.setItem(SELECTED_TASK_STORAGE_KEY, "missing-task");
    await expect(repository.load()).resolves.toMatchObject({
      selectedTaskId: storedTask.id,
    });
  });
});
