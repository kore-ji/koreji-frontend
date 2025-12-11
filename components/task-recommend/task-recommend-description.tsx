import { View, Text, StyleSheet } from 'react-native';
import { TASK_RECOMMEND_STRINGS } from '@/constants/strings/task-recommend';

interface TaskRecommendDescriptionProps {
  totalMinutes: number;
}

export function TaskRecommendDescription({ totalMinutes }: TaskRecommendDescriptionProps) {
  return (
    <View style={styles.descriptionContainer}>
      <Text style={styles.descriptionText}>
        {TASK_RECOMMEND_STRINGS.description.prefix} {totalMinutes}{' '}
        {TASK_RECOMMEND_STRINGS.description.suffix}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionText: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
});



