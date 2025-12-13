import { type TaskItem } from '@/types/tasks';
import { type TaskTags } from '@/components/ui/tag-display-row';

export const buildTaskTagsFromTask = (task: TaskItem): TaskTags => {
  const groupTags: { [groupName: string]: string[] } = {};
  if (task.category) groupTags.Category = [task.category];
  if (task.tags.priority) groupTags.Priority = [task.tags.priority];
  if (task.tags.attention) groupTags.Attention = [task.tags.attention];
  if (task.tags.tools?.length) groupTags.Tools = task.tags.tools;
  if (task.tags.place) groupTags.Place = [task.tags.place];
  return { tagGroups: groupTags };
};

export const buildSubtaskTagsFromTask = (task: TaskItem): TaskTags => {
  const allTags = buildTaskTagsFromTask(task);
  const { Category, ...rest } = allTags.tagGroups || {};
  return { tagGroups: rest };
};

export const buildTaskFieldsFromSelection = (selection: TaskTags, includeCategory: boolean) => {
  const groups = selection.tagGroups || {};
  const nextTags = {
    priority: groups.Priority?.[0],
    attention: groups.Attention?.[0],
    tools: groups.Tools || [],
    place: groups.Place?.[0],
  };
  const categoryValue = includeCategory ? groups.Category?.[0] : undefined;
  return { categoryValue, nextTags };
};
