import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/context/AuthContext";

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Ciao {user?.nickname || user?.email}
      </Text>

      <View style={styles.placeholder}>
        <Text>Qui compariranno i vestiti per lo swipe</Text>
      </View>

      <View style={styles.links}>
        <Link href="/matches" style={styles.link}>Vai ai Match</Link>
        <Link href="/chats" style={styles.link}>Vai alle Chat</Link>
        <Link href="/profile" style={styles.link}>Profilo</Link>
      </View>

      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  placeholder: {
    height: 200,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  links: {
    gap: 8,
    marginBottom: 20,
  },
  link: {
    fontSize: 16,
    color: "#007AFF",
  },
});
