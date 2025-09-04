import { api } from './apiClient';
import { ProposalResponse, GroupedMatchesResponse, ChatMessage } from '../types/trade';

export async function createProposal(targetItemId: string, offeredItemId: string): Promise<ProposalResponse> {
  const { data } = await api.post('/proposals', { targetItemId, offeredItemId });
  return data;
}

export async function getGroupedMatches(): Promise<GroupedMatchesResponse[]> {
  const { data } = await api.get('/matches', { params: { groupByUser: 'true' } });
  return data;
}

export async function getChatMessages(matchId: string): Promise<ChatMessage[]> {
  const { data } = await api.get(`/chat/${matchId}/messages`);
  return data.messages;
}

export async function sendChatMessage(matchId: string, content: string) {
  const { data } = await api.post(`/chat/${matchId}/messages`, { content });
  return data;
}