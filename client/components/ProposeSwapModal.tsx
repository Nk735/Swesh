import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { api } from '../src/services/apiClient';
import { Item } from '../src/types';
import { createProposal } from '../src/services/tradeApi';

interface Props {
  visible: boolean;
  onClose: () => void;
  targetItemId: string | null;
  onResult: (result: { matched: boolean; matchId?: string; chatId?: string }) => void;
}

export const ProposeSwapModal: React.FC<Props> = ({ visible, onClose, targetItemId, onResult }) => {
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      api.get('/items/mine')
        .then(r => setMyItems(r.data))
        .catch(() => setMyItems([]))
        .finally(() => setLoading(false));
    }
  }, [visible]);

  const propose = async (offeredId: string) => {
    if (!targetItemId) return;
    setSubmitting(offeredId);
    try {
      const resp = await createProposal(targetItemId, offeredId);
      if (resp.status === 'matched') {
        onResult({ matched: true, matchId: resp.matchId, chatId: resp.chatId });
      } else {
        onResult({ matched: false });
      }
      onClose();
    } catch (e:any) {
      // Semplice fallback
      console.log('Errore proposta', e?.response?.data || e.message);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Seleziona un tuo capo da proporre</Text>
          {loading ? (
            <ActivityIndicator />
          ) : (
            <FlatList
              data={myItems}
              keyExtractor={i => i._id}
              horizontal
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.item}
                  onPress={() => propose(item._id)}
                  disabled={!!submitting}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.img} />
                  <Text numberOfLines={1} style={styles.label}>{item.title}</Text>
                  {submitting === item._id && <ActivityIndicator size="small" color="#fff" style={styles.loadingOverlay} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color:'#777' }}>Non hai ancora capi</Text>}
            />
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={{ color:'#fff', fontWeight:'600' }}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop:{
    flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'
  },
  sheet:{
    backgroundColor:'#fff', padding:16, borderTopLeftRadius:22, borderTopRightRadius:22, minHeight:300
  },
  title:{ fontSize:18, fontWeight:'600', marginBottom:12 },
  item:{
    width:130, marginRight:12, backgroundColor:'#333', borderRadius:12, overflow:'hidden', position:'relative'
  },
  img:{ width:'100%', height:150 },
  label:{ color:'#fff', padding:6, fontSize:14 },
  loadingOverlay:{
    position:'absolute', top:8, right:8
  },
  closeBtn:{
    marginTop:16, backgroundColor:'#5A31F4', padding:12, borderRadius:10, alignItems:'center'
  }
});