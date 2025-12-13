import { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/ui/use-responsive';
import {
  useContainerHandlers,
  useEditableFieldHandlers,
  useClearHoverHandlers,
} from '@/hooks/tasks/use-task-hover-handlers';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { TagSelectionModal } from '@/components/add-task/tag-selection-modal';
import { DatePickerModal } from '@/components/add-task/date-picker-modal';
import { type TaskItemWithSubtasks } from '@/types/tasks';
import { TaskItemComponent } from '@/components/tasks/task-item';
import { StatusPickerModal } from '@/components/tasks/status-picker-modal';
import { TasksEmptyState } from '@/components/tasks/tasks-empty-state';
import { useTasks } from '@/hooks/tasks/use-tasks';
import { useTaskUpdate } from '@/hooks/tasks/use-task-update';
import { useTaskTags } from '@/hooks/tasks/use-task-tags';
import { useTaskUIState } from '@/hooks/tasks/use-task-ui-state';
import { isStatusComplete } from '@/utils/tasks/task-status';
import { getLayoutSizes } from '@/utils/tasks/tasks-layout';
import { tasksStyles } from '@/styles/tasks.styles';
import { type TaskStatus } from '@/types/task-status';

export default function TasksScreen() {
  const router = useRouter();
  const responsive = useResponsive();

  // Task fetching and state
  const { tasks, setTasks, loading, error } = useTasks();

  // Task field updates
  const { updateTaskField } = useTaskUpdate(tasks, setTasks);

  // Tag management
  const {
    editingTagTarget,
    tempTags,
    tagGroups,
    tagGroupOrder,
    tagGroupColors,
    showTagGroupInput,
    newTagGroupName,
    editingTagInGroup,
    newTagInGroupName,
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
  } = useTaskTags(tasks, updateTaskField, setTasks);

  // UI state management
  const {
    expandedIds,
    statusPickerVisible,
    statusPickerTaskId,
    datePickers,
    hoveredField,
    hoveredSubtaskField,
    hoveredTaskId,
    hoveredSubtaskId,
    toggleExpand,
    openStatusPicker,
    closeStatusPicker,
    openDatePicker,
    handleDateChange: handleDateChangeBase,
    handleDatePickerDone,
    handleDatePickerCancel,
    setHoveredField,
    setHoveredSubtaskField,
    setHoveredTaskId,
    setHoveredSubtaskId,
  } = useTaskUIState();

  // Convert data structure (Flat -> Tree) and dynamically calculate time
  const structuredTasks = useMemo(() => {
    const mainTasks = tasks.filter((t) => t.parentId === null);

    return mainTasks.map((main) => {
      const subtasks = tasks.filter((t) => t.parentId === main.id);

      // Dynamically calculate total time (if subtask time is modified, it will be recalculated here)
      let displayTime = main.estimatedTime;
      if (subtasks.length > 0) {
        displayTime = subtasks.reduce((sum, sub) => sum + sub.estimatedTime, 0);
      }

      return {
        ...main,
        displayTime, // Property used for display
        subtasks,
      };
    });
  }, [tasks]);

  const layout = getLayoutSizes(responsive);
  const isEmptyState = !loading && !error && structuredTasks.length === 0;

  const handleAddTask = () => {
    router.push('/add_task');
  };

  // Date change handler wrapper
  const handleDateChange = (taskId: string, event: any, selectedDate?: Date) => {
    handleDateChangeBase(taskId, event, selectedDate, (id, date) => {
      updateTaskField(id, 'deadline', date);
    });
  };

  // Status change handler
  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    updateTaskField(taskId, 'status', status);
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
    const completedSub = item.subtasks.filter((s) => isStatusComplete(s.status)).length;
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
        onStatusPress={() => openStatusPicker(item.id)}
        onToggleExpand={() => toggleExpand(item.id)}
        onUpdateField={updateTaskField}
        onTagEdit={() => openTagModalForTask(item.id, true)}
        onDeadlinePress={() => openDatePicker(item.id)}
        onSubtaskStatusPress={(subtaskId) => openStatusPicker(subtaskId)}
        onSubtaskUpdateField={updateTaskField}
        onSubtaskTagEdit={(subtaskId) => openTagModalForTask(subtaskId, false)}
        onSubtaskDeadlinePress={(subtaskId) => openDatePicker(subtaskId)}
        tagGroupColors={tagGroupColors}
        isStatusComplete={isStatusComplete}
        progressPercent={progressPercent}
        shouldShowProgress={shouldShowProgress}
        layout={{
          taskTitleSize: layout.taskTitleSize,
          taskDescSize: layout.taskDescSize,
        }}
        styles={tasksStyles}
      />
    );
  };

  return (
    <SafeAreaView style={tasksStyles.container}>
      <View style={[tasksStyles.header, { padding: layout.screenHeaderPadding }]}>
        <Text style={[tasksStyles.headerTitle, { fontSize: layout.headerTitleSize }]}>
          {TASK_SCREEN_STRINGS.headerTitle}
        </Text>
      </View>
      {loading && (
        <View style={[tasksStyles.infoBanner, { marginHorizontal: layout.listPadding }]}>
          <Text style={tasksStyles.infoText}>Loading tasks…</Text>
        </View>
      )}
      {error && (
        <View style={[tasksStyles.errorBanner, { marginHorizontal: layout.listPadding }]}>
          <Text style={tasksStyles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={structuredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          tasksStyles.listContent,
          { padding: layout.listPadding, flexGrow: isEmptyState ? 1 : undefined },
        ]}
        ListEmptyComponent={isEmptyState ? <TasksEmptyState onAddTask={handleAddTask} /> : null}
        keyboardShouldPersistTaps="handled"
      />
      <TouchableOpacity
        style={[
          tasksStyles.fab,
          {
            width: layout.fabSize,
            height: layout.fabSize,
            borderRadius: layout.fabSize / 2,
            right: layout.fabPosition.right,
            bottom: layout.fabPosition.bottom,
          },
        ]}
        onPress={handleAddTask}
      >
        <Ionicons name="add" size={layout.fabIconSize} color="white" />
      </TouchableOpacity>

      {/* Status Picker Modal */}
      <StatusPickerModal
        visible={statusPickerVisible !== null}
        taskId={statusPickerTaskId}
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onClose={closeStatusPicker}
      />

      {/* Tag Selection Modal */}
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
        onClose={closeTagModal}
        onToggleTag={toggleTagInGroup}
        onAddTagToGroup={handleAddTagToGroup}
        onSaveTagToGroup={handleSaveTagToGroup}
        onCancelTagInGroup={handleCancelTagInGroup}
        onNewTagInGroupNameChange={setNewTagInGroupName}
        onAddNewTagGroup={handleAddNewTagGroup}
        onSaveNewTagGroup={handleSaveNewTagGroup}
        onCancelTagGroup={handleCancelTagGroup}
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
