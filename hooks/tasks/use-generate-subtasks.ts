import { useState } from 'react';
import { post, ApiClientError } from '@/services/api/client';
import { type ApiTaskResponse } from '@/types/tasks';
import { flattenTasks } from '@/utils/tasks/flatten-tasks';
import { type TaskItem } from '@/types/tasks';

/**
 * Hook for generating subtasks using AI
 */
export function useGenerateSubtasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSubtasks = async (
    taskId: string,
    maxSubtasks: number = 8
  ): Promise<TaskItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const response = await post<{ subtasks: ApiTaskResponse[] }>(
        `/api/tasks/${taskId}/generate-subtasks`,
        { max_subtasks: maxSubtasks }
      );
      const subtasks = response.subtasks || [];
      const flattened = flattenTasks(subtasks, taskId);
      return flattened;
    } catch (err) {
      let errorMessage = 'Failed to generate subtasks.';
      if (err instanceof ApiClientError) {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      console.error('[Generate Subtasks] Error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    generateSubtasks,
    loading,
    error,
  };
}
