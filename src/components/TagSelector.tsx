import { useState } from "react";

import { buildTagPath, sortTagsHierarchically, type Tag } from "../domain/tag";

type TagSelectorProps = {
  tags: readonly Tag[];
  selectedTagIds: readonly string[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
};

export function TagSelector({
  tags,
  selectedTagIds,
  onAddTag,
  onRemoveTag,
}: TagSelectorProps) {
  const [selectedTagId, setSelectedTagId] = useState("");
  const sortedTags = sortTagsHierarchically(tags);
  const availableTags = sortedTags.filter((tag) => !selectedTagIds.includes(tag.id));

  function handleAddTag() {
    if (!selectedTagId) return;
    onAddTag(selectedTagId);
    setSelectedTagId("");
  }

  return (
    <section className="tag-selector" aria-labelledby="tagSelectorTitle">
      <div className="mini-head">
        <h3 id="tagSelectorTitle">任务标签</h3>
      </div>

      {tags.length === 0 ? (
        <p className="settings-hint">还没有标签，请先到设置页创建。</p>
      ) : (
        <>
          {selectedTagIds.length > 0 ? (
            <div className="tag-chip-list">
              {selectedTagIds.map((tagId) => (
                <span className="tag-chip" key={tagId}>
                  {buildTagPath(tagId, tags)}
                  <button
                    type="button"
                    aria-label={`移除标签 ${buildTagPath(tagId, tags)}`}
                    onClick={() => onRemoveTag(tagId)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : null}

          {availableTags.length > 0 ? (
            <div className="tag-select-row">
              <select
                aria-label="选择任务标签"
                value={selectedTagId}
                onChange={(event) => setSelectedTagId(event.target.value)}
              >
                <option value="">选择标签</option>
                {availableTags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {buildTagPath(tag.id, tags)}
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddTag}>
                添加
              </button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
