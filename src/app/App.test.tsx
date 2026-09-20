import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "../domain/task";
import { makeTask } from "../test/fixtures";
import type { TaskRepository } from "../storage/TaskRepository";
import { TaskRepositoryProvider } from "../storage/TaskRepositoryContext";
import {
  LocalTaskRepository,
  TASK_STORAGE_KEY,
} from "../storage/localTaskRepository";
import App from "./App";

function createRepository(tasks: Task[] = [], selectedTaskId = tasks[0]?.id ?? null): TaskRepository {
  return {
    load: vi.fn(async () => ({ tasks, selectedTaskId })),
    saveTasks: vi.fn(async () => undefined),
    saveSelectedTaskId: vi.fn(async () => undefined),
  };
}

function renderApp(repository: TaskRepository = new LocalTaskRepository()) {
  return render(
    <TaskRepositoryProvider repository={repository}>
      <App />
    </TaskRepositoryProvider>,
  );
}

function storedTasks() {
  return JSON.parse(window.localStorage.getItem(TASK_STORAGE_KEY) ?? "[]") as Array<{
    title: string;
    status: string;
    nextStep: string;
  }>;
}

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("collects a task and keeps it after the app is rendered again", async () => {
    const user = userEvent.setup();
    const firstRender = renderApp();

    await user.type(await screen.findByLabelText("先把脑子里的事放下来"), "喝水");
    await user.click(screen.getByRole("button", { name: "收集" }));

    expect(screen.getAllByText("喝水").length).toBeGreaterThan(0);
    await waitFor(() => expect(storedTasks()[0]?.title).toBe("喝水"));

    firstRender.unmount();
    renderApp();
    expect((await screen.findAllByText("喝水")).length).toBeGreaterThan(0);
  });

  it("allows more than three tasks in today", async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: "1", title: "任务 1", inToday: true }),
      makeTask({ id: "2", title: "任务 2", inToday: true }),
      makeTask({ id: "3", title: "任务 3", inToday: true }),
      makeTask({ id: "4", title: "任务 4", inToday: false }),
    ];
    renderApp(createRepository(tasks));

    const addButton = await screen.findByRole("button", { name: "加入今日" });
    expect(addButton).toBeEnabled();
    await user.click(addButton);

    expect(screen.getByLabelText("今日重点数量")).toHaveTextContent("4件今日重点");
    expect(screen.queryByRole("button", { name: "今日已满" })).not.toBeInTheDocument();
  });

  it("uses an injected repository instead of localStorage directly", async () => {
    const user = userEvent.setup();
    const repository = createRepository();
    renderApp(repository);

    await user.type(await screen.findByLabelText("先把脑子里的事放下来"), "使用仓库");
    await user.click(screen.getByRole("button", { name: "收集" }));

    await waitFor(() => expect(repository.saveTasks).toHaveBeenCalled());
    expect(window.localStorage.getItem(TASK_STORAGE_KEY)).toBeNull();
  });

  it("accepts a generated next-step suggestion", async () => {
    const user = userEvent.setup();
    const task = makeTask({
      id: "整理",
      title: "整理房间",
      nextStep: "把地上的衣服放进洗衣篮",
      inToday: true,
    });
    renderApp(createRepository([task]));

    const nextStepInput = await screen.findByLabelText("下一步动作");
    const suggestion = screen.getByTestId("suggestion-text").textContent;

    expect(nextStepInput).toHaveValue("把地上的衣服放进洗衣篮");
    await user.click(screen.getByRole("button", { name: "接受建议" }));

    expect(nextStepInput).toHaveValue(suggestion);
  });

  it("records a task status immediately", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ inToday: true })]));

    await user.click(await screen.findByRole("button", { name: "完成" }));

    expect(screen.getByText("当前状态：完成")).toBeInTheDocument();
  });

  it("tracks time on the original task and stops when switching tasks", async () => {
    const tasks = [
      makeTask({ id: "task-a", title: "任务 A", inToday: true }),
      makeTask({ id: "task-b", title: "任务 B", inToday: false }),
    ];
    const repository = createRepository(tasks);
    renderApp(repository);

    await screen.findAllByText("任务 A");
    vi.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "正计时" }));
    fireEvent.click(screen.getAllByRole("button", { name: "开始" })[0]!);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("00:01", { selector: "strong" })).toBeInTheDocument();

    const taskBTitle = screen.getAllByText("任务 B")[0]!;
    const taskBCard = taskBTitle.closest("article");
    expect(taskBCard).not.toBeNull();
    fireEvent.click(within(taskBCard as HTMLElement).getByRole("button", { name: "查看" }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => undefined);
    const savedTasks = vi.mocked(repository.saveTasks).mock.calls.at(-1)?.[0];
    expect(savedTasks?.find((task) => task.id === "task-a")?.timeSpentSeconds).toBe(1);
    expect(savedTasks?.find((task) => task.id === "task-b")?.timeSpentSeconds).toBe(0);
  });
});
