import { useState, useCallback } from 'react';
import { get, post, ApiClientError, ApiErrorType } from '@/services/api/client';

/**
 * Backend tag response type
 */
export interface TagResponse {
  id: string;
  name: string;
  tag_group_id: string;
  is_system: boolean;
}

/**
 * Hook for managing tags from the backend
 */
export function useTags() {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTagsByGroup = useCallback(async (groupId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await get<TagResponse[]>(`/api/tasks/tag-groups/${groupId}/tags`);
      setTags(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.type === ApiErrorType.CONFIG) {
          setError('Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL to your FastAPI server.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to load tags.');
      }
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTag = useCallback(
    async (name: string, tagGroupId: string): Promise<TagResponse | null> => {
      setLoading(true);
      setError(null);
      try {
        const payload = {
          name,
          tag_group_id: tagGroupId,
        };
        console.log('[use-tags] Creating tag with payload:', payload);
        const newTag = await post<TagResponse>('/api/tasks/tags', payload);
        console.log('[use-tags] Tag created successfully:', newTag);
        setTags((prev) => [...prev, newTag]);
        return newTag;
      } catch (err) {
        let errorMessage = 'Failed to create tag.';
        if (err instanceof ApiClientError) {
          errorMessage = err.message || errorMessage;
        }
        setError(errorMessage);
        console.error('[use-tags] Create Tag Error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    tags,
    fetchTagsByGroup,
    createTag,
    loading,
    error,
  };
}
