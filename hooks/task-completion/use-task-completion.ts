import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTask } from '@/hooks/tasks/use-task';
import { get } from '@/services/api/client';
import { type ApiTaskResponse } from '@/types/tasks';

interface UseTaskCompletionParams {
  task_id?: string;
  progressPercent?: string;
  elapsedTime?: string;
}

export function useTaskCompletion({ task_id, progressPercent, elapsedTime }: UseTaskCompletionParams) {
  const router = useRouter();
  const { task, loading, error, fetchTask } = useTask();
  const [parentTask, setParentTask] = useState<ApiTaskResponse | null>(null);
  const [parentLoading, setParentLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // 0 = completion page, 1 = time spent page

  const taskId = task_id;

  // Fetch parent task if current task is a subtask
  useEffect(() => {
    if (task?.parent_id && !parentTask && !parentLoading) {
      setParentLoading(true);
      get<ApiTaskResponse>(`/api/tasks/${task.parent_id}`)
        .then((parent) => {
          setParentTask(parent);
          console.log('[Task Completion] Loaded parent task:', { id: parent.id, title: parent.title });
        })
        .catch((err) => {
          console.error('[Task Completion] Failed to load parent task:', err);
        })
        .finally(() => {
          setParentLoading(false);
        });
    }
  }, [task?.parent_id, parentTask, parentLoading]);

  // Get progress from task API response (progress is calculated from subtasks)
  // For subtasks, use parent's progress; for main tasks, use their own progress
  const progressTask = task?.parent_id && parentTask ? parentTask : task;
  const progressFromTask = progressTask?.progress !== undefined ? Math.round(progressTask.progress) : null;
  const parsedProgress = progressFromTask ?? (progressPercent ? parseInt(progressPercent, 10) : Number.NaN);
  const progress = Number.isFinite(parsedProgress) ? parsedProgress : 100;

  const parsedElapsedSeconds = elapsedTime ? parseInt(elapsedTime, 10) : Number.NaN;
  const safeElapsedSeconds = Number.isFinite(parsedElapsedSeconds) ? parsedElapsedSeconds : 0;
  const elapsedMinutes = Math.max(0, Math.round(safeElapsedSeconds / 60));

  // taskTitle: The completed task/subtask's title (the one that was actually finished)
  const taskTitle = task?.title ?? '';

  // task: The parent task if this is a subtask, otherwise the task itself
  const displayTask = task?.parent_id && parentTask ? parentTask : task;

  // Fetch task data
  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, fetchTask]);

  // Log when using task_id fails to load a task with NaN messages
  useEffect(() => {
    if (!loading && taskId && (!task || error)) {
      console.error('[Task Completion] Failed to load task with task_id', {
        task_id: taskId,
        error: error || 'Task not found',
      });
    }
  }, [loading, taskId, task, error]);

  // Log error if task failed to load, but stay on completion page
  useEffect(() => {
    if (error) {
      console.error('[Task Completion] Failed to load task', error);
    }
  }, [error]);

  const handleWhatsNext = () => {
    if (currentPage === 0) {
      // Switch to page 2 (time spent page)
      setCurrentPage(1);
    } else {
      // Navigate to next screen
      router.push('/');
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return {
    task: displayTask || null,
    loading: (loading || parentLoading) && !!taskId,
    error,
    currentPage,
    progress,
    elapsedMinutes,
    taskTitle,
    handleWhatsNext,
    goToPreviousPage,
    goToNextPage,
  };
}
