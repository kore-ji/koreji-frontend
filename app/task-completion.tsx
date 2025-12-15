import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTaskCompletion } from '@/hooks/task-completion/use-task-completion';
import { CompletionPage1 } from '@/components/task-completion/completion-page-1';
import { CompletionPage2 } from '@/components/task-completion/completion-page-2';
import { PaginationDots } from '@/components/task-completion/pagination-dots';
import { TASK_COMPLETION_STRINGS } from '@/constants/strings/task-completion';

const TOTAL_PAGES = 2;

// Array of all dog images
const DOG_IMAGES = [
  require('@/assets/dogs/dog1.jpg'),
  require('@/assets/dogs/dog2.jpg'),
  require('@/assets/dogs/dog3.jpg'),
  require('@/assets/dogs/dog4.jpg'),
  require('@/assets/dogs/dog5.jpg'),
  require('@/assets/dogs/dog6.jpg'),
  require('@/assets/dogs/dog7.jpg'),
  require('@/assets/dogs/dog8.jpg'),
  require('@/assets/dogs/dog9.jpg'),
];

export default function TaskCompletionScreen() {
  const params = useLocalSearchParams<{
    task_id?: string;
    elapsedTime?: string;
    progressPercent?: string;
  }>();

  // Randomly select one dog image (memoized to persist across page navigation)
  const selectedImage = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * DOG_IMAGES.length);
    return DOG_IMAGES[randomIndex];
  }, []);

  const {
    task,
    loading,
    currentPage,
    progress,
    elapsedMinutes,
    taskTitle,
    handleWhatsNext,
    goToPreviousPage,
    goToNextPage,
  } = useTaskCompletion({
    task_id: params.task_id,
    progressPercent: params.progressPercent,
    elapsedTime: params.elapsedTime,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {loading ? (
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#333333" />
        </View>
      ) : task ? (
        <View style={styles.content}>
          <View style={styles.pageContentWrapper}>
            {/* Left Navigation Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonLeft,
                currentPage === 0 && styles.navButtonDisabled,
              ]}
              onPress={goToPreviousPage}
              disabled={currentPage === 0}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.glassButton,
                  styles.glassButtonWeb,
                  currentPage === 0 && styles.glassButtonDisabled,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={currentPage === 0 ? '#AAAAAA' : '#1a1a1a'}
                />
              </View>
            </TouchableOpacity>

            {/* Page Content */}
            <View style={styles.pageContent}>
              {currentPage === 0 ? (
                <CompletionPage1
                  taskTitle={taskTitle}
                  task={task}
                  progress={progress}
                  selectedImage={selectedImage}
                />
              ) : (
                <CompletionPage2 elapsedMinutes={elapsedMinutes} />
              )}
            </View>

            {/* Right Navigation Button */}
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonRight,
                currentPage === TOTAL_PAGES - 1 && styles.navButtonDisabled,
              ]}
              onPress={goToNextPage}
              disabled={currentPage === TOTAL_PAGES - 1}
              activeOpacity={0.6}
            >
              <View
                style={[
                  styles.glassButton,
                  styles.glassButtonWeb,
                  currentPage === TOTAL_PAGES - 1 && styles.glassButtonDisabled,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={currentPage === TOTAL_PAGES - 1 ? '#AAAAAA' : '#1a1a1a'}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Pagination Dots */}
          <PaginationDots currentPage={currentPage} totalPages={TOTAL_PAGES} />

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
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  pageContentWrapper: {
    flex: 1,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    paddingHorizontal: 8,
  },
  pageContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    minWidth: 0,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  glassButton: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  glassButtonWeb:
    Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(10px)',
        } as unknown as ViewStyle)
      : {},
  navButtonDisabled: {
    opacity: 0.4,
  },
  glassButtonDisabled: {
    backgroundColor: 'rgba(240, 240, 240, 0.3)',
    borderWidth: 0,
    ...Platform.select({
      ios: {
        shadowOpacity: 0,
        shadowRadius: 0,
      },
      android: {
        elevation: 0,
      },
    }),
  },
  navButtonLeft: {
    marginRight: 8,
  },
  navButtonRight: {
    marginLeft: 8,
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
