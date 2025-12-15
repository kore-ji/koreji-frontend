import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/ui/use-color-scheme';
import { TASK_SCREEN_STRINGS } from '@/constants/strings/tasks';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />

        <Stack.Screen
          name="add-task"
          options={{
            presentation: 'modal',
            title: TASK_SCREEN_STRINGS.addTask.sectionTitle,
            headerShown: true
          }}
        />

        <Stack.Screen
          name="task-progress"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="task-completion"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

