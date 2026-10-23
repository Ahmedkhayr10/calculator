import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const backgroundColor = '#1B2432';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor },
        }}
      />
    </>
  );
}
