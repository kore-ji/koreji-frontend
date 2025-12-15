import { useState } from 'react';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { type TaskItem } from '@/types/tasks';
import { buildTaskTagsFromTask, buildTaskFieldsFromSelection } from '@/utils/tasks/task-tags';
import { useTaskTagsData } from './use-task-tags-data';
import { useTaskTagsTransformation } from './use-task-tags-transformation';
import { useTaskTagsOperations } from './use-task-tags-operations';

/**
 * Hook for managing tag modal state and tag editing logic for tasks screen
 */
export function useTaskTags(
  tasks: TaskItem[],
  updateTaskField: (id: string, field: keyof TaskItem, value: any) => Promise<void>,
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
  const [editingTagTarget, setEditingTagTarget] = useState<'main' | string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });

  // Tag groups display state
  const [tagGroups, setTagGroups] = useState<{ [groupName: string]: string[] }>({});
  const [tagGroupOrder, setTagGroupOrder] = useState<string[]>([]);
  const [tagGroupColors, setTagGroupColors] = useState<{ [groupName: string]: { bg: string; text: string } }>({});
  const [tagGroupConfigs, setTagGroupConfigs] = useState<{ [groupName: string]: { isSingleSelect: boolean; allowAddTags: boolean } }>({});

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
