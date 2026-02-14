import { View, Text, TouchableOpacity } from 'react-native';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { tasksStyles } from '@/styles/tasks.styles';

interface TasksEmptyStateProps {
  onAddTask: () => void;
}

export function TasksEmptyState({ onAddTask }: TasksEmptyStateProps) {
  return (
    <View style={tasksStyles.emptyStateContainer}>
      <View style={tasksStyles.emptyStateCard}>
        <Text style={tasksStyles.emptyStateTitle}>
          {TASK_SCREEN_STRINGS.tasksList.emptyStateTitle}
        </Text>
        <Text style={tasksStyles.emptyStateSubtitle}>
          {TASK_SCREEN_STRINGS.tasksList.emptyStateSubtitle}
        </Text>
        <TouchableOpacity
          style={tasksStyles.emptyStateButton}
          onPress={onAddTask}
        >
          <Text style={tasksStyles.emptyStateButtonText}>
            {TASK_SCREEN_STRINGS.tasksList.emptyStateAction}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
