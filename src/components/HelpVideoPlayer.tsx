import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  FastForward,
  SkipForward,
  SkipBack,
  Subtitles,
  ExternalLink,
  Sparkles,
  BookOpen,
  MessageSquare,
  FileText,
  Gamepad2,
  Users,
  Cloud,
} from 'lucide-react';
import { soundEffects } from '../utils/soundEffects';

interface Chapter {
  id: string;
  title: string;
  durationSeconds: number;
  narration: string;
  badge: string;
  tabTarget?: string;
  visualType: 'intro' | 'duolingo' | 'chat' | 'studio' | 'quiz' | 'collab' | 'cloud';
}

const CHAPTERS: Chapter[] = [
  {
    id: 'intro',
    title: '1. Introduction & Présentation de KIPO',
    durationSeconds: 16,
    badge: 'Bienvenue 🦉',
    visualType: 'intro',
    narration:
      "Bienvenue sur KIPO, votre plateforme éducative intelligente tout-en-un ! Que vous soyez élève, étudiant ou professeur, KIPO transforme vos cours en sentiers d'apprentissage progressifs et motivants.",
  },
  {
    id: 'duolingo',
    title: '2. Le Sentier 100 Questions (Mode KIPO)',
    durationSeconds: 20,
    badge: 'Sentier 100Q ⭐',
    tabTarget: 'duolingo',
    visualType: 'duolingo',
    narration:
      "Voici le Sentier 100 Questions. Grâce à la méthode KIPO, vous progressez étape par étape. Vous disposez de cinq vies et gagnez des lingots de gemmes et des points d'XP à chaque bonne réponse. Si vous vous trompez, une explication immédiate vous aide à comprendre.",
  },
  {
    id: 'chat',
    title: '3. Le Tuteur IA & Dictée Vocale',
    durationSeconds: 18,
    badge: 'Tuteur IA 💬',
    tabTarget: 'chat',
    visualType: 'chat',
    narration:
      "Besoin d'aide ? Le Tuteur IA répond à toutes vos questions en direct. Vous pouvez taper votre question ou utiliser le micro pour la dicter à la voix. Le tuteur s'adapte précisément à votre niveau scolaire.",
  },
  {
    id: 'studio',
    title: '4. L\'Atelier Documents & Synthèse',
    durationSeconds: 18,
    badge: 'Atelier Cours 📄',
    tabTarget: 'studio',
    visualType: 'studio',
    narration:
      "Dans l'Atelier Documents, importez vos cours sous forme de PDF, de texte ou de photos. KIPO extrait instantanément les notions clés et génère automatiquement un sentier de révision de 100 questions !",
  },
  {
    id: 'quiz',
    title: '5. Quiz & Cartes Mémoire (Flashcards)',
    durationSeconds: 16,
    badge: 'Entraînement 🎯',
    tabTarget: 'quiz',
    visualType: 'quiz',
    narration:
      "Passez des quiz rapides pour tester vos réflexes, ou révisez avec les cartes mémoire interactives selon le principe de la répétition espacée pour retenir durablement pour vos examens.",
  },
  {
    id: 'collab',
    title: '6. Espaces Collaboratifs & Groupes d\'Étude',
    durationSeconds: 16,
    badge: 'Groupes 👥',
    tabTarget: 'collab',
    visualType: 'collab',
    narration:
      "Créez ou rejoignez un groupe d'étude avec un code d'invitation. Partagez vos fiches de cours, défiez vos camarades sur des quiz en équipe et échangez sur le chat collaboratif.",
  },
  {
    id: 'cloud',
    title: '7. Sauvegarde Cloud & Accès Mobile',
    durationSeconds: 16,
    badge: 'Cloud & PWA 📱',
    visualType: 'cloud',
    narration:
      "Enfin, cliquez sur Connexion pour sauvegarder votre progression dans le Cloud. Vous pouvez installer KIPO sur votre smartphone Android ou iPhone comme une vraie application mobile sans passer par un store !",
  },
];

