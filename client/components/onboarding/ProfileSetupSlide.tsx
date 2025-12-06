import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import OnboardingDots from './OnboardingDots';
import { Gender } from '../../src/types';
import { useTheme } from '../../src/theme';
import { onboardingTextStyles, onboardingColors } from '../../src/theme/onboardingStyles';

interface ProfileSetupSlideProps {
  currentIndex: number;
  totalSlides: number;
  onComplete: (age: number, gender: Gender) => void;
}

const { width } = Dimensions.get('window');

const GENDER_OPTIONS: { value: Gender; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'male', label: 'Uomo', icon: 'male' },
  { value: 'female', label: 'Donna', icon: 'female' },
  { value: 'prefer_not_to_say', label: 'Preferisco non specificare', icon: 'help-circle-outline' },
];

export default function ProfileSetupSlide({
  currentIndex,
  totalSlides,
  onComplete,
}: ProfileSetupSlideProps) {
  const { colors } = useTheme();
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);

  const isValid = age !== null && age >= 16 && age <= 99 && gender !== null;

  const handleContinue = () => {
    if (isValid && age !== null && gender !== null) {
      onComplete(age, gender);
    }
  };

  const increaseAge = () => {
    if (age === null) {
      setAge(16);
    } else if (age < 99) {
      setAge(age + 1);
    }
  };

  const decreaseAge = () => {
    if (age !== null && age > 16) {
      setAge(age - 1);
    }
  };

  return (
    <LinearGradient
      colors={[colors.onboardingPink, '#ff85f0', colors.onboardingPink]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, onboardingTextStyles.whiteTitle]}>Parlaci di te</Text>
        <Text style={[styles.subtitle, onboardingTextStyles.whiteDescription]}>
          Questi dati ci aiutano a personalizzare la tua esperienza
        </Text>

        {/* Age Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Quanti anni hai?</Text>
          <View style={styles.ageContainer}>
            <TouchableOpacity
              style={[styles.ageButton, { backgroundColor: onboardingColors.whiteTransparent }, age === null || age <= 16 ? styles.ageButtonDisabled : {}]}
              onPress={decreaseAge}
              disabled={age === null || age <= 16}
            >
              <Ionicons name="remove" size={24} color={age === null || age <= 16 ? colors.border : colors.onboardingPink} />
            </TouchableOpacity>
            <View style={[styles.ageDisplay, { backgroundColor: onboardingColors.whiteTransparent, borderColor: '#FFFFFF' }]}>
              <Text style={[styles.ageText, { color: colors.onboardingPink }]}>{age ?? '--'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ageButton, { backgroundColor: onboardingColors.whiteTransparent }, age === 99 ? styles.ageButtonDisabled : {}]}
              onPress={increaseAge}
              disabled={age === 99}
            >
              <Ionicons name="add" size={24} color={age === 99 ? colors.border : colors.onboardingPink} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.note, { color: '#FFFFFF' }]}>Devi avere almeno 16 anni per usare Swesh</Text>
        </View>

        {/* Gender Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Come ti identifichi?</Text>
          <View style={styles.genderOptions}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  { backgroundColor: onboardingColors.whiteTransparent, borderColor: '#FFFFFF' },
                  gender === option.value && { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
                ]}
                onPress={() => setGender(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={gender === option.value ? colors.onboardingPink : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.genderOptionText,
                    { color: colors.text },
                    gender === option.value && { color: colors.onboardingPink },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <OnboardingDots total={totalSlides} current={currentIndex} />
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF', borderWidth: 2 }, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
        >
          <Text style={[styles.continueButtonText, { color: colors.onboardingPink }]}>Continua</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { width, flex: 1 },
  scrollView: { flex: 1, },
  content: { paddingHorizontal: 30, paddingTop: 40, paddingBottom: 20, },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 8, },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, },
  section: { marginBottom: 30, },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16, textAlign: 'center', },
  ageContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 12, },
  ageButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', },
  ageButtonDisabled: { opacity: 0.5 },
  ageDisplay: { width: 80, height: 60, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  ageText: { fontSize: 28, fontWeight: '700' },
  note: { fontSize: 12, textAlign: 'center', },
  genderOptions: { gap: 12, },
  genderOption: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 2, gap: 12 },
  genderOptionSelected: {},
  genderOptionText: { fontSize: 16, fontWeight: '500' },
  genderOptionTextSelected: { color: '#fff', },
  footer: { paddingHorizontal: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30, },
  continueButton: { padding: 16, borderRadius: 12, alignItems: 'center', },
  continueButtonDisabled: { opacity: 0.5 },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: '600', },
});
