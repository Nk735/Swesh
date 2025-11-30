import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme';

export default function BottomNav() {
  const { colors } = useTheme();
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
    <View style={[styles.bottomNavContainer, { backgroundColor: colors.navBackground, borderColor: colors.navBorder }]}>
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
            <View style={[styles.navbox, getActiveStyle('profile')]}>
              <Ionicons name="person-outline" size={24} color="#fff" />
              <Text style={styles.navText}>Profilo</Text>
            </View>
          </View>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavContainer: {
    position: 'absolute', bottom: 0,
    borderWidth: 2.5, transform: [{ skewX: '-30deg' }], borderRadius: 20,
    overflow: 'hidden', margin: 10, alignSelf:'center'
  },
  bottomNav: { flexDirection: 'row', alignItems: 'center', paddingVertical: 0, paddingHorizontal: 0 },
  linkWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navItem: {
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center', transform: [{ skewX: '30deg' }],
    flexDirection: 'column', marginHorizontal: 10, paddingHorizontal: 10, paddingVertical: 10,
  },
  navText: { fontSize: 12, color: '#fff', marginTop: 0,},

  navItemActiveHome: {},
  navItemActiveMatches: {},
  navItemActiveProfile: {},

  navbox: {
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', marginHorizontal: 10, paddingHorizontal: 10, paddingVertical: 10,
  },
  navboxActiveProfile: {
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center', 
    flexDirection: 'column', marginHorizontal: 10, paddingHorizontal: 10, paddingVertical: 10,
  },

});