import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Sparkles,
  Trophy,
  Heart,
  Flame,
  Star,
  Zap,
  Volume2,
  VolumeX,
  Upload,
  Play,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Camera,
  FileUp,
  Award,
  Swords,
  Timer,
  ChevronRight,
  Shield,
  Trash2,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import {
  AnimalHero,
  AnimalCharacterId,
  AnimalAdventureGame,
  GameMission,
  GameMissionTask,
  SupportedLanguage,
  UserProfile,
} from '../types';
import {
  ANIMAL_HEROES,
  PRESET_ANIMAL_GAMES,
  gameService,
  ensureMissionHas5Tasks,
} from '../services/gameService';
import { gameAudioService } from '../services/gameAudioService';

interface AnimalGamesViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
}

type GameViewMode = 'HUB' | 'CREATOR' | 'MAP' | 'PLAYING';

const ANIMAL_SPECIFIC_PRAISE: Record<string, string[]> = {
  chien: [
    'Wouf wouf ! Oh le génie, tu as du flair !',
    'Wouf ! Tu es super fort mon ami, respect total !',
    'Ouaf ! Quelle fidélité au savoir, tu es un vrai champion !',
  ],
  chat: [
    'Miaou ! Coup de griffe parfait, quel génie félin !',
    'Ronron... Trop fort, tes réflexes sont affûtés comme des griffes !',
    'Miaou ! Tu as bondi direct sur la bonne réponse mon pote !',
  ],
  hibou: [
    'Hou-hou ! La grande sagesse est avec toi, quel génie !',
    'Hou-hou ! Tu es super fort mon ami, le savoir illumine tout !',
    'Hou-hou ! Une analyse magistrale, digne des plus grands savants !',
  ],
  souris: [
    'Iiiik ! Oh le génie, rien ne t’échappe petit champion !',
    'Iiiik ! Tu es super fort mon ami, plus vif qu’un éclair !',
    'Hihi ! Tu as déniché la vérité comme un trésor doré !',
  ],
  renard: [
    'Yip yip ! Rusé comme un renard, quel génie !',
    'Yip ! Tu es super fort mon ami, ta tactique est imparable !',
    'Yip yip ! Tu as déjoué tous les pièges avec brio !',
  ],
};

const ANIMAL_SPECIFIC_ROAST: Record<string, string[]> = {
  chien: [
    'Grrr... Wouf ! Oh le looseur, rentre dans tes cahiers et révise !',
    'Wouf aïe aïe ! Olala... je croyais que tu avais plus de flair que ça !',
    'Wouf ! Même moi avec mes pattes je savais ça, retourne bosser !',
  ],
  chat: [
    'Miaou ! Oh le looseur, tu as glissé sur la mauvaise branche, rentre dans tes cahiers !',
    'Feule... Olala je croyais que tu étais plus fort que ça, réveille-toi !',
    'Miaou ! Qu’est-ce que tu m’as fait là ? Même un chaton aurait trouvé !',
  ],
  hibou: [
    'Hou-hou... Oh le looseur, ouvre grand tes yeux et rentre dans tes cahiers !',
    'Hou-hou ! Olala... je croyais que tu étais plus sage et fort que ça !',
    'Hou-hou ! Aïe aïe aïe, retourne réviser tout de suite mon ami !',
  ],
  souris: [
    'Iiiik ! Oh le looseur, tu es tombé direct dans le piège, rentre dans tes cahiers !',
    'Iiiik ! Olala... je croyais que tu étais plus fort que ça, ouille !',
    'Iiiik ! Tu dors ou quoi ? Même une petite souris sait ça !',
  ],
  renard: [
    'Yip ! Oh le looseur, tu t’es fait piéger bêtement, rentre dans tes cahiers !',
    'Yip yip... Olala je croyais que tu étais plus rusé et fort que ça !',
    'Yip ! Qu’est-ce que c’est que cette réponse ? Revois ta stratégie !',
  ],
};

const PRAISE_PHRASES = [
  'Oh le génie !',
  'Tu es super fort mon ami !',
  'Incroyable talent !',
  'Trop fort, quelle intelligence !',
  'C’est ça la puissance de KIPO !',
  'Respect total champion !',
  'Une vraie machine de guerre du savoir !',
];

const ROAST_PHRASES = [
  'Oh le looseur, rentre dans tes cahiers !',
  'Olala... je croyais que tu étais plus fort que ça !',
  'Aïe aïe aïe, retourne réviser tout de suite !',
  'Qu’est-ce que tu m’as fait là ? Même moi qui suis un animal je savais !',
  'Révise tes cours mon pote, c’est pas sérieux !',
  'Tu dors ou quoi ? Ouvre ton cahier !',
];

