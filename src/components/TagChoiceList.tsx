import { useState } from "react";

import {
  getAncestorTagIds,
  getTagDepth,
  getVisibleTags,
  hasChildTags,
  type Tag,
} from "../domain/tag";

type TagChoiceListProps = {
  tags: readonly Tag[];
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
  name: string;
  legend?: string;
};

export function TagChoiceList({
  tags,
  selectedTagId,
  onSelect,
  name,
  legend = "选择一个标签",
}: TagChoiceListProps) {
  const [expandedTagIds, setExpandedTagIds] = useState<Set<string>>(
    () => new Set(selectedTagId ? getAncestorTagIds(selectedTagId, tags) : []),
  );
  const visibleTags = getVisibleTags(tags, expandedTagIds);

  function handleSelect(tagId: string) {
    onSelect(tagId);
    // 选中某一级后展开它的下一级，同时收起其他分支。
    setExpandedTagIds(new Set([...getAncestorTagIds(tagId, tags), tagId]));
  }

  function toggleExpanded(tagId: string) {
    setExpandedTagIds((current) => {
      const next = new Set(current);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }

  return (
    <fieldset className="tag-choice-group">
      <legend>{legend}</legend>
      <div className="tag-choice-list">
        <div className="tag-choice-row">
          <label className="tag-choice-option">
            <span>不使用标签</span>
            <input
              type="radio"
              name={name}
              checked={selectedTagId === null}
              onChange={() => onSelect(null)}
            />
          </label>
        </div>

        {visibleTags.map((tag) => {
          const isExpanded = expandedTagIds.has(tag.id);
          const canExpand = hasChildTags(tag.id, tags);

          return (
            <div
              className="tag-choice-row"
              key={tag.id}
              style={{ paddingLeft: `${getTagDepth(tag.id, tags) * 16}px` }}
            >
              <label className="tag-choice-option">
                <span className="tag-choice-label">
                  <span className={`tag-color-dot tag-color-${tag.color}`} aria-hidden="true" />
                  <span>{tag.name}</span>
                </span>
                <input
                  type="radio"
                  name={name}
                  checked={selectedTagId === tag.id}
                  onChange={() => handleSelect(tag.id)}
                />
              </label>

              {canExpand ? (
                <button
                  className="tag-expand-button"
                  type="button"
                  aria-label={`${isExpanded ? "收起" : "展开"} ${tag.name} 的子标签`}
                  aria-expanded={isExpanded}
                  onClick={() => toggleExpanded(tag.id)}
                >
                  {isExpanded ? "▾" : "▸"}
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
