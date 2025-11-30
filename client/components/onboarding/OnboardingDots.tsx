import React from 'react';
import { View, StyleSheet } from 'react-native';

interface OnboardingDotsProps {
  total: number;
  current: number;
}

export default function OnboardingDots({ total, current }: OnboardingDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }, (_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === current ? styles.dotActive : styles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotActive: {
    backgroundColor: '#F28585',
  },
  dotInactive: {
    backgroundColor: '#DDD',
  },
});
