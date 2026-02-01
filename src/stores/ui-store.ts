"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  // Sidebar state
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleCollapse: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      collapseSidebar: () => set({ sidebarCollapsed: true }),

      expandSidebar: () => set({ sidebarCollapsed: false }),

      toggleCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: "wa-dashboard-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed
      }),
    }
  )
);
