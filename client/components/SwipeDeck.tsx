import React, { useCallback } from 'react';
import { Dimensions, StyleSheet, View, Image, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import type { ReactNode } from 'react';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const SWIPE_X_THRESHOLD = SCREEN_W * 0.25;
const EXIT_VELOCITY = 800;
const ROTATION_MAX_DEG = 18;

export type DeckItem = {
  _id: string;
  title: string;
  imageUrl: string;
  size?: string;
  category?: string;
  owner?: { nickname?: string };
};

interface SwipeDeckProps {
  items: DeckItem[];
  loading: boolean;
  actionLoading: boolean;
  onLike: (item: DeckItem) => void;
  onDislike: (item: DeckItem) => void;
  onSkip: (item: DeckItem) => void;
  renderFooter?: ReactNode;
  emptyComponent?: ReactNode;
}

export function SwipeDeck({
  items,
  loading,
  actionLoading,
  onLike,
  onDislike,
  onSkip,
  renderFooter,
  emptyComponent,
}: SwipeDeckProps) {
  // Mostriamo solo prime 2 per animazione “stack”
  const top = items[0];
  const second = items[1];

  // Se ancora loading
  if (loading) {
    return (
      <View style={styles.centerBox}>
        <Text style={{ color: '#555' }}>Caricamento...</Text>
      </View>
    );
  }

  if (!top) {
    return (
      <View style={styles.centerBox}>
        {emptyComponent || <Text style={{ color: '#777' }}>Nessun elemento</Text>}
        {renderFooter}
      </View>
    );
  }

  return (
    <View style={styles.deckContainer}>
      {second && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Animated.View
            style={[
              styles.card,
              {
                transform: [{ scale: 0.95 }],
                top: 0,
                left: 0,
                right: 0,
              },
            ]}
          >
            <Image source={{ uri: second.imageUrl }} style={styles.img} />
            <View style={styles.gradientFooter}>
              <Text style={styles.title}>{second.title}</Text>
            </View>
          </Animated.View>
        </View>
      )}
      <TopSwipeCard
        item={top}
        disabled={actionLoading}
        onLike={() => onLike(top)}
        onDislike={() => onDislike(top)}
        onSkip={() => onSkip(top)}
      />
      {renderFooter}
    </View>
  );
}

interface TopSwipeCardProps {
  item: DeckItem;
  onLike: () => void;
  onDislike: () => void;
  onSkip: () => void;
  disabled?: boolean;
}

function TopSwipeCard({ item, onLike, onDislike, onSkip, disabled }: TopSwipeCardProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const released = useSharedValue(false);

  const resetPosition = () => {
    tx.value = withSpring(0, { damping: 18 });
    ty.value = withSpring(0, { damping: 18 });
  };

  const completeLike = () => {
    onLike();
  };
  const completeDislike = () => {
    onDislike();
  };
  const completeSkip = () => {
    onSkip();
  };

  const flingOut = useCallback(
    (direction: 'left' | 'right') => {
      released.value = true;
      const toX = direction === 'right' ? SCREEN_W + 200 : -SCREEN_W - 200;
      tx.value = withTiming(toX, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(direction === 'right' ? completeLike : completeDislike)();
        }
      });
      ty.value = withTiming(ty.value, { duration: 220 });
    },
    [released, tx, ty, completeLike, completeDislike]
  );

  const flingUp = useCallback(() => {
    released.value = true;
    ty.value = withTiming(-SCREEN_H, { duration: 240 }, (finished) => {
      if (finished) runOnJS(completeSkip)();
    });
  }, [released, ty, completeSkip]);

  const pan = Gesture.Pan()
    .enabled(!disabled)
    .onUpdate((e) => {
      if (released.value) return;
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      if (released.value) return;
      const velocityX = e.velocityX;
      // Swipe or velocity -> like/dislike
      if (tx.value > SWIPE_X_THRESHOLD || velocityX > EXIT_VELOCITY) {
        flingOut('right');
        return;
      }
      if (tx.value < -SWIPE_X_THRESHOLD || velocityX < -EXIT_VELOCITY) {
        flingOut('left');
        return;
      }
      // Swipe verso l'alto come skip (configurabile)
      if (ty.value < -120 && Math.abs(tx.value) < 80) {
        flingUp();
        return;
      }
      resetPosition();
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = (tx.value / SCREEN_W) * ROTATION_MAX_DEG;
    return {
      transform: [
        { translateX: tx.value },
        { translateY: ty.value },
        { rotate: `${rotate}deg` },
        { scale: released.value ? 1 : 1 },
      ],
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => {
    const op = interpolate(
      tx.value,
      [0, SWIPE_X_THRESHOLD],
      [0, 1],
      Extrapolate.CLAMP
    );
    return { opacity: op };
  });

  const nopeOpacityStyle = useAnimatedStyle(() => {
    const op = interpolate(
      tx.value,
      [-SWIPE_X_THRESHOLD, 0],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity: op };
  });

  const skipOpacityStyle = useAnimatedStyle(() => {
    const op = interpolate(
      ty.value,
      [-160, -60],
      [1, 0],
      Extrapolate.CLAMP
    );
    return { opacity: op };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image source={{ uri: item.imageUrl }} style={styles.img} />
        {/* Overlay LIKE */}
        <Animated.View style={[styles.overlayLabel, styles.likeBox, likeOpacityStyle]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>
        {/* Overlay NOPE */}
        <Animated.View style={[styles.overlayLabel, styles.nopeBox, nopeOpacityStyle]}>
          <Text style={styles.overlayText}>NOPE</Text>
        </Animated.View>
        {/* Overlay SKIP */}
        <Animated.View style={[styles.skipBox, skipOpacityStyle]}>
          <Text style={styles.skipText}>SKIP ↑</Text>
        </Animated.View>
        <View style={styles.gradientFooter}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>Taglia: {item.size || '-'}</Text>
          {item.owner?.nickname ? (
            <Text style={styles.subtitle}>Owner: {item.owner.nickname}</Text>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  deckContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: SCREEN_W * 0.9,
    height: SCREEN_H * 0.65,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  img: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#fff',
    fontSize: 16,
  },
  overlayLabel: {
    position: 'absolute',
    top: 30,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderWidth: 4,
    borderRadius: 12,
  },
  likeBox: {
    left: 24,
    borderColor: '#3DDC84',
    backgroundColor: 'rgba(61,220,132,0.15)',
  },
  nopeBox: {
    right: 24,
    borderColor: '#FF4E4E',
    backgroundColor: 'rgba(255,78,78,0.15)',
  },
  overlayText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  skipBox: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skipText: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 1,
  },
});

export default SwipeDeck;