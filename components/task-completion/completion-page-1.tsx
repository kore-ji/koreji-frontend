import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { useResponsive } from '@/hooks/ui/use-responsive';
import { TASK_COMPLETION_STRINGS } from '@/constants/strings/task-completion';
import type { ApiTaskResponse } from '@/types/tasks';

interface CompletionPage1Props {
  taskTitle: string;
  task?: ApiTaskResponse | null;
  progress: number;
  selectedImage: ImageSourcePropType;
}

export function CompletionPage1({ taskTitle, task, progress, selectedImage }: CompletionPage1Props) {
  const { width, isTablet, isDesktop } = useResponsive();
  
  // Calculate responsive sizes based on screen dimensions
  const isSmallScreen = width < 375;
  
  // Responsive image size (25-35% of screen width, with min/max constraints)
  const imageSize = Math.min(
    Math.max(
      width * (isDesktop ? 0.2 : isTablet ? 0.25 : 0.35),
      isSmallScreen ? 140 : 160
    ),
    isDesktop ? 240 : isTablet ? 220 : 200
  );
  
  // Responsive font sizes
  const wellDoneFontSize = isSmallScreen ? 28 : isDesktop ? 36 : isTablet ? 34 : 32;
  const completedFontSize = isSmallScreen ? 14 : isDesktop ? 18 : isTablet ? 17 : 16;
  const taskTitleFontSize = isSmallScreen ? 16 : isDesktop ? 20 : isTablet ? 19 : 18;
  const progressFontSize = isSmallScreen ? 13 : isDesktop ? 16 : isTablet ? 15 : 14;
  
  // Responsive spacing
  const spacingMultiplier = isDesktop ? 1.3 : isTablet ? 1.2 : isSmallScreen ? 0.9 : 1;
  
  const dynamicStyles = {
    wellDoneText: {
      fontSize: wellDoneFontSize,
      marginBottom: 12 * spacingMultiplier,
    },
    completedText: {
      fontSize: completedFontSize,
      marginBottom: 8 * spacingMultiplier,
    },
    taskTitle: {
      fontSize: taskTitleFontSize,
      marginBottom: 24 * spacingMultiplier,
    },
    image: {
      width: imageSize,
      height: imageSize,
    },
    progressText: {
      fontSize: progressFontSize,
    },
    projectText: {
      fontSize: progressFontSize,
    },
  };

  return (
    <View style={styles.container}>
      {/* Well Done Headline */}
      <Text style={[styles.wellDoneText, dynamicStyles.wellDoneText]}>
        {TASK_COMPLETION_STRINGS.wellDone}
      </Text>

      {/* You have completed text */}
      <Text style={[styles.completedText, dynamicStyles.completedText]}>
        {TASK_COMPLETION_STRINGS.youHaveCompleted}
      </Text>

      {/* Task Title */}
      <Text 
        style={[styles.taskTitle, dynamicStyles.taskTitle]} 
        numberOfLines={2} 
        ellipsizeMode="tail"
      >
        {taskTitle}
      </Text>

      {/* Central Image - Randomly selected dog image */}
      <View style={styles.imageContainer}>
        <Image
          source={selectedImage}
          style={[styles.image, dynamicStyles.image]}
          resizeMode="contain"
        />
      </View>

      {/* Progress Information */}
      <View style={styles.progressContainer}>
        {/* Project/context text in brackets */}
        <Text 
          style={[styles.projectText, dynamicStyles.projectText]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {task?.title || taskTitle}
        </Text>

        {/* Current completion progress */}
        <Text style={[styles.progressText, dynamicStyles.progressText]}>
          {TASK_COMPLETION_STRINGS.currentCompletionProgress} : {progress}
          {TASK_COMPLETION_STRINGS.percent}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 8,
  },
  wellDoneText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
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
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imagePlaceholder: {
    width: 180,
    height: 180,
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
    width: 180,
    height: 180,
    borderRadius: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
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
});
