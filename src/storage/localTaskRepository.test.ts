import { beforeEach, describe, expect, it } from "vitest";

import { makeTask } from "../test/fixtures";
import {
  LocalTaskRepository,
  SELECTED_TASK_STORAGE_KEY,
  TASK_STORAGE_KEY,
} from "./localTaskRepository";

const storedTask = makeTask({
  id: "stored-1",
  title: "恢复任务",
  nextStep: "打开文件",
  inToday: true,
});

describe("LocalTaskRepository", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("starts empty and saves real tasks", async () => {
    const repository = new LocalTaskRepository();

    await expect(repository.load()).resolves.toEqual({
      tasks: [],
      selectedTaskId: null,
    });

    await repository.saveTasks([storedTask]);
    await expect(repository.load()).resolves.toEqual({
      tasks: [storedTask],
      selectedTaskId: storedTask.id,
    });
    expect(window.localStorage.getItem(TASK_STORAGE_KEY)).toContain("恢复任务");
  });

  it("ignores invalid data and legacy mock tasks", async () => {
    const repository = new LocalTaskRepository();
    const mockTask = makeTask({ id: "seed-1", title: "Mock 任务" });
    window.localStorage.setItem(
      TASK_STORAGE_KEY,
      JSON.stringify([{ title: "缺少字段" }, mockTask, storedTask]),
    );

    await expect(repository.load()).resolves.toEqual({
      tasks: [storedTask],
      selectedTaskId: storedTask.id,
    });
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
