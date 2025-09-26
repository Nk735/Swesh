import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface MatchNotificationModalProps {
  visible: boolean;
  match: {
    matchId: string;
    chatId: string;
    otherUser?: {
      nickname: string;
      avatarUrl?: string;
    };
    matchedItems?: {
      myItem: any;
      theirItem: any;
    };
  } | null;
  onAction: (action: 'chat' | 'continue') => void;
}

export const MatchNotificationModal: React.FC<MatchNotificationModalProps> = ({
  visible,
  match,
  onAction
}) => {
  if (!match) return null;

  const handleContinueSwiping = () => onAction('continue');
  const handleOpenChat = () => onAction('chat');

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <StatusBar backgroundColor="transparent" barStyle="light-content" />
      <View style={styles.container}>
        {/* Background gradient effect */}
        <View style={styles.backgroundGradient} />
        
        {/* Hearts animation background */}
        <View style={styles.heartsContainer}>
          <View style={[styles.heart, styles.heart1]}>💕</View>
          <View style={[styles.heart, styles.heart2]}>💖</View>
          <View style={[styles.heart, styles.heart3]}>❤️</View>
          <View style={[styles.heart, styles.heart4]}>💓</View>
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <Text style={styles.title}>È UN MATCH!</Text>
          <Text style={styles.subtitle}>
            A te e {match.otherUser?.nickname || 'questo utente'} vi piacete!
          </Text>

          {/* Items display */}
          <View style={styles.itemsContainer}>
            <View style={styles.itemWrapper}>
              <Image
                source={{ uri: match.matchedItems?.theirItem?.imageUrl || 'https://placehold.co/150x200' }}
                style={styles.itemImage}
              />
              <Text style={styles.itemTitle} numberOfLines={1}>
                {match.matchedItems?.theirItem?.title || 'Il loro vestito'}
              </Text>
            </View>

            <View style={styles.heartIcon}>
              <Ionicons name="heart" size={40} color="#FF4458" />
            </View>

            <View style={styles.itemWrapper}>
              <Image
                source={{ uri: match.matchedItems?.myItem?.imageUrl || 'https://placehold.co/150x200' }}
                style={styles.itemImage}
              />
              <Text style={styles.itemTitle} numberOfLines={1}>
                Il tuo vestito
              </Text>
            </View>
          </View>

          {/* User info */}
          <View style={styles.userInfo}>
            <Image
              source={{
                uri: match.otherUser?.avatarUrl || 'https://placehold.co/80x80/5A31F4/FFFFFF?text=' + 
                (match.otherUser?.nickname?.charAt(0) || 'U')
              }}
              style={styles.avatar}
            />
            <Text style={styles.nickname}>{match.otherUser?.nickname || 'Utente'}</Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.continueButton]}
              onPress={handleContinueSwiping}
            >
              <Text style={styles.continueButtonText}>CONTINUA A SWIPPARE</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.chatButton]}
              onPress={handleOpenChat}
            >
              <Ionicons name="chatbubbles" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.chatButtonText}>INIZIA A CHATTARE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4458',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 68, 88, 0.95)',
  },
  heartsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heart: {
    position: 'absolute',
    fontSize: 30,
    opacity: 0.3,
  },
  heart1: {
    top: '20%',
    left: '10%',
    transform: [{ rotate: '15deg' }],
  },
  heart2: {
    top: '30%',
    right: '15%',
    transform: [{ rotate: '-10deg' }],
  },
  heart3: {
    bottom: '25%',
    left: '20%',
    transform: [{ rotate: '25deg' }],
  },
  heart4: {
    bottom: '15%',
    right: '10%',
    transform: [{ rotate: '-20deg' }],
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    maxWidth: width * 0.9,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
  },
  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  itemWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 120,
    height: 160,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  itemTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  heartIcon: {
    backgroundColor: 'white',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  continueButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  chatButtonText: {
    color: '#FF4458',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  },
});