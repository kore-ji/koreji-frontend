import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagChip } from './tag-chip';

interface TagSectionProps {
  title: string;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  selectedStyle?: ViewStyle;
  isMultiSelect?: boolean;
  selectedValues?: string[];
  onAddNew?: () => void;
}

export function TagSection({
  title,
  options,
  selectedValue,
  onSelect,
  selectedStyle,
  isMultiSelect = false,
  selectedValues = [],
  onAddNew,
}: TagSectionProps) {
  return (
    <>
      <Text style={styles.modalLabel}>{title}</Text>
      <View style={styles.chipContainer}>
        {options.map((option) => {
          const isSelected = isMultiSelect
            ? selectedValues.includes(option)
            : selectedValue === option;

          return (
            <TagChip
              key={option}
              label={option}
              isSelected={isSelected}
              onPress={() => onSelect(option)}
              selectedStyle={selectedStyle}
            />
          );
        })}
        {onAddNew && (
          <TouchableOpacity style={styles.addButton} onPress={onAddNew}>
            <Ionicons name="add" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  modalLabel: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: '#666',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
});
