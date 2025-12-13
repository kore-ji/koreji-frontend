import { View, Text, TouchableOpacity, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { EditableField } from './editable-field';
import { StatusBadge } from './status-badge';
import { SubtaskItem } from './subtask-item';
import { TagDisplayRow } from '@/components/ui/tag-display-row';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { type TaskItemWithSubtasks, type TaskItem } from '@/types/tasks';
import { type TaskStatus } from '@/types/task-status';
import { formatDate } from '@/utils/formatting/date';
import { buildTaskTagsFromTask } from '@/utils/tasks/task-tags';

interface TaskItemProps {
  item: TaskItemWithSubtasks;
  isExpanded: boolean;
  isHovered: boolean;
  isTitleHovered: boolean;
  isDescHovered: boolean;
  hoveredSubtaskId: string | null;
  hoveredSubtaskField: { subtaskId: string; field: 'title' | 'description' } | null;
  mouseHandlers: {
    container: (taskId: string | null, isSubtask: boolean) => any;
    editableField: (taskId: string, field: 'title' | 'description', isSubtask: boolean) => any;
    clearHover: (taskId: string, isSubtask: boolean) => any;
  };
  onStatusPress: () => void;
  onToggleExpand: () => void;
  onUpdateField: (id: string, field: keyof TaskItem, value: any) => void;
  onTagEdit: () => void;
  onDeadlinePress: () => void;
  onSubtaskStatusPress: (subtaskId: string) => void;
  onSubtaskUpdateField: (id: string, field: keyof TaskItem, value: any) => void;
  onSubtaskTagEdit: (subtaskId: string) => void;
  onSubtaskDeadlinePress: (subtaskId: string) => void;
  tagGroupColors: { [groupName: string]: { bg: string; text: string } };
  isStatusComplete: (status: TaskStatus) => boolean;
  progressPercent: number;
  shouldShowProgress: boolean;
  layout: {
    taskTitleSize: number;
    taskDescSize: number;
  };
  styles: any;
}

export function TaskItemComponent({
  item,
  isExpanded,
  isHovered,
  isTitleHovered,
  isDescHovered,
  hoveredSubtaskId,
  hoveredSubtaskField,
  mouseHandlers,
  onStatusPress,
  onToggleExpand,
  onUpdateField,
  onTagEdit,
  onDeadlinePress,
  onSubtaskStatusPress,
  onSubtaskUpdateField,
  onSubtaskTagEdit,
  onSubtaskDeadlinePress,
  tagGroupColors,
  isStatusComplete,
  progressPercent,
  shouldShowProgress,
  layout,
  styles,
}: TaskItemProps) {
  const router = useRouter();
  const hasSubtasks = item.subtasks.length > 0;

  const handleTaskPress = () => {
    router.push(`/add_task?taskId=${item.id}`);
  };

  return (
    <Pressable
      onPress={handleTaskPress}
      style={[
        styles.card,
        isHovered && Platform.OS === 'web' && styles.cardHovered,
      ]}
      {...mouseHandlers.container(item.id, false)}
    >
      <View style={styles.taskHeader}>
        <View style={styles.headerTop}>
          <StatusBadge
            status={item.status}
            onPress={onStatusPress}
            mouseHandlers={mouseHandlers.clearHover(item.id, false)}
          />

          <View
            style={styles.titleContainer}
            {...mouseHandlers.editableField(item.id, 'title', false)}
          >
            <EditableField
              value={item.title}
              textStyle={[
                styles.taskTitle,
                { fontSize: layout.taskTitleSize },
                isTitleHovered && Platform.OS === 'web' && styles.editableFieldHovered,
              ]}
              onSave={(val) => onUpdateField(item.id, 'title', val)}
            />
          </View>

          {hasSubtasks && (
            <TouchableOpacity onPress={onToggleExpand} style={styles.expandButton}>
              <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <View
          {...mouseHandlers.editableField(item.id, 'description', false)}
        >
          <EditableField
            value={item.description}
            placeholder={TASK_SCREEN_STRINGS.tasksList.addDescriptionPlaceholder}
            textStyle={[
              styles.taskDesc,
              { fontSize: layout.taskDescSize },
              isDescHovered && Platform.OS === 'web' && styles.editableFieldHovered,
            ]}
            onSave={(val) => onUpdateField(item.id, 'description', val)}
          />
        </View>

        <View
          style={styles.tagsContainer}
          {...mouseHandlers.clearHover(item.id, false)}
        >
          <Text style={styles.tagsLabel}>{TASK_SCREEN_STRINGS.addTask.tagsLabel}</Text>
          <View style={styles.tagsRow}>
            <TagDisplayRow
              tags={buildTaskTagsFromTask(item)}
              onEdit={onTagEdit}
              tagGroupColors={tagGroupColors}
            />
          </View>
        </View>

        {!hasSubtasks && (
          <View style={styles.singleTimeDeadlineRow}>
            <TouchableOpacity
              style={styles.deadlineDisplay}
              onPress={onDeadlinePress}
              {...mouseHandlers.clearHover(item.id, false)}
            >
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.deadlineText}>
                {item.deadline ? formatDate(item.deadline) : 'Set deadline'}
              </Text>
            </TouchableOpacity>
            <View style={styles.singleTimeRow}>
              <Text style={styles.clockIcon}>⏱</Text>
              <EditableField
                value={item.estimatedTime.toString()}
                isNumeric
                textStyle={styles.tagTime}
                containerStyle={styles.timeTagContainer}
                onSave={(val) => onUpdateField(item.id, 'estimatedTime', parseInt(val) || 0)}
              />
              <Text style={styles.tagUnit}>{TASK_SCREEN_STRINGS.tasksList.timeUnit}</Text>
            </View>
          </View>
        )}

        {shouldShowProgress && (
          <View style={styles.progressRow}>
            <TouchableOpacity
              style={styles.deadlineDisplay}
              onPress={onDeadlinePress}
              {...mouseHandlers.clearHover(item.id, false)}
            >
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.deadlineText}>
                {item.deadline ? formatDate(item.deadline) : 'Set deadline'}
              </Text>
            </TouchableOpacity>
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progressPercent)}{TASK_SCREEN_STRINGS.tasksList.progressUnit}
              </Text>
            </View>
            <View style={styles.totalTimeBadge}>
              <Text style={styles.totalTimeText}>
                {TASK_SCREEN_STRINGS.tasksList.totalTimePrefix} {item.displayTime} {TASK_SCREEN_STRINGS.tasksList.totalTimeSuffix}
              </Text>
            </View>
          </View>
        )}
      </View>

      {isExpanded && hasSubtasks && (
        <View style={styles.subtaskList}>
          {item.subtasks.map((sub) => {
            const isSubtaskTitleHovered = hoveredSubtaskField?.subtaskId === sub.id && hoveredSubtaskField?.field === 'title';
            const isSubtaskDescHovered = hoveredSubtaskField?.subtaskId === sub.id && hoveredSubtaskField?.field === 'description';
            const isSubtaskHovered = hoveredSubtaskId === sub.id;

            return (
              <SubtaskItem
                key={sub.id}
                subtask={sub}
                isHovered={isSubtaskHovered}
                isTitleHovered={isSubtaskTitleHovered}
                isDescHovered={isSubtaskDescHovered}
                mouseHandlers={mouseHandlers}
                onStatusPress={() => onSubtaskStatusPress(sub.id)}
                onUpdateField={onSubtaskUpdateField}
                onTagEdit={() => onSubtaskTagEdit(sub.id)}
                onDeadlinePress={() => onSubtaskDeadlinePress(sub.id)}
                tagGroupColors={tagGroupColors}
                isStatusComplete={isStatusComplete}
                styles={styles}
              />
            );
          })}
        </View>
      )}
    </Pressable>
  );
}
