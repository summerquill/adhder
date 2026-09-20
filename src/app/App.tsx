import { useEffect, useState } from "react";

import { InboxPanel } from "../components/InboxPanel";
import { SettingsPage } from "../components/SettingsPage";
import { TaskDetailPanel } from "../components/TaskDetailPanel";
import { TodayPanel } from "../components/TodayPanel";
import { makeAlternateNextStep } from "../domain/nextStep";
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

type ActivePage = "tasks" | "settings";

export default function App() {
  const taskRepository = useTaskRepository();
  const tagRepository = useTagRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [settings, setSettings] = useState<UserSettings>(defaultUserSettings);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState("");
  const [activePage, setActivePage] = useState<ActivePage>("tasks");
  const [isReady, setIsReady] = useState(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const todayTaskCount = getTodayTasks(tasks).length;

  useEffect(() => {
    let isActive = true;

    void Promise.all([taskRepository.load(), tagRepository.load()]).then(
      ([taskSnapshot, tagSnapshot]) => {
        if (!isActive) return;

        const initialSelectedTask =
          taskSnapshot.tasks.find((task) => task.id === taskSnapshot.selectedTaskId) ??
          taskSnapshot.tasks[0] ??
          null;

        setTasks(taskSnapshot.tasks);
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

  function handleCreateTask(title: string) {
    const task = createTask(title);
    setTasks((currentTasks) => [task, ...currentTasks]);
    setSelectedTaskId(task.id);
    setPendingSuggestion(makeAlternateNextStep(task.title, task.nextStep));
  }

  function handleAddTaskToToday(taskId: string) {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;

    patchTask(task.id, { inToday: true });
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

  if (!isReady) {
    return (
      <main className="app-shell" aria-busy="true">
        <div className="empty-state">正在加载任务...</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ADHDer</p>
          <h1>{activePage === "tasks" ? "今天只推进一点点" : "个性化设置"}</h1>
        </div>
        <div className="topbar-actions">
          {activePage === "tasks" ? (
            <div className="today-meter" aria-label="今日重点数量">
              <span>{todayTaskCount}</span>
              <small>件今日重点</small>
            </div>
          ) : null}
          <button
            className="secondary settings-button"
            type="button"
            onClick={() => setActivePage(activePage === "tasks" ? "settings" : "tasks")}
          >
            {activePage === "tasks" ? "设置" : "返回任务"}
          </button>
        </div>
      </header>

      {activePage === "tasks" ? (
        <section className="workspace" aria-label="ADHDer 工作区">
          <InboxPanel
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={selectTask}
            onCreateTask={handleCreateTask}
            onAddTaskToToday={handleAddTaskToToday}
          />
          <TodayPanel
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            onSelectTask={selectTask}
            onRemoveTaskFromToday={(taskId) => patchTask(taskId, { inToday: false })}
          />
          <TaskDetailPanel
            task={selectedTask}
            tags={tags}
            tagsEnabled={settings.tagsEnabled}
            pendingSuggestion={pendingSuggestion}
            onEditNextStep={handleEditNextStep}
            onRegenerateStep={handleRegenerateStep}
            onAcceptStep={handleAcceptStep}
            onStatusChange={handleStatusChange}
            onTimeSpent={handleTimeSpent}
            onAddTag={handleAddTagToTask}
            onRemoveTag={handleRemoveTagFromTask}
          />
        </section>
      ) : (
        <SettingsPage
          settings={settings}
          tags={tags}
          tasks={tasks}
          onToggleTags={(tagsEnabled) => setSettings({ tagsEnabled })}
          onCreateTag={handleCreateTag}
          onDeleteTag={handleDeleteTag}
        />
      )}
    </main>
  );
}
