import { useState } from 'react';
import { type TaskTags } from '@/components/ui/tag-display-row';
import type { TagGroupResponse } from '@/hooks/tasks/use-tag-groups';
import type { TagResponse } from '@/hooks/tasks/use-tags';
import { TAG_GROUP_COLORS } from '@/constants/task-tags';

/**
 * Hook for tag and tag group operations (add, save, toggle)
 */
export function useTaskTagsOperations(
  dbTagGroups: TagGroupResponse[],
  tagGroups: { [groupName: string]: string[] },
  tagGroupConfigs: { [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } },
  tagGroupColors: { [groupName: string]: { bg: string; text: string } },
  tempTags: TaskTags,
  setTempTags: React.Dispatch<React.SetStateAction<TaskTags>>,
  setTagGroups: React.Dispatch<React.SetStateAction<{ [groupName: string]: string[] }>>,
  setTagGroupOrder: React.Dispatch<React.SetStateAction<string[]>>,
  setTagGroupColors: React.Dispatch<React.SetStateAction<{ [groupName: string]: { bg: string; text: string } }>>,
  setTagGroupConfigs: React.Dispatch<React.SetStateAction<{ [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } }>>,
  setAllTags: React.Dispatch<React.SetStateAction<TagResponse[]>>,
  createDbTag: (name: string, groupId: string) => Promise<TagResponse | null>,
  createDbTagGroup: (name: string) => Promise<TagGroupResponse | null>,
  fetchTagGroups: () => Promise<void>
) {
  const [showTagGroupInput, setShowTagGroupInput] = useState(false);
  const [newTagGroupName, setNewTagGroupName] = useState('');
  const [editingTagInGroup, setEditingTagInGroup] = useState<{ groupName: string; groupId: string } | null>(null);
  const [newTagInGroupName, setNewTagInGroupName] = useState('');

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
            allowAddTags: newGroup.allow_add_tag, // Backend uses singular "allow_add_tag"
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

  const handleCancelTagInGroup = () => {
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleCancelTagGroup = () => {
    setShowTagGroupInput(false);
    setNewTagGroupName('');
  };

  return {
    showTagGroupInput,
    newTagGroupName,
    editingTagInGroup,
    newTagInGroupName,
    toggleTagInGroup,
    handleAddTagToGroup,
    handleSaveTagToGroup,
    handleAddNewTagGroup,
    handleSaveNewTagGroup,
    handleCancelTagInGroup,
    handleCancelTagGroup,
    setNewTagInGroupName,
    setNewTagGroupName,
  };
}
