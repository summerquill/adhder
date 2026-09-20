import type { Tag, UserSettings } from "../domain/tag";
import type { Task } from "../domain/task";
import { TagManager } from "./TagManager";
import { TagTimeStats } from "./TagTimeStats";
import { TimerPresetSettings } from "./TimerPresetSettings";

type SettingsPageProps = {
  settings: UserSettings;
  tags: readonly Tag[];
  tasks: readonly Task[];
  onToggleTags: (enabled: boolean) => void;
  onToggleNextStep: (enabled: boolean) => void;
  onToggleEnergy: (enabled: boolean) => void;
  onToggleCelebrationSound: (enabled: boolean) => void;
  onPreviewCelebration: () => void;
  onCountdownPresetsChange: (presets: number[]) => void;
  onCreateTag: (name: string, parentId: string | null) => void;
  onDeleteTag: (tagId: string) => void;
};

export function SettingsPage({
  settings,
  tags,
  tasks,
  onToggleTags,
  onToggleNextStep,
  onToggleEnergy,
  onToggleCelebrationSound,
  onPreviewCelebration,
  onCountdownPresetsChange,
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

        <label className="settings-toggle">
          <span>
            <strong>显示今日状态与照顾清单</strong>
            <small>关闭后隐藏今日状态选择和照顾入口，已有记录不会删除。</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.energyEnabled}
            onChange={(event) => onToggleEnergy(event.target.checked)}
          />
        </label>

        <label className="settings-toggle">
          <span>
            <strong>完成时播放庆祝音效</strong>
            <small>所有「完成」操作都会播放一段短音效，可以随时关闭。</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.celebrationSoundEnabled}
            onChange={(event) => onToggleCelebrationSound(event.target.checked)}
          />
        </label>

        <div className="settings-inline-action">
          <span>想先听听看？</span>
          <button className="secondary" type="button" onClick={onPreviewCelebration}>
            试听
          </button>
        </div>

        <label className="settings-toggle">
          <span>
            <strong>显示下一步建议</strong>
            <small>关闭后仍保留已有下一步内容，只在主界面隐藏建议区域。</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={settings.nextStepEnabled}
            onChange={(event) => onToggleNextStep(event.target.checked)}
          />
        </label>
      </section>

      <TimerPresetSettings
        presets={settings.countdownPresets}
        onChange={onCountdownPresetsChange}
      />

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
