import { useEffect, useState } from "react";

import { InboxPanel } from "../components/InboxPanel";
import { RepeatModeModal } from "../components/RepeatModeModal";
import { SettingsPage } from "../components/SettingsPage";
import { TaskDetailPanel } from "../components/TaskDetailPanel";
import { TagSelectionModal } from "../components/TagSelectionModal";
import { TodayPanel } from "../components/TodayPanel";
import { getLocalDateKey } from "../domain/calendar";
import { makeAlternateNextStep } from "../domain/nextStep";
import type { RepeatMode } from "../domain/repeat";
import {
  createTag,
  defaultUserSettings,
  getDescendantTagIds,
  type Tag,
  type UserSettings,
} from "../domain/tag";
import {
  addTimeSpent,
  createTask,
  getTodayTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "../domain/task";
import { useTagRepository } from "../storage/TagRepositoryContext";
import { useTaskRepository } from "../storage/TaskRepositoryContext";

type ActiveTab = "inbox" | "today" | "settings";
type TaskModal = { type: "repeat" | "tags"; taskId: string } | null;

const tabDefinitions: Array<{ id: ActiveTab; label: string; index: string }> = [
  { id: "inbox", label: "快速 Inbox", index: "01" },
  { id: "today", label: "今日 3 件事", index: "02" },
  { id: "settings", label: "设置", index: "03" },
];

const tabTitles: Record<ActiveTab, string> = {
  inbox: "快速 Inbox",
  today: "今日 3 件事",
  settings: "个性化设置",
};

export default function App() {
  const taskRepository = useTaskRepository();
  const tagRepository = useTagRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("inbox");
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [taskModal, setTaskModal] = useState<TaskModal>(null);
  const [isReady, setIsReady] = useState(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const modalTask = taskModal ? tasks.find((task) => task.id === taskModal.taskId) ?? null : null;
  const todayTaskCount = getTodayTasks(tasks).length;

  useEffect(() => {
    let isActive = true;

    void Promise.all([taskRepository.load(), tagRepository.load()]).then(
      ([taskSnapshot, tagSnapshot]) => {
        if (!isActive) return;

        const todayKey = getLocalDateKey();
        const validTagIds = new Set(tagSnapshot.tags.map((tag) => tag.id));
        const migratedTasks = taskSnapshot.tasks.map((task) => {
          const migratedTask = {
            ...task,
            tagIds: task.tagIds.filter((tagId) => validTagIds.has(tagId)),
          };

          if (migratedTask.inToday && migratedTask.plannedDate !== todayKey) {
            return updateTask(migratedTask, { inToday: false });
          }

          return migratedTask;
        });
        const initialSelectedTask =
          migratedTasks.find((task) => task.id === taskSnapshot.selectedTaskId) ??
          migratedTasks[0] ??
          null;

        setTasks(migratedTasks);
        setSelectedTaskId(taskSnapshot.selectedTaskId);
        setPendingSuggestion(
          initialSelectedTask
            ? makeAlternateNextStep(initialSelectedTask.title, initialSelectedTask.nextStep)
            : "",
        );
        setTags(tagSnapshot.tags);
        setSettings(tagSnapshot.settings);
        setIsReady(true);
      },
    );

    return () => {
      isActive = false;
    };
  }, [tagRepository, taskRepository]);

  useEffect(() => {
    if (!isReady) return;
    void taskRepository.saveTasks(tasks);
  }, [isReady, taskRepository, tasks]);

  useEffect(() => {
    if (!isReady) return;
    void taskRepository.saveSelectedTaskId(selectedTaskId);
  }, [isReady, selectedTaskId, taskRepository]);

  useEffect(() => {
    if (!isReady) return;
    void tagRepository.saveTags(tags);
  }, [isReady, tagRepository, tags]);

  useEffect(() => {
    if (!isReady) return;
    void tagRepository.saveSettings(settings);
  }, [isReady, settings, tagRepository]);

  function patchTask(taskId: string, patch: Partial<Omit<Task, "id" | "createdAt">>) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? updateTask(task, patch) : task)),
    );
  }

  function selectTask(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    setSelectedTaskId(taskId);
    setPendingSuggestion(task ? makeAlternateNextStep(task.title, task.nextStep) : "");
  }

  function openTask(taskId: string) {
    selectTask(taskId);
    setIsTaskDetailOpen(true);
  }

  function selectTab(tab: ActiveTab) {
    setActiveTab(tab);
    setIsTaskDetailOpen(false);
    setTaskModal(null);
  }

  function handleCreateTask(title: string) {
    const task = createTask(title);
    setTasks((currentTasks) => [task, ...currentTasks]);
    setSelectedTaskId(task.id);
    setPendingSuggestion(makeAlternateNextStep(task.title, task.nextStep));
  }

  function handleAddTaskToToday(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    patchTask(task.id, { inToday: true, plannedDate: getLocalDateKey() });
    selectTask(task.id);
  }

  function handleEditNextStep(nextStep: string) {
    if (!selectedTask) return;

    patchTask(selectedTask.id, { nextStep });
    setPendingSuggestion(makeAlternateNextStep(selectedTask.title, nextStep));
  }

  function handleRegenerateStep() {
    if (!selectedTask) return;

    setPendingSuggestion(
      makeAlternateNextStep(selectedTask.title, pendingSuggestion || selectedTask.nextStep),
    );
  }

  function handleAcceptStep() {
    if (!selectedTask || !pendingSuggestion) return;

    patchTask(selectedTask.id, { nextStep: pendingSuggestion });
    setPendingSuggestion(makeAlternateNextStep(selectedTask.title, pendingSuggestion));
  }

  function handleStatusChange(status: TaskStatus) {
    if (!selectedTask) return;
    patchTask(selectedTask.id, { status });
  }

  function handleTimeSpent(taskId: string, seconds: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) => (task.id === taskId ? addTimeSpent(task, seconds) : task)),
    );
  }

  function handleCreateTag(name: string, parentId: string | null) {
    const tag = createTag(name, parentId, tags);
    setTags((currentTags) => [...currentTags, tag]);
  }

  function handleDeleteTag(tagId: string) {
    const deletedTagIds = getDescendantTagIds(tagId, tags);
    setTags((currentTags) => currentTags.filter((tag) => !deletedTagIds.has(tag.id)));
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.tagIds.some((assignedTagId) => deletedTagIds.has(assignedTagId))
          ? updateTask(task, {
              tagIds: task.tagIds.filter((assignedTagId) => !deletedTagIds.has(assignedTagId)),
            })
          : task,
      ),
    );
  }

  function handleAddTagToTask(tagId: string) {
    if (!selectedTask) return;
    patchTask(selectedTask.id, {
      tagIds: Array.from(new Set([...selectedTask.tagIds, tagId])),
    });
  }

  function handleRemoveTagFromTask(tagId: string) {
    if (!selectedTask) return;
    patchTask(selectedTask.id, {
      tagIds: selectedTask.tagIds.filter((assignedTagId) => assignedTagId !== tagId),
    });
  }

  function handleToggleTagForTask(taskId: string, tagId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    patchTask(taskId, {
      tagIds: task.tagIds.includes(tagId)
        ? task.tagIds.filter((assignedTagId) => assignedTagId !== tagId)
        : [...task.tagIds, tagId],
    });
  }

  function handleSaveRepeatMode(taskId: string, repeatMode: RepeatMode) {
    patchTask(taskId, { repeatMode });
  }

  if (!isReady) {
    return (
      <main className="app-shell" aria-busy="true">
        <div className="empty-state">正在加载任务...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className={`app-header${isTaskDetailOpen ? " detail-header" : ""}`}>
        {isTaskDetailOpen ? (
          <button
            className="secondary back-button"
            type="button"
            aria-label="返回任务列表"
            onClick={() => setIsTaskDetailOpen(false)}
          >
            ←
          </button>
        ) : null}
        <div className="header-title">
          <p className="eyebrow">ADHDer</p>
          <h1>{isTaskDetailOpen ? "开始一个小动作" : tabTitles[activeTab]}</h1>
        </div>
        <div className="today-meter" aria-label="今日重点数量">
          <span>{todayTaskCount}</span>
          <small>件今日重点</small>
        </div>
      </header>

      <section className="app-content">
        {isTaskDetailOpen ? (
          <div className="tab-panel task-detail-panel" role="region" aria-label="开始一个小动作">
            <TaskDetailPanel
              task={selectedTask}
              tags={tags}
              tagsEnabled={settings.tagsEnabled}
              nextStepEnabled={settings.nextStepEnabled}
              countdownPresets={settings.countdownPresets}
              pendingSuggestion={pendingSuggestion}
              onEditNextStep={handleEditNextStep}
              onRegenerateStep={handleRegenerateStep}
              onAcceptStep={handleAcceptStep}
              onStatusChange={handleStatusChange}
              onTimeSpent={handleTimeSpent}
              onAddTag={handleAddTagToTask}
              onRemoveTag={handleRemoveTagFromTask}
            />
          </div>
        ) : null}

        {!isTaskDetailOpen && activeTab === "inbox" ? (
          <div className="tab-panel" role="tabpanel" aria-label="快速 Inbox">
            <InboxPanel
              tasks={tasks}
              tags={tags}
              selectedTaskId={selectedTaskId}
              onSelectTask={openTask}
              onCreateTask={handleCreateTask}
              onAddTaskToToday={handleAddTaskToToday}
              tagsEnabled={settings.tagsEnabled}
              onOpenRepeatSettings={(taskId) => setTaskModal({ type: "repeat", taskId })}
              onOpenTagSettings={(taskId) => setTaskModal({ type: "tags", taskId })}
            />
          </div>
        ) : null}

        {!isTaskDetailOpen && activeTab === "today" ? (
          <div className="tab-panel" role="tabpanel" aria-label="今日 3 件事">
            <TodayPanel
              tasks={tasks}
              tags={tags}
              selectedTaskId={selectedTaskId}
              onSelectTask={openTask}
              onRemoveTaskFromToday={(taskId) =>
                patchTask(taskId, { inToday: false, plannedDate: null })
              }
            />
          </div>
        ) : null}

        {!isTaskDetailOpen && activeTab === "settings" ? (
          <div className="tab-panel settings-tab-panel" role="tabpanel" aria-label="设置">
            <SettingsPage
              settings={settings}
              tags={tags}
              tasks={tasks}
              onToggleTags={(tagsEnabled) =>
                setSettings((currentSettings) => ({ ...currentSettings, tagsEnabled }))
              }
              onToggleNextStep={(nextStepEnabled) =>
                setSettings((currentSettings) => ({ ...currentSettings, nextStepEnabled }))
              }
              onCountdownPresetsChange={(countdownPresets) =>
                setSettings((currentSettings) => ({ ...currentSettings, countdownPresets }))
              }
              onCreateTag={handleCreateTag}
              onDeleteTag={handleDeleteTag}
            />
          </div>
        ) : null}
      </section>

      {!isTaskDetailOpen ? (
        <nav className="tab-bar" aria-label="主导航" role="tablist">
        {tabDefinitions.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button${activeTab === tab.id ? " active" : ""}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => selectTab(tab.id)}
          >
            <span className="tab-index" aria-hidden="true">
              {tab.index}
            </span>
            <span>{tab.label}</span>
            {tab.id === "today" && todayTaskCount > 0 ? (
              <span className="tab-badge">{todayTaskCount}</span>
            ) : null}
          </button>
          ))}
        </nav>
      ) : null}

      {modalTask && taskModal?.type === "repeat" ? (
        <RepeatModeModal
          task={modalTask}
          onSave={(repeatMode) => handleSaveRepeatMode(modalTask.id, repeatMode)}
          onClose={() => setTaskModal(null)}
        />
      ) : null}

      {modalTask && taskModal?.type === "tags" ? (
        <TagSelectionModal
          task={modalTask}
          tags={tags}
          onToggleTag={(tagId) => handleToggleTagForTask(modalTask.id, tagId)}
          onClose={() => setTaskModal(null)}
        />
      ) : null}
    </main>
  );
}
