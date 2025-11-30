import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { getAllMatches } from "../../../src/services/tradeApi";
import { TinderMatch } from "../../../src/types/trade";
import { Ionicons } from "@expo/vector-icons";
import BottomNav from "../../../components/BottomNav";
import EmptyState from "../../../components/EmptyState";

export default function ChatsList() {
  const [matches, setMatches] = useState<TinderMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  const loadChats = useCallback(async () => {
    try {
      const data = await getAllMatches();
      // Sort by last activity (most recent first)
      const sorted = data.sort((a, b) => 
        new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
      );
      setMatches(sorted);
    } catch (e) {
      console.log('Error loading chats:', e);
      setMatches([]);
    }
  }, []);

  // Separate chats into active and archived
  const activeChats = matches.filter(m => m.status === 'active');
  const archivedChats = matches.filter(m => m.status === 'archived' || m.status === 'completed');
  const displayedChats = activeTab === 'active' ? activeChats : archivedChats;

  useEffect(() => {
    setLoading(true);
    loadChats().finally(() => setLoading(false));
    
    // Refresh every 30 seconds
    const interval = setInterval(loadChats, 30000);
    return () => clearInterval(interval);
  }, [loadChats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}g`;
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'archived': return '#FF9500';
      default: return '#5A31F4';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completato';
      case 'archived': return 'Annullato';
      default: return 'In corso';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#5A31F4" />
        </View>
        <BottomNav />
      </View>
    );
  }

  if (!matches.length) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Chat</Text>
        </View>
        <EmptyState
          icon="chatbubbles-outline"
          title="Nessuna chat ancora"
          subtitle="Quando avrai un match, qui appariranno le tue conversazioni. Inizia a esplorare e metti like agli abiti che ti piacciono!"
          buttonText="Inizia a esplorare"
          onButtonPress={() => router.push('/')}
        />
        <BottomNav />
      </View>
    );
  }

  const renderChatItem = ({ item }: { item: TinderMatch }) => (
    <TouchableOpacity 
      style={styles.chatItem} 
      onPress={() => router.push(`/chats/${item.matchId}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: item.otherUser?.avatarUrl || 'https://placehold.co/60x60' }} 
          style={styles.avatar} 
        />
        {item.unread > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unread > 9 ? '9+' : item.unread}</Text>
          </View>
        )}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={styles.userName}>{item.otherUser?.nickname || 'Utente'}</Text>
          <Text style={styles.timeText}>{formatDate(item.lastActivityAt)}</Text>
        </View>
        
        <View style={styles.itemsRow}>
          <View style={styles.itemThumb}>
            {item.itemMine?.imageUrl && (
              <Image source={{ uri: item.itemMine.imageUrl }} style={styles.itemThumbImage} />
            )}
          </View>
          <Ionicons name="swap-horizontal" size={14} color="#999" />
          <View style={styles.itemThumb}>
            {item.itemTheirs?.imageUrl && (
              <Image source={{ uri: item.itemTheirs.imageUrl }} style={styles.itemThumbImage} />
            )}
          </View>
          <Text numberOfLines={1} style={styles.itemsText}>
            {item.itemMine?.title || 'Il tuo'} ↔ {item.itemTheirs?.title || 'Loro'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chat</Text>
        <Text style={styles.subtitle}>{matches.length} conversazion{matches.length === 1 ? 'e' : 'i'}</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Chat Attive ({activeChats.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'archived' && styles.tabActive]}
          onPress={() => setActiveTab('archived')}
        >
          <Text style={[styles.tabText, activeTab === 'archived' && styles.tabTextActive]}>
            Archiviate ({archivedChats.length})
          </Text>
        </TouchableOpacity>
      </View>

      {displayedChats.length === 0 ? (
        <View style={styles.emptyTabContainer}>
          <Ionicons 
            name={activeTab === 'active' ? 'chatbubbles-outline' : 'archive-outline'} 
            size={48} 
            color="#ccc" 
          />
          <Text style={styles.emptyTabText}>
            {activeTab === 'active' 
              ? 'Nessuna chat attiva' 
              : 'Nessuna chat archiviata'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayedChats}
          keyExtractor={item => item.matchId}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5A31F4" />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2E8DF' },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#F2E8DF' },
  title: { fontSize: 28, fontWeight: '700', color: '#111' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  
  // Tab styles
  tabContainer: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#E8E0D7', borderRadius: 10, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#888' },
  tabTextActive: { color: '#333', fontWeight: '600' },
  emptyTabContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyTabText: { marginTop: 12, fontSize: 15, color: '#999' },
  
  chatItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, },
  avatarContainer: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#eee' },
  unreadBadge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#FF4D4F', minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderWidth: 2, borderColor: '#fff' },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  
  chatContent: { flex: 1, marginLeft: 12 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 16, fontWeight: '600', color: '#111' },
  timeText: { fontSize: 12, color: '#999' },
  
  itemsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  itemThumb: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#f0f0f0', overflow: 'hidden' },
  itemThumbImage: { width: '100%', height: '100%' },
  itemsText: { fontSize: 12, color: '#666', flex: 1 },
  
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '500' },
  
  chevron: { marginLeft: 8 },
  separator: { height: 8 }
});