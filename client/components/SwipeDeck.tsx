import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image, Text, PanResponder, Animated, ActivityIndicator } from 'react-native';
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

export default function SwipeDeck(props: SwipeDeckProps) {
  const {
    items,
    loading,
    actionLoading,
    onLike,
    onDislike,
    onSkip,
    emptyComponent,
    onExhausted,
    renderFooter
  } = props;

  const [history, setHistory] = useState<DeckItem[]>([]);
  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.5, 0, width * 1.5],
    outputRange: ['-25deg', '0deg', '25deg']
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
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
      useNativeDriver: false
    }).start(() => onSwipeComplete(direction));
  };

  const onSwipeComplete = (direction: 'right' | 'left') => {
    position.setValue({ x: 0, y: 0 });
    const item = items[0];
    if (!item) return;
    setHistory(h => [item, ...h].slice(0, 20));
    direction === 'right' ? onLike(item) : onDislike(item);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false
    }).start();
  };

  const rewind = useCallback(() => {
    if (history.length === 0) return;
    const last = history[0];
    setHistory(h => h.slice(1));
    // reinseriamo la card all'inizio
    // (Il componente parent deve gestire l'array items originale; qui semplificato con event)
    // In implementazione reale si passerebbe callback dal parent per reinserire.
  }, [history]);

  (SwipeDeck as any).rewind = rewind; // rudimentale per accesso esterno se necessario

  const renderCards = () => {
    if (loading) {
      return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }
    if (!items.length) {
      return <View style={styles.center}>{emptyComponent}</View>;
    }
    return items.slice(0, 3).map((item, i) => {
      if (i === 0) {
        return (
          <Animated.View
            key={item._id}
            style={[
              styles.card,
              {
                zIndex: 99,
                transform: [{ rotate }, ...position.getTranslateTransform()]
              }
            ]}
            {...(!actionLoading ? panResponder.panHandlers : {})}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.overlay}>
              <Text numberOfLines={1} style={styles.title}>{item.title}</Text>
              {item.size ? <Text style={styles.meta}>{item.size}</Text> : null}
              {item.category ? <Text style={styles.meta}>{item.category}</Text> : null}
            </View>
          </Animated.View>
        );
      }
      return (
        <View key={item._id} style={[styles.card, { top: 10 * i, zIndex: 90 - i, opacity: 1 - i * 0.15 }]}>
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        </View>
      );
    });
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
  deck: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
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
  overlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: 'rgba(0,0,0,0.35)'
  },
  title: { fontSize: 22, fontWeight: '600', color: 'white' },
  meta: { color: 'white', fontSize: 14, marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});