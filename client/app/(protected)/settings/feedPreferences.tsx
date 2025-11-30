import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert as RNAlert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { FeedGenderPreference } from '../../../src/types';
import { updateFeedPreferences } from '../../../src/services/apiClient';

const PREFERENCE_OPTIONS: { value: FeedGenderPreference; label: string; emoji: string; description: string }[] = [
  { value: 'male', label: 'Abbigliamento maschile', emoji: '👔', description: 'Vedi solo abiti da uomo' },
  { value: 'female', label: 'Abbigliamento femminile', emoji: '👗', description: 'Vedi solo abiti da donna' },
  { value: 'all', label: 'Mostrami tutto', emoji: '👔👗', description: 'Vedi tutti gli abiti' },
];

function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}${message ? '\n\n' + message : ''}`);
  } else {
    RNAlert.alert(title, message);
  }
}

export default function FeedPreferencesScreen() {
  const { user, refreshMe } = useAuth();
  const [preference, setPreference] = useState<FeedGenderPreference>(
    user?.feedPreferences?.showGender ?? 
    (user?.gender === 'male' ? 'male' : user?.gender === 'female' ? 'female' : 'all')
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateFeedPreferences(preference);
      await refreshMe();
      showAlert('Successo', 'Preferenze aggiornate');
      router.back();
    } catch (e: unknown) {
      const error = e as { response?: { data?: { message?: string } }; message?: string };
      showAlert('Errore', error?.response?.data?.message || error?.message || 'Impossibile aggiornare preferenze');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferenze Feed</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Scegli quali abiti vuoi vedere nel tuo feed
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salva</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2E8DF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F2E8DF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  options: {
    gap: 16,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
  },
  saveButton: {
    backgroundColor: '#F2B263',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
