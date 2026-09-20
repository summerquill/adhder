import { useState } from "react";

import { buildTagPath, type Tag } from "../domain/tag";
import { TagChoiceList } from "./TagChoiceList";

type TagSelectorProps = {
  tags: readonly Tag[];
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
};

export function TagSelector({ tags, selectedTagId, onSelect }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTag = tags.find((tag) => tag.id === selectedTagId) ?? null;

  return (
    <section className="tag-selector" aria-labelledby="tagSelectorTitle">
      <div className="mini-head">
        <h3 id="tagSelectorTitle">任务标签</h3>
        {isOpen ? null : (
          <button
            className="tag-add-toggle"
            type="button"
            aria-label="选择标签"
            aria-expanded={false}
            onClick={() => setIsOpen(true)}
          >
            +
          </button>
        )}
      </div>

      {isOpen ? (
        <>
          <TagChoiceList
            tags={tags}
            selectedTagId={selectedTagId}
            onSelect={onSelect}
            name="detail-task-tag"
          />
          <button
            className="secondary tag-done-button"
            type="button"
            aria-label="完成标签选择"
            onClick={() => setIsOpen(false)}
          >
            完成
          </button>
        </>
      ) : (
        <p className="tag-selector-summary">
          {tags.length === 0
            ? "还没有标签，请在任务卡片的标签弹窗里新建。"
            : selectedTag
              ? `当前标签：${buildTagPath(selectedTag.id, tags)}`
              : "还没有选择标签。"}
        </p>
      )}
    </section>
  );
}
