/**
 * KIPO Universal Translation Engine
 * Translates the ENTIRE application into any world language:
 * 1. UI Dictionary Layer (React Translations & Dynamic /api/translate-ui via Gemini)
 * 2. Real-time Google Translate DOM Engine with cookie & combo synchronization
 * 3. AI Tutor & Learning Material generation synchronization
 */

import { registerDynamicLanguage } from '../i18n/translations';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: any;
    __kipo_gt_initialized?: boolean;
  }
}

const COOKIE_NAME = 'googtrans';

export const translatorService = {
  /**
   * Initialize translator infrastructure
   */
  init() {
    if (typeof window === 'undefined') return;

    // Check if element exists, otherwise create it
    if (!document.getElementById('google_translate_element')) {
      const div = document.createElement('div');
      div.id = 'google_translate_element';
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    // Set callback if not already set
    if (!window.googleTranslateElementInit) {
      window.googleTranslateElementInit = () => {
        try {
          if (window.google && window.google.translate && window.google.translate.TranslateElement) {
            new window.google.translate.TranslateElement(
              {
                pageLanguage: 'fr',
                autoDisplay: false,
                layout: window.google.translate.TranslateElement.InlineLayout?.SIMPLE,
              },
              'google_translate_element'
            );
            window.__kipo_gt_initialized = true;
          }
        } catch (e) {
          console.warn('[Translator] Init error:', e);
        }
      };
    }

    // Inject Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.type = 'text/javascript';
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.head.appendChild(script);
    }
  },

  /**
   * Apply translation to a specific language code across the entire application
   */
  async applyLanguage(langCode: string, langName?: string): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    this.init();

    const cleanCode = (langCode || 'fr').trim();
    const isOriginal = cleanCode.toLowerCase() === 'fr';

    // 1. Set Google Translate cookies across all path and domain variants
    try {
      const cookieValue = isOriginal ? '' : `/auto/${cleanCode}`;
      const expires = isOriginal
        ? 'Thu, 01 Jan 1970 00:00:00 UTC'
        : 'Fri, 31 Dec 2030 23:59:59 GMT';

      // Set cookie on root path
      document.cookie = `${COOKIE_NAME}=${cookieValue}; path=/; expires=${expires}; SameSite=Lax`;
      document.cookie = `${COOKIE_NAME}=${isOriginal ? '' : `/fr/${cleanCode}`}; path=/; expires=${expires}; SameSite=Lax`;

      // Set cookie on host domain if not empty
      if (window.location.hostname) {
        document.cookie = `${COOKIE_NAME}=${cookieValue}; path=/; domain=${window.location.hostname}; expires=${expires}; SameSite=Lax`;
        document.cookie = `${COOKIE_NAME}=${isOriginal ? '' : `/fr/${cleanCode}`}; path=/; domain=${window.location.hostname}; expires=${expires}; SameSite=Lax`;
      }
    } catch (e) {
      console.warn('[Translator] Cookie error:', e);
    }

    // 2. Update HTML lang tag
    document.documentElement.lang = cleanCode;

    // 3. Save choice in localStorage
    try {
      localStorage.setItem('kipo_language', cleanCode);
    } catch {}

    // 4. If language is not already bundled, fetch complete UI dictionary from backend
    if (!isOriginal) {
      let hasLocal = false;
      try {
        const cached = localStorage.getItem(`kipo_i18n_${cleanCode.toLowerCase()}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.app) {
            registerDynamicLanguage(cleanCode, parsed);
            hasLocal = true;
          }
        }
      } catch {}

      if (!hasLocal) {
        try {
          const res = await fetch('/api/translate-ui', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ languageCode: cleanCode, languageName: langName }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.dictionary) {
              registerDynamicLanguage(cleanCode, data.dictionary);
            }
          }
        } catch (e) {
          console.warn('[Translator] Error fetching dynamic dictionary:', e);
        }
      }
    }

    // 5. Trigger Google Translate combo element in the DOM
    const triggerCombo = () => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select) {
        select.value = isOriginal ? '' : cleanCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    if (!triggerCombo()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (triggerCombo() || attempts > 15) {
          clearInterval(interval);
        }
      }, 150);
    }

    // 6. Broadcast event to React components
    window.dispatchEvent(
      new CustomEvent('kipo_language_changed', {
        detail: { language: cleanCode, name: langName },
      })
    );

    return true;
  },

  /**
   * Reset back to French
   */
  resetToOriginal() {
    this.applyLanguage('fr', 'Français');
  },
};
