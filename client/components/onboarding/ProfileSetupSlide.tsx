import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OnboardingDots from './OnboardingDots';
import { Gender } from '../../src/types';

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
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Parlaci di te</Text>
        <Text style={styles.subtitle}>
          Questi dati ci aiutano a personalizzare la tua esperienza
        </Text>

        {/* Age Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quanti anni hai?</Text>
          <View style={styles.ageContainer}>
            <TouchableOpacity
              style={[styles.ageButton, age === null || age <= 16 ? styles.ageButtonDisabled : {}]}
              onPress={decreaseAge}
              disabled={age === null || age <= 16}
            >
              <Ionicons name="remove" size={24} color={age === null || age <= 16 ? '#CCC' : '#333'} />
            </TouchableOpacity>
            <View style={styles.ageDisplay}>
              <Text style={styles.ageText}>{age ?? '--'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.ageButton, age === 99 ? styles.ageButtonDisabled : {}]}
              onPress={increaseAge}
              disabled={age === 99}
            >
              <Ionicons name="add" size={24} color={age === 99 ? '#CCC' : '#333'} />
            </TouchableOpacity>
          </View>
          <Text style={styles.note}>Devi avere almeno 16 anni per usare Swesh</Text>
        </View>

        {/* Gender Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Come ti identifichi?</Text>
          <View style={styles.genderOptions}>
            {GENDER_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOption,
                  gender === option.value && styles.genderOptionSelected,
                ]}
                onPress={() => setGender(option.value)}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={gender === option.value ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === option.value && styles.genderOptionTextSelected,
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
          style={[styles.continueButton, !isValid && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!isValid}
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 20,
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  ageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  ageButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2E8DF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageButtonDisabled: {
    backgroundColor: '#EEE',
  },
  ageDisplay: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  ageText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  genderOptions: {
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F9F9F9',
    borderWidth: 2,
    borderColor: '#EEE',
    gap: 12,
  },
  genderOptionSelected: {
    backgroundColor: '#F28585',
    borderColor: '#F28585',
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  genderOptionTextSelected: {
    color: '#fff',
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
