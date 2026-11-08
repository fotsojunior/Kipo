import {
  Sparkles,
  Flame,
  Volume2,
  VolumeX,
  Search,
  BookOpen,
  GraduationCap,
  Briefcase,
  Compass,
  Globe,
  Award,
  Heart,
  Gem,
  LogIn,
  UserCheck,
  UserPlus,
  Check,
  Bell,
  HelpCircle,
} from 'lucide-react';
import { UserStats, UserProfile, SupportedLanguage } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from '../context/AuthContext';
import { getLanguageByCode } from '../data/languages';

interface NavbarProps {
  stats: UserStats;
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onProfileChange: (p: UserProfile) => void;
  onLanguageChange: (l: SupportedLanguage) => void;
  onOpenSearch: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onNavigateToProfile?: () => void;
  onOpenReminderModal?: () => void;
  onOpenHelpGuide?: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenTranslatorModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  currentProfile,
  currentLanguage,
  onProfileChange,
  onLanguageChange,
  onOpenSearch,
  isMuted,
  onToggleMute,
  onNavigateToProfile,
  onOpenReminderModal,
  onOpenHelpGuide,
  onOpenAdminDashboard,
  onOpenTranslatorModal,
}) => {
  const t = translations[currentLanguage];
  const { user, openAuthModal, isGuest } = useAuth();
  const isFounder = user?.email?.toLowerCase().trim() === 'fotsojunior756@gmail.com';
  const activeLang = getLanguageByCode(currentLanguage || 'fr');

  const professionConfig: Array<{
    id: UserProfile;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
    description: string;
  }> = [
    {
      id: 'eleve',
      label: t.profiles.eleve.name,
      icon: <BookOpen className="w-3.5 h-3.5" />,
      activeClass: 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300 font-black',
      description: t.profiles.eleve.label,
    },
    {
      id: 'etudiant',
      label: t.profiles.etudiant.name,
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      activeClass: 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300 font-black',
      description: t.profiles.etudiant.label,
    },
    {
      id: 'professeur',
      label: t.profiles.professeur.name,
      icon: <Briefcase className="w-3.5 h-3.5" />,
      activeClass: 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-300 font-black',
      description: t.profiles.professeur.label,
    },
    {
      id: 'autre',
      label: t.profiles.autre.name,
      icon: <Compass className="w-3.5 h-3.5" />,
      activeClass: 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-300 font-black',
      description: t.profiles.autre.label,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      {/* Primary Top Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand & Mascot */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 text-white font-extrabold text-lg sm:text-xl shadow-md shadow-emerald-500/20">
            <span>🦉</span>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 bg-clip-text text-transparent">
                KIPO
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                MODE KIPO
              </span>
            </div>
            <p className="hidden xl:block text-[10px] text-slate-500 font-bold leading-none">
              {t.app.tagline}
            </p>
          </div>
        </div>

        {/* Center: Duolingo HUD (Hearts, Gems, Streak, XP) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Hearts Life counter */}
          <div
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-xs font-black shadow-2xs"
            title={`${stats.hearts ?? 5} vies restantes`}
          >
            <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
            <span>{stats.hearts ?? 5}</span>
          </div>

          {/* Gems Lingots */}
          <div
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-black shadow-2xs"
            title={`${stats.gems ?? 50} lingots gemmes`}
          >
            <Gem className="w-3.5 h-3.5 text-cyan-500 fill-cyan-400" />
            <span>{stats.gems ?? 50}</span>
          </div>

          {/* Streak Flame */}
          <div
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-xs font-black shadow-2xs"
            title={`${stats.streakDays} ${t.gamification.streak}`}
          >
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" />
            <span>{stats.streakDays}</span>
          </div>

          {/* XP & Level Pill (on larger screens) */}
          <button
            onClick={onNavigateToProfile}
            className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <span className="text-amber-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {stats.xp} XP
            </span>
            <div className="h-3 w-px bg-slate-300" />
            <span className="text-indigo-700">Niv. {stats.level}</span>
          </button>
        </div>

        {/* Right side controls: Search, Sound, Lang, and Connexion Button */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Quick Search */}
          <button
            onClick={onOpenSearch}
            className="hidden sm:flex p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={t.nav.searchPlaceholder}
            aria-label="Rechercher"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
              isMuted
                ? 'text-slate-400 hover:bg-slate-100'
                : 'text-indigo-600 bg-indigo-50/80 hover:bg-indigo-100'
            }`}
            title={isMuted ? 'Activer le son' : 'Couper le son'}
            aria-label="Son"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* KIPO Reminder button */}
          <button
            onClick={onOpenReminderModal}
            className="p-1.5 sm:p-2 rounded-xl text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-200 shadow-2xs"
            title="Rappels quotidiens KIPO"
            aria-label="Rappels KIPO"
          >
            <Bell className="w-4 h-4 text-amber-600" />
          </button>

          {/* Help Guide button */}
          <button
            onClick={onOpenHelpGuide}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all cursor-pointer border border-indigo-200 shadow-2xs active:scale-95"
            title="Aide & Guide d'utilisation de KIPO"
            aria-label="Aide"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span className="font-bold">{t.nav.help}</span>
          </button>

          {/* Bouton Traduire l'application (Toutes les langues du monde) */}
          <button
            type="button"
            onClick={onOpenTranslatorModal}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-black transition-all cursor-pointer border border-teal-300/80 shadow-2xs active:scale-95 group"
            title="Traduire l'application dans toutes les langues qui existent (130+ langues du monde)"
            aria-label="Traduire l'application"
          >
            <Globe className="w-4 h-4 text-teal-600 group-hover:rotate-45 transition-transform" />
            <span className="text-sm shrink-0 leading-none">{activeLang.flag}</span>
            <span className="hidden sm:inline font-black tracking-tight">{t.nav.translate}</span>
            <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-teal-200/70 text-teal-900">
              {activeLang.code.slice(0, 3)}
            </span>
          </button>

          {/* Connexion / Inscription / User status - ALWAYS explicitly visible with text */}
          {user ? (
            <button
              onClick={onNavigateToProfile}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer border border-emerald-300 shadow-2xs"
              title={`Connecté en tant que ${user.email} - Cliquer pour ouvrir le profil`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-300 animate-pulse" />
              <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="font-bold text-xs truncate max-w-[80px] sm:max-w-[120px]">
                {user.user_metadata?.full_name || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-xs cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                title="Connexion à KIPO"
              >
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>{t.nav.login}</span>
              </button>

              <button
                onClick={() => openAuthModal('signup')}
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer border border-slate-200"
                title="Créer un compte KIPO"
              >
                <UserPlus className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.nav.signup}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profession Selector Bar (Élèves, Étudiants, Professeur) - Explicitly visible on first format / mobile */}
      <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-t border-slate-200 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {/* Label */}
          <div className="flex items-center gap-1.5 shrink-0 text-slate-500 font-black text-[11px] uppercase tracking-wider">
            <span>{t.nav.profession}</span>
          </div>

          {/* 3 Explicit Profession Buttons */}
          <div className="flex items-center gap-1 sm:gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner shrink-0">
            {professionConfig.map((item) => {
              const isActive = currentProfile === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onProfileChange(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-xl text-xs transition-all cursor-pointer active:scale-95 whitespace-nowrap ${
                    isActive
                      ? item.activeClass
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 font-bold'
                  }`}
                  title={`${item.label} : ${item.description}`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="font-black">{item.label}</span>
                  {isActive && (
                    <span className="hidden md:inline-block text-[10px] opacity-90 pl-0.5 font-medium">
                      • {item.description}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Primary Connexion / Mon Compte Button & Founder Shortcut */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={onNavigateToProfile}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Gérer mon compte KIPO & Profil Cloud"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>{t.nav.account}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('signin')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                title="Se connecter ou s'inscrire pour sauvegarder votre travail sur KIPO"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.nav.login}</span>
              </button>
            )}

          </div>
        </div>
      </div>
    </header>
  );
};

