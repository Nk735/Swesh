import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Animated, PanResponder, Alert, Modal } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { getChatMessages, sendChatMessage, getMatchById, cancelMatch, confirmExchange } from "../../../src/services/tradeApi";
import { ChatMessage, TinderMatch } from "../../../src/types/trade";
import { useAuth } from "../../../src/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import socketService from "../../../src/services/socketService";
import ExchangeCompletedModal from "../../../components/ExchangeCompletedModal";
import { api } from "../../../src/services/apiClient";
import { useTheme } from "../../../src/theme";
import ChatHeader from "../../../components/chat/ChatHeader";
import ItemsStrip from "../../../components/chat/ItemsStrip";
import SlideToConfirm from "../../../components/chat/SlideToConfirm";

export default function ChatScreen() {
  const { chatId: matchId } = useLocalSearchParams<{ chatId: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
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
  const [exchangeCompletedModal, setExchangeCompletedModal] = useState<{
    visible: boolean;
    info: { myItemTitle: string; theirItemTitle: string; otherUserNickname: string } | null;
  }>({ visible: false, info: null });

  const flatRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchInfoRef = useRef<TinderMatch | null>(null);

  const SLIDER_WIDTH = 260;
  const KNOB_SIZE = 38;
  const sliderX = useRef(new Animated.Value(0)).current;
  const [sliderActive, setSliderActive] = useState(false);

  const isReadOnly = matchInfo?.status && matchInfo.status !== 'active';
  const isCompleted = matchInfo?.status === 'completed';

  // Keep matchInfoRef in sync with matchInfo
  useEffect(() => {
    matchInfoRef.current = matchInfo;
  }, [matchInfo]);

  useEffect(() => {
    let unsubNewMessage: (() => void) | undefined;
    let unsubTyping: (() => void) | undefined;
    let unsubExchangeStatus: (() => void) | undefined;
    let unsubExchangeCompleted: (() => void) | undefined;

    const setupSocket = async () => {
      try {
        await socketService.connect();
        if (matchId) {
          socketService.joinChat(String(matchId));

          unsubNewMessage = socketService.onNewMessage((data) => {
            if (data.matchId === matchId) {
              setMessages(prev => {
                // Check if this is a duplicate of an existing message
                if (prev.some(m => m._id === data.message._id)) {
                  return prev;
                }
                
                // Check if there's a temporary message with same content from same sender
                // that should be replaced
                const tempIndex = prev.findIndex(m => 
                  m._id.startsWith('temp-') && 
                  m.content === data.message.content && 
                  m.senderId === data.message.senderId
                );
                
                if (tempIndex !== -1) {
                  // Replace temp message with real one
                  const newMessages = [...prev];
                  newMessages[tempIndex] = data.message;
                  return newMessages;
                }
                
                return [...prev, data.message];
              });
              setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 50);
            }
          });

          unsubTyping = socketService.onTyping((data) => {
            if (data.matchId === matchId && String(data.userId) !== String(user?.id)) {
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
              }
            }
          });

          unsubExchangeCompleted = socketService.onExchangeCompleted((data) => {
            if (data.matchId === matchId) {
              setMatchInfo(prev => prev ? { ...prev, status: 'completed' } : prev);
              setExchangeCompletedModal({
                visible: true,
                info: {
                  myItemTitle: data.myItemTitle,
                  theirItemTitle: data.theirItemTitle,
                  otherUserNickname: data.otherUserNickname
                }
              });
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
      unsubExchangeCompleted?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
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
                  // Show the exchange completed modal with info from matchInfoRef
                  setExchangeCompletedModal({
                    visible: true,
                    info: {
                      myItemTitle: matchInfoRef.current?.itemMine?.title || 'Il tuo oggetto',
                      theirItemTitle: matchInfoRef.current?.itemTheirs?.title || 'Oggetto ricevuto',
                      otherUserNickname: matchInfoRef.current?.otherUser?.nickname || 'Utente'
                    }
                  });
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
        // Add optimistic message
        const tempMessage = {
          _id: `temp-${Date.now()}`,
          content: draft.trim(),
          senderId: user?.id || '',
          createdAt: new Date().toISOString(),
          read: false
        };
        setMessages(prev => [...prev, tempMessage]);
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

  const handleDeleteItem = async () => {
    setExchangeCompletedModal({ visible: false, info: null });
    if (matchInfo?.itemMine?._id) {
      try {
        await api.delete(`/items/${matchInfo.itemMine._id}`);
        Alert.alert('Oggetto eliminato', 'Il tuo oggetto è stato rimosso dal profilo.');
      } catch (e: any) {
        Alert.alert('Errore', e?.response?.data?.message || 'Impossibile eliminare l\'oggetto');
      }
    }
  };

  const handleKeepItem = () => {
    setExchangeCompletedModal({ visible: false, info: null });
    Alert.alert('Oggetto nascosto', 'Il tuo oggetto rimarrà nascosto ma non sarà eliminato.');
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
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{itemDetailModal.isMine ? 'Il tuo oggetto' : ('Oggetto di ' + (matchInfo?.otherUser?.nickname || 'Utente'))}</Text>
            <TouchableOpacity onPress={() => setItemDetailModal({ visible: false, item: null, isMine: true })}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          {itemDetailModal.item?.imageUrl && (
            <Image source={{ uri: itemDetailModal.item.imageUrl }} style={styles.modalImage} />
          )}
          <Text style={[styles.modalItemTitle, { color: colors.text }]}>{itemDetailModal.item?.title}</Text>
          {itemDetailModal.item?.description && (
            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>{itemDetailModal.item.description}</Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ChatHeader
        matchInfo={matchInfo}
        isCompleted={isCompleted}
        isReadOnly={!! isReadOnly}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen(v => !v)}
        onCancelTrade={onCancelTrade}
      />

      {isCompleted ?  (
        <View style={[styles.completedBanner, { backgroundColor: '#D1FADF', borderColor: colors.success }]}>
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

      <ItemsStrip
        matchInfo={matchInfo}
        onItemPress={openItemDetail}
      />

      {loading ?  (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : (
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m._id}
          renderItem={({ item }) => {
            if (item.isSystemMessage) {
              return (
                <View style={[styles.systemMessage, { backgroundColor: colors.inputBackground }]}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                  <Text style={[styles.systemMessageText, { color: colors.textSecondary }]}>{item.content}</Text>
                </View>
              );
            }
            const mine = user?.id ? String(item.senderId) === String(user.id) : false;
            return (
              <View style={[
                styles.bubble, 
                mine ? { backgroundColor: colors.primary, alignSelf: 'flex-end' } : { backgroundColor: colors.card, alignSelf: 'flex-start' }
              ]}>
                <Text style={[styles.msgTxt, mine ? { color: '#fff' } : { color: colors.text }]}>
                  {item.content}
                </Text>
                <Text style={[styles.time, { color: colors.textSecondary }, mine && { color: 'rgba(255,255,255,0.7)' }]}>
                  {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingIndicator}>
                <Text style={[styles.typingText, { color: colors.textSecondary }]}>
                  {matchInfo?.otherUser?.nickname || 'Utente'} sta scrivendo...
                </Text>
              </View>
            ) : null
          }
        />
      )}

      {! isReadOnly && (
        <SlideToConfirm
          SLIDER_WIDTH={SLIDER_WIDTH}
          KNOB_SIZE={KNOB_SIZE}
          sliderX={sliderX}
          sliderActive={sliderActive}
          sliderResponder={sliderResponder}
          myConfirmed={myConfirmed}
          otherConfirmed={otherConfirmed}
          isReadOnly={!! isReadOnly}
          isCompleted={isCompleted}
          matchInfo={matchInfo}
        />
      )}

      <View style={[styles.composer, { borderColor: colors.border, backgroundColor: colors.card }, isReadOnly && { opacity: 0.5 }]}>
        <TextInput
          style={[styles. input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]}
          placeholder={isReadOnly ? 'Chat in sola lettura' : 'Scrivi un messaggio...'}
          placeholderTextColor={colors.textSecondary}
          value={draft}
          onChangeText={handleTextChange}
          editable={!sending && !isReadOnly}
          onSubmitEditing={submit}
          returnKeyType="send"
        />
        <TouchableOpacity 
          style={[styles.sendBtn, { backgroundColor: colors.accent }]} 
          onPress={submit} 
          disabled={sending || !draft. trim() || !!isReadOnly}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ItemDetailModal />
      <ExchangeCompletedModal
        visible={exchangeCompletedModal. visible}
        matchInfo={exchangeCompletedModal.info}
        onDeleteItem={handleDeleteItem}
        onKeepItem={handleKeepItem}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#FFF3CD', padding: 10, borderBottomWidth: 1, borderColor: '#FDE68A' },
  bannerTxt: { color: '#7A5C00', textAlign: 'center', fontWeight: '600' },
  completedBanner: { padding: 10, borderBottomWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  completedBannerTxt: { color: '#166534', textAlign: 'center', fontWeight:  '600' },
  
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bubble: { padding: 10, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  msgTxt: {},
  time: { fontSize: 10, marginTop: 4 },

  systemMessage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginBottom: 8, alignSelf: 'center', maxWidth: '90%' },
  systemMessageText: { fontSize: 12, textAlign: 'center', flex: 1 },

  typingIndicator: { padding: 8, alignSelf: 'flex-start' },
  typingText: { fontSize: 12, fontStyle: 'italic' },

  composer: { flexDirection: 'row', padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, marginRight: 8 },
  sendBtn: { paddingHorizontal: 16, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 16, padding: 20, width: '85%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalImage: { width: '100%', height: 250, borderRadius: 12, marginBottom: 16 },
  modalItemTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  modalDescription: { fontSize: 14, lineHeight: 20 }
});