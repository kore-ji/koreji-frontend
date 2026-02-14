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
  /** Place/Location from tags - accepts enum or backend tag string */
  place?: TaskPlace | string;
  /** Mode from tags - accepts enum or backend tag string */
  mode?: TaskMode | string;
  /** Tools from tags - accepts enum array or backend tag strings */
  tools?: (TaskTool | string)[];
  workingTime?: number; // in minutes
}

export interface TasksBottomSheetProps {
  tasks?: TaskItem[];
}

