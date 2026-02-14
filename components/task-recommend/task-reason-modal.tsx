import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskReasonModalProps {
  visible: boolean;
  taskTitle: string;
  reason: string;
  onClose: () => void;
}

export function TaskReasonModal({
  visible,
  taskTitle,
  reason,
  onClose,
}: TaskReasonModalProps) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      accessibilityViewIsModal
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={styles.modalCard}
          accessibilityViewIsModal
          accessibilityLabel="Task recommendation reason"
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{taskTitle}</Text>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <Text style={styles.reasonLabel}>推薦原因</Text>
            <ScrollView
              style={styles.reasonScrollView}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.reasonText}>{reason}</Text>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>關閉</Text>
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
    ...Platform.select({
      web: {
        pointerEvents: 'auto' as const,
      },
      default: {},
    }),
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
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 16,
  },
  modalContent: {
    flex: 1,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
  },
  reasonScrollView: {
    maxHeight: 400,
  },
  reasonText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333333',
    textAlign: 'left',
  },
  modalCloseBtn: {
    marginTop: 24,
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
