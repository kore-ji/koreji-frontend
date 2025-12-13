import { Platform } from 'react-native';
import React, { useCallback } from 'react';

const HOVER_RESTORE_DELAY = 10;
const isWeb = Platform.OS === 'web';

// Shared interfaces
interface ContainerHandlersProps {
  hoveredSubtaskId: string | null;
  setHoveredTaskId: (id: string | null) => void;
  setHoveredSubtaskId: (id: string | null) => void;
}

interface EditableFieldHandlersProps extends ContainerHandlersProps {
  setHoveredField: (field: { taskId: string; field: 'title' | 'description' } | null) => void;
  setHoveredSubtaskField: (field: { subtaskId: string; field: 'title' | 'description' } | null) => void;
}

// Hook for task/subtask container hover
export function useContainerHandlers({
  hoveredSubtaskId,
  setHoveredTaskId,
  setHoveredSubtaskId,
}: ContainerHandlersProps) {
  return useCallback(
    (taskId: string | null, isSubtask: boolean = false) => {
      if (!isWeb) return {};
      return {
        onMouseEnter: () => {
          if (isSubtask) {
            setHoveredTaskId(null);
            if (taskId) setHoveredSubtaskId(taskId);
          } else {
            if (!hoveredSubtaskId && taskId) {
              setHoveredTaskId(taskId);
            }
          }
        },
        onMouseLeave: () => {
          if (isSubtask) {
            setHoveredSubtaskId(null);
            // Restore parent task hover when leaving subtask (if still in parent)
            if (taskId) {
              setTimeout(() => setHoveredTaskId(taskId), HOVER_RESTORE_DELAY);
            }
          } else {
            if (!hoveredSubtaskId) {
              setHoveredTaskId(null);
            }
          }
        },
      };
    },
    [hoveredSubtaskId, setHoveredTaskId, setHoveredSubtaskId]
  );
}

// Hook for editable fields (title/description) that need to clear container hover
export function useEditableFieldHandlers({
  hoveredSubtaskId,
  setHoveredTaskId,
  setHoveredSubtaskId,
  setHoveredField,
  setHoveredSubtaskField,
}: EditableFieldHandlersProps) {
  const restoreHover = useCallback(
    (taskId: string, isSubtask: boolean) => {
      setTimeout(() => {
        if (isSubtask) {
          setHoveredSubtaskId(taskId);
        } else {
          if (!hoveredSubtaskId) {
            setHoveredTaskId(taskId);
          }
        }
      }, HOVER_RESTORE_DELAY);
    },
    [hoveredSubtaskId, setHoveredTaskId, setHoveredSubtaskId]
  );

  const clearHoverState = useCallback(
    (isSubtask: boolean) => {
      if (isSubtask) {
        setHoveredSubtaskId(null);
      } else {
        setHoveredTaskId(null);
      }
    },
    [setHoveredTaskId, setHoveredSubtaskId]
  );

  return useCallback(
    (
      taskId: string,
      field: 'title' | 'description',
      isSubtask: boolean = false
    ) => {
      if (!isWeb) return {};
      return {
        onMouseEnter: (e: React.MouseEvent) => {
          e.stopPropagation();
          clearHoverState(isSubtask);
          if (isSubtask) {
            setHoveredSubtaskField({ subtaskId: taskId, field });
          } else {
            setHoveredField({ taskId, field });
          }
        },
        onMouseLeave: () => {
          if (isSubtask) {
            setHoveredSubtaskField(null);
          } else {
            setHoveredField(null);
          }
          restoreHover(taskId, isSubtask);
        },
      };
    },
    [clearHoverState, setHoveredField, setHoveredSubtaskField, restoreHover]
  );
}

// Hook for elements that just clear hover (tags, deadline)
export function useClearHoverHandlers({
  hoveredSubtaskId,
  setHoveredTaskId,
  setHoveredSubtaskId,
}: ContainerHandlersProps) {
  const restoreHover = useCallback(
    (taskId: string, isSubtask: boolean) => {
      setTimeout(() => {
        if (isSubtask) {
          setHoveredSubtaskId(taskId);
        } else {
          if (!hoveredSubtaskId) {
            setHoveredTaskId(taskId);
          }
        }
      }, HOVER_RESTORE_DELAY);
    },
    [hoveredSubtaskId, setHoveredTaskId, setHoveredSubtaskId]
  );

  const clearHoverState = useCallback(
    (isSubtask: boolean) => {
      if (isSubtask) {
        setHoveredSubtaskId(null);
      } else {
        setHoveredTaskId(null);
      }
    },
    [setHoveredTaskId, setHoveredSubtaskId]
  );

  return useCallback(
    (taskId: string, isSubtask: boolean = false) => {
      if (!isWeb) return {};
      return {
        onMouseEnter: (e: React.MouseEvent) => {
          e.stopPropagation();
          clearHoverState(isSubtask);
        },
        onMouseLeave: () => {
          restoreHover(taskId, isSubtask);
        },
      };
    },
    [clearHoverState, restoreHover]
  );
}

