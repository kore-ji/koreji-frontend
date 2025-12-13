import { Modal, View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '@/utils/formatting/date';

interface DatePickerModalProps {
  visible: boolean;
  date: Date | null;
  onDateChange: (event: any, selectedDate?: Date) => void;
  onDone: () => void;
  onCancel: () => void;
  minimumDate?: Date;
}

export function DatePickerModal({
  visible,
  date,
  onDateChange,
  onDone,
  onCancel,
  minimumDate,
}: DatePickerModalProps) {
  if (!visible) return null;

  const currentDate = date || new Date();
  const minDate = minimumDate || new Date();

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayCentered}
          activeOpacity={1}
          onPress={onCancel}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.datePickerContainerCentered}>
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={onCancel}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDone}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.webDateInputContainer}>
                <Text style={styles.webDateLabel}>Select Deadline:</Text>
                <View style={styles.webDateInputWrapper}>
                  {/* @ts-ignore - web only */}
                  <input
                    type="date"
                    style={styles.webDateInputNative}
                    value={date ? formatDate(date) : ''}
                    min={minDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const newDate = new Date(e.target.value + 'T00:00:00');
                        if (!isNaN(newDate.getTime())) {
                          onDateChange({ type: 'set' }, newDate);
                        }
                      }
                    }}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayCentered}
          activeOpacity={1}
          onPress={onCancel}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.datePickerContainerCentered}>
              <View style={styles.datePickerActions}>
                <TouchableOpacity onPress={onCancel}>
                  <Text style={styles.datePickerCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onDone}>
                  <Text style={styles.datePickerDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerWrapper}>
                <DateTimePicker
                  value={currentDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  minimumDate={minDate}
                  style={styles.datePickerComponent}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  }

  // Android
  return (
    <DateTimePicker
      value={currentDate}
      mode="date"
      display="default"
      onChange={onDateChange}
      minimumDate={minDate}
    />
  );
}

const styles = StyleSheet.create({
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerContainerCentered: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: '90%',
    overflow: 'hidden',
    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.25)',
    elevation: 5,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  },
  datePickerWrapper: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
  },
  datePickerComponent: {
    width: '100%',
    maxWidth: '100%',
  },
  datePickerCancel: {
    color: '#666',
    fontSize: 16,
  },
  datePickerDone: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  },
  webDateInputContainer: {
    paddingVertical: 8,
    gap: 8,
    width: '100%',
  },
  webDateInputWrapper: {
    width: '100%',
    overflow: 'hidden',
  },
  webDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  webDateInputNative: {
    fontSize: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#333',
    width: '100%',
    maxWidth: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
});

