import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { getCompletedExchanges } from "../../src/services/tradeApi";
import { CompletedExchange } from "../../src/types/trade";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../components/BottomNav";
import EmptyState from "../../components/EmptyState";
import { getAvatarByKey } from "../../src/services/avatarApi";

export default function ExchangesHistoryScreen() {
  const [exchanges, setExchanges] = useState<CompletedExchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadExchanges = useCallback(async () => {
    try {
      const data = await getCompletedExchanges();
      setExchanges(data);
    } catch (e) {
      console.log('Error loading exchanges:', e);
      setExchanges([]);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadExchanges().finally(() => setLoading(false));
  }, [loadExchanges]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExchanges();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getAvatarSource = (avatarKey?: string, nickname?: string) => {
    if (avatarKey) {
      const avatar = getAvatarByKey(avatarKey);
      if (avatar) return avatar.source;
    }
    const initial = nickname?.charAt(0)?.toUpperCase() || "U";
    return { uri: `https://placehold.co/60x60/5A31F4/FFFFFF?text=${initial}` };
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Storico Scambi</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5A31F4" />
        </View>
        <BottomNav />
      </View>
    );
  }

  if (!exchanges.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>Storico Scambi</Text>
        </View>
        <EmptyState
          icon="swap-horizontal-outline"
          title="Nessuno scambio completato"
          subtitle="Quando completerai il tuo primo scambio, apparirà qui."
          buttonText="Torna al profilo"
          onButtonPress={() => router.push('/profile')}
        />
        <BottomNav />
      </View>
    );
  }

  const renderExchange = ({ item }: { item: CompletedExchange }) => (
    <View style={styles.exchangeCard}>
      <Text style={styles.dateText}>{formatDate(item.completedAt)}</Text>
      
      <View style={styles.itemsContainer}>
        <View style={styles.itemBox}>
          {item.myItem?.imageUrl ? (
            <Image source={{ uri: item.myItem.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, { backgroundColor: '#eee' }]} />
          )}
          <Text numberOfLines={1} style={styles.itemTitle}>{item.myItem?.title || 'Il tuo oggetto'}</Text>
          <Text style={styles.itemLabel}>Dato</Text>
        </View>
        
        <View style={styles.swapIcon}>
          <Ionicons name="swap-horizontal" size={24} color="#5A31F4" />
        </View>
        
        <View style={styles.itemBox}>
          {item.theirItem?.imageUrl ? (
            <Image source={{ uri: item.theirItem.imageUrl }} style={styles.itemImage} />
          ) : (
            <View style={[styles.itemImage, { backgroundColor: '#eee' }]} />
          )}
          <Text numberOfLines={1} style={styles.itemTitle}>{item.theirItem?.title || 'Oggetto ricevuto'}</Text>
          <Text style={styles.itemLabel}>Ricevuto</Text>
        </View>
      </View>
      
      <View style={styles.userSection}>
        <Image 
          source={getAvatarSource(item.otherUser.avatarKey, item.otherUser.nickname)} 
          style={styles.userAvatar} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.otherUser.nickname}</Text>
          <Text style={styles.userStats}>
            {item.otherUser.completedExchangesCount || 0} scambi completati
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Storico Scambi</Text>
        <Text style={styles.subtitle}>{exchanges.length} scambi{exchanges.length === 1 ? 'o' : ''} completat{exchanges.length === 1 ? 'o' : 'i'}</Text>
      </View>

      <FlatList
        data={exchanges}
        keyExtractor={item => item.matchId}
        renderItem={renderExchange}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A31F4" />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E8DF' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#F2E8DF' },
  backBtn: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  
  exchangeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 12
  },
  
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  itemBox: {
    flex: 1,
    alignItems: 'center',
    maxWidth: '40%'
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    marginBottom: 8
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2
  },
  itemLabel: {
    fontSize: 11,
    color: '#888'
  },
  swapIcon: {
    paddingHorizontal: 10
  },
  
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee'
  },
  userInfo: {
    marginLeft: 12,
    flex: 1
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  userStats: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  
  separator: { height: 12 }
});
