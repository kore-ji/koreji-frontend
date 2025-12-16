import { View, StyleSheet } from 'react-native';
import { TaskCard, Task } from './task-card';

interface TaskListProps {
  tasks: Task[];
  columns: number;
  cardWidth: number;
  selectedTaskId: string | null;
  onTaskSelect: (taskId: string) => void;
  onTaskLongPress?: (task: Task) => void;
  onTaskInfoPress?: (task: Task) => void;
}

export function TaskList({ tasks, columns, cardWidth, selectedTaskId, onTaskSelect, onTaskLongPress, onTaskInfoPress }: TaskListProps) {
  return (
    <View style={[styles.taskListContainer, styles.taskListContainerMasonry]}>
      {tasks.map((task, index) => {
        // Check if this is the last item in a row
        const isLastInRow = (index + 1) % columns === 0;
        // First task (index 0) is the recommended one
        const isRecommended = index === 0;
        const isSelected = task.id === selectedTaskId;
        return (
          <TaskCard
            key={task.id}
            task={task}
            width={cardWidth}
            isLastInRow={isLastInRow}
            isRecommended={isRecommended}
            isSelected={isSelected}
            onPress={() => onTaskSelect(task.id)}
            onLongPress={onTaskLongPress && task.reason ? () => onTaskLongPress(task) : undefined}
            onInfoPress={onTaskInfoPress && task.reason ? () => onTaskInfoPress(task) : undefined}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  taskListContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  taskListContainerMasonry: {
    // Always use masonry layout
  },
});



