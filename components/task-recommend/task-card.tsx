import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskStatus, TASK_STATUS_COLORS } from '@/constants/task-status';

export interface Task {
  id: string;
  title: string;
  duration: number; // in minutes
  source: string;
  status: TaskStatus;
}

interface TaskCardProps {
  task: Task;
  width?: number;
  isLastInRow?: boolean;
  isRecommended?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
}

// Helper function to get status colors
const getStatusColors = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.NOT_STARTED:
      return TASK_STATUS_COLORS.NOT_STARTED;
    case TaskStatus.IN_PROGRESS:
      return TASK_STATUS_COLORS.IN_PROGRESS;
    case TaskStatus.DONE:
      return TASK_STATUS_COLORS.DONE;
    default:
      return TASK_STATUS_COLORS.NOT_STARTED;
  }
};

export function TaskCard({ task, width, isLastInRow, isRecommended, isSelected, onPress }: TaskCardProps) {
  const statusColors = getStatusColors(task.status);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.taskCard,
        styles.taskCardMasonry,
        isRecommended && styles.taskCardRecommended,
        isSelected && styles.taskCardSelected,
        width && width > 0 ? { width } : undefined,
        isLastInRow && styles.taskCardLastInRow,
      ]}
    >
      {/* Top Row: Duration and Source */}
      <View style={styles.taskCardTopRow}>
        <View style={styles.durationContainer}>
          {isRecommended && (
            <Ionicons name="star" size={16} color="#FFA500" style={styles.recommendIcon} />
          )}
          <Text style={styles.taskDuration}>{task.duration}min</Text>
        </View>
        <Text style={styles.taskSource}>{task.source}</Text>
      </View>

      {/* Middle Row: Task Title */}
      <View style={styles.taskTitleContainer}>
        <Text style={styles.taskTitle}>{task.title}</Text>
      </View>

      {/* Bottom: Status Badge */}
      <View style={styles.taskBadgeContainer}>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.background }]}>
          <Text style={[styles.statusBadgeText, { color: statusColors.text }]}>
            {task.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
  },
  taskCardRecommended: {
    backgroundColor: '#FFF4E6',
  },
  taskCardSelected: {
    borderWidth: 2,
    borderColor: '#2196f3',
    backgroundColor: '#F0F7FF',
  },
  taskCardMasonry: {
    marginBottom: 16,
    marginRight: 16,
  },
  taskCardLastInRow: {
    marginRight: 0,
  },
  taskCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  recommendIcon: {
    marginRight: 2,
  },
  taskDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  taskSource: {
    fontSize: 14,
    color: '#666666',
  },
  taskTitleContainer: {
    marginBottom: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 24,
  },
  taskBadgeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
});



