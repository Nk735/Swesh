import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";
export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  return (
    <View style={{ flex:1, padding:20 }}>
      <Text style={{ fontSize:18, fontWeight:"600" }}>Chat {chatId}</Text>
      <Text>Messaggi qui...</Text>
    </View>
  );
}