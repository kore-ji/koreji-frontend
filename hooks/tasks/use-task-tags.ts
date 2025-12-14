import { useState, useEffect } from 'react';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { type TaskItem } from '@/types/tasks';
import { TAG_GROUP_COLORS } from '@/constants/task-tags';
import { buildTaskTagsFromTask, buildTaskFieldsFromSelection } from '@/utils/tasks/task-tags';
import { useTagGroups } from '@/hooks/tasks/use-tag-groups';
import { useTags, type TagResponse } from '@/hooks/tasks/use-tags';

/**
 * Hook for managing tag modal state and tag editing logic for tasks screen
 */
export function useTaskTags(tasks: TaskItem[], updateTaskField: (id: string, field: keyof TaskItem, value: any) => Promise<void>, setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>) {
  const { tagGroups: dbTagGroups, fetchTagGroups, createTagGroup: createDbTagGroup } = useTagGroups();
  const { createTag: createDbTag } = useTags();
  
  // Local state to store all tags from all groups
  const [allTags, setAllTags] = useState<TagResponse[]>([]);
  
  // Categories from tasks table
  const [categoriesFromTasks, setCategoriesFromTasks] = useState<string[]>([]);

  const [editingTagTarget, setEditingTagTarget] = useState<'main' | string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });
  
  // Tag groups structure: { [groupName]: string[] } (tag names)
  const [tagGroups, setTagGroups] = useState<{ [groupName: string]: string[] }>({});
  
  // Tag group order
  const [tagGroupOrder, setTagGroupOrder] = useState<string[]>([]);
  
  // Tag group colors
  const [tagGroupColors, setTagGroupColors] = useState<{ [groupName: string]: { bg: string; text: string } }>({});
  
  // Tag group configs: { [groupName]: { isSingleSelect: boolean, allowAddTags: boolean } }
  const [tagGroupConfigs, setTagGroupConfigs] = useState<{ [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } }>({});

  const [showTagGroupInput, setShowTagGroupInput] = useState(false);
  const [newTagGroupName, setNewTagGroupName] = useState('');
  const [editingTagInGroup, setEditingTagInGroup] = useState<{ groupName: string; groupId: string } | null>(null);
  const [newTagInGroupName, setNewTagInGroupName] = useState('');

  // Fetch tag groups, tags, and categories from database on mount
  useEffect(() => {
    fetchTagGroups();
    
    // Fetch categories from tasks table
    const fetchCategories = async () => {
      try {
        const { get } = await import('@/services/api/client');
        const categories = await get<string[]>('/api/tasks/categories');
        console.log('[use-task-tags] Fetched categories from tasks:', categories);
        setCategoriesFromTasks(Array.isArray(categories) ? categories : []);
      } catch (err) {
        console.error('[use-task-tags] Error fetching categories:', err);
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
            console.error(`[Fetch Tags] Error fetching tags for group ${group.id}:`, err);
          }
        }
        setAllTags(fetchedTags);
      };
      fetchAllTags();
    }
  }, [dbTagGroups]);

  // Transform database data into the format expected by components
  useEffect(() => {
    const groupsMap: { [groupName: string]: string[] } = {};
    const groupsOrder: string[] = [];
    const groupsColors: { [groupName: string]: { bg: string; text: string } } = {};
    const groupsConfigs: { [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } } = {};

    // Add Category group first (from tasks table)
    if (categoriesFromTasks.length > 0) {
      groupsMap['Category'] = categoriesFromTasks;
      groupsOrder.push('Category');
      groupsColors['Category'] = TAG_GROUP_COLORS[0]; // Use first color for Category
      groupsConfigs['Category'] = {
        isSingleSelect: true,
        allowAddTags: true,
      };
    }

    // Add groups from database (skip if Category already exists)
    if (dbTagGroups.length > 0) {
      dbTagGroups.forEach((group, index) => {
        // Skip Category group if we're using categories from tasks
        if (group.name === 'Category' && categoriesFromTasks.length > 0) {
          return;
        }
        
        // Get tags for this group (may be empty array if no tags exist yet)
        const groupTags = allTags.filter((tag) => tag.tag_group_id === group.id);
        const tagNames = groupTags.map((tag) => tag.name);

        // Always include the group, even if it has no tags
        groupsMap[group.name] = tagNames;
        groupsOrder.push(group.name);
        
        // Assign color based on index (rotate through available colors, skip first if Category used it)
        const colorIndex = (index + (categoriesFromTasks.length > 0 ? 1 : 0)) % TAG_GROUP_COLORS.length;
        groupsColors[group.name] = TAG_GROUP_COLORS[colorIndex];
        
        // Store config from database
        groupsConfigs[group.name] = {
          isSingleSelect: group.is_single_select,
          allowAddTags: group.allow_add_tags,
        };
      });
    }

    setTagGroups(groupsMap);
    setTagGroupOrder(groupsOrder);
    setTagGroupColors(groupsColors);
    setTagGroupConfigs(groupsConfigs);
  }, [dbTagGroups, allTags, categoriesFromTasks]);

  const openTagModalForTask = (taskId: string, isMainTask: boolean) => {
    // Refetch tag groups and tags to ensure we have the latest data
    fetchTagGroups();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const currentTags = buildTaskTagsFromTask(task);
    if (isMainTask) {
      setTempTags(currentTags);
      setEditingTagTarget('main');
    } else {
      const { Category, ...rest } = currentTags.tagGroups || {};
      setTempTags({ tagGroups: rest });
      setEditingTagTarget(taskId);
    }
    setEditingTaskId(taskId);
    setShowTagGroupInput(false);
    setNewTagGroupName('');
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const toggleTagInGroup = (groupName: string, tag: string) => {
    const currentTagGroups = tempTags.tagGroups || {};
    const groupTags = currentTagGroups[groupName] || [];
    const groupConfig = tagGroupConfigs[groupName] || { isSingleSelect: false, allowAddTags: true };

    let updatedGroupTags: string[];
    if (groupConfig.isSingleSelect) {
      updatedGroupTags = groupTags.includes(tag) ? [] : [tag];
    } else {
      updatedGroupTags = groupTags.includes(tag) ? groupTags.filter((t) => t !== tag) : [...groupTags, tag];
    }

    setTempTags({
      ...tempTags,
      tagGroups: {
        ...currentTagGroups,
        [groupName]: updatedGroupTags,
      },
    });
  };

  const handleAddTagToGroup = (groupName: string) => {
    const group = dbTagGroups.find((g) => g.name === groupName);
    if (group) {
      setEditingTagInGroup({ groupName, groupId: group.id });
    }
  };

  const handleSaveTagToGroup = async () => {
    if (
      editingTagInGroup &&
      newTagInGroupName.trim() &&
      !tagGroups[editingTagInGroup.groupName]?.includes(newTagInGroupName.trim())
    ) {
      const trimmedTag = newTagInGroupName.trim();
      
      // Create tag in database
      const newTag = await createDbTag(trimmedTag, editingTagInGroup.groupId);
      if (newTag) {
        // Optimistically update local state
        setTagGroups((prev) => ({
          ...prev,
          [editingTagInGroup.groupName]: [...(prev[editingTagInGroup.groupName] || []), trimmedTag],
        }));

        if (editingTagInGroup.groupName === 'Category') {
          const currentTagGroups = tempTags.tagGroups || {};
          const groupConfig = tagGroupConfigs['Category'] || { isSingleSelect: true };
          if (groupConfig.isSingleSelect) {
            setTempTags({
              ...tempTags,
              tagGroups: {
                ...currentTagGroups,
                Category: [trimmedTag],
              },
            });
          }
        }
        
        // Add new tag to local state
        setAllTags((prev) => [...prev, newTag]);
      }
    }
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleAddNewTagGroup = () => {
    setShowTagGroupInput(true);
  };

  const handleSaveNewTagGroup = async () => {
    const trimmedTagGroup = newTagGroupName.trim();
    if (trimmedTagGroup && !tagGroups[trimmedTagGroup]) {
      // Create tag group in database
      const newGroup = await createDbTagGroup(trimmedTagGroup);
      if (newGroup) {
        // The useEffect will update the state when new group is fetched
        // For now, optimistically update local state
        setTagGroups((prev) => ({
          ...prev,
          [trimmedTagGroup]: [],
        }));
        setTagGroupOrder((prev) => [...prev, trimmedTagGroup]);
        
        // Assign color
        const existingGroupNames = Object.keys(tagGroupColors);
        const usedColorIndices = existingGroupNames
          .map((name) =>
            TAG_GROUP_COLORS.findIndex(
              (c) => c.bg === tagGroupColors[name].bg && c.text === tagGroupColors[name].text
            )
          )
          .filter((idx) => idx !== -1);
        
        let colorIndex = 0;
        for (let i = 0; i < TAG_GROUP_COLORS.length; i++) {
          if (!usedColorIndices.includes(i)) {
            colorIndex = i;
            break;
          }
        }
        const selectedColor = TAG_GROUP_COLORS[colorIndex % TAG_GROUP_COLORS.length];
        setTagGroupColors((prev) => ({
          ...prev,
          [trimmedTagGroup]: selectedColor,
        }));
        
        // Store config from new group
        setTagGroupConfigs((prev) => ({
          ...prev,
          [trimmedTagGroup]: {
            isSingleSelect: newGroup.is_single_select,
            allowAddTags: newGroup.allow_add_tags,
          },
        }));
        
        // Initialize empty selected tags for this group
        const currentTagGroups = tempTags.tagGroups || {};
        setTempTags({
          ...tempTags,
          tagGroups: {
            ...currentTagGroups,
            [trimmedTagGroup]: [],
          },
        });
        
        // Refetch to get updated data (tags will be refetched in useEffect)
        fetchTagGroups();
      }
    }
    setShowTagGroupInput(false);
    setNewTagGroupName('');
  };

  const saveTagsForTask = async () => {
    if (!editingTaskId) {
      setEditingTagTarget(null);
      return;
    }

    const includeCategory = editingTagTarget === 'main';
    const selection = includeCategory
      ? tempTags
      : (() => {
          const { Category, ...rest } = tempTags.tagGroups || {};
          return { tagGroups: rest };
        })();

    const { categoryValue, nextTags } = buildTaskFieldsFromSelection(selection, includeCategory);

    const currentTask = tasks.find((t) => t.id === editingTaskId);
    if (currentTask) {
      console.log('[Tag Update] Task:', editingTaskId, 'New tags:', selection.tagGroups);

      // Update category in backend if it changed
      if (includeCategory && categoryValue !== currentTask.category) {
        await updateTaskField(editingTaskId, 'category', categoryValue || null);
      }
    }

    // Update local state
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== editingTaskId) return t;
        const nextTask: TaskItem = {
          ...t,
          tags: {
            ...t.tags,
            ...nextTags,
            tools: nextTags.tools || [],
          },
        };
        if (includeCategory) {
          nextTask.category = categoryValue || t.category;
        }
        return nextTask;
      })
    );

    setEditingTagTarget(null);
    setEditingTaskId(null);
    setShowTagGroupInput(false);
    setNewTagGroupName('');
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const closeTagModal = () => {
    setEditingTagTarget(null);
    setEditingTaskId(null);
  };

  const handleCancelTagInGroup = () => {
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleCancelTagGroup = () => {
    setShowTagGroupInput(false);
    setNewTagGroupName('');
  };

  return {
    // State
    editingTagTarget,
    editingTaskId,
    tempTags,
    tagGroups,
    tagGroupOrder,
    tagGroupColors,
    tagGroupConfigs,
    showTagGroupInput,
    newTagGroupName,
    editingTagInGroup,
    newTagInGroupName,
    // Actions
    openTagModalForTask,
    toggleTagInGroup,
    handleAddTagToGroup,
    handleSaveTagToGroup,
    handleAddNewTagGroup,
    handleSaveNewTagGroup,
    saveTagsForTask,
    closeTagModal,
    handleCancelTagInGroup,
    handleCancelTagGroup,
    setNewTagInGroupName,
    setNewTagGroupName,
  };
}
