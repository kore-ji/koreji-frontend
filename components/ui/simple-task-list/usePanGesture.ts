import { Gesture } from 'react-native-gesture-handler';
import { SharedValue, withTiming, runOnJS } from 'react-native-reanimated';

interface UsePanGestureProps {
  isExpanded: SharedValue<boolean>;
  translateY: SharedValue<number>;
  onExpand: () => void;
  onCollapse: () => void;
}

export function usePanGesture({
  isExpanded,
  translateY,
  onExpand,
  onCollapse,
}: UsePanGestureProps) {
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (isExpanded.value) {
        // When expanded, allow dragging down to collapse
        if (event.translationY > 0) {
          translateY.value = event.translationY;
        }
      } else {
        // When collapsed, allow dragging up to expand
        if (event.translationY < 0) {
          translateY.value = event.translationY;
        }
      }
    })
    .onEnd((event) => {
      const threshold = 50;
      const timingConfig = { duration: 200 };
      if (isExpanded.value) {
        if (event.translationY > threshold || event.velocityY > 500) {
          runOnJS(onCollapse)();
        } else {
          translateY.value = withTiming(0, timingConfig);
        }
      } else {
        if (event.translationY < -threshold || event.velocityY < -500) {
          runOnJS(onExpand)();
        } else {
          translateY.value = withTiming(0, timingConfig);
        }
      }
      translateY.value = withTiming(0, timingConfig);
    });

  return panGesture;
}
