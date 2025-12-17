/**
 * PWA Install Hook
 * Manages PWA installation state, prompts, and user preferences
 */

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  shouldShowPrompt: boolean;
  visitCount: number;
  promptDismissed: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
}

const STORAGE_KEYS = {
  VISIT_COUNT: 'pwa_visit_count',
  PROMPT_DISMISSED: 'pwa_prompt_dismissed',
  INSTALLED: 'pwa_installed',
  LAST_VISIT: 'pwa_last_visit',
};

const MIN_VISITS_FOR_PROMPT = 1; // Show from first visit
const MAX_VISITS_FOR_PROMPT = 3; // Stop showing after 3 visits

export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    shouldShowPrompt: false,
    visitCount: 0,
    promptDismissed: false,
    installPrompt: null,
  });

  // Detect platform and standalone mode
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as Window & { MSStream?: unknown }).MSStream;
    const isAndroid = /Android/.test(userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    // Get stored values
    const storedVisitCount = parseInt(localStorage.getItem(STORAGE_KEYS.VISIT_COUNT) || '0', 10);
    const promptDismissed = localStorage.getItem(STORAGE_KEYS.PROMPT_DISMISSED) === 'true';
    const installed = localStorage.getItem(STORAGE_KEYS.INSTALLED) === 'true';
    const lastVisit = localStorage.getItem(STORAGE_KEYS.LAST_VISIT);

    // Track visit (once per session, with a 1-hour cooldown)
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    let newVisitCount = storedVisitCount;

    if (!lastVisit || now - parseInt(lastVisit, 10) > ONE_HOUR) {
      newVisitCount = storedVisitCount + 1;
      localStorage.setItem(STORAGE_KEYS.VISIT_COUNT, newVisitCount.toString());
      localStorage.setItem(STORAGE_KEYS.LAST_VISIT, now.toString());
    }

    // Determine if we should show the prompt
    // Show for all users on first 3 visits who haven't dismissed or installed
    const shouldShowPrompt =
      !isStandalone &&
      !installed &&
      !promptDismissed &&
      newVisitCount >= MIN_VISITS_FOR_PROMPT &&
      newVisitCount <= MAX_VISITS_FOR_PROMPT;

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isStandalone,
      visitCount: newVisitCount,
      promptDismissed,
      isInstalled: installed || isStandalone,
      shouldShowPrompt,
    }));
  }, []);

  // Listen for beforeinstallprompt event (Chromium browsers)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;

      setState(prev => ({
        ...prev,
        isInstallable: true,
        installPrompt: promptEvent,
      }));
    };

    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        shouldShowPrompt: false,
        installPrompt: null,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger native install prompt (Android/Chrome)
  const triggerInstall = useCallback(async () => {
    if (!state.installPrompt) {
      // For iOS, we can't trigger programmatically
      if (state.isIOS) {
        return { success: false, reason: 'ios-manual' };
      }
      return { success: false, reason: 'no-prompt' };
    }

    try {
      await state.installPrompt.prompt();
      const { outcome } = await state.installPrompt.userChoice;

      if (outcome === 'accepted') {
        localStorage.setItem(STORAGE_KEYS.INSTALLED, 'true');
        setState(prev => ({
          ...prev,
          isInstalled: true,
          shouldShowPrompt: false,
          installPrompt: null,
        }));
        return { success: true, outcome };
      }

      return { success: false, outcome };
    } catch (error) {
      console.error('PWA install error:', error);
      return { success: false, reason: 'error' };
    }
  }, [state.installPrompt, state.isIOS]);

  // Dismiss the prompt
  const dismissPrompt = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.PROMPT_DISMISSED, 'true');
    setState(prev => ({
      ...prev,
      promptDismissed: true,
      shouldShowPrompt: false,
    }));
  }, []);

  // Reset dismissal (for settings menu)
  const resetDismissal = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.PROMPT_DISMISSED);
    setState(prev => ({
      ...prev,
      promptDismissed: false,
    }));
  }, []);

  // Check if install option should be shown in settings (mobile or desktop with installable browser)
  const canShowInstallInSettings = !state.isInstalled && !state.isStandalone;

  return {
    ...state,
    triggerInstall,
    dismissPrompt,
    resetDismissal,
    canShowInstallInSettings,
  };
}

export type { BeforeInstallPromptEvent, PWAInstallState };
