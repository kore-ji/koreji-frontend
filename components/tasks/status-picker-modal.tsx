import { Modal, Pressable, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TASK_STATUSES, TASK_STATUS_COLORS } from '@/constants/task-status';
import { type TaskStatus } from '@/types/task-status';
import { type TaskItem } from '@/types/tasks';
import { tasksStyles } from '@/styles/tasks.styles';

interface StatusPickerModalProps {
  visible: boolean;
  taskId: string | null;
  tasks: TaskItem[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onClose: () => void;
}

export function StatusPickerModal({
  visible,
  taskId,
  tasks,
  onStatusChange,
  onClose,
}: StatusPickerModalProps) {
  const currentTask = taskId ? tasks.find((t) => t.id === taskId) : null;
  const currentStatus = currentTask?.status;

  const handleStatusSelect = (status: TaskStatus) => {
    if (taskId) {
      console.log('[Status Change] Task ID:', taskId, 'New Status:', status);
      onStatusChange(taskId, status);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      accessibilityViewIsModal
      onRequestClose={onClose}
    >
      <Pressable
        style={tasksStyles.modalOverlay}
        onPress={onClose}
        accessibilityLabel="Close modal"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={tasksStyles.modalContent}
          accessibilityViewIsModal
          accessibilityLabel="Select task status"
        >
          <View style={tasksStyles.modalHeader}>
            <Text style={tasksStyles.modalTitle}>Select Status</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={tasksStyles.modalOptions}>
            {TASK_STATUSES.map((status) => {
              const isSelected = currentStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    tasksStyles.statusOption,
                    { backgroundColor: TASK_STATUS_COLORS[status].bg },
                    isSelected && tasksStyles.statusOptionSelected,
                  ]}
                  onPress={() => handleStatusSelect(status)}
                >
                  <Text
                    style={[
                      tasksStyles.statusOptionText,
                      { color: TASK_STATUS_COLORS[status].text },
                    ]}
                  >
                    {status}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
