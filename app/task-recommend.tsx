import { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Task } from '@/components/task-recommend/task-card';
import { TaskList } from '@/components/task-recommend/task-list';
import { TaskRecommendHeader } from '@/components/task-recommend/task-recommend-header';
import { TaskRecommendDescription } from '@/components/task-recommend/task-recommend-description';
import { StartTaskButton } from '@/components/task-recommend/start-task-button';

const DUMMY_TASKS: Task[] = [
  {
    id: '1',
    title: 'Organize Page Structure',
    duration: 10,
    source: 'Design System',
    status: 'In progress',
  },
  {
    id: '2',
    title: 'Lo-Fi to Hi-Fi',
    duration: 15,
    source: 'Design System',
    status: 'Not started',
  },
  {
    id: '3',
    title: 'Build Basic Component',
    duration: 20,
    source: 'Design System',
    status: 'Not started',
  },
  {
    id: '4',
    title: 'Create User Authentication Flow',
    duration: 25,
    source: 'Backend API',
    status: 'Not started',
  },
];

const BREAKPOINT_TABLET = 768;

export default function TaskRecommendScreen() {
  const totalMinutes = DUMMY_TASKS.reduce((sum, task) => sum + task.duration, 0);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(DUMMY_TASKS[0]?.id || null);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });

    return () => subscription?.remove();
  }, []);

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
  const cardWidth = (availableWidth - (gapSize * (columns - 1))) / columns;

  const handleStartTask = () => {
    if (!selectedTaskId) return;
    
    const selectedTask = DUMMY_TASKS.find((task) => task.id === selectedTaskId);
    if (selectedTask) {
      console.log('Start task pressed - Selected task info:', {
        id: selectedTask.id,
        title: selectedTask.title,
        duration: selectedTask.duration,
        source: selectedTask.source,
        status: selectedTask.status,
      });
    }
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
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
          <TaskList 
            tasks={DUMMY_TASKS} 
            columns={columns} 
            cardWidth={cardWidth}
            selectedTaskId={selectedTaskId}
            onTaskSelect={handleTaskSelect}
          />
        </View>
      </ScrollView>
      <StartTaskButton onPress={handleStartTask} />
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
});

