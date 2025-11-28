import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  Text,
  PanResponder,
  Animated,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Item } from '../src/types';
import { Ionicons } from '@expo/vector-icons';

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

const SWIPE_DISTANCE_THRESHOLD = Math.max(60, width * 0.18);
const SWIPE_VELOCITY_THRESHOLD = 0.5;
const SHOW_SECOND_CARD = false;

// Mappatura condition per badge (DB -> UI)
const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuovo',
  excellent: 'Ottimo',
  good: 'Buono',
};

export default function SwipeDeck(props: SwipeDeckProps) {
  const { items, loading, actionLoading, onLike, onDislike, onSkip, emptyComponent, onExhausted, renderFooter } = props;

  const [expanded, setExpanded] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  // Evita che il PanResponder catturi i tap destinati a hotspot/freccia
  const tapLockRef = useRef(false);

  const position = useRef(new Animated.ValueXY()).current;

  const rotate = position.x.interpolate({
    inputRange: [-width * 1.5, 0, width * 1.5],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  // Direzione da gesto (distanza + velocità)
  const getDirection = (dx: number, dy: number, vx: number, vy: number): 'right' | 'left' | 'up' | null => {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (absDx > absDy) {
      if (dx > SWIPE_DISTANCE_THRESHOLD || vx > SWIPE_VELOCITY_THRESHOLD) return 'right';
      if (dx < -SWIPE_DISTANCE_THRESHOLD || vx < -SWIPE_VELOCITY_THRESHOLD) return 'left';
    } else {
      if (-dy > SWIPE_DISTANCE_THRESHOLD || -vy > SWIPE_VELOCITY_THRESHOLD) return 'up';
    }
    return null;
  };

  const panResponder = useRef(
    PanResponder.create({
      // Non catturare se c'è tap su controlli (freccia/hotspots)
      onStartShouldSetPanResponder: () => !actionLoading && !tapLockRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !actionLoading && !tapLockRef.current && (Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_, g) => {
        if (!actionLoading && !tapLockRef.current) {
          position.setValue({ x: g.dx, y: g.dy });
        }
      },
      onPanResponderRelease: (_, g) => {
        if (actionLoading || tapLockRef.current) {
          resetPosition();
          return;
        }
        const dir = getDirection(g.dx, g.dy, g.vx, g.vy);
        if (dir) {
          forceSwipe(dir);
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: () => {
        resetPosition();
      },
    })
  ).current;

  useEffect(() => {
    if (!loading && items.length === 0) {
      onExhausted?.();
    }
  }, [loading, items, onExhausted]);

  // Reset quando cambia la top card
  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
    setExpanded(false);
    setImgIndex(0);
  }, [items?.[0]?._id]);

  const forceSwipe = (direction: 'right' | 'left' | 'up') => {
    const toValue =
      direction === 'right'
        ? { x: width + 120, y: 0 }
        : direction === 'left'
        ? { x: -width - 120, y: 0 }
        : { x: 0, y: -height - 120 };

    Animated.timing(position, {
      toValue,
      duration: 220,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => onSwipeComplete(direction));
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: Platform.OS !== 'web',
      friction: 8,
      tension: 40,
    }).start();
  };

  const onSwipeComplete = (direction: 'right' | 'left' | 'up') => {
    const item = items[0];
    position.setValue({ x: 0, y: 0 });
    if (!item) return;

    if (direction === 'right') onLike(item);
    else if (direction === 'left') onDislike(item);
    else onSkip(item);
  };

  // Hotspots per cambiare immagine
  const nextImage = (len: number) => {
    if (actionLoading || len <= 1) return;
    setImgIndex((i) => (i + 1) % len);
  };
  const prevImage = (len: number) => {
    if (actionLoading || len <= 1) return;
    setImgIndex((i) => (i - 1 + len) % len);
  };

  const renderCards = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      );
    }
    if (!items.length) {
      return <View style={styles.center}>{emptyComponent}</View>;
    }

    const webDragStyle: any =
      Platform.OS === 'web' ? { cursor: 'grab', touchAction: 'none', userSelect: 'none' } : null;

    const top = items[0];
    const second = items[1];
    const images = top.images?.length ? top.images : top.imageUrl ? [top.imageUrl] : [];
    const hasMultiple = (images?.length || 0) > 1;
    const currentImg = images[imgIndex] ?? top.imageUrl;

    return (
      <>
        {SHOW_SECOND_CARD && second && (
          <View
            pointerEvents="none"
            style={[styles.card, { transform: [{ scale: 0.96 }], top: 10, opacity: 0.9 }]}
            key={second._id}
          >
            <Image source={{ uri: second.imageUrl }} style={styles.image} />
          </View>
        )}

        <Animated.View
          key={top._id}
          pointerEvents="box-none"
          style={[
            styles.card,
            webDragStyle,
            { zIndex: 99, transform: [{ rotate }, ...position.getTranslateTransform()] },
          ]}
          {...(!actionLoading ? panResponder.panHandlers : {})}
        >
          {/* Immagine corrente; su web disabilita drag nativo */}
          <Image source={{ uri: currentImg }} style={styles.image} draggable={false as any} />

          {/* Hotspots laterali per cambiare immagine */}
          {hasMultiple && (
            <>
              <Pressable
                style={styles.leftHotspot}
                onPressIn={() => (tapLockRef.current = true)}
                onPressOut={() => (tapLockRef.current = false)}
                onPress={() => prevImage(images.length)}
              />
              <Pressable
                style={styles.rightHotspot}
                onPressIn={() => (tapLockRef.current = true)}
                onPressOut={() => (tapLockRef.current = false)}
                onPress={() => nextImage(images.length)}
              />
            </>
          )}

          {/* Dots indicator (tappabili) */}
          {hasMultiple && (
            <View style={styles.dotsWrap}>
              {images.map((_, i) => (
                <Pressable
                  key={i}
                  onPressIn={() => (tapLockRef.current = true)}
                  onPressOut={() => (tapLockRef.current = false)}
                  onPress={() => setImgIndex(i)}
                  style={[styles.dot, i === imgIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}

          {/* Overlay info: collapsed = titolo+taglia; expanded = dettagli */}
          <View style={[styles.overlay, expanded ? styles.overlayExpanded : styles.overlayCollapsed]}>
            <View style={styles.overlayHeader}>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.title}>
                  {top.title}
                </Text>
                {top.size ? <Text style={styles.meta}>Taglia: {top.size}</Text> : null}
              </View>
              <TouchableOpacity
                onPressIn={() => (tapLockRef.current = true)}
                onPressOut={() => (tapLockRef.current = false)}
                onPress={() => setExpanded((e) => !e)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name={expanded ? 'chevron-down' : 'chevron-up'} size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {expanded && (
              <View style={styles.detailsWrap}>
                <View style={styles.badgesRow}>
                  {top.condition ? (
                    <View style={[styles.badge, badgeStyleFor(top.condition)]}>
                      <Text style={styles.badgeTxt}>{CONDITION_LABELS[top.condition] || top.condition}</Text>
                    </View>
                  ) : null}
                  {top.category ? (
                    <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                      <Text style={styles.badgeTxt}>{top.category}</Text>
                    </View>
                  ) : null}
                </View>
                {!!top.description && <Text numberOfLines={5} style={styles.desc}>{top.description}</Text>}
              </View>
            )}
          </View>
        </Animated.View>
      </>
    );
  };

  return (
    <View style={{ flex: 1, width: '100%' }}>
      <View style={styles.deck}>{renderCards()}</View>
      {renderFooter}
    </View>
  );
}

function badgeStyleFor(condition?: string) {
  switch (condition) {
    case 'new':
      return { backgroundColor: 'rgba(76, 217, 100, 0.25)', borderColor: '#4CD964' };
    case 'excellent':
      return { backgroundColor: 'rgba(10, 132, 255, 0.25)', borderColor: '#0A84FF' };
    default:
      return { backgroundColor: 'rgba(142, 142, 147, 0.25)', borderColor: '#8E8E93' };
  }
}

const styles = StyleSheet.create({
  deck: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  card: {
    width: width * 0.85,
    height: height * 0.58,
    backgroundColor: '#eee',
    position: 'absolute',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  image: { width: '100%', height: '100%' },

  // Hotspots per cambio immagine
  leftHotspot: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '28%' },
  rightHotspot: { position: 'absolute', right: 0, top: 0, bottom: 0, width: '28%' },

  // Dots immagini
  dotsWrap: {
    position: 'absolute',
    bottom: 84,
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.20)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive: { backgroundColor: '#fff' },

  // Overlay info
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlayCollapsed: { paddingTop: 10, paddingBottom: 12 },
  overlayExpanded: { paddingTop: 12, paddingBottom: 14, backgroundColor: 'rgba(0,0,0,0.50)' },

  overlayHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '600', color: 'white' },
  meta: { color: 'white', fontSize: 14, marginTop: 2 },

  detailsWrap: { marginTop: 10, gap: 8 },
  badgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  badgeTxt: { color: '#fff', fontSize: 12, fontWeight: '600' },
  desc: { color: 'white', fontSize: 13, lineHeight: 18 },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});