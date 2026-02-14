import { type TaskItem, type ApiTaskResponse } from '@/types/tasks';
import { mapStatusFromBackend } from '@/utils/mapping/status';

export const flattenTasks = (
  items: ApiTaskResponse[],
  parentId: string | null = null
): TaskItem[] => {
  const result: TaskItem[] = [];
  items.forEach((t) => {
    const taskId = t.id;
    const task: TaskItem = {
      id: taskId,
      parentId: parentId,
      title: t.title || '',
      description: t.description || '',
      category: t.category || undefined,
      priority: t.priority || null,
      estimatedTime: t.estimated_minutes ?? 0,
      deadline: t.due_date ? new Date(t.due_date) : null,
      isCompleted: t.status === 'completed',
      status: mapStatusFromBackend(t.status),
      // Map backend tag records (with `group_name` and `name`) into a
      // simple `{ [groupName]: string[] }` structure for the UI.
      tags: (() => {
        const groups: Record<string, string[]> = {};
        if (Array.isArray(t.tags)) {
          t.tags.forEach((tag) => {
            const groupName = (tag as any).group_name as string | undefined;
            const tagName = (tag as any).name as string | undefined;
            if (!groupName || !tagName) return;
            if (!groups[groupName]) {
              groups[groupName] = [];
            }
            if (!groups[groupName].includes(tagName)) {
              groups[groupName].push(tagName);
            }
          });
        }
        return groups;
      })(),
    };
    result.push(task);
    if (t.subtasks?.length) {
      result.push(...flattenTasks(t.subtasks, taskId));
    }
  });
  return result;
};
