import React from "react";
import { View, Text, Button } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function HomeScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={{ flex:1, padding:20, gap:12 }}>
      <Text style={{ fontSize:22, fontWeight:"600" }}>Ciao {user?.nickname || user?.email}</Text>
      <Text>Placeholder Swipe/Home</Text>
      <Link href="/matches">Vai ai Match</Link>
      <Link href="/chats">Vai alle Chat</Link>
      <Link href="/profile">Profilo</Link>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}