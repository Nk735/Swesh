import React from 'react';
import { View, Text, StyleSheet, Animated, PanResponderInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/theme';

interface SlideToConfirmProps {
  SLIDER_WIDTH: number;
  KNOB_SIZE: number;
  sliderX: Animated.Value;
  sliderActive: boolean;
  sliderResponder: PanResponderInstance;
  myConfirmed: boolean;
  otherConfirmed: boolean;
  isReadOnly: boolean;
  isCompleted: boolean;
  matchInfo: any;
}

export default function SlideToConfirm({
  SLIDER_WIDTH,
  KNOB_SIZE,
  sliderX,
  sliderActive,
  sliderResponder,
  myConfirmed,
  otherConfirmed,
  isReadOnly,
  isCompleted,
  matchInfo
}: SlideToConfirmProps) {
  const { colors } = useTheme();

  let statusText = 'Trascina per confermare scambio';
  if (isReadOnly) {
    statusText = 'Scambio non attivo';
  } else if (isCompleted) {
    statusText = 'Scambio completato! ';
  } else if (myConfirmed && otherConfirmed) {
    statusText = 'Scambio completato! ';
  } else if (myConfirmed) {
    statusText = 'In attesa della conferma di ' + (matchInfo?.otherUser?.nickname || 'Utente');
  } else if (otherConfirmed) {
    statusText = (matchInfo?.otherUser?.nickname || 'Utente') + ' ha confermato!  Trascina per completare';
  }

  return (
    <View style={[styles. sliderWrap, { backgroundColor: colors.card }]}>
      <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>{statusText}</Text>

      <View style={styles.confirmStatusRow}>
        <View style={styles.confirmIndicator}>
          <Ionicons 
            name={myConfirmed ? 'checkmark-circle' : 'ellipse-outline'} 
            size={18} 
            color={myConfirmed ? colors.success : colors.border} 
          />
          <Text style={[
            styles.confirmText, 
            { color: colors.textSecondary },
            myConfirmed && { color: colors.success, fontWeight: '600' }
          ]}>
            Tu
          </Text>
        </View>
        <View style={styles.confirmIndicator}>
          <Ionicons 
            name={otherConfirmed ? 'checkmark-circle' : 'ellipse-outline'} 
            size={18} 
            color={otherConfirmed ? colors. success : colors.border} 
          />
          <Text style={[
            styles.confirmText,
            { color: colors.textSecondary },
            otherConfirmed && { color: colors.success, fontWeight: '600' }
          ]}>
            {matchInfo?.otherUser?. nickname || 'Altro'}
          </Text>
        </View>
      </View>

      <View style={[
        styles.sliderTrack,
        { backgroundColor: colors.inputBackground, borderColor: colors.border },
        (myConfirmed || isReadOnly || isCompleted) && { 
          backgroundColor: (isReadOnly && !isCompleted) ? colors.border : '#D1FADF', 
          borderColor: (isReadOnly && !isCompleted) ? colors.border : colors. success 
        }
      ]}>
        {!(myConfirmed || isReadOnly || isCompleted) && (
          <Animated.View
            style={[
              styles. sliderFill, 
              { backgroundColor: colors.accent + '40', width:  Animated.add(sliderX, KNOB_SIZE) }
            ]}
          />
        )}
        <Animated.View
          style={[
            styles.sliderKnob,
            {
              transform: [{ 
                translateX: (myConfirmed || isCompleted) 
                  ?  SLIDER_WIDTH - KNOB_SIZE 
                  : (isReadOnly ?  0 : sliderX) 
              }],
              backgroundColor: (isReadOnly && !isCompleted) 
                ? colors.border 
                : ((myConfirmed || isCompleted) ? colors.success : (sliderActive ? colors.primary : colors.accent))
            }
          ]}
          {... (!(myConfirmed || isReadOnly || isCompleted) ? sliderResponder. panHandlers : {})}
        >
          <Ionicons 
            name={(myConfirmed || isCompleted) ? 'checkmark' : 'arrow-forward'} 
            size={18} 
            color="#fff" 
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrap: { 
    paddingHorizontal: 16, 
    paddingBottom: 8, 
    paddingTop: 6 
  },
  sliderLabel: { 
    textAlign: 'center', 
    fontSize: 12, 
    marginBottom: 6 
  },
  confirmStatusRow: { 
    flexDirection: 'row', 
    justifyContent:  'center', 
    gap: 24, 
    marginBottom: 8 
  },
  confirmIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  confirmText: { fontSize: 12 },
  sliderTrack: {
    alignSelf: 'center',
    width: 260,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    top:  0,
    bottom: 0,
  },
  sliderKnob: {
    width: 38,
    height: 38,
    borderRadius: 19,
    position: 'absolute',
    left: 0,
    top:  3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4
  },
});