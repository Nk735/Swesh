import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getChatMessages, sendChatMessage } from "../../../src/services/tradeApi";
import { ChatMessage } from "../../../src/types/trade";
import { useAuth } from "../../../src/context/AuthContext";

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const flatRef = useRef<FlatList>(null);

  const load = useCallback(() => {
    if (!chatId) return;
    setLoading(true);
    getChatMessages(chatId)
      .then(setMessages)
      .catch(()=>{})
      .finally(()=> setLoading(false));
  }, [chatId]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [load]);

  const submit = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      const resp = await sendChatMessage(chatId!, draft.trim());
      setMessages(prev => [...prev, resp]);
      setDraft('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e:any) {
      console.log('Errore invio', e?.response?.data || e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat scambio</Text>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m._id}
          renderItem={({ item }) => {
            const mine = user?.id ? String(item.senderId) === String(user.id) : false;
            return (
              <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[styles.msgTxt, !mine && { color: '#111' }]}>{item.content}</Text>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
              </View>
            );
          }}
          contentContainerStyle={{ padding:16 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}
      <View style={styles.composer}>
        <TextInput style={styles.input} placeholder="Scrivi un messaggio..." value={draft} onChangeText={setDraft} editable={!sending} />
        <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={sending}>
          <Text style={{ color:'#fff', fontWeight:'600' }}>{sending ? '...' : 'Invia'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header:{ padding:16, borderBottomWidth:1, borderColor:'#eee' },
  headerTitle:{ fontSize:18, fontWeight:'600' },
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  bubble:{ padding:10, borderRadius:12, marginBottom:8, maxWidth:'80%' },
  mine:{ backgroundColor:'#5A31F4', alignSelf:'flex-end' },
  theirs:{ backgroundColor:'#E4E6EB', alignSelf:'flex-start' },
  msgTxt:{ color:'#fff' },
  time:{ fontSize:10, color:'#666', marginTop:4 },
  composer:{ flexDirection:'row', padding:12, borderTopWidth:1, borderColor:'#eee' },
  input:{ flex:1, borderWidth:1, borderColor:"#ccc", borderRadius:8, padding:10, marginRight:8 },
  sendBtn:{ backgroundColor:'#5A31F4', paddingHorizontal:16, justifyContent:'center', borderRadius:8 }
});