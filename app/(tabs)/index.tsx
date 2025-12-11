import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Pressable, View, Text } from 'react-native';
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

  const [selectedMode, setSelectedMode] = useState<TaskMode>(TaskMode.NO_SELECT);
  const [selectedPlace, setSelectedPlace] = useState<TaskPlace>(TaskPlace.NO_SELECT);
  const [selectedTool, setSelectedTool] = useState<TaskTool[]>([TaskTool.NO_SELECT]);
  const [customPlace, setCustomPlace] = useState<string>('');

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
    const MAX_PLACE_LENGTH = 30;
    let placeValue: string | TaskPlace = selectedPlace;
    
    if (selectedPlace === TaskPlace.OTHER && customPlace.trim()) {
      // Validate and limit the custom place value before using it
      const trimmedPlace = customPlace.trim();
      if (trimmedPlace.length > MAX_PLACE_LENGTH) {
        // Prevent API call with invalid input - truncate to max length
        placeValue = trimmedPlace.slice(0, MAX_PLACE_LENGTH);
      } else {
        placeValue = trimmedPlace;
      }
    }
    
    console.log(actions.recommendLog, {
      time: `${hours * 60 + minutes}`, // total minutes
      place: placeValue,
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
                pressed && styles.circleButtonPressed,
              ]}
              testID="increment-hours"
              onPress={incrementHours}
              hitSlop={8}
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
                pressed && styles.circleButtonPressed,
              ]}
              testID="decrement-hours"
              onPress={decrementHours}
              hitSlop={8}
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
                pressed && styles.circleButtonPressed,
              ]}
              testID="increment-minutes"
              onPress={incrementMinutes}
              hitSlop={8}
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
                pressed && styles.circleButtonPressed,
              ]}
              testID="decrement-minutes"
              onPress={decrementMinutes}
              hitSlop={8}
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
            otherOptionValue={customPlace}
            onOtherValueChange={setCustomPlace}
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
