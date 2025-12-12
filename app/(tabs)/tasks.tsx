import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, Modal, Pressable, Platform
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/use-responsive';
import {
  useContainerHandlers,
  useEditableFieldHandlers,
  useClearHoverHandlers,
} from '@/hooks/use-task-hover-handlers';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { TASK_STATUSES, TASK_STATUS_COLORS } from '@/constants/task-status';
import { TagSelectionModal } from '@/components/add-task/tag-selection-modal';
import { DatePickerModal } from '@/components/add-task/date-picker-modal';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { DEFAULT_TAG_GROUP_ORDER, TAG_GROUPS, TAG_GROUP_COLORS } from '@/constants/task-tags';
import { type TaskStatus } from '@/types/task-status';
import { get, patch, ApiClientError, ApiErrorType } from '@/services/api/client';
import { mapStatusToBackend } from '@/utils/mapping/status';
import { formatDate } from '@/utils/formatting/date';
import { type TaskItem, type ApiTaskResponse, type TaskItemWithSubtasks } from '@/types/tasks';
import { flattenTasks } from '@/utils/tasks/flatten-tasks';
import { buildTaskTagsFromTask, buildTaskFieldsFromSelection } from '@/utils/tasks/task-tags';
import { TaskItemComponent } from '@/components/tasks/task-item';

const isStatusComplete = (status: TaskStatus) => status === 'Done' || status === 'Archive';

