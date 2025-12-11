// Tag groups configuration
export const DEFAULT_CATEGORIES = ['School', 'Home', 'Work', 'Personal'];

export const TAG_GROUPS: { 
  [groupName: string]: { 
    tags: string[]; 
    isSingleSelect: boolean; 
    allowAddTags: boolean; 
    color: { bg: string; text: string } 
  } 
} = {
  Category: {
    tags: DEFAULT_CATEGORIES,
    isSingleSelect: true,
    allowAddTags: true,
    color: { bg: '#333333', text: '#FFFFFF' },
  },
  Priority: {
    tags: ['High', 'Medium', 'Low'],
    isSingleSelect: true,
    allowAddTags: false,
    color: { bg: '#BF360C', text: '#FFFFFF' },
  },
  Attention: {
    tags: ['Focus', 'Relax'],
    isSingleSelect: true,
    allowAddTags: false,
    color: { bg: '#4A148C', text: '#FFFFFF' },
  },
  Tools: {
    tags: ['Phone', 'iPad', 'Computer', 'Textbook'],
    isSingleSelect: false,
    allowAddTags: false,
    color: { bg: '#0D47A1', text: '#FFFFFF' },
  },
  Place: {
    tags: ['Classroom', 'Library', 'Home', 'Office', 'Coffee Shop'],
    isSingleSelect: true,
    allowAddTags: true,
    color: { bg: '#004D40', text: '#FFFFFF' },
  },
};

// Default tag group order (creation order)
export const DEFAULT_TAG_GROUP_ORDER = ['Category', 'Priority', 'Attention', 'Tools', 'Place'];

// Available colors for new tag groups
export const TAG_GROUP_COLORS = [
  { bg: '#1B5E20', text: '#FFFFFF', name: 'Green' },
  { bg: '#BF360C', text: '#FFFFFF', name: 'Orange' },
  { bg: '#4A148C', text: '#FFFFFF', name: 'Purple' },
  { bg: '#0D47A1', text: '#FFFFFF', name: 'Blue' },
  { bg: '#004D40', text: '#FFFFFF', name: 'Teal' },
  { bg: '#880E4F', text: '#FFFFFF', name: 'Pink' },
  { bg: '#E65100', text: '#FFFFFF', name: 'Yellow' },
  { bg: '#01579B', text: '#FFFFFF', name: 'Light Blue' },
  { bg: '#33691E', text: '#FFFFFF', name: 'Light Green' },
  { bg: '#311B92', text: '#FFFFFF', name: 'Deep Purple' },
];
