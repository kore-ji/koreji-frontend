import { useState, useCallback } from 'react';
import { get, ApiClientError, ApiErrorType } from '@/services/api/client';
import { type ApiTaskResponse } from '@/types/tasks';

/**
 * Hook for fetching a single task by ID
 */
export function useTask() {
  const [task, setTask] = useState<ApiTaskResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTask = useCallback(async (taskId: string) => {
    if (!taskId) {
      setTask(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await get<ApiTaskResponse>(`/api/tasks/${taskId}`);
      setTask(data);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.type === ApiErrorType.CONFIG) {
          setError(
            'Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL to your FastAPI server.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to load task.');
      }
      setTask(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    task,
    loading,
    error,
    fetchTask,
    setTask,
  };
}
