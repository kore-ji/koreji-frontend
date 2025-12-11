import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TagDisplayRow } from '@/components/ui/tag-display-row';
import { TimeDeadlineRow } from './time-deadline-row';
import { type LocalSubTask } from '@/types/add-task';

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
  onUpdate: (id: string, field: keyof LocalSubTask, value: string | Date | null) => void;
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
  onUpdate,
  onRemove,
  onDeadlinePress,
  onTagsEdit,
}: SubtaskCardProps) {
  return (
    <View style={styles.subtaskCard}>
      {/* Row 1: Title and Delete */}
      <View style={styles.stRowTop}>
        <TextInput
          style={styles.stTitleInput}
          placeholder={subtaskTitlePlaceholder}
          placeholderTextColor="#ccc"
          value={subtask.title}
          onChangeText={(text) => onUpdate(subtask.id, 'title', text)}
        />
        <TouchableOpacity onPress={() => onRemove(subtask.id)} style={styles.deleteBtn}>
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
          <TagDisplayRow tags={subtask.tags} onEdit={() => onTagsEdit(subtask.id)} tagGroupColors={tagGroupColors} />
        </View>
      </View>
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
});
