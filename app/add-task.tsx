import { useMemo, useEffect, useState } from 'react';
import { View, ScrollView, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { type TaskStatus } from '@/types/task-status';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
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
import {
  calculateTotalTime,
  isTimeReadOnly,
} from '@/utils/add-task/time-calculation';
import { addTaskStyles } from '@/styles/add-task.styles';
import { useGenerateSubtasks } from '@/hooks/tasks/use-generate-subtasks';
import type { LocalSubTask } from '@/types/add-task';
import { buildMainTaskPayload } from '@/utils/add-task/task-payload';
import { post } from '@/services/api/client';
import { SubtasksLoadingOverlay } from '@/components/add-task/subtasks-loading-overlay';
import { formatDate } from '@/utils/formatting/date';

export default function AddTaskScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ task_id?: string }>();
  const [effectiveTaskId, setEffectiveTaskId] = useState<string | undefined>(
    typeof params.task_id === 'string' && params.task_id
      ? params.task_id
      : undefined
  );
  const isEditMode = !!effectiveTaskId;

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
  } = useAddTaskTags(mainTags, subtasks);

  // Load task data in edit mode
  const { isLoading } = useAddTaskData(
    isEditMode,
    effectiveTaskId,
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
    effectiveTaskId,
    mainTitle,
    mainDesc,
    mainTime,
    mainDeadline,
    mainStatus,
    mainTags,
    subtasks
  );

  // AI Generate subtasks hook
  const {
    generateSubtasks,
    loading: isAIGenerating,
    error: aiError,
  } = useGenerateSubtasks();

  // Task submit handler (tag groups/tags are already saved when modal Confirm is clicked)
  const handleSubmit = async () => {
    try {
      console.log('[add-task.tsx] ========== handleSubmit called ==========');
      console.log(
        '[add-task.tsx] Submit button clicked, starting task submission'
      );
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

      console.log(
        '[add-task.tsx] ========== handleSubmit completed =========='
      );
    } catch (error) {
      console.error(
        '[add-task.tsx] ========== ERROR in handleSubmit =========='
      );
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
      title: isEditMode
        ? 'Edit Task'
        : TASK_SCREEN_STRINGS.addTask.sectionTitle,
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
        console.log(
          '[DEBUG] Android - Setting deadline to:',
          selectedDate.toISOString()
        );
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
        console.log(
          '[DEBUG] iOS - Updating deadline to:',
          selectedDate.toISOString()
        );
        setMainDeadline(selectedDate);
      } else {
        console.log('[DEBUG] iOS - No selectedDate provided');
      }
    }
  };

  const handleDatePickerDone = () => {
    console.log(
      '[DEBUG] handleDatePickerDone called. Current deadline:',
      mainDeadline?.toISOString()
    );
    setShowDatePicker(false);
  };

  const handleDatePickerCancel = () => {
    console.log(
      '[DEBUG] handleDatePickerCancel called. Deadline will remain:',
      mainDeadline?.toISOString()
    );
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

  /**
   * Ensure there is a backend task ID we can use for AI generation.
   * If we're still in "create" mode (no task_id yet), create a minimal
   * task first to obtain a UUID, then switch this screen into edit mode.
   */
  const ensureTaskIdForAI = async (): Promise<string | null> => {
    if (effectiveTaskId) {
      return effectiveTaskId;
    }

    try {
      const calculatedTotalTimeValue = calculateTotalTime(subtasks, mainTime);
      const mainTaskPayload = buildMainTaskPayload(
        mainTitle,
        mainDesc,
        mainDeadline,
        mainStatus,
        String(calculatedTotalTimeValue),
        mainTags
      );

      console.log(
        '[AI Generate] Creating temporary task for AI subtasks:',
        mainTaskPayload
      );

      // Use the same API client as normal creation (respects EXPO_PUBLIC_API_BASE_URL)
      const data = await post<{ id: string; [key: string]: unknown }>(
        '/api/tasks/',
        mainTaskPayload
      );
      if (!data || typeof data.id !== 'string') {
        throw new Error('Backend did not return an id for created task');
      }

      setEffectiveTaskId(data.id);
      console.log('[AI Generate] Temporary task created with id:', data.id);
      return data.id;
    } catch (error) {
      console.error(
        '[AI Generate] Error while creating temporary task for AI:',
        error
      );
      Alert.alert(
        TASK_SCREEN_STRINGS.addTask.alerts.errorTitle,
        'Failed to create task for AI generation. Please try again.'
      );
      return null;
    }
  };

  // AI Generate Logic (connected to backend)
  const handleAIGenerate = async () => {
    if (isAIGenerating) {
      return;
    }

    if (!mainTitle.trim()) {
      Alert.alert(
        TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateTitle,
        TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateMessage
      );
      return;
    }

    // Ensure we have a backend task ID (create a temporary one if needed)
    const taskId = await ensureTaskIdForAI();
    if (!taskId) {
      return;
    }

    try {
      console.log(
        '[AI Generate] Requesting AI-generated subtasks for task:',
        taskId
      );
      const generated = await generateSubtasks(taskId);

      if (!generated || generated.length === 0) {
        const message =
          aiError ??
          'No subtasks were generated. Please try again after adjusting your task details.';
        Alert.alert(
          TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateAlertTitle,
          message
        );
        return;
      }

      // Only keep direct subtasks of this task
      const directChildren = generated.filter(
        (item) => item.parentId === taskId
      );

      const mappedSubtasks: LocalSubTask[] = directChildren.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description || '',
        estimatedTime: String(item.estimatedTime ?? 0),
        deadline: item.deadline ?? null,
        status: item.status as TaskStatus,
        // Map TaskItem.tags (Record<groupName, string[]>) into TaskTags
        // so subtasks immediately show their generated tags.
        tags: {
          tagGroups: item.tags ?? {},
        },
      }));

      setSubtasks(mappedSubtasks);
      console.log(
        '[AI Generate] Subtasks updated from AI-generated results:',
        mappedSubtasks
      );
    } catch (error) {
      console.error('[AI Generate] Failed to generate subtasks:', error);
      const message =
        aiError ?? TASK_SCREEN_STRINGS.addTask.alerts.aiGeneratePlaceholder;
      Alert.alert(
        TASK_SCREEN_STRINGS.addTask.alerts.aiGenerateAlertTitle,
        message
      );
    }
  };

  // Tag save handler wrapper
  const saveTags = async () => {
    console.log('[add-task.tsx] saveTags called from modal Confirm button');
    await saveTagsBase(
      (tags) => setMainTags(tags),
      (subtaskId, tags) => {
        setSubtasks((prev) =>
          prev.map((s) => (s.id === subtaskId ? { ...s, tags } : s))
        );
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
          taskTitlePlaceholder={
            TASK_SCREEN_STRINGS.addTask.taskTitlePlaceholder
          }
          descriptionPlaceholder={
            TASK_SCREEN_STRINGS.addTask.descriptionPlaceholder
          }
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
            console.log(
              '[DEBUG] Deadline button pressed. Current deadline:',
              mainDeadline?.toISOString()
            );
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
          aiLoading={isAIGenerating}
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
              deadlinePlaceholder={
                TASK_SCREEN_STRINGS.addTask.deadlinePlaceholder
              }
              subtaskTitlePlaceholder={TASK_SCREEN_STRINGS.addTask.getSubtaskTitlePlaceholder(
                index + 1
              )}
              subtaskDescriptionPlaceholder={
                TASK_SCREEN_STRINGS.addTask.subtaskDescriptionPlaceholder
              }
              subtaskTagsLabel={TASK_SCREEN_STRINGS.addTask.subtaskTagsLabel}
              statusLabel={TASK_SCREEN_STRINGS.addTask.statusLabel}
              statusPlaceholder={TASK_SCREEN_STRINGS.addTask.statusPlaceholder}
              onUpdate={updateSubtask}
              onRemove={removeSubtask}
              onDeadlinePress={(id) => {
                console.log(
                  '[DEBUG] Subtask deadline button pressed. Current deadline:',
                  sub.deadline?.toISOString()
                );
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
            onDateChange={(event, date) =>
              handleSubtaskDateChange(subtaskId, event, date)
            }
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
        newTagGroupPlaceholder={
          TASK_SCREEN_STRINGS.addTask.newTagGroupPlaceholder
        }
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

      {/* Global AI subtasks loading overlay (center of screen) */}
      <SubtasksLoadingOverlay
        visible={isAIGenerating}
        message={TASK_SCREEN_STRINGS.addTask.aiGenerateLoadingMessage}
      />
    </View>
  );
}
