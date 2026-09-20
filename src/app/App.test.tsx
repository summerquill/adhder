import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { playCelebration } from "../audio/celebration";

import { getLocalDateKey } from "../domain/calendar";
import type { ComfortEntry, ComfortItem } from "../domain/comfort";
import type { EnergyRecord } from "../domain/energy";
import { defaultUserSettings, type Tag, type UserSettings } from "../domain/tag";
import type { Task } from "../domain/task";
import { makeTask } from "../test/fixtures";
import type { ComfortRepository } from "../storage/ComfortRepository";
import { ComfortRepositoryProvider } from "../storage/ComfortRepositoryContext";
import type { EnergyRepository } from "../storage/EnergyRepository";
import { EnergyRepositoryProvider } from "../storage/EnergyRepositoryContext";
import { LocalComfortRepository } from "../storage/localComfortRepository";
import { LocalEnergyRepository } from "../storage/localEnergyRepository";
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

vi.mock("../audio/celebration", () => ({
  playCelebration: vi.fn(),
}));

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

function createEnergyRepository(records: EnergyRecord[] = []): EnergyRepository {
  return {
    load: vi.fn(async () => ({ records })),
    saveRecords: vi.fn(async () => undefined),
  };
}

function createComfortRepository(
  items: ComfortItem[] = [],
  entries: ComfortEntry[] = [],
): ComfortRepository {
  return {
    load: vi.fn(async () => ({ items, entries })),
    saveItems: vi.fn(async () => undefined),
    saveEntries: vi.fn(async () => undefined),
  };
}

type ExtraRepositories = {
  energyRepository?: EnergyRepository;
  comfortRepository?: ComfortRepository;
};

