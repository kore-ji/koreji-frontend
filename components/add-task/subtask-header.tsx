import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SubtaskHeaderProps {
  sectionTitle: string;
  aiGenerateButtonText: string;
  addSubtaskButtonText: string;
  onAIGenerate: () => void;
  onAddSubtask: () => void;
  aiLoading?: boolean;
}

export function SubtaskHeader({
  sectionTitle,
  aiGenerateButtonText,
  addSubtaskButtonText,
  onAIGenerate,
  onAddSubtask,
  aiLoading = false,
}: SubtaskHeaderProps) {
  return (
    <View style={styles.subtaskHeader}>
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.aiButton, aiLoading && styles.aiButtonDisabled]}
          onPress={onAIGenerate}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <ActivityIndicator
              size="small"
              color="#fff"
              style={{ marginRight: 4 }}
            />
          ) : (
            <Ionicons
              name="sparkles"
              size={16}
              color="#fff"
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={styles.aiButtonText}>{aiGenerateButtonText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddSubtask}
          style={styles.addSubtaskButton}
        >
          <Text style={styles.addLink}>{addSubtaskButtonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  subtaskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 24,
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  addSubtaskButton: {
    flexShrink: 0,
  },
  addLink: {
    color: '#2196f3',
    fontWeight: '600',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    elevation: 2,
    boxShadow: '0px 2px 3px 0px rgba(156, 39, 176, 0.3)',
    flexShrink: 0,
  },
  aiButtonDisabled: {
    opacity: 0.7,
  },
  aiButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
