import { useState, type FormEvent } from "react";

import { buildTagPath, getTagDepth, sortTagsHierarchically, type Tag } from "../domain/tag";
import type { Task } from "../domain/task";

type TagSelectionModalProps = {
  task: Task;
  tags: readonly Tag[];
  onSelectTag: (tagId: string | null) => void;
  onCreateTag: (name: string, parentId: string | null) => Tag;
  onClose: () => void;
};

export function TagSelectionModal({
  task,
  tags,
  onSelectTag,
  onCreateTag,
  onClose,
}: TagSelectionModalProps) {
  const [newTagName, setNewTagName] = useState("");
  const [newTagParentId, setNewTagParentId] = useState("");
  const sortedTags = sortTagsHierarchically(tags);
  const selectedTagId = task.tagIds[0] ?? "";

  function handleCreateTag(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTagName.trim();
    if (!name) return;

    const tag = onCreateTag(name, newTagParentId || null);
    onSelectTag(tag.id);
    setNewTagName("");
  }

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

        <fieldset className="tag-choice-group">
          <legend>选择一个标签</legend>
          <div className="modal-option-list">
            <label className="modal-option tag-option">
              <span>不使用标签</span>
              <input
                type="radio"
                name="task-tag"
                checked={selectedTagId === ""}
                onChange={() => onSelectTag(null)}
              />
            </label>

            {sortedTags.map((tag) => (
              <label
                className="modal-option tag-option"
                key={tag.id}
                style={{ paddingLeft: `${14 + getTagDepth(tag.id, tags) * 18}px` }}
              >
                <span>{buildTagPath(tag.id, tags)}</span>
                <input
                  type="radio"
                  name="task-tag"
                  checked={selectedTagId === tag.id}
                  onChange={() => onSelectTag(tag.id)}
                />
              </label>
            ))}
          </div>
        </fieldset>

        <div className="tag-create-block">
          <h4>添加标签</h4>
          <form className="tag-create-form" onSubmit={handleCreateTag}>
            <input
              type="text"
              aria-label="新标签名称"
              placeholder="新标签名称"
              autoComplete="off"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
            />
            <select
              aria-label="新标签的上级标签"
              value={newTagParentId}
              onChange={(event) => setNewTagParentId(event.target.value)}
            >
              <option value="">顶层标签</option>
              {sortedTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {buildTagPath(tag.id, tags)}
                </option>
              ))}
            </select>
            <button type="submit">添加标签</button>
          </form>
        </div>

        <div className="modal-actions modal-actions-single">
          <button type="button" onClick={onClose}>
            完成
          </button>
        </div>
      </section>
    </div>
  );
}
