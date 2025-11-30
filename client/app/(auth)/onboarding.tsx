import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform, Alert as RNAlert, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Gender, FeedGenderPreference } from '../../src/types';
import OnboardingSlide from '../../components/onboarding/OnboardingSlide';
import OnboardingDots from '../../components/onboarding/OnboardingDots';
import ProfileSetupSlide from '../../components/onboarding/ProfileSetupSlide';
import FeedPreferenceSlide from '../../components/onboarding/FeedPreferenceSlide';
import { useTheme } from '../../src/theme';

const { width } = Dimensions.get('window');
const TOTAL_SLIDES = 6;

type SlideData = {
  id: string;
  type: 'info' | 'profile' | 'feed' | 'final';
  icon?: keyof typeof Ionicons.glyphMap;
  title?: string;
  description?: string;
};

const SLIDES: SlideData[] = [
  {
    id: '1',
    type: 'info',
    icon: 'shirt-outline',
    title: 'Benvenuto su Swesh!',
    description: 'Trasforma il tuo non ho niente da mettere in nuovi outfit scambiando con la community',
  },
  {
    id: '2',
    type: 'info',
    icon: 'swap-horizontal-outline',
    title: 'Sfoglia e Scegli',
    description: 'Scorri gli abiti degli altri utenti.',
  },
  {
    id: '3',
    type: 'info',
    icon: 'heart-outline',
    title: 'È un Match!',
    description: 'Quando vi piacete a vicenda, potete chattare e organizzare lo scambio.',
  },
  {
    id: '4',
    type: 'profile',
    title: 'Parlaci di te',
  },
  {
    id: '5',
    type: 'feed',
    title: 'Personalizza il tuo feed',
  },
  {
    id: '6',
    type: 'final',
    icon: 'rocket-outline',
    title: 'Pronto a iniziare!',
  },
];

function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}${message ? '\n\n' + message : ''}`);
  } else {
    RNAlert.alert(title, message);
  }
}

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const { colors, isDark } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Collected data
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [feedPreference, setFeedPreference] = useState<FeedGenderPreference | null>(null);

  const goToSlide = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < TOTAL_SLIDES - 1) {
      goToSlide(currentIndex + 1);
    }
  };

  const handleProfileComplete = (selectedAge: number, selectedGender: Gender) => {
    setAge(selectedAge);
    setGender(selectedGender);
    // Set default feed preference based on gender
    if (!feedPreference) {
      if (selectedGender === 'male') {
        setFeedPreference('male');
      } else if (selectedGender === 'female') {
        setFeedPreference('female');
      } else {
        setFeedPreference('all');
      }
    }
    handleNext();
  };

  const handleFeedPreferenceComplete = (preference: FeedGenderPreference) => {
    setFeedPreference(preference);
    handleNext();
  };

  const handleFinish = async (destination: 'addItem' | 'home') => {
    if (!age || !gender || !feedPreference) {
      showAlert('Errore', 'Dati incompleti. Riprova.');
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({ age, gender, feedPreference });
      if (destination === 'addItem') {
        router.replace('/addItem');
      } else {
        router.replace('/');
      }
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      showAlert('Errore', error?.response?.data?.message || error?.message || 'Impossibile completare onboarding');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSlide = ({ item, index }: { item: SlideData; index: number }) => {
    if (item.type === 'info') {
      return (
        <View style={styles.slideWrapper}>
          <OnboardingSlide
            icon={item.icon!}
            title={item.title!}
            description={item.description!}
            currentIndex={index}
            totalSlides={TOTAL_SLIDES}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.continueButton, { backgroundColor: colors.secondary }]} onPress={handleNext}>
              <Text style={styles.continueButtonText}>Continua</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (item.type === 'profile') {
      return (
        <ProfileSetupSlide
          currentIndex={index}
          totalSlides={TOTAL_SLIDES}
          onComplete={handleProfileComplete}
        />
      );
    }

    if (item.type === 'feed') {
      // Calculate default based on gender
      let defaultPref: FeedGenderPreference | undefined;
      if (gender === 'male') defaultPref = 'male';
      else if (gender === 'female') defaultPref = 'female';
      else defaultPref = 'all';

      return (
        <FeedPreferenceSlide
          currentIndex={index}
          totalSlides={TOTAL_SLIDES}
          defaultPreference={feedPreference ?? defaultPref}
          onComplete={handleFeedPreferenceComplete}
        />
      );
    }

    // Final slide
    return (
      <View style={[styles.slideWrapper, styles.finalSlide, { backgroundColor: colors.card }]}>
        <View style={styles.finalContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
            <Ionicons name="rocket-outline" size={80} color={colors.accent} />
          </View>
          <Text style={[styles.finalTitle, { color: colors.text }]}>Pronto a iniziare!</Text>
          <Text style={[styles.finalDescription, { color: colors.textSecondary }]}>
            Il tuo account è pronto. Cosa vuoi fare ora?
          </Text>
        </View>

        <View style={styles.finalButtons}>
          <OnboardingDots total={TOTAL_SLIDES} current={index} />
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.accent }]}
            onPress={() => handleFinish('addItem')}
            disabled={isSubmitting}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>
              {isSubmitting ? 'Salvataggio...' : 'Carica il tuo primo abito'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.accent }]}
            onPress={() => handleFinish('home')}
            disabled={isSubmitting}
          >
            <Ionicons name="compass-outline" size={20} color={colors.accent} />
            <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
              {isSubmitting ? 'Salvataggio...' : 'Esplora il feed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const onScrollEnd = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative', },
  slideWrapper: { width, flex: 1, justifyContent: 'center', alignItems: 'center', },
  buttonContainer: { paddingHorizontal: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30, right: 30},
  continueButton: { padding: 10, borderRadius: 25, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, },
  continueButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', },
  finalSlide: { justifyContent: 'space-between', paddingTop: 60, },
  finalContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30, },
  iconContainer: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: 40, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4, },
  finalTitle: { fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 12, },
  finalDescription: { fontSize: 16, textAlign: 'center', lineHeight: 24, },
  finalButtons: { paddingHorizontal: 30, paddingBottom: Platform.OS === 'ios' ? 40 : 30, gap: 12, },
  primaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, gap: 8, },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, borderWidth: 2, gap: 8, },
  secondaryButtonText: { fontSize: 16, fontWeight: '600', },
});