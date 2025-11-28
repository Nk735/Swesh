// Tipi condivisi tra schermate e servizi

export type User = {
  id: string;
  email: string;
  nickname: string;
  avatarKey?: string;
};

export type ItemOwner = {
  nickname: string;
  avatarKey?: string;
  _id?: string;
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