import { StyleSheet, Platform } from 'react-native';

export const tasksStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontWeight: 'bold', color: '#333' },
  listContent: { paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease-in-out',
        cursor: 'pointer',
      },
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  cardHovered: {
    ...Platform.select({
      web: {
        backgroundColor: '#f5f9ff',
        borderColor: '#2196f3',
        boxShadow: '0px 4px 6px 0px rgba(33, 150, 243, 0.15)',
      },
      default: {},
    }),
  },
  editableFieldHovered: {
    ...Platform.select({
      web: {
        backgroundColor: '#f5f9ff',
        borderBottomColor: '#2196f3',
      },
      default: {},
    }),
  },
  taskHeader: {
    gap: 8,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
  },
  titleContainer: { flex: 1 },
  expandButton: { padding: 4 },

  // Editable Styles
  inputWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#2196f3',
    paddingBottom: 2,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  taskDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingVertical: 4,
    minHeight: 20,
  },

  // Progress & Time
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: { fontSize: 12, color: '#888', width: 36, textAlign: 'right' },

  totalTimeBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalTimeText: { fontSize: 12, fontWeight: '600', color: '#555' },

  // Subtasks
  subtaskList: { paddingVertical: 4, gap: 12 },
  subtaskContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3px 0px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease-in-out',
      },
      default: {
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  subtaskContainerHovered: {
    ...Platform.select({
      web: {
        backgroundColor: '#f5f9ff',
        borderColor: '#2196f3',
        boxShadow: '0px 4px 6px 0px rgba(33, 150, 243, 0.15)',
      },
      default: {},
    }),
  },
  subtaskRow: { flexDirection: 'row', alignItems: 'flex-start' },
  subtaskContent: { flex: 1, marginLeft: 0, gap: 8 },
  subtaskHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  subtaskText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 4,
  },
  subtaskDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    paddingVertical: 4,
  },
  completedText: { textDecorationLine: 'line-through', color: '#aaa' },
  subtaskMetaRow: { marginTop: 8 },
  subtaskMetaContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
    gap: 6,
  },
  subtaskTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  subtaskTimeDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },

  // Tags & Time Editing
  tagsContainer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f9f9f9',
    marginTop: 8,
  },
  tagsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 0,
  },
  subtaskTagsContainer: {
    marginTop: 0,
  },
  tagsPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  tagChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  editIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f2f2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTagContainer: { borderBottomWidth: 1, borderBottomColor: '#ccc' },
  tagTime: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 20,
  },
  tagUnit: { fontSize: 12, color: '#888', marginRight: 4 },
  clockIcon: { fontSize: 12 },
  singleTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  singleTimeDeadlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 12,
  },
  deadlineDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deadlineText: {
    fontSize: 13,
    color: '#666',
  },

  // Status Badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
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

  // Status Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        pointerEvents: 'auto' as const,
      },
      default: {},
    }),
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

  fab: {
    position: 'absolute',
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  infoBanner: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoText: { color: '#0D47A1', fontSize: 13 },
  errorBanner: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  errorText: { color: '#B71C1C', fontSize: 13 },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#eee',
    ...Platform.select({
      web: { boxShadow: '0 4px 8px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      },
    }),
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'center',
  },
  emptyStateButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
