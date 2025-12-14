import { useState, useEffect } from 'react';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { type LocalSubTask } from '@/types/add-task';
import { TAG_GROUP_COLORS } from '@/constants/task-tags';
import { useTagGroups } from '@/hooks/tasks/use-tag-groups';
import { useTags, type TagResponse } from '@/hooks/tasks/use-tags';

/**
 * Hook for managing tag modal state and tag editing logic
 */
export function useAddTaskTags(mainTags: TaskTags, subtasks: LocalSubTask[]) {
  const { tagGroups: dbTagGroups, fetchTagGroups, createTagGroup: createDbTagGroup } = useTagGroups();
  const { createTag: createDbTag } = useTags();
  
  // Local state to store all tags from all groups
  const [allTags, setAllTags] = useState<TagResponse[]>([]);

  const [editingTarget, setEditingTarget] = useState<'main' | string | null>(null);
  const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });
  
  // Tag groups structure: { [groupName]: string[] } (tag names)
  const [tagGroups, setTagGroups] = useState<{ [groupName: string]: string[] }>({});
  
  // Tag group order
  const [tagGroupOrder, setTagGroupOrder] = useState<string[]>([]);
  
  // Tag group colors
  const [tagGroupColors, setTagGroupColors] = useState<{ [groupName: string]: { bg: string; text: string } }>({});
  
  // Tag group configs: { [groupName]: { isSingleSelect: boolean, allowAddTags: boolean } }
  const [tagGroupConfigs, setTagGroupConfigs] = useState<{ [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } }>({});

  // Track new tag groups that haven't been saved to database yet
  const [pendingTagGroups, setPendingTagGroups] = useState<Set<string>>(new Set());
  
  // Track new tags that haven't been saved to database yet: { [groupName]: string[] }
  // This includes tags in both pending groups and existing groups
  const [pendingTags, setPendingTags] = useState<{ [groupName: string]: string[] }>({});

  const [showTagGroupInput, setShowTagGroupInput] = useState(false);
  const [newTagGroupName, setNewTagGroupName] = useState('');
  const [editingTagInGroup, setEditingTagInGroup] = useState<{ groupName: string; groupId: string } | null>(null);
  const [newTagInGroupName, setNewTagInGroupName] = useState('');

  // Fetch tag groups and tags from database on mount
  useEffect(() => {
    fetchTagGroups();
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

    // Add groups from database
    if (dbTagGroups.length > 0) {
      dbTagGroups.forEach((group, index) => {
        // Get tags for this group (may be empty array if no tags exist yet)
        const groupTags = allTags.filter((tag) => tag.tag_group_id === group.id);
        const tagNames = groupTags.map((tag) => tag.name);

        // Always include the group, even if it has no tags
        groupsMap[group.name] = tagNames;
        groupsOrder.push(group.name);
        
        // Assign color based on index (rotate through available colors)
        const colorIndex = index % TAG_GROUP_COLORS.length;
        groupsColors[group.name] = TAG_GROUP_COLORS[colorIndex];
        
        // Store config from database
        groupsConfigs[group.name] = {
          isSingleSelect: group.is_single_select,
          allowAddTags: group.allow_add_tags,
        };
      });
    }

    // Merge with pending tag groups (groups created but not saved to DB yet)
    pendingTagGroups.forEach((groupName) => {
      if (!groupsMap[groupName]) {
        groupsMap[groupName] = [];
        groupsOrder.push(groupName);
        
        // Assign color for pending groups
        const colorIndex = groupsOrder.length - 1;
        groupsColors[groupName] = TAG_GROUP_COLORS[colorIndex % TAG_GROUP_COLORS.length];
        
        // Use default config for pending groups
        groupsConfigs[groupName] = {
          isSingleSelect: true,
          allowAddTags: true,
        };
      }
    });

    // Merge pending tags for all groups (including existing groups from DB)
    Object.entries(pendingTags).forEach(([groupName, pendingTagNames]) => {
      if (pendingTagNames.length > 0) {
        const existingTags = groupsMap[groupName] || [];
        // Add pending tags that don't already exist
        const newTags = pendingTagNames.filter(t => !existingTags.includes(t));
        groupsMap[groupName] = [...existingTags, ...newTags];
      }
    });

    setTagGroups(groupsMap);
    setTagGroupOrder(groupsOrder);
    setTagGroupColors(groupsColors);
    setTagGroupConfigs(groupsConfigs);
  }, [dbTagGroups, allTags, pendingTagGroups, pendingTags]);

  const openTagModal = (target: 'main' | string) => {
    // Refetch tag groups and tags to ensure we have the latest data
    fetchTagGroups();
    setEditingTarget(target);
    if (target === 'main') {
      setTempTags({ ...mainTags });
    } else {
      const sub = subtasks.find((s) => s.id === target);
      if (sub) {
        // Remove Category from subtask tags
        const { Category, ...subTagsWithoutCategory } = sub.tags.tagGroups || {};
        setTempTags({ tagGroups: subTagsWithoutCategory });
      }
    }
    setShowTagGroupInput(false);
    setNewTagGroupName('');
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const saveTags = async (onMainTagsSave: (tags: TaskTags) => void, onSubtaskTagsSave: (subtaskId: string, tags: TaskTags) => void) => {
    console.log('[use-add-task-tags] saveTags called - saving pending tag groups and tags to backend');
    
    // Save pending tag groups and tags to database when Confirm is clicked in modal
    await savePendingTagGroupsAndTags();
    
    // Small delay to ensure DB state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (editingTarget === 'main') {
      onMainTagsSave(tempTags);
    } else if (typeof editingTarget === 'string') {
      // Ensure Category is removed from subtask tags
      const { Category, ...tagsWithoutCategory } = tempTags.tagGroups || {};
      onSubtaskTagsSave(editingTarget, { tagGroups: tagsWithoutCategory });
    }
    setEditingTarget(null);
    setShowTagGroupInput(false);
    setNewTagGroupName('');
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleAddNewTagGroup = () => {
    setShowTagGroupInput(true);
  };

  const handleSaveNewTagGroup = () => {
    const trimmedTagGroup = newTagGroupName.trim();
    if (trimmedTagGroup && !tagGroups[trimmedTagGroup]) {
      // Store temporarily in frontend state (don't save to database yet)
      setTagGroups((prev) => ({
        ...prev,
        [trimmedTagGroup]: [],
      }));
      setTagGroupOrder((prev) => [...prev, trimmedTagGroup]);
      
      // Mark as pending to save to database later
      setPendingTagGroups((prev) => new Set([...prev, trimmedTagGroup]));
      
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
      
      // Store default config for new group
      setTagGroupConfigs((prev) => ({
        ...prev,
        [trimmedTagGroup]: {
          isSingleSelect: true,  // Default
          allowAddTags: true,    // Default
        },
      }));
      
      // Initialize empty pending tags array for this group
      setPendingTags((prev) => ({
        ...prev,
        [trimmedTagGroup]: [],
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
    }
    setShowTagGroupInput(false);
    setNewTagGroupName('');
  };

  const toggleTagInGroup = (groupName: string, tag: string) => {
    const currentTagGroups = tempTags.tagGroups || {};
    const groupTags = currentTagGroups[groupName] || [];
    const groupConfig = tagGroupConfigs[groupName] || { isSingleSelect: false, allowAddTags: true };

    // Handle single-select groups
    let updatedGroupTags: string[];
    if (groupConfig.isSingleSelect) {
      // Single-select: replace with new tag or clear if same tag clicked
      updatedGroupTags = groupTags.includes(tag) ? [] : [tag];
    } else {
      // Multi-select: toggle tag
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
    // Allow adding tags to both existing groups and pending groups
    if (group) {
      setEditingTagInGroup({ groupName, groupId: group.id });
    } else if (pendingTagGroups.has(groupName)) {
      // For pending groups, we don't have a groupId yet, but we can still track it
      // We'll use a temporary ID that will be replaced when the group is saved
      setEditingTagInGroup({ groupName, groupId: '' });
    }
  };

  const handleSaveTagToGroup = () => {
    if (
      editingTagInGroup &&
      newTagInGroupName.trim() &&
      !tagGroups[editingTagInGroup.groupName]?.includes(newTagInGroupName.trim())
    ) {
      const trimmedTag = newTagInGroupName.trim();
      const groupName = editingTagInGroup.groupName;
      
      // Add to local state (don't save to database yet)
      setTagGroups((prev) => ({
        ...prev,
        [groupName]: [...(prev[groupName] || []), trimmedTag],
      }));

      // Track all new tags as pending (they'll be saved on confirm)
      setPendingTags((prev) => ({
        ...prev,
        [groupName]: [...(prev[groupName] || []), trimmedTag],
      }));

      // If adding to Category group and it's currently selected in tempTags, auto-select it
      if (groupName === 'Category') {
        const currentTagGroups = tempTags.tagGroups || {};
        const groupConfig = tagGroupConfigs['Category'] || { isSingleSelect: true };
        if (groupConfig.isSingleSelect) {
          // Auto-select the newly added category
          setTempTags({
            ...tempTags,
            tagGroups: {
              ...currentTagGroups,
              Category: [trimmedTag],
            },
          });
        }
      }
    }
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleCancelTagInGroup = () => {
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleCancelTagGroup = () => {
    setShowTagGroupInput(false);
    setNewTagGroupName('');
  };

  const closeTagModal = () => {
    setEditingTarget(null);
  };

  // Function to save all pending tag groups and tags to database
  const savePendingTagGroupsAndTags = async (): Promise<void> => {
    console.log('[use-add-task-tags] savePendingTagGroupsAndTags called');
    console.log('[use-add-task-tags] Starting to save pending tag groups and tags to backend');
    console.log('[use-add-task-tags] Pending tag groups:', Array.from(pendingTagGroups));
    console.log('[use-add-task-tags] Pending tags:', pendingTags);

    if (pendingTagGroups.size === 0 && Object.keys(pendingTags).length === 0) {
      console.log('[savePendingTagGroupsAndTags] No pending data to save, skipping');
      return;
    }

    // Save pending tag groups first
    console.log('[savePendingTagGroupsAndTags] Creating tag groups in backend...');
    console.log('[savePendingTagGroupsAndTags] Number of pending tag groups:', pendingTagGroups.size);
    const groupPromises = Array.from(pendingTagGroups).map(async (groupName) => {
      try {
        const groupConfig = tagGroupConfigs[groupName] || { isSingleSelect: true, allowAddTags: true };
        console.log(`[savePendingTagGroupsAndTags] Creating tag group: "${groupName}" with config:`, groupConfig);
        const newGroup = await createDbTagGroup(
          groupName,
          groupConfig.isSingleSelect,
          groupConfig.allowAddTags
        );
        if (newGroup) {
          console.log(`[savePendingTagGroupsAndTags] ✓ Successfully created tag group: "${groupName}" with ID:`, newGroup.id);
        } else {
          console.error(`[savePendingTagGroupsAndTags] ✗ Failed to create tag group: "${groupName}" - newGroup is null`);
        }
        return { groupName, newGroup };
      } catch (error) {
        console.error(`[savePendingTagGroupsAndTags] ✗ Exception creating tag group "${groupName}":`, error);
        return { groupName, newGroup: null };
      }
    });

    const createdGroups = await Promise.all(groupPromises);
    console.log('[savePendingTagGroupsAndTags] All group promises resolved:', createdGroups);
    const groupNameToIdMap = new Map<string, string>();
    createdGroups.forEach(({ groupName, newGroup }) => {
      if (newGroup) {
        groupNameToIdMap.set(groupName, newGroup.id);
        console.log(`[savePendingTagGroupsAndTags] Mapped group "${groupName}" to ID: ${newGroup.id}`);
      } else {
        console.error(`[savePendingTagGroupsAndTags] Failed to create group "${groupName}" - newGroup is null`);
      }
    });
    console.log('[savePendingTagGroupsAndTags] Tag groups created, mapping:', Object.fromEntries(groupNameToIdMap));
    
    if (groupNameToIdMap.size === 0 && pendingTagGroups.size > 0) {
      console.error('[savePendingTagGroupsAndTags] ERROR: No tag groups were created successfully!');
    }

    // Save pending tags for all groups (both new and existing)
    console.log('[savePendingTagGroupsAndTags] Creating tags in backend...');
    const tagPromises: Promise<void>[] = [];
    Object.entries(pendingTags).forEach(([groupName, tagNames]) => {
      if (tagNames.length === 0) return;

      let groupId: string | undefined;
      
      // Check if it's a newly created group
      if (groupNameToIdMap.has(groupName)) {
        groupId = groupNameToIdMap.get(groupName);
        console.log(`[savePendingTagGroupsAndTags] Using newly created group ID for "${groupName}":`, groupId);
      } else {
        // It's an existing group from database
        const existingGroup = dbTagGroups.find((g) => g.name === groupName);
        if (existingGroup) {
          groupId = existingGroup.id;
          console.log(`[savePendingTagGroupsAndTags] Using existing group ID for "${groupName}":`, groupId);
        }
      }

      if (groupId) {
        tagNames.forEach((tagName) => {
          console.log(`[savePendingTagGroupsAndTags] Creating tag: "${tagName}" in group "${groupName}" (ID: ${groupId})`);
          tagPromises.push(
            createDbTag(tagName, groupId!).then((newTag) => {
              if (newTag) {
                console.log(`[savePendingTagGroupsAndTags] Created tag: "${tagName}" with ID:`, newTag.id);
                setAllTags((prev) => [...prev, newTag]);
              } else {
                console.error(`[savePendingTagGroupsAndTags] Failed to create tag: "${tagName}" in group "${groupName}"`);
              }
              return Promise.resolve();
            }).catch((error) => {
              console.error(`[savePendingTagGroupsAndTags] Error creating tag "${tagName}":`, error);
              return Promise.resolve();
            })
          );
        });
      } else {
        console.warn(`[savePendingTagGroupsAndTags] Could not find group ID for "${groupName}", skipping tags:`, tagNames);
      }
    });

    if (tagPromises.length > 0) {
      console.log(`[savePendingTagGroupsAndTags] Waiting for ${tagPromises.length} tag creation promises...`);
      await Promise.all(tagPromises);
      console.log('[savePendingTagGroupsAndTags] All tags created successfully');
    } else {
      console.log('[savePendingTagGroupsAndTags] No tags to create');
    }
    
    // Clear pending state only if everything succeeded
    console.log('[savePendingTagGroupsAndTags] Checking if all operations succeeded...');
    const failedGroups = createdGroups.filter(g => !g.newGroup).length;
    if (failedGroups === 0) {
      console.log('[savePendingTagGroupsAndTags] All operations succeeded, clearing pending state');
      setPendingTagGroups(new Set());
      setPendingTags({});
      console.log('[savePendingTagGroupsAndTags] Cleared pending state');
    } else {
      console.error(`[savePendingTagGroupsAndTags] ${failedGroups} tag group(s) failed to create, keeping pending state`);
    }
    
    // Refetch to get updated data from database
    console.log('[savePendingTagGroupsAndTags] Refetching tag groups from backend...');
    await fetchTagGroups();
    console.log('[savePendingTagGroupsAndTags] Completed saving all pending tag groups and tags');
  };

  return {
    // State
    editingTarget,
    tempTags,
    tagGroups,
    tagGroupOrder,
    tagGroupColors,
    tagGroupConfigs,
    showTagGroupInput,
    newTagGroupName,
    editingTagInGroup,
    newTagInGroupName,
    pendingTagGroups,
    pendingTags,
    // Actions
    openTagModal,
    saveTags,
    handleAddNewTagGroup,
    handleSaveNewTagGroup,
    toggleTagInGroup,
    handleAddTagToGroup,
    handleSaveTagToGroup,
    handleCancelTagInGroup,
    handleCancelTagGroup,
    closeTagModal,
    setNewTagInGroupName,
    setNewTagGroupName,
    savePendingTagGroupsAndTags,
  };
}
