import React from "react";
import { View, Text } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
export default function ProfileScreen() {
  const { user } = useAuth();
  return (
    <View style={{ flex:1, padding:20, gap:8 }}>
      <Text style={{ fontSize:22, fontWeight:"600" }}>Profilo</Text>
      <Text>Email: {user?.email}</Text>
      <Text>Nickname: {user?.nickname}</Text>
    </View>
  );
}