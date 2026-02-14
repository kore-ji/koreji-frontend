import { type LocalSubTask } from '@/types/add-task';

/**
 * Calculates total time from subtasks if any exist, otherwise returns main task time
 */
export function calculateTotalTime(
  subtasks: LocalSubTask[],
  mainTime: string
): string {
  if (subtasks.length === 0) return mainTime;
  const sum = subtasks.reduce(
    (acc, curr) => acc + (parseInt(curr.estimatedTime) || 0),
    0
  );
  return sum.toString();
}

/**
 * Determines if the main task time field should be read-only
 */
export function isTimeReadOnly(subtasks: LocalSubTask[]): boolean {
  return subtasks.length > 0;
}
