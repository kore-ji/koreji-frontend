import { StyleSheet, FlatList } from 'react-native';
import { TaskItem } from './TaskItem';
import { TaskItem as TaskItemType } from './types';

interface TasksListProps {
  tasks: TaskItemType[];
  onTaskPress?: (task: TaskItemType) => void;
}

export function TasksList({ tasks, onTaskPress }: TasksListProps) {
  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskItem
          item={item}
          onPress={onTaskPress ? () => onTaskPress(item) : undefined}
        />
      )}
      contentContainerStyle={styles.taskList}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  taskList: {
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
});
