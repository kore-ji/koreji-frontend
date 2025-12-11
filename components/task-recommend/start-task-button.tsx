import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TASK_RECOMMEND_STRINGS } from '@/constants/strings/task-recommend';

interface StartTaskButtonProps {
  onPress?: () => void;
}

export function StartTaskButton({ onPress }: StartTaskButtonProps) {
  return (
    <View style={styles.floatingButtonContainer}>
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={styles.floatingButton}
          activeOpacity={0.8}
          onPress={onPress}
        >
          <Ionicons name="play" size={20} color="#2196f3" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>
            {TASK_RECOMMEND_STRINGS.button.startTask}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  buttonWrapper: {
    width: '100%',
    paddingHorizontal: 24,
  },
  floatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196f3',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});



