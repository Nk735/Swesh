import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import OnboardingDots from './OnboardingDots';
import { useTheme } from '../../src/theme';
import { onboardingTextStyles, onboardingColors } from '../../src/theme/onboardingStyles';

interface OnboardingSlideProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  currentIndex: number;
  totalSlides: number;
}

const { width } = Dimensions.get('window');

export default function OnboardingSlide({ icon, title, description, currentIndex, totalSlides }: OnboardingSlideProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.onboardingPink, '#ff85f0', colors.onboardingPink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: onboardingColors.whiteTransparent }]}>
          <Ionicons name={icon} size={80} color={colors.onboardingPink} />
        </View>
        <Text style={[styles.title, onboardingTextStyles.whiteTitle]}>{title}</Text>
        <Text style={[styles.description, onboardingTextStyles.whiteDescription]}>{description}</Text>
      </View>
      <OnboardingDots total={totalSlides} current={currentIndex} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { width, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  iconContainer: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4, },
  title: { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 16, },
  description: { fontSize: 16, textAlign: 'center', lineHeight: 24, paddingHorizontal: 10, },
});
