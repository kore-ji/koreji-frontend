import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTask } from '@/hooks/tasks/use-task';
import type { ApiTaskResponse } from '@/types/tasks';

// TEMPORARY: Dummy data for display
const getDummyTask = (taskId?: string): ApiTaskResponse => ({
  id: taskId || 'dummy-task-id',
  parent_id: null,
  title: 'Complete Project Documentation',
  description: 'Write comprehensive documentation for the project including API endpoints, database schema, and user guides.',
  category: 'Work',
  status: 'completed',
  estimated_minutes: 120,
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  tags: [],
});

interface UseTaskCompletionParams {
  task_id?: string;
  progressPercent?: string;
  elapsedTime?: string;
}

export function useTaskCompletion({ task_id, progressPercent, elapsedTime }: UseTaskCompletionParams) {
  const router = useRouter();
  const { task, loading, error, fetchTask, setTask } = useTask();
  const [currentPage, setCurrentPage] = useState(0); // 0 = completion page, 1 = time spent page

  const taskId = task_id;

  const progress = progressPercent ? parseInt(progressPercent, 10) : 9;
  const elapsedSeconds = elapsedTime ? parseInt(elapsedTime, 10) : 600; // Default to 10 minutes (600 seconds)
  const elapsedMinutes = Math.round(elapsedSeconds / 60);
  const taskTitle = (task || getDummyTask(taskId))?.title || '';

  // Fetch task data
  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    } else {
      // TEMPORARY: Use dummy data if no taskId
      setTask(getDummyTask(taskId));
    }
  }, [taskId, fetchTask, setTask]);

  // Handle error by redirecting back
  useEffect(() => {
    if (error) {
      console.error('[Task Completion] Failed to load task:', error);
      router.back();
    }
  }, [error, router]);

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
    task: task || getDummyTask(taskId),
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
