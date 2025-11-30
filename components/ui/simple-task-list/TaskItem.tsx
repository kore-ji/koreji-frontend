import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItem as TaskItemType } from './types';
import { getIconName } from './utils';
import { TaskPlace as TaskPlaceEnum, TaskMode as TaskModeEnum, TaskTool as TaskToolEnum } from '@/constants/task-filters';

interface TaskItemProps {
  item: TaskItemType;
  onPress?: () => void;
}

function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

function TaskTag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
}

export function TaskItem({ item, onPress }: TaskItemProps) {
  const tags: string[] = [];

  if (item.place && item.place !== TaskPlaceEnum.NO_SELECT) {
    tags.push(item.place);
  }
  if (item.mode && item.mode !== TaskModeEnum.NO_SELECT) {
    tags.push(item.mode);
  }
  if (item.tools && item.tools.length > 0) {
    const validTools = item.tools.filter(tool => tool !== TaskToolEnum.NO_SELECT);
    if (validTools.length > 0) {
      tags.push(...validTools.slice(0, 2)); // Limit to 2 tools for display
    }
  }

  return (
    <View style={styles.taskItem}>
      <View style={styles.taskIconContainer}>
        <Ionicons name={getIconName(item.icon)} size={24} color="#333333" />
      </View>
      <View style={styles.taskContent}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <TaskTag key={index} label={tag} />
            ))}
          </View>
        )}
      </View>
      <View style={styles.rightSection}>
        {item.workingTime !== undefined && (
          <Text style={styles.workingTime}>
            {formatTime(item.workingTime)}
          </Text>
        )}
        <Pressable style={styles.actionButton} onPress={onPress}>
          <Ionicons name="play" size={20} color="#2196f3" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 16,
  },
  taskIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#666666',
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 80,
  },
  workingTime: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    textAlign: 'right',
    alignSelf: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

