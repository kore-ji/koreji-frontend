import { useState } from 'react';
import { Platform } from 'react-native';
import { type LocalSubTask } from '@/types/add-task';
import { type TaskStatus } from '@/types/task-status';
import { DEFAULT_TASK_STATUS } from '@/constants/task-status';

/**
 * Hook for managing subtasks list and date pickers
 */
export function useSubtasks() {
  const [subtasks, setSubtasks] = useState<LocalSubTask[]>([]);
  const [subtaskDatePickers, setSubtaskDatePickers] = useState<{
    [id: string]: boolean;
  }>({});

  const addSubtask = () => {
    const newSub: LocalSubTask = {
      id: Date.now().toString(),
      title: '',
      description: '',
      estimatedTime: '',
      deadline: null,
      status: DEFAULT_TASK_STATUS,
      tags: { tagGroups: {} },
    };
    setSubtasks((prev) => [...prev, newSub]);
  };

  const updateSubtask = (
    id: string,
    field: keyof LocalSubTask,
    value: string | Date | null | TaskStatus
  ) => {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const removeSubtask = (id: string) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const openSubtaskDatePicker = (subtaskId: string) => {
    setSubtaskDatePickers((prev) => ({ ...prev, [subtaskId]: true }));
  };

  const closeSubtaskDatePicker = (subtaskId: string) => {
    setSubtaskDatePickers((prev) => ({ ...prev, [subtaskId]: false }));
  };

  const handleSubtaskDateChange = (
    subtaskId: string,
    event: any,
    selectedDate?: Date
  ) => {
    if (Platform.OS === 'android') {
      if (event.type === 'set' && selectedDate) {
        updateSubtask(subtaskId, 'deadline', selectedDate);
      }
      closeSubtaskDatePicker(subtaskId);
    } else {
      if (selectedDate) {
        updateSubtask(subtaskId, 'deadline', selectedDate);
      }
    }
  };

  const handleSubtaskDatePickerDone = (subtaskId: string) => {
    closeSubtaskDatePicker(subtaskId);
  };

  const handleSubtaskDatePickerCancel = (subtaskId: string) => {
    closeSubtaskDatePicker(subtaskId);
  };

  return {
    subtasks,
    subtaskDatePickers,
    setSubtasks,
    addSubtask,
    updateSubtask,
    removeSubtask,
    openSubtaskDatePicker,
    handleSubtaskDateChange,
    handleSubtaskDatePickerDone,
    handleSubtaskDatePickerCancel,
  };
}
