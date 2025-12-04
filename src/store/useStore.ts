import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UserPreferences {
  theme: 'dark' | 'light';
  fontSize: number;
  favorites: string[];
  readingHistory: string[];
}

interface StoreState {
  preferences: UserPreferences;
  setTheme: (theme: 'dark' | 'light') => void;
  setFontSize: (size: number) => void;
  addFavorite: (novelId: string) => void;
  removeFavorite: (novelId: string) => void;
  isFavorite: (novelId: string) => boolean;
  addToHistory: (novelId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategories: string[];
  toggleCategory: (category: string) => void;
  clearCategories: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      preferences: {
        theme: 'dark',
        fontSize: 16,
        favorites: [],
        readingHistory: [],
      },
      setTheme: (theme) =>
        set((state) => ({
          preferences: { ...state.preferences, theme },
        })),
      setFontSize: (fontSize) =>
        set((state) => ({
          preferences: { ...state.preferences, fontSize },
        })),
      addFavorite: (novelId) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            favorites: [...state.preferences.favorites, novelId],
          },
        })),
      removeFavorite: (novelId) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            favorites: state.preferences.favorites.filter((id) => id !== novelId),
          },
        })),
      isFavorite: (novelId) => get().preferences.favorites.includes(novelId),
      addToHistory: (novelId) =>
        set((state) => {
          const history = state.preferences.readingHistory.filter((id) => id !== novelId);
          return {
            preferences: {
              ...state.preferences,
              readingHistory: [novelId, ...history].slice(0, 50),
            },
          };
        }),
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      selectedCategories: [],
      toggleCategory: (category) =>
        set((state) => ({
          selectedCategories: state.selectedCategories.includes(category)
            ? state.selectedCategories.filter((c) => c !== category)
            : [...state.selectedCategories, category],
        })),
      clearCategories: () => set({ selectedCategories: [] }),
    }),
    {
      name: 'novel-store',
    }
  )
);
