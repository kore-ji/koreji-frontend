import { useState, useCallback, useEffect } from 'react';
import { get, ApiClientError, ApiErrorType } from '@/services/api/client';

/**
 * Tag response type from backend
 */
interface TagResponse {
  id: string;
  name: string;
  tag_group_id: string;
  is_system: boolean;
}

/**
 * Tag group response type from backend
 */
interface TagGroupResponse {
  id: string;
  name: string;
  type: string;
  is_system: boolean;
}

/**
 * Hook for fetching unique filter values (mode, place, tool) from tag groups
 * First fetches tag groups to get IDs, then fetches tags for each group
 */
export function useRecordFilters() {
  const [modes, setModes] = useState<string[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // First, fetch all tag groups to find the ones we need
      const tagGroups = await get<TagGroupResponse[]>('/api/tasks/tag-groups');

      if (!Array.isArray(tagGroups)) {
        throw new Error('Invalid tag groups response');
      }

      // Find the tag groups by name
      const modeGroup = tagGroups.find((g) => g.name === 'Mode');
      const locationGroup = tagGroups.find((g) => g.name === 'Location');
      const toolsGroup = tagGroups.find((g) => g.name === 'Tools');

      // Fetch tags for each group using their IDs
      const fetchPromises: Promise<TagResponse[]>[] = [];

      if (modeGroup) {
        fetchPromises.push(
          get<TagResponse[]>(`/api/tasks/tag-groups/${modeGroup.id}/tags`)
        );
      } else {
        fetchPromises.push(Promise.resolve([]));
      }

      if (locationGroup) {
        fetchPromises.push(
          get<TagResponse[]>(`/api/tasks/tag-groups/${locationGroup.id}/tags`)
        );
      } else {
        fetchPromises.push(Promise.resolve([]));
      }

      if (toolsGroup) {
        fetchPromises.push(
          get<TagResponse[]>(`/api/tasks/tag-groups/${toolsGroup.id}/tags`)
        );
      } else {
        fetchPromises.push(Promise.resolve([]));
      }

      const [modesData, placesData, toolsData] =
        await Promise.all(fetchPromises);

      setModes(Array.isArray(modesData) ? modesData.map((t) => t.name) : []);
      setPlaces(Array.isArray(placesData) ? placesData.map((t) => t.name) : []);
      setTools(Array.isArray(toolsData) ? toolsData.map((t) => t.name) : []);
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
        setError('Unable to load filter options.');
      }
      setModes([]);
      setPlaces([]);
      setTools([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return {
    modes,
    places,
    tools,
    loading,
    error,
    refetch: fetchFilters,
  };
}
