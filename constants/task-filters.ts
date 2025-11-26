/**
 * Task filter constants and enums
 */

export enum TaskMode {
  NO_SELECT = 'No select',
  RELAX = 'Relax',
  FOCUS = 'Focus',
  EXERCISE = 'Exercise',
  SOCIAL = 'Social',
}

export enum TaskPlace {
  NO_SELECT = 'No select',
  HOME = 'Home',
  SCHOOL = 'School',
  LIBRARY = 'Library',
  COFFEE_SHOP = 'Coffee shop',
}

export enum TaskTool {
  NO_SELECT = 'No select',
  PHONE = 'Phone',
  COMPUTER = 'Computer',
  IPAD = 'iPad',
  TEXTBOOK = 'Textbook',
  NOTEBOOK = 'Notebook',
}

export const formatFilterValue = (value: string): string => {
  return `> ${value}`;
};

