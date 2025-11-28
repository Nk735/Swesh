import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Animated, PanResponder, Alert, Modal } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getChatMessages, sendChatMessage, getMatchById, cancelMatch, confirmExchange } from "../../../src/services/tradeApi";
import { ChatMessage, TinderMatch } from "../../../src/types/trade";
import { useAuth } from "../../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import socketService from "../../../src/services/socketService";

export default function ChatScreen() {
  const { chatId: matchId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();

  const [matchInfo, setMatchInfo] = useState<TinderMatch | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [myConfirmed, setMyConfirmed] = useState(false);
  const [otherConfirmed, setOtherConfirmed] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [itemDetailModal, setItemDetailModal] = useState<{ visible: boolean; item: TinderMatch['itemMine'] | null; isMine: boolean }>({ visible: false, item: null, isMine: true });

  const flatRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SLIDER_WIDTH = 260;
  const KNOB_SIZE = 38;
  const sliderX = useRef(new Animated.Value(0)).current;
  const [sliderActive, setSliderActive] = useState(false);

  const isReadOnly = matchInfo?.status && matchInfo.status !== 'active';
  const isCompleted = matchInfo?.status === 'completed';

  useEffect(() => {
    let unsubNewMessage: (() => void) | undefined;
    let unsubTyping: (() => void) | undefined;
    let unsubExchangeStatus: (() => void) | undefined;

    const setupSocket = async () => {
      try {
        await socketService.connect();
        if (matchId) {
          socketService.joinChat(String(matchId));

          unsubNewMessage = socketService.onNewMessage((data) => {
            if (data.matchId === matchId) {
              setMessages(prev => {
                if (prev.some(m => m._id === data.message._id)) {
                  return prev;
                }
                return [...prev, data.message];
              });
              setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
            }
          });

          unsubTyping = socketService.onTyping((data) => {
            if (data.matchId === matchId && data.userId !== user?.id) {
              setIsTyping(data.isTyping);
            }
          });

          unsubExchangeStatus = socketService.onExchangeStatus((data) => {
            if (data.matchId === matchId) {
              if (matchInfo) {
                const meIsA = String(matchInfo.otherUser._id) !== String(user?.id);
                if (meIsA) {
                  setMyConfirmed(data.confirmation.userAConfirmed);
                  setOtherConfirmed(data.confirmation.userBConfirmed);
                } else {
                  setMyConfirmed(data.confirmation.userBConfirmed);
                  setOtherConfirmed(data.confirmation.userAConfirmed);
                }
              }
              if (data.status === 'completed') {
                setMatchInfo(prev => prev ? { ...prev, status: 'completed' } : prev);
                Alert.alert('Scambio completato!', 'Entrambi avete confermato lo scambio.');
              }
            }
          });
        }
      } catch (err) {
        console.log('[Chat] Socket connection failed, using polling fallback');
      }
    };

    setupSocket();

    return () => {
      if (matchId) {
        socketService.leaveChat(String(matchId));
      }
      unsubNewMessage?.();
      unsubTyping?.();
      unsubExchangeStatus?.();
    };
  }, [matchId, user?.id, matchInfo?.otherUser?._id]);

  // Use useMemo to avoid recreating PanResponder on every render
  const sliderResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => !myConfirmed && !isReadOnly,
      onMoveShouldSetPanResponder: (_, g) => !myConfirmed && !isReadOnly && Math.abs(g.dx) > 3,
      onPanResponderMove: (_, g) => {
        if (myConfirmed || isReadOnly) return;
        const next = Math.max(0, Math.min(g.dx, SLIDER_WIDTH - KNOB_SIZE));
        sliderX.setValue(next);
        setSliderActive(true);
      },
      onPanResponderRelease: () => {
        if (isReadOnly || myConfirmed) return;
        const threshold = SLIDER_WIDTH - KNOB_SIZE - 8;
        sliderX.stopAnimation(async (val) => {
          if (val >= threshold) {
            Animated.timing(sliderX, { toValue: SLIDER_WIDTH - KNOB_SIZE, duration: 120, useNativeDriver: false }).start(async () => {
              setSliderActive(false);
              try {
                const resp = await confirmExchange(String(matchId));
                setMyConfirmed(resp.confirmation.myConfirmed);
                setOtherConfirmed(resp.confirmation.otherConfirmed);
                if (resp.status === 'completed') {
                  setMatchInfo(prev => prev ? { ...prev, status: 'completed' } : prev);
                  Alert.alert('Scambio completato!', 'Entrambi avete confermato lo scambio.');
                } else {
                  Alert.alert('Proposta inviata', "In attesa della conferma dell'altro utente");
                }
                socketService.confirmExchange(String(matchId));
              } catch (e: any) {
                Alert.alert('Errore', e?.response?.data?.message || 'Impossibile confermare lo scambio');
                Animated.spring(sliderX, { toValue: 0, useNativeDriver: false, friction: 7 }).start();
              }
            });
          } else {
            Animated.spring(sliderX, { toValue: 0, useNativeDriver: false, friction: 7 }).start(() => setSliderActive(false));
          }
        });
      },
      onPanResponderTerminate: () => {
        if (myConfirmed || isReadOnly) return;
        Animated.spring(sliderX, { toValue: 0, useNativeDriver: false, friction: 7 }).start(() => setSliderActive(false));
      }
    });
  }, [myConfirmed, isReadOnly, matchId, sliderX]);

  const loadAll = useCallback(async () => {
    if (!matchId) return;
    setLoading(true);
    try {
      const [m, env] = await Promise.all([
        getMatchById(String(matchId)),
        getChatMessages(String(matchId))
      ]);
      setMatchInfo(m || null);
      if (m?.confirmation) {
        setMyConfirmed(m.confirmation.myConfirmed);
        setOtherConfirmed(m.confirmation.otherConfirmed);
        if (m.confirmation.myConfirmed) {
          sliderX.setValue(SLIDER_WIDTH - KNOB_SIZE);
        }
      }
      const msgs = Array.isArray(env) ? env : (env as any)?.messages ?? [];
      setMessages(msgs);
    } catch (e: any) {
      console.log('Errore caricamento chat', e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  }, [matchId, sliderX, SLIDER_WIDTH, KNOB_SIZE]);

  useEffect(() => {
    loadAll();
    const id = setInterval(() => {
      if (matchId && !socketService.isConnected()) {
        getChatMessages(String(matchId))
          .then((env: any) => {
            const msgs = Array.isArray(env) ? env : env?.messages ?? [];
            setMessages(msgs);
          })
          .catch(() => { });
      }
    }, 15000);
    return () => clearInterval(id);
  }, [loadAll, matchId]);

  const handleTextChange = (text: string) => {
    setDraft(text);
    
    if (matchId && text.length > 0) {
      socketService.startTyping(String(matchId));
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socketService.stopTyping(String(matchId));
      }, 2000);
    } else if (matchId) {
      socketService.stopTyping(String(matchId));
    }
  };

  const submit = async () => {
    if (!draft.trim() || sending || !matchId || isReadOnly) return;
    setSending(true);
    
    socketService.stopTyping(String(matchId));
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      if (socketService.isConnected()) {
        socketService.sendMessage(String(matchId), draft.trim());
        setDraft('');
        setSending(false);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
      } else {
        const resp = await sendChatMessage(String(matchId), draft.trim());
        setMessages(prev => [...prev, resp]);
        setDraft('');
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
      }
    } catch (e: any) {
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
      "Sei sicuro di voler annullare questo scambio? L'altro utente verra informato e la chat diventera in sola lettura.",
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Si, annulla',
          style: 'destructive',
          onPress: async () => {
            try {
              const resp = await cancelMatch(String(matchId));
              setMatchInfo(prev => prev ? { ...prev, status: resp.status } as TinderMatch : prev);
              loadAll();
              Alert.alert('Scambio annullato', 'La chat e ora in sola lettura.');
            } catch (e: any) {
              Alert.alert('Errore', e?.response?.data?.message || e.message || 'Impossibile annullare lo scambio');
            }
          }
        }
      ]
    );
  };

  const openItemDetail = (item: TinderMatch['itemMine'] | null, isMine: boolean) => {
    if (item) {
      setItemDetailModal({ visible: true, item, isMine });
    }
  };

  const Header = () => {
    const avatar = matchInfo?.otherUser?.avatarUrl || 'https://placehold.co/60x60';
    const name = matchInfo?.otherUser?.nickname || 'Utente';

    return (
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Image source={{ uri: avatar }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerTitle}>{name}</Text>
            <Text style={styles.headerSubtitle}>
              {isCompleted ? 'Scambio completato' : (isReadOnly ? 'Scambio non attivo' : 'Scambio in corso')}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.headerMenuBtn} onPress={() => setMenuOpen(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={20} color="#333" />
        </TouchableOpacity>

        {menuOpen && (
          <View style={styles.menuDropdown}>
            {!isReadOnly && (
              <TouchableOpacity style={styles.menuItem} onPress={onCancelTrade}>
                <Text style={styles.menuItemText}>Annulla scambio</Text>
              </TouchableOpacity>
            )}
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
        <TouchableOpacity style={styles.itemBox} onPress={() => openItemDetail(matchInfo.itemMine, true)}>
          {matchInfo.itemMine?.imageUrl ? <Image source={{ uri: matchInfo.itemMine.imageUrl }} style={styles.itemImage} /> : <View style={[styles.itemImage, { backgroundColor: '#eee' }]} />}
          <Text numberOfLines={1} style={styles.itemTitle}>{matchInfo.itemMine?.title || 'Mio oggetto'}</Text>
          <Text style={styles.itemSubtitle}>Il tuo</Text>
        </TouchableOpacity>
        <Ionicons name="swap-horizontal" size={22} color="#666" />
        <TouchableOpacity style={styles.itemBox} onPress={() => openItemDetail(matchInfo.itemTheirs, false)}>
          {matchInfo.itemTheirs?.imageUrl ? <Image source={{ uri: matchInfo.itemTheirs.imageUrl }} style={styles.itemImage} /> : <View style={[styles.itemImage, { backgroundColor: '#eee' }]} />}
          <Text numberOfLines={1} style={styles.itemTitle}>{matchInfo.itemTheirs?.title || 'Oggetto loro'}</Text>
          <Text style={styles.itemSubtitle}>Di {matchInfo.otherUser?.nickname || 'Utente'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const SlideToConfirm = () => {
    const disabled = !!isReadOnly;
    
    let statusText = 'Trascina per confermare scambio';
    if (disabled) {
      statusText = 'Scambio non attivo';
    } else if (isCompleted) {
      statusText = 'Scambio completato!';
    } else if (myConfirmed && otherConfirmed) {
      statusText = 'Scambio completato!';
    } else if (myConfirmed) {
      statusText = 'In attesa della conferma di ' + (matchInfo?.otherUser?.nickname || 'Utente');
    } else if (otherConfirmed) {
      statusText = (matchInfo?.otherUser?.nickname || 'Utente') + ' ha confermato! Trascina per completare';
    }

    return (
      <View style={styles.sliderWrap}>
        <Text style={styles.sliderLabel}>{statusText}</Text>
        
        <View style={styles.confirmStatusRow}>
          <View style={styles.confirmIndicator}>
            <Ionicons name={myConfirmed ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={myConfirmed ? '#34C759' : '#CCC'} />
            <Text style={[styles.confirmText, myConfirmed && styles.confirmTextActive]}>Tu</Text>
          </View>
          <View style={styles.confirmIndicator}>
            <Ionicons name={otherConfirmed ? 'checkmark-circle' : 'ellipse-outline'} size={18} color={otherConfirmed ? '#34C759' : '#CCC'} />
            <Text style={[styles.confirmText, otherConfirmed && styles.confirmTextActive]}>{matchInfo?.otherUser?.nickname || 'Altro'}</Text>
          </View>
        </View>

        <View style={[
          styles.sliderTrack,
          (myConfirmed || disabled || isCompleted) && { backgroundColor: (disabled && !isCompleted) ? '#EEE' : '#D1FADF', borderColor: (disabled && !isCompleted) ? '#DDD' : '#34C759' }
        ]}>
          {!(myConfirmed || disabled || isCompleted) && (
            <Animated.View
              style={[styles.sliderFill, { width: Animated.add(sliderX, KNOB_SIZE) }]}
            />
          )}
          <Animated.View
            style={[
              styles.sliderKnob,
              {
                transform: [{ translateX: (myConfirmed || isCompleted) ? SLIDER_WIDTH - KNOB_SIZE : (disabled ? 0 : sliderX) }],
                backgroundColor: (disabled && !isCompleted) ? '#BBB' : ((myConfirmed || isCompleted) ? '#34C759' : (sliderActive ? '#5A31F4' : '#7A5AF8'))
              }
            ]}
            {...(!(myConfirmed || disabled || isCompleted) ? sliderResponder.panHandlers : {})}
          >
            <Ionicons name={(myConfirmed || isCompleted) ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
          </Animated.View>
        </View>
      </View>
    );
  };

  const ItemDetailModal = () => (
    <Modal
      visible={itemDetailModal.visible}
      transparent
      animationType="fade"
      onRequestClose={() => setItemDetailModal({ visible: false, item: null, isMine: true })}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setItemDetailModal({ visible: false, item: null, isMine: true })}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{itemDetailModal.isMine ? 'Il tuo oggetto' : ('Oggetto di ' + (matchInfo?.otherUser?.nickname || 'Utente'))}</Text>
            <TouchableOpacity onPress={() => setItemDetailModal({ visible: false, item: null, isMine: true })}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {itemDetailModal.item?.imageUrl && (
            <Image source={{ uri: itemDetailModal.item.imageUrl }} style={styles.modalImage} />
          )}
          <Text style={styles.modalItemTitle}>{itemDetailModal.item?.title}</Text>
          {itemDetailModal.item?.description && (
            <Text style={styles.modalDescription}>{itemDetailModal.item.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#fff' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header />
      {isCompleted ? (
        <View style={styles.completedBanner}>
          <Ionicons name="checkmark-circle" size={20} color="#166534" />
          <Text style={styles.completedBannerTxt}>Scambio completato con successo!</Text>
        </View>
      ) : isReadOnly ? (
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
                <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.7)' }]}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <Text style={styles.typingText}>{matchInfo?.otherUser?.nickname || 'Utente'} sta scrivendo...</Text>
              </View>
            ) : null
          }
        />
      )}

      {!isReadOnly && <SlideToConfirm />}

      <View style={[styles.composer, isReadOnly && { opacity: 0.5 }]}>
        <TextInput
          style={styles.input}
          placeholder={isReadOnly ? 'Chat in sola lettura' : 'Scrivi un messaggio...'}
          value={draft}
          onChangeText={handleTextChange}
          editable={!sending && !isReadOnly}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={sending || !draft.trim() || !!isReadOnly}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ItemDetailModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 50, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  backBtn: { marginRight: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerSubtitle: { fontSize: 12, color: '#666' },
  headerMenuBtn: { padding: 6 },
  menuDropdown: {
    position: 'absolute', right: 10, top: 90, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
    borderRadius: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, zIndex: 100
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 10, minWidth: 160 },
  menuItemText: { color: '#111', fontSize: 14 },

  banner: { backgroundColor: '#FFF3CD', padding: 10, borderBottomWidth: 1, borderColor: '#FDE68A' },
  bannerTxt: { color: '#7A5C00', textAlign: 'center', fontWeight: '600' },
  completedBanner: { backgroundColor: '#D1FADF', padding: 10, borderBottomWidth: 1, borderColor: '#34C759', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  completedBannerTxt: { color: '#166534', textAlign: 'center', fontWeight: '600' },

  itemsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
    paddingVertical: 10, backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f0f0f0'
  },
  itemBox: { alignItems: 'center', maxWidth: 140 },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#ddd', marginBottom: 4 },
  itemTitle: { fontSize: 12, fontWeight: '600', color: '#333' },
  itemSubtitle: { fontSize: 10, color: '#888' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  mine: { backgroundColor: '#5A31F4', alignSelf: 'flex-end' },
  theirs: { backgroundColor: '#E4E6EB', alignSelf: 'flex-start' },
  msgTxt: { color: '#fff' },
  time: { fontSize: 10, color: '#666', marginTop: 4 },

  typingIndicator: { padding: 8, alignSelf: 'flex-start' },
  typingText: { fontSize: 12, color: '#888', fontStyle: 'italic' },

  sliderWrap: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 6, backgroundColor: '#fff' },
  sliderLabel: { textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 6 },
  confirmStatusRow: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 8 },
  confirmIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  confirmText: { fontSize: 12, color: '#888' },
  confirmTextActive: { color: '#34C759', fontWeight: '600' },
  sliderTrack: {
    alignSelf: 'center', width: 260, height: 44, borderRadius: 22, backgroundColor: '#F4F4F5',
    borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', position: 'relative'
  },
  sliderFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: '#E6E1FF'
  },
  sliderKnob: {
    width: 38, height: 38, borderRadius: 19, position: 'absolute', left: 0, top: 3,
    alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4
  },

  composer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginRight: 8, backgroundColor: '#fff' },
  sendBtn: { backgroundColor: '#5A31F4', paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '85%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  modalImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16 },
  modalItemTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  modalDescription: { fontSize: 14, color: '#666', lineHeight: 20 }
});
