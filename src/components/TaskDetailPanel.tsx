import type { Tag } from "../domain/tag";
import type { Task, TaskStatus } from "../domain/task";
import { TagSelector } from "./TagSelector";
import { StatusSelector } from "./StatusSelector";
import { TimerControl } from "./TimerControl";

type TaskDetailPanelProps = {
  task: Task | null;
  tags: readonly Tag[];
  tagsEnabled: boolean;
  nextStepEnabled: boolean;
  countdownPresets: readonly number[];
  pendingSuggestion: string;
  onEditNextStep: (nextStep: string) => void;
  onRegenerateStep: () => void;
  onAcceptStep: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onTimeSpent: (taskId: string, seconds: number) => void;
  onSelectTag: (tagId: string | null) => void;
};

export function TaskDetailPanel({
  task,
  tags,
  tagsEnabled,
  nextStepEnabled,
  countdownPresets,
  pendingSuggestion,
  onEditNextStep,
  onRegenerateStep,
  onAcceptStep,
  onStatusChange,
  onTimeSpent,
  onSelectTag,
}: TaskDetailPanelProps) {
  const canAcceptSuggestion = Boolean(task && pendingSuggestion && pendingSuggestion !== task.nextStep);

  return (
    <aside className="panel action-panel" aria-labelledby="actionTitle">
      <div className="section-head">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2 id="actionTitle">开始一个小动作</h2>
        </div>
      </div>

      <article className="selected-task">
        <h3>{task ? task.title : "还没有选中任务"}</h3>
        <p>{task ? `当前状态：${task.status}` : "先在 Inbox 里收集一件事，再把它拆成下一步。"}</p>
      </article>

      {nextStepEnabled ? (
        <section className="next-step" aria-labelledby="nextStepTitle">
        <div className="mini-head">
          <h3 id="nextStepTitle">下一步建议</h3>
          <button id="regenerateStep" type="button" disabled={!task} onClick={onRegenerateStep}>
            重新生成
          </button>
        </div>

        {task ? (
          <div className="suggestion-card" aria-live="polite">
            <p data-testid="suggestion-text">{pendingSuggestion}</p>
            <button id="acceptStep" type="button" disabled={!canAcceptSuggestion} onClick={onAcceptStep}>
              接受建议
            </button>
          </div>
        ) : null}

        <textarea
          id="nextStepInput"
          rows={3}
          aria-label="下一步动作"
          value={task?.nextStep ?? ""}
          disabled={!task}
          onChange={(event) => onEditNextStep(event.target.value)}
          />
        </section>
      ) : null}

      {tagsEnabled && task ? (
        <TagSelector
          tags={tags}
          selectedTagId={task.tagIds[0] ?? null}
          onSelect={onSelectTag}
        />
      ) : null}

      <TimerControl
        key={`${task?.id ?? "empty"}-${countdownPresets.join("-")}`}
        task={task}
        countdownPresets={countdownPresets}
        onStatusChange={onStatusChange}
        onTimeSpent={onTimeSpent}
      />
      <StatusSelector task={task} onChange={onStatusChange} />
    </aside>
  );
}
