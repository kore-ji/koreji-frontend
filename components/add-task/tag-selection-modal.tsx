import { Modal, View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type TaskTags } from '@/components/ui/tag-display-row';
import { TAG_GROUPS, TAG_GROUP_COLORS } from '@/constants/task-tags';

interface TagSelectionModalProps {
  visible: boolean;
  editingTarget: 'main' | string | null;
  tempTags: TaskTags;
  tagGroups: { [groupName: string]: string[] };
  tagGroupOrder: string[];
  tagGroupColors: { [groupName: string]: { bg: string; text: string } };
  editingTagInGroup: { groupName: string } | null;
  newTagInGroupName: string;
  showTagGroupInput: boolean;
  newTagGroupName: string;
  selectTagsTitle: string;
  newTagPlaceholder: string;
  newTagGroupPlaceholder: string;
  confirmButtonText: string;
  onClose: () => void;
  onToggleTag: (groupName: string, tag: string) => void;
  onAddTagToGroup: (groupName: string) => void;
  onSaveTagToGroup: () => void;
  onCancelTagInGroup: () => void;
  onNewTagInGroupNameChange: (text: string) => void;
  onAddNewTagGroup: () => void;
  onSaveNewTagGroup: () => void;
  onCancelTagGroup: () => void;
  onNewTagGroupNameChange: (text: string) => void;
  onSave: () => void;
}

export function TagSelectionModal({
  visible,
  editingTarget,
  tempTags,
  tagGroups,
  tagGroupOrder,
  tagGroupColors,
  editingTagInGroup,
  newTagInGroupName,
  showTagGroupInput,
  newTagGroupName,
  selectTagsTitle,
  newTagPlaceholder,
  newTagGroupPlaceholder,
  confirmButtonText,
  onClose,
  onToggleTag,
  onAddTagToGroup,
  onSaveTagToGroup,
  onCancelTagInGroup,
  onNewTagInGroupNameChange,
  onAddNewTagGroup,
  onSaveNewTagGroup,
  onCancelTagGroup,
  onNewTagGroupNameChange,
  onSave,
}: TagSelectionModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectTagsTitle}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 400 }}>
            {/* All Tag Groups */}
            {tagGroupOrder
              .filter((groupName) => {
                // Exclude Category for subtasks
                if (editingTarget !== 'main' && groupName === 'Category') {
                  return false;
                }
                return true;
              })
              .map((groupName) => {
                const tags = tagGroups[groupName];
                if (!tags) return null;
                const groupConfig = TAG_GROUPS[groupName] || { isSingleSelect: false, allowAddTags: true };
                const isSingleSelect = groupConfig.isSingleSelect;
                const allowAddTags = groupConfig.allowAddTags;
                const selectedTags = tempTags.tagGroups?.[groupName] || [];
                const isSelected = isSingleSelect ? selectedTags.length > 0 && selectedTags[0] : null;

                return (
                  <View key={groupName}>
                    <Text style={styles.modalLabel}>{groupName}</Text>
                    <View style={styles.chipContainer}>
                      {tags.map((tag) => {
                        const tagIsSelected = isSingleSelect
                          ? isSelected === tag
                          : selectedTags.includes(tag);

                        // Get color for this tag group
                        const groupColor = tagGroupColors[groupName] || TAG_GROUP_COLORS[0];
                        const selectedStyle = {
                          backgroundColor: groupColor.bg,
                          borderColor: groupColor.text,
                        };
                        const selectedTextStyle = {
                          color: groupColor.text,
                        };

                        return (
                          <TouchableOpacity
                            key={tag}
                            style={[styles.chip, styles.chipOutline, tagIsSelected && selectedStyle]}
                            onPress={() => onToggleTag(groupName, tag)}
                          >
                            <Text style={[styles.chipText, tagIsSelected && selectedTextStyle]}>
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {allowAddTags &&
                        (editingTagInGroup?.groupName === groupName ? (
                          <View style={styles.newPlaceInputContainer}>
                            <TextInput
                              style={styles.newPlaceInput}
                              placeholder={newTagPlaceholder}
                              placeholderTextColor="#ccc"
                              value={newTagInGroupName}
                              onChangeText={onNewTagInGroupNameChange}
                              autoFocus
                              onSubmitEditing={onSaveTagToGroup}
                            />
                            <TouchableOpacity style={styles.savePlaceBtn} onPress={onSaveTagToGroup}>
                              <Ionicons name="checkmark" size={16} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelPlaceBtn} onPress={onCancelTagInGroup}>
                              <Ionicons name="close" size={16} color="#666" />
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => onAddTagToGroup(groupName)}
                          >
                            <Ionicons name="add" size={18} color="#666" />
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                );
              })}

            {/* Add New Tag Group */}
            {showTagGroupInput ? (
              <View style={styles.newPlaceInputContainer}>
                <TextInput
                  style={styles.newPlaceInput}
                  placeholder={newTagGroupPlaceholder}
                  placeholderTextColor="#ccc"
                  value={newTagGroupName}
                  onChangeText={onNewTagGroupNameChange}
                  autoFocus
                  onSubmitEditing={onSaveNewTagGroup}
                />
                <TouchableOpacity style={styles.savePlaceBtn} onPress={onSaveNewTagGroup}>
                  <Ionicons name="checkmark" size={16} color="#4CAF50" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelPlaceBtn} onPress={onCancelTagGroup}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.chipContainer, { marginTop: 16 }]}>
                <TouchableOpacity style={styles.addTagGroupButton} onPress={onAddNewTagGroup}>
                  <Ionicons name="add" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.modalSaveBtn} onPress={onSave}>
            <Text style={styles.submitBtnText}>{confirmButtonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
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
  addTagGroupButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    marginLeft: 4,
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
  },
  newPlaceInput: {
    minWidth: 100,
    fontSize: 14,
    color: '#333',
  },
  savePlaceBtn: {
    padding: 4,
  },
  cancelPlaceBtn: {
    padding: 4,
  },
  modalSaveBtn: {
    marginTop: 24,
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
