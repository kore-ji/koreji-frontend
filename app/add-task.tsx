import { useMemo, useEffect } from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { type TaskStatus } from '@/types/task-status';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { formatDate } from '@/utils/formatting/date';
import { MainTaskCard } from '@/components/add-task/main-task-card';
import { SubtaskCard } from '@/components/add-task/subtask-card';
import { SubtaskHeader } from '@/components/add-task/subtask-header';
import { AddTaskFooter } from '@/components/add-task/add-task-footer';
import { DatePickerModal } from '@/components/add-task/date-picker-modal';
import { TagSelectionModal } from '@/components/add-task/tag-selection-modal';
import { useAddTaskForm } from '@/hooks/add-task/use-add-task-form';
import { useSubtasks } from '@/hooks/add-task/use-subtasks';
import { useAddTaskTags } from '@/hooks/add-task/use-add-task-tags';
import { useAddTaskData } from '@/hooks/add-task/use-add-task-data';
import { useAddTaskSubmit } from '@/hooks/add-task/use-add-task-submit';
import { calculateTotalTime, isTimeReadOnly } from '@/utils/add-task/time-calculation';
import { addTaskStyles } from '@/styles/add-task.styles';

export default function AddTaskScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ taskId?: string }>();
  const isEditMode = !!params.taskId;

  // Main task form state
  const {
    mainTitle,
    mainDesc,
    mainTime,
    mainDeadline,
    mainStatus,
    mainTags,
    showDatePicker,
    setMainTitle,
    setMainDesc,
    setMainTime,
    setMainDeadline,
    setMainStatus,
    setMainTags,
    setShowDatePicker,
  } = useAddTaskForm();

  // Subtasks management
  const {
    subtasks,
    subtaskDatePickers,
    setSubtasks,
    addSubtask,
    updateSubtask,
    removeSubtask,
    openSubtaskDatePicker,
    handleSubtaskDateChange: handleSubtaskDateChangeBase,
    handleSubtaskDatePickerDone,
    handleSubtaskDatePickerCancel,
  } = useSubtasks();

  // Tag management
  const {
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
    openTagModal,
    saveTags: saveTagsBase,
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
  } = useAddTaskTags(mainTags, subtasks);

  // Load task data in edit mode
  const { isLoading } = useAddTaskData(
    isEditMode,
    params.taskId,
    setMainTitle,
    setMainDesc,
    setMainTime,
    setMainStatus,
    setMainDeadline,
    setMainTags,
    setSubtasks
  );

  // Form submission
  const { isSubmitting, handleSubmit: handleSubmitBase } = useAddTaskSubmit(
    isEditMode,
    params.taskId,
    mainTitle,
    mainDesc,
    mainTime,
    mainDeadline,
    mainStatus,
    mainTags,
    subtasks
  );

  // Task submit handler (tag groups/tags are already saved when modal Confirm is clicked)
  const handleSubmit = async () => {
    try {
      console.log('[add-task.tsx] ========== handleSubmit called ==========');
      console.log('[add-task.tsx] Submit button clicked, starting task submission');
      console.log('[add-task.tsx] isEditMode:', isEditMode);
      console.log('[add-task.tsx] mainTitle:', mainTitle);
      
      // Note: Tag groups and tags are saved when modal Confirm is clicked, not here
      // Just submit the task
      console.log('[add-task.tsx] Submitting task to backend');
      if (handleSubmitBase) {
        await handleSubmitBase();
        console.log('[add-task.tsx] Task submitted successfully');
      } else {
        console.error('[add-task.tsx] handleSubmitBase is not available');
      }
      
      console.log('[add-task.tsx] ========== handleSubmit completed ==========');
    } catch (error) {
      console.error('[add-task.tsx] ========== ERROR in handleSubmit ==========');
      console.error('[add-task.tsx] Error details:', error);
      if (error instanceof Error) {
        console.error('[add-task.tsx] Error message:', error.message);
        console.error('[add-task.tsx] Error stack:', error.stack);
      }
      throw error;
    }
  };

  // Update navigation title based on edit mode
  useEffect(() => {
    navigation.setOptions({
      title: isEditMode ? 'Edit Task' : TASK_SCREEN_STRINGS.addTask.sectionTitle,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  // Time calculation
  const calculatedTotalTime = useMemo(
    () => calculateTotalTime(subtasks, mainTime),
    [subtasks, mainTime]
  );
  const timeReadOnly = isTimeReadOnly(subtasks);

  // Date picker handlers
  const handleDateChange = (event: any, selectedDate?: Date) => {
    console.log('[DEBUG] handleDateChange called:', {
      platform: Platform.OS,
      eventType: event?.type,
      selectedDate: selectedDate?.toISOString(),
      currentDeadline: mainDeadline?.toISOString(),
      event: JSON.stringify(event, null, 2),
    });

    if (Platform.OS === 'android') {
      // On Android, the picker closes automatically
      // event.type can be 'set', 'dismissed', or 'neutralButtonPressed'
      console.log('[DEBUG] Android - event.type:', event.type);
      if (event.type === 'set' && selectedDate) {
        console.log('[DEBUG] Android - Setting deadline to:', selectedDate.toISOString());
        setMainDeadline(selectedDate);
      } else {
        console.log(
          '[DEBUG] Android - Not setting deadline. event.type:',
          event.type,
          'selectedDate:',
          selectedDate?.toISOString()
        );
      }
      setShowDatePicker(false);
    } else {
      // iOS: update date as user scrolls, but don't close until Done is pressed
      if (selectedDate) {
        console.log('[DEBUG] iOS - Updating deadline to:', selectedDate.toISOString());
        setMainDeadline(selectedDate);
      } else {
        console.log('[DEBUG] iOS - No selectedDate provided');
      }
    }
  };

  const handleDatePickerDone = () => {
    console.log('[DEBUG] handleDatePickerDone called. Current deadline:', mainDeadline?.toISOString());
    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    console.log('[DEBUG] handleDatePickerCancel called. Deadline will remain:', mainDeadline?.toISOString());
    setShowDatePicker(false);
  };

  // Subtask date change handler (uses updateSubtask from hook)
  const handleSubtaskDateChange = handleSubtaskDateChangeBase;

  // Debug log when deadline state changes (for development)
  useEffect(() => {
    console.log('[DEBUG] mainDeadline state changed:', {
      deadline: mainDeadline?.toISOString(),
      formatted: mainDeadline ? formatDate(mainDeadline) : 'null',
    });
  }, [mainDeadline]);

  // Debug log when showDatePicker state changes (for development)
  useEffect(() => {
    console.log('[DEBUG] showDatePicker state changed:', showDatePicker);
  }, [showDatePicker]);

  // AI Generate Logic (Placeholder)
  const handleAIGenerate = () => {
    if (!mainTitle.trim()) {
      Alert.alert(
        TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateTitle,
        TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateMessage
      );
      return;
    }

    // Log time and deadline information if provided before AI generate
    console.log('[AI Generate] Task information provided before AI generate:', {
      title: mainTitle.trim(),
      time: parseInt(mainTime) || 0,
      deadline: mainDeadline ? formatDate(mainDeadline) : null,
    });

    Alert.alert(
      TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateAlertTitle,
      TASK_SCREEN_STRINGS.addTask.alerts.aiGeneratePlaceholder
    );
  };

  // Tag save handler wrapper
  const saveTags = async () => {
    console.log('[add-task.tsx] saveTags called from modal Confirm button');
    await saveTagsBase(
      (tags) => setMainTags(tags),
      (subtaskId, tags) => {
        setSubtasks((prev) => prev.map((s) => (s.id === subtaskId ? { ...s, tags } : s)));
      }
    );
    console.log('[add-task.tsx] saveTags completed');
  };

  return (
    <View style={addTaskStyles.container}>
      <ScrollView contentContainerStyle={addTaskStyles.scrollContent}>
        {/* Main Task Card */}
        <MainTaskCard
          title={mainTitle}
          description={mainDesc}
          time={mainTime}
          deadline={mainDeadline}
          status={mainStatus}
          tags={mainTags}
          isTimeReadOnly={timeReadOnly}
          calculatedTotalTime={calculatedTotalTime}
          tagGroupColors={tagGroupColors}
          taskTitlePlaceholder={TASK_SCREEN_STRINGS.addTask.taskTitlePlaceholder}
          descriptionPlaceholder={TASK_SCREEN_STRINGS.addTask.descriptionPlaceholder}
          timeLabel={TASK_SCREEN_STRINGS.addTask.timeLabel}
          deadlineLabel={TASK_SCREEN_STRINGS.addTask.deadlineLabel}
          minPlaceholder={TASK_SCREEN_STRINGS.addTask.minPlaceholder}
          deadlinePlaceholder={TASK_SCREEN_STRINGS.addTask.deadlinePlaceholder}
          tagsLabel={TASK_SCREEN_STRINGS.addTask.tagsLabel}
          statusLabel={TASK_SCREEN_STRINGS.addTask.statusLabel}
          statusPlaceholder={TASK_SCREEN_STRINGS.addTask.statusPlaceholder}
          onTitleChange={setMainTitle}
          onDescriptionChange={setMainDesc}
          onTimeChange={setMainTime}
          onDeadlinePress={() => {
            console.log('[DEBUG] Deadline button pressed. Current deadline:', mainDeadline?.toISOString());
            setShowDatePicker(true);
          }}
          onStatusChange={(status) => setMainStatus(status as TaskStatus)}
          onTagsEdit={() => openTagModal('main')}
        />

        {/* Subtask Header */}
        <SubtaskHeader
          sectionTitle={TASK_SCREEN_STRINGS.addTask.subtasksSectionTitle}
          aiGenerateButtonText={TASK_SCREEN_STRINGS.addTask.aiGenerateButton}
          addSubtaskButtonText={TASK_SCREEN_STRINGS.addTask.addSubtaskButton}
          onAIGenerate={handleAIGenerate}
          onAddSubtask={addSubtask}
        />

        {/* Subtask List */}
        <View style={addTaskStyles.subtaskList}>
          {subtasks.map((sub, index) => (
            <SubtaskCard
              key={sub.id}
              subtask={sub}
              index={index}
              tagGroupColors={tagGroupColors}
              timeLabel={TASK_SCREEN_STRINGS.addTask.timeLabel}
              deadlineLabel={TASK_SCREEN_STRINGS.addTask.deadlineLabel}
              minPlaceholder={TASK_SCREEN_STRINGS.addTask.minPlaceholder}
              deadlinePlaceholder={TASK_SCREEN_STRINGS.addTask.deadlinePlaceholder}
              subtaskTitlePlaceholder={TASK_SCREEN_STRINGS.addTask.getSubtaskTitlePlaceholder(index + 1)}
              subtaskDescriptionPlaceholder={TASK_SCREEN_STRINGS.addTask.subtaskDescriptionPlaceholder}
              subtaskTagsLabel={TASK_SCREEN_STRINGS.addTask.subtaskTagsLabel}
              statusLabel={TASK_SCREEN_STRINGS.addTask.statusLabel}
              statusPlaceholder={TASK_SCREEN_STRINGS.addTask.statusPlaceholder}
              onUpdate={updateSubtask}
              onRemove={removeSubtask}
              onDeadlinePress={(id) => {
                console.log('[DEBUG] Subtask deadline button pressed. Current deadline:', sub.deadline?.toISOString());
                openSubtaskDatePicker(id);
              }}
              onTagsEdit={openTagModal}
            />
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <AddTaskFooter
        onSubmit={handleSubmit}
        submitButtonText={
          isSubmitting
            ? isEditMode
              ? TASK_SCREEN_STRINGS.addTask.updatingButton
              : TASK_SCREEN_STRINGS.addTask.creatingButton
            : isEditMode
            ? TASK_SCREEN_STRINGS.addTask.updateTaskButton
            : TASK_SCREEN_STRINGS.addTask.createTaskButton
        }
        disabled={isSubmitting || isLoading}
      />

      {/* Main Task Date Picker */}
      <DatePickerModal
        visible={showDatePicker}
        date={mainDeadline}
        onDateChange={handleDateChange}
        onDone={handleDatePickerDone}
        onCancel={handleDatePickerCancel}
        minimumDate={new Date()}
      />

      {/* Subtask Date Pickers */}
      {Object.entries(subtaskDatePickers).map(([subtaskId, isOpen]) => {
        if (!isOpen) return null;
        const subtask = subtasks.find((s) => s.id === subtaskId);
        if (!subtask) return null;

        return (
          <DatePickerModal
            key={subtaskId}
            visible={isOpen}
            date={subtask.deadline}
            onDateChange={(event, date) => handleSubtaskDateChange(subtaskId, event, date)}
            onDone={() => handleSubtaskDatePickerDone(subtaskId)}
            onCancel={() => handleSubtaskDatePickerCancel(subtaskId)}
            minimumDate={new Date()}
          />
        );
      })}

      {/* Tag Selection Modal */}
      <TagSelectionModal
        visible={!!editingTarget}
        editingTarget={editingTarget}
        tempTags={tempTags}
        tagGroups={tagGroups}
        tagGroupOrder={tagGroupOrder}
        tagGroupColors={tagGroupColors}
        tagGroupConfigs={tagGroupConfigs}
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
        onSave={saveTags}
      />
    </View>
  );
}
