import { useState, useCallback } from 'react';
import { get, ApiClientError, ApiErrorType } from '@/services/api/client';
import { type ApiTaskResponse } from '@/types/tasks';
import { flattenTasks } from '@/utils/tasks/flatten-tasks';
import { type TaskItem } from '@/types/tasks';

/**
 * Hook for fetching subtasks for a specific task
 */
export function useSubtasks() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSubtasks = useCallback(async (taskId: string): Promise<TaskItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<ApiTaskResponse[]>(`/api/tasks/${taskId}/subtasks`);
      const flattened = Array.isArray(data) ? flattenTasks(data, taskId) : [];
      return flattened;
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.type === ApiErrorType.CONFIG) {
          setError('Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL to your FastAPI server.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to load subtasks.');
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchSubtasks,
    loading,
    error,
  };
}
