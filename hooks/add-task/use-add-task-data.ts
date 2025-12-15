import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { get } from '@/services/api/client';
import { type ApiTaskResponse, type LocalSubTask } from '@/types/add-task';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { mapStatusFromBackend } from '@/utils/mapping/status';

/**
 * Hook for loading task data in edit mode
 */
export function useAddTaskData(
  isEditMode: boolean,
  taskId: string | undefined,
  setMainTitle: (title: string) => void,
  setMainDesc: (desc: string) => void,
  setMainTime: (time: string) => void,
  setMainStatus: (status: any) => void,
  setMainDeadline: (deadline: Date | null) => void,
  setMainTags: (tags: TaskTags) => void,
  setSubtasks: (subtasks: LocalSubTask[]) => void
) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(isEditMode);

  useEffect(() => {
    if (isEditMode && taskId) {
      const loadTask = async () => {
        try {
          const task = await get<ApiTaskResponse>(`/api/tasks/${taskId}`);

          setMainTitle(task.title || '');
          setMainDesc(task.description || '');
          setMainTime(task.estimated_minutes?.toString() || '');
          setMainStatus(mapStatusFromBackend(task.status));

          if (task.due_date) {
            setMainDeadline(new Date(task.due_date));
          }

          if (task.category) {
            setMainTags({
              tagGroups: {
                Category: [task.category],
              },
            });
          }

          // Load subtasks (including their tags from backend)
          if (task.subtasks && task.subtasks.length > 0) {
            const loadedSubtasks: LocalSubTask[] = task.subtasks.map((sub) => ({
              id: sub.id,
              title: sub.title || '',
              description: sub.description || '',
              estimatedTime: sub.estimated_minutes?.toString() || '',
              deadline: sub.due_date ? new Date(sub.due_date) : null,
              status: mapStatusFromBackend(sub.status),
              tags: mapBackendTagsToTaskTags(sub),
            }));
            setSubtasks(loadedSubtasks);
          }
        } catch (error) {
          console.error('[Load Task] Failed:', error);
          Alert.alert('Error', 'Failed to load task data');
          router.back();
        } finally {
          setIsLoading(false);
        }
      };
      loadTask();
    }
  }, [isEditMode, taskId, router, setMainTitle, setMainDesc, setMainTime, setMainStatus, setMainDeadline, setMainTags, setSubtasks]);

  return { isLoading };
}

function mapBackendTagsToTaskTags(task: ApiTaskResponse): TaskTags {
  const tagGroups: { [groupName: string]: string[] } = {};

  if (Array.isArray(task.tags)) {
    task.tags.forEach((tag) => {
      const groupName = (tag as any).group_name as string | undefined;
      const tagName = (tag as any).name as string | undefined;
      if (!groupName || !tagName) return;
      if (!tagGroups[groupName]) {
        tagGroups[groupName] = [];
      }
      if (!tagGroups[groupName].includes(tagName)) {
        tagGroups[groupName].push(tagName);
      }
    });
  }

  return { tagGroups };
}
