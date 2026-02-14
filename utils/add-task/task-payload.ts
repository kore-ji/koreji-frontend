import { type LocalSubTask } from '@/types/add-task';
import { type TaskStatus } from '@/types/task-status';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { formatDate } from '@/utils/formatting/date';
import { mapStatusToBackend } from '@/utils/mapping/status';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';

export interface MainTaskPayload {
  title: string;
  description: string | null;
  category: string | null;
  due_date: string | null;
  status: string;
  estimated_minutes: number | null;
  priority: null;
}

export interface SubtaskPayload {
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
  estimated_minutes: number | null;
  priority: null;
  task_id?: string;
}

/**
 * Constructs the main task payload for API submission
 */
export function buildMainTaskPayload(
  title: string,
  description: string,
  deadline: Date | null,
  status: TaskStatus,
  calculatedTotalTime: string,
  tags: TaskTags
): MainTaskPayload {
  // Extract category from tags (Category tag group, first selected tag)
  const categoryFromTags = tags.tagGroups?.Category?.[0] || null;

  return {
    title: title.trim(),
    description: description.trim() || null,
    category: categoryFromTags || null,
    due_date: deadline ? formatDate(deadline) : null,
    status: mapStatusToBackend(status),
    estimated_minutes: parseInt(calculatedTotalTime) || null,
    priority: null, // TODO: map from tags if needed
  };
}

/**
 * Constructs a subtask payload for API submission
 */
export function buildSubtaskPayload(
  subtask: LocalSubTask,
  taskId?: string
): SubtaskPayload {
  const payload: SubtaskPayload = {
    title:
      subtask.title.trim() ||
      TASK_SCREEN_STRINGS.addTask.defaultUntitledSubtask,
    description: subtask.description.trim() || null,
    due_date: subtask.deadline ? formatDate(subtask.deadline) : null,
    status: mapStatusToBackend(subtask.status),
    estimated_minutes: parseInt(subtask.estimatedTime) || null,
    priority: null,
  };

  if (taskId) {
    payload.task_id = taskId;
  }

  return payload;
}

/**
 * Determines if a subtask ID represents an existing subtask (UUID format)
 */
export function isExistingSubtask(id: string): boolean {
  return id.length > 10 && id.includes('-');
}
