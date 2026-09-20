import { getRepeatModeLabel } from "../domain/repeat";
import { buildTagPath, getTagColor, type Tag } from "../domain/tag";
import { formatDuration } from "../domain/timer";
import { taskStatusClassNames, type Task } from "../domain/task";

type TaskCardProps = {
  task: Task;
  tags: readonly Tag[];
  isSelected: boolean;
  onSelect: () => void;
  moveLabel: string;
  moveDisabled?: boolean;
  onMove: () => void;
  onOpenRepeatSettings?: () => void;
  onOpenTagSettings?: () => void;
  tagsEnabled?: boolean;
};

function getTagButtonLabel(task: Task, tags: readonly Tag[]): string {
  const assignedTags = task.tagIds
    .map((tagId) => tags.find((tag) => tag.id === tagId))
    .filter((tag): tag is Tag => Boolean(tag));

  if (assignedTags.length === 0) return "标签";

  const firstTag = assignedTags[0];
  const firstName = firstTag ? buildTagPath(firstTag.id, tags) : "标签";
  return assignedTags.length === 1 ? firstName : `${firstName} +${assignedTags.length - 1}`;
}

export function TaskCard({
  task,
  tags,
  isSelected,
  onSelect,
  moveLabel,
  moveDisabled = false,
  onMove,
  onOpenRepeatSettings,
  onOpenTagSettings,
  tagsEnabled = false,
}: TaskCardProps) {
  const tagButtonLabel = getTagButtonLabel(task, tags);
  const tagColor = getTagColor(task.tagIds[0] ?? null, tags);

  return (
    <article
      className={`task-item${isSelected ? " selected" : ""}${tagColor ? ` tag-tint-${tagColor}` : ""}`}
    >
      <button
        className="task-open-area"
        type="button"
        aria-label={`查看任务 ${task.title}`}
        onClick={onSelect}
      >
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className={`badge ${taskStatusClassNames[task.status]}`}>{task.status}</span>
          <span>{task.nextStep}</span>
          {task.repeatMode !== "none" ? (
            <span className="repeat-badge">循环 · {getRepeatModeLabel(task.repeatMode)}</span>
          ) : null}
          {task.timeSpentSeconds > 0 ? (
            <span className="task-time">已执行 {formatDuration(task.timeSpentSeconds)}</span>
          ) : null}
        </span>
      </button>

      <div className="task-actions">
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
            {tagButtonLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
