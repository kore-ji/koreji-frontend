import type { TaskItem as ApiTaskItem } from '@/types/tasks';
import type { TaskItem as SimpleTaskItem } from './types';
import { TASK_ICONS } from './types';

const TAG_GROUP_LOCATION = 'Location';
const TAG_GROUP_MODE = 'Mode';
const TAG_GROUP_TOOLS = 'Tools';

/**
 * Maps a real TaskItem from the API/types to the simple-task-list TaskItem format.
 */
export function mapTaskToSimple(apiTask: ApiTaskItem, index: number): SimpleTaskItem {
  const tags = apiTask.tags ?? {};
  const place = tags[TAG_GROUP_LOCATION]?.[0];
  const mode = tags[TAG_GROUP_MODE]?.[0];
  const tools = tags[TAG_GROUP_TOOLS] ?? [];

  return {
    id: apiTask.id,
    icon: TASK_ICONS[index % TASK_ICONS.length],
    title: apiTask.title,
    place,
    mode,
    tools: tools.length > 0 ? tools : undefined,
    workingTime: apiTask.estimatedTime,
  };
}

/**
 * Maps an array of real TaskItems to simple-task-list TaskItem format.
 */
export function mapTasksToSimple(apiTasks: ApiTaskItem[]): SimpleTaskItem[] {
  return apiTasks
    .filter((t) => t.parentId === null)
    .map((t, i) => mapTaskToSimple(t, i));
}
