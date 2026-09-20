import { useState, type FormEvent } from "react";

import { buildTagPath, getTagDepth, sortTagsHierarchically, type Tag } from "../domain/tag";

type TagManagerProps = {
  tags: readonly Tag[];
  onCreateTag: (name: string, parentId: string | null) => void;
  onDeleteTag: (tagId: string) => void;
};

export function TagManager({ tags, onCreateTag, onDeleteTag }: TagManagerProps) {
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const sortedTags = sortTagsHierarchically(tags);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    onCreateTag(trimmedName, parentId || null);
    setName("");
  }

  function handleDelete(tag: Tag) {
    const confirmed = window.confirm(`删除“${buildTagPath(tag.id, tags)}”及其所有子标签？`);
    if (confirmed) onDeleteTag(tag.id);
  }

  return (
    <section className="settings-card" aria-labelledby="tagManagerTitle">
      <div className="mini-head">
        <h3 id="tagManagerTitle">标签管理</h3>
      </div>

      <form className="tag-create-form" onSubmit={handleSubmit}>
        <input
          aria-label="标签名称"
          type="text"
          placeholder="例如：学习、AI、英语"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <select
          aria-label="父级标签"
          value={parentId}
          onChange={(event) => setParentId(event.target.value)}
        >
          <option value="">创建为一级标签</option>
          {sortedTags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {"　".repeat(getTagDepth(tag.id, tags))}
              {buildTagPath(tag.id, tags)}
            </option>
          ))}
        </select>
        <button type="submit">添加标签</button>
      </form>

      {sortedTags.length === 0 ? (
        <p className="settings-hint">还没有标签。可以先创建“学习”，再创建“AI”或“英语”。</p>
      ) : (
        <div className="tag-manager-list">
          {sortedTags.map((tag) => (
            <div
              className="tag-manager-row"
              key={tag.id}
              style={{ paddingLeft: `${getTagDepth(tag.id, tags) * 18}px` }}
            >
              <span>{tag.name}</span>
              <button type="button" className="danger-text" onClick={() => handleDelete(tag)}>
                删除
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
