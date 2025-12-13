import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AddTaskFooterProps {
  onSubmit: () => void;
  submitButtonText: string;
  disabled?: boolean;
}

export function AddTaskFooter({ onSubmit, submitButtonText, disabled = false }: AddTaskFooterProps) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity
        style={[styles.submitBtn, disabled && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={disabled}
      >
        <Text style={[styles.submitBtnText, disabled && styles.submitBtnTextDisabled]}>
          {submitButtonText}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  submitBtn: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  submitBtnTextDisabled: {
    color: '#999',
  },
});

