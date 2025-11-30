import { useState, useCallback, useEffect } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import { TaskItem, TASK_ICONS } from './types';
import { TaskPlace, TaskMode, TaskTool } from '@/constants/task-filters';

export function useTasksBottomSheet(tasks: TaskItem[] = []) {
  const [isExpanded, setIsExpanded] = useState(false);
  const translateY = useSharedValue(0);
  const isExpandedShared = useSharedValue(false);

  // Generate placeholder tasks if none provided
  const dummyTasks: TaskItem[] = Array.from({ length: 4 }, (_, index) => {
    // Get all enum values excluding NO_SELECT
    const places = Object.values(TaskPlace).filter(p => p !== TaskPlace.NO_SELECT);
    const modes = Object.values(TaskMode).filter(m => m !== TaskMode.NO_SELECT);
    const allTools = Object.values(TaskTool).filter(t => t !== TaskTool.NO_SELECT);

    // Create tool combinations for each task
    const toolsOptions = allTools.map(tool => [tool]);

    const titles = [
      'Task 1 Placeholder',
      'Task 2 Placeholder',
      'Task 3 Placeholder',
      'Task 4 Placeholder',
    ];

    const workingTimes = [30, 45, 60, 90];

    return {
      id: `task-${index}`,
      icon: TASK_ICONS[index % TASK_ICONS.length],
      title: titles[index % titles.length],
      place: places[index % places.length],
      mode: modes[index % modes.length],
      tools: toolsOptions[index % toolsOptions.length],
      workingTime: workingTimes[index % workingTimes.length],
    };
  });

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
    displayTasks: tasks.length > 0 ? tasks : dummyTasks,
    toggleExpanded,
    expandSheet,
    collapseSheet,
  };
}

