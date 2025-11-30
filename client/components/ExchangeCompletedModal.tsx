import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ExchangeCompletedModalProps {
  visible: boolean;
  matchInfo: {
    myItemTitle: string;
    theirItemTitle: string;
    otherUserNickname: string;
  } | null;
  onDeleteItem: () => void;
  onKeepItem: () => void;
}

export default function ExchangeCompletedModal({ 
  visible, 
  matchInfo, 
  onDeleteItem, 
  onKeepItem 
}: ExchangeCompletedModalProps) {
  if (!matchInfo) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onKeepItem}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Scambio Completato!</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              Hai completato lo scambio con <Text style={styles.bold}>{matchInfo.otherUserNickname}</Text>
            </Text>
            <View style={styles.itemsRow}>
              <Text style={styles.itemLabel}>Il tuo:</Text>
              <Text style={styles.itemTitle}>{matchInfo.myItemTitle}</Text>
            </View>
            <View style={styles.itemsRow}>
              <Text style={styles.itemLabel}>Ricevi:</Text>
              <Text style={styles.itemTitle}>{matchInfo.theirItemTitle}</Text>
            </View>
          </View>

          <View style={styles.questionSection}>
            <Ionicons name="help-circle-outline" size={20} color="#666" />
            <Text style={styles.questionText}>
              Vuoi rimuovere "{matchInfo.myItemTitle}" dal tuo profilo?
            </Text>
          </View>

          <Text style={styles.noteText}>
            Gli altri utenti che avevano fatto match con questo oggetto saranno notificati automaticamente.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.deleteButton} onPress={onDeleteItem}>
              <Ionicons name="trash-outline" size={18} color="#FF4D4F" />
              <Text style={styles.deleteButtonText}>Sì, elimina</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.keepButton} onPress={onKeepItem}>
              <Ionicons name="eye-off-outline" size={18} color="#fff" />
              <Text style={styles.keepButtonText}>No, mantieni nascosto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center'
  },
  emoji: {
    fontSize: 48,
    marginBottom: 12
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
    marginBottom: 20,
    textAlign: 'center'
  },
  infoSection: {
    width: '100%',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
    marginBottom: 12
  },
  bold: {
    fontWeight: '600'
  },
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  itemLabel: {
    fontSize: 13,
    color: '#666'
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    maxWidth: '60%',
    textAlign: 'right'
  },
  questionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  questionText: {
    fontSize: 14,
    color: '#333',
    flex: 1
  },
  noteText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18
  },
  buttonRow: {
    width: '100%',
    gap: 10
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF1F0',
    borderWidth: 1,
    borderColor: '#FF4D4F',
    paddingVertical: 14,
    borderRadius: 12
  },
  deleteButtonText: {
    color: '#FF4D4F',
    fontSize: 15,
    fontWeight: '600'
  },
  keepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#5A31F4',
    paddingVertical: 14,
    borderRadius: 12
  },
  keepButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600'
  }
});
