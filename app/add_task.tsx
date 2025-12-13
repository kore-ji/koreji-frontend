import { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { TAG_GROUPS, DEFAULT_TAG_GROUP_ORDER, TAG_GROUP_COLORS, DEFAULT_CATEGORIES } from '@/constants/task-tags';
import { DEFAULT_TASK_STATUS } from '@/constants/task-status';
import { type LocalSubTask } from '@/types/add-task';
import { type TaskStatus } from '@/types/task-status';
import { formatDate } from '@/utils/formatting/date';
import { mapStatusToBackend } from '@/utils/mapping/status';
import { post, ApiClientError } from '@/services/api/client';
import { MainTaskCard } from '@/components/add-task/main-task-card';
import { SubtaskCard } from '@/components/add-task/subtask-card';
import { SubtaskHeader } from '@/components/add-task/subtask-header';
import { AddTaskFooter } from '@/components/add-task/add-task-footer';
import { DatePickerModal } from '@/components/add-task/date-picker-modal';
import { TagSelectionModal } from '@/components/add-task/tag-selection-modal';


export default function AddTaskScreen() {
  const router = useRouter();

  // Main Task State
  const [mainTitle, setMainTitle] = useState('');
  const [mainDesc, setMainDesc] = useState('');
  const [mainTime, setMainTime] = useState('');
  const [mainDeadline, setMainDeadline] = useState<Date | null>(null);
  const [mainStatus, setMainStatus] = useState<TaskStatus>(DEFAULT_TASK_STATUS);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mainTags, setMainTags] = useState<TaskTags>({
    tagGroups: {
      Category: [DEFAULT_CATEGORIES[0]],
    },
  });

  // Subtask List
  const [subtasks, setSubtasks] = useState<LocalSubTask[]>([]);

  // Tag Modal State
  const [editingTarget, setEditingTarget] = useState<'main' | string | null>(null);
  const [tempTags, setTempTags] = useState<TaskTags>({ tagGroups: {} });
  // Tag groups structure: { [groupName: string]: string[] } - each group has its available tags
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

  // Time Calculation Logic
  const calculatedTotalTime = useMemo(() => {
    if (subtasks.length === 0) return mainTime;
    const sum = subtasks.reduce((acc, curr) => acc + (parseInt(curr.estimatedTime) || 0), 0);
    return sum.toString();
  }, [subtasks, mainTime]);

  const isTimeReadOnly = subtasks.length > 0;

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

  const handleSubtaskDateChange = (subtaskId: string, event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        updateSubtask(subtaskId, 'deadline', selectedDate);
      }
      setSubtaskDatePickers((prev) => ({ ...prev, [subtaskId]: false }));
    } else {
      if (selectedDate) {
        updateSubtask(subtaskId, 'deadline', selectedDate);
      }
    }
  };

  const handleSubtaskDatePickerDone = (subtaskId: string) => {
    setSubtaskDatePickers((prev) => ({ ...prev, [subtaskId]: false }));
  };

  const handleSubtaskDatePickerCancel = (subtaskId: string) => {
    setSubtaskDatePickers((prev) => ({ ...prev, [subtaskId]: false }));
  };

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

  // Tag Logic
  const openTagModal = (target: 'main' | string) => {
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

  const saveTags = () => {
    if (editingTarget === 'main') {
      setMainTags(tempTags);
    } else if (typeof editingTarget === 'string') {
      // Ensure Category is removed from subtask tags
      const { Category, ...tagsWithoutCategory } = tempTags.tagGroups || {};
      setSubtasks((prev) =>
        prev.map((s) => (s.id === editingTarget ? { ...s, tags: { tagGroups: tagsWithoutCategory } } : s))
      );
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
      // Create a new tag group category with empty tags array
      setTagGroups((prev) => ({
        ...prev,
        [trimmedTagGroup]: [],
      }));
      // Add to order array (at the end to maintain creation order)
      setTagGroupOrder((prev) => [...prev, trimmedTagGroup]);

      // Automatically assign a color (rotate through available colors)
      const existingGroupNames = Object.keys(tagGroupColors);
      const usedColorIndices = existingGroupNames
        .map((name) =>
          TAG_GROUP_COLORS.findIndex(
            (c) => c.bg === tagGroupColors[name].bg && c.text === tagGroupColors[name].text
          )
        )
        .filter((idx) => idx !== -1);

      // Find first unused color, or cycle through if all are used
      let colorIndex = 0;
      for (let i = 0; i < TAG_GROUP_COLORS.length; i++) {
        if (!usedColorIndices.includes(i)) {
          colorIndex = i;
          break;
        }
      }
      // If all colors are used, cycle through starting from 0
      const selectedColor = TAG_GROUP_COLORS[colorIndex % TAG_GROUP_COLORS.length];

      // Store the automatically selected color for this tag group
      setTagGroupColors((prev) => ({
        ...prev,
        [trimmedTagGroup]: selectedColor,
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
    const groupConfig = TAG_GROUPS[groupName] || { isSingleSelect: false, allowAddTags: true };

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

      // If adding to Category group and it's currently selected in tempTags, auto-select it
      if (editingTagInGroup.groupName === 'Category') {
        const currentTagGroups = tempTags.tagGroups || {};
        const groupConfig = TAG_GROUPS['Category'] || { isSingleSelect: true };
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

  // Subtask Date Pickers
  const [subtaskDatePickers, setSubtaskDatePickers] = useState<{ [id: string]: boolean }>({});

  const addSubtask = () => {
    const newSub: LocalSubTask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      estimatedTime: '',
      deadline: null,
      status: DEFAULT_TASK_STATUS,
      tags: { tagGroups: {} },
    };
    setSubtasks([...subtasks, newSub]);
  };

  const updateSubtask = (id: string, field: keyof LocalSubTask, value: string | Date | null | TaskStatus) => {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  // Submit Data
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!mainTitle.trim()) {
      Alert.alert(TASK_SCREEN_STRINGS.addTask.alerts.errorTitle, TASK_SCREEN_STRINGS.addTask.alerts.errorMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract category from tags (Category tag group, first selected tag)
      const categoryFromTags = mainTags.tagGroups?.Category?.[0] || null;

      // Create main task payload
      const mainTaskPayload = {
        title: mainTitle.trim(),
        description: mainDesc.trim() || null,
        category: categoryFromTags || null,
        due_date: mainDeadline ? formatDate(mainDeadline) : null,
        status: mapStatusToBackend(mainStatus),
        estimated_minutes: parseInt(calculatedTotalTime) || null,
        priority: null, // TODO: map from tags if needed
      };

      // Create main task
      const mainTaskResponse = await post<{ id: string; [key: string]: unknown }>('/tasks/', mainTaskPayload);
      const mainTaskId = mainTaskResponse.id;

      // Create subtasks if any
      if (subtasks.length > 0) {
        const subtaskPromises = subtasks.map(async (sub) => {
          const subtaskPayload = {
            task_id: mainTaskId,
            title: sub.title.trim() || TASK_SCREEN_STRINGS.addTask.defaultUntitledSubtask,
            description: sub.description.trim() || null,
            due_date: sub.deadline ? formatDate(sub.deadline) : null,
            status: mapStatusToBackend(sub.status),
            estimated_minutes: parseInt(sub.estimatedTime) || null,
            priority: null, // TODO: map from tags if needed
          };
          return post('/tasks/subtasks', subtaskPayload);
        });

        await Promise.all(subtaskPromises);
      }

      // Success - navigate back
      router.back();
    } catch (error) {
      console.error('[Create Task] API error:', error);
      let errorMessage = TASK_SCREEN_STRINGS.addTask.alerts.errorMessage;
      if (error instanceof ApiClientError) {
        errorMessage = error.message || errorMessage;
      }
      Alert.alert(TASK_SCREEN_STRINGS.addTask.alerts.errorTitle, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Task Card */}
        <MainTaskCard
          title={mainTitle}
          description={mainDesc}
          time={mainTime}
          deadline={mainDeadline}
          status={mainStatus}
          tags={mainTags}
          isTimeReadOnly={isTimeReadOnly}
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
        <View style={styles.subtaskList}>
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
                setSubtaskDatePickers((prev) => ({ ...prev, [id]: true }));
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
        submitButtonText={isSubmitting ? 'Creating...' : TASK_SCREEN_STRINGS.addTask.createTaskButton}
        disabled={isSubmitting}
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
        editingTagInGroup={editingTagInGroup}
        newTagInGroupName={newTagInGroupName}
        showTagGroupInput={showTagGroupInput}
        newTagGroupName={newTagGroupName}
        selectTagsTitle={TASK_SCREEN_STRINGS.addTask.selectTagsTitle}
        newTagPlaceholder={TASK_SCREEN_STRINGS.addTask.newTagPlaceholder}
        newTagGroupPlaceholder={TASK_SCREEN_STRINGS.addTask.newTagGroupPlaceholder}
        confirmButtonText={TASK_SCREEN_STRINGS.addTask.confirmButton}
        onClose={() => setEditingTarget(null)}
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
        onSave={saveTags}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  subtaskList: {
    gap: 16,
  },
});
