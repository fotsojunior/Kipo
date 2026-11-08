import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Brain,
  RotateCw,
  Sparkles,
  HelpCircle,
  CheckCircle,
  ThumbsUp,
  RotateCcw,
  PlusCircle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  FolderHeart,
} from 'lucide-react';
import {
  FlashcardDeck,
  Flashcard,
  UserProfile,
  SupportedLanguage,
} from '../types';
import { translations } from '../i18n/translations';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { soundEffects } from '../utils/soundEffects';

interface FlashcardViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
  presetDeck?: FlashcardDeck | null;
  presetSourceContent?: string;
  presetSubjectTitle?: string;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  currentProfile,
  currentLanguage,
  onAwardXp,
  presetDeck,
  presetSourceContent,
  presetSubjectTitle,
}) => {
  const t = translations[currentLanguage];

  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [sessionXpEarned, setSessionXpEarned] = useState(0);

  // AI Deck generator modal
  const [isCreatingWithAi, setIsCreatingWithAi] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCardCount, setAiCardCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const list = storageService.getFlashcardDecks();
    setDecks(list);

    if (presetDeck) {
      startDeck(presetDeck);
    } else if (presetSourceContent) {
      generateFromSource(presetSourceContent, presetSubjectTitle || 'Cartes mémoire');
    } else if (list.length > 0 && !activeDeck) {
      setActiveDeck(list[0]);
    }
  }, [presetDeck, presetSourceContent]);

  const generateFromSource = async (content: string, title: string) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const generated = await apiService.generateLearningMaterial({
        sourceText: content,
        type: 'flashcards',
        profile: currentProfile,
        language: currentLanguage,
        questionCount: 4,
        subject: title,
      });

      const newDeck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        title: generated.title || `Cartes : ${title}`,
        subject: generated.subject || title,
        cards: generated.cards || [],
        createdAt: new Date().toISOString(),
        timesReviewed: 0,
      };

      storageService.saveFlashcardDeck(newDeck);
      setDecks((prev) => [newDeck, ...prev]);
      startDeck(newDeck);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de générer les cartes mémoire.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startDeck = (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setSessionCompleted(false);
    setSessionXpEarned(0);
  };

  const handleFlipCard = () => {
    soundEffects.playCardFlip();
    setIsFlipped(!isFlipped);
  };

  const handleRateCard = (ratingXp: number) => {
    setSessionXpEarned((prev) => prev + ratingXp);
    soundEffects.playCorrect();

    if (!activeDeck) return;
    if (currentIndex + 1 < activeDeck.cards.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setShowHint(false);
    } else {
      // Completed deck session
      setSessionCompleted(true);
      const finalXp = sessionXpEarned + ratingXp + 20; // 20 bonus for completion
      onAwardXp(finalXp, `Session de cartes révisée : ${activeDeck.title}`);

      activeDeck.timesReviewed += 1;
      storageService.saveFlashcardDeck(activeDeck);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    }
  };

  const handleCreateWithAi = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const generated = await apiService.generateLearningMaterial({
        sourceText: aiTopic,
        type: 'flashcards',
        profile: currentProfile,
        language: currentLanguage,
        questionCount: aiCardCount,
        subject: aiTopic,
      });

      const newDeck: FlashcardDeck = {
        id: `deck-${Date.now()}`,
        title: generated.title || `Cartes IA : ${aiTopic}`,
        subject: generated.subject || aiTopic,
        cards: generated.cards || [],
        createdAt: new Date().toISOString(),
        timesReviewed: 0,
      };

      storageService.saveFlashcardDeck(newDeck);
      setDecks((prev) => [newDeck, ...prev]);
      setIsCreatingWithAi(false);
      setAiTopic('');
      startDeck(newDeck);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la génération des cartes.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentCard: Flashcard | undefined = activeDeck?.cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-5 h-5 text-violet-600" />
            <span>{t.flashcards.title}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Mémorise durablement grâce à la répétition espacée.
          </p>
        </div>

        <button
          onClick={() => setIsCreatingWithAi(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Créer des Cartes IA</span>
        </button>
      </div>

      {/* Decks carousel */}
      {decks.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {decks.map((d) => (
            <button
              key={d.id}
              onClick={() => startDeck(d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                activeDeck?.id === d.id
                  ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
              }`}
            >
              {d.title} ({d.cards.length})
            </button>
          ))}
        </div>
      )}

      {/* Main Flashcard Card Arena */}
      {activeDeck && currentCard && !sessionCompleted ? (
        <div className="space-y-4">
          {/* Progress bar & indicator */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              Carte {currentIndex + 1} sur {activeDeck.cards.length}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-semibold border border-violet-200">
              {activeDeck.subject}
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-violet-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / activeDeck.cards.length) * 100}%`,
              }}
            />
          </div>

          {/* Interactive 3D Flip Card Container */}
          <div
            onClick={handleFlipCard}
            className="w-full min-h-[300px] sm:min-h-[340px] bg-white rounded-3xl p-6 sm:p-8 border-2 border-indigo-100/80 hover:border-violet-300 shadow-md cursor-pointer transition-all flex flex-col justify-between relative group select-none"
          >
            {/* Top card pill */}
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                  isFlipped
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                {isFlipped ? 'Verso (Explication & Réponse)' : 'Recto (Question / Notion)'}
              </span>

              <div className="flex items-center gap-1 text-slate-400 group-hover:text-violet-600 text-xs font-medium transition-colors">
                <RotateCw className="w-3.5 h-3.5 animate-spin-slow" />
                <span className="hidden sm:inline">{t.flashcards.flipHint}</span>
              </div>
            </div>

            {/* Central card content */}
            <div className="py-6 text-center">
              {!isFlipped ? (
                <div className="space-y-3">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {currentCard.front}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Prends un instant pour réfléchir, puis retourne la carte.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                    Définition / Clé de compréhension :
                  </h4>
                  <p className="text-base sm:text-lg text-slate-800 font-medium leading-relaxed">
                    {currentCard.back}
                  </p>
                </div>
              )}
            </div>

            {/* Hint toggle bar */}
            <div>
              {currentCard.hint && (
                <div className="border-t border-slate-100 pt-3">
                  {!showHint ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHint(true);
                      }}
                      className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 mx-auto cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>{t.flashcards.showHint}</span>
                    </button>
                  ) : (
                    <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center">
                      💡 <strong>Indice :</strong> {currentCard.hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Spaced repetition evaluation buttons */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => handleRateCard(5)}
              className="py-3 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all text-center cursor-pointer"
            >
              {t.flashcards.difficulty.again}
            </button>

            <button
              onClick={() => handleRateCard(15)}
              className="py-3 px-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition-all text-center cursor-pointer"
            >
              {t.flashcards.difficulty.good}
            </button>

            <button
              onClick={() => handleRateCard(25)}
              className="py-3 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-bold transition-all text-center cursor-pointer"
            >
              {t.flashcards.difficulty.perfect}
            </button>
          </div>
        </div>
      ) : sessionCompleted && activeDeck ? (
        /* Completed Session Card */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-md shadow-violet-500/25">
            <CheckCircle className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {t.flashcards.completedTitle}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Tu as révisé les {activeDeck.cards.length} cartes de « {activeDeck.title} ».
            </p>
          </div>

          <div className="inline-block px-5 py-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 font-black text-lg">
            +{sessionXpEarned + 20} XP Gagnés !
          </div>

          <div className="pt-2">
            <button
              onClick={() => startDeck(activeDeck)}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Réviser à nouveau ce paquet
            </button>
          </div>
        </div>
      ) : !activeDeck && !sessionCompleted ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto shadow-inner">
            <Brain className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Aucun paquet de cartes pour le moment</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ton espace est vierge. Génère ton premier paquet de cartes mémoire avec l'IA pour mémoriser tes cours avec la répétition espacée !
          </p>
          <button
            onClick={() => setIsCreatingWithAi(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Créer mon premier paquet de cartes IA</span>
          </button>
        </div>
      ) : null}

      {/* AI Deck Generator Modal */}
      {isCreatingWithAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Générateur de Flashcards IA</span>
              </h3>
              <button
                onClick={() => setIsCreatingWithAi(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Matière, chapitre ou liste de notions :
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ex: Vocabulaire anglais B2, Dates Histoire de France, Formules Chimie..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-violet-500 outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre de cartes :
                </label>
                <select
                  value={aiCardCount}
                  onChange={(e) => setAiCardCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                >
                  <option value={4}>4 cartes</option>
                  <option value={6}>6 cartes</option>
                  <option value={10}>10 cartes</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg">
                {errorMsg}
              </p>
            )}

            <button
              onClick={handleCreateWithAi}
              disabled={isGenerating || !aiTopic.trim()}
              className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération des cartes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Créer mon paquet</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
