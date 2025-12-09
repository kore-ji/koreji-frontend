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
    
    // Placeholders
    taskTitlePlaceholder: 'Task title',
    descriptionPlaceholder: 'Description (optional)...',
    getSubtaskTitlePlaceholder: (index: number) => `Subtask ${index + 1}`,
    subtaskDescriptionPlaceholder: 'Add subtask description...',
    newCategoryPlaceholder: 'New category...',
    newTagPlaceholder: 'New tag...',
    newTagGroupPlaceholder: 'New tag group name...',
    timePlaceholder: '0',
    minPlaceholder: 'Min',
    deadlinePlaceholder: 'YYYY-MM-DD',
    
    // Buttons
    createTaskButton: 'Create Task',
    addSubtaskButton: '+ Add Subtask',
    aiGenerateButton: 'AI Generate',
    confirmButton: 'Confirm',
    
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
  },
};

export type TaskScreenStrings = typeof TASK_SCREEN_STRINGS;
export { TASK_SCREEN_STRINGS };
