import { getRepeatModeLabel } from "../domain/repeat";
import { formatDuration } from "../domain/timer";
import type { Task } from "../domain/task";

type TaskCardProps = {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  moveLabel: string;
  moveDisabled?: boolean;
  onMove: () => void;
  onOpenRepeatSettings?: () => void;
  onOpenTagSettings?: () => void;
  tagsEnabled?: boolean;
};

export function TaskCard({
  task,
  isSelected,
  onSelect,
  moveLabel,
  moveDisabled = false,
  onMove,
  onOpenRepeatSettings,
  onOpenTagSettings,
  tagsEnabled = false,
}: TaskCardProps) {
  return (
    <article className={`task-item${isSelected ? " selected" : ""}`}>
      <p className="task-title">{task.title}</p>
      <div className="task-meta">
        <span className="badge">{task.status}</span>
        <span>{task.nextStep}</span>
        {task.repeatMode !== "none" ? (
          <span className="repeat-badge">循环 · {getRepeatModeLabel(task.repeatMode)}</span>
        ) : null}
        {task.timeSpentSeconds > 0 ? (
          <span className="task-time">已执行 {formatDuration(task.timeSpentSeconds)}</span>
        ) : null}
      </div>
      <div className={`task-actions${onOpenRepeatSettings ? " task-actions-extended" : ""}`}>
        <button className="task-action" type="button" onClick={onSelect}>
          查看
        </button>
        <button className="task-action" type="button" disabled={moveDisabled} onClick={onMove}>
          {moveLabel}
        </button>
        {onOpenRepeatSettings ? (
          <button className="task-action" type="button" onClick={onOpenRepeatSettings}>
            循环
          </button>
        ) : null}
        {tagsEnabled && onOpenTagSettings ? (
          <button className="task-action" type="button" onClick={onOpenTagSettings}>
            标签{task.tagIds.length > 0 ? ` ${task.tagIds.length}` : ""}
          </button>
        ) : null}
      </div>
    </article>
  );
}
