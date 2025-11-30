import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator, Platform, Alert as RNAlert, ScrollView, StatusBar } from "react-native";
import { useAuth } from "../../src/context/AuthContext";
import { api } from "../../src/services/apiClient";
import { Item } from "../../src/types";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AvatarPickerModal from "../../components/AvatarPickerModal";
import { updateMyAvatarByKey, getAvatarByKey, AvatarOption } from "../../src/services/avatarApi";
import BottomNav from "../../components/BottomNav";
import SettingsBottomSheet from "../../components/SettingsBottomSheet";
import { useTheme } from "../../src/theme";

const CONDITION_LABELS: Record<string, string> = { new: "Nuovo", excellent: "Ottimo", good: "Buono" };

export default function ProfileScreen() {
  const { user, logout, refreshMe } = useAuth();
  const { colors, isDark } = useTheme();
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
    <View style={[styles.itemCard, { backgroundColor: colors.inputBackground }]}>
      <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        {item.size && (<Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Taglia: {item.size}</Text>)}
        {item.category && (<Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Categoria: {item.category}</Text>)}
        {item.condition && (<Text style={[styles.itemMeta, { color: colors.textSecondary }]}>Condizione: {CONDITION_LABELS[item.condition] || item.condition}</Text>)}
        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: isDark ? 'rgba(255,69,58,0.2)' : '#ffeaea' }]} onPress={() => handleDeleteItem(item._id)}>
          <Text style={[styles.deleteButtonText, { color: colors.error }]}>Elimina</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profilo</Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.card }]}
          onPress={() => setSettingsOpen(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="settings-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
          <Image source={getAvatarSource()} style={styles.avatar} />
          <View style={styles.profileInfo}>
            <Text style={[styles.nickname, { color: colors.text }]}>{user?.nickname}</Text>
            {user?.age && user?.gender && (
              <Text style={[styles.profileDetails, { color: colors.textSecondary }]}>
                {user.age} anni • {user.gender === 'male' ? 'Uomo' : user.gender === 'female' ? 'Donna' : 'Non specificato'}
              </Text>
            )}
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
          </View>
        </View>

        {/* Complete Profile Prompt for existing users without profile data */}
        {(!user?.age || !user?.gender) && (
          <TouchableOpacity style={[styles.completeProfilePrompt, { backgroundColor: colors.card, borderColor: colors.secondary }]} onPress={() => router.push("/onboarding")}>
            <Ionicons name="person-add-outline" size={20} color={colors.secondary} />
            <Text style={[styles.completeProfileText, { color: colors.secondary }]}>Completa il profilo</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle-outline" size={24} color={colors.success} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{user?.completedExchangesCount || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Scambi completati</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.card }]}>
            <Ionicons name="shirt-outline" size={24} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{myItems.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Abiti disponibili</Text>
          </View>
        </View>

        {/* Exchange History Button */}
        <TouchableOpacity style={[styles.historyButton, { backgroundColor: colors.card }]} onPress={() => router.push("/exchanges")}>
          <Ionicons name="time-outline" size={20} color={colors.accent} />
          <Text style={[styles.historyButtonText, { color: colors.text }]}>Storico Scambi</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[styles.itemsSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>I tuoi abiti</Text>
          {loadingItems ? (
            <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
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
              <Ionicons name="shirt-outline" size={48} color={colors.border} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Non hai ancora abiti disponibili</Text>
              <Text style={[styles.emptySubtext, { color: colors.border }]}>Aggiungi il tuo primo capo!</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={() => router.push("/addItem")}>
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
  screen: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 50, paddingBottom: 12, paddingHorizontal: 20 },
  headerTitle: { fontSize: 20, fontWeight: "600" },
  settingsButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },

  // Profilo compatto
  profileSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: "#eee" },
  profileInfo: { marginLeft: 16, flex: 1 },
  nickname: { fontSize: 20, fontWeight: "600", marginBottom: 2 },
  profileDetails: { fontSize: 14, marginBottom: 2 },
  email: { fontSize: 14 },

  // Complete Profile Prompt
  completeProfilePrompt: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  completeProfileText: { flex: 1, fontSize: 15, fontWeight: "500" },

  // Stats Section
  statsSection: { flexDirection: "row", gap: 12, marginHorizontal: 16, marginBottom: 12 },
  statBox: { flex: 1, borderRadius: 12, padding: 16, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  statNumber: { fontSize: 24, fontWeight: "700", marginTop: 8 },
  statLabel: { fontSize: 12, marginTop: 4, textAlign: "center" },

  // History Button
  historyButton: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 12, gap: 10 },
  historyButtonText: { flex: 1, fontSize: 15, fontWeight: "500" },

  // Sezione abiti
  itemsSection: { borderRadius: 16, marginHorizontal: 16, marginTop: 8, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 16 },
  loader: { marginVertical: 30 },
  itemsList: { gap: 12 },

  // Card abito
  itemCard: { flexDirection: "row", borderRadius: 12, padding: 12 },
  itemImage: { width: 90, height: 90, borderRadius: 10, backgroundColor: "#eee" },
  itemInfo: { flex: 1, marginLeft: 12, justifyContent: "center" },
  itemTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  itemMeta: { fontSize: 12, marginBottom: 2 },
  deleteButton: { marginTop: 8, alignSelf: "flex-start", paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  deleteButtonText: { fontSize: 12, fontWeight: "600" },

  // Empty state
  emptyContainer: { alignItems: "center", paddingVertical: 30 },
  emptyText: { fontSize: 15, marginTop: 12, textAlign: "center" },
  emptySubtext: { fontSize: 13, marginTop: 4, textAlign: "center" },

  // Pulsante aggiungi
  addButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 16, marginTop: 16, paddingVertical: 14, borderRadius: 12, gap: 8 },
  addButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});