import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/context/AuthContext";

export default function ProtectedLayout() {
  return <Stack />;
}

// export default function AppLayout() {
//   const { user, loading } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     if (!loading && !user) {
//       router.replace("../auth/login"); // Reindirizza a /login se non autenticato
//     }
//   }, [loading, user, router]);

//   if (loading) {
//     // Mostra un caricamento mentre verifica lo stato dell'utente
//     return (
//       <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//         <ActivityIndicator size="large" />
//       </View>
//     );
//   }

//   return (
//     <Stack
//       screenOptions={{
//         headerShown: true,
//       }}
//     />
//   );
// }
