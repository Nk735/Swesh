import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Text, PanResponder, Animated, ActivityIndicator, Platform } from 'react-native';
import { Item } from '../src/types';

const { width, height } = Dimensions.get('window');

export interface DeckItem extends Item {}

interface SwipeDeckProps {
  items: DeckItem[];
  loading: boolean;
  actionLoading: boolean;
  onLike: (item: DeckItem) => void;
  onDislike: (item: DeckItem) => void;
  onSkip: (item: DeckItem) => void;
  onExhausted?: () => void;
  emptyComponent?: React.ReactNode;
  renderFooter?: React.ReactNode;
}

const SWIPE_DISTANCE_THRESHOLD = Math.max(60, width * 0.2);
const SWIPE_VELOCITY_THRESHOLD = 0.6;
// Mostra solo la card in cima (evita confusione “altri vestiti dietro”)
const SHOW_SECOND_CARD = false;

export default function SwipeDeck(props: SwipeDeckProps) {
  const { items, loading, actionLoading, onLike, onDislike, onSkip, emptyComponent, onExhausted, renderFooter } = props;

  const [history, setHistory] = useState<DeckItem[]>([]);
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.5, 0, width * 1.5],
    outputRange: ['-20deg', '0deg', '20deg']
  });

   const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        position.setValue({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > 80) {
          forceSwipe('right');
        } else if (g.dx < -80) {
          forceSwipe('left');
        } else {
          resetPosition();
        }
      }
    })
  ).current;

  useEffect(() => {
    if (!loading && items.length === 0) {
      onExhausted?.();
    }
  }, [loading, items, onExhausted]);

    const forceSwipe = (direction: 'right' | 'left') => {
    Animated.timing(position, {
      toValue: { x: direction === 'right' ? width + 100 : -width - 100, y: 0 },
      duration: 220,
      useNativeDriver: true
    }).start(() => onSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true
    }).start();
  };

  const onSwipeComplete = (direction: 'right' | 'left' | 'up') => {
    const item = items[0];
    // Reset per il prossimo render
    position.setValue({ x: 0, y: 0 });
    if (!item) return;
    setHistory(h => [item, ...h].slice(0, 20));
    if (direction === 'right') onLike(item);
    else if (direction === 'left') onDislike(item);
    else onSkip(item);
  };

  const renderCards = () => {
    if (loading) {
      return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }
    if (!items.length) {
      return <View style={styles.center}>{emptyComponent}</View>;
    }

    const webDragStyle: any = Platform.OS === 'web' ? { cursor: 'grab', touchAction: 'none' } : null;
    const top = items[0];
    const second = items[1];

    return (
      <>
        {SHOW_SECOND_CARD && second && (
          <View pointerEvents="none" style={[styles.card, { transform: [{ scale: 0.96 }], top: 10, opacity: 0.9 }]} key={second._id}>
            <Image source={{ uri: second.imageUrl }} style={styles.image} />
          </View>
        )}
        <Animated.View
          key={top._id}
          style={[
            styles.card,
            webDragStyle,
            { zIndex: 99, transform: [{ rotate }, ...position.getTranslateTransform()] }
          ]}
          {...(!actionLoading ? panResponder.panHandlers : {})}
        >
          <Image source={{ uri: top.imageUrl }} style={styles.image} />
          <View style={styles.overlay}>
            <Text numberOfLines={1} style={styles.title}>{top.title}</Text>
            {top.size ? <Text style={styles.meta}>{top.size}</Text> : null}
            {top.category ? <Text style={styles.meta}>{top.category}</Text> : null}
          </View>
        </Animated.View>
      </>
    );
  };

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <View style={styles.deck}>
        {renderCards()}
      </View>
      {renderFooter}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  card: {
    width: width * 0.85,
    height: height * 0.55,
    backgroundColor: '#eee',
    position: 'absolute',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  image: { width: '100%', height: '100%' },
  overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: 'rgba(0,0,0,0.35)' },
  title: { fontSize: 22, fontWeight: '600', color: 'white' },
  meta: { color: 'white', fontSize: 14, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});