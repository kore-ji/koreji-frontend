import { StyleSheet, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming, SharedValue } from 'react-native-reanimated';
import { HEADER_HEIGHT } from './constants';

interface TasksBottomSheetHeaderProps {
  title: string;
  isExpanded: SharedValue<boolean>;
  onPress: () => void;
}

export function TasksBottomSheetHeader({
  title,
  isExpanded,
  onPress,
}: TasksBottomSheetHeaderProps) {
  const animatedArrow = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: withTiming(isExpanded.value ? '180deg' : '0deg', { duration: 150 }),
        },
      ],
    };
  });

  return (
    <Pressable
      style={styles.header}
      onPress={onPress}
      android_ripple={{ color: '#F0F0F0' }}
    >
      <Text style={styles.headerText}>{title}</Text>
      <Animated.View style={animatedArrow}>
        <Ionicons name="chevron-up" size={24} color="#333333" />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
});

