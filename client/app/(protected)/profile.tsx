import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Platform, Alert as RNAlert, ScrollView } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { api } from "../../src/services/apiClient";
import { Item } from "../../src/types";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AvatarPickerModal from "../../components/AvatarPickerModal";
import { updateMyAvatarByKey, getAvatarByKey, AvatarOption } from "../../src/services/avatarApi";
import BottomNav from "../../components/BottomNav";
import SettingsBottomSheet from "../../components/SettingsBottomSheet";

const CONDITION_LABELS: Record<string, string> = { new: "Nuovo", excellent: "Ottimo", good: "Buono" };

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Carica gli abiti dell'utente
  const fetchMyItems = async () => {
    setLoadingItems(true);
    try {
      const mine = (await api.get("/items/mine")).data;
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

  // Alert cross-platform
  const showAlert = (title: string, message?: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}${message ? "\n\n" + message : ""}`);
    } else {
      RNAlert.alert(title, message);
    }
  };

  // Elimina abito
  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.delete(`/items/${itemId}`);
      await fetchMyItems();
      showAlert("Abito eliminato");
    } catch (e: any) {
      showAlert("Errore", e?.response?.data?.message || e.message || "Errore");
    }
  };

  // Avatar source
  const getAvatarSource = () => {
    if (user?.avatarKey) {
      const avatar = getAvatarByKey(user.avatarKey);
      if (avatar) return avatar.source;
    }
    const initial = user?.nickname?.charAt(0)?.toUpperCase() || "U";
    return { uri: `https://placehold.co/100x100/5A31F4/FFFFFF?text=${initial}` };
  };

  // Conferma avatar
  const onConfirmAvatar = async (choice: AvatarOption) => {
    try {
      await updateMyAvatarByKey(choice.key);
      await refreshMe();
      showAlert("Avatar aggiornato");
    } catch (e: any) {
      showAlert("Errore", e?.response?.data?.message || e.message || "Impossibile aggiornare avatar");
    }
  };

  // Render singolo abito
  const renderItem = ({ item }: { item: Item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
        {item.size && (<Text style={styles.itemMeta}>Taglia: {item.size}</Text>)}
        {item.category && (<Text style={styles.itemMeta}>Categoria: {item.category}</Text>)}
        {item.condition && (<Text style={styles.itemMeta}>Condizione: {CONDITION_LABELS[item.condition] || item.condition}</Text>)}
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteItem(item._id)}>
          <Text style={styles.deleteButtonText}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profilo</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={20} color="#555" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Image source={getAvatarSource()} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user?.nickname}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statBox}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#34C759" />
            <Text style={styles.statNumber}>{user?.completedExchangesCount || 0}</Text>
            <Text style={styles.statLabel}>Scambi completati</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="shirt-outline" size={24} color="#5A31F4" />
            <Text style={styles.statNumber}>{myItems.length}</Text>
            <Text style={styles.statLabel}>Abiti disponibili</Text>
          </View>
        </View>

        {/* Exchange History Button */}
        <TouchableOpacity style={styles.historyButton} onPress={() => router.push("/exchanges")}>
          <Ionicons name="time-outline" size={20} color="#5A31F4" />
          <Text style={styles.historyButtonText}>Storico Scambi</Text>
          <Ionicons name="chevron-forward" size={18} color="#999" />
        </TouchableOpacity>

        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>I tuoi abiti</Text>
          {loadingItems ? (
            <ActivityIndicator color="#5A31F4" size="large" style={styles.loader} />
          ) : myItems.length > 0 ? (
            <FlatList
              data={myItems}
              keyExtractor={(item) => item._id}
              renderItem={renderItem}
              scrollEnabled={false}
              contentContainerStyle={styles.itemsList}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="shirt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Non hai ancora abiti disponibili</Text>
              <Text style={styles.emptySubtext}>Aggiungi il tuo primo capo!</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={() => router.push("/addItem")}>
          <Ionicons name="add-circle-outline" size={22} color="#fff" />
          <Text style={styles.addButtonText}>Aggiungi nuovo abito</Text>
        </TouchableOpacity>
      </ScrollView>

      <AvatarPickerModal visible={pickerOpen} onClose={() => setPickerOpen(false)} onConfirm={onConfirmAvatar} currentKey={user?.avatarKey} />
      <SettingsBottomSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onLogout={logout}
        onChangeAvatar={() => setPickerOpen(true)}
      />
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout principale
  screen: { flex: 1, backgroundColor: "#F2E8DF" },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: "#F2E8DF" },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#333" },
  settingsButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  // Profilo compatto
  profileSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#eee" },
  profileInfo: { marginLeft: 16, flex: 1 },
  nickname: { fontSize: 20, fontWeight: "600", color: "#333", marginBottom: 2 },
  email: { fontSize: 14, color: "#777" },

  // Stats Section
  statsSection: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 12 },
  statBox: { 
    flex: 1, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 16, 
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  statNumber: { fontSize: 24, fontWeight: "700", color: "#333", marginTop: 8 },
  statLabel: { fontSize: 12, color: "#666", marginTop: 4, textAlign: "center" },

  // History Button
  historyButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    marginHorizontal: 16, 
    marginBottom: 12, 
    padding: 14, 
    borderRadius: 12,
    gap: 10
  },
  historyButtonText: { flex: 1, fontSize: 15, fontWeight: "500", color: "#333" },

  // Sezione abiti
  itemsSection: { backgroundColor: "#fff", borderRadius: 16, marginHorizontal: 16, marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#333", marginBottom: 16 },
  loader: { marginVertical: 30 },
  itemsList: { gap: 12 },

  // Card abito
  itemCard: { flexDirection: "row", backgroundColor: "#F9F9F9", borderRadius: 12, padding: 12 },
  itemImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: "#eee" },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  itemTitle: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 4 },
  itemMeta: { fontSize: 12, color: "#666", marginBottom: 2 },
  deleteButton: { marginTop: 8, alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, backgroundColor: "#ffeaea", borderRadius: 6 },
  deleteButtonText: { color: "#FF4D4F", fontSize: 12, fontWeight: "600" },

  // Empty state
  emptyContainer: { alignItems: "center", paddingVertical: 30 },
  emptyText: { fontSize: 15, color: "#999", marginTop: 12, textAlign: "center" },
  emptySubtext: { fontSize: 13, color: "#bbb", marginTop: 4, textAlign: "center" },

  // Pulsante aggiungi
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#86A69D", marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12, gap: 8 },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});