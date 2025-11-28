import { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Pressable, View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TaskMode, TaskPlace, TaskTool } from '@/constants/task-filters';
import { HOME_SCREEN_STRINGS } from '@/constants/strings/home';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

export default function HomeScreen() {
  const {
    headerTitle,
    timeLabels,
    filters,
    actions,
  } = HOME_SCREEN_STRINGS;
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(20);

  // Hover states for web platform
  const [hoursIncHovered, setHoursIncHovered] = useState(false);
  const [hoursDecHovered, setHoursDecHovered] = useState(false);
  const [minutesIncHovered, setMinutesIncHovered] = useState(false);
  const [minutesDecHovered, setMinutesDecHovered] = useState(false);

  // Refs for managing long press intervals
  const hoursIncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoursDecTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minutesIncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minutesDecTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoursIncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hoursDecIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutesIncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minutesDecIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      [hoursIncTimeoutRef, hoursDecTimeoutRef, minutesIncTimeoutRef, minutesDecTimeoutRef].forEach(
        (ref) => {
          if (ref.current) clearTimeout(ref.current);
        }
      );
      [
        hoursIncIntervalRef,
        hoursDecIntervalRef,
        minutesIncIntervalRef,
        minutesDecIntervalRef,
      ].forEach((ref) => {
        if (ref.current) clearInterval(ref.current);
      });
    };
  }, []);

  const startContinuousAction = (
    action: () => void,
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  ) => {
    // Start interval after a delay (long press threshold)
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        action();
      }, 100); // Execute every 100ms for fast continuous action
    }, 500); // Wait 500ms before starting continuous action
  };

  const stopContinuousAction = (
    timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
    intervalRef: React.MutableRefObject<ReturnType<typeof setInterval> | null>
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
  const [selectedMode, setSelectedMode] = useState<TaskMode>(TaskMode.NO_SELECT);
  const [selectedPlace, setSelectedPlace] = useState<TaskPlace>(TaskPlace.NO_SELECT);
  const [selectedTool, setSelectedTool] = useState<TaskTool[]>([TaskTool.NO_SELECT]);

  const formatTime = (value: number): string => {
    return value.toString().padStart(2, '0');
  };

  const incrementHours = () => {
    setHours((prev) => prev + 1);
  };

  const decrementHours = () => {
    setHours((prevHours) => {
      if (prevHours <= 0 && minutes <= 0) {
        return 0;
      }
      return Math.max(0, prevHours - 1);
    });
  };

  const incrementMinutes = () => {
    setMinutes((prev) => {
      const newMinutes = prev + 1;
      if (newMinutes >= 60) {
        setHours((prevHours) => prevHours + 1);
        return 0;
      }
      return newMinutes;
    });
  };

  const decrementMinutes = () => {
    setMinutes((prevMinutes) => {
      if (prevMinutes <= 0) {
        if (hours <= 0) {
          // Both hours and minutes are 0, don't decrease
          return 0;
        }
        // Minutes is 0 but hours > 0, decrease hours and set minutes to 59
        setHours((prevHours) => Math.max(0, prevHours - 1));
        return 59;
      }
      return prevMinutes - 1;
    });
  };

  const handleRecommend = () => {
    // Placeholder for recommendation logic
    console.log(actions.recommendLog, {
      time: `${hours * 60 + minutes}`, // total minutes
      place: selectedPlace,
      mode: selectedMode,
      tools: selectedTool.join(', '),
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Text style={styles.headerText} testID="home-header-title">
          {headerTitle}
        </Text>

        {/* Time Input Widget */}
        <View style={styles.timeContainer}>
          {/* Hours Group */}
          <View style={styles.timeGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.circleButton,
                (pressed || (Platform.OS === 'web' && hoursIncHovered)) && styles.circleButtonPressed,
              ]}
              testID="increment-hours"
              onPress={incrementHours}
              onPressIn={() =>
                startContinuousAction(incrementHours, hoursIncTimeoutRef, hoursIncIntervalRef)
              }
              onPressOut={() => stopContinuousAction(hoursIncTimeoutRef, hoursIncIntervalRef)}
              onHoverIn={() => Platform.OS === 'web' && setHoursIncHovered(true)}
              onHoverOut={() => Platform.OS === 'web' && setHoursIncHovered(false)}
              android_ripple={{ color: '#cccccc' }}
            >
              <Ionicons name="chevron-up" size={20} color="#333333" />
            </Pressable>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue} testID="hours-value">
                {formatTime(hours)}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.circleButton,
                (pressed || (Platform.OS === 'web' && hoursDecHovered)) && styles.circleButtonPressed,
              ]}
              testID="decrement-hours"
              onPress={decrementHours}
              onPressIn={() =>
                startContinuousAction(decrementHours, hoursDecTimeoutRef, hoursDecIntervalRef)
              }
              onPressOut={() => stopContinuousAction(hoursDecTimeoutRef, hoursDecIntervalRef)}
              onHoverIn={() => Platform.OS === 'web' && setHoursDecHovered(true)}
              onHoverOut={() => Platform.OS === 'web' && setHoursDecHovered(false)}
              android_ripple={{ color: '#cccccc' }}
            >
              <Ionicons name="chevron-down" size={20} color="#333333" />
            </Pressable>
            <Text style={styles.timeLabel}>{timeLabels.hours}</Text>
          </View>

          {/* Minutes Group */}
          <View style={styles.timeGroup}>
            <Pressable
              style={({ pressed }) => [
                styles.circleButton,
                (pressed || (Platform.OS === 'web' && minutesIncHovered)) && styles.circleButtonPressed,
              ]}
              testID="increment-minutes"
              onPress={incrementMinutes}
              onPressIn={() =>
                startContinuousAction(
                  incrementMinutes,
                  minutesIncTimeoutRef,
                  minutesIncIntervalRef
                )
              }
              onPressOut={() => stopContinuousAction(minutesIncTimeoutRef, minutesIncIntervalRef)}
              onHoverIn={() => Platform.OS === 'web' && setMinutesIncHovered(true)}
              onHoverOut={() => Platform.OS === 'web' && setMinutesIncHovered(false)}
              android_ripple={{ color: '#cccccc' }}
            >
              <Ionicons name="chevron-up" size={20} color="#333333" />
            </Pressable>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue} testID="minutes-value">
                {formatTime(minutes)}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.circleButton,
                (pressed || (Platform.OS === 'web' && minutesDecHovered)) && styles.circleButtonPressed,
              ]}
              testID="decrement-minutes"
              onPress={decrementMinutes}
              onPressIn={() =>
                startContinuousAction(
                  decrementMinutes,
                  minutesDecTimeoutRef,
                  minutesDecIntervalRef
                )
              }
              onPressOut={() => stopContinuousAction(minutesDecTimeoutRef, minutesDecIntervalRef)}
              onHoverIn={() => Platform.OS === 'web' && setMinutesDecHovered(true)}
              onHoverOut={() => Platform.OS === 'web' && setMinutesDecHovered(false)}
              android_ripple={{ color: '#cccccc' }}
            >
              <Ionicons name="chevron-down" size={20} color="#333333" />
            </Pressable>
            <Text style={styles.timeLabel}>{timeLabels.minutes}</Text>
          </View>
        </View>

        {/* Filter Tags Section */}
        <View style={styles.filtersContainer}>
          <FilterDropdown
            label={filters.placeLabel}
            selectedValue={selectedPlace}
            options={Object.values(TaskPlace)}
            onSelect={(value) => setSelectedPlace(value as TaskPlace)}
          />
          <FilterDropdown
            label={filters.modeLabel}
            selectedValue={selectedMode}
            options={Object.values(TaskMode)}
            onSelect={(value) => setSelectedMode(value as TaskMode)}
          />
          <FilterDropdown
            label={filters.toolLabel}
            selectedValue={selectedTool}
            options={Object.values(TaskTool)}
            onSelect={(value) => setSelectedTool(value as TaskTool[])}
            multiple
          />
        </View>

        {/* Main Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          testID="recommend-button"
          onPress={handleRecommend}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color="#2196f3" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>{actions.recommendButton}</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 40,
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    gap: 20,
  },
  timeGroup: {
    alignItems: 'center',
    gap: 8,
  },
  timeBox: {
    width: 80,
    height: 60,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333333',
  },
  timeLabel: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  circleButtonPressed: {
    backgroundColor: '#F0F0F0',
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2196f3',
    borderRadius: 999,
    paddingHorizontal: 32,
    paddingVertical: 16,
    minWidth: 250,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196f3',
  },
});
