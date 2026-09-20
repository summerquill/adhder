import type { Tag, UserSettings } from "../domain/tag";
import type { Task } from "../domain/task";
import { TagManager } from "./TagManager";
import { TagTimeStats } from "./TagTimeStats";

type SettingsPageProps = {
  settings: UserSettings;
  tags: readonly Tag[];
  tasks: readonly Task[];
  onToggleTags: (enabled: boolean) => void;
  onCreateTag: (name: string, parentId: string | null) => void;
  onDeleteTag: (tagId: string) => void;
};

export function SettingsPage({
  settings,
  tags,
  tasks,
  onToggleTags,
  onCreateTag,
  onDeleteTag,
}: SettingsPageProps) {
  return (
    <section className="settings-grid" aria-label="个性化设置">
      <section className="settings-card" aria-labelledby="personalizationTitle">
        <div className="mini-head">
          <h3 id="personalizationTitle">个性化设置</h3>
        </div>
        <label className="settings-toggle">
          <span>
            <strong>启用多层标签</strong>
            <small>开启后可以为任务添加标签，并查看标签时间统计。</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.tagsEnabled}
            onChange={(event) => onToggleTags(event.target.checked)}
          />
        </label>
      </section>

      {settings.tagsEnabled ? (
        <>
          <TagManager tags={tags} onCreateTag={onCreateTag} onDeleteTag={onDeleteTag} />
          <TagTimeStats tags={tags} tasks={tasks} />
        </>
      ) : (
        <section className="settings-card settings-empty">
          <p>标签功能已关闭。任务数据不会显示标签信息，现有标签也不会被删除。</p>
        </section>
      )}
    </section>
  );
}
