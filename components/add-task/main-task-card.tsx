import { View, Text, TextInput, StyleSheet } from 'react-native';
import { TagDisplayRow, type TaskTags } from '@/components/ui/tag-display-row';
import { TimeDeadlineRow } from './time-deadline-row';

interface MainTaskCardProps {
  title: string;
  description: string;
  time: string;
  deadline: Date | null;
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
  onTitleChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onTimeChange: (text: string) => void;
  onDeadlinePress: () => void;
  onTagsEdit: () => void;
}

export function MainTaskCard({
  title,
  description,
  time,
  deadline,
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
  onTitleChange,
  onDescriptionChange,
  onTimeChange,
  onDeadlinePress,
  onTagsEdit,
}: MainTaskCardProps) {
  return (
    <View style={[styles.subtaskCard, { marginBottom: 24 }]}>
      {/* Row 1: Title */}
      <View style={styles.stRowTop}>
        <TextInput
          style={styles.mainTaskTitleInput}
          placeholder={taskTitlePlaceholder}
          placeholderTextColor="#ccc"
          value={title}
          onChangeText={onTitleChange}
        />
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
          <TagDisplayRow tags={tags} onEdit={onTagsEdit} tagGroupColors={tagGroupColors} />
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
});
