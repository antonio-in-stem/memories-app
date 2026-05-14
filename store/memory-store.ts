'use client';

import { create } from 'zustand';

type ThemeMode = 'light' | 'dark';
type ModalFocus = 'story' | 'comments';

type MemoryStore = {
  activeProfile: string;
  activeRole: string;
  query: string;
  theme: ThemeMode;
  heartBumps: Record<string, number>;
  commentFavs: Record<string, number>;
  modalOpen: boolean;
  modalFocus: ModalFocus;
  stackIds: string[];
  stackIndex: number;
  setActiveProfile: (username: string) => void;
  setActiveRole: (role: string) => void;
  setQuery: (query: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  bumpHeart: (memoryId: string) => void;
  bumpCommentFav: (commentId: string) => void;
  openMemoryStack: (memoryIds: string[], memoryId: string, focus?: ModalFocus) => void;
  closeMemoryStack: () => void;
  rotateStack: (direction: -1 | 1) => void;
};

export const useMemoryStore = create<MemoryStore>((set) => ({
  activeProfile: 'all',
  activeRole: 'all',
  query: '',
  theme: 'light',
  heartBumps: {},
  commentFavs: {},
  modalOpen: false,
  modalFocus: 'story',
  stackIds: [],
  stackIndex: 0,
  setActiveProfile: (username) => set({ activeProfile: username }),
  setActiveRole: (role) => set({ activeRole: role }),
  setQuery: (query) => set({ query }),
  setTheme: (theme) => set({ theme }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  bumpHeart: (memoryId) =>
    set((state) => ({
      heartBumps: {
        ...state.heartBumps,
        [memoryId]: (state.heartBumps[memoryId] || 0) + 1,
      },
    })),
  bumpCommentFav: (commentId) =>
    set((state) => ({
      commentFavs: {
        ...state.commentFavs,
        [commentId]: (state.commentFavs[commentId] || 0) + 1,
      },
    })),
  openMemoryStack: (memoryIds, memoryId, focus = 'story') =>
    set({
      modalOpen: true,
      modalFocus: focus,
      stackIds: memoryIds,
      stackIndex: Math.max(0, memoryIds.indexOf(memoryId)),
    }),
  closeMemoryStack: () => set({ modalOpen: false }),
  rotateStack: (direction) =>
    set((state) => {
      if (state.stackIds.length === 0) {
        return state;
      }

      return {
        stackIndex: (state.stackIndex + direction + state.stackIds.length) % state.stackIds.length,
      };
    }),
}));
