import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Animated, PanResponder, Alert } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getChatMessages, sendChatMessage, getMatchById, cancelMatch } from "../../../src/services/tradeApi";
import { ChatMessage, TinderMatch } from "../../../src/types/trade";
import { useAuth } from "../../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function ChatScreen() {
  // Nota: chatId nel path è il matchId usato dalle API chat
  const { chatId: matchId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();

  const [matchInfo, setMatchInfo] = useState<TinderMatch | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [proposalSent, setProposalSent] = useState(false);

  const flatRef = useRef<FlatList>(null);

  // Slider state
  const SLIDER_WIDTH = 260;
  const KNOB_SIZE = 38;
  const sliderX = useRef(new Animated.Value(0)).current;
  const [sliderActive, setSliderActive] = useState(false);

  const isReadOnly = matchInfo?.status && matchInfo.status !== 'active';

  const sliderResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !proposalSent && !isReadOnly,
      onMoveShouldSetPanResponder: (_, g) => !proposalSent && !isReadOnly && Math.abs(g.dx) > 3,
      onPanResponderMove: (_, g) => {
        if (proposalSent || isReadOnly) return;
        const next = Math.max(0, Math.min(g.dx, SLIDER_WIDTH - KNOB_SIZE));
        sliderX.setValue(next);
        setSliderActive(true);
      },
      onPanResponderRelease: () => {
        if (isReadOnly) return;
        const threshold = SLIDER_WIDTH - KNOB_SIZE - 8;
        sliderX.stopAnimation((val) => {
          if (val >= threshold) {
            Animated.timing(sliderX, { toValue: SLIDER_WIDTH - KNOB_SIZE, duration: 120, useNativeDriver: false }).start(() => {
              setProposalSent(true);
              setSliderActive(false);
              // Placeholder: in futuro chiameremo un endpoint per confermare la proposta
              Alert.alert('Proposta inviata', 'In attesa conferma dell’altro utente');
            });
          } else {
            Animated.spring(sliderX, { toValue: 0, useNativeDriver: false, friction: 7 }).start(() => setSliderActive(false));
          }
        });
      },
      onPanResponderTerminate: () => {
        if (proposalSent || isReadOnly) return;
        Animated.spring(sliderX, { toValue: 0, useNativeDriver: false, friction: 7 }).start(() => setSliderActive(false));
      }
    })
  ).current;

  const loadAll = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const [m, env] = await Promise.all([
        getMatchById(String(matchId)),
        getChatMessages(String(matchId))
      ]);
      setMatchInfo(m || null);
      // getChatMessages può restituire { messages } oppure direttamente un array
      // Normalizziamo per compat:
      const msgs = Array.isArray(env) ? env : (env as any)?.messages ?? [];
      setMessages(msgs);
    } catch (e:any) {
      console.log('Errore caricamento chat', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    loadAll();
    const id = setInterval(() => {
      if (matchId) {
        getChatMessages(String(matchId))
          .then((env:any) => {
            const msgs = Array.isArray(env) ? env : env?.messages ?? [];
            setMessages(msgs);
          })
          .catch(()=>{});
      }
    }, 15000);
    return () => clearInterval(id);
  }, [loadAll, matchId]);

  const submit = async () => {
    if (!draft.trim() || sending || !matchId || isReadOnly) return;
    setSending(true);
    try {
      const resp = await sendChatMessage(String(matchId), draft.trim());
      setMessages(prev => [...prev, resp]);
      setDraft('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e:any) {
      console.log('Errore invio', e?.response?.data || e.message);
      Alert.alert('Errore invio', e?.response?.data?.message || e.message || 'Invio non riuscito');
    } finally {
      setSending(false);
    }
  };

  const onCancelTrade = () => {
    if (!matchId) return;
    setMenuOpen(false);
    Alert.alert(
      'Annulla scambio',
      'Sei sicuro di voler annullare questo scambio? L’altro utente verrà informato e la chat diventerà in sola lettura.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sì, annulla',
          style: 'destructive',
          onPress: async () => {
            try {
              const resp = await cancelMatch(String(matchId));
              // Aggiorna lo stato locale del match a archived
              setMatchInfo(prev => prev ? { ...prev, status: resp.status } as TinderMatch : prev);
              // Ricarica i messaggi per includere l’eventuale messaggio di sistema dal server
              loadAll();
              Alert.alert('Scambio annullato', 'La chat è ora in sola lettura.');
            } catch (e:any) {
              Alert.alert('Errore', e?.response?.data?.message || e.message || 'Impossibile annullare lo scambio');
            }
          }
        }
      ]
    );
  };

  const Header = () => {
    const avatar = matchInfo?.otherUser?.avatarUrl || 'https://placehold.co/60x60';
    const name = matchInfo?.otherUser?.nickname || 'Utente';

    return (
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerTitle}>{name}</Text>
            <Text style={styles.headerSubtitle}>{isReadOnly ? 'Scambio non attivo' : 'Scambio in corso'}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerMenuBtn} onPress={() => setMenuOpen(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </TouchableOpacity>

        {menuOpen && (
          <View style={styles.menuDropdown}>
            <TouchableOpacity style={styles.menuItem} onPress={onCancelTrade}>
              <Text style={styles.menuItemText}>Annulla scambio</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuOpen(false); Alert.alert('Segnala utente', 'Funzione in arrivo'); }}>
              <Text style={styles.menuItemText}>Segnala utente</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const ItemsStrip = () => {
    if (!matchInfo) return null;
    return (
      <View style={styles.itemsStrip}>
        <View style={styles.itemBox}>
          {matchInfo.itemMine?.imageUrl ? <Image source={{ uri: matchInfo.itemMine.imageUrl }} style={styles.itemImage} /> : <View style={[styles.itemImage,{backgroundColor:'#eee'}]} />}
          <Text numberOfLines={1} style={styles.itemTitle}>{matchInfo.itemMine?.title || 'Mio oggetto'}</Text>
        </View>
        <Ionicons name="swap-horizontal" size={22} color="#666" />
        <View style={styles.itemBox}>
          {matchInfo.itemTheirs?.imageUrl ? <Image source={{ uri: matchInfo.itemTheirs.imageUrl }} style={styles.itemImage} /> : <View style={[styles.itemImage,{backgroundColor:'#eee'}]} />}
          <Text numberOfLines={1} style={styles.itemTitle}>{matchInfo.itemTheirs?.title || 'Oggetto loro'}</Text>
        </View>
      </View>
    );
  };

  const SlideToConfirm = () => {
    const disabled = !!isReadOnly;
    return (
      <View style={styles.sliderWrap}>
        <Text style={styles.sliderLabel}>
          {disabled ? 'Scambio non attivo: slider disabilitato' : (proposalSent ? 'Proposta inviata' : 'Trascina per inviare proposta')}
        </Text>
        <View style={[
          styles.sliderTrack,
          (proposalSent || disabled) && { backgroundColor: disabled ? '#EEE' : '#D1FADF', borderColor: disabled ? '#DDD' : '#34C759' }
        ]}>
          {!(proposalSent || disabled) && (
            <Animated.View
              style={[styles.sliderFill, { width: Animated.add(sliderX, KNOB_SIZE) }]}
            />
          )}
          <Animated.View
            style={[
              styles.sliderKnob,
              {
                transform: [{ translateX: proposalSent ? SLIDER_WIDTH - KNOB_SIZE : (disabled ? 0 : sliderX) }],
                backgroundColor: disabled ? '#BBB' : (proposalSent ? '#34C759' : (sliderActive ? '#5A31F4' : '#7A5AF8'))
              }
            ]}
            {...(!(proposalSent || disabled) ? sliderResponder.panHandlers : {})}
          >
            <Ionicons name={proposalSent ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
          </Animated.View>
        </View>
        {proposalSent && !disabled && (
          <Text style={styles.sliderHint}>In attesa della conferma dell’altro utente</Text>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex:1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header />
      {isReadOnly ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTxt}>
            {matchInfo?.status === 'archived' ? 'Scambio annullato' : 'Scambio non attivo'}
          </Text>
        </View>
      ) : null}
      <ItemsStrip />

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
          contentContainerStyle={{ padding:16, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      {/* Slider proposta */}
      <SlideToConfirm />

      {/* Composer messaggi */}
      <View style={[styles.composer, isReadOnly && { opacity: 0.5 }]}>
        <TextInput
          style={styles.input}
          placeholder={isReadOnly ? 'Chat in sola lettura' : 'Scrivi un messaggio...'}
          value={draft}
          onChangeText={setDraft}
          editable={!sending && !isReadOnly}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={sending || !draft.trim() || !!isReadOnly}>
          <Text style={{ color:'#fff', fontWeight:'600' }}>{sending ? '...' : 'Invia'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Header
  header:{ paddingHorizontal:16, paddingBottom:10, paddingTop: 50, borderBottomWidth:1, borderColor:'#eee', backgroundColor:'#fff' },
  headerLeft:{ flexDirection:'row', alignItems:'center', gap:12 },
  headerAvatar:{ width:40, height:40, borderRadius:20, backgroundColor:'#eee' },
  headerTitle:{ fontSize:16, fontWeight:'700', color:'#111' },
  headerSubtitle:{ fontSize:12, color:'#666' },
  headerMenuBtn:{ position:'absolute', right:12, top:56, padding:6,},
  menuDropdown:{
    position:'absolute', right:10, top:46, backgroundColor:'#fff', borderWidth:1, borderColor:'#eee',
    borderRadius:10, overflow:'hidden', shadowColor:'#000', shadowOpacity:0.1, shadowRadius:6
  },
  menuItem:{ paddingHorizontal:14, paddingVertical:10, minWidth:160 },
  menuItemText:{ color:'#111', fontSize:14 },

  // Banner stato match
  banner:{ backgroundColor:'#FFF3CD', padding:10, borderBottomWidth:1, borderColor:'#FDE68A' },
  bannerTxt:{ color:'#7A5C00', textAlign:'center', fontWeight:'600' },

  // Items strip
  itemsStrip:{
    flexDirection:'row', alignItems:'center', justifyContent:'center', gap:16,
    paddingVertical:10, backgroundColor:'#fafafa', borderBottomWidth:1, borderColor:'#f0f0f0'
  },
  itemBox:{ alignItems:'center', maxWidth:140 },
  itemImage:{ width:96, height:96, borderRadius:8, backgroundColor:'#ddd', marginBottom:6 },
  itemTitle:{ fontSize:12, fontWeight:'600', color:'#333' },

  // Chat UI
  center:{ flex:1, justifyContent:'center', alignItems:'center' },
  bubble:{ padding:10, borderRadius:12, marginBottom:8, maxWidth:'80%' },
  mine:{ backgroundColor:'#5A31F4', alignSelf:'flex-end' },
  theirs:{ backgroundColor:'#E4E6EB', alignSelf:'flex-start' },
  msgTxt:{ color:'#fff' },
  time:{ fontSize:10, color:'#666', marginTop:4 },

  // Slider
  sliderWrap:{ paddingHorizontal:16, paddingBottom:8, paddingTop:6, backgroundColor:'#fff' },
  sliderLabel:{ textAlign:'center', fontSize:12, color:'#666', marginBottom:6 },
  sliderTrack:{
    alignSelf:'center', width:260, height:44, borderRadius:22, backgroundColor:'#F4F4F5',
    borderWidth:1, borderColor:'#E5E7EB', overflow:'hidden', position:'relative'
  },
  sliderFill:{
    position:'absolute', left:0, top:0, bottom:0, backgroundColor:'#E6E1FF'
  },
  sliderKnob:{
    width:38, height:38, borderRadius:19, position:'absolute', left:0, top:3,
    alignItems:'center', justifyContent:'center', shadowColor:'#000', shadowOpacity:0.15, shadowRadius:4
  },
  sliderHint:{ marginTop:6, textAlign:'center', fontSize:12, color:"#34C759", fontWeight:'600' },

  // Composer
  composer:{ flexDirection:'row', padding:12, borderTopWidth:1, borderColor:'#eee', backgroundColor:'#fff' },
  input:{ flex:1, borderWidth:1, borderColor:"#ccc", borderRadius:8, padding:10, marginRight:8, backgroundColor:'#fff' },
  sendBtn:{ backgroundColor:'#5A31F4', paddingHorizontal:16, justifyContent:'center', borderRadius:8 }
});