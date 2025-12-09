import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { appendBaseUrl } from 'expo-router/build/fork/getPathFromState-forks';
import TasksScreen from './(tabs)/tasks';
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
          name="add_task"
          options={{
            presentation: 'modal',
            title: TASK_SCREEN_STRINGS.addTask.sectionTitle,
            headerShown: true
          }}
        />

      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

