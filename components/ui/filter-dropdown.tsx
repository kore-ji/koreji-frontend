import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FilterDropdownProps<T extends string> = {
  label: string;
  selectedValue: T | T[];
  options: readonly T[];
  onSelect: (value: T | T[]) => void;
  multiple?: boolean;
  otherOptionValue?: string;
  onOtherValueChange?: (value: string) => void;
  maxInputLength?: number;
  onAddNew?: {
    showInput: boolean;
    inputValue: string;
    onInputChange: (value: string) => void;
    onSave: () => void;
    onCancel: () => void;
    placeholder?: string;
  };
};

const DEFAULT_MAX_INPUT_LENGTH = 30;

export function FilterDropdown<T extends string>({
  label,
  selectedValue,
  options,
  onSelect,
  multiple = false,
  otherOptionValue = '',
  onOtherValueChange,
  maxInputLength = DEFAULT_MAX_INPUT_LENGTH,
  onAddNew,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedValues = multiple
    ? (selectedValue as T[])
    : ([selectedValue].filter(Boolean) as T[]);

  const isOtherSelected = !multiple && selectedValue === 'Other';

  const handleOtherValueChange = (text: string) => {
    if (onOtherValueChange) {
      // Limit input to maxInputLength characters
      const limitedText = text.slice(0, maxInputLength);
      onOtherValueChange(limitedText);
    }
  };

  const currentLength = otherOptionValue?.length || 0;
  const isAtLimit = currentLength >= maxInputLength;

  const handleSelect = (value: T) => {
    if (multiple) {
      const currentValues = selectedValues;
      const isSelected = currentValues.includes(value);
      if (isSelected) {
        // Remove from selection
        const newValues = currentValues.filter((v) => v !== value);
        onSelect(newValues.length > 0 ? newValues : ([options[0]] as T[]));
      } else {
        // Add to selection (but exclude NO_SELECT if selecting something else)
        const filtered = currentValues.filter((v) => v !== (options[0] as T));
        onSelect([...filtered, value] as T[]);
      }
    } else {
      onSelect(value);
      // Keep modal open if "Other" is selected to allow text input
      if (value !== 'Other') {
        setIsOpen(false);
      }
    }
  };

  const getDisplayText = (): string => {
    if (multiple) {
      const noSelectOption = options[0] as T;
      const values = selectedValues.filter((v) => v !== noSelectOption);
      // If only NO_SELECT is selected, show it
      if (values.length === 0 && selectedValues.includes(noSelectOption)) {
        return noSelectOption;
      }
      // If no selections, show NO_SELECT
      if (values.length === 0) {
        return noSelectOption;
      }
      // If single selection, show it
      if (values.length === 1) {
        return values[0];
      }
      // If multiple selections, show count
      return `${values.length} selected`;
    }
    // If "Other" is selected and has a custom value, show the custom value
    if (isOtherSelected && otherOptionValue.trim()) {
      return otherOptionValue;
    }
    return selectedValue as string;
  };

  return (
    <View style={styles.filterItem}>
      <Text style={styles.filterLabel}>{label}</Text>
      <Pressable
        style={styles.filterValueBox}
        onPress={() => setIsOpen(true)}
        testID={`filter-dropdown-${label.toLowerCase()}`}
      >
        <View style={styles.textContainer}>
          <Text
            style={styles.filterValue}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {getDisplayText()}
          </Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={16}
          color="#666666"
          style={styles.chevron}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            // Prevent closing when "Other" is selected and no input provided
            if (!isOtherSelected || otherOptionValue?.trim()) {
              setIsOpen(false);
            }
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
            testID="filter-modal"
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} testID="filter-modal-title">
                Select {label}
              </Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#333333" />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = multiple
                  ? selectedValues.includes(item)
                  : selectedValue === item;
                const isOther = item === 'Other';
                return (
                  <View>
                    <TouchableOpacity
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name={multiple ? 'checkbox' : 'checkmark'}
                          size={20}
                          color="#4CAF50"
                        />
                      )}
                    </TouchableOpacity>
                    {isOther &&
                      isSelected &&
                      !multiple &&
                      onOtherValueChange && (
                        <View style={styles.otherInputContainer}>
                          <TextInput
                            style={[
                              styles.otherInput,
                              isAtLimit && styles.otherInputWarning,
                            ]}
                            placeholder="Enter place..."
                            placeholderTextColor="#999999"
                            value={otherOptionValue}
                            onChangeText={handleOtherValueChange}
                            maxLength={maxInputLength}
                            autoFocus={false}
                            testID="filter-other-input"
                          />
                          {isAtLimit && (
                            <View style={styles.inputInfoContainer}>
                              <Text
                                style={styles.inputWarningText}
                                testID="input-warning-text"
                              >
                                Maximum length reached
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                  </View>
                );
              }}
              ListFooterComponent={
                onAddNew ? (
                  <View>
                    {onAddNew.showInput ? (
                      <View style={styles.newPlaceInputContainer}>
                        <TextInput
                          style={styles.newPlaceInput}
                          placeholder={onAddNew.placeholder || 'New item...'}
                          value={onAddNew.inputValue}
                          onChangeText={onAddNew.onInputChange}
                          autoFocus
                          onSubmitEditing={onAddNew.onSave}
                        />
                        <TouchableOpacity
                          style={styles.savePlaceBtn}
                          onPress={onAddNew.onSave}
                          disabled={!onAddNew.inputValue.trim()}
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={
                              onAddNew.inputValue.trim() ? '#4CAF50' : '#ccc'
                            }
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelPlaceBtn}
                          onPress={onAddNew.onCancel}
                        >
                          <Ionicons name="close" size={16} color="#666" />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.addNewItemButton}
                        onPress={() => {
                          // Trigger parent to show input by setting a trigger value
                          onAddNew.onInputChange('__SHOW_INPUT__');
                        }}
                      >
                        <Ionicons
                          name="add"
                          size={20}
                          color="#666"
                          style={{ marginRight: 8 }}
                        />
                        <Text style={styles.addNewItemText}>Add New</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null
              }
            />
            {(multiple || isOtherSelected) && (
              <View style={styles.modalFooter}>
                <Pressable
                  style={[
                    styles.doneButton,
                    isOtherSelected &&
                      !otherOptionValue?.trim() &&
                      styles.doneButtonDisabled,
                  ]}
                  onPress={() => setIsOpen(false)}
                  disabled={isOtherSelected && !otherOptionValue?.trim()}
                  testID="filter-modal-done-button"
                >
                  <Text
                    style={[
                      styles.doneButtonText,
                      isOtherSelected &&
                        !otherOptionValue?.trim() &&
                        styles.doneButtonTextDisabled,
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  filterItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: '100%',
    height: 56,
    gap: 4,
  },
  filterValue: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
  },
  chevron: {
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionItemSelected: {
    backgroundColor: '#F0F8F0',
  },
  optionText: {
    fontSize: 16,
    color: '#333333',
  },
  optionTextSelected: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  doneButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  doneButtonTextDisabled: {
    color: '#999999',
  },
  otherInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
  },
  otherInput: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  otherInputWarning: {
    borderColor: '#FF9800',
  },
  inputInfoContainer: {
    marginTop: 8,
  },
  inputWarningText: {
    fontSize: 12,
    color: '#F44336',
    fontWeight: '500',
  },
  newPlaceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#009688',
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 20,
    marginVertical: 12,
  },
  newPlaceInput: {
    minWidth: 100,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  savePlaceBtn: {
    padding: 4,
  },
  cancelPlaceBtn: {
    padding: 4,
  },
  addNewItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addNewItemText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
});
