import { api } from './apiClient';
import { 
  InteractionResponse, 
  GroupedMatchesResponse, 
  ChatMessage, 
  RecentMatch,
  InteractionStats,
  TinderMatch,
  ChatMessagesEnvelope
} from '../types/trade';

// Nuove funzioni per il sistema Tinder
export async function likeItem(itemId: string): Promise<InteractionResponse> {
  const { data } = await api.post('/interactions', { itemId, action: 'like' });
  return data;
}

export async function dislikeItem(itemId: string): Promise<InteractionResponse> {
  const { data } = await api.post('/interactions', { itemId, action: 'dislike' });
  return data;
}

export async function skipItem(itemId: string): Promise<InteractionResponse> {
  const { data } = await api.post('/interactions', { itemId, action: 'skip' });
  return data;
}

export async function getMyInteractionStats(): Promise<InteractionStats> {
  const { data } = await api.get('/interactions/stats');
  return data;
}

export async function getMyLikes() {
  const { data } = await api.get('/interactions/likes');
  return data;
}

// Match functions
export async function getGroupedMatches(type?: 'tinder'): Promise<GroupedMatchesResponse[]> {
  const params: any = { groupByUser: 'true' };
  if (type) params.type = type;
  
  const { data } = await api.get('/matches', { params });
  return data;
}

export async function getAllMatches(type?: 'tinder'): Promise<TinderMatch[]> {
  const params: any = {};
  if (type) params.type = type;
  
  const { data } = await api.get('/matches', { params });
  return data;
}

export async function getRecentMatches(limit: number = 10): Promise<RecentMatch[]> {
  const { data } = await api.get('/matches/recent', { params: { limit } });
  return data;
}

// Chat functions
export async function getChatMessages(matchId: string): Promise<ChatMessagesEnvelope> {
  const { data } = await api.get(`/chat/${matchId}/messages`);
  return data;
}

export async function sendChatMessage(matchId: string, content: string) {
  const { data } = await api.post(`/chat/${matchId}/messages`, { content });
  return data;
}

// Annulla scambio
export async function cancelMatch(matchId: string, reason?: string) {
  const { data } = await api.patch(`/matches/${matchId}/cancel`, reason ? { reason } : {});
  return data as { matchId: string; status: 'archived'; cancellation?: { by: string; at: string; reason?: string }; lastActivityAt: string };
}

// Get single match by ID
export async function getMatchById(matchId: string): Promise<TinderMatch & { 
  confirmation: { myConfirmed: boolean; otherConfirmed: boolean };
  cancellation?: { by: string; at: string; reason?: string };
  completedAt?: string;
}> {
  const { data } = await api.get(`/matches/${matchId}`);
  return data;
}

// Confirm exchange
export async function confirmExchange(matchId: string) {
  const { data } = await api.patch(`/matches/${matchId}/confirm`);
  return data as {
    matchId: string;
    status: 'active' | 'completed' | 'archived';
    confirmation: { myConfirmed: boolean; otherConfirmed: boolean };
    lastActivityAt: string;
    completedAt?: string;
  };
}

// Utility functions
export function isNewMatch(interaction: InteractionResponse): boolean {
  return interaction.match?.matched === true && interaction.match?.isNew === true;
}

export function getMatchInfo(interaction: InteractionResponse) {
  return interaction.match;
}

// Funzione per convertire una risposta di interazione in notifica match
export function formatMatchNotification(interaction: InteractionResponse, likedItem: any) {
  if (!isNewMatch(interaction)) return null;
  
  return {
    matchId: interaction.match!.matchId,
    chatId: interaction.match!.chatId,
    otherUser: {
      nickname: likedItem.owner?.nickname || 'Utente',
      avatarUrl: likedItem.owner?.avatarUrl
    },
    matchedItems: {
      theirItem: likedItem,
      myItem: interaction.match!.matchedItems?.myItem
    }
  };
}