export default function TasksScreen() {
  const router = useRouter();
  const responsive = useResponsive();

  // 1. Convert data to State, so that it can be modified
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [statusPickerVisible, setStatusPickerVisible] = useState<string | null>(null);
  const [statusPickerTaskId, setStatusPickerTaskId] = useState<string | null>(null);
  const [editingTagTarget, setEditingTagTarget] = useState<'main' | string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });
  const [tagGroups, setTagGroups] = useState<{ [groupName: string]: string[] }>(
    Object.fromEntries(Object.entries(TAG_GROUPS).map(([name, data]) => [name, data.tags]))
  );
  const [tagGroupOrder, setTagGroupOrder] = useState<string[]>(DEFAULT_TAG_GROUP_ORDER);
  const [tagGroupColors, setTagGroupColors] = useState<{ [groupName: string]: { bg: string; text: string } }>(
    Object.fromEntries(Object.entries(TAG_GROUPS).map(([name, data]) => [name, data.color]))
  );
  const [showTagGroupInput, setShowTagGroupInput] = useState(false);
  const [newTagGroupName, setNewTagGroupName] = useState('');
  const [editingTagInGroup, setEditingTagInGroup] = useState<{ groupName: string } | null>(null);
  const [newTagInGroupName, setNewTagInGroupName] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredField, setHoveredField] = useState<{ taskId: string; field: 'title' | 'description' } | null>(null);
  const [hoveredSubtaskField, setHoveredSubtaskField] = useState<{ subtaskId: string; field: 'title' | 'description' } | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredSubtaskId, setHoveredSubtaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datePickers, setDatePickers] = useState<{ [taskId: string]: boolean }>({});

  // 2. Function to update task data (syncs with backend)
  const updateTaskField = async (id: string, field: keyof TaskItem, value: any) => {
    const targetTask = tasks.find(t => t.id === id);
    if (!targetTask) return;

    const isSubtask = targetTask.parentId !== null;
    const parentId = targetTask.parentId;
    const parentTask = parentId ? tasks.find(t => t.id === parentId) : null;

    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      estimatedTime: 'estimated_minutes',
      status: 'status',
      category: 'category',
      deadline: 'due_date',
    };

    const backendField = fieldMapping[field];
    if (!backendField) {
      console.warn(`[Update Task] Unknown field: ${field}`);
      return;
    }

    // Prepare payload
    const payload: Record<string, unknown> = {};
    
    if (field === 'status') {
      payload.status = mapStatusToBackend(value as TaskStatus);
    } else if (field === 'estimatedTime') {
      payload.estimated_minutes = value;
    } else if (field === 'deadline') {
      // Format date for backend (YYYY-MM-DD format)
      payload.due_date = value ? formatDate(value as Date) : null;
    } else {
      payload[backendField] = value;
    }

    try {
      // Determine endpoint based on whether it's a subtask
      const endpoint = isSubtask 
        ? `/tasks/subtasks/${id}`
        : `/tasks/${id}`;
      
      await patch(endpoint, payload);

      // Update local state optimistically
      setTasks(prevTasks => {
        let nextTasks = prevTasks.map(t => (t.id === id ? { ...t, [field]: value } : t));

        const shouldBumpParent =
          field === 'status' &&
          value === 'In progress' &&
          parentId &&
          parentTask?.status === 'Not started';

        if (shouldBumpParent) {
          nextTasks = nextTasks.map(t => (t.id === parentId ? { ...t, status: 'In progress' } : t));
        }

        const shouldCompleteChildren =
          field === 'status' &&
          (value === 'Done' || value === 'Archive');

        if (shouldCompleteChildren) {
          nextTasks = nextTasks.map(t => {
            const isChild = t.parentId === id;
            const targetStatus = value;
            const shouldUpdateChild = targetStatus === 'Archive'
              ? t.status !== 'Archive' // archive all non-archived children (including Done)
              : t.status === 'Not started' || t.status === 'In progress'; // only bump incomplete to Done
            return isChild && shouldUpdateChild ? { ...t, status: targetStatus } : t;
          });
        }

        return nextTasks;
      });

      console.log(`[Backend Update] Task ${id}: ${field} = ${value}`);
    } catch (error) {
      console.error(`[Backend Update Failed] Task ${id}: ${field} = ${value}`, error);
      // Optionally show error to user or revert optimistic update
      if (error instanceof ApiClientError) {
        // Could show an alert here
        console.error('Update failed:', error.message);
      }
    }
  };

  // Fetch tasks from backend (only top-level tasks, not subtasks)
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only fetch top-level tasks (is_subtask=false)
      const data = await get<ApiTaskResponse[]>('/tasks?is_subtask=false');
      const flattened = Array.isArray(data) ? flattenTasks(data) : [];
      setTasks(flattened);
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.type === ApiErrorType.CONFIG) {
          setError('Missing API base URL. Set EXPO_PUBLIC_API_BASE_URL to your FastAPI server.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Unable to load tasks.');
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Date picker handlers
  const handleDateChange = (taskId: string, event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        updateTaskField(taskId, 'deadline', selectedDate);
      }
      setDatePickers((prev) => ({ ...prev, [taskId]: false }));
    } else {
      if (selectedDate) {
        updateTaskField(taskId, 'deadline', selectedDate);
      }
    }
  };

  const handleDatePickerDone = (taskId: string) => {
    setDatePickers((prev) => ({ ...prev, [taskId]: false }));
  };

  const handleDatePickerCancel = (taskId: string) => {
    setDatePickers((prev) => ({ ...prev, [taskId]: false }));
  };

  // Fetch on mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Refetch when screen comes into focus (e.g., after creating a task)
  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  // --- Tag helpers ---

  const openTagModalForTask = (taskId: string, isMainTask: boolean) => {
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
    const groupConfig = TAG_GROUPS[groupName] || { isSingleSelect: false, allowAddTags: true };

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
    setEditingTagInGroup({ groupName });
  };

  const handleSaveTagToGroup = () => {
    if (
      editingTagInGroup &&
      newTagInGroupName.trim() &&
      !tagGroups[editingTagInGroup.groupName]?.includes(newTagInGroupName.trim())
    ) {
      const trimmedTag = newTagInGroupName.trim();
      setTagGroups((prev) => ({
        ...prev,
        [editingTagInGroup.groupName]: [...(prev[editingTagInGroup.groupName] || []), trimmedTag],
      }));

      if (editingTagInGroup.groupName === 'Category') {
        const currentTagGroups = tempTags.tagGroups || {};
        const groupConfig = TAG_GROUPS['Category'] || { isSingleSelect: true };
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
    }
    setEditingTagInGroup(null);
    setNewTagInGroupName('');
  };

  const handleAddNewTagGroup = () => {
    setShowTagGroupInput(true);
  };

  const handleSaveNewTagGroup = () => {
    const trimmedTagGroup = newTagGroupName.trim();
    if (trimmedTagGroup && !tagGroups[trimmedTagGroup]) {
      setTagGroups((prev) => ({
        ...prev,
        [trimmedTagGroup]: [],
      }));
      setTagGroupOrder((prev) => [...prev, trimmedTagGroup]);

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

  // 3. Convert data structure (Flat -> Tree) and dynamically calculate time
  const structuredTasks = useMemo(() => {
    const mainTasks = tasks.filter(t => t.parentId === null);

    return mainTasks.map(main => {
      const subtasks = tasks.filter(t => t.parentId === main.id);

      // Dynamically calculate total time (if subtask time is modified, it will be recalculated here)
      let displayTime = main.estimatedTime;
      if (subtasks.length > 0) {
        displayTime = subtasks.reduce((sum, sub) => sum + sub.estimatedTime, 0);
      }

      return {
        ...main,
        displayTime, // Property used for display
        subtasks
      };
    });
  }, [tasks]);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const layout = getLayoutSizes(responsive);
  const isEmptyState = !loading && !error && structuredTasks.length === 0;

  const handleAddTask = () => {
    router.push('/add_task');
  };

  // Reusable mouse hover handlers
  const containerHandlersProps = {
    hoveredSubtaskId,
    setHoveredTaskId,
    setHoveredSubtaskId,
  };
  const editableFieldHandlersProps = {
    ...containerHandlersProps,
    setHoveredField,
    setHoveredSubtaskField,
  };

  const createMouseHandlers = {
    container: useContainerHandlers(containerHandlersProps),
    editableField: useEditableFieldHandlers(editableFieldHandlersProps),
    clearHover: useClearHoverHandlers(containerHandlersProps),
  };

  const renderItem = ({ item }: { item: TaskItemWithSubtasks }) => {
    const isExpanded = expandedIds.has(item.id);
    const isTitleHovered = hoveredField?.taskId === item.id && hoveredField?.field === 'title';
    const isDescHovered = hoveredField?.taskId === item.id && hoveredField?.field === 'description';

    // Progress calculation
    const totalSub = item.subtasks.length;
    const completedSub = item.subtasks.filter(s => isStatusComplete(s.status)).length;
    const hasProgressFromSubtasks = totalSub > 0;
    const progressPercent = hasProgressFromSubtasks
      ? (completedSub / totalSub) * 100
      : isStatusComplete(item.status) || item.isCompleted
      ? 100
      : 0;
    const shouldShowProgress = hasProgressFromSubtasks;

    // Only show hover if no subtask is hovered
    const isTaskHovered = hoveredTaskId === item.id && !hoveredSubtaskId;

    return (
      <TaskItemComponent
        item={item}
        isExpanded={isExpanded}
        isHovered={isTaskHovered}
        isTitleHovered={isTitleHovered}
        isDescHovered={isDescHovered}
        hoveredSubtaskId={hoveredSubtaskId}
        hoveredSubtaskField={hoveredSubtaskField}
        mouseHandlers={createMouseHandlers}
        onStatusPress={() => {
          setStatusPickerTaskId(item.id);
          setStatusPickerVisible(item.id);
        }}
        onToggleExpand={() => toggleExpand(item.id)}
        onUpdateField={updateTaskField}
        onTagEdit={() => openTagModalForTask(item.id, true)}
        onDeadlinePress={() => setDatePickers((prev) => ({ ...prev, [item.id]: true }))}
        onSubtaskStatusPress={(subtaskId) => {
          setStatusPickerTaskId(subtaskId);
          setStatusPickerVisible(subtaskId);
        }}
        onSubtaskUpdateField={updateTaskField}
        onSubtaskTagEdit={(subtaskId) => openTagModalForTask(subtaskId, false)}
        onSubtaskDeadlinePress={(subtaskId) => setDatePickers((prev) => ({ ...prev, [subtaskId]: true }))}
        tagGroupColors={tagGroupColors}
        isStatusComplete={isStatusComplete}
        progressPercent={progressPercent}
        shouldShowProgress={shouldShowProgress}
        layout={{
          taskTitleSize: layout.taskTitleSize,
          taskDescSize: layout.taskDescSize,
        }}
        styles={styles}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { padding: layout.screenHeaderPadding }]}>
        <Text style={[styles.headerTitle, { fontSize: layout.headerTitleSize }]}>{TASK_SCREEN_STRINGS.headerTitle}</Text>
      </View>
      {loading && (
        <View style={[styles.infoBanner, { marginHorizontal: layout.listPadding }]}>
          <Text style={styles.infoText}>Loading tasks…</Text>
        </View>
      )}
      {error && (
        <View style={[styles.errorBanner, { marginHorizontal: layout.listPadding }]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={structuredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { padding: layout.listPadding, flexGrow: isEmptyState ? 1 : undefined },
        ]}
        ListEmptyComponent={
          isEmptyState ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateCard}>
                <Text style={styles.emptyStateTitle}>{TASK_SCREEN_STRINGS.tasksList.emptyStateTitle}</Text>
                <Text style={styles.emptyStateSubtitle}>{TASK_SCREEN_STRINGS.tasksList.emptyStateSubtitle}</Text>
                <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddTask}>
                  <Text style={styles.emptyStateButtonText}>{TASK_SCREEN_STRINGS.tasksList.emptyStateAction}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        keyboardShouldPersistTaps="handled" // Allow tapping outside the input field to close the keyboard
      />
      <TouchableOpacity 
        style={[
          styles.fab, 
          { 
            width: layout.fabSize, 
            height: layout.fabSize, 
            borderRadius: layout.fabSize / 2,
            right: layout.fabPosition.right,
            bottom: layout.fabPosition.bottom,
          }
        ]}
        onPress={handleAddTask}
      >
        <Ionicons name="add" size={layout.fabIconSize} color="white" />
      </TouchableOpacity>

      {/* Status Picker Modal */}
      <Modal
        visible={statusPickerVisible !== null}
        transparent
        animationType="fade"
        accessibilityViewIsModal
        onRequestClose={() => {
          setStatusPickerVisible(null);
          setStatusPickerTaskId(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setStatusPickerVisible(null);
            setStatusPickerTaskId(null);
          }}
          accessibilityLabel="Close modal"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
            accessibilityViewIsModal
            accessibilityLabel="Select task status"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity
                onPress={() => {
                  setStatusPickerVisible(null);
                  setStatusPickerTaskId(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptions}>
              {TASK_STATUSES.map((status) => {
                const isSelected = statusPickerTaskId && tasks.find(t => t.id === statusPickerTaskId)?.status === status;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      { backgroundColor: TASK_STATUS_COLORS[status].bg },
                      isSelected && styles.statusOptionSelected,
                    ]}
                  onPress={() => {
                    if (statusPickerTaskId) {
                      console.log('[Status Change] Task ID:', statusPickerTaskId, 'New Status:', status);
                      updateTaskField(statusPickerTaskId, 'status', status);
                      setStatusPickerVisible(null);
                      setStatusPickerTaskId(null);
                    }
                  }}
                  >
                    <Text style={[styles.statusOptionText, { color: TASK_STATUS_COLORS[status].text }]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Tag Selection Modal (reuse add_task modal) */}
      <TagSelectionModal
        visible={!!editingTagTarget}
        editingTarget={editingTagTarget}
        tempTags={tempTags}
        tagGroups={tagGroups}
        tagGroupOrder={tagGroupOrder}
        tagGroupColors={tagGroupColors}
        editingTagInGroup={editingTagInGroup}
        newTagInGroupName={newTagInGroupName}
        showTagGroupInput={showTagGroupInput}
        newTagGroupName={newTagGroupName}
        selectTagsTitle={TASK_SCREEN_STRINGS.addTask.selectTagsTitle}
        newTagPlaceholder={TASK_SCREEN_STRINGS.addTask.newTagPlaceholder}
        newTagGroupPlaceholder={TASK_SCREEN_STRINGS.addTask.newTagGroupPlaceholder}
        confirmButtonText={TASK_SCREEN_STRINGS.addTask.confirmButton}
        onClose={() => {
          setEditingTagTarget(null);
          setEditingTaskId(null);
        }}
        onToggleTag={toggleTagInGroup}
        onAddTagToGroup={handleAddTagToGroup}
        onSaveTagToGroup={handleSaveTagToGroup}
        onCancelTagInGroup={() => {
          setEditingTagInGroup(null);
          setNewTagInGroupName('');
        }}
        onNewTagInGroupNameChange={setNewTagInGroupName}
        onAddNewTagGroup={handleAddNewTagGroup}
        onSaveNewTagGroup={handleSaveNewTagGroup}
        onCancelTagGroup={() => {
          setShowTagGroupInput(false);
          setNewTagGroupName('');
        }}
        onNewTagGroupNameChange={setNewTagGroupName}
        onSave={saveTagsForTask}
      />

      {/* Date Pickers for Tasks and Subtasks */}
      {Object.entries(datePickers).map(([taskId, isOpen]) => {
        if (!isOpen) return null;
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return null;

        const taskDeadline: Date | null = task.deadline ?? null;
        return (
          <DatePickerModal
            key={taskId}
            visible={isOpen}
            date={taskDeadline}
            onDateChange={(event, date) => handleDateChange(taskId, event, date)}
            onDone={() => handleDatePickerDone(taskId)}
            onCancel={() => handleDatePickerCancel(taskId)}
            minimumDate={new Date()}
          />
        );
      })}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontWeight: 'bold', color: '#333' },
  listContent: { paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  cardHovered: {
    ...Platform.select({
      web: {
        backgroundColor: '#f5f9ff',
        borderColor: '#2196f3',
        boxShadow: '0px 4px 6px 0px rgba(33, 150, 243, 0.15)',
      },
      default: {},
    }),
  },
  editableFieldHovered: {
    ...Platform.select({
      web: {
        backgroundColor: '#f5f9ff',
        borderBottomColor: '#2196f3',
      },
      default: {},
    }),
  },
  taskHeader: {
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  categoryBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 4 },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' },
  titleContainer: { flex: 1 },
  expandButton: { padding: 4 },

  // Editable Styles
  inputWrapper: { borderBottomWidth: 1, borderBottomColor: '#2196f3', paddingBottom: 2 },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingVertical: 4,
    minHeight: 20,
  },

  // Progress & Time
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#888', width: 36, textAlign: 'right' },

  totalTimeBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  totalTimeText: { fontSize: 12, fontWeight: '600', color: '#555' },

  // Subtasks
  subtaskList: { paddingVertical: 4, gap: 12 },
  subtaskContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease-in-out',
      },
      default: {
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  subtaskContainerHovered: {
    ...Platform.select({
      web: {
        backgroundColor: '#f5f9ff',
        borderColor: '#2196f3',
        boxShadow: '0px 4px 6px 0px rgba(33, 150, 243, 0.15)',
      },
      default: {},
    }),
  },
  subtaskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  subtaskContent: { flex: 1, marginLeft: 0, gap: 8 },
  subtaskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  subtaskText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4,
  },
  subtaskDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingVertical: 4,
  },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  subtaskMetaRow: { marginTop: 8 },
  subtaskMetaContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
    gap: 6,
  },
  subtaskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  subtaskTimeDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },

  // Tags & Time Editing
  tagsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 0,
  },
  subtaskTagsContainer: {
    marginTop: 0,
  },
  tagsPressable: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tagChipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 },
  editIcon: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#f2f2f2', alignItems: 'center', justifyContent: 'center' },
  timeTagContainer: { borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tagTime: { fontSize: 13, color: '#333', fontWeight: '600', textAlign: 'center', minWidth: 20 },
  tagUnit: { fontSize: 12, color: '#888', marginRight: 4 },
  clockIcon: { fontSize: 12 },
  singleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  singleTimeDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  deadlineDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 13,
    color: '#666',
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  // Status Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        pointerEvents: 'auto' as const,
      },
      default: {},
    }),
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOptions: {
    gap: 12,
  },
  statusOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    borderColor: '#2196f3',
  },

  fab: { position: 'absolute', backgroundColor: '#2196f3', justifyContent: 'center', alignItems: 'center', elevation: 5 },

  infoBanner: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: { color: '#0D47A1', fontSize: 13 },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { color: '#B71C1C', fontSize: 13 },
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyStateCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
    }),
  },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#333', textAlign: 'center', marginBottom: 8 },
  emptyStateSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 16 },
  emptyStateButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  emptyStateButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

