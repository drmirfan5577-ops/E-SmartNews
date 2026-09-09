import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
      <Stack.Screen name="news" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="tickers" />
      <Stack.Screen name="music" />
      <Stack.Screen name="links" />
      <Stack.Screen name="launchers" />
      <Stack.Screen name="admins" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="about" />
      <Stack.Screen name="flash" />
      <Stack.Screen name="subtitles" />
      <Stack.Screen name="ads" />
      <Stack.Screen name="intro-outro" />
      <Stack.Screen name="filters" />
    </Stack>
  );
}
