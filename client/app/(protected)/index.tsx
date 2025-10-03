import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/apiClient';
import SwipeDeck, { DeckItem } from '../../components/SwipeDeck';
import { MatchNotificationModal } from '../../components/MatchNotificationModal';
import { InteractionResponse } from '../../src/types/trade';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout, refreshMe } = useAuth();
  const [items, setItems] = useState<DeckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<{
    matchId: string;
    chatId: string;
    otherUser?: { nickname: string; avatarUrl?: string };
    matchedItems?: { myItem: any; theirItem: any };
  } | null>(null);

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

  // Aggiornamento ottimistico: togli la card SUBITO, poi chiama l’API
  const handleInteraction = async (item: DeckItem, action: 'like' | 'dislike' | 'skip') => {
    if (actionLoading) return;
    setActionLoading(true);

    // RIMUOVI SUBITO la card corrente (aggiornamento ottimistico)
    setItems(prev => prev.slice(1));

    try {
      const response = await api.post<InteractionResponse>('/interactions', {
        itemId: item._id,
        action,
      });

      // Se c'è un match, mostra la notifica
      if (response.data.match?.matched && response.data.match.isNew) {
        setCurrentMatch({
          matchId: response.data.match.matchId,
          chatId: response.data.match.chatId,
          otherUser: {
            nickname: item.owner.nickname,
            avatarUrl: item.owner.avatarUrl,
          },
          matchedItems: {
            myItem: response.data.match.matchedItems?.myItem,
            theirItem: item,
          },
        });
        setMatchModalVisible(true);
      }

      refreshMe().catch(() => {});
    } catch (e: any) {
      // Se vuoi re-inserire l'item in caso di errore, decommenta la riga seguente:
      // setItems(prev => [item, ...prev]);
      console.error(`Errore ${action}:`, e?.response?.data || e.message);
      Alert.alert('Errore', e?.response?.data?.message || e.message || `${action} fallito`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLike = (item: DeckItem) => handleInteraction(item, 'like');
  const handleDislike = (item: DeckItem) => handleInteraction(item, 'dislike');
  const handleSkip = (item: DeckItem) => handleInteraction(item, 'skip');

  const reload = () => {
    if (loading || actionLoading) return;
    setReloadFlag(f => f + 1);
  };

  const current = items[0];

  const handleMatchModalAction = (action: 'chat' | 'continue') => {
    setMatchModalVisible(false);
    if (action === 'chat' && currentMatch) {
      router.push(`/chats/${currentMatch.matchId}`);
    }
    setCurrentMatch(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://placehold.co/100x40/5A31F4/FFFFFF?text=SWESH' }}
          style={styles.logo}
        />
        <TouchableOpacity onPress={reload} disabled={loading}>
          <Ionicons name="refresh-outline" size={28} color={loading ? '#bbb' : '#000'} />
        </TouchableOpacity>
      </View>

      <View style={styles.deckWrapper}>
        <SwipeDeck
          items={items}
          loading={loading}
          actionLoading={actionLoading}
          onLike={handleLike}
          onDislike={handleDislike}
          onSkip={handleSkip}
          emptyComponent={
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: '#777', fontSize: 16, marginBottom: 12 }}>
                Nessun vestito disponibile
              </Text>
              <TouchableOpacity onPress={reload} style={styles.reloadBtn} disabled={loading}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Ricarica feed</Text>
              </TouchableOpacity>
            </View>
          }
          renderFooter={
            <View style={styles.actionsBar}>
              <TouchableOpacity style={[styles.actionButton]} disabled={!current || actionLoading} onPress={() => current && handleDislike(current)}>
                <Ionicons name="close" size={38} color="#FF6347" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.starButton]} disabled={!current || actionLoading} onPress={() => current && handleSkip(current)}>
                <FontAwesome name="star-o" size={28} color="#5A31F4" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.heartButton]} disabled={!current || actionLoading} onPress={() => current && handleLike(current)}>
                <Ionicons name="heart" size={38} color="white" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton]} disabled={!current || actionLoading} onPress={() => current && handleSkip(current)}>
                <FontAwesome5 name="bolt" size={24} color="#FFC107" />
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          {/*filtri per ora inutili, vedremo dopo
          <View style={styles.navItem}>
            <Ionicons name="options-outline" size={24} color="#fff" />
            <Text style={styles.navText}>Filtri</Text>
          </View>
          */}
          <Link href="/matches" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="sync-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Match</Text>
            </View>
          </Link>
          {/*Chat lista inutile per ora, forse da rimuovere perchè le chat si aprono da match
          <Link href="/chats" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Chat</Text>
            </View>
          </Link>
          */}
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

      <MatchNotificationModal visible={matchModalVisible} match={currentMatch} onAction={handleMatchModalAction} />
    </SafeAreaView>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  deckWrapper: { flex: 1, paddingTop: 10, alignItems: 'center', justifyContent: 'center' },
  actionsBar: {
    marginTop: 24, flexDirection: 'row', justifyContent: 'space-around', width: SCREEN_WIDTH, paddingHorizontal: 14, alignItems: 'center',
  },
  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  logo: { width: 100, height: 40, resizeMode: 'contain' },
  actionButton: {
    width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 5,
  },
  starButton: { backgroundColor: '#FFF', width: 80, height: 80, borderRadius: 40 },
  heartButton: { backgroundColor: '#FF4458', width: 80, height: 80, borderRadius: 40, shadowColor: '#FF4458', shadowOpacity: 0.4 },
  bottomNavContainer: {
    backgroundColor: '#FF7AE9', borderWidth: 2.5, borderColor: '#FFE77A',
    borderTopLeftRadius: 100, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 100,
    overflow: 'hidden', margin: 20, alignSelf:'center', shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  bottomNav: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 30 },
  linkWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  navItem: { width: 60, height: 60, alignItems: 'center', flexDirection: 'column', borderColor: '#FFE77A', borderWidth: 2.5, borderRadius: 50, padding: 5 },
  navText: { fontSize: 12, color: '#fff', marginTop: 2 },
  logoutButton: { position: 'absolute', top: 50, left: 20, right: 20, padding: 15, backgroundColor: '#FFE77A', borderRadius: 12, alignItems: 'center', opacity: 0.9 },
  logoutText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  reloadBtn: { position: 'absolute', bottom: 24, left: '20%', right: '20%', backgroundColor: '#FF7AE9', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
});
