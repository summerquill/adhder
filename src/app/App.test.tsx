import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { TaskRepository } from "../storage/TaskRepository";
import { TaskRepositoryProvider } from "../storage/TaskRepositoryContext";
import {
  LocalTaskRepository,
  TASK_STORAGE_KEY,
} from "../storage/localTaskRepository";
import App from "./App";

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

  it("uses an injected repository instead of localStorage directly", async () => {
    const user = userEvent.setup();
    const repository: TaskRepository = {
      load: vi.fn(async () => ({ tasks: [], selectedTaskId: null })),
      saveTasks: vi.fn(async () => undefined),
      saveSelectedTaskId: vi.fn(async () => undefined),
    };
    renderApp(repository);

    await user.type(await screen.findByLabelText("先把脑子里的事放下来"), "使用仓库");
    await user.click(screen.getByRole("button", { name: "收集" }));

    await waitFor(() => expect(repository.saveTasks).toHaveBeenCalled());
    expect(window.localStorage.getItem(TASK_STORAGE_KEY)).toBeNull();
  });

  it("accepts a generated next-step suggestion", async () => {
    const user = userEvent.setup();
    renderApp();

    const nextStepInput = await screen.findByLabelText("下一步动作");
    const suggestion = screen.getByTestId("suggestion-text").textContent;

    expect(nextStepInput).toHaveValue("把地上的衣服放进洗衣篮");
    await user.click(screen.getByRole("button", { name: "接受建议" }));

    expect(nextStepInput).toHaveValue(suggestion);
    await waitFor(() => expect(storedTasks()[0]?.nextStep).toBe(suggestion));
  });

  it("records a task status immediately", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await screen.findByRole("button", { name: "完成" }));

    expect(screen.getByText("当前状态：完成")).toBeInTheDocument();
    await waitFor(() => expect(storedTasks()[0]?.status).toBe("完成"));
  });
});