function renderApp(
  repository: TaskRepository = new LocalTaskRepository(),
  tagRepository: TagRepository = new LocalTagRepository(),
  {
    energyRepository = new LocalEnergyRepository(),
    comfortRepository = new LocalComfortRepository(),
  }: ExtraRepositories = {},
) {
  return render(
    <TaskRepositoryProvider repository={repository}>
      <TagRepositoryProvider repository={tagRepository}>
        <EnergyRepositoryProvider repository={energyRepository}>
          <ComfortRepositoryProvider repository={comfortRepository}>
            <App />
          </ComfortRepositoryProvider>
        </EnergyRepositoryProvider>
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

  it("opens the action page from View without using a bottom tab", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ id: "view-task", title: "查看任务", inToday: true })]));

    expect(screen.queryByRole("button", { name: "查看" })).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /查看任务/ }));

    expect(screen.getByRole("region", { name: "开始一个小动作" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回任务列表" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: /开始一个小动作/ })).not.toBeInTheDocument();
  });

  it("configures a repeat mode from the Inbox card", async () => {
    const user = userEvent.setup();
    const repository = createRepository([
      makeTask({ id: "repeat-task", title: "每日整理", inToday: true }),
    ]);
    renderApp(repository);

    await user.click(await screen.findByRole("button", { name: "循环" }));
    const dialog = screen.getByRole("dialog", { name: "每日整理" });
    await user.click(within(dialog).getByRole("radio", { name: "每天" }));
    await user.click(within(dialog).getByRole("button", { name: "保存" }));

    expect(screen.getByText("循环 · 每天")).toBeInTheDocument();
    await waitFor(() => {
      const savedTasks = vi.mocked(repository.saveTasks).mock.calls.at(-1)?.[0];
      expect(savedTasks?.[0]?.repeatMode).toBe("daily");
    });
  });

  it("assigns tags from the Inbox card when tags are enabled", async () => {
    const user = userEvent.setup();
    const tag: Tag = {
      id: "learning",
      name: "学习",
      parentId: null,
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
    };
    const repository = createRepository([
      makeTask({ id: "tag-modal-task", title: "标签任务", inToday: true }),
    ]);
    renderApp(
      repository,
      createTagRepository([tag], { ...defaultUserSettings, tagsEnabled: true }),
    );

    await user.click(await screen.findByRole("button", { name: "标签" }));
    const dialog = screen.getByRole("dialog", { name: "标签任务" });
    await user.click(within(dialog).getByRole("checkbox", { name: "学习" }));
    await user.click(within(dialog).getByRole("button", { name: "完成" }));

    expect(screen.getByRole("button", { name: "学习" })).toBeInTheDocument();
    await waitFor(() => {
      const savedTasks = vi.mocked(repository.saveTasks).mock.calls.at(-1)?.[0];
      expect(savedTasks?.[0]?.tagIds).toEqual(["learning"]);
    });
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
    await user.click(await screen.findByRole("button", { name: /查看任务/ }));

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

    await user.click(screen.getByRole("tab", { name: /快速 Inbox/ }));
    await user.click(screen.getByRole("button", { name: /查看任务/ }));
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

    await user.click(await screen.findByRole("button", { name: /查看任务/ }));
    expect(screen.getByText("下一步建议")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "返回任务列表" }));
    await user.click(screen.getByRole("tab", { name: /设置/ }));
    await user.click(screen.getByRole("switch", { name: /显示下一步建议/ }));
    await user.click(screen.getByRole("tab", { name: /快速 Inbox/ }));
    await user.click(screen.getByRole("button", { name: /查看任务/ }));

    expect(screen.queryByText("下一步建议")).not.toBeInTheDocument();
  });

  it("supports up to three custom countdown presets", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ id: "timer-task", inToday: true })]));

    await user.click(await screen.findByRole("tab", { name: /设置/ }));
    await user.click(screen.getByRole("button", { name: "删除 15 分钟选项" }));
    await user.type(screen.getByLabelText("自定义倒计时分钟数"), "25");
    await user.click(screen.getByRole("button", { name: "添加时长" }));
    await user.click(screen.getByRole("tab", { name: /快速 Inbox/ }));
    await user.click(screen.getByRole("button", { name: /查看任务/ }));
    await user.click(screen.getByRole("button", { name: "倒计时" }));

    expect(screen.getByRole("button", { name: "5 分钟" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10 分钟" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "25 分钟" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "15 分钟" })).not.toBeInTheDocument();
  });

  it("opens a calendar and shows the selected day's task statuses", async () => {
    const user = userEvent.setup();
    const todayKey = getLocalDateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getLocalDateKey(yesterday);
    const tasks = [
      makeTask({
        id: "today-task",
        title: "今日任务",
        inToday: true,
        plannedDate: todayKey,
        status: "完成",
      }),
      makeTask({
        id: "past-task",
        title: "昨日任务",
        inToday: false,
        plannedDate: yesterdayKey,
        repeatMode: "daily",
        status: "暂时放下",
      }),
    ];
    renderApp(createRepository(tasks));

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    await user.click(screen.getByRole("button", { name: "日历" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("今日任务")).toBeInTheDocument();
    expect(within(dialog).getByText("昨日任务")).toBeInTheDocument();
    expect(within(dialog).getByText("完成")).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: new RegExp(`${yesterdayKey}.*1 个任务`) }),
    );
    expect(within(dialog).getByText("昨日任务")).toBeInTheDocument();
    expect(within(dialog).getByText("暂时放下")).toBeInTheDocument();
  });

  it("records a task status immediately", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ inToday: true })]));
    await user.click(await screen.findByRole("button", { name: /查看任务/ }));

    await user.click(await screen.findByRole("button", { name: "完成" }));

    expect(screen.getByText("当前状态：完成")).toBeInTheDocument();
  });

  it("records today's energy state from the Today panel", async () => {
    const user = userEvent.setup();
    const energyRepository = createEnergyRepository();
    renderApp(createRepository([makeTask({ id: "energy-task", inToday: true })]), undefined, {
      energyRepository,
    });

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    await user.click(screen.getByRole("button", { name: "低电量" }));

    expect(screen.getByRole("button", { name: "低电量" })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => {
      const savedRecords = vi.mocked(energyRepository.saveRecords).mock.calls.at(-1)?.[0];
      expect(savedRecords?.at(-1)?.state).toBe("low");
    });
  });

  it("hides the energy row when the module is disabled", async () => {
    const user = userEvent.setup();
    renderApp(createRepository([makeTask({ id: "energy-task", inToday: true })]));

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    expect(screen.getByRole("button", { name: "低电量" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /设置/ }));
    await user.click(screen.getByRole("switch", { name: /显示今日状态/ }));
    await user.click(screen.getByRole("tab", { name: /今日 3 件事/ }));

    expect(screen.queryByRole("button", { name: "低电量" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "照顾自己" })).not.toBeInTheDocument();
  });

  it("adopts a comfort item into today and completes it with a note", async () => {
    const user = userEvent.setup();
    const comfortRepository = createComfortRepository();
    renderApp(
      createRepository([makeTask({ id: "today-task", title: "今日任务", inToday: true })]),
      undefined,
      { energyRepository: createEnergyRepository(), comfortRepository },
    );

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    await user.click(screen.getByRole("button", { name: "低电量" }));
    await user.click(screen.getByRole("button", { name: "照顾自己" }));

    await user.type(screen.getByLabelText("新的照顾条目"), "喝杯热水");
    await user.click(screen.getByRole("button", { name: "添加条目" }));
    expect(screen.getAllByText("喝杯热水").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "随机抽一个" }));
    await user.click(screen.getByRole("button", { name: "采纳" }));

    const noteInput = await screen.findByLabelText("喝杯热水 的备注");
    expect(screen.getByRole("button", { name: "移出今日" })).toBeInTheDocument();
    await user.type(noteInput, "喝了半杯");
    await user.click(screen.getByRole("button", { name: "完成" }));

    expect(screen.getByRole("button", { name: "已完成" })).toBeDisabled();
    await waitFor(() => {
      const savedEntries = vi.mocked(comfortRepository.saveEntries).mock.calls.at(-1)?.[0];
      expect(savedEntries?.at(-1)).toMatchObject({ note: "喝了半杯" });
      expect(savedEntries?.at(-1)?.completedAt).toBeTruthy();
    });
  });

  it("does not offer a random comfort pick while energy is not low", async () => {
    const user = userEvent.setup();
    renderApp(
      createRepository([makeTask({ id: "today-task", inToday: true })]),
      undefined,
      {
        energyRepository: createEnergyRepository(),
        comfortRepository: createComfortRepository([
          {
            id: "comfort-1",
            title: "喝杯热水",
            effort: "low",
            createdAt: "2026-09-20T00:00:00.000Z",
            updatedAt: "2026-09-20T00:00:00.000Z",
          },
        ]),
      },
    );

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    await user.click(screen.getByRole("button", { name: "照顾自己" }));

    expect(screen.getByText("把今日状态调成「低电量」后，可以随机抽一个。")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "随机抽一个" })).not.toBeInTheDocument();
  });

  it("plays the celebration sound only when a task enters the done state", async () => {
    const user = userEvent.setup();
    vi.mocked(playCelebration).mockClear();
    renderApp(createRepository([makeTask({ id: "celebrate", inToday: true })]));

    await user.click(await screen.findByRole("button", { name: /查看任务/ }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    expect(playCelebration).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "完成" }));
    expect(playCelebration).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "进行中" }));
    await user.click(screen.getByRole("button", { name: "完成" }));
    expect(playCelebration).toHaveBeenCalledTimes(2);
  });

  it("keeps the celebration sound silent when it is disabled", async () => {
    const user = userEvent.setup();
    vi.mocked(playCelebration).mockClear();
    renderApp(
      createRepository([makeTask({ id: "quiet", inToday: true })]),
      createTagRepository([], { ...defaultUserSettings, celebrationSoundEnabled: false }),
    );

    await user.click(await screen.findByRole("button", { name: /查看任务/ }));
    await user.click(screen.getByRole("button", { name: "完成" }));

    expect(playCelebration).not.toHaveBeenCalled();
  });

  it("plays the celebration sound when a comfort card is completed", async () => {
    const user = userEvent.setup();
    vi.mocked(playCelebration).mockClear();
    renderApp(
      createRepository([makeTask({ id: "today-task", inToday: true })]),
      undefined,
      {
        energyRepository: createEnergyRepository(),
        comfortRepository: createComfortRepository(),
      },
    );

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    await user.click(screen.getByRole("button", { name: "低电量" }));
    await user.click(screen.getByRole("button", { name: "照顾自己" }));
    await user.type(screen.getByLabelText("新的照顾条目"), "喝杯热水");
    await user.click(screen.getByRole("button", { name: "添加条目" }));
    await user.click(screen.getByRole("button", { name: "随机抽一个" }));
    await user.click(screen.getByRole("button", { name: "采纳" }));

    vi.mocked(playCelebration).mockClear();
    await user.click(await screen.findByRole("button", { name: "完成" }));

    expect(playCelebration).toHaveBeenCalledTimes(1);
  });

  it("generates comfort suggestions and accepts one into the list", async () => {
    const user = userEvent.setup();
    renderApp(
      createRepository([makeTask({ id: "today-task", inToday: true })]),
      undefined,
      {
        energyRepository: createEnergyRepository(),
        comfortRepository: createComfortRepository(),
      },
    );

    await user.click(await screen.findByRole("tab", { name: /今日 3 件事/ }));
    await user.click(screen.getByRole("button", { name: "照顾自己" }));
    await user.click(screen.getByRole("button", { name: "生成候选" }));

    const addButtons = await screen.findAllByRole("button", { name: "加入清单" });
    expect(addButtons).toHaveLength(3);

    await user.click(addButtons[0]!);

    expect(screen.getAllByRole("button", { name: "加入清单" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /^删除 / })).toHaveLength(1);
    expect(screen.queryByText("清单还是空的，先写下一条能让自己缓一缓的小事。")).not.toBeInTheDocument();
  });

  it("tracks time on the original task and stops when switching tasks", async () => {
    const tasks = [
      makeTask({ id: "task-a", title: "任务 A", inToday: true }),
      makeTask({ id: "task-b", title: "任务 B", inToday: false }),
    ];
    const repository = createRepository(tasks);
    renderApp(repository);

    await screen.findAllByText("任务 A");
    fireEvent.click(screen.getAllByRole("button", { name: /查看任务/ })[0]!);
    vi.useFakeTimers();

    fireEvent.click(screen.getByRole("button", { name: "正计时" }));
    fireEvent.click(screen.getAllByRole("button", { name: "开始" })[0]!);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText("00:01", { selector: "strong" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "返回任务列表" }));
    const taskBTitle = screen.getAllByText("任务 B")[0]!;
    const taskBCard = taskBTitle.closest("article");
    expect(taskBCard).not.toBeNull();
    fireEvent.click(within(taskBCard as HTMLElement).getByRole("button", { name: /查看任务/ }));

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    await act(async () => undefined);
    const savedTasks = vi.mocked(repository.saveTasks).mock.calls.at(-1)?.[0];
    expect(savedTasks?.find((task) => task.id === "task-a")?.timeSpentSeconds).toBe(1);
    expect(savedTasks?.find((task) => task.id === "task-b")?.timeSpentSeconds).toBe(0);
  });
});
