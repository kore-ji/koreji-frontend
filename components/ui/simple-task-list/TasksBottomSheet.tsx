import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import {
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { TasksBottomSheetHeader } from './TasksBottomSheetHeader';
import { TasksList } from './TasksList';
import { useTasksBottomSheet } from './useTasksBottomSheet';
import { usePanGesture } from './usePanGesture';
import { COLLAPSED_HEIGHT, EXPANDED_HEIGHT } from './constants';
import { TasksBottomSheetProps } from './types';

export function TasksBottomSheet({ tasks = [] }: TasksBottomSheetProps) {
  const {
    isExpanded,
    isExpandedShared,
    translateY,
    displayTasks,
    toggleExpanded,
    expandSheet,
    collapseSheet,
  } = useTasksBottomSheet(tasks);

  const panGesture = usePanGesture({
    isExpanded: isExpandedShared,
    translateY,
    onExpand: expandSheet,
    onCollapse: collapseSheet,
  });

  // Animate based on expanded state
  const animatedHeight = useAnimatedStyle(() => {
    const targetHeight = isExpandedShared.value
      ? EXPANDED_HEIGHT
      : COLLAPSED_HEIGHT;
    return {
      height: withTiming(targetHeight, {
        duration: 400,
      }),
    };
  });

  const animatedTranslate = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <Animated.View
        style={[styles.container, animatedHeight, animatedTranslate]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={styles.content}>
            <TasksBottomSheetHeader
              title="Tasks"
              isExpanded={isExpandedShared}
              onPress={toggleExpanded}
            />

            {isExpanded && <TasksList tasks={displayTasks} />}
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
