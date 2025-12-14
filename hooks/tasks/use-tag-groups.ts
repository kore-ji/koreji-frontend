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
  is_single_select: boolean;
  allow_add_tags: boolean;
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

  const createTagGroup = useCallback(async (
    name: string,
    isSingleSelect?: boolean,
    allowAddTags?: boolean
  ): Promise<TagGroupResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const payload: { name: string; is_single_select?: boolean; allow_add_tags?: boolean } = { name };
      if (isSingleSelect !== undefined) {
        payload.is_single_select = isSingleSelect;
      }
      if (allowAddTags !== undefined) {
        payload.allow_add_tags = allowAddTags;
      }
      console.log('[use-tag-groups] Creating tag group with payload:', payload);
      const newGroup = await post<TagGroupResponse>('/api/tasks/tag-groups', payload);
      console.log('[use-tag-groups] Tag group created successfully:', newGroup);
      setTagGroups((prev) => [...prev, newGroup]);
      return newGroup;
    } catch (err) {
      let errorMessage = 'Failed to create tag group.';
      if (err instanceof ApiClientError) {
        errorMessage = err.message || errorMessage;
      }
      setError(errorMessage);
      console.error('[use-tag-groups] Create Tag Group Error:', err);
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
