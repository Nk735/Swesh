import React from "react";
import { View, Text } from "react-native";
import { Link } from "expo-router";
export default function ChatsList() {
  return (
    <View style={{ flex:1, padding:20, gap:12 }}>
      <Text style={{ fontSize:20, fontWeight:"600" }}>Chat List (placeholder)</Text>
      <Link href="/chats/123">Vai a Chat 123</Link>
    </View>
  );
}