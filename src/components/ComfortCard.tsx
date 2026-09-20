type ComfortCardProps = {
  title: string;
  note: string;
  completed: boolean;
  onNoteChange: (note: string) => void;
  onComplete: () => void;
};

export function ComfortCard({
  title,
  note,
  completed,
  onNoteChange,
  onComplete,
}: ComfortCardProps) {
  return (
    <article className={`comfort-card${completed ? " completed" : ""}`}>
      <div className="comfort-head">
        <span className="comfort-badge">照顾</span>
        <span className="comfort-title">{title}</span>
      </div>
      <div className="comfort-actions">
        <input
          type="text"
          aria-label={`${title} 的备注`}
          placeholder="记一句感受，或做了什么"
          value={note}
          disabled={completed}
          onChange={(event) => onNoteChange(event.target.value)}
        />
        <button type="button" disabled={completed} onClick={onComplete}>
          {completed ? "已完成" : "完成"}
        </button>
      </div>
    </article>
  );
}
