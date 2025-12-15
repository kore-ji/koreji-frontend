import { type TaskItem } from '@/types/tasks';
import { type TaskTags } from '@/components/ui/tag-display-row';

export const buildTaskTagsFromTask = (task: TaskItem): TaskTags => {
  // TaskItem.tags is already a generic { [groupName]: string[] } map
  // built from backend tag groups. We only need to merge in Category
  // and Priority from their dedicated fields when present.
  const baseGroups: { [groupName: string]: string[] } = { ...(task.tags || {}) };
  if (task.category) {
    baseGroups.Category = [task.category];
  }
  if (task.priority) {
    baseGroups.Priority = [task.priority];
  }
  return { tagGroups: baseGroups };
};

export const buildSubtaskTagsFromTask = (task: TaskItem): TaskTags => {
  const allTags = buildTaskTagsFromTask(task);
  const { Category, ...rest } = allTags.tagGroups || {};
  return { tagGroups: rest };
};

export const buildTaskFieldsFromSelection = (selection: TaskTags, includeCategory: boolean) => {
  const groups = selection.tagGroups || {};
  const { Category, Priority, ...rest } = groups;

  const categoryValue = includeCategory ? Category?.[0] : undefined;
  const priorityValue = Priority?.[0];
  // Everything except Category/Priority is stored as generic tag groups on the task
  const nextTags = rest;

  return { categoryValue, priorityValue, nextTags };
};
