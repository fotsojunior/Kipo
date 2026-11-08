import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Timer,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PlusCircle,
  HelpCircle,
  Bookmark,
  ChevronRight,
  Loader2,
  Sword,
  Target,
} from 'lucide-react';
import {
  Quiz,
  QuizQuestion,
  UserProfile,
  SupportedLanguage,
} from '../types';
import { translations } from '../i18n/translations';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { soundEffects } from '../utils/soundEffects';

interface QuizGameViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
  presetQuiz?: Quiz | null;
  presetSourceContent?: string;
  presetSubjectTitle?: string;
}

export const QuizGameView: React.FC<QuizGameViewProps> = ({
  currentProfile,
  currentLanguage,
  onAwardXp,
  presetQuiz,
  presetSourceContent,
  presetSubjectTitle,
}) => {
  const t = translations[currentLanguage];

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [totalXpEarned, setTotalXpEarned] = useState(0);
  const [comboStreak, setComboStreak] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);
  const [bossHp, setBossHp] = useState(100);

  // AI Quiz Creator Modal State
  const [isCreatingWithAi, setIsCreatingWithAi] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Moyen');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load quizzes from storage
  useEffect(() => {
    const list = storageService.getQuizzes();
    setQuizzes(list);

    if (presetQuiz) {
      startQuiz(presetQuiz);
    } else if (presetSourceContent) {
      generateFromSource(presetSourceContent, presetSubjectTitle || 'Cours personnalisé');
    } else if (list.length > 0 && !activeQuiz) {
      setActiveQuiz(list[0]);
    }
  }, [presetQuiz, presetSourceContent]);

  const generateFromSource = async (content: string, title: string) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const generated = await apiService.generateLearningMaterial({
        sourceText: content,
        type: 'quiz',
        profile: currentProfile,
        language: currentLanguage,
        questionCount: 4,
        subject: title,
      });

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: generated.title || `Quiz : ${title}`,
        subject: generated.subject || title,
        difficulty: generated.difficulty || 'Moyen',
        questions: generated.questions || [],
        createdAt: new Date().toISOString(),
        timesPlayed: 0,
        bestScore: 0,
      };

      storageService.saveQuiz(newQuiz);
      setQuizzes((prev) => [newQuiz, ...prev]);
      startQuiz(newQuiz);
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de générer le quiz à partir du cours.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startQuiz = (quiz: Quiz, boss: boolean = false) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setTotalXpEarned(0);
    setComboStreak(0);
    setIsQuizCompleted(false);
    setIsBossMode(boss);
    setBossHp(100);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionIndex(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOptionIndex === null || !activeQuiz) return;

    setIsAnswerSubmitted(true);
    const q = activeQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedOptionIndex === q.correctIndex;

    if (isCorrect) {
      soundEffects.playCorrect();
      const newStreak = comboStreak + 1;
      setComboStreak(newStreak);
      setScore((s) => s + 1);

      // Streak multiplier: 1x, 1.25x, 1.5x, 2x
      const multiplier = Math.min(2.0, 1 + newStreak * 0.25);
      const earnedXp = Math.round((q.xpReward || 20) * multiplier);
      setTotalXpEarned((prev) => prev + earnedXp);

      if (isBossMode) {
        setBossHp((prev) => Math.max(0, prev - Math.ceil(100 / activeQuiz.questions.length)));
      }
    } else {
      soundEffects.playIncorrect();
      setComboStreak(0);
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuestionIndex + 1 < activeQuiz.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswerSubmitted(false);
    } else {
      // Complete quiz
      setIsQuizCompleted(true);
      if (totalXpEarned > 0) {
        onAwardXp(totalXpEarned, `Quiz complété : ${activeQuiz.title}`);
      }

      // Update quiz stats in storage
      activeQuiz.timesPlayed += 1;
      if (!activeQuiz.bestScore || score > activeQuiz.bestScore) {
        activeQuiz.bestScore = score;
      }
      storageService.saveQuiz(activeQuiz);

      // Confetti celebration if score > 50%
      if (score >= Math.ceil(activeQuiz.questions.length / 2)) {
        try {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    }
  };

  const handleCreateWithAi = async () => {
    if (!aiTopic.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const generated = await apiService.generateLearningMaterial({
        sourceText: aiTopic,
        type: isBossMode ? 'challenge' : 'quiz',
        profile: currentProfile,
        language: currentLanguage,
        questionCount: aiQuestionCount,
        subject: aiTopic,
      });

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: generated.title || `Quiz IA : ${aiTopic}`,
        subject: generated.subject || aiTopic,
        difficulty: generated.difficulty || aiDifficulty,
        questions: generated.questions || [],
        createdAt: new Date().toISOString(),
        timesPlayed: 0,
        bestScore: 0,
      };

      storageService.saveQuiz(newQuiz);
      setQuizzes((prev) => [newQuiz, ...prev]);
      setIsCreatingWithAi(false);
      setAiTopic('');
      startQuiz(newQuiz, isBossMode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la génération du quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ: QuizQuestion | undefined = activeQuiz?.questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner & Quick Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span>{t.quiz.title}</span>
          </h1>
          <p className="text-xs text-slate-500">
            Défie tes connaissances et gagne des points XP !
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingWithAi(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Créer un Quiz IA</span>
          </button>
        </div>
      </div>

      {/* Available Quiz selector carousel */}
      {quizzes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quizzes.map((q) => {
            const isCurrent = activeQuiz?.id === q.id;
            return (
              <button
                key={q.id}
                onClick={() => startQuiz(q)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                }`}
              >
                {q.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Quiz Arena */}
      {activeQuiz && currentQ && !isQuizCompleted ? (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-slate-200 shadow-sm space-y-6 relative overflow-hidden">
          {/* Boss Mode Header if active */}
          {isBossMode && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <Sword className="w-5 h-5 text-rose-400 animate-pulse" />
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                    Défi Boss IA
                  </span>
                  <p className="text-[11px] text-slate-300">Gardien des Énigmes</p>
                </div>
              </div>
              <div className="w-32 bg-slate-800 rounded-full h-3 overflow-hidden border border-rose-500/30">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${bossHp}%` }}
                />
              </div>
            </div>
          )}

          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>
              {t.quiz.question} {currentQuestionIndex + 1} / {activeQuiz.questions.length}
            </span>

            {/* Streak Multiplier */}
            {comboStreak > 1 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 animate-bounce">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                Combo x{(1 + comboStreak * 0.25).toFixed(1)} !
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
              {activeQuiz.subject}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / activeQuiz.questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Question Prompt */}
          <div className="py-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQ.question}
            </h2>
          </div>

          {/* 4 Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOptionIndex === idx;
              const isCorrectAnswer = idx === currentQ.correctIndex;

              let btnStyle = 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 text-slate-800';

              if (isAnswerSubmitted) {
                if (isCorrectAnswer) {
                  btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                } else if (isSelected) {
                  btnStyle = 'border-rose-400 bg-rose-50 text-rose-900 font-bold';
                } else {
                  btnStyle = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                btnStyle = 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-semibold ring-2 ring-indigo-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`p-4 rounded-2xl border-2 text-left text-sm transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isSelected || (isAnswerSubmitted && isCorrectAnswer)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isAnswerSubmitted && isCorrectAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  {isAnswerSubmitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Box */}
          {isAnswerSubmitted && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>{t.quiz.explanation}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex justify-end">
            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOptionIndex === null}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Valider ma réponse
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>
                  {currentQuestionIndex + 1 < activeQuiz.questions.length
                    ? t.quiz.next
                    : t.quiz.finish}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      ) : isQuizCompleted && activeQuiz ? (
        /* Results View */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-amber-500/25">
            <Trophy className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">{t.quiz.congrats}</h2>
            <p className="text-sm text-slate-600 mt-1">
              Tu as complété « {activeQuiz.title} »
            </p>
          </div>

          {/* Score & XP Pills */}
          <div className="flex justify-center items-center gap-4">
            <div className="px-5 py-3 rounded-2xl bg-indigo-50 border border-indigo-100">
              <span className="block text-2xl font-black text-indigo-700">
                {score} / {activeQuiz.questions.length}
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {t.quiz.score}
              </span>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="block text-2xl font-black text-amber-600">
                +{totalXpEarned}
              </span>
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {t.quiz.xpEarned}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => startQuiz(activeQuiz, isBossMode)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.quiz.replay}</span>
            </button>

            <button
              onClick={() => startQuiz(activeQuiz, true)}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Sword className="w-4 h-4" />
              <span>Rejouer en mode Boss</span>
            </button>
          </div>
        </div>
      ) : !activeQuiz && !isQuizCompleted ? (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800">Aucun quiz pour le moment</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Ton espace est vierge. Crée ton premier quiz sur mesure avec l'IA en quelques secondes sur le thème de ton choix, ou génère-le à partir d'un cours !
          </p>
          <button
            onClick={() => setIsCreatingWithAi(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Créer mon premier quiz IA</span>
          </button>
        </div>
      ) : null}

      {/* AI Quiz Generator Modal */}
      {isCreatingWithAi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Générateur de Quiz IA</span>
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
                  Matière, chapitre ou concept à réviser :
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ex: La Seconde Guerre Mondiale, Les fractions, Optique..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Difficulté :
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  >
                    <option value="Facile">Facile</option>
                    <option value="Moyen">Moyen</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nombre de questions :
                  </label>
                  <select
                    value={aiQuestionCount}
                    onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
                  >
                    <option value={3}>3 questions</option>
                    <option value={5}>5 questions</option>
                    <option value={8}>8 questions</option>
                  </select>
                </div>
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
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Génération par l'IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Créer et jouer</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
