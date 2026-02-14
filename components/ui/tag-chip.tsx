import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

interface TagChipProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  selectedStyle?: ViewStyle;
}

export function TagChip({
  label,
  isSelected,
  onPress,
  selectedStyle,
}: TagChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, styles.chipOutline, isSelected && selectedStyle]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
  },
  chipOutline: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chipTextSelected: {
    color: '#fff',
  },
});
