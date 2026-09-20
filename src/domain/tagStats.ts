import { buildTagPath, getDescendantTagIds, getTagDepth, sortTagsHierarchically, type Tag } from "./tag";
import type { Task } from "./task";

export type TagTimeStat = {
  tag: Tag;
  path: string;
  depth: number;
  directSeconds: number;
  totalSeconds: number;
  taskCount: number;
};

export function buildTagTimeStats(tasks: readonly Task[], tags: readonly Tag[]): TagTimeStat[] {
  return sortTagsHierarchically(tags).map((tag) => {
    const branchTagIds = getDescendantTagIds(tag.id, tags);
    const branchTasks = tasks.filter((task) => task.tagIds.some((tagId) => branchTagIds.has(tagId)));
    const directTasks = tasks.filter((task) => task.tagIds.includes(tag.id));

    return {
      tag,
      path: buildTagPath(tag.id, tags),
      depth: getTagDepth(tag.id, tags),
      directSeconds: directTasks.reduce((total, task) => total + task.timeSpentSeconds, 0),
      totalSeconds: branchTasks.reduce((total, task) => total + task.timeSpentSeconds, 0),
      taskCount: branchTasks.length,
    };
  });
}
