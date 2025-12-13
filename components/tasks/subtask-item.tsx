import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EditableField } from './editable-field';
import { StatusBadge } from './status-badge';
import { TagDisplayRow } from '@/components/ui/tag-display-row';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { type TaskItem } from '@/types/tasks';
import { type TaskStatus } from '@/types/task-status';
import { formatDate } from '@/utils/formatting/date';
import { buildSubtaskTagsFromTask } from '@/utils/tasks/task-tags';

interface SubtaskItemProps {
  subtask: TaskItem;
  isHovered: boolean;
  isTitleHovered: boolean;
  isDescHovered: boolean;
  mouseHandlers: {
    container: (taskId: string | null, isSubtask: boolean) => any;
    editableField: (taskId: string, field: 'title' | 'description', isSubtask: boolean) => any;
    clearHover: (taskId: string, isSubtask: boolean) => any;
  };
  onStatusPress: () => void;
  onUpdateField: (id: string, field: keyof TaskItem, value: any) => void;
  onTagEdit: () => void;
  onDeadlinePress: () => void;
  tagGroupColors: { [groupName: string]: { bg: string; text: string } };
  isStatusComplete: (status: TaskStatus) => boolean;
  styles: any;
}

export function SubtaskItem({
  subtask,
  isHovered,
  isTitleHovered,
  isDescHovered,
  mouseHandlers,
  onStatusPress,
  onUpdateField,
  onTagEdit,
  onDeadlinePress,
  tagGroupColors,
  isStatusComplete,
  styles,
}: SubtaskItemProps) {
  const subStatusComplete = isStatusComplete(subtask.status);

  return (
    <View
      style={[
        styles.subtaskContainer,
        isHovered && Platform.OS === 'web' && styles.subtaskContainerHovered,
      ]}
      {...mouseHandlers.container(subtask.id, true)}
    >
      <View style={styles.subtaskRow}>
        <View style={styles.subtaskContent}>
          <View style={styles.subtaskHeaderRow}>
            <StatusBadge
              status={subtask.status}
              onPress={onStatusPress}
              mouseHandlers={mouseHandlers.clearHover(subtask.id, true)}
            />

            <View
              style={styles.titleContainer}
              {...mouseHandlers.editableField(subtask.id, 'title', true)}
            >
              <EditableField
                value={subtask.title}
                textStyle={[
                  styles.subtaskText,
                  subStatusComplete && styles.completedText,
                  isTitleHovered && Platform.OS === 'web' && styles.editableFieldHovered,
                ]}
                onSave={(val) => onUpdateField(subtask.id, 'title', val)}
              />
            </View>
          </View>

          <View
            {...mouseHandlers.editableField(subtask.id, 'description', true)}
          >
            <EditableField
              value={subtask.description}
              placeholder={TASK_SCREEN_STRINGS.tasksList.noDescriptionPlaceholder}
              textStyle={[
                styles.subtaskDesc,
                isDescHovered && Platform.OS === 'web' && styles.editableFieldHovered,
              ]}
              onSave={(val) => onUpdateField(subtask.id, 'description', val)}
            />
          </View>

          <View style={styles.subtaskMetaContainer}>
            <View
              style={styles.subtaskTagsContainer}
              {...mouseHandlers.clearHover(subtask.id, true)}
            >
              <Text style={styles.tagsLabel}>{TASK_SCREEN_STRINGS.addTask.subtaskTagsLabel}</Text>
              <View style={styles.tagsRow}>
                <TagDisplayRow
                  tags={buildSubtaskTagsFromTask(subtask)}
                  onEdit={onTagEdit}
                  tagGroupColors={tagGroupColors}
                />
              </View>
            </View>
            <View style={styles.subtaskTimeDeadlineRow}>
              <TouchableOpacity
                style={styles.deadlineDisplay}
                onPress={onDeadlinePress}
                {...mouseHandlers.clearHover(subtask.id, true)}
              >
                <Ionicons name="calendar-outline" size={14} color="#666" />
                <Text style={styles.deadlineText}>
                  {subtask.deadline ? formatDate(subtask.deadline) : 'Set deadline'}
                </Text>
              </TouchableOpacity>
              <View style={styles.subtaskTimeRow}>
                <Text style={styles.clockIcon}>⏱</Text>
                <EditableField
                  value={subtask.estimatedTime.toString()}
                  isNumeric
                  textStyle={styles.tagTime}
                  containerStyle={styles.timeTagContainer}
                  onSave={(val) => onUpdateField(subtask.id, 'estimatedTime', parseInt(val) || 0)}
                />
                <Text style={styles.tagUnit}>{TASK_SCREEN_STRINGS.tasksList.timeUnit}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
