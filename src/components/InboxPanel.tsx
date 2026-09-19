import { useState, type FormEvent } from "react";

import { canAddToToday, type Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

type InboxPanelProps = {
  tasks: readonly Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onCreateTask: (title: string) => void;
  onAddTaskToToday: (taskId: string) => void;
};

export function InboxPanel({
  tasks,
  selectedTaskId,
  onSelectTask,
  onCreateTask,
  onAddTaskToToday,
}: InboxPanelProps) {
  const [title, setTitle] = useState("");
  const todayFull = !canAddToToday(tasks);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    onCreateTask(trimmedTitle);
    setTitle("");
  }

  return (
    <aside className="panel inbox-panel" aria-labelledby="inboxTitle">
      <div className="section-head">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2 id="inboxTitle">快速 Inbox</h2>
        </div>
      </div>

      <form className="quick-entry" onSubmit={handleSubmit}>
        <label htmlFor="taskInput">先把脑子里的事放下来</label>
        <div className="input-row">
          <input
            id="taskInput"
            type="text"
            placeholder="例如：整理厨房台面"
            autoComplete="off"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <button type="submit">收集</button>
        </div>
      </form>

      <div className="task-list" aria-live="polite">
        {tasks.length === 0 ? (
          <div className="empty-state">Inbox 现在是空的。</div>
        ) : (
          tasks.map((task) => {
            const isInToday = task.inToday;
            const moveDisabled = isInToday || todayFull;

            return (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={task.id === selectedTaskId}
                onSelect={() => onSelectTask(task.id)}
                moveLabel={isInToday ? "已在今日" : todayFull ? "今日已满" : "加入今日"}
                moveDisabled={moveDisabled}
                onMove={() => onAddTaskToToday(task.id)}
              />
            );
          })
        )}
      </div>
    </aside>
  );
}
