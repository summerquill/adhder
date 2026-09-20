import type { Tag } from "../domain/tag";
import { TagChoiceList } from "./TagChoiceList";

type TagSelectorProps = {
  tags: readonly Tag[];
  selectedTagId: string | null;
  onSelect: (tagId: string | null) => void;
};

export function TagSelector({ tags, selectedTagId, onSelect }: TagSelectorProps) {
  return (
    <section className="tag-selector" aria-labelledby="tagSelectorTitle">
      <div className="mini-head">
        <h3 id="tagSelectorTitle">任务标签</h3>
      </div>

      {tags.length === 0 ? (
        <p className="settings-hint">还没有标签，请先到设置页创建。</p>
      ) : (
        <TagChoiceList
          tags={tags}
          selectedTagId={selectedTagId}
          onSelect={onSelect}
          name="detail-task-tag"
        />
      )}
    </section>
  );
}
