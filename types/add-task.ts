import { type TaskTags } from '@/components/ui/tag-display-row';

// Frontend local state type for subtasks
export interface LocalSubTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  deadline: Date | null;
  tags: TaskTags;
}
