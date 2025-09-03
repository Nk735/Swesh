import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { api } from '../../src/services/apiClient';

const { width, height } = Dimensions.get('window');

type Item = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  size?: string;
  category?: string;
  owner: {
    nickname: string;
    avatarUrl?: string;
  };
};

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Carica vestiti dal backend
    const fetchItems = async () => {
      setLoading(true);
      try {
        const res = await api.get('/items');
        setItems(res.data);
      } catch (error: any) {
        Alert.alert("Errore", error?.response?.data?.message || error.message || "Errore nel caricamento vestiti.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Funzione per azione swipe (es: like o dislike)
  const handleNext = () => {
    setIndex(prev => Math.min(prev + 1, items.length - 1));
  };

  // Card attuale
  const current = items[index];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Intestazione */}
      <View style={styles.header}>
        <Text> Ciao {user?.nickname || user?.email}</Text>
        <Image
          source={{ uri: 'https://placehold.co/100x40/5A31F4/FFFFFF?text=SWESH' }}
          style={styles.logo}
        />
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={28} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Card principale */}
      <View style={styles.cardContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#5A31F4" />
        ) : current ? (
          <View style={styles.card}>
            <Image
              source={{ uri: current.imageUrl }}
              style={styles.cardImage}
            />
            <View style={styles.cardOverlay}>
              <View style={styles.cardTextWrapper}>
                <Text style={styles.cardTitle}>{current.title}</Text>
                <Text style={styles.cardSubtitle}>Taglia: {current.size || '-'}</Text>
                <Text style={styles.cardSubtitle}>Owner: {current.owner?.nickname}</Text>
              </View>
              <TouchableOpacity style={styles.cardButton} onPress={handleNext}>
                <Ionicons name="arrow-up" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={{ textAlign: "center", color: "#aaa" }}>Nessun vestito disponibile</Text>
          </View>
        )}
      </View>

      {/* Pulsanti swipe */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="arrow-undo-sharp" size={28} color="#FF6347" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.crossButton]} onPress={handleNext}>
          <Ionicons name="close" size={38} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.starButton]}>
          <FontAwesome name="star-o" size={28} color="#5A31F4" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.checkButton]} onPress={handleNext}>
          <Ionicons name="checkmark" size={38} color="white" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <FontAwesome5 name="bolt" size={24} color="#FFC107" />
        </TouchableOpacity>
      </View>

      {/* Barra navigazione */}
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  logo: {
    width: 100,
    height: 40,
    resizeMode: 'contain',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width * 0.9,
    height: height * 0.65,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#eee',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTextWrapper: {
    flexShrink: 1,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  cardSubtitle: {
    fontSize: 20,
    color: 'white',
    marginTop: 5,
  },
  cardButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  actionButton: {
    width: 65,
    height: 65,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  crossButton: {
    backgroundColor: '#FF6347',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#FF6347',
    shadowOpacity: 0.4,
  },
  starButton: {
    backgroundColor: '#FFF',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  checkButton: {
    backgroundColor: '#32CD32',
    width: 80,
    height: 80,
    borderRadius: 40,
    shadowColor: '#32CD32',
    shadowOpacity: 0.4,
  },
  bottomNavContainer: {
    backgroundColor: '#5A31F4',
    borderWidth: 5,
    borderColor: '#FF5A61',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 100,
    overflow: 'hidden',
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  bottomNav: {
    borderBlockColor: '#FF5A61',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 25,
  },
  linkWrapper: {
    flex: 1, // Assicura che i link occupino lo stesso spazio
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItem: {
    width: 70,
    height: 70,
    alignItems: 'center',
    flexDirection: 'column',
    borderColor: '#FF5A61',
    borderWidth: 5,
    borderRadius: 50,
    padding: 8,
  },
  navText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 2,
  },
  homeButton: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    marginTop: -30,
  },
  logoutButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: '#FF6347',
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.9,
  },
  logoutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
