import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface AddTaskFooterProps {
  onSubmit: () => void;
  submitButtonText: string;
}

export function AddTaskFooter({ onSubmit, submitButtonText }: AddTaskFooterProps) {
  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.submitBtn} onPress={onSubmit}>
        <Text style={styles.submitBtnText}>{submitButtonText}</Text>
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
});
