import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface SettingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onChangeAvatar: () => void;
}

export default function SettingsBottomSheet({ visible, onClose, onLogout, onChangeAvatar }: SettingsBottomSheetProps) {
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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>Impostazioni</Text>
          <View style={styles.menuItems}>
            <TouchableOpacity style={styles.menuItem} onPress={handleChangeAvatar}>
              <Ionicons name="image-outline" size={22} color="#333" />
              <Text style={styles.menuItemText}>Cambia avatar</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleFeedPreferences}>
              <Ionicons name="eye-outline" size={22} color="#333" />
              <Text style={styles.menuItemText}>Preferenze Feed</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Ionicons name="notifications-outline" size={22} color="#333" />
              <Text style={styles.menuItemText}>Notifiche</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={onClose}>
              <Ionicons name="shield-outline" size={22} color="#333" />
              <Text style={styles.menuItemText}>Privacy</Text>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#FF4D4F" />
              <Text style={[styles.menuItemText, styles.logoutText]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  handle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 20, textAlign: 'center' },
  menuItems: { gap: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12 },
  menuItemText: { flex: 1, fontSize: 16, color: '#333', marginLeft: 14 },
  logoutText: { color: '#FF4D4F', fontWeight: '600' },
  separator: { height: 1, backgroundColor: '#EEE', marginVertical: 10 },
});