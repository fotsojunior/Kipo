import React, { useState } from 'react';
import { LogIn, UserPlus, Cloud, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { storageService } from '../services/storageService';

interface AuthReminderBannerProps {
  language?: SupportedLanguage;
}

export const AuthReminderBanner: React.FC<AuthReminderBannerProps> = ({ language }) => {
  const { user, openAuthModal } = useAuth();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('kipo_auth_reminder_dismissed') === 'true';
  });

  const activeLang = language || storageService.getUserStats().language || 'fr';
  const t = translations[activeLang];

  // If user signs in, immediately hide reminder
  if (user) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('kipo_auth_reminder_dismissed', 'true');
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    openAuthModal(mode);
  };

  if (isDismissed) {
    // Subtle minimized reminder bar when dismissed
    return (
      <div className="bg-amber-50/90 border-b border-amber-200 px-3 py-1.5 text-xs text-amber-900 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <Cloud className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          <span>{t.auth.guestNotice}</span>
        </div>
        <button
          onClick={() => handleOpenAuth('signin')}
          className="font-black text-indigo-700 hover:text-indigo-900 underline text-[11px] cursor-pointer"
        >
          {t.auth.savePrompt}
        </button>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-md border-b border-emerald-400/40 px-3 sm:px-6 py-3 transition-all animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Mascot & Reminder Text */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0 shadow-inner">
            🦉
          </div>
          <div className="space-y-0.5 text-left">
            <div className="flex items-center gap-1.5 font-black text-xs sm:text-sm tracking-tight">
              <span>{t.auth.reminderTitle}</span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                Cloud
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-100 leading-snug">
              {t.auth.reminderText}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleOpenAuth('signin')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-indigo-900 hover:bg-emerald-50 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
            title="Connexion"
          >
            <LogIn className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <span>{t.nav.login}</span>
          </button>

          <button
            onClick={() => handleOpenAuth('signup')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all cursor-pointer shadow-sm active:scale-95"
            title="S'inscrire"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>{t.nav.signup}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
            title="Fermer"
            aria-label="Fermer le rappel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
