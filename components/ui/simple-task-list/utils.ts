import { Ionicons } from '@expo/vector-icons';
import { TaskIcon } from './types';

export const getIconName = (icon: TaskIcon): keyof typeof Ionicons.glyphMap => {
  const iconMap: Record<TaskIcon, keyof typeof Ionicons.glyphMap> = {
    pencil: 'pencil',
    trash: 'trash-outline',
    mail: 'mail-outline',
    document: 'document-text-outline',
  };
  return iconMap[icon];
};