const getLayoutSizes = (responsive: ReturnType<typeof useResponsive>) => {
  const cardHeaderPadding = responsive.isMobile ? 16 : responsive.isTablet ? 20 : 24;
  const screenHeaderPadding = responsive.isMobile ? 20 : responsive.isTablet ? 24 : 32;
  const taskTitleSize = responsive.isMobile ? 18 : responsive.isTablet ? 20 : 22;
  const taskDescSize = responsive.isMobile ? 14 : responsive.isTablet ? 15 : 16;
  const headerTitleSize = responsive.isMobile ? 24 : responsive.isTablet ? 26 : 28;
  const listPadding = responsive.isMobile ? 16 : responsive.isTablet ? 24 : 32;
  const fabSize = responsive.isMobile ? 60 : responsive.isTablet ? 64 : 68;
  const fabIconSize = responsive.isMobile ? 32 : responsive.isTablet ? 34 : 36;
  const fabPosition = {
    right: responsive.isDesktop ? 32 : 20,
    bottom: responsive.isDesktop ? 40 : 30,
  };
  return {
    cardHeaderPadding,
    screenHeaderPadding,
    taskTitleSize,
    taskDescSize,
    headerTitleSize,
    listPadding,
    fabSize,
    fabIconSize,
    fabPosition,
  };
};
