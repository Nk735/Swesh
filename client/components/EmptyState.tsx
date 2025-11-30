import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons. glyphMap;
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
  return (
    <View style={styles.container}>
      <View style={styles. iconWrapper}>
        <Ionicons name={icon} size={80} color="#86A69D" />
      </View>
      
      <Text style={styles. title}>{title}</Text>
      
      {subtitle && (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      
      {buttonText && onButtonPress && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles. buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, backgroundColor: '#F2E8DF', },
  iconWrapper: { width: 140, height: 140, borderRadius: 70, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4, },
  title: { fontSize: 24, fontWeight: '700', color: '#333', marginBottom: 12, textAlign: 'center', },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 30, },
  button: { backgroundColor: '#5A31F4', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600', },
});