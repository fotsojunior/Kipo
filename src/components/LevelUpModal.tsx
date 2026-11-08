import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, X, ChevronRight } from 'lucide-react';
import { Badge, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { soundEffects } from '../utils/soundEffects';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  levelTitle: string;
  unlockedBadges: Badge[];
  language: SupportedLanguage;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({
  isOpen,
  onClose,
  newLevel,
  levelTitle,
  unlockedBadges,
  language,
}) => {
  const t = translations[language];

  useEffect(() => {
    if (isOpen) {
      soundEffects.playLevelUp();
      // Shoot double confetti blast
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#8b5cf6', '#f59e0b', '#10b981'],
        });
        setTimeout(() => {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
          });
        }, 250);
      } catch (e) {
        console.warn('Confetti error:', e);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-100 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Level badge hero */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/30 mb-4 animate-bounce">
          <Award className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          {t.gamification.levelUpModalTitle}
        </div>

        <h3 className="text-2xl font-black text-slate-900 mb-1">
          Niveau {newLevel} Débloqué !
        </h3>
        <p className="text-lg font-bold text-indigo-600 mb-2">
          « {levelTitle} »
        </p>
        <p className="text-sm text-slate-600 mb-6">
          {t.gamification.levelUpSubtitle} Continue sur cette lancée pour devenir incollable !
        </p>

        {/* Unlocked Badges list */}
        {unlockedBadges.length > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Nouveau(x) Trophée(s) :
            </p>
            <div className="space-y-2">
              {unlockedBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-sm">
                    🏆
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-800">{badge.title}</h5>
                    <p className="text-xs text-slate-500">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>Continuer à Apprendre</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