export const AnimalGamesView: React.FC<AnimalGamesViewProps> = ({
  currentProfile,
  currentLanguage,
  onAwardXp,
}) => {
  // Navigation & Game State
  const [viewMode, setViewMode] = useState<GameViewMode>('HUB');
  const [gamesList, setGamesList] = useState<AnimalAdventureGame[]>(() => gameService.getGames());
  const [selectedGame, setSelectedGame] = useState<AnimalAdventureGame | null>(null);
  const [selectedCompanion, setSelectedCompanion] = useState<AnimalCharacterId>('hibou');
  const [selectedChapterIndex, setSelectedChapterIndex] = useState<number>(0); // 0 = 1-10, 1 = 11-20, ...
  const [activeMission, setActiveMission] = useState<GameMission | null>(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number>(0);

  // Gameplay Live State
  const [hearts, setHearts] = useState<number>(5);
  const [score, setScore] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState<number>(0);
  const [bossHp, setBossHp] = useState<number>(1000);
  const [bossMaxHp, setBossMaxHp] = useState<number>(1000);
  const [floatingDamage, setFloatingDamage] = useState<string | null>(null);
  const [isBossDamaged, setIsBossDamaged] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState<boolean>(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(false);
  const [powerUpUsed, setPowerUpUsed] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [isTimerFrozen, setIsTimerFrozen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoReadVoice, setAutoReadVoice] = useState<boolean>(true);
  const [missionCompleteModal, setMissionCompleteModal] = useState<boolean>(false);
  const [missionFailedModal, setMissionFailedModal] = useState<boolean>(false);
  const [missionStarsEarned, setMissionStarsEarned] = useState<number>(3);
  const [gameCompleteModal, setGameCompleteModal] = useState<boolean>(false);

  // Animal Talking & Fullscreen Overlays (3s animations)
  const [animalSpeech, setAnimalSpeech] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [showCelebrationFlowers, setShowCelebrationFlowers] = useState<boolean>(false);
  const [showTomatoSplat, setShowTomatoSplat] = useState<boolean>(false);

  // AI Creator State
  const [promptText, setPromptText] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; mimeType: string; data: string; type: string; previewUrl?: string }>
  >([]);
  const [selectedUniverse, setSelectedUniverse] = useState<'foret' | 'temple' | 'espace' | 'royaume'>('foret');
  const [selectedLevel, setSelectedLevel] = useState<string>('college');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load games from service
  useEffect(() => {
    refreshGames();
  }, []);

  const refreshGames = () => {
    const list = gameService.getGames();
    setGamesList(list);
  };

  // Timer loop for active question: 60s for easy, 120s for difficult
  useEffect(() => {
    if (viewMode === 'PLAYING' && !isAnswerSubmitted && !missionCompleteModal && !missionFailedModal && !isTimerFrozen) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current as any);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, currentTaskIndex, isAnswerSubmitted, missionCompleteModal, missionFailedModal, isTimerFrozen]);

  // Audio Voice: Read Question and Options Aloud when a new task begins
  useEffect(() => {
    if (viewMode === 'PLAYING' && activeMission && !isAnswerSubmitted && autoReadVoice && !isMuted) {
      const currentTask = activeMission.tasks[currentTaskIndex];
      if (currentTask) {
        // Small delay to let UI mount smoothly
        const timer = setTimeout(() => {
          gameAudioService.readQuestionAndOptions(
            currentTask.prompt,
            currentTask.options,
            selectedCompanion
          );
        }, 350);
        return () => {
          clearTimeout(timer);
          gameAudioService.stopSpeaking();
        };
      }
    } else {
      gameAudioService.stopSpeaking();
    }
  }, [viewMode, activeMission, currentTaskIndex, autoReadVoice, isMuted, selectedCompanion]);

  // When time expires: counts as wrong answer + roast + tomatoes
  const handleTimeExpired = () => {
    gameAudioService.stopSpeaking();
    setIsAnswerSubmitted(true);
    setComboStreak(0);
    if (!isShieldActive) {
      setHearts((h) => Math.max(0, h - 1));
    } else {
      setIsShieldActive(false);
    }

    const animalRoasts = ANIMAL_SPECIFIC_ROAST[selectedCompanion] || ROAST_PHRASES;
    const phrase = animalRoasts[Math.floor(Math.random() * animalRoasts.length)];
    setAnimalSpeech({ text: phrase, isCorrect: false });
    gameAudioService.speakAnimalVoice(phrase, selectedCompanion, true);

    setShowTomatoSplat(true);
    gameAudioService.playTomatoSplat();
    setTimeout(() => {
      setShowTomatoSplat(false);
    }, 3000);
  };

  const handleSelectGame = (game: AnimalAdventureGame) => {
    setSelectedGame(game);
    setSelectedCompanion(game.leadAnimalId || 'hibou');
    setSelectedChapterIndex(0);
    setViewMode('MAP');
  };

  const handleStartMission = (mission: GameMission) => {
    gameAudioService.stopSpeaking();
    const safeMission = ensureMissionHas5Tasks(mission, mission.order || 1, selectedGame?.subject || 'Savoirs');
    setActiveMission(safeMission);
    setCurrentTaskIndex(0);
    setHearts(5);
    setScore(0);
    setComboStreak(0);
    setCorrectAnswersCount(0);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setDisabledOptions([]);
    setIsShieldActive(false);
    setPowerUpUsed(false);
    setFloatingDamage(null);
    setMissionCompleteModal(false);
    setMissionFailedModal(false);
    setAnimalSpeech(null);
    setShowCelebrationFlowers(false);
    setShowTomatoSplat(false);

    const task = safeMission.tasks[0];
    const initialTime = task?.timeLimitSeconds || (task?.difficulty === 'difficile' ? 120 : 60);
    setTimeLeft(initialTime);

    if (safeMission.boss) {
      setBossHp(safeMission.boss.maxHp);
      setBossMaxHp(safeMission.boss.maxHp);
    }

    setViewMode('PLAYING');
  };

  // Trigger special power
  const handleUsePowerUp = () => {
    if (powerUpUsed || !activeMission) return;
    const currentTask = activeMission.tasks[currentTaskIndex];
    if (!currentTask) return;

    const hero = ANIMAL_HEROES[selectedCompanion];
    setPowerUpUsed(true);
    gameAudioService.playPowerUp();

    if (hero.specialPower.effect === 'fifty_fifty') {
      const wrongIndices = currentTask.options
        .map((_, i) => i)
        .filter((i) => i !== currentTask.correctIndex);
      const shuffled = [...wrongIndices].sort(() => 0.5 - Math.random());
      const toEliminate = shuffled.slice(0, 2);
      setDisabledOptions(toEliminate);
    } else if (hero.specialPower.effect === 'shield') {
      setIsShieldActive(true);
    } else if (hero.specialPower.effect === 'freeze_time') {
      setIsTimerFrozen(true);
      setTimeout(() => {
        setIsTimerFrozen(false);
      }, 15000);
    } else if (hero.specialPower.effect === 'double_xp') {
      setComboStreak((s) => Math.max(s, 2));
    }
  };

  // Submit Answer
  const handleSelectAnswer = (optionIndex: number) => {
    if (isAnswerSubmitted || disabledOptions.includes(optionIndex) || !activeMission) return;

    if (timerRef.current) clearInterval(timerRef.current);
    gameAudioService.stopSpeaking();

    setSelectedOption(optionIndex);
    setIsAnswerSubmitted(true);

    const currentTask = activeMission.tasks[currentTaskIndex];
    const isCorrect = optionIndex === currentTask.correctIndex;

    if (isCorrect) {
      gameAudioService.playCorrect();
      setCorrectAnswersCount((c) => c + 1);
      const newStreak = comboStreak + 1;
      setComboStreak(newStreak);

      const multiplier = newStreak >= 3 ? 2 : 1;
      const pts = (currentTask.points || 150) * multiplier;
      setScore((s) => s + pts);

      // 1. Animal speaks out loud with praising phrase + characteristic cry
      const animalPraises = ANIMAL_SPECIFIC_PRAISE[selectedCompanion] || PRAISE_PHRASES;
      const phrase = animalPraises[Math.floor(Math.random() * animalPraises.length)];
      setAnimalSpeech({ text: phrase, isCorrect: true });
      gameAudioService.speakAnimalVoice(phrase, selectedCompanion, true);

      // 2. Fullscreen celebration with Flowers & Hearts for 3 seconds
      setShowCelebrationFlowers(true);
      gameAudioService.playFlowerCelebration();
      setTimeout(() => {
        setShowCelebrationFlowers(false);
      }, 3000);

      // Boss damage animation if boss battle
      if (activeMission.type === 'boss_fight') {
        const damage = Math.round(bossMaxHp / activeMission.tasks.length) + 50;
        gameAudioService.playAttack();
        setTimeout(() => {
          gameAudioService.playBossHit();
          setIsBossDamaged(true);
          setFloatingDamage(`-${damage} PV !`);
          setBossHp((hp) => Math.max(0, hp - damage));
          setTimeout(() => {
            setIsBossDamaged(false);
            setFloatingDamage(null);
          }, 800);
        }, 200);
      }
    } else {
      gameAudioService.playWrong();
      setComboStreak(0);
      if (isShieldActive) {
        setIsShieldActive(false); // Shield absorbed the error
      } else {
        setHearts((h) => Math.max(0, h - 1));
      }

      // 1. Animal speaks out loud with roasting phrase + characteristic cry
      const animalRoasts = ANIMAL_SPECIFIC_ROAST[selectedCompanion] || ROAST_PHRASES;
      const phrase = animalRoasts[Math.floor(Math.random() * animalRoasts.length)];
      setAnimalSpeech({ text: phrase, isCorrect: false });
      gameAudioService.speakAnimalVoice(phrase, selectedCompanion, true);

      // 2. Fullscreen tomatoes splatting on screen for 3 seconds
      setShowTomatoSplat(true);
      gameAudioService.playTomatoSplat();
      setTimeout(() => {
        setShowTomatoSplat(false);
      }, 3000);
    }
  };

  // Next Question or Complete Mission
  const handleNextTask = () => {
    if (!activeMission) return;
    gameAudioService.stopSpeaking();

    if (currentTaskIndex + 1 < activeMission.tasks.length) {
      const nextIdx = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIdx);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
      setDisabledOptions([]);
      setAnimalSpeech(null);

      const nextTask = activeMission.tasks[nextIdx];
      const nextTime = nextTask?.timeLimitSeconds || (nextTask?.difficulty === 'difficile' ? 120 : 60);
      setTimeLeft(nextTime);
    } else {
      // 5-Question Mission Finished!
      // Evaluation rule: User MUST have at least 3 correct answers out of 5 (missed <= 2)
      const finalCorrect = correctAnswersCount;
      const isPassed = finalCorrect >= 3;

      if (isPassed) {
        let stars = 1;
        if (finalCorrect === 5) stars = 3;
        else if (finalCorrect === 4) stars = 2;

        setMissionStarsEarned(stars);
        setMissionCompleteModal(true);
        gameAudioService.playFanfare();

        if (selectedGame) {
          gameService.saveMissionResult(selectedGame.id, activeMission.id, stars, score, finalCorrect);
          onAwardXp(Math.max(100, score / 2), `Mission validée : ${activeMission.title}`);
        }
      } else {
        // Failed: missed more than 2 questions (obtained < 3 / 5)
        // Next mission MUST NOT BE UNLOCKED!
        setMissionFailedModal(true);
        gameAudioService.playTomatoSplat();
        if (selectedGame) {
          gameService.saveMissionResult(selectedGame.id, activeMission.id, 0, score, finalCorrect);
        }
      }
    }
  };

  // Finish Mission and continue
  const handleFinishMissionModal = () => {
    setMissionCompleteModal(false);
    if (!selectedGame || !activeMission) {
      setViewMode('HUB');
      return;
    }

    const nextMissionIndex = selectedGame.missions.findIndex((m) => m.id === activeMission.id) + 1;
    if (nextMissionIndex < selectedGame.missions.length) {
      setViewMode('MAP');
    } else {
      setGameCompleteModal(true);
      gameAudioService.playFanfare();
      onAwardXp(selectedGame.rewards.totalXp || 400, `Aventure KIPO Triomphale : ${selectedGame.title}`);
    }
  };

  // File Upload Handlers for AI Game Generator
  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      reader.onload = () => {
        const result = reader.result as string;
        setUploadedFiles((prev) => [
          ...prev,
          {
            name: file.name,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            data: result,
            type: isImg ? 'image' : isPdf ? 'pdf' : 'text',
            previewUrl: isImg ? result : undefined,
          },
        ]);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Trigger AI Game Generation: FAST (<3 seconds)
  const handleGenerateGame = async () => {
    if (!promptText.trim() && uploadedFiles.length === 0) {
      setGenerationError('Veuillez saisir un sujet, un problème ou ajouter un document / photo.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const newGame = await gameService.generateGameWithAI({
        problemOrTopic: promptText.trim(),
        files: uploadedFiles,
        universe: selectedUniverse,
        level: selectedLevel,
        language: currentLanguage,
      });

      refreshGames();
      setSelectedGame(newGame);
      setSelectedCompanion(newGame.leadAnimalId || 'hibou');
      setSelectedChapterIndex(0);
      setViewMode('MAP');
      gameAudioService.playFanfare();
      onAwardXp(150, 'Création d’un Jeu d’Aventure KIPO (100 Missions)');
    } catch (err: any) {
      setGenerationError(err.message || 'Une erreur est survenue lors de la création du jeu.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSound = () => {
    const muted = gameAudioService.toggleMute();
    setIsMuted(muted);
  };

  // ==========================================
  // RENDER VIEW: ACTIVE PLAYING MISSION ARENA
  // ==========================================
  if (viewMode === 'PLAYING' && activeMission) {
    const currentTasks = activeMission.tasks || [];
    const task = currentTasks[currentTaskIndex] || currentTasks[0] || {
      id: `fallback-${currentTaskIndex}`,
      type: 'question' as const,
      prompt: `Défi ${currentTaskIndex + 1} du Palier : Analyse et méthode`,
      options: [
        'Identifier méthodiquement les hypothèses et appliquer la démarche pas à pas',
        'Répondre au hasard sans vérifier la cohérence des résultats',
        'Confondre les causes et ignorer les étapes intermédiaires',
        'Abandonner face à la difficulté apparente',
      ],
      correctIndex: 0,
      explanation: 'La rigueur méthodique assure toujours la bonne réponse !',
      difficulty: currentTaskIndex % 2 === 1 ? 'difficile' : 'facile',
      timeLimitSeconds: currentTaskIndex % 2 === 1 ? 120 : 60,
    };
    const companion = ANIMAL_HEROES[selectedCompanion] || ANIMAL_HEROES.hibou;
    const isBoss = activeMission.type === 'boss_fight' && activeMission.boss;
    const isDifficult = task.difficulty === 'difficile' || (task.timeLimitSeconds || 60) > 60;

    return (
      <div className="min-h-[85vh] bg-slate-900 text-white p-4 md:p-6 flex flex-col justify-between relative overflow-hidden">
        {/* ========================================================= */}
        {/* 1. FULLSCREEN 3-SECOND CELEBRATION FLOWERS & HEARTS BURST */}
        {/* ========================================================= */}
        {showCelebrationFlowers && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
            {/* Soft Emerald Shimmer Scrim */}
            <div className="absolute inset-0 bg-emerald-500/15 backdrop-blur-xs animate-in fade-in duration-300" />

            {/* Central Celebration Badge */}
            <div className="absolute top-1/4 z-20 bg-white/95 px-6 py-3.5 rounded-3xl border-2 border-emerald-400 shadow-2xl flex items-center gap-3 animate-bounce">
              <span className="text-3xl">🌸</span>
              <div className="text-left">
                <span className="text-emerald-700 font-black text-xs uppercase tracking-wider block">
                  C'EST EXACT !
                </span>
                <span className="text-slate-800 text-sm font-black">
                  « {animalSpeech?.text || 'Oh le génie !'} »
                </span>
              </div>
              <span className="text-3xl">💖</span>
            </div>

            {/* 36 Floating & Blooming Flowers and Hearts */}
            {[...Array(36)].map((_, i) => {
              const icons = ['🌸', '🌺', '💖', '💐', '❤️', '🌷', '✨', '💕', '🌼', '💓', '🌻', '🎁'];
              const icon = icons[i % icons.length];
              const left = `${(i * 2.8) % 94 + 3}%`;
              const delay = `${(i * 0.07).toFixed(2)}s`;
              const duration = `${(1.8 + (i % 6) * 0.2).toFixed(2)}s`;
              const size = `${26 + (i % 5) * 8}px`;

              return (
                <span
                  key={i}
                  className="absolute bottom-0 animate-flower-float drop-shadow-md select-none"
                  style={{
                    left,
                    fontSize: size,
                    animationDelay: delay,
                    animationDuration: duration,
                  }}
                >
                  {icon}
                </span>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. FULLSCREEN 3-SECOND TOMATO SPLAT & DRIPPING OVERLAY    */}
        {/* ========================================================= */}
        {showTomatoSplat && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex items-center justify-center">
            {/* Red Tint Flash */}
            <div className="absolute inset-0 bg-red-700/20 animate-in fade-in duration-200" />

            {/* Central Roast Banner */}
            <div className="absolute top-1/4 z-20 bg-rose-950/95 text-white px-6 py-3.5 rounded-3xl border-2 border-rose-500 shadow-2xl flex items-center gap-3 animate-in zoom-in-75 duration-200">
              <span className="text-4xl animate-bounce">🍅</span>
              <div className="text-left">
                <span className="text-rose-400 font-black text-xs uppercase tracking-wider block">
                  RÉPONSE INCORRECTE !
                </span>
                <span className="text-white text-sm font-black">
                  « {animalSpeech?.text || 'Oh le looseur, rentre dans tes cahiers !'} »
                </span>
              </div>
              <span className="text-3xl">💥</span>
            </div>

            {/* Splattered Tomatoes with Dripping Stains */}
            {[
              { top: '12%', left: '15%', size: '90px', rotate: '-15deg' },
              { top: '18%', left: '74%', size: '105px', rotate: '20deg' },
              { top: '48%', left: '22%', size: '115px', rotate: '8deg' },
              { top: '45%', left: '80%', size: '95px', rotate: '-12deg' },
              { top: '70%', left: '16%', size: '100px', rotate: '18deg' },
              { top: '65%', left: '62%', size: '110px', rotate: '-6deg' },
            ].map((splat, idx) => (
              <div
                key={idx}
                className="absolute animate-tomato-splat select-none"
                style={{
                  top: splat.top,
                  left: splat.left,
                  transform: `rotate(${splat.rotate})`,
                }}
              >
                <div className="relative flex flex-col items-center">
                  <span className="text-6xl filter drop-shadow-lg">🍅💥</span>
                  <div className="w-2 h-20 bg-red-600/90 rounded-full -mt-2 shadow-sm" />
                  <div className="w-1.5 h-12 bg-red-500/80 rounded-full -ml-4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TOP HUD BAR */}
        <div className="max-w-4xl w-full mx-auto flex items-center justify-between bg-slate-800/90 border border-slate-700/80 rounded-2xl px-4 py-3 shadow-lg">
          <button
            onClick={() => setViewMode('MAP')}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quitter la mission</span>
          </button>

          {/* Hearts & Combo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-5 h-5 transition-transform ${
                    i < hearts
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-slate-600 fill-slate-700 scale-90'
                  }`}
                />
              ))}
            </div>

            {comboStreak > 1 && (
              <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-xs font-black animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>COMBO x{comboStreak}</span>
              </div>
            )}
          </div>

          {/* Score & Sound */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Score</span>
              <span className="font-mono text-emerald-400 font-black text-sm">{score} pts</span>
            </div>
            <button
              onClick={toggleSound}
              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
          </div>
        </div>

        {/* ARENA CENTER */}
        <div className="max-w-3xl w-full mx-auto my-4 flex-1 flex flex-col justify-center">
          {/* BOSS BATTLE BANNER */}
          {isBoss && activeMission.boss && (
            <div
              className={`mb-4 p-4 rounded-3xl bg-linear-to-r ${activeMission.boss.avatarBg} border border-white/20 shadow-xl transition-all relative overflow-hidden ${
                isBossDamaged ? 'scale-95 brightness-150 rotate-1' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-4xl filter drop-shadow-md">{activeMission.boss.emoji}</span>
                  <div>
                    <h3 className="font-black text-white text-base leading-tight">
                      {activeMission.boss.name}
                    </h3>
                    <p className="text-xs text-white/80">{activeMission.boss.title}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-white">
                    {bossHp} / {bossMaxHp} PV
                  </span>
                </div>
              </div>

              {/* Boss HP Bar */}
              <div className="w-full bg-black/40 rounded-full h-3.5 p-0.5 border border-white/20 relative">
                <div
                  className="bg-linear-to-r from-emerald-400 via-amber-400 to-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                />
              </div>

              {floatingDamage && (
                <div className="absolute top-2 right-12 text-2xl font-black text-yellow-300 animate-bounce drop-shadow-lg">
                  {floatingDamage}
                </div>
              )}

              <p className="mt-2 text-xs text-white/90 italic bg-black/20 p-2 rounded-xl">
                {activeMission.boss.tauntPhrase}
              </p>
            </div>
          )}

          {/* COMPANION ANIMAL CARD WITH REAL-TIME SPEECH BUBBLE */}
          <div className="mb-4 flex items-center justify-between bg-slate-800/80 border border-slate-700 rounded-2xl p-3 relative">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => gameAudioService.playAnimalSound(selectedCompanion)}
                className="text-3xl animate-bounce hover:scale-125 transition-transform cursor-pointer p-1 rounded-xl hover:bg-slate-700/60"
                title={`Clique pour écouter la voix de ${companion.name} (${selectedCompanion === 'chien' ? 'aboiement' : selectedCompanion === 'chat' ? 'miaulement' : selectedCompanion === 'hibou' ? 'hululements' : selectedCompanion === 'souris' ? 'couinements' : 'cris'})`}
              >
                {companion.emoji}
              </button>
              <div>
                <span className="text-xs font-bold text-slate-300 block">{companion.name}</span>
                {/* Spoken Animal Speech Bubble or Regular Catchphrase */}
                {animalSpeech ? (
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-lg inline-block ${
                      animalSpeech.isCorrect
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    « {animalSpeech.text} »
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    {task?.animalCommentary?.[selectedCompanion] || companion.catchphrase}
                  </span>
                )}
              </div>
            </div>

            {/* Special Power Button */}
            <button
              onClick={handleUsePowerUp}
              disabled={powerUpUsed || isAnswerSubmitted}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                powerUpUsed
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-linear-to-r from-amber-500 to-yellow-500 text-slate-950 font-black shadow-md hover:scale-105 active:scale-95'
              }`}
            >
              <span>{companion.specialPower.emoji}</span>
              <span className="hidden sm:inline">{companion.specialPower.name}</span>
              {powerUpUsed ? '(Utilisé)' : '(Prêt !)'}
            </button>
          </div>

          {/* TIMER WITH DIFFICULTY BADGE (60s pour Facile, 120s pour Difficile) */}
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
            <div className="flex items-center gap-2">
              <span>
                Défi {currentTaskIndex + 1} sur {activeMission.tasks.length}
              </span>
              {/* Question Difficulty Badge */}
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                  isDifficult
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}
              >
                {isDifficult ? '🔴 Difficile (120s)' : '🟢 Facile (60s)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Read Aloud Button */}
              <button
                type="button"
                onClick={() => {
                  if (task) {
                    gameAudioService.readQuestionAndOptions(task.prompt, task.options, selectedCompanion);
                  }
                }}
                title="Kipo lit la question et les 4 choix à voix haute"
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded-xl border border-slate-700 text-[11px] font-bold cursor-pointer transition-colors"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Réécouter la question</span>
              </button>

              {/* Timer Countdown Display */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-xl border border-slate-700">
                <Clock className={`w-4 h-4 ${timeLeft <= 10 ? 'text-rose-400 animate-spin' : 'text-slate-400'}`} />
                <span className={`font-mono font-bold ${timeLeft <= 10 ? 'text-rose-400' : 'text-white'}`}>
                  {timeLeft}s
                </span>
                {isTimerFrozen && <span className="text-[10px] text-sky-400">(Gelé !)</span>}
              </div>
            </div>
          </div>

          {/* QUESTION PROMPT CARD */}
          {task && (
            <div className="bg-slate-800 border-2 border-slate-700/80 rounded-3xl p-6 shadow-xl mb-4">
              <div className="flex items-start justify-between gap-3 mb-6">
                <h2 className="text-base sm:text-lg font-black text-white leading-relaxed">
                  {task.prompt}
                </h2>
                <button
                  type="button"
                  onClick={() => gameAudioService.readQuestionAndOptions(task.prompt, task.options, selectedCompanion)}
                  className="p-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-emerald-300 cursor-pointer shrink-0 transition-transform hover:scale-105"
                  title="Lire la question"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {/* 4 CHOICES */}
              <div className="grid grid-cols-1 gap-3">
                {task.options.map((option, idx) => {
                  const isChosen = selectedOption === idx;
                  const isCorrectAnswer = idx === task.correctIndex;
                  const isDisabledByPower = disabledOptions.includes(idx);

                  let btnStyle =
                    'bg-slate-700/70 border-2 border-slate-600 text-white hover:bg-slate-700 hover:border-slate-500';

                  if (isAnswerSubmitted) {
                    if (isCorrectAnswer) {
                      btnStyle = 'bg-emerald-600 border-emerald-400 text-white font-black shadow-lg';
                    } else if (isChosen && !isCorrectAnswer) {
                      btnStyle = 'bg-rose-600 border-rose-400 text-white line-through';
                    } else {
                      btnStyle = 'bg-slate-800/50 border-slate-700 text-slate-500';
                    }
                  } else if (isDisabledByPower) {
                    btnStyle = 'bg-slate-800/30 border-slate-800 text-slate-600 line-through cursor-not-allowed';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectAnswer(idx)}
                      disabled={isAnswerSubmitted || isDisabledByPower}
                      className={`flex items-center justify-between p-4 rounded-2xl text-left text-sm font-bold transition-all cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center text-xs font-mono">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span>{option}</span>
                      </div>

                      {isAnswerSubmitted && isCorrectAnswer && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
                      )}
                      {isAnswerSubmitted && isChosen && !isCorrectAnswer && (
                        <XCircle className="w-5 h-5 text-rose-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* EXPLANATION AFTER SUBMIT */}
              {isAnswerSubmitted && (
                <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs">
                  <div className="flex items-center gap-2 mb-1.5 font-black text-sm">
                    {selectedOption === task.correctIndex ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Exact ! Bien joué !
                      </span>
                    ) : (
                      <span className="text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" /> Erreur... Regarde la méthode :
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 leading-relaxed mb-3">{task.explanation}</p>

                  <button
                    onClick={handleNextTask}
                    className="w-full py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm transition-transform active:scale-98 shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continuer l’aventure</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MISSION COMPLETE MODAL (PASSED: >= 3/5 CORRECT) */}
        {missionCompleteModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-emerald-500 rounded-3xl max-w-md w-full p-6 text-center text-white shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl">
                🏆
              </div>

              <h3 className="text-xl font-black mb-1">Mission Validée !</h3>
              <p className="text-xs text-slate-300 mb-4">{activeMission.title}</p>

              {/* Stars */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 transition-all ${
                      star <= missionStarsEarned
                        ? 'text-yellow-400 fill-yellow-400 scale-110 drop-shadow-md'
                        : 'text-slate-600 fill-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="bg-slate-900/80 p-3 rounded-2xl mb-4 flex items-center justify-around text-xs">
                <div>
                  <span className="text-slate-400 block">Bonnes réponses</span>
                  <span className="text-base font-black text-emerald-400">{correctAnswersCount} / 5</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Score final</span>
                  <span className="text-base font-black text-emerald-400">{score} pts</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Vies restantes</span>
                  <span className="text-base font-black text-rose-400">{hearts} / 5</span>
                </div>
              </div>

              <p className="text-[11px] text-emerald-400 mb-4 font-semibold">
                ✨ Superbe ! La mission suivante est maintenant débloquée sur la carte !
              </p>

              <button
                onClick={handleFinishMissionModal}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-lg cursor-pointer"
              >
                Continuer vers la mission suivante
              </button>
            </div>
          </div>
        )}

        {/* MISSION FAILED MODAL (MISSED > 2 QUESTIONS: < 3/5 CORRECT) */}
        {missionFailedModal && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-rose-500 rounded-3xl max-w-md w-full p-6 text-center text-white shadow-2xl animate-in zoom-in-95">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-3xl">
                🍅
              </div>

              <h3 className="text-xl font-black text-rose-400 mb-1">Mission Non Débloquée !</h3>
              <p className="text-xs text-slate-300 mb-3">{activeMission.title}</p>

              <div className="bg-rose-950/60 border border-rose-800/80 p-3.5 rounded-2xl mb-4 text-xs">
                <p className="font-bold text-rose-300 mb-1">
                  Tu as obtenu {correctAnswersCount} / 5 bonnes réponses.
                </p>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Règle de Kipo : Il faut trouver au <strong>minimum 3 questions sur 5</strong> (tu as raté {5 - correctAnswersCount} questions). La prochaine mission reste verrouillée !
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMissionFailedModal(false);
                    handleStartMission(activeMission);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-linear-to-r from-amber-500 to-orange-600 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover:scale-102 transition-transform"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Réessayer maintenant</span>
                </button>
                <button
                  onClick={() => {
                    setMissionFailedModal(false);
                    setViewMode('MAP');
                  }}
                  className="px-4 py-3 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
                >
                  Carte
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ENTIRE 100-MISSION GAME COMPLETE CELEBRATION */}
        {gameCompleteModal && selectedGame && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-amber-400 rounded-3xl max-w-lg w-full p-6 text-center text-white shadow-2xl animate-in zoom-in-95">
              <div className="text-5xl mb-2 animate-bounce">
                {selectedGame.rewards.badgeEmoji || '👑'}
              </div>

              <h2 className="text-2xl font-black text-yellow-300 mb-1">
                LES 100 MISSIONS SONT ACCOMPLIES !
              </h2>
              <p className="text-sm font-bold text-white mb-2">{selectedGame.title}</p>
              <p className="text-xs text-slate-300 mb-4">{selectedGame.rewards.trophyDescription}</p>

              <div className="bg-slate-900 p-4 rounded-2xl mb-5 text-left border border-slate-700">
                <span className="text-xs font-bold text-amber-400 uppercase block mb-1">
                  Trophée Suprême Débloqué
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedGame.rewards.badgeEmoji}</span>
                  <div>
                    <span className="font-black text-white text-sm block">
                      {selectedGame.rewards.badgeName}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      +{selectedGame.rewards.totalXp} XP Enregistrés
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setGameCompleteModal(false);
                  setViewMode('HUB');
                }}
                className="w-full py-3.5 rounded-2xl bg-linear-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer hover:scale-102 transition-transform"
              >
                Retour aux Jeux & Aventures
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER VIEW: MISSION MAP (100 MISSIONS IN 10 CHAPTERS)
  // ==========================================
  if (viewMode === 'MAP' && selectedGame) {
    const progress = gameService.getGameProgress(selectedGame.id);
    const totalMissions = selectedGame.missions.length;

    // Filter 10 missions for currently selected chapter
    const chapterStart = selectedChapterIndex * 10;
    const currentChapterMissions = selectedGame.missions.slice(chapterStart, chapterStart + 10);

    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button & Title Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setViewMode('HUB')}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Toutes les Aventures</span>
          </button>

          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {selectedGame.universeName} · 100 Missions Disponibles
          </span>
        </div>

        {/* Hero Card of the Game */}
        <div className="bg-linear-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🦉</span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black">{selectedGame.title}</h1>
              <p className="text-xs text-emerald-100">{selectedGame.subject}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-emerald-50/90 leading-relaxed max-w-2xl mt-3">
            {selectedGame.storyline}
          </p>

          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center gap-4 text-xs font-bold text-emerald-100">
            <span>⏱️ 60s pour questions faciles</span>
            <span>·</span>
            <span>⏱️ 120s pour questions difficiles</span>
            <span>·</span>
            <span>🦁 Boss tous les 10 paliers</span>
            <span>·</span>
            <span>🔒 Déblocage : Min. 3/5 bonnes réponses</span>
          </div>
        </div>

        {/* Choose Companion Animal Bar */}
        <div className="mb-6 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs">
          <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-3">
            Choisis ton Compagnon Animal pour les Missions :
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.values(ANIMAL_HEROES).map((hero) => {
              const isSelected = selectedCompanion === hero.id;
              return (
                <button
                  key={hero.id}
                  onClick={() => {
                    setSelectedCompanion(hero.id);
                    gameAudioService.playAnimalSound(hero.id);
                  }}
                  className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/80 shadow-md scale-102 font-bold'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                  title={`Écouter et choisir ${hero.name}`}
                >
                  <span className="text-3xl mb-1">{hero.emoji}</span>
                  <span className="text-xs font-black text-slate-800 text-center leading-tight">
                    {hero.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 text-center mt-0.5 truncate max-w-full">
                    {hero.specialPower.name}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 flex items-center gap-2">
            <span className="text-lg">{ANIMAL_HEROES[selectedCompanion].emoji}</span>
            <span>
              <strong>{ANIMAL_HEROES[selectedCompanion].name} :</strong>{' '}
              {ANIMAL_HEROES[selectedCompanion].specialPower.description}
            </span>
          </div>
        </div>

        {/* 10 CHAPTERS / 100 MISSIONS SELECTOR TABS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Parcours des 100 Missions (10 Chapitres) :</span>
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Chapitre {selectedChapterIndex + 1} sur 10
            </span>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {[...Array(10)].map((_, cIdx) => {
              const isCurrent = selectedChapterIndex === cIdx;
              const rangeStart = cIdx * 10 + 1;
              const rangeEnd = (cIdx + 1) * 10;
              return (
                <button
                  key={cIdx}
                  onClick={() => setSelectedChapterIndex(cIdx)}
                  className={`px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Missions {rangeStart}–{rangeEnd}
                  {cIdx === 9 && ' 👑'}
                </button>
              );
            })}
          </div>
        </div>

        {/* MISSIONS OF CURRENT CHAPTER WITH STRICT UNLOCK CHECK */}
        <div className="space-y-3.5">
          {currentChapterMissions.map((mission, idxInChapter) => {
            const missionIndexInGame = chapterStart + idxInChapter;
            const missionProgress = progress[mission.id] || { completed: false, passed: false, stars: 0, score: 0 };
            const isBoss = mission.type === 'boss_fight';

            // STRICT UNLOCK CONDITION:
            // Mission 1 is unlocked by default.
            // For mission N > 1, mission N-1 MUST have been passed (>= 3/5 correct answers).
            const isFirstMission = missionIndexInGame === 0;
            const prevMission = isFirstMission ? null : selectedGame.missions[missionIndexInGame - 1];
            const prevMissionPassed = !prevMission || !!progress[prevMission.id]?.passed;
            const isUnlocked = isFirstMission || prevMissionPassed;

            return (
              <div
                key={mission.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-3xl border-2 transition-all ${
                  !isUnlocked
                    ? 'bg-slate-100/80 border-slate-200 opacity-60'
                    : isBoss
                    ? 'bg-linear-to-r from-amber-50 via-rose-50 to-orange-50 border-amber-300 shadow-md'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3.5 mb-3 sm:mb-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                      !isUnlocked
                        ? 'bg-slate-200 text-slate-400'
                        : isBoss
                        ? 'bg-amber-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {!isUnlocked ? '🔒' : mission.environmentEmoji || (isBoss ? '👑' : '🌲')}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400">
                        Mission {mission.order} / {totalMissions}
                      </span>
                      {isBoss && (
                        <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          Combat de Boss 🦁
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          Verrouillé 🔒 (Min. 3/5 sur la précédente)
                        </span>
                      )}
                    </div>

                    <h3 className={`font-black text-sm sm:text-base leading-tight ${!isUnlocked ? 'text-slate-600' : 'text-slate-900'}`}>
                      {mission.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{mission.storyIntro}</p>

                    {missionProgress.completed && (
                      <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= missionProgress.stars
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] text-emerald-600 font-bold ml-1">
                          Validé ({missionProgress.correctCount || 3}/5) · {missionProgress.score} pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {isUnlocked ? (
                  <button
                    onClick={() => handleStartMission(mission)}
                    className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isBoss
                        ? 'bg-linear-to-r from-amber-500 to-rose-600 text-white shadow-md hover:scale-105'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{missionProgress.completed ? 'Rejouer' : 'Lancer (5 questions)'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-200 text-slate-500 text-xs font-bold cursor-not-allowed">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Verrouillé 🔒</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER VIEW: AI MULTIMODAL GAME GENERATOR (FAST)
  // ==========================================
  if (viewMode === 'CREATOR') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => setViewMode('HUB')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux Jeux</span>
        </button>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎮</span>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                Créer un Jeu d’Aventure 100 Missions avec l’IA
              </h1>
              <p className="text-xs text-slate-500">
                Saisis n’importe quel cours, problème ou téléverse une photo/PDF. Kipo génère
                immédiatement 100 missions avec timer 60s/120s et répliques vocales d’animaux !
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            {/* 1. Prompt / Problem Textarea */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1.5">
                Sur quoi veux-tu jouer et apprendre ?
              </label>
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="Exemple : Les équations du second degré, La Révolution Française, Les lois de Newton, ou colle l’exercice de ton devoir..."
                rows={4}
                className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />

              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Les théorèmes de géométrie (Pythagore & Thalès)',
                  'Le cycle cellulaire & SVT',
                  'L’accord du participe passé',
                  'Les guerres mondiales & Histoire',
                  'Fractions, pourcentages et probabilités',
                ].map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPromptText(sug)}
                    className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. File Upload for Photos & Documents */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1.5">
                Joindre une photo ou un document PDF (Optionnel) :
              </label>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-emerald-50/30"
              >
                <div className="flex items-center justify-center gap-3 text-slate-500 mb-2">
                  <Camera className="w-5 h-5 text-emerald-600" />
                  <FileUp className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Clique pour importer une photo d’exercice ou un document PDF
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Analyse de photos manuscrites, schémas, fiches et polycopiés
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFilesSelected}
                  className="hidden"
                />
              </div>

              {uploadedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                    >
                      {file.type === 'image' ? (
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <FileUp className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span className="font-medium text-slate-700 max-w-[150px] truncate">{file.name}</span>
                      <button
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-500 ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Universe Choice */}
            <div>
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider block mb-1.5">
                Univers du Jeu :
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'foret', name: 'Forêt Enchantée', emoji: '🌲' },
                  { id: 'temple', name: 'Temple Antique', emoji: '🏛️' },
                  { id: 'espace', name: 'Odyssée Spatiale', emoji: '🚀' },
                  { id: 'royaume', name: 'Royaume Médiéval', emoji: '👑' },
                ].map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setSelectedUniverse(u.id as any)}
                    className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedUniverse === u.id
                        ? 'border-emerald-500 bg-emerald-50/80 font-bold text-emerald-900 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <span className="text-xl">{u.emoji}</span>
                    <span className="text-xs">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {generationError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {generationError}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleGenerateGame}
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-700 hover:from-emerald-500 hover:to-indigo-600 text-white font-black text-sm shadow-md transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Kipo génère instantanément tes 100 missions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Générer Mon Jeu d'Aventure (100 Missions)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER VIEW: MAIN HUB (EXPLORATION & GAMES LIST)
  // ==========================================
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-linear-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">🎮</span>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-200">
              KIPO Zoo Aventures & Missions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            Des Vrais Jeux Éducatifs : 100 Missions & Animaux Parlants
          </h1>
          <p className="text-xs sm:text-sm text-emerald-50/90 mt-2 leading-relaxed">
            Rejoins Kipo le Hibou 🦉, Miko le Chat 🐱, Rocky le Chien 🐶 et Pip la Souris 🐭. Timer de
            60s (facile) à 120s (difficile), répliques vocales d’encouragement ou de chambrage, et
            pluie de fleurs ou tomates sur ton écran !
          </p>
        </div>

        <button
          onClick={() => setViewMode('CREATOR')}
          className="self-start sm:self-center px-6 py-4 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-lg hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Créer un Jeu (100 Missions)</span>
        </button>
      </div>

      {/* ANIMAL CAST SHOWCASE */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Les Héros Animaux de KIPO</h2>
            <p className="text-xs text-slate-500">
              Ils parlent vocalement pendant le jeu pour te motiver ou te taquiner quand tu te trompes !
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {Object.values(ANIMAL_HEROES).map((hero) => (
            <div
              key={hero.id}
              className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">
                    {hero.emoji}
                  </div>
                  <button
                    type="button"
                    onClick={() => gameAudioService.playAnimalSound(hero.id)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                    title={`Écouter la voix de ${hero.name} (${hero.id === 'chien' ? 'aboiements' : hero.id === 'chat' ? 'miaulements' : hero.id === 'hibou' ? 'hululements' : hero.id === 'souris' ? 'couinements' : 'cris'})`}
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-black text-slate-900 text-sm leading-tight">{hero.name}</h3>
                <span className="text-[11px] font-bold text-emerald-600 block mb-1">{hero.role}</span>
                <p className="text-[11px] text-slate-500 leading-snug">{hero.personality}</p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 p-2 rounded-xl">
                  <span>{hero.specialPower.emoji}</span>
                  <span className="truncate">{hero.specialPower.name}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* READY-TO-PLAY ADVENTURES (100 MISSIONS CHACUNE) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-black text-slate-900">Aventures Complètes (100 Missions)</h2>
            <p className="text-xs text-slate-500">
              100 missions progressives avec boss tous les 10 paliers sur le même sujet !
            </p>
          </div>

          <button
            onClick={() => setViewMode('CREATOR')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>+ Nouveau jeu 100 missions</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {gamesList.map((game) => {
            const leadAnimal = ANIMAL_HEROES[game.leadAnimalId] || ANIMAL_HEROES.hibou;

            return (
              <div
                key={game.id}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-3xl p-5 shadow-2xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-400">{game.universeName}</span>
                    <span className="text-2xl">{leadAnimal.emoji}</span>
                  </div>

                  <h3 className="font-black text-slate-900 text-base leading-tight mb-1.5">
                    {game.title}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-2">
                    {game.subject}
                  </span>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {game.conceptSummary || game.storyline}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                    <span>{game.missions.length} Missions</span>
                    <span>·</span>
                    <span className="text-amber-600 flex items-center gap-0.5">
                      <Trophy className="w-3.5 h-3.5" /> +{game.rewards.totalXp} XP
                    </span>
                  </div>

                  <button
                    onClick={() => handleSelectGame(game)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Jouer (100)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
