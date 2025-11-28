import { api } from './apiClient';
import { ImageSourcePropType } from 'react-native';

export type AvatarOption = { key: string; source: ImageSourcePropType; label: string };

// Avatar locali - usa require() per le immagini nel client
export const LOCAL_AVATARS: AvatarOption[] = [
  { key: 'ava1', source: require('../../assets/avatars/ragazza.jpg'), label: 'Ragazza' },
  { key: 'ava2', source: require('../../assets/avatars/ragazzo.jpg'), label: 'Ragazzo' },
];

export function getDefaultAvatars(): AvatarOption[] {
  return LOCAL_AVATARS;
}

export function getAvatarByKey(key: string): AvatarOption | undefined {
  return LOCAL_AVATARS. find(a => a.key === key);
}

export async function updateMyAvatarByKey(avatarKey: string) {
  const { data } = await api.patch('/auth/me/avatar', { avatarKey });
  return data;
}