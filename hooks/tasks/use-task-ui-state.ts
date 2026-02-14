import { useState } from 'react';
import { Platform } from 'react-native';

/**
 * Hook for managing UI state (modals, date pickers, expanded states, hover states)
 */
export function useTaskUIState() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [statusPickerVisible, setStatusPickerVisible] = useState<string | null>(
    null
  );
  const [statusPickerTaskId, setStatusPickerTaskId] = useState<string | null>(
    null
  );
  const [datePickers, setDatePickers] = useState<{ [taskId: string]: boolean }>(
    {}
  );
  const [hoveredField, setHoveredField] = useState<{
    taskId: string;
    field: 'title' | 'description';
  } | null>(null);
  const [hoveredSubtaskField, setHoveredSubtaskField] = useState<{
    subtaskId: string;
    field: 'title' | 'description';
  } | null>(null);
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredSubtaskId, setHoveredSubtaskId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const openStatusPicker = (taskId: string) => {
    setStatusPickerTaskId(taskId);
    setStatusPickerVisible(taskId);
  };

  const closeStatusPicker = () => {
    setStatusPickerVisible(null);
    setStatusPickerTaskId(null);
  };

  const openDatePicker = (taskId: string) => {
    setDatePickers((prev) => ({ ...prev, [taskId]: true }));
  };

  const closeDatePicker = (taskId: string) => {
    setDatePickers((prev) => ({ ...prev, [taskId]: false }));
  };

  const handleDateChange = (
    taskId: string,
    event: any,
    selectedDate: Date | undefined,
    onDateUpdate: (taskId: string, date: Date) => void
  ) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        onDateUpdate(taskId, selectedDate);
      }
      closeDatePicker(taskId);
    } else {
      if (selectedDate) {
        onDateUpdate(taskId, selectedDate);
      }
    }
  };

  const handleDatePickerDone = (taskId: string) => {
    closeDatePicker(taskId);
  };

  const handleDatePickerCancel = (taskId: string) => {
    closeDatePicker(taskId);
  };

  return {
    // State
    expandedIds,
    statusPickerVisible,
    statusPickerTaskId,
    datePickers,
    hoveredField,
    hoveredSubtaskField,
    hoveredTaskId,
    hoveredSubtaskId,
    // Actions
    toggleExpand,
    openStatusPicker,
    closeStatusPicker,
    openDatePicker,
    closeDatePicker,
    handleDateChange,
    handleDatePickerDone,
    handleDatePickerCancel,
    setHoveredField,
    setHoveredSubtaskField,
    setHoveredTaskId,
    setHoveredSubtaskId,
  };
}
