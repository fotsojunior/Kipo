import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Sparkles,
  Smartphone,
  Flame,
  Check,
  ChevronRight,
  Globe,
  X,
} from 'lucide-react';
import {
  duolingoNotificationService,
  ReminderSettings,
} from '../services/duolingoNotificationService';
import { UserStats, UserProfile } from '../types';

interface DuolingoReminderBannerProps {
  userStats: UserStats;
  currentProfile: UserProfile;
  onOpenReminderModal: () => void;
}

export const DuolingoReminderBanner: React.FC<DuolingoReminderBannerProps> = ({
  userStats,
  currentProfile,
  onOpenReminderModal,
}) => {
  const [settings, setSettings] = useState<ReminderSettings>(() =>
    duolingoNotificationService.getSettings()
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setSettings(duolingoNotificationService.getSettings());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('kipo_notification_settings_changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('kipo_notification_settings_changed', handleStorageChange);
    };
  }, []);

  if (isDismissed) return null;

  return (
    <div className="relative mb-6 p-4 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white shadow-xl shadow-emerald-950/10 overflow-hidden border border-emerald-400/30">
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Mascot & Reminder Copy */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md text-2xl shrink-0 shadow-inner border border-white/30">
            <span>🦉</span>
            {settings.enabled && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-emerald-700"></span>
              </span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
                <span>Rappels KIPO sur l'écran d'accueil</span>
                <span className="text-amber-300">★</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-[10px] font-bold">
                Actif automatiquement à {settings.time}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5 max-w-xl font-medium">
              KIPO t'enverra une notification chaque jour à {settings.time} pour préserver ta série de {userStats.streakDays || 1} jours !
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={onOpenReminderModal}
            className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all shadow-md shadow-amber-900/20 cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Gérer l'horaire</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
