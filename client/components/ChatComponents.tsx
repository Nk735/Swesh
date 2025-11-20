// Da sistemare alcune cose nei componenti di chat, che ora sono tutti in un unico file.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, Animated, PanResponder, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TinderMatch } from "../src/types/trade"; // Assicurati che il percorso sia corretto
import { PanResponderInstance } from 'react-native';

// --- STILI REPLICATI ---//
const componentStyles = StyleSheet.create({
  // Header
  header: { paddingHorizontal: 16, paddingBottom: 10, paddingTop: 50, borderBottomWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#eee' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111' },
  headerSubtitle: { fontSize: 12, color: '#666' },
  headerMenuBtn: { position: 'absolute', right: 12, top: 56, padding: 6, },
  menuDropdown: {
    position: 'absolute', right: 10, top: 46, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee',
    borderRadius: 10, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6
  },
  menuItem: { paddingHorizontal: 14, paddingVertical: 10, minWidth: 160 },
  menuItemText: { color: '#111', fontSize: 14 },

  // Items strip
  itemsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16,
    paddingVertical: 10, backgroundColor: '#fafafa', borderBottomWidth: 1, borderColor: '#f0f0f0'
  },
  itemBox: { alignItems: 'center', maxWidth: 140 },
  itemImage: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#ddd', marginBottom: 6 },
  itemTitle: { fontSize: 12, fontWeight: '600', color: '#333' },

  // Slider
  sliderWrap: { paddingHorizontal: 16, paddingBottom: 8, paddingTop: 6, backgroundColor: '#fff' },
  sliderLabel: { textAlign: 'center', fontSize: 12, color: '#666', marginBottom: 6 },
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
  sliderHint: { marginTop: 6, textAlign: 'center', fontSize: 12, color: '#34C759', fontWeight: '600' },

  // Composer
  composer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#eee', backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginRight: 8, backgroundColor: '#fff' },
  sendBtn: { backgroundColor: '#5A31F4', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 }
});

// --- INTERFACES per le Props ---
interface HeaderProps {
    matchInfo: TinderMatch | null;
    menuOpen: boolean;
    setMenuOpen: (open: boolean) => void;
}

interface ItemsStripProps {
    matchInfo: TinderMatch | null;
}

interface SlideToConfirmProps {
    SLIDER_WIDTH: number;
    KNOB_SIZE: number;
    proposalSent: boolean;
    sliderActive: boolean;
    sliderX: Animated.Value;
    sliderResponder: PanResponderInstance;
}

interface ComposerProps {
    draft: string;
    setDraft: (text: string) => void;
    submit: () => void;
    sending: boolean;
}

// --- 1. Header Component ---
export const ChatHeader: React.FC<HeaderProps> = ({ matchInfo, menuOpen, setMenuOpen }) => {
    const avatar = matchInfo?.otherUser?.avatarUrl || 'https://placehold.co/60x60';
    const name = matchInfo?.otherUser?.nickname || 'Utente';

    return (
        <View style={componentStyles.header}>
            <View style={componentStyles.headerLeft}>
                <Image source={{ uri: avatar }} style={componentStyles.headerAvatar} />
                <View>
                    <Text style={componentStyles.headerTitle}>{name}</Text>
                    <Text style={componentStyles.headerSubtitle}>Scambio in corso</Text>
                </View>
            </View>

            <TouchableOpacity style={componentStyles.headerMenuBtn} onPress={() => setMenuOpen(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-vertical" size={20} color="#333" />
            </TouchableOpacity>

            {menuOpen && (
                <View style={componentStyles.menuDropdown}>
                    <TouchableOpacity style={componentStyles.menuItem} onPress={() => { setMenuOpen(false); Alert.alert('Annulla scambio', 'Funzione in arrivo'); }}>
                        <Text style={componentStyles.menuItemText}>Annulla scambio</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={componentStyles.menuItem} onPress={() => { setMenuOpen(false); Alert.alert('Segnala utente', 'Funzione in arrivo'); }}>
                        <Text style={componentStyles.menuItemText}>Segnala utente</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

// --- 2. ItemsStrip Component ---
export const ChatItemsStrip: React.FC<ItemsStripProps> = ({ matchInfo }) => {
    if (!matchInfo) return null;
    return (
        <View style={componentStyles.itemsStrip}>
            <View style={componentStyles.itemBox}>
                {matchInfo.itemMine?.imageUrl ? <Image source={{ uri: matchInfo.itemMine.imageUrl }} style={componentStyles.itemImage} /> : <View style={[componentStyles.itemImage, { backgroundColor: '#eee' }]} />}
                <Text numberOfLines={1} style={componentStyles.itemTitle}>{matchInfo.itemMine?.title || 'Mio oggetto'}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={22} color="#666" />
            <View style={componentStyles.itemBox}>
                {matchInfo.itemTheirs?.imageUrl ? <Image source={{ uri: matchInfo.itemTheirs.imageUrl }} style={componentStyles.itemImage} /> : <View style={[componentStyles.itemImage, { backgroundColor: '#eee' }]} />}
                <Text numberOfLines={1} style={componentStyles.itemTitle}>{matchInfo.itemTheirs?.title || 'Oggetto loro'}</Text>
            </View>
        </View>
    );
};

// --- 3. SlideToConfirm Component ---
export const SlideToConfirm: React.FC<SlideToConfirmProps> = ({ SLIDER_WIDTH, KNOB_SIZE, proposalSent, sliderActive, sliderX, sliderResponder }) => {
    return (
        <View style={componentStyles.sliderWrap}>
            <Text style={componentStyles.sliderLabel}>
                {proposalSent ? 'Proposta inviata' : 'Trascina per inviare proposta'}
            </Text>
            <View style={[componentStyles.sliderTrack, proposalSent && { backgroundColor: '#D1FADF', borderColor: '#34C759' }]}>
                {!proposalSent && (
                    <Animated.View
                        style={[componentStyles.sliderFill, { width: Animated.add(sliderX, KNOB_SIZE) }]}
                    />
                )}
                <Animated.View
                    style={[
                        componentStyles.sliderKnob,
                        {
                            transform: [{ translateX: proposalSent ? SLIDER_WIDTH - KNOB_SIZE : sliderX }],
                            backgroundColor: proposalSent ? '#34C759' : (sliderActive ? '#5A31F4' : '#7A5AF8')
                        }
                    ]}
                    {...(!proposalSent ? sliderResponder.panHandlers : {})}
                >
                    <Ionicons name={proposalSent ? 'checkmark' : 'arrow-forward'} size={18} color="#fff" />
                </Animated.View>
            </View>
            {proposalSent && (
                <Text style={componentStyles.sliderHint}>In attesa della conferma dell’altro utente</Text>
            )}
        </View>
    );
};

// --- 4. Composer Component ---
export const ChatComposer: React.FC<ComposerProps> = ({ draft, setDraft, submit, sending }) => {
    return (
        <View style={componentStyles.composer}>
            <TextInput
                style={componentStyles.input}
                placeholder="Scrivi un messaggio..."
                value={draft}
                onChangeText={setDraft}
                editable={!sending}
            />
            <TouchableOpacity style={componentStyles.sendBtn} onPress={submit} disabled={sending || !draft.trim()}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{sending ? '...' : 'Invia'}</Text>
            </TouchableOpacity>
        </View>
    );
};

export const CommonChatStyles = componentStyles;