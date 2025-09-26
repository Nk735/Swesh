// Tipi per il sistema di match stile Tinder

export interface InteractionResponse {
  itemId: string;
  action: 'like' | 'dislike' | 'skip';
  updatedAt: string;
  match?: {
    matched: boolean;
    matchId: string;
    chatId: string;
    isNew?: boolean;
    matchedItems?: {
      myItem: string;
      theirItem: string;
    };
  };
}

export interface TinderMatch {
  matchId: string;
  matchType: 'tinder' | 'proposal';
  status: 'active' | 'completed' | 'archived';
  lastActivityAt: string;
  unread: number;
  itemMine: {
    _id: string;
    title: string;
    imageUrl: string;
  } | null;
  itemTheirs: {
    _id: string;
    title: string;
    imageUrl: string;
  } | null;
  otherUser: {
    _id: string;
    nickname: string;
    avatarUrl?: string;
  };
  tinderMetadata?: {
    triggerUserId: string;
    triggerItemId: string;
    matchedAt: string;
  };
}

export interface GroupedMatchesResponse {
  otherUser: {
    _id: string;
    nickname: string;
    avatarUrl?: string;
  };
  aggregate: {
    matchCount: number;
    tinderMatches: number;
    proposalMatches: number;
    unreadTotal: number;
    lastActivityAt: string;
  };
  matches: {
    matchId: string;
    status: string;
    matchType: 'tinder' | 'proposal';
    unread: number;
    lastActivityAt: string;
    itemMine: { _id: string; title: string; imageUrl: string } | null;
    itemTheirs: { _id: string; title: string; imageUrl: string } | null;
    tinderMetadata?: {
      triggerUserId: string;
      triggerItemId: string;
      matchedAt: string;
    };
  }[];
}

export interface RecentMatch {
  matchId: string;
  otherUser: {
    _id: string;
    nickname: string;
    avatarUrl?: string;
  };
  myItem: {
    _id: string;
    title: string;
    imageUrl: string;
  };
  theirItem: {
    _id: string;
    title: string;
    imageUrl: string;
  };
  createdAt: string;
  chatId: string;
}

export interface ChatMessage {
  _id: string;
  senderId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface InteractionStats {
  likes: number;
  dislikes: number;
  skips: number;
  total: number;
}

// Manteniamo i tipi legacy per backward compatibility
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