import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingDots from './OnboardingDots';
import { FeedGenderPreference } from '../../src/types';

interface FeedPreferenceSlideProps {
  currentIndex: number;
  totalSlides: number;
  defaultPreference?: FeedGenderPreference;
  onComplete: (preference: FeedGenderPreference) => void;
}

const { width } = Dimensions.get('window');

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
  const [preference, setPreference] = useState<FeedGenderPreference | null>(defaultPreference ?? null);

  const handleContinue = () => {
    if (preference) {
      onComplete(preference);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Personalizza il tuo feed</Text>
        <Text style={styles.subtitle}>
          Quali abiti vuoi vedere nel tuo feed?
        </Text>

        <View style={styles.options}>
          {PREFERENCE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.option,
                preference === option.value && styles.optionSelected,
              ]}
              onPress={() => setPreference(option.value)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    preference === option.value && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
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

        <Text style={styles.note}>
          Puoi cambiare questa scelta dalle impostazioni
        </Text>
      </View>

      <View style={styles.footer}>
        <OnboardingDots total={totalSlides} current={currentIndex} />
        <TouchableOpacity
          style={[styles.continueButton, !preference && styles.continueButtonDisabled]}
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
  container: {
    width,
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 40,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F9F9F9',
    borderWidth: 2,
    borderColor: '#EEE',
    gap: 16,
  },
  optionSelected: {
    backgroundColor: '#86A69D',
    borderColor: '#86A69D',
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: '#fff',
  },
  optionDescription: {
    fontSize: 13,
    color: '#888',
  },
  optionDescriptionSelected: {
    color: 'rgba(255,255,255,0.8)',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 24,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  continueButton: {
    backgroundColor: '#F2B263',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    backgroundColor: '#DDD',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
