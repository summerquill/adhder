import { getTodayTasks, type Task } from "../domain/task";
import { TaskCard } from "./TaskCard";

type TodayPanelProps = {
  tasks: readonly Task[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
  onRemoveTaskFromToday: (taskId: string) => void;
};

export function TodayPanel({
  tasks,
  selectedTaskId,
  onSelectTask,
  onRemoveTaskFromToday,
}: TodayPanelProps) {
  const todayTasks = getTodayTasks(tasks);

  return (
    <section className="panel today-panel" aria-labelledby="todayTitle">
      <div className="section-head">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2 id="todayTitle">今日 3 件事</h2>
        </div>
        <p className="hint">建议先挑 1～3 件今天推进，也可以继续添加。</p>
      </div>

      <div className="today-list" aria-live="polite">
        {todayTasks.length === 0 ? (
          <div className="empty-state">从 Inbox 里选一件今天想推进的事。</div>
        ) : (
          todayTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={task.id === selectedTaskId}
              onSelect={() => onSelectTask(task.id)}
              moveLabel="移出今日"
              onMove={() => onRemoveTaskFromToday(task.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
