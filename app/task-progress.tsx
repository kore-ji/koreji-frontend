import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTask } from '@/hooks/tasks/use-task';
import { useTaskTimer } from '@/hooks/task-progress/use-task-timer';
import { TASK_PROGRESS_STRINGS } from '@/constants/strings/task-progress';
import type { ApiTaskResponse } from '@/types/tasks';

// TEMPORARY: Dummy data for display
const getDummyTask = (taskId?: string): ApiTaskResponse => ({
  id: taskId || 'dummy-task-id',
  parent_id: null,
  title: 'Complete Project Documentation',
  description: 'Write comprehensive documentation for the project including API endpoints, database schema, and user guides.',
  category: 'Work',
  status: 'in_progress',
  estimated_minutes: 120,
  due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  tags: [],
});

export default function TaskProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    task_id?: string;
    mode?: string;
    place?: string;
    tool?: string;
    time?: string;
  }>();

  // Use snake_case task_id consistently for route params
  const taskId = params.task_id;
  
  const timer = useTaskTimer();
  const { task, loading, error, fetchTask, setTask } = useTask();
  const [progressPercent] = useState(9); // Placeholder, should fetch from backend

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
      console.error('[Task Progress] Failed to load task:', error);
      router.back();
    }
  }, [error, router]);

  // Start timer automatically when page loads (user already clicked "Start Task")
  useEffect(() => {
    timer.start();
    return () => {
      // Cleanup: stop timer if component unmounts
      timer.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const taskTitle = task?.title || '';
  const durationMinutes = task?.estimated_minutes || 0;

  const handlePause = () => {
    if (timer.isRunning) {
      timer.pause();
    } else if (timer.isPaused) {
      timer.resume();
    }
  };

  const handleComplete = () => {
    timer.stop();
    // Navigate to completion page with taskId and elapsed time
    router.push(
      `/task-completion?task_id=${taskId}&elapsedTime=${timer.elapsedSeconds}&progressPercent=${progressPercent}`
    );
  };

  const handleClose = () => {
    // Close page without stopping timer (timer continues in background)
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading && taskId ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#333333" />
        </View>
      ) : (task || getDummyTask(taskId)) ? (
        <View style={styles.content}>
          {/* Task Title */}
          <Text style={styles.taskTitle}>{(task || getDummyTask(taskId))?.title || taskTitle}</Text>

        {/* Scheduled Duration */}
        <Text style={styles.scheduledText}>
          {TASK_PROGRESS_STRINGS.scheduledFor} {(task || getDummyTask(taskId))?.estimated_minutes || durationMinutes} {TASK_PROGRESS_STRINGS.minutes}
        </Text>

        {/* Activity Indicator */}
        <View style={styles.indicatorContainer}>
          {timer.isRunning && (
            <ActivityIndicator size="large" color="#333333" style={styles.activityIndicator} />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.pauseButton]}
            onPress={handlePause}
            disabled={!timer.isRunning && !timer.isPaused}
          >
            <Text style={styles.pauseButtonText}>{TASK_PROGRESS_STRINGS.pause}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.completeButton]}
            onPress={handleComplete}
          >
            <Text style={styles.completeButtonText}>{TASK_PROGRESS_STRINGS.complete}</Text>
          </TouchableOpacity>
        </View>
      </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.errorText}>Task not found</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  scheduledText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 48,
  },
  indicatorContainer: {
    height: 100,
    width: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 80,
  },
  activityIndicator: {
    transform: [{ scale: 1.5 }],
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
    paddingHorizontal: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#E0E0E0',
  },
  pauseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  completeButton: {
    backgroundColor: '#4CAF50',
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});
