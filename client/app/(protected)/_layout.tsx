import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function ProtectedLayout() {
  const { user, loading, onboardingCompleted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in - go to login
        router.replace("/login");
      } else if (!onboardingCompleted) {
        // Logged in but onboarding not completed - go to onboarding
        router.replace("/onboarding");
      }
    }
  }, [loading, user, onboardingCompleted, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}