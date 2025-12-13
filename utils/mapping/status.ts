import { type TaskStatus } from '@/types/task-status';

/**
 * Backend task status type
 */
export type BackendTaskStatus = 'pending' | 'in_progress' | 'completed' | 'archived';

/**
 * Maps frontend task status to backend API status format
 *
 * @param status - Frontend task status
 * @returns Backend task status string
 */
export function mapStatusToBackend(status: TaskStatus): BackendTaskStatus {
  const mapping: Record<TaskStatus, BackendTaskStatus> = {
    'Not started': 'pending',
    'In progress': 'in_progress',
    'Done': 'completed',
    'Archive': 'archived',
  };
  return mapping[status];
}

/**
 * Maps backend API status to frontend task status format
 *
 * @param status - Backend task status
 * @returns Frontend task status
 */
export function mapStatusFromBackend(status: BackendTaskStatus): TaskStatus {
  switch (status) {
    case 'pending':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Done';
    case 'archived':
      return 'Archive';
    default:
      return 'Not started';
  }
}
