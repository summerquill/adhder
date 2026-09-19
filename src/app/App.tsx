import { useEffect, useState } from "react";

import { InboxPanel } from "../components/InboxPanel";
import { TaskDetailPanel } from "../components/TaskDetailPanel";
import { TodayPanel } from "../components/TodayPanel";
import { makeAlternateNextStep } from "../domain/nextStep";
import {
  canAddToToday,
  createTask,
  getTodayTasks,
  updateTask,
  type Task,
  type TaskStatus,
} from "../domain/task";
import {
  loadSelectedTaskId,
  loadTasks,
  saveSelectedTaskId,
  saveTasks,
} from "../storage/taskStorage";

type InitialTaskState = {
  tasks: Task[];
  selectedTaskId: string | null;
};

function loadInitialState(): InitialTaskState {
  const tasks = loadTasks();
  return {
    tasks,
    selectedTaskId: loadSelectedTaskId(tasks),
  };
}

export default function App() {
  const [initialState] = useState(loadInitialState);
  const [tasks, setTasks] = useState<Task[]>(initialState.tasks);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(initialState.selectedTaskId);

  const initialSelectedTask =
    initialState.tasks.find((task) => task.id === initialState.selectedTaskId) ?? initialState.tasks[0] ?? null;

  const [pendingSuggestion, setPendingSuggestion] = useState(() =>
    initialSelectedTask ? makeAlternateNextStep(initialSelectedTask.title, initialSelectedTask.nextStep) : "",
  );

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0] ?? null;
  const todayTaskCount = getTodayTasks(tasks).length;

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  useEffect(() => {
    saveSelectedTaskId(selectedTaskId);
  }, [selectedTaskId]);

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
    const task = createTask(title, tasks);
    setTasks((currentTasks) => [task, ...currentTasks]);
    setSelectedTaskId(task.id);
    setPendingSuggestion(makeAlternateNextStep(task.title, task.nextStep));
  }

  function handleAddTaskToToday(taskId: string) {
    if (!canAddToToday(tasks)) return;

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

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">ADHDer</p>
          <h1>今天只推进一点点</h1>
        </div>
        <div className="today-meter" aria-label="今日重点数量">
          <span>{todayTaskCount}</span>
          <span>/3</span>
          <small>今日重点</small>
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
        />
      </section>
    </main>
  );
}
