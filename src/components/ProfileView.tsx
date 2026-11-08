import React from 'react';
import {
  Award,
  Sparkles,
  Flame,
  Brain,
  Trophy,
  CheckCircle,
  Lock,
  BookOpen,
  GraduationCap,
  Briefcase,
  Compass,
  LogIn,
  LogOut,
  User,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  UserStats,
  UserProfile,
  SupportedLanguage,
} from '../types';
import { translations } from '../i18n/translations';
import { calculateLevel } from '../services/storageService';
import { getLanguageByCode } from '../data/languages';

interface ProfileViewProps {
  stats: UserStats;
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onProfileChange: (p: UserProfile) => void;
  onStatsUpdated: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenTranslatorModal?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  stats,
  currentProfile,
  currentLanguage,
  onProfileChange,
  onOpenAdminDashboard,
  onOpenTranslatorModal,
}) => {
  const t = translations[currentLanguage];
  const activeLang = getLanguageByCode(currentLanguage || 'fr');
  const { user, signOut, openAuthModal } = useAuth();
  const isFounder = user?.email?.toLowerCase().trim() === 'fotsojunior756@gmail.com';

  const { level, title, nextLevelXp, prevLevelXp } = calculateLevel(stats.xp);
  const currentLevelProgress = Math.min(
    100,
    Math.max(
      0,
      ((stats.xp - prevLevelXp) / Math.max(1, nextLevelXp - prevLevelXp)) * 100
    )
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Hero Card */}
      <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-indigo-600/20 relative overflow-hidden">
        {/* Glow circles */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center text-3xl font-black shrink-0 shadow-inner">
            {currentProfile === 'eleve' && '🎒'}
            {currentProfile === 'etudiant' && '🎓'}
            {currentProfile === 'professeur' && '💼'}
          </div>

          <div className="flex-1 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Niveau {level} • {title}</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Profil {t.profiles[currentProfile].name}
            </h1>
            <p className="text-xs text-indigo-100 max-w-lg">
              {t.profiles[currentProfile].desc}
            </p>
            {user?.email && (
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <p className="text-[11px] text-indigo-200/90 flex items-center gap-1 font-mono">
                  <User className="w-3 h-3 text-indigo-300" />
                  <span>{user.email}</span>
                </p>
                {isFounder && onOpenAdminDashboard && (
                  <button
                    type="button"
                    onClick={onOpenAdminDashboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 text-[10px] font-black uppercase tracking-wider border border-emerald-400/40 transition-all cursor-pointer shadow-xs active:scale-95"
                    title="Ouvrir la console Administrateur Supabase Auth"
                  >
                    <span>⚡ Console Supabase Auth</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* XP & Auth Action */}
          <div className="flex flex-col items-center sm:items-end gap-3 shrink-0">
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center min-w-[130px]">
              <span className="block text-3xl font-black text-amber-300">
                {stats.xp}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">
                Points d'XP Totaux
              </span>
            </div>

            {user ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/15 hover:bg-rose-500/80 text-white border border-white/25 text-xs font-bold transition-all shadow-xs cursor-pointer backdrop-blur-xs"
                title="Se déconnecter de son compte KIPO"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Déconnexion</span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Connexion</span>
              </button>
            )}
          </div>
        </div>

        {/* Level Progression Bar */}
        <div className="mt-6 pt-5 border-t border-white/15 space-y-2">
          <div className="flex justify-between text-xs font-bold text-indigo-100">
            <span>Progression Niveau {level}</span>
            <span>
              {stats.xp} / {nextLevelXp} XP ({Math.round(currentLevelProgress)}%)
            </span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden p-0.5 border border-white/20">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${currentLevelProgress}%` }}
            />
          </div>
        </div>
      </div>


      {/* Profile Switcher Grid */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Choix du Profil & Rôle Pédagogique
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            L'intelligence artificielle ajuste instantanément son vocabulaire, son niveau d'explication et ses méthodes selon le profil choisi.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'eleve' as UserProfile,
              name: t.profiles.eleve.name,
              sub: t.profiles.eleve.label,
              desc: t.profiles.eleve.desc,
              icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
              border: 'border-emerald-200',
              activeBg: 'bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500',
            },
            {
              id: 'etudiant' as UserProfile,
              name: t.profiles.etudiant.name,
              sub: t.profiles.etudiant.label,
              desc: t.profiles.etudiant.desc,
              icon: <GraduationCap className="w-5 h-5 text-indigo-600" />,
              border: 'border-indigo-200',
              activeBg: 'bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500',
            },
            {
              id: 'professeur' as UserProfile,
              name: t.profiles.professeur.name,
              sub: t.profiles.professeur.label,
              desc: t.profiles.professeur.desc,
              icon: <Briefcase className="w-5 h-5 text-amber-600" />,
              border: 'border-amber-200',
              activeBg: 'bg-amber-50 text-amber-900 ring-2 ring-amber-500',
            },
            {
              id: 'autre' as UserProfile,
              name: t.profiles.autre.name,
              sub: t.profiles.autre.label,
              desc: t.profiles.autre.desc,
              icon: <Compass className="w-5 h-5 text-teal-600" />,
              border: 'border-teal-200',
              activeBg: 'bg-teal-50 text-teal-900 ring-2 ring-teal-500',
            },
          ].map((prof) => {
            const isSelected = currentProfile === prof.id;
            return (
              <button
                key={prof.id}
                onClick={() => onProfileChange(prof.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                  isSelected
                    ? prof.activeBg
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-white shadow-2xs">
                    {prof.icon}
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-700 shadow-2xs">
                      Actif
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{prof.name}</h4>
                  <p className="text-[11px] font-medium text-slate-500">{prof.sub}</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{prof.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language & Universal Translation Settings Card */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50 to-indigo-50 rounded-2xl p-5 sm:p-6 border border-teal-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
              🌐
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Langue & Traduction Universelle
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 text-[10px] font-black uppercase">
                  130+ Langues
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Traduisez instantanément l’ensemble de l’interface, les exercices et le tuteur IA.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTranslatorModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
          >
            <Globe className="w-4 h-4" />
            <span>Changer de langue</span>
          </button>
        </div>

        <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl border border-teal-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{activeLang.flag}</span>
            <div>
              <p className="text-xs font-black text-slate-900">
                {activeLang.name} ({activeLang.nativeName})
              </p>
              <p className="text-[10px] text-slate-500 font-medium">
                Code ISO : {activeLang.code.toUpperCase()}
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-teal-700 px-2 py-0.5 rounded-lg bg-teal-100">
            Active
          </span>
        </div>
      </div>

      {/* Stats Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1.5" />
          <span className="block text-2xl font-black text-slate-900">
            {stats.streakDays} jours
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Série Active
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
          <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-1.5" />
          <span className="block text-2xl font-black text-slate-900">
            {stats.quizzesCompleted}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Quiz Réussis
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
          <Brain className="w-6 h-6 text-violet-500 mx-auto mb-1.5" />
          <span className="block text-2xl font-black text-slate-900">
            {stats.cardsMastered}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Cartes Maîtrisées
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center shadow-2xs">
          <Award className="w-6 h-6 text-indigo-500 mx-auto mb-1.5" />
          <span className="block text-2xl font-black text-slate-900">
            {stats.badges.filter((b) => b.unlocked).length} / {stats.badges.length}
          </span>
          <span className="text-[11px] font-semibold text-slate-500">
            Badges Débloqués
          </span>
        </div>
      </div>

      {/* Badges Trophy Room */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Salle des Trophées & Badges</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Accomplis des défis et révise quotidiennement pour tous les collectionner !
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {stats.badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                badge.unlocked
                  ? 'bg-amber-50/40 border-amber-200 text-slate-800'
                  : 'bg-slate-50 border-slate-200 text-slate-400 opacity-70'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg shadow-2xs ${
                  badge.unlocked
                    ? 'bg-amber-400 text-white shadow-amber-300'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {badge.unlocked ? '🏆' : <Lock className="w-4 h-4" />}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{badge.title}</span>
                  {badge.unlocked && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {badge.description}
                </p>
                <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700">
                  {badge.xpRequired} XP requis
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
