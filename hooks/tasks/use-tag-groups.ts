import { useState, useCallback } from 'react';
import { get, post, ApiClientError, ApiErrorType } from '@/services/api/client';

/**
 * Backend tag group response type
 */
export interface TagGroupResponse {
  id: string;
  name: string;
  type: string;
  is_system: boolean;
}

/**
 * Hook for managing tag groups from the backend
 */
export function useTagGroups() {
  const [tagGroups, setTagGroups] = useState<TagGroupResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTagGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<TagGroupResponse[]>('/api/tasks/tag-groups');
      setTagGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.type === ApiErrorType.CONFIG) {
          setError('Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL to your FastAPI server.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to load tag groups.');
      }
      setTagGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTagGroup = useCallback(async (name: string): Promise<TagGroupResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const newGroup = await post<TagGroupResponse>('/api/tasks/tag-groups', { name });
      setTagGroups((prev) => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      let errorMessage = 'Failed to create tag group.';
      if (err instanceof ApiClientError) {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      console.error('[Create Tag Group] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    tagGroups,
    fetchTagGroups,
    createTagGroup,
    loading,
    error,
  };
}
