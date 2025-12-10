import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';
import { TinderMatch } from '../../src/types/trade';

interface ItemsStripProps {
  matchInfo: TinderMatch | null;
  onItemPress: (item: TinderMatch['itemMine'] | null, isMine: boolean) => void;
}

export default function ItemsStrip({ matchInfo, onItemPress }: ItemsStripProps) {
  const { colors } = useTheme();

  if (!matchInfo) return null;

  return (
    <View style={[styles.itemsStrip, { backgroundColor: colors.background, borderColor: colors.border, zIndex: 1 }]}>
      <TouchableOpacity 
        style={styles.itemBox} 
        onPress={() => onItemPress(matchInfo.itemMine, true)}
      >
        {matchInfo.itemMine?. imageUrl ?  (
          <Image source={{ uri: matchInfo.itemMine. imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, { backgroundColor: colors.border }]} />
        )}
        <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.text }]}>
          {matchInfo.itemMine?.title || 'Mio oggetto'}
        </Text>
        <Text style={[styles.itemSubtitle, { color: colors. textSecondary }]}>Il tuo</Text>
      </TouchableOpacity>

      <Ionicons name="swap-horizontal" size={22} color={colors.textSecondary} />

      <TouchableOpacity 
        style={styles.itemBox} 
        onPress={() => onItemPress(matchInfo.itemTheirs, false)}
      >
        {matchInfo.itemTheirs?.imageUrl ? (
          <Image source={{ uri: matchInfo. itemTheirs.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, { backgroundColor: colors.border }]} />
        )}
        <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.text }]}>
          {matchInfo.itemTheirs?. title || 'Oggetto loro'}
        </Text>
        <Text style={[styles.itemSubtitle, { color: colors.textSecondary }]}>
          Di {matchInfo.otherUser?.nickname || 'Utente'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  itemsStrip: {
    flexDirection:  'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemBox: { alignItems: 'center', maxWidth: 140 },
  itemImage: { width: 80, height: 80, borderRadius: 8, marginBottom: 4 },
  itemTitle: { fontSize: 12, fontWeight:  '600' },
  itemSubtitle:  { fontSize: 10 },
});