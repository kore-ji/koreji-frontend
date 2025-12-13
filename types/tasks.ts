import { type TaskStatus } from '@/types/task-status';
import { type BackendTaskStatus } from '@/utils/mapping/status';

export interface TaskItem {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  category?: string;
  estimatedTime: number;
  deadline?: Date | null;
  isCompleted: boolean;
  status: TaskStatus;
  tags: {
    priority?: string;
    attention?: string;
    tools: string[];
    place?: string;
  };
}

export interface ApiTaskResponse {
  id: string;
  parent_id: string | null;
  title: string;
  description?: string | null;
  category?: string | null;
  status: BackendTaskStatus;
  estimated_minutes?: number | null;
  due_date?: string | null;
  tags?: unknown[]; // tags not mapped in UI yet
  subtasks?: ApiTaskResponse[];
}

export interface TaskItemWithSubtasks extends TaskItem {
  subtasks: TaskItem[];
  displayTime: number;
}
