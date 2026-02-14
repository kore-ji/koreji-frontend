import { type TaskStatus } from '@/types/task-status';

// All available task statuses in order
export const TASK_STATUSES: readonly TaskStatus[] = [
  'Not started',
  'In progress',
  'Done',
  'Archive',
] as const;

// Default task status for new tasks
export const DEFAULT_TASK_STATUS: TaskStatus = 'Not started';

// Status display colors for UI (optional, for badges/styling)
export const TASK_STATUS_COLORS: Record<
  TaskStatus,
  { bg: string; text: string }
> = {
  'Not started': { bg: '#E0E0E0', text: '#666666' },
  'In progress': { bg: '#E3F2FD', text: '#1565C0' },
  Done: { bg: '#E8F5E9', text: '#2E7D32' },
  Archive: { bg: '#F5F5F5', text: '#9E9E9E' },
};
