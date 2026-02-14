import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagDisplayRow } from '@/components/ui/tag-display-row';
import { TimeDeadlineRow } from './time-deadline-row';
import { TASK_STATUSES, TASK_STATUS_COLORS } from '@/constants/task-status';
import { type LocalSubTask } from '@/types/add-task';
import { type TaskStatus } from '@/types/task-status';

interface SubtaskCardProps {
  subtask: LocalSubTask;
  index: number;
  tagGroupColors: { [groupName: string]: { bg: string; text: string } };
  timeLabel: string;
  deadlineLabel: string;
  minPlaceholder: string;
  deadlinePlaceholder: string;
  subtaskTitlePlaceholder: string;
  subtaskDescriptionPlaceholder: string;
  subtaskTagsLabel: string;
  statusLabel: string;
  statusPlaceholder: string;
  onUpdate: (
    id: string,
    field: keyof LocalSubTask,
    value: string | Date | null | TaskStatus
  ) => void;
  onRemove: (id: string) => void;
  onDeadlinePress: (id: string) => void;
  onTagsEdit: (id: string) => void;
}

export function SubtaskCard({
  subtask,
  tagGroupColors,
  timeLabel,
  deadlineLabel,
  minPlaceholder,
  deadlinePlaceholder,
  subtaskTitlePlaceholder,
  subtaskDescriptionPlaceholder,
  subtaskTagsLabel,
  statusLabel,
  statusPlaceholder,
  onUpdate,
  onRemove,
  onDeadlinePress,
  onTagsEdit,
}: SubtaskCardProps) {
  const [statusPickerVisible, setStatusPickerVisible] = React.useState(false);

  return (
    <View style={styles.subtaskCard}>
      {/* Row 1: Title, Status, and Delete */}
      <View style={styles.stRowTop}>
        <TextInput
          style={styles.stTitleInput}
          placeholder={subtaskTitlePlaceholder}
          placeholderTextColor="#ccc"
          value={subtask.title}
          onChangeText={(text) => onUpdate(subtask.id, 'title', text)}
        />
        <TouchableOpacity onPress={() => setStatusPickerVisible(true)}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: TASK_STATUS_COLORS[subtask.status].bg },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: TASK_STATUS_COLORS[subtask.status].text },
              ]}
            >
              {subtask.status}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onRemove(subtask.id)}
          style={styles.deleteBtn}
        >
          <Ionicons name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Row 2: Time and Deadline */}
      <TimeDeadlineRow
        time={subtask.estimatedTime}
        deadline={subtask.deadline}
        timeLabel={timeLabel}
        deadlineLabel={deadlineLabel}
        timePlaceholder={minPlaceholder}
        deadlinePlaceholder={deadlinePlaceholder}
        onTimeChange={(text) => onUpdate(subtask.id, 'estimatedTime', text)}
        onDeadlinePress={() => onDeadlinePress(subtask.id)}
      />

      {/* Row 3: Description */}
      <TextInput
        style={styles.stDescInput}
        placeholder={subtaskDescriptionPlaceholder}
        placeholderTextColor="#ccc"
        value={subtask.description}
        onChangeText={(text) => onUpdate(subtask.id, 'description', text)}
        multiline
      />

      {/* Row 4: Tags */}
      <View style={styles.stTagContainer}>
        <Text style={styles.label}>{subtaskTagsLabel}</Text>
        <View style={{ marginTop: 8 }}>
          <TagDisplayRow
            tags={subtask.tags}
            onEdit={() => onTagsEdit(subtask.id)}
            tagGroupColors={tagGroupColors}
          />
        </View>
      </View>

      {/* Status Picker Modal */}
      <Modal
        visible={statusPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusPickerVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setStatusPickerVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Status</Text>
              <TouchableOpacity onPress={() => setStatusPickerVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalOptions}>
              {TASK_STATUSES.map((statusOption) => {
                const isSelected = subtask.status === statusOption;
                return (
                  <TouchableOpacity
                    key={statusOption}
                    style={[
                      styles.statusOption,
                      { backgroundColor: TASK_STATUS_COLORS[statusOption].bg },
                      isSelected && styles.statusOptionSelected,
                    ]}
                    onPress={() => {
                      console.log(
                        '[Status Change] Subtask ID:',
                        subtask.id,
                        'New Status:',
                        statusOption
                      );
                      onUpdate(subtask.id, 'status', statusOption);
                      setStatusPickerVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        { color: TASK_STATUS_COLORS[statusOption].text },
                      ]}
                    >
                      {statusOption}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  subtaskCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 1,
    boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.05)',
  },
  stRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  stTitleInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4,
  },
  deleteBtn: {
    padding: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
  },
  stDescInput: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingVertical: 4,
  },
  stTagContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalOptions: {
    gap: 12,
  },
  statusOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  statusOptionSelected: {
    borderColor: '#2196f3',
  },
});
