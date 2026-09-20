import { buildTagPath, getTagDepth, sortTagsHierarchically, type Tag } from "../domain/tag";
import type { Task } from "../domain/task";

type TagSelectionModalProps = {
  task: Task;
  tags: readonly Tag[];
  onToggleTag: (tagId: string) => void;
  onClose: () => void;
};

export function TagSelectionModal({
  task,
  tags,
  onToggleTag,
  onClose,
}: TagSelectionModalProps) {
  const sortedTags = sortTagsHierarchically(tags);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tagSelectionTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mini-head">
          <div>
            <p className="eyebrow">任务标签</p>
            <h3 id="tagSelectionTitle">{task.title}</h3>
          </div>
        </div>

        {sortedTags.length === 0 ? (
          <p className="settings-hint">还没有标签，请先到设置页创建。</p>
        ) : (
          <div className="modal-option-list">
            {sortedTags.map((tag) => (
              <label
                className="modal-option tag-option"
                key={tag.id}
                style={{ paddingLeft: `${14 + getTagDepth(tag.id, tags) * 18}px` }}
              >
                <span>{buildTagPath(tag.id, tags)}</span>
                <input
                  type="checkbox"
                  checked={task.tagIds.includes(tag.id)}
                  onChange={() => onToggleTag(tag.id)}
                />
              </label>
            ))}
          </div>
        )}

        <div className="modal-actions modal-actions-single">
          <button type="button" onClick={onClose}>
            完成
          </button>
        </div>
      </section>
    </div>
  );
}
