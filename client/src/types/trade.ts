export interface ProposalResponsePending {
  status: 'pending';
  proposalId: string;
}

export interface ProposalResponseMatched {
  status: 'matched';
  matchId: string;
  chatId: string;
}

export type ProposalResponse = ProposalResponsePending | ProposalResponseMatched;

export interface GroupedMatchesResponse {
  otherUser: {
    _id: string;
    nickname: string;
    avatarUrl?: string;
  };
  aggregate: {
    matchCount: number;
    unreadTotal: number;
    lastActivityAt: string;
  };
  matches: {
    matchId: string;
    status: string;
    unread: number;
    lastActivityAt: string;
    itemMine: { _id: string; title: string; imageUrl: string } | null;
    itemTheirs: { _id: string; title: string; imageUrl: string } | null;
  }[];
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}