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
}

export interface TasksBottomSheetProps {
  tasks?: TaskItem[];
}

