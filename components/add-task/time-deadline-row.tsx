import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '@/utils/formatting/date';

interface TimeDeadlineRowProps {
  time: string;
  deadline: Date | null;
  timeLabel: string;
  deadlineLabel: string;
  timePlaceholder: string;
  deadlinePlaceholder: string;
  isTimeReadOnly?: boolean;
  calculatedTime?: string;
  onTimeChange: (text: string) => void;
  onDeadlinePress: () => void;
}

export function TimeDeadlineRow({
  time,
  deadline,
  timeLabel,
  deadlineLabel,
  timePlaceholder,
  deadlinePlaceholder,
  isTimeReadOnly = false,
  calculatedTime,
  onTimeChange,
  onDeadlinePress,
}: TimeDeadlineRowProps) {
  const displayTime = isTimeReadOnly && calculatedTime ? calculatedTime : time;

  return (
    <View style={styles.timeDeadlineSection}>
      <View style={styles.timeDeadlineRow}>
        <View style={styles.timeFieldContainer}>
          <Text style={styles.fieldLabel}>{timeLabel}</Text>
          <View style={[styles.stTimeContainer, isTimeReadOnly && styles.timeBoxDisabled]}>
            <TextInput
              style={[styles.stTimeInput, isTimeReadOnly && { color: '#888' }]}
              keyboardType="numeric"
              value={displayTime}
              onChangeText={onTimeChange}
              editable={!isTimeReadOnly}
              placeholder={timePlaceholder}
              placeholderTextColor="#ccc"
            />
          </View>
        </View>
        <View style={styles.deadlineFieldContainer}>
          <Text style={styles.fieldLabel}>{deadlineLabel}</Text>
          <TouchableOpacity style={styles.deadlineContainer} onPress={onDeadlinePress}>
            <Text style={[styles.deadlineInput, !deadline && styles.deadlinePlaceholder]}>
              {deadline ? formatDate(deadline) : deadlinePlaceholder}
            </Text>
            <Ionicons name="calendar-outline" size={16} color="#666" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  timeDeadlineSection: {
    marginBottom: 8,
  },
  timeDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    flexWrap: 'wrap',
  },
  timeFieldContainer: {
    flex: 1,
    minWidth: 120,
  },
  deadlineFieldContainer: {
    flex: 1,
    minWidth: 120,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  stTimeContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fafafa',
    paddingVertical: 2,
  },
  timeBoxDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  stTimeInput: {
    textAlign: 'left',
    fontSize: 14,
    color: '#333',
    paddingHorizontal: 8,
  },
  deadlineContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fafafa',
    paddingVertical: 2,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlineInput: {
    fontSize: 14,
    color: '#333',
  },
  deadlinePlaceholder: {
    color: '#ccc',
  },
});

