import { buildTagTimeStats } from "../domain/tagStats";
import { formatDuration } from "../domain/timer";
import type { Tag } from "../domain/tag";
import type { Task } from "../domain/task";

type TagTimeStatsProps = {
  tags: readonly Tag[];
  tasks: readonly Task[];
};

export function TagTimeStats({ tags, tasks }: TagTimeStatsProps) {
  const stats = buildTagTimeStats(tasks, tags).filter((stat) => stat.totalSeconds > 0);

  return (
    <section className="settings-card" aria-labelledby="tagStatsTitle">
      <div className="mini-head">
        <h3 id="tagStatsTitle">标签时间统计</h3>
      </div>

      {stats.length === 0 ? (
        <p className="settings-hint">还没有标签任务产生执行时间。</p>
      ) : (
        <div className="tag-stats-list">
          {stats.map((stat) => (
            <div
              className="tag-stat-row"
              key={stat.tag.id}
              style={{ paddingLeft: `${stat.depth * 18}px` }}
            >
              <div>
                <strong>{stat.tag.name}</strong>
                <span>{stat.taskCount} 个任务</span>
              </div>
              <div className="tag-stat-time">
                <strong>{formatDuration(stat.totalSeconds)}</strong>
                {stat.directSeconds !== stat.totalSeconds ? (
                  <span>直接 {formatDuration(stat.directSeconds)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
