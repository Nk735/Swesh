import { Stack } from "expo-router";
import React from "react";
import { AuthProvider } from "../src/context/AuthContext";
import { ThemeProvider } from "../src/theme";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}