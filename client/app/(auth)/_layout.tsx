import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function AuthLayout() {
  const { user, loading, onboardingCompleted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // User is logged in - check onboarding status
      if (!onboardingCompleted) {
        // Redirect to onboarding if not completed
        router.replace("/onboarding");
      } else {
        // Onboarding completed, go to main app
        router.replace("/");
      }
    }
  }, [loading, user, onboardingCompleted, router]);

  return <Stack screenOptions={{ headerShown: false }} />;
}