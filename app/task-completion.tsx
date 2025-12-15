import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTask } from '@/hooks/tasks/use-task';
import { TASK_COMPLETION_STRINGS } from '@/constants/strings/task-completion';

export default function TaskCompletionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    taskId?: string;
    elapsedTime?: string;
    progressPercent?: string;
  }>();

  const { taskId, progressPercent } = params;
  const { task, loading, error, fetchTask } = useTask();
  const progress = progressPercent ? parseInt(progressPercent, 10) : 9;

  // Fetch task data
  useEffect(() => {
    if (taskId) {
      fetchTask(taskId);
    }
  }, [taskId, fetchTask]);

  // Handle error by redirecting back
  useEffect(() => {
    if (error) {
      console.error('[Task Completion] Failed to load task:', error);
      router.back();
    }
  }, [error, router]);

  const taskTitle = task?.title || '';

  const handleWhatsNext = () => {
    router.push('/task-recommend');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#333333" />
        </View>
      ) : task ? (
        <View style={styles.content}>
          {/* Well Done Headline */}
          <Text style={styles.wellDoneText}>{TASK_COMPLETION_STRINGS.wellDone}</Text>

          {/* You have completed text */}
          <Text style={styles.completedText}>{TASK_COMPLETION_STRINGS.youHaveCompleted}</Text>

          {/* Task Title */}
          <Text style={styles.taskTitle}>{taskTitle}</Text>

        {/* Central Image - Placeholder for corgi image */}
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Image</Text>
          </View>
          {/* TODO: Replace with actual image asset when available
          <Image
            source={require('@/assets/images/corgi-completion.png')}
            style={styles.image}
            resizeMode="contain"
          />
          */}
        </View>

        {/* Progress Information */}
        <View style={styles.progressContainer}>
          {/* Project/context text in brackets */}
          <Text style={styles.projectText}>{task?.title}</Text>

          {/* Current completion progress */}
          <Text style={styles.progressText}>
            {TASK_COMPLETION_STRINGS.currentCompletionProgress} : {progress}
            {TASK_COMPLETION_STRINGS.percent}
          </Text>
        </View>

        {/* Pagination Dots */}
        <View style={styles.paginationContainer}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={[styles.dot, styles.dotInactive]} />
        </View>

          {/* What's Next Button */}
          <TouchableOpacity style={styles.whatsNextButton} onPress={handleWhatsNext}>
            <Text style={styles.whatsNextButtonText}>{TASK_COMPLETION_STRINGS.whatsNext}</Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  wellDoneText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
  },
  completedText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 32,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999999',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  projectText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#333333',
  },
  dotInactive: {
    backgroundColor: '#E0E0E0',
  },
  whatsNextButton: {
    width: '100%',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsNextButtonText: {
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
