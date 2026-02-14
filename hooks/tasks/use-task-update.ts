import React from 'react';
import { patch, ApiClientError } from '@/services/api/client';
import { type TaskItem } from '@/types/tasks';
import { type TaskStatus } from '@/types/task-status';
import { mapStatusToBackend } from '@/utils/mapping/status';
import { formatDate } from '@/utils/formatting/date';

/**
 * Hook for updating task fields with backend sync
 */
export function useTaskUpdate(
  tasks: TaskItem[],
  setTasks: React.Dispatch<React.SetStateAction<TaskItem[]>>
) {
  const updateTaskField = async (
    id: string,
    field: keyof TaskItem,
    value: any
  ) => {
    const targetTask = tasks.find((t) => t.id === id);
    if (!targetTask) return;

    const isSubtask = targetTask.parentId !== null;
    const parentId = targetTask.parentId;
    const parentTask = parentId ? tasks.find((t) => t.id === parentId) : null;

    // Map frontend field names to backend field names
    const fieldMapping: Record<string, string> = {
      title: 'title',
      description: 'description',
      estimatedTime: 'estimated_minutes',
      status: 'status',
      category: 'category',
      deadline: 'due_date',
    };

    const backendField = fieldMapping[field];
    if (!backendField) {
      console.warn(`[Update Task] Unknown field: ${field}`);
      return;
    }

    // Prepare payload
    const payload: Record<string, unknown> = {};

    if (field === 'status') {
      payload.status = mapStatusToBackend(value as TaskStatus);
    } else if (field === 'estimatedTime') {
      payload.estimated_minutes = value;
    } else if (field === 'deadline') {
      // Format date for backend (YYYY-MM-DD format)
      payload.due_date = value ? formatDate(value as Date) : null;
    } else {
      payload[backendField] = value;
    }

    try {
      // Determine endpoint based on whether it's a subtask
      const endpoint = isSubtask
        ? `/api/tasks/subtasks/${id}`
        : `/api/tasks/${id}`;

      await patch(endpoint, payload);

      // Update local state optimistically
      setTasks((prevTasks) => {
        let nextTasks = prevTasks.map((t) =>
          t.id === id ? { ...t, [field]: value } : t
        );

        const shouldBumpParent =
          field === 'status' &&
          value === 'In progress' &&
          parentId &&
          parentTask?.status === 'Not started';

        if (shouldBumpParent) {
          nextTasks = nextTasks.map((t) =>
            t.id === parentId ? { ...t, status: 'In progress' } : t
          );
        }

        const shouldCompleteChildren =
          field === 'status' && (value === 'Done' || value === 'Archive');

        if (shouldCompleteChildren) {
          nextTasks = nextTasks.map((t) => {
            const isChild = t.parentId === id;
            const targetStatus = value;
            const shouldUpdateChild =
              targetStatus === 'Archive'
                ? t.status !== 'Archive' // archive all non-archived children (including Done)
                : t.status === 'Not started' || t.status === 'In progress'; // only bump incomplete to Done
            return isChild && shouldUpdateChild
              ? { ...t, status: targetStatus }
              : t;
          });
        }

        return nextTasks;
      });

      console.log(`[Backend Update] Task ${id}: ${field} = ${value}`);
    } catch (error) {
      console.error(
        `[Backend Update Failed] Task ${id}: ${field} = ${value}`,
        error
      );
      // Optionally show error to user or revert optimistic update
      if (error instanceof ApiClientError) {
        // Could show an alert here
        console.error('Update failed:', error.message);
      }
    }
  };

  return { updateTaskField };
}
