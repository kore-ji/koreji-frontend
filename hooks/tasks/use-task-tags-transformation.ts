import { useEffect } from 'react';
import { TAG_GROUP_COLORS } from '@/constants/task-tags';
import type { TagGroupResponse } from '@/hooks/tasks/use-tag-groups';
import type { TagResponse } from '@/hooks/tasks/use-tags';

export interface TagGroupState {
  tagGroups: { [groupName: string]: string[] };
  tagGroupOrder: string[];
  tagGroupColors: { [groupName: string]: { bg: string; text: string } };
  tagGroupConfigs: { [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } };
}

/**
 * Hook for transforming database tag data into component-friendly format
 */
export function useTaskTagsTransformation(
  dbTagGroups: TagGroupResponse[],
  allTags: TagResponse[],
  categoriesFromTasks: string[],
  setTagGroups: React.Dispatch<React.SetStateAction<{ [groupName: string]: string[] }>>,
  setTagGroupOrder: React.Dispatch<React.SetStateAction<string[]>>,
  setTagGroupColors: React.Dispatch<React.SetStateAction<{ [groupName: string]: { bg: string; text: string } }>>,
  setTagGroupConfigs: React.Dispatch<React.SetStateAction<{ [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } }>>
) {
  useEffect(() => {
    const groupsMap: { [groupName: string]: string[] } = {};
    const groupsOrder: string[] = [];
    const groupsColors: { [groupName: string]: { bg: string; text: string } } = {};
    const groupsConfigs: { [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } } = {};

    // Find Category group from database if it exists
    const categoryGroup = dbTagGroups.find(g => g.name === 'Category');
    let categoryTags: string[] = [];
    
    if (categoryGroup) {
      // Use Category group from database (tags table)
      const groupTags = allTags.filter((tag) => tag.tag_group_id === categoryGroup.id);
      categoryTags = groupTags.map((tag) => tag.name);
    } else if (categoriesFromTasks.length > 0) {
      // Fallback to categories from tasks table if no Category group exists
      categoryTags = categoriesFromTasks;
    }

    // Always add Category group first at the top of the list
    groupsMap['Category'] = categoryTags;
    groupsOrder.push('Category');
    groupsColors['Category'] = TAG_GROUP_COLORS[0]; // Use first color for Category
    groupsConfigs['Category'] = {
      isSingleSelect: true,
      allowAddTags: true,
    };

    // Add other groups from database (skip Category as it's already added)
    if (dbTagGroups.length > 0) {
      dbTagGroups.forEach((group, index) => {
        // Skip Category group as it's already added at the top
        if (group.name === 'Category') {
          return;
        }
        
        // Get tags for this group (may be empty array if no tags exist yet)
        const groupTags = allTags.filter((tag) => tag.tag_group_id === group.id);
        const tagNames = groupTags.map((tag) => tag.name);

        // Always include the group, even if it has no tags
        groupsMap[group.name] = tagNames;
        groupsOrder.push(group.name);
        
        // Assign color based on index (skip first color as Category used it)
        const colorIndex = (index + 1) % TAG_GROUP_COLORS.length;
        groupsColors[group.name] = TAG_GROUP_COLORS[colorIndex];
        
        // Store config from database
        groupsConfigs[group.name] = {
          isSingleSelect: group.is_single_select,
          allowAddTags: group.allow_add_tag, // Backend uses singular "allow_add_tag"
        };
      });
    }

    setTagGroups(groupsMap);
    setTagGroupOrder(groupsOrder);
    setTagGroupColors(groupsColors);
    setTagGroupConfigs(groupsConfigs);
  }, [dbTagGroups, allTags, categoriesFromTasks, setTagGroups, setTagGroupOrder, setTagGroupColors, setTagGroupConfigs]);
}
