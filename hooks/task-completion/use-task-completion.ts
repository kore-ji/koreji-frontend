import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTask } from '@/hooks/tasks/use-task';

interface UseTaskCompletionParams {
  task_id?: string;
  progressPercent?: string;
  elapsedTime?: string;
}

export function useTaskCompletion({ task_id, progressPercent, elapsedTime }: UseTaskCompletionParams) {
  const router = useRouter();
  const { task, loading, error, fetchTask } = useTask();
  const [currentPage, setCurrentPage] = useState(0); // 0 = completion page, 1 = time spent page

  const taskId = task_id;

  const progress = progressPercent ? parseInt(progressPercent, 10) : Number.NaN;
  const elapsedSeconds = elapsedTime ? parseInt(elapsedTime, 10) : Number.NaN;
  const elapsedMinutes = !isNaN(elapsedSeconds) ? Math.round(elapsedSeconds / 60) : Number.NaN;
  const taskTitle = task?.title ?? (isNaN(Number(taskId)) ? '' : 'NaN');

  // Fetch task data
  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, fetchTask]);

  // Log when using task_id fails to load a task with NaN messages
  useEffect(() => {
    if (!loading && taskId && (!task || error)) {
      console.error('[Task Completion] Failed to load task with task_id: NaN', {
        task_id: taskId,
        error: error || 'Task not found',
      });
    }
  }, [loading, taskId, task, error]);

  // Log error if task failed to load, but stay on completion page
  useEffect(() => {
    if (error) {
      console.error('[Task Completion] Failed to load task: NaN', error);
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
    task: task || null,
    loading: loading && !!taskId,
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

