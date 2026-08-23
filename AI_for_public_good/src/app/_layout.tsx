import { Stack } from 'expo-router';
import React from 'react';

export default function RootLayout(): React.ReactElement {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The index route acts as the initial Welcome Screen */}
      <Stack.Screen name="index" />
      {/* The login route handles Firebase Authentication */}
      <Stack.Screen name="login" />
      {/* The protected dashboard route */}
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="pages/onboarding" />
      <Stack.Screen name="pages/schemes" />
    </Stack>
  );
}