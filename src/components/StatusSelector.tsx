import { statuses, type Task, type TaskStatus } from "../domain/task";

type StatusSelectorProps = {
  task: Task | null;
  onChange: (status: TaskStatus) => void;
};

export function StatusSelector({ task, onChange }: StatusSelectorProps) {
  return (
    <section className="status-box" aria-labelledby="statusTitle">
      <h3 id="statusTitle">任务状态</h3>
      <div className="status-options">
        {statuses.map((status) => (
          <button
            key={status}
            className={`status-option${task?.status === status ? " active" : ""}`}
            type="button"
            disabled={!task}
            onClick={() => onChange(status)}
          >
            {status}
          </button>
        ))}
      </div>
    </section>
  );
}
