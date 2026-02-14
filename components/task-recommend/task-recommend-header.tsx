import { View, Text, StyleSheet } from 'react-native';
import { TASK_RECOMMEND_STRINGS } from '@/constants/strings/task-recommend';

export function TaskRecommendHeader() {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>
        {TASK_RECOMMEND_STRINGS.header.title}
      </Text>
      <Text style={styles.headerSubtitle}>
        {TASK_RECOMMEND_STRINGS.header.subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
});
