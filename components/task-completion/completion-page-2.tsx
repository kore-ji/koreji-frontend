import { View, Text, StyleSheet } from 'react-native';

interface CompletionPage2Props {
  elapsedMinutes: number;
}

export function CompletionPage2({ elapsedMinutes }: CompletionPage2Props) {
  return (
    <View style={styles.container}>
      {/* Total Time Spent Heading */}
      <Text style={styles.totalTimeHeading}>Total Time Spent</Text>

      {/* Time Display */}
      <Text style={styles.timeDisplay}>{elapsedMinutes} minutes</Text>

      {/* Encouragement Message */}
      <Text style={styles.momentumText}>{'You\'re building momentum!'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalTimeHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 32,
  },
  timeDisplay: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 64,
  },
  momentumText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '400',
  },
});