interface HelpVideoPlayerProps {
  onNavigateToTab?: (tab: string) => void;
  onClose?: () => void;
}

export const HelpVideoPlayer: React.FC<HelpVideoPlayerProps> = ({
  onNavigateToTab,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showCaptions, setShowCaptions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [animatedStep, setAnimatedStep] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const totalDuration = CHAPTERS.reduce((acc, c) => acc + c.durationSeconds, 0);

  // Calculate elapsed time based on chapter and current progress
  const currentChapter = CHAPTERS[currentChapterIdx];

  const getChapterStartTime = (idx: number) => {
    return CHAPTERS.slice(0, idx).reduce((acc, c) => acc + c.durationSeconds, 0);
  };

  const currentChapterStartTime = getChapterStartTime(currentChapterIdx);
  const currentChapterProgress = Math.max(0, currentTime - currentChapterStartTime);

  // Play spoken narration for the given chapter using Web Speech API
  const speakChapterNarration = (narrationText: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    if (isVoiceMuted) return;

    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = 'fr-FR';
    utterance.rate = playbackSpeed * 1.02; // natural pace
    utterance.pitch = 1.05; // warm, encouraging educational voice

    // Attempt to pick a French voice
    const voices = window.speechSynthesis.getVoices();
    const frVoice = voices.find(
      (v) => v.lang.startsWith('fr') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Amélie') || v.name.includes('Thomas'))
    ) || voices.find((v) => v.lang.startsWith('fr'));

    if (frVoice) {
      utterance.voice = frVoice;
    }

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Main playback timer loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.25 * playbackSpeed;
          if (next >= totalDuration) {
            setIsPlaying(false);
            window.speechSynthesis?.cancel();
            return totalDuration;
          }

          // Check if we advanced to the next chapter
          let accumulated = 0;
          for (let i = 0; i < CHAPTERS.length; i++) {
            accumulated += CHAPTERS[i].durationSeconds;
            if (next < accumulated) {
              if (i !== currentChapterIdx) {
                setCurrentChapterIdx(i);
                // Trigger sound effect and speech for new chapter
                soundEffects.playCorrect();
                speakChapterNarration(CHAPTERS[i].narration);
              }
              break;
            }
          }

          return next;
        });
      }, 250);
    } else {
      window.speechSynthesis?.cancel();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, playbackSpeed, currentChapterIdx, totalDuration, isVoiceMuted]);

  // Periodic visual animation step inside each chapter (animates questions, clicks, badges)
  useEffect(() => {
    if (!isPlaying) return;
    const animInterval = setInterval(() => {
      setAnimatedStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(animInterval);
  }, [isPlaying]);

  // Handle Play / Pause toggle
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      window.speechSynthesis?.cancel();
    } else {
      if (currentTime >= totalDuration) {
        setCurrentTime(0);
        setCurrentChapterIdx(0);
      }
      setIsPlaying(true);
      soundEffects.playClick();
      speakChapterNarration(CHAPTERS[currentChapterIdx].narration);
    }
  };

  // Jump to specific chapter
  const handleSelectChapter = (idx: number) => {
    const startTime = getChapterStartTime(idx);
    setCurrentChapterIdx(idx);
    setCurrentTime(startTime);
    soundEffects.playClick();
    if (isPlaying) {
      speakChapterNarration(CHAPTERS[idx].narration);
    }
  };

  // Seek bar click
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const targetTime = pos * totalDuration;
    setCurrentTime(targetTime);

    let accumulated = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      accumulated += CHAPTERS[i].durationSeconds;
      if (targetTime <= accumulated) {
        setCurrentChapterIdx(i);
        if (isPlaying) {
          speakChapterNarration(CHAPTERS[i].narration);
        }
        break;
      }
    }
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Clean speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white select-none transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* Top Video Header Bar */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-2.5 flex items-center justify-between border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            {isPlaying && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isPlaying ? 'bg-emerald-500' : 'bg-slate-500'
              }`}
            />
          </span>
          <span className="font-black text-slate-200">
            Démonstration Vidéo Interactive • KIPO
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
            {currentChapter.badge}
          </span>
        </div>

        {/* Voice status pill */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="hidden sm:inline">
            {isVoiceMuted ? 'Voix coupée' : 'Son & Voix FR active'}
          </span>
          <button
            onClick={() => {
              const nextMuted = !isVoiceMuted;
              setIsVoiceMuted(nextMuted);
              if (nextMuted) {
                window.speechSynthesis?.cancel();
              } else if (isPlaying) {
                speakChapterNarration(currentChapter.narration);
              }
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isVoiceMuted
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
            }`}
            title={isVoiceMuted ? 'Activer la voix' : 'Couper la voix'}
          >
            {isVoiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Video Screen Viewport (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-4 sm:p-8 overflow-hidden group">
        {/* Decorative Grid and Glowing Orbs in background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.15),transparent_60%)] pointer-events-none" />
        <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Center Dynamic Video Stage */}
        <div className="relative z-10 w-full max-w-xl flex flex-col items-center justify-center text-center space-y-4">
          {/* SCENE 1: INTRO */}
          {currentChapter.visualType === 'intro' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-5xl shadow-2xl shadow-emerald-500/40 ring-4 ring-white/10 animate-bounce">
                  🦉
                </div>
                <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-md">
                  IA
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Bienvenue sur <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">KIPO</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md font-medium">
                La plateforme éducative tout-en-un avec tuteur intelligent, sentier gamifié et analyse de documents.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-emerald-300 text-xs font-bold border border-white/10">
                  🎒 Élève
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-indigo-300 text-xs font-bold border border-white/10">
                  🎓 Étudiant
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-amber-300 text-xs font-bold border border-white/10">
                  💼 Professeur
                </span>
              </div>
            </div>
          )}

          {/* SCENE 2: DUOLINGO 100Q PATH */}
          {currentChapter.visualType === 'duolingo' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full space-y-3">
              {/* HUD Bar mockup */}
              <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-2xl border border-white/15 text-xs font-black">
                <span className="flex items-center gap-1 text-rose-400">
                  ❤️ <span>5 vies</span>
                </span>
                <span className="flex items-center gap-1 text-cyan-400">
                  💎 <span>40 lingots</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  🔥 <span>3 jours</span>
                </span>
                <span className="flex items-center gap-1 text-emerald-400">
                  ⭐ <span>285 XP</span>
                </span>
              </div>

              {/* Quiz question card simulated */}
              <div className="bg-white text-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-400 text-left space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                  <span>LEÇON 4 / 100 • SVT & BIOLOGIE</span>
                  <span className="text-emerald-600 font-black">+25 XP</span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  Où se déroule la photosynthèse chez les cellules végétales ?
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                    A) Dans la vacuole
                  </div>
                  <div
                    className={`p-2.5 rounded-xl border transition-all ${
                      animatedStep >= 1
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-400 font-black'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    B) Dans le chloroplaste ✓
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                    C) Dans l'appareil de Golgi
                  </div>
                  <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600">
                    D) Dans le ribosome
                  </div>
                </div>

                {animatedStep >= 2 && (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-950 text-xs font-black flex items-center justify-between animate-in slide-in-from-bottom-2">
                    <span>🎉 Bravo ! Réponse exacte (+25 XP)</span>
                    <span>⭐⭐⭐</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCENE 3: TUTEUR IA CHAT */}
          {currentChapter.visualType === 'chat' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full space-y-2 text-left text-xs">
              {/* User question balloon */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2.5 max-w-sm shadow-md font-bold">
                  <p>« Peux-tu m'expliquer la mitose simplement avec une métaphore ? »</p>
                  <span className="text-[10px] text-indigo-200 block text-right mt-1">
                    🎤 Dicté à la voix • 14:32
                  </span>
                </div>
              </div>

              {/* AI assistant balloon */}
              <div className="flex items-start gap-2 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                  🦉
                </div>
                <div className="bg-white text-slate-900 rounded-2xl rounded-tl-xs p-3.5 shadow-md border border-slate-200 space-y-1.5 font-medium leading-relaxed">
                  <p className="font-bold text-indigo-900">
                    Bien sûr ! Imagine une recette de cuisine que tu photocopies en 2 exemplaires parfaits :
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    La mitose est la division d'une cellule mère en 2 cellules filles génétiquement identiques (2n). Elle comprend 4 étapes : Prophase, Métaphase, Anaphase et Télophase.
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    🔊 Synthèse vocale disponible
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 4: STUDIO ATELIER DOCUMENTS */}
          {currentChapter.visualType === 'studio' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full space-y-3">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center mx-auto text-xl border border-teal-500/30">
                  📄
                </div>
                <h4 className="text-sm font-black text-white">
                  Importation d'un polycopié de cours (PDF ou Photo)
                </h4>
                <p className="text-xs text-slate-300">
                  KIPO extrait la structure, le résumé et génère 100 questions progressives.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-md flex items-center gap-1">
                    ⚡ Générer le Sentier 100Q
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md flex items-center gap-1">
                    🎴 Créer 20 Flashcards
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 5: QUIZ & FLASHCARDS */}
          {currentChapter.visualType === 'quiz' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full flex items-center justify-center">
              <div className="w-72 bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-5 rounded-3xl shadow-2xl border-2 border-white/20 text-center space-y-3 animate-pulse">
                <span className="text-2xl">🧠</span>
                <div className="text-[10px] font-black uppercase tracking-wider text-violet-200">
                  Répétition Espacée • Boîte 2
                </div>
                <h4 className="text-base font-black">
                  « Quelle est la formule de l'énergie cinétique ? »
                </h4>
                <div className="p-2 rounded-xl bg-white/20 text-xs font-black text-amber-200 border border-white/20">
                  Ec = ½ · m · v²
                </div>
                <div className="flex justify-center gap-2 pt-1 text-[11px] font-bold">
                  <span className="px-2 py-0.5 rounded-lg bg-rose-500/40 text-rose-200">
                    À revoir
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/40 text-emerald-200">
                    Maîtrisé ✓
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 6: GROUPES COLLABORATIFS */}
          {currentChapter.visualType === 'collab' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full space-y-2 text-left">
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between text-sky-400 font-bold">
                  <span className="flex items-center gap-1.5 font-black text-sm text-white">
                    👥 Groupe : Terminale Spé SVT
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-[10px] border border-sky-500/30">
                    Code : SVT-2026
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">
                  5 membres connectés • Documents partagés • Défi Quiz lancé par Thomas
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-slate-900">
                      S
                    </div>
                    <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-slate-900">
                      T
                    </div>
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] ring-2 ring-slate-900">
                      M
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Discussions et entraide en temps réel
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SCENE 7: CLOUD & MOBILE */}
          {currentChapter.visualType === 'cloud' && (
            <div className="animate-in fade-in zoom-in-95 duration-500 w-full space-y-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 text-white flex items-center justify-center text-3xl mx-auto shadow-xl">
                📱
              </div>
              <h3 className="text-lg font-black text-white">
                Synchronisation Cloud & Installation Mobile
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Vos cours, vos notes et votre XP sont sauvegardés en toute sécurité. Fonctionne hors-ligne et s'ajoute sur votre écran d'accueil Android ou iOS.
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                <span>PWA • 100% Gratuit & Réactif</span>
              </div>
            </div>
          )}

          {/* Central Play/Pause Overlay Button if paused */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer transform hover:scale-110 active:scale-95 ring-4 ring-white/20"
              title="Lancer la vidéo avec son"
              aria-label="Lire la vidéo"
            >
              <Play className="w-7 h-7 sm:w-9 sm:h-9 fill-white translate-x-0.5" />
            </button>
          )}
        </div>

        {/* Live Subtitles Banner (Sous-titres dynamiques) */}
        {showCaptions && (
          <div className="absolute bottom-2 left-4 right-4 z-20 pointer-events-none">
            <div className="bg-black/85 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-center text-xs sm:text-sm font-bold text-amber-200 leading-snug shadow-xl">
              <span className="text-white/60 mr-1.5">🎙️</span>
              « {currentChapter.narration} »
            </div>
          </div>
        )}
      </div>

      {/* Video Scrubber & Playback Controls Bar */}
      <div className="bg-slate-900 px-4 py-3 border-t border-slate-800 space-y-2">
        {/* Clickable Progress Bar */}
        <div
          onClick={handleSeek}
          className="relative w-full h-2 bg-slate-800 hover:h-3 rounded-full cursor-pointer transition-all overflow-hidden group/bar"
          title="Avancer ou reculer dans la vidéo"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 transition-all rounded-full relative"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/bar:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Bottom Buttons Bar */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* Left Controls: Play/Pause, Rewind, Forward, Time */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer shadow-xs active:scale-95"
              title={isPlaying ? 'Pause' : 'Lire'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <button
              onClick={() => {
                const prevIdx = Math.max(0, currentChapterIdx - 1);
                handleSelectChapter(prevIdx);
              }}
              disabled={currentChapterIdx === 0}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Chapitre précédent"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                const nextIdx = Math.min(CHAPTERS.length - 1, currentChapterIdx + 1);
                handleSelectChapter(nextIdx);
              }}
              disabled={currentChapterIdx === CHAPTERS.length - 1}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Chapitre suivant"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setCurrentTime(0);
                setCurrentChapterIdx(0);
                if (isPlaying) speakChapterNarration(CHAPTERS[0].narration);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Recommencer depuis le début"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Time display */}
            <div className="font-mono text-slate-400 text-[11px] pl-1">
              <span className="text-white font-bold">{formatTime(currentTime)}</span> /{' '}
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>

          {/* Right Controls: Speed, Captions, Direct CTA, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Direct Try CTA Button if chapter has a tab target */}
            {currentChapter.tabTarget && onNavigateToTab && (
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setIsPlaying(false);
                  onNavigateToTab(currentChapter.tabTarget!);
                }}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                title="Tester cette fonctionnalité directement dans l'application"
              >
                <span>Tester maintenant</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}

            {/* Speed toggle */}
            <button
              onClick={() => {
                const nextSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
                setPlaybackSpeed(nextSpeed);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono cursor-pointer"
              title="Vitesse de lecture"
            >
              {playbackSpeed}x
            </button>

            {/* Captions toggle */}
            <button
              onClick={() => setShowCaptions(!showCaptions)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                showCaptions ? 'text-emerald-400 bg-emerald-500/20' : 'text-slate-500'
              }`}
              title="Sous-titres"
            >
              <Subtitles className="w-4 h-4" />
            </button>

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title={isFullscreen ? 'Quitter plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Chapters Navigation List */}
      <div className="bg-slate-950 p-3 sm:p-4 border-t border-slate-900">
        <div className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
          <span>Chapitres & Démonstrations en direct ({CHAPTERS.length})</span>
          <span className="text-slate-500 text-[10px]">Cliquez sur un chapitre pour y accéder</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {CHAPTERS.map((chap, idx) => {
            const isCurrent = idx === currentChapterIdx;
            return (
              <button
                key={chap.id}
                onClick={() => handleSelectChapter(idx)}
                className={`p-2.5 rounded-xl text-left transition-all cursor-pointer flex items-start gap-2 border ${
                  isCurrent
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-white shadow-xs'
                    : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                    isCurrent ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs truncate">{chap.title.replace(/^\d+\.\s*/, '')}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {formatTime(chap.durationSeconds)} • {chap.badge}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
