const TASK_SCREEN_STRINGS = {
  // Header
  headerTitle: 'Task List',
  
  // Add Task Screen
  addTask: {
    sectionTitle: 'New Task',
    subtasksSectionTitle: 'Subtasks',
    
    // Labels
    categoryLabel: 'Category',
    timeLabel: 'Time (min)',
    deadlineLabel: 'Deadline',
    tagsLabel: 'Tags',
    subtaskTagsLabel: 'Tags',
    statusLabel: 'Status',
    
    // Placeholders
    taskTitlePlaceholder: 'Task title',
    descriptionPlaceholder: 'Description (optional)...',
    getSubtaskTitlePlaceholder: (index: number) => 'Subtask title',
    subtaskDescriptionPlaceholder: 'Add subtask description...',
    newCategoryPlaceholder: 'New category...',
    newTagPlaceholder: 'New tag...',
    newTagGroupPlaceholder: 'New tag group name...',
    timePlaceholder: '0',
    minPlaceholder: 'min',
    deadlinePlaceholder: 'YYYY-MM-DD',
    statusPlaceholder: 'Select status...',
    
    // Status options
    statusNotStarted: 'Not started',
    statusInProgress: 'In progress',
    statusDone: 'Done',
    statusArchive: 'Archive',
    
    // Buttons
    createTaskButton: 'Create Task',
    updateTaskButton: 'Update Task',
    updatingButton: 'Updating...',
    creatingButton: 'Creating...',
    addSubtaskButton: '+ Add Subtask',
    aiGenerateButton: 'AI Generate',
    confirmButton: 'Confirm',
    aiGenerateLoadingMessage: 'Generating subtasks with AI...',
    
    // Modal
    selectTagsTitle: 'Select Tags',
    
    // Alerts
    alerts: {
      aiGenerateTitle: 'Notice',
      aiGenerateAlertTitle: 'AI Generate',
      aiGenerateMessage: 'Please enter a task title first, then AI can help you generate subtasks!',
      aiGeneratePlaceholder: 'This will call the backend API in the future to automatically generate subtasks based on the title.',
      errorTitle: 'Error',
      errorMessage: 'Please enter the main task title',
    },
    
    // Default values
    defaultUntitledSubtask: 'Untitled subtask',
  },
  
  // Tasks List Screen
  tasksList: {
    // Category
    defaultCategory: 'TASK',
    
    // Placeholders
    addDescriptionPlaceholder: 'Add description...',
    noDescriptionPlaceholder: 'No description',
    
    // Time display
    totalTimePrefix: 'Total',
    totalTimeSuffix: 'min',
    timeUnit: 'min',
    
    // Progress
    progressUnit: '%',

    // Empty state
    emptyStateTitle: 'All tasks complete',
    emptyStateSubtitle: 'Great job staying on top of things.\nAdd a new task when you are ready.',
    emptyStateAction: 'Add a task',
  },
};

export type TaskScreenStrings = typeof TASK_SCREEN_STRINGS;
export { TASK_SCREEN_STRINGS };
