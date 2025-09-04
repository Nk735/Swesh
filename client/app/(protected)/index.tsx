import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/apiClient';
import SwipeDeck, { DeckItem } from '../../components/SwipeDeck';
import { ProposeSwapModal } from '@/components/ProposeSwapModal';
import { getGroupedMatches } from '../../src/services/tradeApi';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout, refreshMe } = useAuth();
  const [items, setItems] = useState<DeckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  // Modal
  const [swapModalVisible, setSwapModalVisible] = useState(false);
  const [targetItemId, setTargetItemId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/items');
      const data = Array.isArray(res.data) ? res.data : res.data.items;
      setItems(data);
    } catch (e: any) {
      Alert.alert('Errore', e?.response?.data?.message || e.message || 'Errore caricamento feed.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems, reloadFlag]);

  const popFirst = () => setItems(prev => prev.slice(1));

  // Dislike / Skip mantengono per ora stessa logica placeholder
  const handleDislike = async (item: DeckItem) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.post('/auth/dislike', { id: item._id });
      popFirst();
      refreshMe().catch(() => {});
    } catch (e: any) {
      Alert.alert('Errore', e?.response?.data?.message || e.message || 'Dislike fallito');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = (item: DeckItem) => {
    popFirst();
  };

  const openProposal = (item: DeckItem) => {
    setTargetItemId(item._id);
    setSwapModalVisible(true);
  };

  const onProposalResult = (r: { matched: boolean; matchId?: string; chatId?: string }) => {
    if (r.matched && r.matchId && r.chatId) {
      Alert.alert('Match!', 'Hai un nuovo scambio. Apri la chat.', [
        { text: 'Apri chat', onPress: () => router.push(`/chats/${r.matchId}`) },
        { text: 'OK' }
      ]);
    } else {
      // Pending
      Alert.alert('Proposta inviata', 'In attesa di reciprocità.');
    }
    popFirst();
  };

  const reload = () => {
    if (loading || actionLoading) return;
    setReloadFlag(f => f + 1);
  };

  const current = items[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text>Ciao {user?.nickname || user?.email}</Text>
        <Image
          source={{ uri: 'https://placehold.co/100x40/5A31F4/FFFFFF?text=SWESH' }}
          style={styles.logo}
        />
        <TouchableOpacity onPress={reload} disabled={loading}>
          <Ionicons
            name="refresh-outline"
            size={28}
            color={loading ? '#bbb' : '#000'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.deckWrapper}>
        <SwipeDeck
          items={items}
          loading={loading}
          actionLoading={actionLoading}
          onLike={openProposal}
          onDislike={handleDislike}
          onSkip={handleSkip}
          emptyComponent={
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#777', fontSize: 16, marginBottom: 12 }}>
                Nessun vestito disponibile
              </Text>
              <TouchableOpacity
                onPress={reload}
                style={styles.reloadBtn}
                disabled={loading}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Ricarica feed</Text>
              </TouchableOpacity>
            </View>
          }
          renderFooter={
            <View style={styles.actionsBar}>
              <TouchableOpacity
                style={[styles.actionButton]}
                disabled={!current || actionLoading}
                onPress={() => current && handleDislike(current)}
              >
                <Ionicons name="close" size={38} color="#FF6347" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.starButton]}
                disabled={!current || actionLoading}
                onPress={() => current && handleSkip(current)}
              >
                <FontAwesome name="star-o" size={28} color="#5A31F4" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.checkButton]}
                disabled={!current || actionLoading}
                onPress={() => current && openProposal(current)}
              >
                <Ionicons name="swap-horizontal" size={38} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton]}
                disabled={!current || actionLoading}
                onPress={() => current && handleSkip(current)}
              >
                <FontAwesome5 name="bolt" size={24} color="#FFC107" />
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <Ionicons name="options-outline" size={24} color="#fff" />
            <Text style={styles.navText}>Filtri</Text>
          </View>
          <Link href="/matches" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="sync-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Scambi</Text>
            </View>
          </Link>
          <Link href="/chats" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Chat</Text>
            </View>
          </Link>
          <Link href="/profile" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="person-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Profilo</Text>
            </View>
          </Link>
        </View>
      </View>

      <TouchableOpacity onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <ProposeSwapModal
        visible={swapModalVisible}
        onClose={() => setSwapModalVisible(false)}
        targetItemId={targetItemId}
        onResult={onProposalResult}
      />
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  deckWrapper: {
    flex: 1,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsBar: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: SCREEN_WIDTH,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10,
  },
  logo: { width: 100, height: 40, resizeMode: 'contain' },
  actionButton: {
    width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 5,
  },
  starButton: { backgroundColor: '#FFF', width: 80, height: 80, borderRadius: 40 },
  checkButton: {
    backgroundColor: '#32CD32', width: 80, height: 80, borderRadius: 40,
    shadowColor: '#32CD32', shadowOpacity: 0.4,
  },
  bottomNavContainer: {
    backgroundColor: '#5A31F4', borderWidth: 5, borderColor: '#FF5A61',
    borderTopLeftRadius: 100, borderTopRightRadius: 25,
    borderBottomLeftRadius: 25, borderBottomRightRadius: 100,
    overflow: 'hidden', margin: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  bottomNav: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 25,
  },
  linkWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navItem: {
    width: 70, height: 70, alignItems: 'center', flexDirection: 'column',
    borderColor: '#FF5A61', borderWidth: 5, borderRadius: 50, padding: 8,
  },
  navText: { fontSize: 12, color: '#fff', marginTop: 2 },
  logoutButton: {
    position: 'absolute', bottom: 40, left: 20, right: 20, padding: 15,
    backgroundColor: '#FF6347', borderRadius: 12, alignItems: 'center', opacity: 0.9,
  },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reloadBtn: {
    position: 'absolute', bottom: 24, left: '20%', right: '20%',
    backgroundColor: '#5A31F4', paddingVertical: 12, borderRadius: 12, alignItems: 'center',
  },
});
