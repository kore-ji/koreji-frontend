import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QuadrantRotate } from '@/components/ui/quadrant-rotate';

interface SubtasksLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export function SubtasksLoadingOverlay({
  visible,
  message,
}: SubtasksLoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.card}>
        <QuadrantRotate size={96} showLoadingText={false} />
        <Text style={styles.message}>
          {message ?? 'Generating subtasks...'}
        </Text>
        <Text style={styles.subMessage}>This may take a few seconds.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 10,
  },
  card: {
    paddingVertical: 24,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
    maxWidth: '90%',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
});
