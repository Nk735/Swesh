import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getDefaultAvatars, type AvatarOption } from '../src/services/avatarApi';

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (avatar: AvatarOption) => Promise<void> | void;
  currentUrl?: string;
};

export default function AvatarPickerModal({ visible, onClose, onConfirm, currentUrl }: Props) {
  const [avatars, setAvatars] = useState<AvatarOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setSelected(undefined);
      setLoading(true);
      getDefaultAvatars()
        .then(setAvatars)
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const confirm = async () => {
    if (!selected) return;
    const avatar = avatars.find(a => a.key === selected);
    if (!avatar) return;
    try {
      setSaving(true);
      await onConfirm(avatar);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Scegli un avatar</Text>

          {/* Preview */}
          <View style={styles.previewRow}>
            <Image
              source={{ uri: (avatars.find(a => a.key === selected)?.url) || currentUrl || 'https://placehold.co/100x100?text=?' }}
              style={styles.preview}
            />
          </View>

          {/* Grid */}
          <View style={{ flex: 1 }}>
            {loading ? (
              <View style={styles.center}><ActivityIndicator /></View>
            ) : (
              <FlatList
                data={avatars}
                keyExtractor={(a) => a.key}
                numColumns={4}
                columnWrapperStyle={{ gap: 12, marginBottom: 12 }}
                contentContainerStyle={{ paddingVertical: 8 }}
                renderItem={({ item }) => {
                  const isSel = selected ? selected === item.key : (currentUrl ? currentUrl === item.url : false);
                  return (
                    <TouchableOpacity onPress={() => setSelected(item.key)} style={[styles.tile, isSel && styles.tileSelected]}>
                      <Image source={{ uri: item.url }} style={styles.tileImg} />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose} disabled={saving}>
              <Text style={styles.btnTxtCancel}>Annulla</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.confirm, !selected && { opacity: 0.5 }]} onPress={confirm} disabled={!selected || saving}>
              <Text style={styles.btnTxtConfirm}>{saving ? '...' : 'Conferma'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const SIZE = 64;

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', maxHeight: '80%', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  previewRow: { alignItems: 'center', paddingVertical: 4 },
  preview: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tile: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  tileSelected: { borderColor: '#5A31F4' },
  tileImg: { width: '100%', height: '100%' },
  actions: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginTop: 4 },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 },
  cancel: { backgroundColor: '#F4F4F5' },
  confirm: { backgroundColor: '#5A31F4' },
  btnTxtCancel: { color: '#111' },
  btnTxtConfirm: { color: '#fff', fontWeight: '700' },
});