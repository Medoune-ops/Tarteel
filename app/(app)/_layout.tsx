import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="langue" />
      <Stack.Screen name="sourates" />
      <Stack.Screen name="streak-goal" />
      <Stack.Screen name="podiums" />
      <Stack.Screen name="subscription" />
      <Stack.Screen name="payment-method" />
      <Stack.Screen name="payment-card" />
      <Stack.Screen name="revision" />
      <Stack.Screen name="docs" />
      <Stack.Screen name="lesson" />
    </Stack>
  );
}
