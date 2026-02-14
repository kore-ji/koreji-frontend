import { useState } from 'react';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { type TaskItem } from '@/types/tasks';
import {
  buildTaskTagsFromTask,
  buildTaskFieldsFromSelection,
} from '@/utils/tasks/task-tags';
import { useTaskTagsData } from './use-task-tags-data';
import { useTaskTagsTransformation } from './use-task-tags-transformation';
import { useTaskTagsOperations } from './use-task-tags-operations';
import { patch } from '@/services/api/client';
import type { TagGroupResponse } from '@/hooks/tasks/use-tag-groups';
import type { TagResponse } from '@/hooks/tasks/use-tags';

/**
 * Hook for managing tag modal state and tag editing logic for tasks screen
 */
export function useTaskTags(
  tasks: TaskItem[],
  updateTaskField: (
    id: string,
    field: keyof TaskItem,
    value: any
  ) => Promise<void>,
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>
) {
  // Data fetching
  const {
    dbTagGroups,
    allTags,
    categoriesFromTasks,
    fetchTagGroups,
    createDbTag,
    createDbTagGroup,
    setAllTags,
  } = useTaskTagsData();

  // Editing state
  const [editingTagTarget, setEditingTagTarget] = useState<
    'main' | string | null
  >(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });

  // Tag groups display state
  const [tagGroups, setTagGroups] = useState<{ [groupName: string]: string[] }>(
    {}
  );
  const [tagGroupOrder, setTagGroupOrder] = useState<string[]>([]);
  const [tagGroupColors, setTagGroupColors] = useState<{
    [groupName: string]: { bg: string; text: string };
  }>({});
  const [tagGroupConfigs, setTagGroupConfigs] = useState<{
    [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean };
  }>({});

  // Transform database data into component-friendly format
  useTaskTagsTransformation(
    dbTagGroups,
    allTags,
    categoriesFromTasks,
    setTagGroups,
    setTagGroupOrder,
    setTagGroupColors,
    setTagGroupConfigs
  );

  // Tag and tag group operations
  const operations = useTaskTagsOperations(
    dbTagGroups,
    tagGroups,
    tagGroupConfigs,
    tagGroupColors,
    tempTags,
    setTempTags,
    setTagGroups,
    setTagGroupOrder,
    setTagGroupColors,
    setTagGroupConfigs,
    setAllTags,
    createDbTag,
    createDbTagGroup,
    fetchTagGroups
  );

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
    // Reset operations state
    operations.handleCancelTagGroup();
    operations.handleCancelTagInGroup();
  };

  const saveTagsForTask = async () => {
    if (!editingTaskId) {
      setEditingTagTarget(null);
      return;
    }

    const includeCategory = editingTagTarget === 'main';
    const selection: TaskTags = includeCategory
      ? tempTags
      : (() => {
          const { Category, ...rest } = tempTags.tagGroups || {};
          return { tagGroups: rest };
        })();

    const { categoryValue, priorityValue, nextTags } =
      buildTaskFieldsFromSelection(selection, includeCategory);

    // Build backend tag_ids from the current selection (excluding Category which is stored on the task itself)
    const buildTagIdsFromSelection = (
      selectionForBackend: TaskTags,
      groups: TagGroupResponse[],
      tags: TagResponse[]
    ): string[] => {
      const groupsMap = new Map<string, TagGroupResponse>();
      groups.forEach((g) => {
        groupsMap.set(g.name, g);
      });

      const tagsByGroupId = new Map<string, TagResponse[]>();
      tags.forEach((t) => {
        const list = tagsByGroupId.get(t.tag_group_id) || [];
        list.push(t);
        tagsByGroupId.set(t.tag_group_id, list);
      });

      const selectionGroups = selectionForBackend.tagGroups || {};
      const resultIds: string[] = [];

      Object.entries(selectionGroups).forEach(([groupName, names]) => {
        if (groupName === 'Category') {
          // Category is stored on task.category, not in the tags relation
          return;
        }
        const group = groupsMap.get(groupName);
        if (!group) return;

        const groupTags = tagsByGroupId.get(group.id) || [];
        (names || []).forEach((name) => {
          const match = groupTags.find((t) => t.name === name);
          if (match && !resultIds.includes(match.id)) {
            resultIds.push(match.id);
          }
        });
      });

      return resultIds;
    };

    const currentTask = tasks.find((t) => t.id === editingTaskId);
    if (currentTask) {
      console.log(
        '[Tag Update] Task:',
        editingTaskId,
        'New tags:',
        selection.tagGroups
      );

      // Update category in backend if it changed
      if (includeCategory && categoryValue !== currentTask.category) {
        await updateTaskField(editingTaskId, 'category', categoryValue || null);
      }
      // Update priority in backend if it changed
      if (priorityValue !== currentTask.priority) {
        await updateTaskField(editingTaskId, 'priority', priorityValue || null);
      }
    }

    // Persist tags to backend for both tasks and subtasks via PATCH on task/subtask endpoints
    try {
      const tagIds = buildTagIdsFromSelection(selection, dbTagGroups, allTags);
      const isMainTaskTarget = editingTagTarget === 'main';
      const endpoint = isMainTaskTarget
        ? `/api/tasks/${editingTaskId}`
        : `/api/tasks/subtasks/${editingTaskId}`;

      // Even if no tags are selected, call backend to clear any existing tags
      await patch(endpoint, { tag_ids: tagIds });
    } catch (err) {
      console.error('[useTaskTags] Failed to sync tags to backend:', err);
      // Continue and still update local state so UI does not get stuck
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
          },
        };
        if (includeCategory) {
          nextTask.category = categoryValue || t.category;
        }
        nextTask.priority = priorityValue ?? t.priority ?? null;
        return nextTask;
      })
    );

    setEditingTagTarget(null);
    setEditingTaskId(null);
    operations.setNewTagGroupName('');
    operations.setNewTagInGroupName('');
    if (operations.editingTagInGroup) {
      operations.handleCancelTagInGroup();
    }
  };

  const closeTagModal = () => {
    setEditingTagTarget(null);
    setEditingTaskId(null);
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
    showTagGroupInput: operations.showTagGroupInput,
    newTagGroupName: operations.newTagGroupName,
    editingTagInGroup: operations.editingTagInGroup,
    newTagInGroupName: operations.newTagInGroupName,
    // Actions
    openTagModalForTask,
    toggleTagInGroup: operations.toggleTagInGroup,
    handleAddTagToGroup: operations.handleAddTagToGroup,
    handleSaveTagToGroup: operations.handleSaveTagToGroup,
    handleAddNewTagGroup: operations.handleAddNewTagGroup,
    handleSaveNewTagGroup: operations.handleSaveNewTagGroup,
    saveTagsForTask,
    closeTagModal,
    handleCancelTagInGroup: operations.handleCancelTagInGroup,
    handleCancelTagGroup: operations.handleCancelTagGroup,
    setNewTagInGroupName: operations.setNewTagInGroupName,
    setNewTagGroupName: operations.setNewTagGroupName,
  };
}
