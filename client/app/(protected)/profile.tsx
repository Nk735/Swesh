import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Platform, Alert as RNAlert, ScrollView } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { api } from "../../src/services/apiClient";
import { Item } from "../../src/types";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const CONDITION_LABELS: Record<string, string> = {
  new: "Nuovo",
  excellent: "Ottimo",
  good: "Buono",
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  // Stato per la lista dei propri abiti
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  // Carica gli abiti dell'utente corrente (solo disponibili)
  const fetchMyItems = async () => {
    setLoadingItems(true);
    try {
      const mine = (await api.get("/items/mine")).data;
      // Filtra solo gli item disponibili
      const availableItems = mine.filter((item: Item) => item.isAvailable !== false);
      setMyItems(availableItems);
    } catch {
      setMyItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyItems();
  }, [user]);

  // Utility per mostrare alert sia su mobile che su web
  function showAlert(title: string, message?: string) {
    if (Platform.OS === "web") {
      // Fallback semplice per web
      window.alert(`${title}${message ? "\n\n" + message : ""}`);
    } else {
      RNAlert.alert(title, message);
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.delete(`/items/${itemId}`);
      await fetchMyItems();
      showAlert("Abito eliminato");
    } catch (e: any) {
      showAlert("Errore", e?.response?.data?.message || e.message || "Errore");
    }
  };

  // Genera URL placeholder per avatar
  const getAvatarUrl = () => {
    const initial = user?.nickname?.charAt(0)?.toUpperCase() || "U";
    return `https://placehold.co/100x100/5A31F4/FFFFFF?text=${initial}`;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Sezione profilo */}
      <View style={styles.profileSection}>
        <Image source={{ uri: user?.avatarUrl || getAvatarUrl() }} style={styles.avatar} />
        <Text style={styles.nickname}>{user?.nickname}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* Pulsante per aggiungere abito */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/addItem")}
      >
        <Ionicons name="add-circle-outline" size={24} color="#fff" />
        <Text style={styles.addButtonText}>Aggiungi nuovo abito</Text>
      </TouchableOpacity>

      {/* Lista abiti disponibili */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>I tuoi abiti disponibili</Text>
        {loadingItems ? (
          <ActivityIndicator color="#5A31F4" size="large" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={myItems}
            keyExtractor={item => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.itemBox}>
                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                {item.size ? <Text style={styles.itemMeta}>Taglia: {item.size}</Text> : null}
                {item.category ? <Text style={styles.itemMeta}>Categoria: {item.category}</Text> : null}
                {item.condition ? (
                  <Text style={styles.itemMeta}>
                    Condizione: {CONDITION_LABELS[item.condition] || item.condition}
                  </Text>
                ) : null}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteItem(item._id)}
                >
                  <Text style={styles.deleteButtonText}>Elimina</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Non hai ancora abiti disponibili per lo scambio</Text>
                <Text style={styles.emptySubtext}>Aggiungi il tuo primo capo!</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Pulsante logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6347" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  profileSection: { alignItems: "center", paddingVertical: 30, backgroundColor: "#fff", marginBottom: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12, backgroundColor: "#eee" },
  nickname: { fontSize: 24, fontWeight: "600", color: "#333", marginBottom: 4 },
  email: { fontSize: 14, color: "#777" },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5A31F4",
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  addButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  itemsSection: { backgroundColor: "#fff", marginTop: 10, paddingVertical: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#333", marginBottom: 16, paddingHorizontal: 20 },
  itemBox: { marginLeft: 20, alignItems: "center", width: 140 },
  itemImage: { width: 130, height: 130, borderRadius: 10, marginBottom: 8, backgroundColor: "#eee" },
  itemTitle: { fontWeight: "600", textAlign: "center", fontSize: 14, marginBottom: 4 },
  itemMeta: { color: "#555", fontSize: 12, textAlign: "center" },
  deleteButton: { marginTop: 10, paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#ffeaea", borderRadius: 8 },
  deleteButtonText: { color: "#FF6347", fontWeight: "600", fontSize: 12 },
  emptyContainer: { alignItems: "center", paddingHorizontal: 40, paddingVertical: 40 },
  emptyText: { fontSize: 16, color: "#999", textAlign: "center", marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: "#bbb", textAlign: "center" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FF6347",
    backgroundColor: "#fff",
    gap: 8,
  },
  logoutText: { color: "#FF6347", fontSize: 16, fontWeight: "600" },
});
