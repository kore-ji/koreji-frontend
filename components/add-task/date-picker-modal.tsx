import { Modal, View, Text, TouchableOpacity, Platform, StyleSheet, useWindowDimensions, ViewStyle, TextStyle } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { formatDate } from '@/utils/formatting/date';
import { MOBILE_MAX, TABLET_MAX } from '@/constants/breakpoints';

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
  const { width } = useWindowDimensions();
  const isMobile = width <= MOBILE_MAX;
  const isTablet = width > MOBILE_MAX && width <= TABLET_MAX;

  if (!visible) return null;

  const currentDate = date || new Date();
  const minDate = minimumDate || new Date();

  // Calculate responsive styles
  const containerStyle = [
    styles.datePickerContainerCentered,
    isMobile && styles.datePickerContainerMobile,
    isTablet && styles.datePickerContainerTablet,
  ];

  if (Platform.OS === 'web') {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlayCentered}
          activeOpacity={1}
          onPress={onCancel}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={containerStyle}>
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
            <View style={containerStyle}>
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
    ...Platform.select({
      web: {
        padding: 16,
        pointerEvents: 'auto' as const,
      },
      default: {
        padding: 20,
      },
    }),
  } as ViewStyle,
  datePickerContainerCentered: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: '95%',
    minWidth: 300,
    overflow: 'hidden',
    boxShadow: '0px 2px 8px 0px rgba(0, 0, 0, 0.25)',
    elevation: 5,
    ...Platform.select({
      web: {
        maxWidth: 600,
        width: 'auto',
        minWidth: 280,
      },
      default: {},
    }),
  } as ViewStyle,
  datePickerContainerMobile: {
    padding: 16,
    borderRadius: 16,
    minWidth: 280,
    ...Platform.select({
      web: {
        maxWidth: 'calc(100% - 32px)',
        width: 'auto',
        minWidth: 280,
      },
      default: {
        maxWidth: '95%',
      },
    }),
  } as ViewStyle,
  datePickerContainerTablet: {
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 500,
        width: 'auto',
      },
      default: {
        maxWidth: '90%',
      },
    }),
  } as ViewStyle,
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    alignItems: 'center',
  } as ViewStyle,
  datePickerWrapper: {
    width: '100%',
    overflow: 'hidden',
    alignItems: 'center',
  } as ViewStyle,
  datePickerComponent: {
    width: '100%',
    maxWidth: '100%',
  } as ViewStyle,
  datePickerCancel: {
    color: '#666',
    fontSize: 16,
  } as TextStyle,
  datePickerDone: {
    color: '#2196f3',
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
  webDateInputContainer: {
    paddingVertical: 12,
    gap: 12,
    width: '100%',
  } as ViewStyle,
  webDateInputWrapper: {
    width: '100%',
    overflow: 'hidden',
  } as ViewStyle,
  webDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  } as TextStyle,
  webDateInputNative: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    color: '#333',
    width: '100%',
    maxWidth: '100%',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    minHeight: 44,
  } as any, // Web-specific CSS properties for native input element
});

