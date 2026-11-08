import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MobileBottomNav, ActiveTab } from './components/MobileBottomNav';
import { ChatView } from './components/ChatView';
import { StudioView } from './components/StudioView';
import { QuizGameView } from './components/QuizGameView';
import { FlashcardView } from './components/FlashcardView';
import { LibraryView } from './components/LibraryView';
import { ProfileView } from './components/ProfileView';
import { DuolingoPathView } from './components/DuolingoPathView';
import { CollaborativeSpacesView } from './components/CollaborativeSpacesView';
import { LevelUpModal } from './components/LevelUpModal';
import { AuthModal } from './components/AuthModal';
import { DuolingoReminderModal } from './components/DuolingoReminderModal';
import { HelpGuideModal } from './components/HelpGuideModal';
import { UniversalTranslatorModal } from './components/UniversalTranslatorModal';
import { AuthReminderBanner } from './components/AuthReminderBanner';
import { AdminDashboardView } from './components/AdminDashboardView';
import { PodcastView } from './components/PodcastView';
import { AnimalGamesView } from './components/AnimalGamesView';
import { AuthProvider, useAuth } from './context/AuthContext';
import { duolingoNotificationService } from './services/duolingoNotificationService';
import { analyticsService } from './services/analyticsService';
import { historyNavigationService } from './services/historyNavigationService';
import { translatorService } from './utils/translatorService';
import {
  UserProfile,
  SupportedLanguage,
  UserStats,
  Quiz,
  FlashcardDeck,
  AnalyzedDocument,
  Badge,
  DuolingoPath,
  SharedDocumentItem,
} from './types';
import { storageService, calculateLevel } from './services/storageService';
import { isScienceContaminated } from './services/curriculumService';
import { apiService } from './services/apiService';
import { soundEffects } from './utils/soundEffects';
import {
  MessageSquare,
  FileText,
  Gamepad2,
  Brain,
  FolderArchive,
  User,
  Search,
  X,
  Sparkles,
  Users,
  Map,
  LogIn,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { translations } from './i18n/translations';

function KipoApp() {
  const { user, openAuthModal } = useAuth();
  const isFounder = user?.email?.toLowerCase().trim() === 'fotsojunior756@gmail.com';

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    try {
      if (window.location.search.includes('admin') || window.location.hash.includes('admin')) {
        return 'admin';
      }
    } catch {}
    return 'duolingo';
  });
  const [subGameTab, setSubGameTab] = useState<'quiz' | 'flashcards'>('quiz');

  // User State
  const [userStats, setUserStats] = useState<UserStats>(() => storageService.getUserStats());
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(userStats.profile || 'eleve');
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(userStats.language || 'fr');
  const [isMuted, setIsMuted] = useState<boolean>(soundEffects.isMuted());

  // Duolingo Path state (Minimum 20 questions)
  const [activeDuolingoPath, setActiveDuolingoPath] = useState<DuolingoPath | undefined>(() => {
    const paths = storageService.getDuolingoPaths();
    return paths.length > 0 ? paths[0] : undefined;
  });

  // Deep linking state across views
  const [presetQuiz, setPresetQuiz] = useState<Quiz | null>(null);
  const [presetDeck, setPresetDeck] = useState<FlashcardDeck | null>(null);
  const [presetSourceContent, setPresetSourceContent] = useState<string | undefined>();
  const [presetSubjectTitle, setPresetSubjectTitle] = useState<string | undefined>();
  const [initialConvId, setInitialConvId] = useState<string | undefined>();

  // Global search modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  // Modals & Help states
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isTranslatorModalOpen, setIsTranslatorModalOpen] = useState(false);
  const [dailyReminderToast, setDailyReminderToast] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [exitToastMessage, setExitToastMessage] = useState<string | null>(null);

  // Initialisation du gestionnaire de bouton retour mobile (Android & Web)
  useEffect(() => {
    historyNavigationService.init((msg) => {
      setExitToastMessage(msg);
      setTimeout(() => setExitToastMessage(null), 2500);
    });

    const handleBackNavigation = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: ActiveTab }>).detail;
      if (detail?.tab) {
        setActiveTab(detail.tab);
      }
    };

    window.addEventListener('kipo_navigate_tab_back', handleBackNavigation);
    return () => {
      window.removeEventListener('kipo_navigate_tab_back', handleBackNavigation);
    };
  }, []);

  // Synchronise le changement d'onglet dans l'historique du téléphone
  useEffect(() => {
    historyNavigationService.onTabChanged(activeTab);

    // Synchronisation en direct de la session active vers la console Supabase de l'administrateur
    if (user?.email) {
      analyticsService.syncSession({
        email: user.email,
        fullName: user.user_metadata?.full_name,
        role: user.user_metadata?.role || currentProfile,
        deviceInfo:
          typeof navigator !== 'undefined'
            ? navigator.userAgent.includes('Mobile')
              ? 'Mobile (Android/iOS)'
              : 'Ordinateur (Desktop)'
            : 'Client Web',
        lastPage: activeTab,
      });
    }
  }, [activeTab, user, currentProfile]);

  // Intercepte le bouton retour pour fermer les modales ouvertes
  useEffect(() => {
    if (!isReminderModalOpen) return;
    return historyNavigationService.registerHandler('reminderModal', 100, () => {
      setIsReminderModalOpen(false);
      return true;
    });
  }, [isReminderModalOpen]);

  useEffect(() => {
    if (!isHelpModalOpen) return;
    return historyNavigationService.registerHandler('helpModal', 100, () => {
      setIsHelpModalOpen(false);
      return true;
    });
  }, [isHelpModalOpen]);

  useEffect(() => {
    if (!isTranslatorModalOpen) return;
    return historyNavigationService.registerHandler('translatorModal', 100, () => {
      setIsTranslatorModalOpen(false);
      return true;
    });
  }, [isTranslatorModalOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    return historyNavigationService.registerHandler('searchModal', 100, () => {
      setIsSearchOpen(false);
      return true;
    });
  }, [isSearchOpen]);

  // Initialisation du traducteur universel
  useEffect(() => {
    translatorService.init();
    if (currentLanguage && currentLanguage !== 'fr') {
      translatorService.applyLanguage(currentLanguage);
    }
  }, []);

  // Track visitor & user activity (Page views, timestamps) for Founder Dashboard
  useEffect(() => {
    analyticsService.setUserEmail(user?.email || null);
    const pageLabel =
      activeTab === 'duolingo'
        ? 'Sentier 100 Questions'
        : activeTab === 'chat'
        ? 'Tuteur IA / Discussion'
        : activeTab === 'studio'
        ? 'Atelier Documents & Synthèse'
        : activeTab === 'collab'
        ? 'Groupes & Espaces Collaboratifs'
        : activeTab === 'library'
        ? 'Bibliothèque & Archives'
        : activeTab === 'profile'
        ? 'Profil Utilisateur'
        : activeTab === 'admin'
        ? 'Tableau de Bord Fondateur'
        : 'Navigation';

    analyticsService.trackPageView(pageLabel);
  }, [activeTab, user?.email]);

  // Background Daily Duolingo Notification Scheduler
  useEffect(() => {
    duolingoNotificationService.initDailyScheduler(
      () => userStats,
      () => currentProfile
    );

    const handleInAppReminder = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; body: string }>;
      if (customEvent.detail) {
        setDailyReminderToast({
          title: customEvent.detail.title,
          body: customEvent.detail.body,
        });
      }
    };

    window.addEventListener('kipo_in_app_daily_reminder', handleInAppReminder);

    // Écoute des clics sur notification Service Worker depuis l'écran d'accueil
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_TAB') {
        const target = event.data.tab === 'duolingo_path' ? 'duolingo' : event.data.tab;
        setActiveTab((target || 'duolingo') as ActiveTab);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      duolingoNotificationService.destroy();
      window.removeEventListener('kipo_in_app_daily_reminder', handleInAppReminder);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [userStats, currentProfile]);

  const [i18nRevision, setI18nRevision] = useState(0);

  // Synchronisation dynamique lors du chargement des données Supabase (connexion/déconnexion)
  useEffect(() => {
    const handleCloudSync = () => {
      const updatedStats = storageService.getUserStats();
      setUserStats(updatedStats);
      setCurrentProfile(updatedStats.profile || 'eleve');
      setCurrentLanguage(updatedStats.language || 'fr');
      const paths = storageService.getDuolingoPaths();
      setActiveDuolingoPath(paths.length > 0 ? paths[0] : undefined);
      setI18nRevision((prev) => prev + 1);
    };

    const handleI18nUpdate = () => {
      setI18nRevision((prev) => prev + 1);
    };

    window.addEventListener('kipo_cloud_data_synced', handleCloudSync);
    window.addEventListener('kipo_i18n_updated', handleI18nUpdate);
    window.addEventListener('kipo_language_changed', handleI18nUpdate);
    return () => {
      window.removeEventListener('kipo_cloud_data_synced', handleCloudSync);
      window.removeEventListener('kipo_i18n_updated', handleI18nUpdate);
      window.removeEventListener('kipo_language_changed', handleI18nUpdate);
    };
  }, []);

  // Level Up Modal
  const [levelUpState, setLevelUpState] = useState<{
    isOpen: boolean;
    level: number;
    title: string;
    badges: Badge[];
  }>({
    isOpen: false,
    level: 1,
    title: '',
    badges: [],
  });

  // Sync profile & language to storage
  const handleProfileChange = (newProfile: UserProfile) => {
    setCurrentProfile(newProfile);
    const updated = { ...userStats, profile: newProfile };
    setUserStats(updated);
    storageService.saveUserStats(updated);
  };

  const handleLanguageChange = async (newLang: SupportedLanguage, newLangName?: string) => {
    setCurrentLanguage(newLang);
    const updated = { ...userStats, language: newLang };
    setUserStats(updated);
    storageService.saveUserStats(updated);
    await translatorService.applyLanguage(newLang, newLangName);
    setI18nRevision((prev) => prev + 1);
  };

  const handleToggleMute = () => {
    const nextMuted = soundEffects.toggleMute();
    setIsMuted(nextMuted);
  };

  // Award XP with celebratory level-up handling
  const handleAwardXp = (amount: number, reason: string) => {
    const result = storageService.awardXp(amount, reason);
    setUserStats(result.newStats);

    if (result.leveledUp || result.unlockedBadges.length > 0) {
      setLevelUpState({
        isOpen: true,
        level: result.newStats.level,
        title: result.newStats.levelTitle,
        badges: result.unlockedBadges,
      });
    }
  };

  const refreshStats = () => {
    setUserStats(storageService.getUserStats());
  };

  // Navigation callbacks
  const handleNavigateToDuolingoPath = async (doc: AnalyzedDocument, userRequest?: string) => {
    // If a specific user request is provided, generate a tailored 20-question path
    if (userRequest && userRequest.trim()) {
      try {
        const sourceContent = `${doc.title}\n\nRÉSUMÉ DU COURS :\n${doc.summary}\n\nNOTIONS ET FORMULES CLÉS :\n${doc.keyConcepts.join('\n')}\n\n${doc.rawTextPreview || ''}`;
        const response = await apiService.generateLearningMaterial({
          sourceText: sourceContent,
          type: 'duolingo_path',
          questionCount: 20,
          subject: doc.title,
          profile: currentProfile,
          language: currentLanguage,
          userRequest: userRequest.trim(),
        });

        const newPath: DuolingoPath = storageService.buildFull100LessonPath({
          id: `path-${Date.now()}`,
          documentId: doc.id,
          title: response.title || `Parcours : ${doc.title}`,
          subject: response.subject || doc.title,
          userRequest: userRequest.trim(),
          createdAt: new Date().toISOString(),
          lessons: response.lessons || [],
        });

        storageService.saveDuolingoPath(newPath);
        setActiveDuolingoPath(newPath);
        setActiveTab('duolingo');
        handleAwardXp(35, `Nouveau sentier KIPO généré pour : ${doc.title}`);
        return;
      } catch (err) {
        console.error('Erreur génération sentier personnalisé:', err);
      }
    }

    const existing = storageService.getDuolingoPathByDocId(doc.id);
    const isBio = doc.title.toLowerCase().includes('photosynth');
    const hasContamination =
      !isBio &&
      existing?.lessons?.some(
        (l) =>
          l.lessonNumber > 4 &&
          (isScienceContaminated(`${l.title} ${l.description}`) ||
            l.questions?.some((q) =>
              isScienceContaminated(`${q.question} ${q.explanation} ${q.options.join(' ')}`)
            ))
      );

    if (existing && existing.lessons && existing.lessons.length === 100 && !hasContamination) {
      setActiveDuolingoPath(existing);
    } else {
      // Build tailored 100-lesson path directly grounded on this document's content
      const docContext = {
        title: doc.title,
        subject: doc.title,
        summary: doc.summary,
        keyConcepts: doc.keyConcepts,
        rawTextPreview: doc.rawTextPreview,
        suggestedQuestions: doc.suggestedQuestions,
      };

      const newPath: DuolingoPath = storageService.buildFull100LessonPath(
        {
          id: existing?.id || `path-${Date.now()}`,
          documentId: doc.id,
          title: existing?.title || `Sentier : ${doc.title}`,
          subject: existing?.subject || doc.title,
          userRequest: userRequest?.trim() || `Sentier complet de 100 leçons extrait de : ${doc.title}`,
          createdAt: existing?.createdAt || new Date().toISOString(),
          lessons: existing?.lessons || [],
        },
        docContext
      );

      storageService.saveDuolingoPath(newPath);
      setActiveDuolingoPath(newPath);
    }
    setActiveTab('duolingo');
  };

  const handleNavigateToQuiz = (sourceContent: string, subjectTitle: string) => {
    setPresetSourceContent(sourceContent);
    setPresetSubjectTitle(subjectTitle);
    setPresetQuiz(null);
    setSubGameTab('quiz');
    setActiveTab('quiz' as any);
  };

  const handleNavigateToFlashcards = (sourceContent: string, subjectTitle: string) => {
    setPresetSourceContent(sourceContent);
    setPresetSubjectTitle(subjectTitle);
    setPresetDeck(null);
    setSubGameTab('flashcards');
    setActiveTab('quiz' as any);
  };

  const handleNavigateToChatWithContext = (contextText: string, contextTitle: string) => {
    setActiveTab('chat');
  };

  const handleOpenConversation = (convId: string) => {
    setInitialConvId(convId);
    setActiveTab('chat');
  };

  const handlePlayQuiz = (quiz: Quiz) => {
    setPresetQuiz(quiz);
    setPresetSourceContent(undefined);
    setSubGameTab('quiz');
    setActiveTab('quiz' as any);
  };

  const handleOpenDeck = (deck: FlashcardDeck) => {
    setPresetDeck(deck);
    setPresetSourceContent(undefined);
    setSubGameTab('flashcards');
    setActiveTab('quiz' as any);
  };

  const handleViewDocument = (doc: AnalyzedDocument) => {
    handleNavigateToDuolingoPath(doc);
  };

  const handleShareToGroup = (doc: AnalyzedDocument) => {
    setActiveTab('collab');
  };

  const handleOpenSharedDocFromGroup = (sharedDoc: SharedDocumentItem) => {
    const doc = storageService.getDocuments().find((d) => d.id === sharedDoc.docId);
    if (doc) {
      handleNavigateToDuolingoPath(doc);
    } else {
      const paths = storageService.getDuolingoPaths();
      setActiveDuolingoPath(paths[0]);
      setActiveTab('duolingo');
    }
  };

  const t = translations[currentLanguage];

  return (
    <div key={`${currentLanguage}-${i18nRevision}`} className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans pb-16 md:pb-0">
      {/* Top Navbar with Duolingo HUD */}
      <Navbar
        stats={userStats}
        currentProfile={currentProfile}
        currentLanguage={currentLanguage}
        onProfileChange={handleProfileChange}
        onLanguageChange={handleLanguageChange}
        onOpenSearch={() => setIsSearchOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onNavigateToProfile={() => setActiveTab('profile')}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
        onOpenHelpGuide={() => setIsHelpModalOpen(true)}
        onOpenAdminDashboard={() => setActiveTab('admin')}
        onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 p-4 border-r border-slate-200/80 bg-white/70 backdrop-blur-xs gap-1 shrink-0">
          <div className="px-3 py-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
            Menu KIPO
          </div>

          {[
            {
              id: 'duolingo' as ActiveTab,
              label: t.nav.duolingo,
              icon: <span className="text-lg">🦉</span>,
              badge: '20Q',
            },
            {
              id: 'chat' as ActiveTab,
              label: t.nav.chat,
              icon: <MessageSquare className="w-4 h-4 text-indigo-600" />,
              badge: 'IA',
            },
            {
              id: 'studio' as ActiveTab,
              label: t.nav.studio,
              icon: <FileText className="w-4 h-4 text-emerald-600" />,
            },
            {
              id: 'podcast' as ActiveTab,
              label: 'Podcasts Audio',
              icon: <Headphones className="w-4 h-4 text-purple-600" />,
              badge: 'AUDIO',
            },
            {
              id: 'collab' as ActiveTab,
              label: t.nav.collab,
              icon: <Users className="w-4 h-4 text-sky-600" />,
              badge: 'GROUPE',
            },
            {
              id: 'games' as ActiveTab,
              label: 'Jeux Animaux',
              icon: <Gamepad2 className="w-4 h-4 text-amber-500" />,
              badge: 'ARCADE',
            },
            {
              id: 'quiz' as any,
              label: 'Quiz & Cartes',
              icon: <Brain className="w-4 h-4 text-violet-500" />,
            },
            {
              id: 'library' as ActiveTab,
              label: t.nav.library,
              icon: <FolderArchive className="w-4 h-4 text-violet-600" />,
            },
            {
              id: 'profile' as ActiveTab,
              label: t.nav.profile,
              icon: <User className="w-4 h-4 text-indigo-500" />,
            },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-white border-b-4 border-emerald-700 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-xl ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-black tracking-wider ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Primary Connexion / Mon Compte Button in Sidebar */}
          {user ? (
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-2xs mt-2 ${
                activeTab === 'profile'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-950 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300'
              }`}
              title="Gérer mon compte KIPO & Profil Cloud"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="truncate max-w-[125px] font-bold">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                  activeTab === 'profile'
                    ? 'bg-white/20 text-white'
                    : 'bg-emerald-200 text-emerald-900'
                }`}
              >
                Cloud
              </span>
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('signin')}
              className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 transition-all cursor-pointer shadow-md mt-2 active:scale-95"
              title="Se connecter ou s'inscrire pour sauvegarder votre progression"
            >
              <div className="flex items-center gap-2.5">
                <LogIn className="w-4 h-4" />
                <span>{t.nav.login}</span>
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/20 text-white">
                Cloud
              </span>
            </button>
          )}


          {/* Help & Explanatory Guide Button in Sidebar */}
          <button
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-indigo-900 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer shadow-2xs mt-1"
            title="Guide d'utilisation et aide KIPO"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">❓</span>
              <span>{t.nav.help}</span>
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-200 text-indigo-900">
              Aide
            </span>
          </button>

          {/* Universal Translator Button in Sidebar */}
          <button
            onClick={() => setIsTranslatorModalOpen(true)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-black text-teal-950 bg-teal-50/90 hover:bg-teal-100 border border-teal-200 transition-all cursor-pointer shadow-2xs mt-1"
            title="Traduire l'application dans toutes les langues existantes (130+ langues du monde)"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">🌐</span>
              <span>{t.nav.translate}</span>
            </div>
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-teal-200 text-teal-900 uppercase">
              130+
            </span>
          </button>

          {/* Duolingo Mascot Mini Widget on sidebar */}
          <div className="mt-auto p-4 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-emerald-900">
              <span className="flex items-center gap-1.5">
                <span>🦉</span>
                <span>Niv. {userStats.level}</span>
              </span>
              <span className="text-amber-600">{userStats.xp} XP</span>
            </div>
            <p className="text-[11px] font-bold text-slate-600">
              « {userStats.levelTitle} »
            </p>
            <div className="w-full bg-emerald-200/50 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    (userStats.xp /
                      calculateLevel(userStats.xp).nextLevelXp) *
                      100
                  )}%`,
                }}
              />
            </div>
          </div>
        </aside>

        {/* Dynamic Center View Container */}
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-4rem)]">
          {/* Top In-App Reminder to sign in or register to store work in Cloud */}
          <AuthReminderBanner language={currentLanguage} />

          {/* TAB 1: DUOLINGO PATH (20 questions minimum per document) */}
          {activeTab === 'duolingo' && (
            <DuolingoPathView
              path={activeDuolingoPath}
              userStats={userStats}
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              onAwardXp={handleAwardXp}
              onStatsUpdated={refreshStats}
              onOpenReminderModal={() => setIsReminderModalOpen(true)}
            />
          )}

          {/* TAB 2: CHAT */}
          {activeTab === 'chat' && (
            <ChatView
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              onAwardXp={handleAwardXp}
              onNavigateToQuiz={handleNavigateToQuiz}
              onNavigateToFlashcards={handleNavigateToFlashcards}
              initialConversationId={initialConvId}
            />
          )}

          {/* TAB 3: STUDIO & DOCUMENTS */}
          {activeTab === 'studio' && (
            <StudioView
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              onAwardXp={handleAwardXp}
              onNavigateToQuiz={handleNavigateToQuiz}
              onNavigateToFlashcards={handleNavigateToFlashcards}
              onNavigateToChatWithContext={handleNavigateToChatWithContext}
              onNavigateToDuolingoPath={handleNavigateToDuolingoPath}
              onNavigateToGames={() => setActiveTab('games')}
              onShareToGroup={handleShareToGroup}
            />
          )}

          {/* TAB: KIPO PODCAST AUDIO STUDIO */}
          {activeTab === 'podcast' && (
            <PodcastView
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              onAwardXp={handleAwardXp}
            />
          )}

          {/* TAB: KIPO ANIMAL ADVENTURE GAMES & MISSIONS */}
          {activeTab === 'games' && (
            <AnimalGamesView
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              onAwardXp={handleAwardXp}
            />
          )}

          {/* TAB 4: COLLABORATIVE LEARNING SPACES */}
          {activeTab === 'collab' && (
            <CollaborativeSpacesView
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              userStats={userStats}
              onAwardXp={handleAwardXp}
              onOpenSharedDoc={handleOpenSharedDocFromGroup}
              onPlayGroupQuiz={(quizId) => {
                const q = storageService.getQuizzes().find((x) => x.id === quizId);
                if (q) handlePlayQuiz(q);
              }}
            />
          )}

          {/* TAB 5: QUIZZES & FLASHCARDS */}
          {activeTab === ('quiz' as any) && (
            <div>
              <div className="max-w-3xl mx-auto px-4 pt-4 flex items-center justify-center">
                <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                  <button
                    onClick={() => setSubGameTab('quiz')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      subGameTab === 'quiz'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Quiz Classique</span>
                  </button>

                  <button
                    onClick={() => setSubGameTab('flashcards')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      subGameTab === 'flashcards'
                        ? 'bg-violet-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Brain className="w-4 h-4" />
                    <span>Cartes Mémoire</span>
                  </button>
                </div>
              </div>

              {subGameTab === 'quiz' ? (
                <QuizGameView
                  currentProfile={currentProfile}
                  currentLanguage={currentLanguage}
                  onAwardXp={handleAwardXp}
                  presetQuiz={presetQuiz}
                  presetSourceContent={presetSourceContent}
                  presetSubjectTitle={presetSubjectTitle}
                />
              ) : (
                <FlashcardView
                  currentProfile={currentProfile}
                  currentLanguage={currentLanguage}
                  onAwardXp={handleAwardXp}
                  presetDeck={presetDeck}
                  presetSourceContent={presetSourceContent}
                  presetSubjectTitle={presetSubjectTitle}
                />
              )}
            </div>
          )}

          {/* TAB 6: LIBRARY */}
          {activeTab === 'library' && (
            <LibraryView
              currentLanguage={currentLanguage}
              onOpenConversation={handleOpenConversation}
              onPlayQuiz={handlePlayQuiz}
              onOpenDeck={handleOpenDeck}
              onViewDocument={handleViewDocument}
              onLaunchDuolingo={handleNavigateToDuolingoPath}
              initialSearchQuery={globalSearchQuery}
            />
          )}

          {/* TAB 7: PROFILE */}
          {activeTab === 'profile' && (
            <ProfileView
              stats={userStats}
              currentProfile={currentProfile}
              currentLanguage={currentLanguage}
              onProfileChange={handleProfileChange}
              onStatsUpdated={refreshStats}
              onOpenAdminDashboard={() => setActiveTab('admin')}
              onOpenTranslatorModal={() => setIsTranslatorModalOpen(true)}
            />
          )}

          {/* TAB 8: FOUNDER & ADMIN AUDIENCE DASHBOARD (fotsojunior756@gmail.com) */}
          {activeTab === 'admin' && isFounder && (
            <AdminDashboardView onBackToApp={() => setActiveTab('duolingo')} />
          )}
        </main>
      </div>

      {/* Android Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        language={currentLanguage}
      />

      {/* Floating Exit Notification Toast for Phone Back Button */}
      {exitToastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-slate-900/90 text-white text-xs font-bold shadow-2xl backdrop-blur-md border border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <span>📱</span>
          <span>{exitToastMessage}</span>
        </div>
      )}

      {/* Global Quick Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Search className="w-4 h-4" />
                <span>Recherche globale KIPO</span>
              </div>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                autoFocus
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setIsSearchOpen(false);
                    setActiveTab('library');
                  }
                }}
                placeholder="Tape ta recherche et appuie sur Entrée..."
                className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden text-slate-800"
              />
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Appuie sur Entrée pour filtrer la bibliothèque</span>
              <button
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveTab('library');
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg cursor-pointer"
              >
                Rechercher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Up & Badge Celebration Modal */}
      <LevelUpModal
        isOpen={levelUpState.isOpen}
        onClose={() => setLevelUpState((prev) => ({ ...prev, isOpen: false }))}
        newLevel={levelUpState.level}
        levelTitle={levelUpState.title}
        unlockedBadges={levelUpState.badges}
        language={currentLanguage}
      />

      {/* Supabase Cloud Authentication Modal */}
      <AuthModal currentProfile={currentProfile} />

      {/* Duolingo Home Screen Reminder & Public Domain Modal */}
      <DuolingoReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        userStats={userStats}
        currentProfile={currentProfile}
      />

      {/* Help & Explanatory Guide Modal */}
      <HelpGuideModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onNavigateToTab={(tab) => {
          setIsHelpModalOpen(false);
          setActiveTab(tab as ActiveTab);
        }}
      />

      {/* Universal Translator Modal (130+ world languages) */}
      <UniversalTranslatorModal
        isOpen={isTranslatorModalOpen}
        onClose={() => setIsTranslatorModalOpen(false)}
        currentLanguage={currentLanguage}
        onSelectLanguage={handleLanguageChange}
      />

      {/* Floating In-App Daily Reminder Toast (Automatique sans consentement) */}
      {dailyReminderToast && (
        <div className="fixed top-20 right-4 z-50 max-w-sm w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 rounded-2xl shadow-2xl border border-emerald-400/40 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0 shadow-inner">
              🦉
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                <span>{dailyReminderToast.title}</span>
                <span className="text-amber-300">★</span>
              </h4>
              <p className="text-[11px] text-emerald-100 mt-0.5 leading-snug">
                {dailyReminderToast.body}
              </p>
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  onClick={() => {
                    setDailyReminderToast(null);
                    setActiveTab('duolingo');
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-950 text-xs font-black transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  S'entraîner 5 min ⚡
                </button>
                <button
                  onClick={() => setDailyReminderToast(null)}
                  className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  Plus tard
                </button>
              </div>
            </div>
            <button
              onClick={() => setDailyReminderToast(null)}
              className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <KipoApp />
    </AuthProvider>
  );
}
