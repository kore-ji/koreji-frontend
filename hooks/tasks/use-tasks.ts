import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { get, ApiClientError, ApiErrorType } from '@/services/api/client';
import { type TaskItem, type ApiTaskResponse } from '@/types/tasks';
import { flattenTasks } from '@/utils/tasks/flatten-tasks';

/**
 * Hook for fetching and managing tasks list
 */
export function useTasks() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch top-level tasks (is_subtask=false)
      const data = await get<ApiTaskResponse[]>('/api/tasks?is_subtask=false');
      const flattened = Array.isArray(data) ? flattenTasks(data) : [];
      setTasks(flattened);
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
        setError('Unable to load tasks.');
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch when screen comes into focus (e.g., after creating a task)
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  return {
    tasks,
    setTasks,
    loading,
    error,
    fetchTasks,
  };
}
