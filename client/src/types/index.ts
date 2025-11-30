// Tipi condivisi tra schermate e servizi

export type Gender = 'male' | 'female' | 'prefer_not_to_say';
export type FeedGenderPreference = 'male' | 'female' | 'all';
export type ItemVisibility = 'male' | 'female' | 'all';
export type ThemePreference = 'light' | 'dark' | 'system';

export type User = {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  avatarKey?: string;
  completedExchangesCount?: number;
  age?: number;
  gender?: Gender;
  feedPreferences?: {
    showGender: FeedGenderPreference | null;
  };
  onboarding?: {
    completed: boolean;
    completedAt?: string;
  };
};

export type ItemOwner = {
  nickname: string;
  avatarUrl?: string;
  _id?: string;
  gender?: Gender;
};

export type Item = {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  images?: string[];
  condition?: 'new' | 'excellent' | 'good';
  isAvailable?: boolean;
  size?: string;
  category?: string;
  owner: ItemOwner;
  createdAt?: string;
  updatedAt?: string;
  visibleTo?: ItemVisibility;
};

export type InteractionAction = 'like' | 'dislike' | 'skip';

export interface FeedMeta {
  limit: number;
  excludedCount: number;
  windowDays: number;
}

export interface FeedResponse {
  items: Item[];
  meta?: FeedMeta;
}

// TODO (futuro): generare questi tipi automaticamente da OpenAPI/Swagger