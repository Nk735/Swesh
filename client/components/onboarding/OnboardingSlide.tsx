import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingDots from './OnboardingDots';
import { useTheme } from '../../src/theme';

interface OnboardingSlideProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  currentIndex: number;
  totalSlides: number;
}

export default function OnboardingSlide({ icon, title, description, currentIndex, totalSlides }: OnboardingSlideProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.content}>
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        <Ionicons name={icon} size={80} color={colors.accent} />
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <OnboardingDots total={totalSlides} current={currentIndex} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  iconContainer: { 
    width: 160, 
    height: 160, 
    borderRadius: 80, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 40, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 10, 
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 4, 
  },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 16, },
  description: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, },
});
