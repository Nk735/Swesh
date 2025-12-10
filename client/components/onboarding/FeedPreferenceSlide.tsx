import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingDots from './OnboardingDots';
import { FeedGenderPreference } from '../../src/types';
import { useTheme } from '../../src/theme';

interface FeedPreferenceSlideProps {
  currentIndex: number;
  totalSlides: number;
  defaultPreference?: FeedGenderPreference;
  onComplete: (preference: FeedGenderPreference) => void;
}

const { width, height } = Dimensions.get('window');

const PREFERENCE_OPTIONS: { value: FeedGenderPreference; label: string; emoji: string; description: string }[] = [
  { value: 'male', label: 'Abbigliamento maschile', emoji: '👔', description: 'Vedi solo abiti da uomo' },
  { value: 'female', label: 'Abbigliamento femminile', emoji: '👗', description: 'Vedi solo abiti da donna' },
  { value: 'all', label: 'Mostrami tutto', emoji: '👔👗', description: 'Vedi tutti gli abiti' },
];

export default function FeedPreferenceSlide({
  currentIndex,
  totalSlides,
  defaultPreference,
  onComplete,
}: FeedPreferenceSlideProps) {
  const { colors } = useTheme();
  const [preference, setPreference] = useState<FeedGenderPreference | null>(defaultPreference ?? null);

  const handleContinue = () => {
    if (preference) {
      onComplete(preference);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Personalizza il tuo feed</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Quali abiti vuoi vedere nel tuo feed?
        </Text>

        <View style={styles.options}>
          {PREFERENCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                { backgroundColor: colors.inputBackground, borderColor: colors.border },
                preference === option.value && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => setPreference(option.value)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: colors.text },
                    preference === option.value && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.textSecondary },
                    preference === option.value && styles.optionDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              {preference === option.value && (
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Puoi cambiare questa scelta dalle impostazioni
        </Text>
      </View>

      <View style={styles.footer}>
        <OnboardingDots total={totalSlides} current={currentIndex} />
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.secondary }, !preference && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!preference}
        >
          <Text style={styles.continueButtonText}>Continua</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width, height },
  content: { flex: 1, paddingHorizontal: 30, paddingTop: 40, justifyContent: 'flex-start', },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8, },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, },
  options: { gap: 16, },
  option: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, borderWidth: 2, gap: 16 },
  optionSelected: {},
  optionEmoji: { fontSize: 32, },
  optionTextContainer: { flex: 1, },
  optionLabel: { fontSize: 16, fontWeight: '600', marginBottom: 4, },
  optionLabelSelected: { color: '#fff', },
  optionDescription: { fontSize: 13 },
  optionDescriptionSelected: { color: 'rgba(255,255,255,0.8)', },
  note: { fontSize: 12, textAlign: 'center', marginTop: 24, },
  footer: { paddingHorizontal: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30, },
  continueButton: { padding: 16, borderRadius: 12, alignItems: 'center', },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', },
});
