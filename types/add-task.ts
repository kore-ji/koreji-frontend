import { type TaskTags } from '@/components/ui/tag-display-row';
import { type TaskStatus } from '@/types/task-status';
import { type BackendTaskStatus } from '@/utils/mapping/status';

// Frontend local state type for subtasks
export interface LocalSubTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  deadline: Date | null;
  status: TaskStatus;
  tags: TaskTags;
}

// API response type for task data
export interface ApiTaskResponse {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: BackendTaskStatus;
  estimated_minutes?: number | null;
  due_date?: string | null;
   tags?: {
    id: string;
    name: string;
    tag_group_id: string;
    is_system: boolean;
    created_at: string;
    /**
     * Human-readable tag group name from backend (`Tag.group.name`),
     * e.g. "Tools", "Mode", "Location".
     */
    group_name: string;
  }[];
  subtasks?: ApiTaskResponse[];
}

