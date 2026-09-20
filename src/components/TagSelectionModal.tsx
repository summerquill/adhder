import { useState, type FormEvent } from "react";

import { buildTagPath, sortTagsHierarchically, type Tag } from "../domain/tag";
import type { Task } from "../domain/task";
import { TagChoiceList } from "./TagChoiceList";

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
  const [isAddingTag, setIsAddingTag] = useState(false);
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
          <button
            className="tag-add-toggle"
            type="button"
            aria-label="添加标签"
            aria-expanded={isAddingTag}
            onClick={() => setIsAddingTag((current) => !current)}
          >
            +
          </button>
        </div>

        <TagChoiceList
          tags={tags}
          selectedTagId={selectedTagId === "" ? null : selectedTagId}
          onSelect={onSelectTag}
          name="modal-task-tag"
        />

        {isAddingTag ? (
          <div className="tag-create-block">
            <h4>新建标签</h4>
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
              <button type="submit">创建标签</button>
            </form>
          </div>
        ) : null}

        <div className="modal-actions modal-actions-single">
          <button type="button" onClick={onClose}>
            完成
          </button>
        </div>
      </section>
    </div>
  );
}
