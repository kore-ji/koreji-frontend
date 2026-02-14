import { useState } from 'react';
import { put, ApiClientError } from '@/services/api/client';
import { type ApiTaskResponse } from '@/types/tasks';

/**
 * Hook for updating task tags using the backend tag system (UUID-based)
 * Note: This is different from the frontend's string-based tag system
 */
export function useUpdateTaskTags() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTaskTags = async (
    taskId: string,
    tagIds: string[]
  ): Promise<ApiTaskResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const updatedTask = await put<ApiTaskResponse>(
        `/api/tasks/${taskId}/tags`,
        {
          tag_ids: tagIds,
        }
      );
      return updatedTask;
    } catch (err) {
      let errorMessage = 'Failed to update task tags.';
      if (err instanceof ApiClientError) {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      console.error('[Update Task Tags] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateTaskTags,
    loading,
    error,
  };
}
