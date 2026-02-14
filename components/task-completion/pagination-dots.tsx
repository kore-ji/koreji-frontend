import { View, StyleSheet } from 'react-native';

interface PaginationDotsProps {
  currentPage: number;
  totalPages: number;
}

export function PaginationDots({
  currentPage,
  totalPages,
}: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalPages }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            currentPage === index ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#333333',
  },
  dotInactive: {
    backgroundColor: '#E0E0E0',
  },
});
