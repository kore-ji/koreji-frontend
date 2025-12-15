import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { post, patch, ApiClientError } from '@/services/api/client';
import { type LocalSubTask } from '@/types/add-task';
import { type TaskStatus } from '@/types/task-status';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';
import { buildMainTaskPayload, buildSubtaskPayload, isExistingSubtask } from '@/utils/add-task/task-payload';
import { calculateTotalTime } from '@/utils/add-task/time-calculation';

/**
 * Hook for handling form submission (create/update task)
 */
export function useAddTaskSubmit(
  isEditMode: boolean,
  taskId: string | undefined,
  mainTitle: string,
  mainDesc: string,
  mainTime: string,
  mainDeadline: Date | null,
  mainStatus: TaskStatus,
  mainTags: any,
  subtasks: LocalSubTask[]
) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    console.log('[useAddTaskSubmit] handleSubmit called');
    if (!mainTitle.trim()) {
      console.log('[useAddTaskSubmit] Validation failed: mainTitle is empty');
      Alert.alert(TASK_SCREEN_STRINGS.addTask.alerts.errorTitle, TASK_SCREEN_STRINGS.addTask.alerts.errorMessage);
      return;
    }

    console.log('[useAddTaskSubmit] Validation passed, starting submission');
    setIsSubmitting(true);

    try {
      const calculatedTotalTimeValue = calculateTotalTime(subtasks, mainTime);
      const mainTaskPayload = buildMainTaskPayload(
        mainTitle,
        mainDesc,
        mainDeadline,
        mainStatus,
        calculatedTotalTimeValue,
        mainTags
      );
      console.log('[useAddTaskSubmit] Task payload built:', mainTaskPayload);
      console.log('[useAddTaskSubmit] Subtasks count:', subtasks.length);

      if (isEditMode && taskId) {
        // Update existing task
        console.log(`[useAddTaskSubmit] Updating existing task (ID: ${taskId}) to backend`);
        await patch(`/api/tasks/${taskId}`, mainTaskPayload);
        console.log('[useAddTaskSubmit] Task updated successfully');

        // Update subtasks
        if (subtasks.length > 0) {
          console.log(`[useAddTaskSubmit] Updating ${subtasks.length} subtasks to backend`);
          const subtaskPromises = subtasks.map(async (sub) => {
            const subtaskPayload = buildSubtaskPayload(sub);
            console.log(`[useAddTaskSubmit] Subtask payload for ${sub.id}:`, subtaskPayload);

            // Check if subtask exists (has UUID format) or is new
            if (isExistingSubtask(sub.id)) {
              // Update existing subtask
              console.log(`[useAddTaskSubmit] Updating existing subtask (ID: ${sub.id})`);
              return patch(`/api/tasks/subtasks/${sub.id}`, subtaskPayload);
            } else {
              // Create new subtask
              console.log(`[useAddTaskSubmit] Creating new subtask (temp ID: ${sub.id}) for task ${taskId}`);
              return post('/api/tasks/subtasks', {
                ...subtaskPayload,
                task_id: taskId,
              });
            }
          });

          await Promise.all(subtaskPromises);
          console.log('[useAddTaskSubmit] All subtasks updated successfully');
        }
      } else {
        // Create new task
        console.log('[useAddTaskSubmit] Creating new task in backend');
        const mainTaskResponse = await post<{ id: string; [key: string]: unknown }>('/api/tasks/', mainTaskPayload);
        const mainTaskId = mainTaskResponse.id;
        console.log('[useAddTaskSubmit] Task created successfully with ID:', mainTaskId);

        // Create subtasks if any
        if (subtasks.length > 0) {
          console.log(`[useAddTaskSubmit] Creating ${subtasks.length} subtasks in backend`);
          const subtaskPromises = subtasks.map(async (sub) => {
            const subtaskPayload = buildSubtaskPayload(sub, mainTaskId);
            console.log(`[useAddTaskSubmit] Creating subtask:`, subtaskPayload);
            return post('/api/tasks/subtasks', subtaskPayload);
          });

          await Promise.all(subtaskPromises);
          console.log('[useAddTaskSubmit] All subtasks created successfully');
        }
      }

      // Success - navigate back
      console.log('[useAddTaskSubmit] Submission complete, navigating back');
      router.back();
    } catch (error) {
      console.error(`[useAddTaskSubmit] ${isEditMode ? 'Update' : 'Create'} Task API error:`, error);
      let errorMessage = TASK_SCREEN_STRINGS.addTask.alerts.errorMessage;
      if (error instanceof ApiClientError) {
        errorMessage = error.message || errorMessage;
      }
      Alert.alert(TASK_SCREEN_STRINGS.addTask.alerts.errorTitle, errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleSubmit,
  };
}
