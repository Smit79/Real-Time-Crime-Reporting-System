import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      theme: 'system',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'crimewatch-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

export default useThemeStore;
