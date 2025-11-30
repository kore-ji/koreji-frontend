import { TaskMode as TaskModeEnum, TaskPlace as TaskPlaceEnum, TaskTool as TaskToolEnum } from '@/constants/task-filters';

// Re-export for convenience
export type TaskMode = TaskModeEnum;
export type TaskPlace = TaskPlaceEnum;
export type TaskTool = TaskToolEnum;

// Placeholder task icons
export const TASK_ICONS = [
  'pencil',
  'trash',
  'mail',
  'document',
] as const;

export type TaskIcon = typeof TASK_ICONS[number];

export interface TaskItem {
  id: string;
  icon: TaskIcon;
  title: string;
  place?: TaskPlace;
  mode?: TaskMode;
  tools?: TaskTool[];
  workingTime?: number; // in minutes
}

export interface TasksBottomSheetProps {
  tasks?: TaskItem[];
}

