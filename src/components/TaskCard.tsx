import { formatDuration } from "../domain/timer";
import type { Task } from "../domain/task";

type TaskCardProps = {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  moveLabel: string;
  moveDisabled?: boolean;
  onMove: () => void;
};

export function TaskCard({
  task,
  isSelected,
  onSelect,
  moveLabel,
  moveDisabled = false,
  onMove,
}: TaskCardProps) {
  return (
    <article className={`task-item${isSelected ? " selected" : ""}`}>
      <p className="task-title">{task.title}</p>
      <div className="task-meta">
        <span className="badge">{task.status}</span>
        <span>{task.nextStep}</span>
        {task.timeSpentSeconds > 0 ? (
          <span className="task-time">已执行 {formatDuration(task.timeSpentSeconds)}</span>
        ) : null}
      </div>
      <div className="task-actions">
        <button className="task-action" type="button" onClick={onSelect}>
          查看
        </button>
        <button className="task-action" type="button" disabled={moveDisabled} onClick={onMove}>
          {moveLabel}
        </button>
      </div>
    </article>
  );
}
