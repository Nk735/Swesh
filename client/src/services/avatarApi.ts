import { api } from './apiClient';

export type AvatarOption = { key: string; url: string; label?: string };

export async function getDefaultAvatars(): Promise<AvatarOption[]> {
  const { data } = await api.get('/avatars');
  return data.avatars ?? [];
}

export async function updateMyAvatarByKey(avatarKey: string) {
  const { data } = await api.patch('/auth/me/avatar', { avatarKey });
  return data; // profilo aggiornato
}

export async function updateMyAvatarByUrl(avatarUrl: string) {
  const { data } = await api.patch('/auth/me/avatar', { avatarUrl });
  return data; // profilo aggiornato
}