import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../src/theme';

interface SettingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onChangeAvatar: () => void;
}

export default function SettingsBottomSheet({ visible, onClose, onLogout, onChangeAvatar }: SettingsBottomSheetProps) {
  const { colors } = useTheme();

  const handleLogout = () => {
    onClose();
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Sei sicuro di voler uscire?');
      if (confirmed) { onLogout(); }
    } else {
      Alert.alert('Logout', 'Sei sicuro di voler uscire? ', [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Esci', style: 'destructive', onPress: onLogout }
      ]);
    }
  };

  const handleChangeAvatar = () => {
    onClose();
    onChangeAvatar();
  };

  const handleFeedPreferences = () => {
    onClose();
    router.push('/settings/feedPreferences');
  };

  const handleAppearance = () => {
    onClose();
    router.push('/settings/appearance');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>Impostazioni</Text>
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem} onPress={handleChangeAvatar}>
              <Ionicons name="image-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Cambia avatar</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleFeedPreferences}>
              <Ionicons name="eye-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Preferenze Feed</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleAppearance}>
              <Ionicons name="contrast-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Aspetto</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Notifiche</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Ionicons name="shield-outline" size={22} color={colors.textSecondary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.border} />
            </TouchableOpacity>
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <Text style={[styles.menuItemText, styles.logoutText, { color: colors.error }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  menuItems: { gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  menuItemText: { flex: 1, fontSize: 16, marginLeft: 14 },
  logoutText: { fontWeight: '600' },
  separator: { height: 1, marginVertical: 10 },
});