import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Clock,
  Smartphone,
  Share2,
  Check,
  X,
  AlertCircle,
  Flame,
  Download,
  Volume2,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  duolingoNotificationService,
  ReminderSettings,
} from '../services/duolingoNotificationService';
import { UserStats, UserProfile } from '../types';

interface DuolingoReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  userStats: UserStats;
  currentProfile: UserProfile;
}

export const DuolingoReminderModal: React.FC<DuolingoReminderModalProps> = ({
  isOpen,
  onClose,
  userStats,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [settings, setSettings] = useState<ReminderSettings>(() =>
    duolingoNotificationService.getSettings()
  );
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    duolingoNotificationService.getPermissionStatus()
  );
  const [permissionError, setPermissionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSettings(duolingoNotificationService.getSettings());
      setPermission(duolingoNotificationService.getPermissionStatus());
      setPermissionError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleReminder = (enabled: boolean) => {
    const updated = { ...settings, enabled };
    setSettings(updated);
    duolingoNotificationService.saveSettings(updated);
  };

  const handleTimeChange = (newTime: string) => {
    const updated = { ...settings, time: newTime };
    setSettings(updated);
    duolingoNotificationService.saveSettings(updated);
  };

  const handleToggleSound = (soundEnabled: boolean) => {
    const updated = { ...settings, soundEnabled };
    setSettings(updated);
    duolingoNotificationService.saveSettings(updated);
    if (soundEnabled) {
      duolingoNotificationService.playReminderSound();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Mascot & Gradient */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 p-5 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner border border-white/30">
              <span>🦉</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xl font-black tracking-tight">Rappels Quotidiens KIPO</h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase">
                  Écran d'accueil
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                Reçois une alerte quotidienne pour ne jamais briser ta série de révisions !
              </p>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 divide-y divide-slate-100 text-slate-800">
          {/* SECTION 1 : RAPPELS DE NOTIFICATION DUOLINGO */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 mt-0.5">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Notification quotidienne sur l'écran d'accueil
                  </h4>
                  <p className="text-xs text-slate-500">
                    KIPO t'envoie un rappel bienveillant à l'heure de ton choix pour progresser sur ton sentier.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => handleToggleReminder(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Auto-Authorized confirmation badge */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">Rappels quotidiens autorisés automatiquement (Web & Mobile).</span>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 shrink-0">
                Actif
              </span>
            </div>

            {/* Time Selector */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" />
                  Heure du rappel quotidien :
                </span>
                <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-lg">
                  {settings.time}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {['08:00', '12:30', '17:00', '18:00', '19:30', '20:30'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeChange(time)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      settings.time === time
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>

              {/* Custom Time Input */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-500 font-medium">Autre horaire :</span>
                <input
                  type="time"
                  value={settings.time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="px-2 py-1 text-xs font-bold bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            </div>

            {/* Sound Chime Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Volume2 className="w-4 h-4 text-indigo-600" />
                <span>Carillon sonore KIPO lors de l'alerte</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => handleToggleSound(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>

          {/* SECTION 2 : INSTALLER SUR L'ÉCRAN D'ACCUEIL */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-sm text-slate-900">
                Installation sur l'écran d'accueil (Application PWA)
              </h4>
            </div>

            {isInstalled ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>KIPO est déjà installée sur ton écran d'accueil comme une application native !</span>
              </div>
            ) : isInstallable ? (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                <p className="text-xs text-indigo-900">
                  Ajoute KIPO à ton écran d'accueil pour y accéder en 1 clic sans passer par le navigateur :
                </p>
                <button
                  onClick={install}
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Installer KIPO sur l'écran d'accueil</span>
                </button>
              </div>
            ) : isIOS ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  Pour installer sur iPhone / iPad (Safari) :
                </p>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-800 pl-1 font-medium">
                  <li>Appuie sur le bouton <strong>Partager</strong> <Share2 className="w-3 h-3 inline" /> en bas de Safari</li>
                  <li>Fais défiler et touche <strong>« Sur l'écran d'accueil »</strong> ➕</li>
                  <li>Touche <strong>« Ajouter »</strong> : KIPO aura son icône d'application 🦉 !</li>
                </ol>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Ouvre cette page dans Chrome, Edge ou Safari sur ton smartphone et sélectionne « Ajouter à l'écran d'accueil » pour transformer KIPO en application native.
              </p>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Série actuelle : {userStats.streakDays || 1} jours</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
          >
            Enregistrer & Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
