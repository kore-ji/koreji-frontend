import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, SafeAreaView, TextInput, Modal, Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '@/hooks/use-responsive';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { TASK_STATUSES, TASK_STATUS_COLORS } from '@/constants/task-status';
import { STYLE_CONSTANTS } from '@/constants/ui';
import { type TaskStatus } from '@/types/task-status';

const getSubtaskPadding = (responsive: ReturnType<typeof useResponsive>) => {
  if (responsive.isMobile) return STYLE_CONSTANTS.subtaskPadding.mobile;
  if (responsive.isTablet) return STYLE_CONSTANTS.subtaskPadding.tablet;
  return STYLE_CONSTANTS.subtaskPadding.desktop;
};

const isStatusComplete = (status: TaskStatus) => status === 'Done' || status === 'Archive';

// --- Task Item Type ---
interface TaskItem {
  id: string;
  parentId: string | null;
  title: string;
  description: string;
  category?: string;
  estimatedTime: number;
  isCompleted: boolean;
  status: TaskStatus;
  tags: {
    priority?: string;
    attention?: string;
    tools: string[];
    place?: string;
  };
}

// --- Initial dummy data ---
const INITIAL_TASKS: TaskItem[] = [
  
  {
    id: '101', parentId: '1', title: '找文獻', description: '至少五篇', estimatedTime: 60, isCompleted: true,
    status: 'Done',
    tags: { priority: 'High', attention: 'Focus', tools: ['Computer'], place: 'Library' }
  },
  {
    id: '102', parentId: '1', title: '寫緒論', description: '', estimatedTime: 120, isCompleted: false,
    status: 'In progress',
    tags: { priority: 'Medium', attention: 'Focus', tools: ['Computer'], place: 'Dorm' }
  },
  {
    id: '2', parentId: null, title: '整理房間', description: '週末大掃除', category: 'Home', estimatedTime: 45, isCompleted: false,
    status: 'Not started',
    tags: { priority: 'Low', attention: 'Relax', tools: [], place: 'Home' }
  },
  {
    id: '1', parentId: null, title: '完成期末報告', description: '包含文獻回顧', category: 'School', estimatedTime: 0, isCompleted: false,
    status: 'In progress',
    tags: { tools: ['Computer'] }
  },
];

// --- [New Component] Editable text field ---
// Responsible for handling the switch between displayed text and input field
interface EditableFieldProps {
  value: string;
  isNumeric?: boolean;
  textStyle?: any;
  containerStyle?: any;
  placeholder?: string;
  isReadOnly?: boolean;
  onSave: (newValue: string) => void;
}

