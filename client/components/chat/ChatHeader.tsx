import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { TinderMatch } from '../../src/types/trade';

interface ChatHeaderProps {
  matchInfo: TinderMatch | null;
  isCompleted: boolean;
  isReadOnly:  boolean;
  menuOpen: boolean;
  onMenuToggle: () => void;
  onCancelTrade: () => void;
}

export default function ChatHeader({ 
  matchInfo, 
  isCompleted, 
  isReadOnly, 
  menuOpen, 
  onMenuToggle, 
  onCancelTrade 
}: ChatHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const avatar = matchInfo?.otherUser?. avatarUrl || 'https://placehold.co/60x60';
  const name = matchInfo?.otherUser?. nickname || 'Utente';

  return (
    <View style={[styles.header, { borderColor: colors.border, backgroundColor: colors.card, paddingTop: insets.top + 10, zIndex: 200 }]}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.headerLeft}>
        <Image source={{ uri:  avatar }} style={[styles.headerAvatar, { backgroundColor: colors.border }]} />
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{name}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {isCompleted ? 'Scambio completato' : (isReadOnly ? 'Scambio non attivo' : 'Scambio in corso')}
          </Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.headerMenuBtn} 
        onPress={onMenuToggle} 
        hitSlop={{ top: 8, bottom: 8, left:  8, right: 8 }}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
      </TouchableOpacity>

      {menuOpen && (
        <View style={[styles.menuDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {! isReadOnly && (
            <TouchableOpacity style={styles. menuItem} onPress={onCancelTrade}>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Annulla scambio</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => { /* Segnala */ }}
          >
            <Text style={[styles.menuItemText, { color: colors.text }]}>Segnala utente</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingBottom: 10, 
    borderBottomWidth: 1 
  },
  backBtn:  { marginRight: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  headerSubtitle:  { fontSize: 12 },
  headerMenuBtn: { padding: 6 },
  menuDropdown:  {
    position: 'absolute',
    right: 10,
    top: 90,
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    zIndex: 100
  },
  menuItem:  { paddingHorizontal: 14, paddingVertical: 10, minWidth: 160 },
  menuItemText:  { fontSize: 14 },
});