import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, Pressable, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TaskMode, TaskPlace, TaskTool } from '@/constants/task-filters';
import { FilterDropdown } from '@/components/ui/filter-dropdown';

export default function HomeScreen() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(20);
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
    console.log('Recommend task pressed', { hours, minutes });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Text style={styles.headerText}>Now I have</Text>

        {/* Time Input Widget */}
        <View style={styles.timeContainer}>
          {/* Hours Group */}
          <View style={styles.timeGroup}>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue}>{formatTime(hours)}</Text>
            </View>
            <Text style={styles.timeLabel}>hrs</Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={styles.circleButton}
                onPress={decrementHours}
                android_ripple={{ color: '#cccccc' }}
              >
                <Ionicons name="remove" size={20} color="#333333" />
              </Pressable>
              <Pressable
                style={styles.circleButton}
                onPress={incrementHours}
                android_ripple={{ color: '#cccccc' }}
              >
                <Ionicons name="add" size={20} color="#333333" />
              </Pressable>
            </View>
          </View>

          {/* Minutes Group */}
          <View style={styles.timeGroup}>
            <View style={styles.timeBox}>
              <Text style={styles.timeValue}>{formatTime(minutes)}</Text>
            </View>
            <Text style={styles.timeLabel}>mins</Text>
            <View style={styles.buttonRow}>
              <Pressable
                style={styles.circleButton}
                onPress={decrementMinutes}
                android_ripple={{ color: '#cccccc' }}
              >
                <Ionicons name="remove" size={20} color="#333333" />
              </Pressable>
              <Pressable
                style={styles.circleButton}
                onPress={incrementMinutes}
                android_ripple={{ color: '#cccccc' }}
              >
                <Ionicons name="add" size={20} color="#333333" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Filter Tags Section */}
        <View style={styles.filtersContainer}>
          <FilterDropdown
            label="Place"
            selectedValue={selectedPlace}
            options={Object.values(TaskPlace)}
            onSelect={(value) => setSelectedPlace(value as TaskPlace)}
          />
          <FilterDropdown
            label="Mode"
            selectedValue={selectedMode}
            options={Object.values(TaskMode)}
            onSelect={(value) => setSelectedMode(value as TaskMode)}
          />
          <FilterDropdown
            label="Tool"
            selectedValue={selectedTool}
            options={Object.values(TaskTool)}
            onSelect={(value) => setSelectedTool(value as TaskTool[])}
            multiple
          />
        </View>

        {/* Main Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRecommend}
          activeOpacity={0.8}
        >
          <Ionicons name="play" size={20} color="#2196f3" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Recommend task for me</Text>
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
    gap: 12,
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
