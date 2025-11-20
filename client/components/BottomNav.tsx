import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BottomNav() {
  const pathname = usePathname();
  const active = pathname.startsWith('/profile') ? 'profile'
               : pathname.startsWith('/matches') ? 'matches'
               : (pathname === '/' || pathname === '') ? 'home' 
               : null;

// Funzione che applica lo stile attivo specifico
  const getActiveStyle = (itemKey: 'matches' | 'profile' | 'home') => {
    if (active === itemKey) {
      if (itemKey === 'matches') {
        return styles.navItemActiveMatches;
      }
      if (itemKey === 'profile') {
        return styles.navItemActiveProfile;
      }
      if (itemKey === 'home') {
        return styles.navItemActiveHome;
      }
    }
    return null;
  };

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        <Link href="/matches" style={styles.linkWrapper}>
          <View style={[styles.navItem, getActiveStyle('matches')]}>
            <Ionicons name="sync-outline" size={24} color="#fff" />
            <Text style={styles.navText}>Match</Text>
          </View>
        </Link>
        <Link href="/" style={styles.linkWrapper}>
          <View style={[styles.navItem, getActiveStyle('home')]}>
            <Ionicons name="home-outline" size={24} color="#fff" />
            <Text style={styles.navText}>Home</Text>
          </View>
        </Link>
        <Link href="/profile" style={styles.linkWrapper}>
          <View style={[styles.navItem, getActiveStyle('profile')]}>
            <Ionicons name="person-outline" size={24} color="#fff" />
            <Text style={styles.navText}>Profilo</Text>
          </View>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute', left: 20, right: 20, bottom: 0,
    backgroundColor: '#F28585', borderWidth: 2.5, borderColor: '#F2B263',
    borderTopLeftRadius: 100, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 100,
    overflow: 'hidden', margin: 20, alignSelf:'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  bottomNav: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 30 },
  linkWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10 },
  navItem: {
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', padding: 5,
  },
  navText: { fontSize: 12, color: '#fff', marginTop: 2 },

  navItemActiveHome: {
    borderColor: '#F2B263', 
    borderWidth: 2.5,      
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },

  navItemActiveMatches: {
    borderColor: '#F2B263', borderWidth: 2.5, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 25, borderTopRightRadius: 100, borderBottomLeftRadius: 100, borderBottomRightRadius: 25,
  },

  navItemActiveProfile: {
    borderColor: '#F2B263', borderWidth: 2.5, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.12)',
    borderTopLeftRadius: 100, borderTopRightRadius: 25, borderBottomLeftRadius: 25, borderBottomRightRadius: 100,
  },

});