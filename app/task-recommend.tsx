import { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Task } from '@/components/task-recommend/task-card';
import { TaskList } from '@/components/task-recommend/task-list';
import { TaskRecommendHeader } from '@/components/task-recommend/task-recommend-header';
import { TaskRecommendDescription } from '@/components/task-recommend/task-recommend-description';
import { StartTaskButton } from '@/components/task-recommend/start-task-button';
import { post, get, ApiClientError } from '@/services/api/client';
import { DEFAULT_TASK_STATUS } from '@/constants/task-status';
import { type ApiTaskResponse } from '@/types/tasks';
import { TaskReasonModal } from '@/components/task-recommend/task-reason-modal';

interface RecommendTask {
  task_id: string;
  task_name: string;
  reason: string;
}

interface RecommendResponse {
  time: number;
  mode: string;
  place: string;
  tool: string;
  recommended_tasks: RecommendTask[];
}

const BREAKPOINT_TABLET = 768;

export default function TaskRecommendScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    time?: string;
    mode?: string;
    place?: string;
    tools?: string;
  }>();

  // Debug: Log params whenever they change
  useEffect(() => {
    console.log('[task-recommend] Params:', params);
  }, [params]);

  const [screenWidth, setScreenWidth] = useState(
    Dimensions.get('window').width
  );
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [selectedReasonTask, setSelectedReasonTask] = useState<Task | null>(
    null
  );

  const totalMinutes =
    typeof params.time === 'string' && params.time ? Number(params.time) : NaN;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const time =
          typeof params.time === 'string' && params.time
            ? Number(params.time)
            : NaN;

        const payload = {
          time,
          mode: typeof params.mode === 'string' ? params.mode : '',
          place: typeof params.place === 'string' ? params.place : '',
          tool: typeof params.tools === 'string' ? params.tools : '',
        };

        console.log(
          '[task-recommend] Calling /api/recommend with payload:',
          payload
        );

        const response = await post<RecommendResponse>(
          '/api/recommend/',
          payload
        );

        console.log(
          '[task-recommend] API Response:',
          JSON.stringify(response, null, 2)
        );

        if (
          response &&
          Array.isArray(response.recommended_tasks) &&
          response.recommended_tasks.length > 0
        ) {
          const perTaskDuration =
            response.recommended_tasks.length > 0
              ? Math.max(
                  5,
                  Math.round(time / response.recommended_tasks.length)
                )
              : 0;

          // Fetch all tasks to get parent information
          const taskPromises = response.recommended_tasks.map(async (t) => {
            try {
              const taskData = await get<ApiTaskResponse>(
                `/api/tasks/${t.task_id}`
              );
              return { taskId: t.task_id, taskData, reason: t.reason };
            } catch (error) {
              console.error(
                `[task-recommend] Failed to fetch task ${t.task_id}:`,
                error
              );
              return { taskId: t.task_id, taskData: null, reason: t.reason };
            }
          });

          const taskResults = await Promise.all(taskPromises);

          // Fetch parent tasks for tasks that have parent_id
          const parentPromises = taskResults
            .filter((result) => result.taskData?.parent_id)
            .map(async (result) => {
              try {
                const parentTask = await get<ApiTaskResponse>(
                  `/api/tasks/${result.taskData!.parent_id}`
                );
                return { taskId: result.taskId, parentTitle: parentTask.title };
              } catch (error) {
                console.error(
                  `[task-recommend] Failed to fetch parent task for ${result.taskId}:`,
                  error
                );
                return { taskId: result.taskId, parentTitle: null };
              }
            });

          const parentResults = await Promise.all(parentPromises);
          const parentMap = new Map(
            parentResults.map((r) => [r.taskId, r.parentTitle])
          );

          // Map to Task[] with source and reason
          const mappedTasks: Task[] = response.recommended_tasks.map((t) => {
            const taskId = t.task_id;
            const taskResult = taskResults.find((r) => r.taskId === taskId);
            const parentTitle = parentMap.get(taskId);
            const source = parentTitle || 'AI Recommendation';

            console.log('[task-recommend] Mapping task:', {
              task_id: taskId,
              task_name: t.task_name,
              parent_id: taskResult?.taskData?.parent_id,
              source,
            });

            return {
              id: taskId,
              title: t.task_name,
              duration: perTaskDuration || totalMinutes,
              source,
              status: DEFAULT_TASK_STATUS,
              reason: t.reason,
            };
          });

          console.log(
            '[task-recommend] Mapped tasks with IDs:',
            mappedTasks.map((t) => ({
              id: t.id,
              title: t.title,
              source: t.source,
            }))
          );

          setTasks(mappedTasks);
          setSelectedTaskId(mappedTasks[0]?.id ?? null);
        } else {
          console.log(
            '[task-recommend] No recommended_tasks returned; leaving tasks empty.'
          );
          setTasks([]);
          setSelectedTaskId(null);
        }
      } catch (error) {
        if (error instanceof ApiClientError) {
          console.error(
            '[task-recommend] ApiClientError while calling /api/recommend:',
            {
              message: error.message,
              type: error.type,
              status: error.status,
              data: error.data,
            }
          );
          setErrorMessage(error.message);
        } else {
          console.error(
            '[task-recommend] Unexpected error while calling /api/recommend:',
            error
          );
          setErrorMessage('Failed to load recommendations.');
        }

        // On failure, leave tasks empty and selectedTaskId null.
        setTasks([]);
        setSelectedTaskId(null);
      } finally {
        setLoading(false);
      }
    };

    // Only call backend when we have a valid time value; otherwise leave tasks empty
    if (typeof params.time === 'string' && params.time) {
      fetchRecommendations();
    } else {
      setTasks([]);
      setSelectedTaskId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.time, params.mode, params.place, params.tools]);

  // Calculate number of columns based on screen width (always use masonry, max 2 columns)
  const getColumns = () => {
    if (screenWidth >= BREAKPOINT_TABLET) return 2;
    return 1; // Mobile: single column masonry
  };

  const columns = getColumns();
  // Calculate card width for masonry layout
  const containerPadding = 48; // 24px on each side
  const gapSize = 16;
  const availableWidth = screenWidth - containerPadding;
  const cardWidth = (availableWidth - gapSize * (columns - 1)) / columns;

  const handleStartTask = async () => {
    if (!selectedTaskId) return;

    const selectedTask = tasks.find((task) => task.id === selectedTaskId);
    if (selectedTask) {
      console.log('Start task pressed - Selected task info:', {
        id: selectedTask.id,
        title: selectedTask.title,
        duration: selectedTask.duration,
        source: selectedTask.source,
        status: selectedTask.status,
      });
      router.push({
        pathname: '/task-progress',
        params: {
          task_id: selectedTask.id,
          task_title: selectedTask.title,
          task_duration: String(selectedTask.duration),
          mode: params.mode,
          place: params.place ?? 'task_recommend',
          tool: params.tools ?? 'mobile_app',
          time: params.time,
        },
      });
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleTaskLongPress = (task: Task) => {
    if (task.reason) {
      setSelectedReasonTask(task);
      setReasonModalVisible(true);
    }
  };

  const handleTaskInfoPress = (task: Task) => {
    if (task.reason) {
      setSelectedReasonTask(task);
      setReasonModalVisible(true);
    }
  };

  const handleCloseReasonModal = () => {
    setReasonModalVisible(false);
    setSelectedReasonTask(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <TaskRecommendHeader />
          <TaskRecommendDescription totalMinutes={totalMinutes} />
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#333333" />
              <Text style={styles.loadingText}>Loading recommendations...</Text>
            </View>
          )}
          {!loading && errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}
          <TaskList
            tasks={tasks}
            columns={columns}
            cardWidth={cardWidth}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
            onTaskLongPress={handleTaskLongPress}
            onTaskInfoPress={handleTaskInfoPress}
          />
        </View>
      </ScrollView>
      <StartTaskButton onPress={handleStartTask} />
      {selectedReasonTask && (
        <TaskReasonModal
          visible={reasonModalVisible}
          taskTitle={selectedReasonTask.title}
          reason={selectedReasonTask.reason || ''}
          onClose={handleCloseReasonModal}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 120, // Space for floating button
  },
  contentWrapper: {
    width: '100%',
  },
  loadingContainer: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666666',
  },
  errorContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
  },
});
