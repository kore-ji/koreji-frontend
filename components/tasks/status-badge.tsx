import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from 'react-native';
import { TASK_STATUS_COLORS } from '@/constants/task-status';
import { type TaskStatus } from '@/types/task-status';

interface StatusBadgeProps {
  status: TaskStatus;
  onPress: () => void;
  mouseHandlers?: {
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  };
}

export function StatusBadge({
  status,
  onPress,
  mouseHandlers,
}: StatusBadgeProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      {...(Platform.OS === 'web' && mouseHandlers ? mouseHandlers : {})}
    >
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: TASK_STATUS_COLORS[status].bg },
        ]}
      >
        <Text
          style={[
            styles.statusText,
            { color: TASK_STATUS_COLORS[status].text },
          ]}
        >
          {status}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
