import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { TagDisplayRow, type TaskTags } from '@/components/ui/tag-display-row';
import { TimeDeadlineRow } from './time-deadline-row';
import { TASK_STATUSES, TASK_STATUS_COLORS } from '@/constants/task-status';
import { type TaskStatus } from '@/types/task-status';
import { Ionicons } from '@expo/vector-icons';

interface MainTaskCardProps {
  title: string;
  description: string;
  time: string;
  deadline: Date | null;
  status: TaskStatus;
  tags: TaskTags;
  isTimeReadOnly: boolean;
  calculatedTotalTime: string;
  tagGroupColors: { [groupName: string]: { bg: string; text: string } };
  taskTitlePlaceholder: string;
  descriptionPlaceholder: string;
  timeLabel: string;
  deadlineLabel: string;
  minPlaceholder: string;
  deadlinePlaceholder: string;
  tagsLabel: string;
  statusLabel: string;
  statusPlaceholder: string;
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onTimeChange: (text: string) => void;
  onDeadlinePress: () => void;
  onStatusChange: (status: TaskStatus) => void;
  onTagsEdit: () => void;
}

export function MainTaskCard({
  title,
  description,
  time,
  deadline,
  status,
  tags,
  isTimeReadOnly,
  calculatedTotalTime,
  tagGroupColors,
  taskTitlePlaceholder,
  descriptionPlaceholder,
  timeLabel,
  deadlineLabel,
  minPlaceholder,
  deadlinePlaceholder,
  tagsLabel,
  statusLabel,
  statusPlaceholder,
  onTitleChange,
  onDescriptionChange,
  onTimeChange,
  onDeadlinePress,
  onStatusChange,
  onTagsEdit,
}: MainTaskCardProps) {
  const [statusPickerVisible, setStatusPickerVisible] = React.useState(false);

  return (
    <View style={[styles.subtaskCard, { marginBottom: 24 }]}>
      {/* Row 1: Title and Status */}
      <View style={styles.stRowTop}>
        <TextInput
          style={styles.mainTaskTitleInput}
          placeholder={taskTitlePlaceholder}
          placeholderTextColor="#ccc"
          value={title}
          onChangeText={onTitleChange}
        />
        <TouchableOpacity onPress={() => setStatusPickerVisible(true)}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: TASK_STATUS_COLORS[status].bg },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: TASK_STATUS_COLORS[status].text },
              ]}
            >
              {status}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Row 2: Time and Deadline */}
      <TimeDeadlineRow
        time={time}
        deadline={deadline}
        timeLabel={timeLabel}
        deadlineLabel={deadlineLabel}
        timePlaceholder={minPlaceholder}
        deadlinePlaceholder={deadlinePlaceholder}
        isTimeReadOnly={isTimeReadOnly}
        calculatedTime={calculatedTotalTime}
        onTimeChange={onTimeChange}
        onDeadlinePress={onDeadlinePress}
      />

      {/* Row 3: Description */}
      <TextInput
        style={styles.stDescInput}
        placeholder={descriptionPlaceholder}
        placeholderTextColor="#ccc"
        value={description}
        onChangeText={onDescriptionChange}
        multiline
      />

      {/* Row 4: Tags */}
      <View style={styles.stTagContainer}>
        <Text style={styles.label}>{tagsLabel}</Text>
        <View style={{ marginTop: 8 }}>
          <TagDisplayRow
            tags={tags}
            onEdit={onTagsEdit}
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
                const isSelected = status === statusOption;
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
                        '[Status Change] Main Task - New Status:',
                        statusOption
                      );
                      onStatusChange(statusOption);
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
  mainTaskTitleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4,
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
