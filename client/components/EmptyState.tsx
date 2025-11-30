import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  buttonText?: string;
  onButtonPress?: () => void;
}

export default function EmptyState({ 
  icon = 'heart-outline', 
  title, 
  subtitle, 
  buttonText, 
  onButtonPress 
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconWrapper, { backgroundColor: colors.card }]}>
        <Ionicons name={icon} size={80} color={colors.accent} />
      </View>
      
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.accent }]} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  iconWrapper: { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  button: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});