import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  BookOpen,
  MessageSquare,
  FileText,
  Trophy,
  Brain,
  Users,
  Cloud,
  Smartphone,
  Flame,
  Heart,
  Gem,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { HelpVideoPlayer } from './HelpVideoPlayer';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
}) => {
  const [activeSection, setActiveSection] = useState<
    'video' | 'overview' | 'duolingo' | 'chat' | 'studio' | 'quiz' | 'collab' | 'cloud'
  >('video');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'video',
      label: 'Vidéo avec Son 🎥',
      icon: <Video className="w-4 h-4 text-rose-500" />,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
    },
    {
      id: 'overview',
      label: 'Vue d’ensemble',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      id: 'duolingo',
      label: 'Sentier 100Q 🦉',
      icon: <Flame className="w-4 h-4" />,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      id: 'chat',
      label: 'Tuteur IA',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    },
    {
      id: 'studio',
      label: 'Analyse de Cours',
      icon: <FileText className="w-4 h-4" />,
      color: 'text-teal-600 bg-teal-50 border-teal-200',
    },
    {
      id: 'quiz',
      label: 'Quiz & Flashcards',
      icon: <Trophy className="w-4 h-4" />,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
    },
    {
      id: 'collab',
      label: 'Groupes d’Étude',
      icon: <Users className="w-4 h-4" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    {
      id: 'cloud',
      label: 'Compte & Mobile',
      icon: <Cloud className="w-4 h-4" />,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-slate-50 to-indigo-50/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Guide d'utilisation KIPO</span>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Aide
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Tout comprendre pour réviser, progresser et exceller avec l’IA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Fermer le guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar */}
        <div className="p-2 border-b border-slate-100 bg-slate-50/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {sections.map((sec) => {
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed flex-1">
          {/* TAB VIDÉO AVEC SON & DÉMONSTRATION INTERACTIVE */}
          {activeSection === 'video' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🎥</span>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                      <span>Démonstration Vidéo & Explications Vocales</span>
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-black border border-rose-500/30">
                        Son & Voix FR
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-300">
                      Découvrez le fonctionnement de KIPO avec des exemples concrets étape par étape.
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-amber-300 font-mono shrink-0">
                  7 chapitres interactifs
                </div>
              </div>

              <HelpVideoPlayer
                onNavigateToTab={(tab) => {
                  onClose();
                  onNavigateToTab?.(tab);
                }}
              />
            </div>
          )}

          {activeSection === 'overview' && (
            <div className="space-y-4">
              {/* Watch Video Banner from Overview */}
              <button
                type="button"
                onClick={() => setActiveSection('video')}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:opacity-95 text-white flex items-center justify-between gap-3 shadow-md cursor-pointer transition-all active:scale-98 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">
                    ▶️
                  </div>
                  <div>
                    <div className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                      <span>Regarder la Vidéo Interactive avec Son (2 min)</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-white/25 text-[10px] font-bold">
                        Nouveau
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-100">
                      Explication vocale pas à pas avec simulation des fonctionnalités et exemples réels.
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-white text-rose-900 text-xs font-black shrink-0 shadow-xs">
                  Lancer la vidéo
                </span>
              </button>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white space-y-2 shadow-md">
                <span className="text-2xl">🦉</span>
                <h3 className="text-base font-black">Bienvenue sur KIPO !</h3>
                <p className="text-xs sm:text-sm text-emerald-50 leading-relaxed">
                  KIPO est une plateforme éducative intelligente conçue pour les <strong>élèves</strong>, <strong>étudiants</strong> et <strong>professeurs</strong>. Elle combine pédagogie active, répétition espacée, gamification KIPO interactive et intelligence artificielle multimodale.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Progression Gamifiée</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Gagne des points XP, monte de niveau, protège tes 5 cœurs et accumule des gemmes à chaque bonne réponse.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <Cloud className="w-4 h-4 text-indigo-500" />
                    <span>Sauvegarde Cloud Supabase</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Connecte-toi avec ton email pour synchroniser tous tes cours, quiz et progrès sur tous tes appareils.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-900">
                  <strong>Ton compte démarre 100% vierge :</strong> Tu ne trouveras pas d'exemples pré-remplis. Tu commences directement avec tes vrais cours, tes photos et tes propres révisions !
                </p>
              </div>
            </div>
          )}

          {activeSection === 'duolingo' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                <h3 className="text-sm font-black text-amber-950 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>Le Grand Sentier d'Apprentissage (100 leçons)</span>
                </h3>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Chaque cours ou polycopié importé se transforme en un sentier interactif de <strong>100 leçons progressives</strong> réparties en 10 unités thématiques.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Règles du jeu :
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Heart className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Les 5 Vies (Cœurs) :</strong> Une mauvaise réponse te fait perdre 1 cœur. Réponds correctement pour continuer à gravir le sentier !
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Flame className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>La Flamme de Série :</strong> Fais au moins 1 leçon par jour pour augmenter ta série de jours consécutifs.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <Gem className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <strong>Les Gemmes KIPO :</strong> Débloquées en réussissant des leçons parfaites et en accomplissant des défis.
                    </div>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <h5 className="font-bold text-xs text-slate-800">
                  📸 Transformer une photo de cours en sentier :
                </h5>
                <p className="text-xs text-slate-600">
                  Sur le sentier, clique sur <strong>« Photo de cours 📸 »</strong> pour photographier ton cahier ou ton polycopié. L'IA générera instantanément un sentier personnalisé de 100 questions.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'chat' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-1.5">
                <h3 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>Tuteur Pédagogique Intelligent</span>
                </h3>
                <p className="text-xs text-indigo-900">
                  Pose toutes tes questions à l'IA comme à un professeur particulier bienveillant, disponible 24h/24.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Fonctionnalités clés :
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">🎙️</span>
                    <div>
                      <strong>Reconnaissance et synthèse vocale :</strong> Dicte tes questions au micro et écoute les explications de l'IA à voix haute.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">📎</span>
                    <div>
                      <strong>Résolution d'exercices sur photo :</strong> Télécharge la photo d'un énoncé de mathématiques, d'un schéma de SVT ou d'une dissertation pour une aide étape par étape.
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-indigo-600">🎯</span>
                    <div>
                      <strong>Génération en 1 clic :</strong> Après une réponse, clique sur « Créer un Quiz » ou « Créer des Flashcards » pour tester immédiatement ta compréhension.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeSection === 'studio' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1.5">
                <h3 className="text-sm font-black text-teal-950 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Le Studio d’Analyse Multimodale</span>
                </h3>
                <p className="text-xs text-teal-900">
                  Glisse-dépose un fichier PDF ou prends en photo les pages de ton cours.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Ce que KIPO fait pour chaque cours :
                </h4>
                <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-700">
                  <li><strong>Résumé clair & concis</strong> de toutes les notions abordées.</li>
                  <li><strong>Points clés & formules</strong> à mémoriser impérativement.</li>
                  <li><strong>Astuce mnémotechnique KIPO</strong> pour ne plus jamais oublier.</li>
                  <li><strong>Sentier interactif complet</strong> pour réviser de façon ludique.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'quiz' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 space-y-1.5">
                <h3 className="text-sm font-black text-purple-950 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-purple-600" />
                  <span>Quiz Chronométrés & Cartes Mémoire 3D</span>
                </h3>
                <p className="text-xs text-purple-900">
                  Révise avec la méthode de rappel actif, reconnue par les neurosciences comme la plus efficace.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h5 className="font-bold text-xs text-slate-800">⚔️ Mode Boss IA :</h5>
                  <p className="text-xs text-slate-600">
                    Baisse les points de vie du Boss à chaque bonne réponse. Si tu échoues, le Boss contre-attaque !
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h5 className="font-bold text-xs text-slate-800">🃏 Cartes Mémoire 3D :</h5>
                  <p className="text-xs text-slate-600">
                    Retourne la carte en un clic, évalue ta difficulté et gagne de l'XP en maîtrisant les notions.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'collab' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-1.5">
                <h3 className="text-sm font-black text-blue-950 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Espaces Collaboratifs d'Étude</span>
                </h3>
                <p className="text-xs text-blue-900">
                  Révisez ensemble en classe ou entre amis, encadrés par le modérateur IA.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <p>
                  <strong>1. Créer un groupe :</strong> Définis un nom et une matière. KIPO te donne un code secret unique (ex: <code>KIPO-MAT-452</code>).
                </p>
                <p>
                  <strong>2. Partager le code :</strong> Envoie le code à tes camarades pour qu'ils rejoignent l'espace instantanément.
                </p>
                <p>
                  <strong>3. Partager des cours & défier :</strong> Partage tes résumés et lance des quiz collectifs pour voir qui a le meilleur score !
                </p>
              </div>
            </div>
          )}

          {activeSection === 'cloud' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-1.5">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Sauvegarde Cloud & Application Mobile</span>
                </h3>
                <p className="text-xs text-slate-600">
                  Tes données t'appartiennent, sécurisées et accessibles partout.
                </p>
              </div>

              <div className="space-y-2.5 text-xs text-slate-700">
                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <strong>🔐 Connexion Supabase :</strong>
                  <p className="text-slate-600">
                    Clique sur « Connexion » en haut pour créer un compte par email. Tout ce que tu fais est sauvegardé en direct.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                  <strong>📲 Installer sur Smartphone (PWA) :</strong>
                  <p className="text-slate-600">
                    Sur Android ou iPhone, appuie sur le menu de ton navigateur puis « Ajouter à l'écran d'accueil » ou « Installer l'application ». Tu auras KIPO comme une vraie application avec rappels quotidiens !
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <span>🦉 KIPO IA Éducative</span>
            <span>•</span>
            <span>Version 2.0</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
          >
            <span>J'ai compris, c'est parti !</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
