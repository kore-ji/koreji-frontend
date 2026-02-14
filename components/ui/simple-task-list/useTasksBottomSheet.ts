import { useState, useCallback, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { TaskItem } from './types';

export function useTasksBottomSheet(tasks: TaskItem[] = []) {
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useSharedValue(0);
  const isExpandedShared = useSharedValue(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => {
      const newValue = !prev;
      isExpandedShared.value = newValue;
      return newValue;
    });
  }, [isExpandedShared]);

  const expandSheet = useCallback(() => {
    setIsExpanded(true);
    isExpandedShared.value = true;
  }, [isExpandedShared]);

  const collapseSheet = useCallback(() => {
    setIsExpanded(false);
    isExpandedShared.value = false;
  }, [isExpandedShared]);

  // Sync shared value with state
  useEffect(() => {
    isExpandedShared.value = isExpanded;
  }, [isExpanded, isExpandedShared]);

  return {
    isExpanded,
    isExpandedShared,
    translateY,
    displayTasks: tasks,
    toggleExpanded,
    expandSheet,
    collapseSheet,
  };
}

