import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { defaultUserSettings, type Tag, type UserSettings } from "../domain/tag";
import type { Task } from "../domain/task";
import { makeTask } from "../test/fixtures";
import type { TagRepository } from "../storage/TagRepository";
import { TagRepositoryProvider } from "../storage/TagRepositoryContext";
import { LocalTagRepository } from "../storage/localTagRepository";
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

function createTagRepository(
  tags: Tag[] = [],
  settings: UserSettings = defaultUserSettings,
): TagRepository {
  return {
    load: vi.fn(async () => ({ tags, settings })),
    saveTags: vi.fn(async () => undefined),
    saveSettings: vi.fn(async () => undefined),
  };
}

function renderApp(
  repository: TaskRepository = new LocalTaskRepository(),
  tagRepository: TagRepository = new LocalTagRepository(),
) {
  return render(
    <TaskRepositoryProvider repository={repository}>
      <TagRepositoryProvider repository={tagRepository}>
        <App />
      </TagRepositoryProvider>
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
    await user.click(await screen.findByRole("tab", { name: /开始一个小动作/ }));

    const nextStepInput = await screen.findByLabelText("下一步动作");
    const suggestion = screen.getByTestId("suggestion-text").textContent;

    expect(nextStepInput).toHaveValue("把地上的衣服放进洗衣篮");
    await user.click(screen.getByRole("button", { name: "接受建议" }));

    expect(nextStepInput).toHaveValue(suggestion);
  });

  it("keeps tag controls hidden until tags are enabled in settings", async () => {
    const user = userEvent.setup();
    renderApp(
      createRepository([makeTask({ inToday: true })]),
      createTagRepository([], { ...defaultUserSettings, tagsEnabled: false }),
    );

    await screen.findByLabelText("先把脑子里的事放下来");
    expect(screen.queryByText("任务标签")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /设置/ }));
    expect(screen.getByRole("switch", { name: /启用多层标签/ })).not.toBeChecked();
    expect(screen.queryByText("标签管理")).not.toBeInTheDocument();
  });

  it("enables tags, creates a hierarchy and assigns a tag to a task", async () => {
    const user = userEvent.setup();
    const task = makeTask({ id: "task-tagged", title: "学习 AI", inToday: true });
    const tagRepository = createTagRepository([], { ...defaultUserSettings, tagsEnabled: false });
    renderApp(createRepository([task]), tagRepository);

    await screen.findByLabelText("先把脑子里的事放下来");
    await user.click(screen.getByRole("tab", { name: /设置/ }));
    await user.click(screen.getByRole("switch", { name: /启用多层标签/ }));

    await user.type(screen.getByLabelText("标签名称"), "学习");
    await user.click(screen.getByRole("button", { name: "添加标签" }));

    await user.type(screen.getByLabelText("标签名称"), "AI");
    const parentSelect = screen.getByLabelText("父级标签");
    await user.selectOptions(parentSelect, within(parentSelect).getByRole("option", { name: "学习" }));
    await user.click(screen.getByRole("button", { name: "添加标签" }));

    await user.click(screen.getByRole("tab", { name: /开始一个小动作/ }));
    const taskTagSelect = screen.getByLabelText("选择任务标签");
    await user.selectOptions(
      taskTagSelect,
      within(taskTagSelect).getByRole("option", { name: "学习 / AI" }),
    );
    await user.click(screen.getByRole("button", { name: "添加" }));

    expect(screen.getByText("学习 / AI")).toBeInTheDocument();
    await waitFor(() =>
      expect(tagRepository.saveSettings).toHaveBeenLastCalledWith({
        ...defaultUserSettings,
        tagsEnabled: true,
      }),
    );
  });

  it("can hide and show the next-step section from settings", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ id: "next-step-task", inToday: true })]));

    await user.click(await screen.findByRole("tab", { name: /开始一个小动作/ }));
    expect(screen.getByText("下一步建议")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /设置/ }));
    await user.click(screen.getByRole("switch", { name: /显示下一步建议/ }));
    await user.click(screen.getByRole("tab", { name: /开始一个小动作/ }));

    expect(screen.queryByText("下一步建议")).not.toBeInTheDocument();
  });

  it("supports up to three custom countdown presets", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ id: "timer-task", inToday: true })]));

    await user.click(await screen.findByRole("tab", { name: /设置/ }));
    await user.click(screen.getByRole("button", { name: "删除 15 分钟选项" }));
    await user.type(screen.getByLabelText("自定义倒计时分钟数"), "25");
    await user.click(screen.getByRole("button", { name: "添加时长" }));
    await user.click(screen.getByRole("tab", { name: /开始一个小动作/ }));

    expect(screen.getByRole("button", { name: "5 分钟" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10 分钟" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "25 分钟" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "15 分钟" })).not.toBeInTheDocument();
  });

  it("records a task status immediately", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ inToday: true })]));
    await user.click(await screen.findByRole("tab", { name: /开始一个小动作/ }));

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
    fireEvent.click(screen.getByRole("tab", { name: /开始一个小动作/ }));
    vi.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "正计时" }));
    fireEvent.click(screen.getAllByRole("button", { name: "开始" })[0]!);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("00:01", { selector: "strong" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /快速 Inbox/ }));
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
