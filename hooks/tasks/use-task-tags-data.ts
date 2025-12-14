import { useState, useEffect } from 'react';
import { useTagGroups } from '@/hooks/tasks/use-tag-groups';
import { useTags, type TagResponse } from '@/hooks/tasks/use-tags';

/**
 * Hook for fetching tag groups, tags, and categories data
 */
export function useTaskTagsData() {
  const { tagGroups: dbTagGroups, fetchTagGroups, createTagGroup: createDbTagGroup } = useTagGroups();
  const { createTag: createDbTag } = useTags();
  
  // Local state to store all tags from all groups
  const [allTags, setAllTags] = useState<TagResponse[]>([]);
  
  // Categories from tasks table
  const [categoriesFromTasks, setCategoriesFromTasks] = useState<string[]>([]);

  // Fetch tag groups, tags, and categories from database on mount
  useEffect(() => {
    fetchTagGroups();
    
    // Fetch categories from tasks table
    // Note: This endpoint may not exist yet (part of another PR), so we handle errors gracefully
    const fetchCategories = async () => {
      try {
        const { get } = await import('@/services/api/client');
        const categories = await get<string[]>('/api/tasks/categories');
        console.log('[use-task-tags-data] Fetched categories from tasks:', categories);
        setCategoriesFromTasks(Array.isArray(categories) ? categories : []);
      } catch (err: any) {
        // Silently handle 422/404 errors as the endpoint may not be implemented yet
        // Categories will be handled via the Category tag group instead
        const statusCode = err?.status;
        if (statusCode === 422 || statusCode === 404) {
          console.log('[use-task-tags-data] Categories endpoint not available, using Category tag group instead');
        } else {
          console.error('[use-task-tags-data] Error fetching categories:', err);
        }
        setCategoriesFromTasks([]);
      }
    };
    fetchCategories();
  }, [fetchTagGroups]);

  // When tag groups are loaded, fetch tags for each group
  useEffect(() => {
    if (dbTagGroups.length > 0) {
      // Fetch tags for all groups and accumulate them
      const fetchAllTags = async () => {
        const fetchedTags: TagResponse[] = [];
        for (const group of dbTagGroups) {
          try {
            const { get } = await import('@/services/api/client');
            const groupTags = await get<TagResponse[]>(`/api/tasks/tag-groups/${group.id}/tags`);
            if (Array.isArray(groupTags)) {
              fetchedTags.push(...groupTags);
            }
          } catch (err) {
            console.error(`[use-task-tags-data] Error fetching tags for group ${group.id}:`, err);
          }
        }
        setAllTags(fetchedTags);
      };
      fetchAllTags();
    }
  }, [dbTagGroups]);

  return {
    dbTagGroups,
    allTags,
    categoriesFromTasks,
    fetchTagGroups,
    createDbTag,
    createDbTagGroup,
    setAllTags,
  };
}
