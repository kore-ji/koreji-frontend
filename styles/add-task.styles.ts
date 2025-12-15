import { StyleSheet } from 'react-native';

export const addTaskStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  subtaskListContainer: {
    position: 'relative',
    marginTop: 4,
  },
  subtaskList: {
    gap: 16,
  },
});
