import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { getDefaultAvatars, AvatarOption } from '../src/services/avatarApi';
import { useTheme } from '../src/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: (choice: AvatarOption) => void;
  currentKey?: string;
}

export default function AvatarPickerModal({ visible, onClose, onConfirm, currentKey }: Props) {
  const { colors } = useTheme();
  const avatars = getDefaultAvatars();
  const [selected, setSelected] = useState<string | null>(currentKey || null);

  const handleConfirm = () => {
    const avatar = avatars.find(a => a.key === selected);
    if (avatar) {
      onConfirm(avatar);
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Scegli il tuo avatar</Text>
          
          <FlatList
            data={avatars}
            numColumns={2}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.avatarBox,
                  { borderColor: 'transparent' },
                  selected === item.key && { borderColor: colors.primary, backgroundColor: colors.inputBackground }
                ]}
                onPress={() => setSelected(item.key)}
              >
                <Image source={item.source} style={styles.avatarImage} />
                <Text style={[styles.avatarLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.inputBackground }]} onPress={onClose}>
              <Text style={[styles.cancelTxt, { color: colors.textSecondary }]}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: colors.primary }, !selected && styles.btnDisabled]} 
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
  container: { borderRadius: 16, padding: 20, width: '85%', maxHeight: '70%'},
  title: { fontSize: 20, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  grid: { alignItems: 'center' },
  avatarBox: { alignItems: 'center', margin: 10, padding: 10, borderRadius: 12, borderWidth: 2 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarLabel: { marginTop: 8, fontSize: 14 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, padding: 12, marginRight: 8, borderRadius: 8, alignItems: 'center' },
  cancelTxt: { fontWeight: '500' },
  confirmBtn: { flex: 1, padding: 12, marginLeft: 8, borderRadius: 8, alignItems: 'center'},
  confirmTxt: { color: '#fff', fontWeight: '600' },
  btnDisabled: { opacity: 0.5 },
});