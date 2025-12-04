export interface Author {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  totalViews?: number;
  novelsCount?: number;
  followers?: number;
}

export interface Novel {
  id: string;
  title: string;
  synopsis: string;
  content: string;
  author: Author;
  categories: string[];
  tags: string[];
  rating: number;
  ratingCount: number;
  views: number;
  readTime: number;
  publishDate: string;
  thumbnail: string;
  youtubeVideoId?: string;
  ageRating: 'Livre' | '+12' | '+16' | '+18';
  chapters?: Chapter[];
  isFeatured?: boolean;
  isNew?: boolean;
  commentsCount?: number;
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
  publishDate: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  date: string;
  likes: number;
  replies?: Comment[];
}

export type Category = 
  | 'Romance'
  | 'Fantasia'
  | 'Drama'
  | 'Aventura'
  | 'Ficção Científica'
  | 'Suspense'
  | 'Thriller'
  | 'Mistério'
  | 'Terror'
  | 'Comédia'
  | 'Ação'
  | 'Histórico';

export const CATEGORIES: Category[] = [
  'Romance',
  'Fantasia',
  'Drama',
  'Aventura',
  'Ficção Científica',
  'Suspense',
  'Thriller',
  'Mistério',
  'Terror',
  'Comédia',
  'Ação',
  'Histórico',
];

export const AGE_RATINGS = ['Livre', '+12', '+16', '+18'] as const;