const EditableField = ({
  value,
  isNumeric,
  textStyle,
  containerStyle,
  placeholder,
  isReadOnly = false,
  onSave
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  // When external data changes, synchronize the internal temporary value
  React.useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleStartEdit = () => {
    if (isReadOnly) return;
    setIsEditing(true);
  };

  const handleSubmit = () => {
    setIsEditing(false);
    // Update only if the value has changed
    if (tempValue !== value) {
      onSave(tempValue);
    }
  };

  if (isEditing) {
    return (
      <View style={[containerStyle, styles.inputWrapper]}>
        <TextInput
          value={tempValue}
          onChangeText={setTempValue}
          onSubmitEditing={handleSubmit} // Trigger save when pressing Enter  
          onBlur={handleSubmit} // Trigger save when losing focus
          autoFocus
          keyboardType={isNumeric ? 'numeric' : 'default'}
          style={[textStyle, { padding: 0, minWidth: 40 }]} // Keep the same style as the original text
          returnKeyType="done"
        />
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={handleStartEdit}
      style={containerStyle}
      activeOpacity={isReadOnly ? 1 : 0.6}
    >
      <Text style={[
        textStyle,
        isReadOnly && { opacity: 0.6 } // When read-only, slightly fade out
      ]}>
        {value || placeholder}
      </Text>
    </TouchableOpacity>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const responsive = useResponsive();

  // 1. Convert data to State, so that it can be modified
  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [statusPickerVisible, setStatusPickerVisible] = useState<string | null>(null);
  const [statusPickerTaskId, setStatusPickerTaskId] = useState<string | null>(null);

  // 2. Function to update task data (simulate DB Update)
  const updateTaskField = (id: string, field: keyof TaskItem, value: any) => {
    setTasks(prevTasks => {
      const targetTask = prevTasks.find(t => t.id === id);
      if (!targetTask) return prevTasks;

      const parentId = targetTask.parentId;
      const parentTask = parentId ? prevTasks.find(t => t.id === parentId) : null;

      // Update the target task first
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
    console.log(`[DB Update] Task ${id}: ${field} = ${value}`);
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

  const renderStatusBadge = (status: TaskStatus, onPress: () => void) => (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.statusBadge, { backgroundColor: TASK_STATUS_COLORS[status].bg }]}>
        <Text style={[styles.statusText, { color: TASK_STATUS_COLORS[status].text }]}>
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const layout = getLayoutSizes(responsive);

  const renderItem = ({ item }: { item: TaskItem & { subtasks: TaskItem[], displayTime: number } }) => {
    const isExpanded = expandedIds.has(item.id);
    const hasSubtasks = item.subtasks.length > 0;

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

    return (
      <View style={styles.card}>
        <View style={[styles.taskHeader, { padding: layout.cardHeaderPadding }]}>

          {/* Top part: category and title */}
          <View style={styles.headerTop}>
            {/* Status Badge */}
            {renderStatusBadge(item.status, () => {
              setStatusPickerTaskId(item.id);
              setStatusPickerVisible(item.id);
            })}

            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category || TASK_SCREEN_STRINGS.tasksList.defaultCategory}</Text>
            </View>

            {/* Title (editable) */}
            <View style={styles.titleContainer}>
              <EditableField
                value={item.title}
                textStyle={[styles.taskTitle, { fontSize: layout.taskTitleSize }]}
                onSave={(val) => updateTaskField(item.id, 'title', val)}
              />
            </View>

            {/* Expand arrow */}
            {hasSubtasks && (
              <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.expandButton}>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Description (editable) */}
          <EditableField
            value={item.description}
            placeholder={TASK_SCREEN_STRINGS.tasksList.addDescriptionPlaceholder}
            textStyle={[styles.taskDesc, { fontSize: layout.taskDescSize }]}
            onSave={(val) => updateTaskField(item.id, 'description', val)}
          />

          {/* Tags */}
          <View style={styles.tagsRow}>
            <TagsDisplay tags={item.tags} />
          </View>

          {/* Show time for single task (after progress bar, same position as when there are subtasks) */}
          {!hasSubtasks && (
            <View style={styles.singleTimeRow}>
              <Text style={styles.clockIcon}>⏱</Text>
              <EditableField
                value={item.estimatedTime.toString()}
                isNumeric
                textStyle={styles.tagTime}
                containerStyle={styles.timeTagContainer}
                onSave={(val) => updateTaskField(item.id, 'estimatedTime', parseInt(val) || 0)}
              />
              <Text style={styles.tagUnit}>{TASK_SCREEN_STRINGS.tasksList.timeUnit}</Text>
            </View>
          )}


          {/* When there are subtasks, show: progress bar + total time (read-only) */}
          {shouldShowProgress && (
            <View style={styles.progressRow}>
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(progressPercent)}{TASK_SCREEN_STRINGS.tasksList.progressUnit}
                </Text>
              </View>

              {/* Show the total time (read-only) */}
              <View style={styles.totalTimeBadge}>
                <Text style={styles.totalTimeText}>
                  {TASK_SCREEN_STRINGS.tasksList.totalTimePrefix} {item.displayTime} {TASK_SCREEN_STRINGS.tasksList.totalTimeSuffix}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Expand subtasks */}
        {isExpanded && hasSubtasks && (
          <View style={styles.subtaskList}>
            {item.subtasks.map((sub) => {
              const { horizontal: subtaskPaddingH, vertical: subtaskPaddingV } = getSubtaskPadding(responsive);
              const subStatusComplete = isStatusComplete(sub.status);
              return (
              <View key={sub.id} style={[styles.subtaskContainer, { paddingHorizontal: subtaskPaddingH, paddingVertical: subtaskPaddingV }]}>
                <View style={styles.subtaskRow}>
                  <View style={styles.subtaskContent}>
                    <View style={styles.subtaskHeaderRow}>
                      {/* Subtask Status (replaces checkbox) */}
                      {renderStatusBadge(sub.status, () => {
                        setStatusPickerTaskId(sub.id);
                        setStatusPickerVisible(sub.id);
                      })}

                      {/* Subtask title (editable) */}
                      <EditableField
                        value={sub.title}
                        textStyle={[styles.subtaskText, subStatusComplete && styles.completedText]}
                        onSave={(val) => updateTaskField(sub.id, 'title', val)}
                      />
                    </View>

                    {/* Subtask title (editable) */}
                    {/* Subtask description (editable) */}
                    <EditableField
                      value={sub.description}
                      placeholder={TASK_SCREEN_STRINGS.tasksList.noDescriptionPlaceholder}
                      textStyle={styles.subtaskDesc}
                      onSave={(val) => updateTaskField(sub.id, 'description', val)}
                    />

                    {/* Subtask Meta */}
                    <View style={styles.subtaskMetaContainer}>
                      <View style={[styles.tagsRow, styles.subtaskTagsRow]}>
                        <TagsDisplay tags={sub.tags} />
                      </View>
                      <View style={[styles.subtaskTimeRow]}>
                        <Text style={styles.clockIcon}>⏱</Text>
                        {/* Subtask time (editable) */}
                        <EditableField
                          value={sub.estimatedTime.toString()}
                          isNumeric
                          textStyle={styles.tagTime}
                          containerStyle={styles.timeTagContainer}
                          onSave={(val) => updateTaskField(sub.id, 'estimatedTime', parseInt(val) || 0)}
                        />
                        <Text style={styles.tagUnit}>{TASK_SCREEN_STRINGS.tasksList.timeUnit}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.header, { padding: layout.screenHeaderPadding }]}>
        <Text style={[styles.headerTitle, { fontSize: layout.headerTitleSize }]}>{TASK_SCREEN_STRINGS.headerTitle}</Text>
      </View>
      <FlatList
        data={structuredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { padding: layout.listPadding }]}
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
        onPress={() => router.push('/add_task')}
      >
        <Ionicons name="add" size={layout.fabIconSize} color="white" />
      </TouchableOpacity>

      {/* Status Picker Modal */}
      <Modal
        visible={statusPickerVisible !== null}
        transparent
        animationType="fade"
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
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={styles.modalContent}>
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
    </SafeAreaView>
  );
}

// Tag Component (keep the same)
const TagsDisplay = ({ tags }: { tags: TaskItem['tags'] }) => (
  <>
    {tags.place && <View style={[styles.miniTag, { backgroundColor: '#E0F2F1' }]}><Text style={[styles.miniTagText, { color: '#00695C' }]}>{tags.place}</Text></View>}
    {tags.priority && <View style={[styles.miniTag, { backgroundColor: '#FFF3E0' }]}><Text style={[styles.miniTagText, { color: '#E65100' }]}>{tags.priority}</Text></View>}
    {tags.attention && <View style={[styles.miniTag, { backgroundColor: '#F3E5F5' }]}><Text style={[styles.miniTagText, { color: '#7B1FA2' }]}>{tags.attention}</Text></View>}
    {tags.tools.slice(0, 2).map(t => <View key={t} style={[styles.miniTag, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.miniTagText, { color: '#1565C0' }]}>{t}</Text></View>)}
  </>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontWeight: 'bold', color: '#333' },
  listContent: { paddingBottom: 80 },
  card: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },

  taskHeader: {},
  headerTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  categoryBadge: { backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 4 },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: '#fff', textTransform: 'uppercase' },
  titleContainer: { flex: 1 },
  expandButton: { padding: 4 },

  // Editable Styles
  inputWrapper: { borderBottomWidth: 1, borderBottomColor: '#2196f3', paddingBottom: 2 },
  taskTitle: { fontWeight: '600', color: '#333', paddingVertical: 2 },
  taskDesc: { color: '#666', marginBottom: 10, minHeight: 20 },

  // Progress & Time
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  progressContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, marginRight: 12 },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 3 },
  progressText: { fontSize: 12, color: '#888', width: 36, textAlign: 'right' },

  totalTimeBadge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  totalTimeText: { fontSize: 12, fontWeight: '600', color: '#555' },

  // Subtasks
  subtaskList: { backgroundColor: '#FAFAFA', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingVertical: 4 },
  subtaskContainer: { borderBottomWidth: 1, borderBottomColor: '#eee' },
  subtaskRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  subtaskContent: { flex: 1, marginLeft: 0 },
  subtaskHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  subtaskText: { fontSize: 15, color: '#333', fontWeight: '500', flex: 1 },
  subtaskDesc: { fontSize: 13, color: '#999', marginTop: 2 },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  subtaskMetaRow: { marginTop: 8 },
  subtaskMetaContainer: { marginTop: 6, gap: 6 },
  subtaskTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },

  // Tags & Time Editing
  tagsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  subtaskTagsRow: { marginTop: 8 },
  timeTagContainer: { borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tagTime: { fontSize: 13, color: '#333', fontWeight: '600', textAlign: 'center', minWidth: 20 },
  tagUnit: { fontSize: 12, color: '#888', marginRight: 4 },
  clockIcon: { fontSize: 12 },
  singleTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  miniTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTagText: { fontSize: 10, fontWeight: '600' },

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
