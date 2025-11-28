import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { getDefaultAvatars, AvatarOption } from '../src/services/avatarApi';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (choice: AvatarOption) => void;
  currentKey?: string;
}

export default function AvatarPickerModal({ visible, onClose, onConfirm, currentKey }: Props) {
  const avatars = getDefaultAvatars();
  const [selected, setSelected] = useState<string | null>(currentKey || null);

  const handleConfirm = () => {
    const avatar = avatars.find(a => a. key === selected);
    if (avatar) {
      onConfirm(avatar);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Scegli il tuo avatar</Text>
          
          <FlatList
            data={avatars}
            numColumns={2}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles. avatarBox,
                  selected === item.key && styles.avatarSelected
                ]}
                onPress={() => setSelected(item.key)}
              >
                <Image source={item.source} style={styles.avatarImage} />
                <Text style={styles.avatarLabel}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelTxt}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmBtn, ! selected && styles.btnDisabled]} 
              onPress={handleConfirm}
              disabled={!selected}
            >
              <Text style={styles.confirmTxt}>Conferma</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'},
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxHeight: '70%'},
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16, color: '#333'},
  grid: { alignItems: 'center' },
  avatarBox: { alignItems: 'center', margin: 10, padding: 10, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  avatarSelected: { borderColor: '#5A31F4', backgroundColor: '#F0EBFF' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarLabel: { marginTop: 8, fontSize: 14, color: '#555' },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, padding: 12, marginRight: 8, borderRadius: 8, backgroundColor: '#eee', alignItems: 'center' },
  cancelTxt: { color: '#666', fontWeight: '500' },
  confirmBtn: { flex: 1, padding: 12, marginLeft: 8, borderRadius: 8, backgroundColor: '#5A31F4', alignItems: 'center'},
  confirmTxt: { color: '#fff', fontWeight: '600' },
  btnDisabled: { backgroundColor: '#ccc' },
});