'use client';

/**
 * Keyboard Shortcuts Hook
 * Handles global keyboard shortcuts throughout the app
 */

import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  alt?: boolean;
  shift?: boolean;
  callback: () => void;
  description?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Escape to work even in inputs
        if (event.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        // For Cmd+K, check either ctrl or meta (cross-platform)
        const modifierMatch = shortcut.meta || shortcut.ctrl
          ? (event.metaKey || event.ctrlKey) && altMatch && shiftMatch
          : ctrlMatch && metaMatch && altMatch && shiftMatch;

        if (keyMatch && modifierMatch) {
          event.preventDefault();
          shortcut.callback();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Common shortcuts that can be imported and used
export const COMMON_SHORTCUTS = {
  COMMAND_PALETTE: { key: 'k', meta: true, description: 'Open command palette' },
  SEARCH: { key: '/', description: 'Focus search' },
  ESCAPE: { key: 'Escape', description: 'Close modal / Cancel' },
  GO_HOME: { key: 'g', alt: true, description: 'Go to dashboard' },
  GO_MESSAGES: { key: 'm', alt: true, description: 'Go to messages' },
  GO_USERS: { key: 'u', alt: true, description: 'Go to users' },
  GO_SETTINGS: { key: 's', alt: true, description: 'Go to settings' },
};
