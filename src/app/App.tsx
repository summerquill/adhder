import { useEffect, useState } from "react";

import { InboxPanel } from "../components/InboxPanel";
import { TaskDetailPanel } from "../components/TaskDetailPanel";
import { TodayPanel } from "../components/TodayPanel";
import { makeAlternateNextStep } from "../domain/nextStep";
import {
  addTimeSpent,
  createTask,
  getTodayTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "../domain/task";
import { useTaskRepository } from "../storage/TaskRepositoryContext";

export default function App() {
  const repository = useTaskRepository();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingSuggestion, setPendingSuggestion] = useState("");
  const [isReady, setIsReady] = useState(false);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const todayTaskCount = getTodayTasks(tasks).length;

  useEffect(() => {
    let isActive = true;

    void repository.load().then((snapshot) => {
      if (!isActive) return;

      const initialSelectedTask =
        snapshot.tasks.find((task) => task.id === snapshot.selectedTaskId) ?? snapshot.tasks[0] ?? null;

      setTasks(snapshot.tasks);
      setSelectedTaskId(snapshot.selectedTaskId);
      setPendingSuggestion(
        initialSelectedTask
          ? makeAlternateNextStep(initialSelectedTask.title, initialSelectedTask.nextStep)
          : "",
      );
      setIsReady(true);
    });

    return () => {
      isActive = false;
    };
  }, [repository]);

  useEffect(() => {
    if (!isReady) return;
    void repository.saveTasks(tasks);
  }, [isReady, repository, tasks]);

  useEffect(() => {
    if (!isReady) return;
    void repository.saveSelectedTaskId(selectedTaskId);
  }, [isReady, repository, selectedTaskId]);

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
          <h1>今天只推进一点点</h1>
        </div>
        <div className="today-meter" aria-label="今日重点数量">
          <span>{todayTaskCount}</span>
          <small>件今日重点</small>
        </div>
      </header>

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
          pendingSuggestion={pendingSuggestion}
          onEditNextStep={handleEditNextStep}
          onRegenerateStep={handleRegenerateStep}
          onAcceptStep={handleAcceptStep}
          onStatusChange={handleStatusChange}
          onTimeSpent={handleTimeSpent}
        />
      </section>
    </main>
  );
}
