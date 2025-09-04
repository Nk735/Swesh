import { Platform, Alert as RNAlert } from 'react-native';

/**
 * Cross‐platform alert:
 * • su web usa window.alert
 * • su mobile usa Alert.alert
 */
export function showAlert(title: string, message?: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}${message ? '\n\n' + message : ''}`);
  } else {
    RNAlert.alert(title, message);
  }
}