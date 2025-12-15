import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskTimer } from '@/hooks/task-progress/use-task-timer';
import { TASK_PROGRESS_STRINGS } from '@/constants/strings/task-progress';
import { post } from '@/services/api/client';

export default function TaskProgressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    task_id?: string;
    task_title?: string;
    task_duration?: string;
    mode?: string;
    place?: string;
    tool?: string;
    time?: string;
  }>();

  // Use snake_case task_id consistently for route params
  const taskId = params.task_id;

  const timer = useTaskTimer();
  const [progressPercent] = useState(9); // Placeholder, should fetch from backend

  // Start timer automatically when page loads (user already clicked "Start Task")
  useEffect(() => {
    timer.start();
    return () => {
      // Cleanup: stop timer if component unmounts
      timer.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const taskTitle = params.task_title || '';
  // Prefer scheduled time from params; fallback to task_duration if needed
  const durationMinutes =
    (typeof params.time === 'string' && params.time ? Number(params.time) : undefined) ??
    (typeof params.task_duration === 'string' && params.task_duration ? Number(params.task_duration) : Number.NaN);

  const handlePause = () => {
    if (timer.isRunning) {
      timer.pause();
    } else if (timer.isPaused) {
      timer.resume();
    }
  };

  const handleComplete = async () => {
    // Capture elapsed time from timer before stopping
    const elapsedSeconds = timer.elapsedSeconds;
    timer.stop();
    
    // Try to create a record, but always navigate to completion page even on failure
    try {
      if (taskId) {
        const toolsArray =
          typeof params.tool === 'string' && params.tool
            ? params.tool.split(',').map((t) => t.trim()).filter(Boolean)
            : [];

        await post('/api/records', {
          task_id: taskId,
          mode: params.mode ?? '',
          place: params.place ?? '',
          tool: toolsArray,
          occurred_at: new Date().toISOString(),
        });
      } else {
        console.error('[Task Progress] Cannot create record: missing task_id');
      }
    } catch (error) {
      console.error('[Task Progress] Failed to create record on completion', error);
    } finally {
      // Navigate to completion page with taskId and elapsed time from timer, even if record creation failed
      router.push({
        pathname: '/task-completion',
        params: {
          task_id: taskId ?? '',
          elapsedTime: String(elapsedSeconds),
          progressPercent: String(progressPercent),
        },
      });
    }
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
      <View style={styles.content}>
        {/* Task Title */}
        <Text style={styles.taskTitle}>{taskTitle || ' '}</Text>

        {/* Scheduled Duration */}
        <Text style={styles.scheduledText}>
          {TASK_PROGRESS_STRINGS.scheduledFor} {durationMinutes} {TASK_PROGRESS_STRINGS.minutes}
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
