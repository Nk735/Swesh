import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/apiClient';
import SwipeDeck, { DeckItem } from '../../components/SwipeDeck';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { user, logout, refreshMe } = useAuth();
  const [items, setItems] = useState<DeckItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reloadFlag, setReloadFlag] = useState(0);

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

  // Helpers per rimuovere la prima card (quella swippata)
  const popFirst = () => setItems(prev => prev.slice(1));

  const handleLike = async (item: DeckItem) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await api.post('/auth/like', { id: item._id });
      popFirst();
      refreshMe().catch(() => {});
    } catch (e: any) {
      Alert.alert('Errore', e?.response?.data?.message || e.message || 'Like fallito');
    } finally {
      setActionLoading(false);
    }
  };

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
    // Nessuna chiamata server (per ora)
    popFirst();
  };

  const reload = () => {
    if (loading || actionLoading) return;
    setReloadFlag(f => f + 1);
  };

  const current = items[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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

      {/* Swipe Deck */}
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
                <Ionicons name="arrow-undo-sharp" size={28} color="#FF6347" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.crossButton]}
                disabled={!current || actionLoading}
                onPress={() => current && handleDislike(current)}
              >
                <Ionicons name="close" size={38} color="white" />
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
                onPress={() => current && handleLike(current)}
              >
                <Ionicons name="checkmark" size={38} color="white" />
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

      {/* Bottom Nav */}
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <Ionicons name="options-outline" size={24} color="#fff" />
            <Text style={styles.navText}>Filtri</Text>
          </View>
          <Link href="/matches" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Like</Text>
            </View>
          </Link>
          <TouchableOpacity style={styles.homeButton}>
            <Image
              source={{ uri: 'https://placehold.co/60x60/fff/F87171?text=SWESH' }}
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
          <Link href="/chats" style={styles.linkWrapper}>
            <View style={styles.navItem}>
              <Ionicons name="sync-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Match</Text>
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
    </SafeAreaView>
  );
}

const ACTION_SIZE = 70;


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
    width: width,
    paddingHorizontal: 14,
    alignItems: 'center',
  },

  safeArea: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 10,
  },
  logo: { width: 100, height: 40, resizeMode: 'contain' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: {
    width: width * 0.9, /*height: height * 0.65,*/ borderRadius: 30, overflow: 'hidden',
    backgroundColor: '#eee', position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 25, backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardTextWrapper: { flexShrink: 1 },
  cardTitle: { fontSize: 28, fontWeight: 'bold', color: 'white' },
  cardSubtitle: { fontSize: 18, color: 'white', marginTop: 4 },
  cardButton: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
  },
  actions: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 18,
  },
  actionButton: {
    width: 65, height: 65, borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 5,
  },
  crossButton: {
    backgroundColor: '#FF6347', width: 80, height: 80, borderRadius: 40,
    shadowColor: '#FF6347', shadowOpacity: 0.4,
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
  homeButton: {
    backgroundColor: 'white', width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 8,
    elevation: 6, marginTop: -30,
  },
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
