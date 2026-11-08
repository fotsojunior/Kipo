import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Heart,
  Sparkles,
  Trophy,
  Check,
  X,
  RotateCcw,
  Star,
  ChevronRight,
  Flame,
  Volume2,
  VolumeX,
  ArrowLeft,
  Gem,
  Award,
  BookOpen,
  Lock,
  PlusCircle,
  FileText,
  Loader2,
  HelpCircle,
  Filter,
  Download,
  Camera,
  Image as ImageIcon,
  Share2,
  Layers,
  MapPin,
  Globe,
} from 'lucide-react';
import {
  DuolingoPath,
  LearningLesson,
  QuizQuestion,
  UserStats,
  UserProfile,
  SupportedLanguage,
  AnalyzedDocument,
} from '../types';
import { translations } from '../i18n/translations';
import { soundEffects } from '../utils/soundEffects';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { historyNavigationService } from '../services/historyNavigationService';
import { PATH_UNITS, getUnitForLesson, getPathUnits, PathUnit } from '../services/curriculumService';
import { DuolingoReminderBanner } from './DuolingoReminderBanner';
import { voiceService } from '../services/voiceService';

interface DuolingoPathViewProps {
  path?: DuolingoPath;
  userStats: UserStats;
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
  onClose?: () => void;
  onStatsUpdated: () => void;
  onOpenReminderModal?: () => void;
}

export const DuolingoPathView: React.FC<DuolingoPathViewProps> = ({
  path: initialPath,
  userStats,
  currentProfile,
  currentLanguage,
  onAwardXp,
  onClose,
  onStatsUpdated,
  onOpenReminderModal,
}) => {
  const t = translations[currentLanguage];

  const [path, setPath] = useState<DuolingoPath | undefined>(initialPath);
  const activeUnits = path ? getPathUnits(path) : [];
  const [allPaths, setAllPaths] = useState<DuolingoPath[]>([]);
  const [activeLesson, setActiveLesson] = useState<LearningLesson | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState<number>(userStats.hearts ?? 5);
  const [streakCombo, setStreakCombo] = useState(0);
  const [lessonXpEarned, setLessonXpEarned] = useState(0);
  const [isLessonFinished, setIsLessonFinished] = useState(false);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  // Custom Generator Modal State (Document + User Demand)
  const [isCustomGeneratorOpen, setIsCustomGeneratorOpen] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<AnalyzedDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [userRequestInput, setUserRequestInput] = useState<string>('');
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Gallery photo states (upload photo from device gallery / download card photo into gallery)
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDownloadingPhoto, setIsDownloadingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<string>('');
  const [galleryToast, setGalleryToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Voice State (Speech-to-Text / Text-to-Speech)
  const [speakingQuestionId, setSpeakingQuestionId] = useState<string | null>(null);

  // Dynamic Question Translation State across 130+ languages
  const [translatedQuestions, setTranslatedQuestions] = useState<
    Record<string, { question: string; options: string[]; explanation: string }>
  >({});
  const [isTranslatingQuestion, setIsTranslatingQuestion] = useState(false);

  const handleSpeakQuestion = (id: string, text: string) => {
    if (speakingQuestionId === id) {
      voiceService.stopSpeaking();
      setSpeakingQuestionId(null);
      return;
    }
    const langCode =
      currentLanguage === 'en' ? 'en-US' : currentLanguage === 'es' ? 'es-ES' : 'fr-FR';
    setSpeakingQuestionId(id);
    voiceService.speak(id, text, {
      lang: langCode,
      onStart: () => setSpeakingQuestionId(id),
      onEnd: () => setSpeakingQuestionId(null),
      onError: () => setSpeakingQuestionId(null),
    });
  };

  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
    };
  }, []);

  // Intercepte le bouton retour du téléphone pour fermer une leçon active sans quitter l'app
  useEffect(() => {
    if (!activeLesson) return;
    return historyNavigationService.registerHandler('duolingoActiveLesson', 90, () => {
      voiceService.stopSpeaking();
      setActiveLesson(null);
      setIsLessonFinished(false);
      return true;
    });
  }, [activeLesson]);

  // Intercepte le bouton retour pour fermer le modal de génération de sentier
  useEffect(() => {
    if (!isCustomGeneratorOpen) return;
    return historyNavigationService.registerHandler('duolingoGeneratorModal', 95, () => {
      setIsCustomGeneratorOpen(false);
      return true;
    });
  }, [isCustomGeneratorOpen]);

  // 100-Lesson Unit Navigation State
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<number | 'all'>('all');
  const unitRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const scrollToUnit = (unitNum: number) => {
    setSelectedUnitFilter('all');
    setTimeout(() => {
      unitRefs.current[unitNum]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const scrollToCurrentLesson = () => {
    setSelectedUnitFilter('all');
    setTimeout(() => {
      const activeNode = document.getElementById('lesson-active-node');
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  const reloadPathsAndDocs = () => {
    const paths = storageService.getDuolingoPaths();
    setAllPaths(paths);
    if (paths.length > 0 && !path) {
      setPath(paths[0]);
    }
    const docs = storageService.getDocuments();
    setAvailableDocs(docs);
    if (!selectedDocId && docs.length > 0) {
      setSelectedDocId(docs[0].id);
    }
  };

  useEffect(() => {
    if (initialPath) {
      setPath(initialPath);
    } else {
      const paths = storageService.getDuolingoPaths();
      setPath(paths.length > 0 ? paths[0] : undefined);
    }
    reloadPathsAndDocs();
  }, [initialPath]);

  const handleStartLesson = (lesson: LearningLesson) => {
    setActiveLesson(lesson);
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setStreakCombo(0);
    setLessonXpEarned(0);
    setCorrectAnswersCount(0);
    setIsLessonFinished(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswerChecked) return;
    soundEffects.playCardFlip();
    setSelectedOptionIdx(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOptionIdx === null || !activeLesson) return;

    const q = activeLesson.questions[currentQuestionIdx];
    const correct = selectedOptionIdx === q.correctIndex;
    setIsCorrect(correct);
    setIsAnswerChecked(true);

    if (correct) {
      soundEffects.playCorrect();
      setStreakCombo((prev) => prev + 1);
      setCorrectAnswersCount((prev) => prev + 1);
      const earned = (q.xpReward || 15) + streakCombo * 5;
      setLessonXpEarned((prev) => prev + earned);
    } else {
      soundEffects.playIncorrect();
      setStreakCombo(0);
      const remainingHearts = storageService.loseHeart();
      setHearts(remainingHearts);
      onStatsUpdated();
    }
  };

  const handleContinue = () => {
    if (!activeLesson) return;

    voiceService.stopSpeaking();
    setSpeakingQuestionId(null);

    if (currentQuestionIdx + 1 < activeLesson.questions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setIsAnswerChecked(false);
      setIsCorrect(false);
    } else {
      // Completed lesson
      setIsLessonFinished(true);
      soundEffects.playLevelUp();

      if (!path) return;

      // Calculate stars based on accuracy
      const accuracy = correctAnswersCount / activeLesson.questions.length;
      const starsEarned = accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : 1;

      // Update path in storage
      const updatedLessons = path.lessons.map((l) =>
        l.id === activeLesson.id ? { ...l, isCompleted: true, stars: Math.max(l.stars, starsEarned) } : l
      );
      const updatedPath: DuolingoPath = { ...path, lessons: updatedLessons };
      setPath(updatedPath);
      storageService.saveDuolingoPath(updatedPath);

      // Award XP
      const totalBonus = lessonXpEarned + 25;
      onAwardXp(totalBonus, `Leçon KIPO complétée : ${activeLesson.title}`);
      onStatsUpdated();

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#eab308', '#6366f1', '#ec4899'],
        });
      } catch {}
    }
  };

  const handleRefillHearts = () => {
    storageService.refillHearts();
    setHearts(5);
    onStatsUpdated();
  };

  // Generate a brand new 20-question path using Document Analysis + User Demand
  const handleGenerateCustomPath = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenError(null);

    const doc = availableDocs.find((d) => d.id === selectedDocId);
    if (!doc) {
      setGenError('Veuillez sélectionner un document de votre bibliothèque.');
      return;
    }

    setIsGeneratingPath(true);

    try {
      const sourceContent = `${doc.title}\n\nRÉSUMÉ DU COURS :\n${doc.summary}\n\nNOTIONS ET FORMULES CLÉS :\n${doc.keyConcepts.join('\n')}\n\n${doc.rawTextPreview || ''}`;

      const response = await apiService.generateLearningMaterial({
        sourceText: sourceContent,
        type: 'duolingo_path',
        questionCount: 20,
        subject: doc.title,
        profile: currentProfile,
        language: currentLanguage,
        userRequest: userRequestInput.trim() || undefined,
      });

      const docContext = {
        title: doc.title,
        subject: doc.title,
        summary: doc.summary,
        keyConcepts: doc.keyConcepts,
        rawTextPreview: doc.rawTextPreview,
        suggestedQuestions: doc.suggestedQuestions,
        userRequest: userRequestInput.trim(),
      };

      const newPath: DuolingoPath = storageService.buildFull100LessonPath(
        {
          id: `path-${Date.now()}`,
          documentId: doc.id,
          title: response.title || `Parcours : ${doc.title}`,
          subject: response.subject || doc.title,
          userRequest: userRequestInput.trim() || 'Compréhension globale & entraînement (100 Leçons)',
          createdAt: new Date().toISOString(),
          lessons: response.lessons || [],
          units: response.units || undefined,
        },
        docContext
      );

      storageService.saveDuolingoPath(newPath);
      setPath(newPath);
      reloadPathsAndDocs();
      setIsCustomGeneratorOpen(false);
      setUserRequestInput('');
      soundEffects.playLevelUp();
      onAwardXp(35, `Nouveau sentier KIPO généré pour : ${doc.title}`);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (err: any) {
      console.error(err);
      setGenError(err.message || 'Erreur lors de la génération du sentier KIPO.');
    } finally {
      setIsGeneratingPath(false);
    }
  };

  // Helper to draw rounded rectangle safely on any Canvas implementation
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  };

  // 1. Generate High-Resolution Achievement Photo Card for the User's Gallery
  const generateGalleryImage = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!path) return resolve(null);
      const canvas = document.createElement('canvas');
      canvas.width = 900;
      canvas.height = 1150;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // Deep emerald and slate background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 900, 1150);
      bgGrad.addColorStop(0, '#047857');
      bgGrad.addColorStop(0.4, '#065f46');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 900, 1150);

      // Decorative subtle glowing orbs
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.arc(820, 140, 220, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(80, 1020, 180, 0, Math.PI * 2);
      ctx.fill();

      // Main White Card Container with soft drop shadow
      const cardX = 45;
      const cardY = 45;
      const cardW = 810;
      const cardH = 1060;
      const cardR = 32;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 15;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
      ctx.fill();
      ctx.restore();

      // Card Header Banner
      const headerGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + 160);
      headerGrad.addColorStop(0, '#10b981');
      headerGrad.addColorStop(1, '#059669');
      ctx.fillStyle = headerGrad;
      ctx.beginPath();
      drawRoundedRect(ctx, cardX, cardY, cardW, 160, cardR);
      ctx.fill();
      // Fill bottom corners of header to keep them square
      ctx.fillRect(cardX, cardY + 120, cardW, 40);

      // Owl Mascot & Brand Title
      ctx.font = '900 46px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('🦉 KIPO', cardX + 40, cardY + 75);

      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#d1fae5';
      ctx.fillText("SENTIER D'APPRENTISSAGE OFFICIEL (100 LEÇONS)", cardX + 40, cardY + 115);

      // Current Date
      const dateStr = new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      ctx.textAlign = 'right';
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(dateStr, cardX + cardW - 40, cardY + 80);
      ctx.textAlign = 'left';

      // Sentier Title & Subject
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      const cleanTitle = path.title.length > 40 ? path.title.slice(0, 38) + '...' : path.title;
      ctx.fillText(cleanTitle, cardX + 40, cardY + 230);

      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText(`Matière : ${path.subject} • ${path.lessons.length} leçons progressives`, cardX + 40, cardY + 265);

      // User Profile Info Box
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      drawRoundedRect(ctx, cardX + 40, cardY + 300, cardW - 80, 105, 20);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#e2e8f0';
      ctx.stroke();

      const roleFr =
        currentProfile === 'professeur'
          ? 'Professeur'
          : currentProfile === 'etudiant'
          ? 'Étudiant'
          : 'Élève';

      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`👤 Apprenant : ${userStats.levelTitle || 'Membre KIPO'}`, cardX + 65, cardY + 348);

      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(
        `Rôle : ${roleFr}  •  Niveau ${userStats.level}  •  ${userStats.xp} XP au total`,
        cardX + 65,
        cardY + 382
      );

      // 4 Main Stats Boxes
      const completedLessons = path.lessons.filter((l) => l.isCompleted).length;
      const totalLessonsCount = path.lessons.length || 100;
      const totalStars = path.lessons.reduce((acc, l) => acc + l.stars, 0);
      const totalStarsMax = totalLessonsCount * 3;
      const totalQuestionsCount = path.lessons.reduce((acc, l) => acc + l.questions.length, 0);
      const validatedQuestionsCount = path.lessons
        .filter((l) => l.isCompleted)
        .reduce((acc, l) => acc + l.questions.length, 0);

      const statsCards = [
        {
          label: 'LEÇONS COMPLÉTÉES',
          val: `${completedLessons}/${totalLessonsCount}`,
          sub: `${Math.round((completedLessons / totalLessonsCount) * 100)}% accompli`,
          color: '#10b981',
        },
        {
          label: 'QUESTIONS VALIDÉES',
          val: `${validatedQuestionsCount}/${totalQuestionsCount}`,
          sub: 'Progression continue',
          color: '#06b6d4',
        },
        {
          label: 'SÉRIE KIPO',
          val: `🔥 ${userStats.streakDays} Jours`,
          sub: 'Assiduité quotidienne',
          color: '#f59e0b',
        },
        {
          label: 'ÉTOILES GAGNÉES',
          val: `⭐ ${totalStars}/${totalStarsMax}`,
          sub: 'Score d’excellence',
          color: '#eab308',
        },
      ];

      const boxW = (cardW - 80 - 20) / 2;
      const boxH = 115;

      statsCards.forEach((st, idx) => {
        const bx = cardX + 40 + (idx % 2) * (boxW + 20);
        const by = cardY + 430 + Math.floor(idx / 2) * (boxH + 20);

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        drawRoundedRect(ctx, bx, by, boxW, boxH, 18);
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#e2e8f0';
        ctx.stroke();

        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText(st.label, bx + 20, by + 32);

        ctx.font = '900 28px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(st.val, bx + 20, by + 72);

        ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = st.color;
        ctx.fillText(st.sub, bx + 20, by + 97);
      });

      // Motivational Box / Certificate Ribbon
      ctx.fillStyle = '#ecfdf5';
      ctx.beginPath();
      drawRoundedRect(ctx, cardX + 40, cardY + 720, cardW - 80, 140, 20);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#a7f3d0';
      ctx.stroke();

      ctx.font = '900 22px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#065f46';
      ctx.fillText('🏆 Certificat de Progression du Sentier KIPO', cardX + 65, cardY + 765);

      ctx.font = 'italic 16px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText(
        '« L’apprentissage régulier et interactif avec KIPO transforme l’effort en réussite. »',
        cardX + 65,
        cardY + 805
      );

      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#059669';
      ctx.fillText(
        `Vies préservées : ❤️ ${hearts}/5  •  Bonus d'XP : +${lessonXpEarned} XP`,
        cardX + 65,
        cardY + 835
      );

      // Footer Branding Watermark
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        'KIPO • Plateforme Éducative Internationale Propulsée par l’IA',
        cardX + cardW / 2,
        cardY + 980
      );
      ctx.textAlign = 'left';

      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  };

  // Download photo card directly into the device's gallery / downloads
  const handleDownloadProgressToGallery = async () => {
    if (!path) return;
    try {
      setIsDownloadingPhoto(true);
      const blob = await generateGalleryImage();
      if (!blob) throw new Error("Impossible de créer l'image de progression.");

      const fileTitle = (path.title || 'sentier')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 30);
      const fileName = `kipo-sentier-${fileTitle}.png`;

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);

      soundEffects.playLevelUp();
      setGalleryToast({
        message: '📸 Photo du sentier téléchargée avec succès dans votre galerie !',
        type: 'success',
      });
      setTimeout(() => setGalleryToast(null), 4500);

      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {}
    } catch (err: any) {
      console.error(err);
      setGalleryToast({
        message: err.message || 'Erreur lors du téléchargement de la photo.',
        type: 'error',
      });
      setTimeout(() => setGalleryToast(null), 4000);
    } finally {
      setIsDownloadingPhoto(false);
    }
  };

  // Upload/import photo of course/exercise from gallery and generate 20 questions path
  const handleUploadPhotoFromGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    setPhotoUploadProgress('Lecture et préparation de la photo...');

    try {
      const reader = new FileReader();
      const fileDataPromise = new Promise<{ base64: string; mimeType: string }>(
        (resolve, reject) => {
          reader.onload = () => {
            const res = reader.result as string;
            const matches = res.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
              resolve({ mimeType: matches[1], base64: matches[2] });
            } else {
              resolve({
                mimeType: file.type || 'image/jpeg',
                base64: res.split(',')[1] || res,
              });
            }
          };
          reader.onerror = reject;
        }
      );
      reader.readAsDataURL(file);

      const { base64, mimeType } = await fileDataPromise;
      setPhotoUploadProgress('Analyse de la photo et création éclair du Sentier KIPO...');

      const cleanPhotoTitle = file.name.replace(/\.[^/.]+$/, '');

      // Execute photo analysis and path curriculum in parallel for maximum speed
      const [analyzed, response] = await Promise.all([
        apiService.analyzeDocument({
          attachment: { mimeType, data: base64, name: file.name },
          profile: currentProfile,
          language: currentLanguage,
        }),
        apiService.generateLearningMaterial({
          attachment: { mimeType, data: base64, name: file.name },
          type: 'duolingo_path',
          questionCount: 10,
          subject: cleanPhotoTitle,
          profile: currentProfile,
          language: currentLanguage,
          userRequest: 'Sentier KIPO de 100 leçons progressives extrait de cette photo de cours',
        }),
      ]);

      const newDoc: AnalyzedDocument = {
        id: `doc-${Date.now()}`,
        fileName: file.name,
        fileType: 'image',
        title: analyzed.title || `Photo : ${cleanPhotoTitle}`,
        summary: analyzed.summary || 'Document analysé depuis une photo de la galerie.',
        keyConcepts: analyzed.keyConcepts || [],
        studyTip:
          analyzed.studyTip ||
          'Révisez les concepts clés de ce document pour maîtriser le sentier.',
        suggestedQuestions: analyzed.suggestedQuestions || [],
        rawTextPreview: analyzed.rawTextPreview || analyzed.summary,
        createdAt: new Date().toISOString(),
      };
      storageService.saveDocument(newDoc);

      const docContext = {
        title: newDoc.title,
        subject: newDoc.title,
        summary: newDoc.summary,
        keyConcepts: newDoc.keyConcepts,
        rawTextPreview: newDoc.rawTextPreview,
        suggestedQuestions: newDoc.suggestedQuestions,
      };

      const newPath: DuolingoPath = storageService.buildFull100LessonPath(
        {
          id: `path-${Date.now()}`,
          documentId: newDoc.id,
          title: response.title || `Sentier : ${newDoc.title}`,
          subject: response.subject || newDoc.title,
          userRequest: 'Créé à partir d’une photo de votre galerie (100 leçons)',
          createdAt: new Date().toISOString(),
          lessons: response.lessons || [],
          units: response.units || undefined,
        },
        docContext
      );

      storageService.saveDuolingoPath(newPath);
      setPath(newPath);
      reloadPathsAndDocs();
      soundEffects.playLevelUp();
      onAwardXp(50, `Sentier créé depuis photo de galerie : ${newDoc.title}`);

      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}

      setGalleryToast({
        message: `🎉 Sentier de 20 questions généré avec succès depuis « ${newDoc.title} » !`,
        type: 'success',
      });
      setTimeout(() => setGalleryToast(null), 5000);
    } catch (err: any) {
      console.error(err);
      setGalleryToast({
        message: err.message || "Erreur lors de l'analyse de la photo.",
        type: 'error',
      });
      setTimeout(() => setGalleryToast(null), 5000);
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress('');
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const currentQ: QuizQuestion | undefined = activeLesson?.questions[currentQuestionIdx];
  const qKey = currentQ ? `${currentQ.id || currentQuestionIdx}_${currentLanguage}` : '';

  // Auto-translate question if language is not French
  useEffect(() => {
    if (currentQ && currentLanguage !== 'fr') {
      const targetKey = `${currentQ.id || currentQuestionIdx}_${currentLanguage}`;
      if (!translatedQuestions[targetKey]) {
        setIsTranslatingQuestion(true);
        apiService
          .translateQuestion(currentQ, currentLanguage)
          .then((res) => {
            setTranslatedQuestions((prev) => ({
              ...prev,
              [targetKey]: res,
            }));
          })
          .catch((err) => console.error('Question translation error:', err))
          .finally(() => setIsTranslatingQuestion(false));
      }
    }
  }, [currentQ, currentLanguage, currentQuestionIdx]);

  const handleTranslateCurrentQuestion = async () => {
    if (!currentQ || isTranslatingQuestion) return;
    const targetKey = `${currentQ.id || currentQuestionIdx}_${currentLanguage}`;
    setIsTranslatingQuestion(true);
    try {
      const res = await apiService.translateQuestion(currentQ, currentLanguage);
      setTranslatedQuestions((prev) => ({
        ...prev,
        [targetKey]: res,
      }));
    } catch (err) {
      console.error('Manual question translation error:', err);
    } finally {
      setIsTranslatingQuestion(false);
    }
  };

  const activeQData: QuizQuestion | undefined = currentQ
    ? translatedQuestions[qKey]
      ? {
          ...currentQ,
          question: translatedQuestions[qKey].question,
          options: translatedQuestions[qKey].options,
          explanation: translatedQuestions[qKey].explanation,
        }
      : currentQ
    : undefined;

  const totalQuestionsInPath = path?.lessons ? path.lessons.reduce((acc, l) => acc + l.questions.length, 0) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 min-h-[calc(100vh-5rem)] flex flex-col justify-between relative">
      {/* Hidden file input for Photo Gallery upload */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUploadPhotoFromGallery}
      />

      {/* Floating Gallery Notification Toast */}
      {galleryToast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl font-black text-xs sm:text-sm flex items-center gap-2.5 animate-in slide-in-from-top duration-300 ${
            galleryToast.type === 'success'
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 border-2 border-emerald-400'
              : 'bg-rose-600 text-white shadow-rose-600/30 border-2 border-rose-400'
          }`}
        >
          <span>{galleryToast.message}</span>
        </div>
      )}

      {/* Loading Modal when uploading/analyzing photo from device gallery */}
      {isUploadingPhoto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border-4 border-emerald-500 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white mx-auto flex items-center justify-center text-3xl shadow-lg shadow-emerald-500/30 animate-bounce">
              🦉
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800">Photo de la galerie</h3>
              <p className="text-xs text-slate-500 font-bold">{photoUploadProgress}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xs pt-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Génération de votre sentier 20 questions...</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Duolingo Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border-2 border-slate-200/80 shadow-xs mb-4">
        <div className="flex items-center gap-2">
          {activeLesson ? (
            <button
              onClick={() => setActiveLesson(null)}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              title={t.duolingo.quitLesson}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : onClose ? (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-black flex items-center justify-center text-lg shadow-emerald-500/30 shadow-sm">
              🦉
            </div>
          )}

          <div>
            <h2 className="text-sm font-black text-slate-800 tracking-tight truncate max-w-[180px] sm:max-w-xs">
              {activeLesson ? activeLesson.title : path ? path.title : t.duolingo.title}
            </h2>
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              {path ? `${path.subject} • ${totalQuestionsInPath} questions` : t.duolingo.readyFirstCourse}
            </p>
          </div>
        </div>

        {/* Gamification Counters: Streak, Gems, Hearts */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hearts */}
          <div
            onClick={hearts === 0 ? handleRefillHearts : undefined}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full border-2 font-black text-xs transition-all ${
              hearts > 0
                ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-2xs'
                : 'bg-rose-600 text-white border-rose-700 animate-bounce cursor-pointer'
            }`}
            title={hearts === 0 ? t.duolingo.heartsEmpty : `${hearts} ${t.duolingo.heartsRemaining}`}
          >
            <Heart className={`w-4 h-4 fill-current ${hearts === 0 ? 'animate-ping' : ''}`} />
            <span>{hearts}</span>
          </div>

          {/* Gems */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-cyan-50 border-2 border-cyan-200 text-cyan-700 font-black text-xs shadow-2xs">
            <Gem className="w-4 h-4 text-cyan-500" />
            <span>{userStats.gems || 50}</span>
          </div>

          {/* Streak */}
          <div className="hidden xs:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-600 font-black text-xs shadow-2xs">
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>{userStats.streakDays}</span>
          </div>
        </div>
      </div>

      {/* VIEW A: Path Map (Sentier d'Apprentissage façon Duolingo) or Empty State */}
      {!activeLesson ? (
        !path ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5 bg-white rounded-3xl border-2 border-slate-200/80 shadow-xs my-auto">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/20 animate-bounce">
              🦉
            </div>
            <div className="max-w-md space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.duolingo.welcomeTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {t.duolingo.welcomeDesc}
              </p>
            </div>

            <div className="w-full max-w-sm space-y-2.5 pt-2">
              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:opacity-95 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>{t.duolingo.btnPhoto}</span>
              </button>

              <button
                onClick={() => setIsCustomGeneratorOpen(true)}
                className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-2xs"
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>{t.duolingo.btnCustomSubject}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 py-4 space-y-5">
            {/* Duolingo Home Screen Reminder & Notification Banner */}
            {onOpenReminderModal && (
              <DuolingoReminderBanner
                userStats={userStats}
                currentProfile={currentProfile}
                onOpenReminderModal={onOpenReminderModal}
              />
            )}

          {/* Top Banner with Generator Trigger */}
          <div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white p-5 rounded-3xl shadow-md border-b-4 border-emerald-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">
                  Parcours Document + Demande Personnalisée
                </span>
                <h3 className="text-xl font-black mt-0.5">{path.title}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner">
                🦉
              </div>
            </div>

            {/* User Request Badge if present */}
            {path.userRequest && (
              <div className="p-2.5 rounded-xl bg-white/15 border border-white/20 text-xs text-emerald-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  <strong>Votre demande prise en compte :</strong> « {path.userRequest} »
                </span>
              </div>
            )}

            {/* Global Course Progress Bar across 100 lessons */}
            <div className="pt-2 border-t border-white/20 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between text-xs text-emerald-100 font-bold gap-1">
                <span>{path.lessons.length} leçons progressives • {totalQuestionsInPath} questions adaptées</span>
                <span>
                  {path.lessons.filter((l) => l.isCompleted).length} / {path.lessons.length} leçons complétées ({Math.round((path.lessons.filter((l) => l.isCompleted).length / (path.lessons.length || 1)) * 100)}%)
                </span>
              </div>
              <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden p-0.5">
                <div
                  className="bg-amber-300 h-full rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${Math.max(2, (path.lessons.filter((l) => l.isCompleted).length / (path.lessons.length || 1)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
              <button
                type="button"
                onClick={scrollToCurrentLesson}
                className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                <span>📍 Aller à ma leçon active</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Bouton Télécharger une photo dans la galerie */}
                <button
                  type="button"
                  onClick={handleDownloadProgressToGallery}
                  disabled={isDownloadingPhoto}
                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
                  title="Télécharger la photo de votre progression dans la galerie de votre appareil"
                >
                  {isDownloadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>Télécharger photo dans la galerie</span>
                </button>

                {/* 2. Bouton Importer photo depuis la galerie */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 border border-white/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  title="Choisir une photo de cours dans votre galerie pour créer un sentier de 100 leçons"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Photo de la galerie</span>
                </button>

                {/* 3. Bouton Nouveau sentier Doc + Demande */}
                <button
                  type="button"
                  onClick={() => {
                    reloadPathsAndDocs();
                    setIsCustomGeneratorOpen(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-xs border border-white/30 transition-all cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                  <span>Nouveau Sentier (100L)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Switch saved paths carousel if multiple exist */}
          {allPaths.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                Mes sentiers :
              </span>
              {allPaths.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPath(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                    path.id === p.id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  {p.title} ({p.lessons?.length || 100}L)
                </button>
              ))}
            </div>
          )}

          {/* 10-Unit Navigation Quick Bar */}
          <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Les 10 Unités du Sentier (100 Leçons)</span>
              </span>
              <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {path.lessons.filter((l) => l.isCompleted).length} / 100 validées
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedUnitFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer border ${
                  selectedUnitFilter === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                }`}
              >
                Toutes (100)
              </button>
              {activeUnits.map((unit) => {
                const unitLessons = path.lessons.filter(
                  (l) => l.lessonNumber >= unit.startLesson && l.lessonNumber <= unit.endLesson
                );
                const unitCompletedCount = unitLessons.filter((l) => l.isCompleted).length;
                const isUnitCompleted = unitLessons.length > 0 && unitCompletedCount === unitLessons.length;

                return (
                  <button
                    key={unit.unitNumber}
                    type="button"
                    onClick={() => {
                      setSelectedUnitFilter(unit.unitNumber);
                      scrollToUnit(unit.unitNumber);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer border flex items-center gap-1 ${
                      selectedUnitFilter === unit.unitNumber
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : isUnitCompleted
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-300'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <span>{unit.badgeIcon}</span>
                    <span>U{unit.unitNumber}</span>
                    <span className="text-[10px] opacity-75">
                      ({unitCompletedCount}/10)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Winding Stepping Stones Path Grouped in 10 Units */}
          <div className="py-2 space-y-10 relative">
            {activeUnits.filter(
              (unit) => selectedUnitFilter === 'all' || selectedUnitFilter === unit.unitNumber
            ).map((unit) => {
              const unitLessons = path.lessons.filter(
                (l) => l.lessonNumber >= unit.startLesson && l.lessonNumber <= unit.endLesson
              );
              const unitCompletedCount = unitLessons.filter((l) => l.isCompleted).length;
              const isUnitFullyCompleted = unitLessons.length > 0 && unitCompletedCount === unitLessons.length;

              return (
                <div
                  key={unit.unitNumber}
                  ref={(el) => {
                    unitRefs.current[unit.unitNumber] = el;
                  }}
                  className="space-y-6 pt-2"
                >
                  {/* Unit Banner Header */}
                  <div
                    className="p-4 sm:p-5 rounded-3xl text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    style={{
                      background: `linear-gradient(135deg, ${unit.accentColor}, #0f172a)`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shadow-inner shrink-0">
                        {unit.badgeIcon}
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/80">
                          {unit.title} • Leçons {unit.startLesson} à {unit.endLesson}
                        </span>
                        <h4 className="text-base sm:text-lg font-black leading-snug">{unit.theme}</h4>
                        <p className="text-xs text-white/85 max-w-lg mt-0.5">{unit.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black block">
                          {unitCompletedCount}/10 leçons
                        </span>
                        <span className="text-[10px] text-white/80 font-bold">
                          {Math.round((unitCompletedCount / 10) * 100)}% validé
                        </span>
                      </div>
                      {isUnitFullyCompleted ? (
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md">
                          <Check className="w-5 h-5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-black">
                          {unitCompletedCount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stepping stones of this unit */}
                  <div className="py-4 flex flex-col items-center space-y-8 relative">
                    {unitLessons.map((lesson) => {
                      const overallIdx = path.lessons.findIndex((l) => l.id === lesson.id);
                      const isLocked = overallIdx > 0 && !path.lessons[overallIdx - 1].isCompleted;
                      const isCurrent = !lesson.isCompleted && !isLocked;

                      // Winding zigzag offsets
                      const offsets = ['translate-x-0', '-translate-x-12', 'translate-x-12', 'translate-x-0'];
                      const offsetClass = offsets[(lesson.lessonNumber - 1) % offsets.length];

                      return (
                        <div
                          key={lesson.id}
                          id={isCurrent ? 'lesson-active-node' : undefined}
                          className={`flex flex-col items-center ${offsetClass} relative group`}
                        >
                          {/* Stepping stone node button */}
                          <div className="relative">
                            {/* Floating Speech bubble on current step */}
                            {isCurrent && (
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 bg-white border-2 border-emerald-500 rounded-full font-black text-xs text-emerald-600 shadow-md animate-bounce z-10">
                                LEÇON {lesson.lessonNumber} !
                              </div>
                            )}

                            <button
                              onClick={() => !isLocked && handleStartLesson(lesson)}
                              disabled={isLocked}
                              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                                lesson.isCompleted
                                  ? 'bg-amber-400 hover:bg-amber-500 text-white border-b-4 border-amber-600 shadow-md hover:scale-105 active:border-b-0 active:translate-y-1'
                                  : isCurrent
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-b-4 border-emerald-700 shadow-lg shadow-emerald-500/40 hover:scale-110 active:border-b-0 active:translate-y-1 animate-pulse'
                                  : 'bg-slate-200 text-slate-400 border-b-4 border-slate-300 cursor-not-allowed'
                              }`}
                            >
                              {lesson.isCompleted ? (
                                <Check className="w-8 h-8 stroke-[3]" />
                              ) : isLocked ? (
                                <Lock className="w-7 h-7" />
                              ) : (
                                <Star className="w-8 h-8 fill-white" />
                              )}
                            </button>
                          </div>

                          {/* Stars rating below node */}
                          {lesson.isCompleted && (
                            <div className="flex items-center gap-0.5 mt-2">
                              {[1, 2, 3].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= lesson.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Label title */}
                          <div className="text-center mt-1.5 max-w-[170px]">
                            <span className="text-xs font-black text-slate-800 block leading-tight">
                              {lesson.title}
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">
                              {lesson.questions.length} questions • Leçon {lesson.lessonNumber}/100
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Milestone Chest for this Unit */}
                    {unit.unitNumber < 10 && (
                      <div className="pt-2 pb-2 flex flex-col items-center text-center space-y-1.5">
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md border-b-4 transition-all ${
                            isUnitFullyCompleted
                              ? 'bg-gradient-to-tr from-amber-400 to-amber-500 text-white border-amber-700 animate-bounce'
                              : 'bg-slate-200 text-slate-400 border-slate-300'
                          }`}
                        >
                          <Trophy className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-black text-slate-800">
                          Coffre d’Étape Unité {unit.unitNumber} ({unit.endLesson}/100)
                        </span>
                        <span className="text-[11px] font-bold text-slate-500">
                          {isUnitFullyCompleted
                            ? '🎉 Étape validée ! +150 XP bonus'
                            : `Valide les ${10 - unitCompletedCount} leçons restantes de cette unité`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Grand Finale Coffre Suprême at Lesson 100 */}
            <div className="pt-8 flex flex-col items-center text-center space-y-3 pb-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 text-white flex items-center justify-center shadow-xl border-b-4 border-amber-700 hover:scale-105 transition-transform animate-pulse">
                <Trophy className="w-14 h-14" />
              </div>
              <div>
                <span className="text-base font-black text-slate-900 block">
                  Grand Coffre de Maîtrise Suprême (Leçon 100/100)
                </span>
                <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                  Le Sacre du Grand Maître KIPO
                </span>
              </div>

              {/* Bouton Télécharger la photo dans la galerie */}
              <button
                type="button"
                onClick={handleDownloadProgressToGallery}
                disabled={isDownloadingPhoto}
                className="mt-2 px-5 py-3 rounded-2xl bg-white border-2 border-slate-200 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isDownloadingPhoto ? (
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                ) : (
                  <Download className="w-4 h-4 text-emerald-600" />
                )}
                <span>Télécharger la photo du sentier (100 leçons) dans la galerie</span>
              </button>
            </div>
          </div>
        </div>
        )
      ) : isLessonFinished ? (
        /* VIEW B: Lesson Finish Celebration Screen */
        <div className="bg-white rounded-3xl p-6 sm:p-10 border-2 border-slate-200 text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-24 h-24 rounded-3xl bg-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30 border-b-4 border-emerald-700 animate-bounce">
            <Trophy className="w-12 h-12" />
          </div>

          <div>
            <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-1">
              {t.duolingo.completedTitle} ({activeLesson?.lessonNumber || 1})
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.duolingo.lessonFinishedTitle}
            </h2>
            <p className="text-sm font-bold text-slate-500 mt-1">
              {activeLesson?.title}
            </p>
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
            <div className="p-3 bg-amber-50 rounded-2xl border-2 border-amber-200 text-center">
              <span className="block text-2xl font-black text-amber-600">
                +{lessonXpEarned + 25}
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                XP TOTAL
              </span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-200 text-center">
              <span className="block text-2xl font-black text-emerald-600">
                {Math.round((correctAnswersCount / (activeLesson?.questions.length || 1)) * 100)}%
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                PRÉCISION
              </span>
            </div>

            <div className="p-3 bg-cyan-50 rounded-2xl border-2 border-cyan-200 text-center">
              <span className="block text-2xl font-black text-cyan-600">+10</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                LINGOTS 💎
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleDownloadProgressToGallery}
              disabled={isDownloadingPhoto}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white border-2 border-slate-300 hover:border-emerald-500 text-slate-800 hover:text-emerald-700 font-black text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDownloadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Download className="w-4 h-4 text-emerald-600" />
              )}
              <span>{t.duolingo.downloadGallery}</span>
            </button>

            {(() => {
              if (!path) return null;
              const nextLesson = path.lessons.find((l) => l.lessonNumber === (activeLesson?.lessonNumber || 0) + 1);
              if (nextLesson) {
                return (
                  <button
                    type="button"
                    onClick={() => handleStartLesson(nextLesson)}
                    className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:translate-y-1 active:border-b-0 text-white font-black text-xs uppercase tracking-wider border-b-4 border-indigo-900 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Leçon suivante ({nextLesson.lessonNumber}/100)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                );
              }
              return null;
            })()}

            <button
              type="button"
              onClick={() => setActiveLesson(null)}
              className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:translate-y-1 active:border-b-0 text-white font-black text-xs uppercase tracking-wider border-b-4 border-emerald-700 shadow-md transition-all cursor-pointer"
            >
              Voir le Sentier (100L)
            </button>
          </div>
        </div>
      ) : currentQ ? (
        /* VIEW C: Duolingo Interactive Question Screen */
        <div className="flex-1 flex flex-col justify-between space-y-6">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-wider">
              <span>Question {currentQuestionIdx + 1} / {activeLesson.questions.length}</span>
              <span>{Math.round(((currentQuestionIdx + 1) / activeLesson.questions.length) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden p-0.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIdx + 1) / activeLesson.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Prompt with Mascot Speech Bubble */}
          <div className="flex items-start gap-3 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-400 to-emerald-600 text-white flex items-center justify-center text-3xl shrink-0 shadow-md shadow-emerald-500/20">
              🦉
            </div>
            <div className="relative flex-1 bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-2xs flex items-center justify-between gap-3">
              <div className="absolute -left-2 top-4 w-3 h-3 bg-white border-l-2 border-b-2 border-slate-200 rotate-45" />
              <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug flex-1">
                {(activeQData || currentQ).question}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                {currentLanguage !== 'fr' && (
                  <button
                    type="button"
                    onClick={handleTranslateCurrentQuestion}
                    disabled={isTranslatingQuestion}
                    className={`px-2.5 py-2 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-2xs ${
                      isTranslatingQuestion
                        ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                        : translatedQuestions[qKey]
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}
                    title={t.duolingo.translateQuestion}
                  >
                    {isTranslatingQuestion ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    ) : (
                      <Globe className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">
                      {isTranslatingQuestion
                        ? t.duolingo.translatingQuestion
                        : t.duolingo.translateQuestion}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleSpeakQuestion(
                      currentQ.id || `q-${currentQuestionIdx}`,
                      (activeQData || currentQ).question
                    )
                  }
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs ${
                    speakingQuestionId === (currentQ.id || `q-${currentQuestionIdx}`)
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs animate-pulse'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                  }`}
                  title="Écouter la question à voix haute"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* 4 Chunky Duolingo-style Options */}
          <div className="grid grid-cols-1 gap-3 py-2">
            {(activeQData || currentQ).options.map((option, idx) => {
              const isSelected = selectedOptionIdx === idx;
              let btnClass = 'bg-white border-2 border-b-4 border-slate-200 hover:bg-slate-50 text-slate-800';

              if (isAnswerChecked) {
                if (idx === currentQ.correctIndex) {
                  btnClass = 'bg-emerald-50 border-2 border-b-4 border-emerald-500 text-emerald-900 font-bold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 border-2 border-b-4 border-rose-400 text-rose-900 font-bold';
                } else {
                  btnClass = 'bg-slate-100 border-slate-200 text-slate-400 opacity-60';
                }
              } else if (isSelected) {
                btnClass = 'bg-indigo-50/80 border-2 border-b-4 border-indigo-600 text-indigo-900 font-bold ring-2 ring-indigo-200';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerChecked}
                  className={`p-4 rounded-2xl text-left text-sm font-semibold transition-all flex items-center justify-between cursor-pointer active:translate-y-0.5 active:border-b-2 ${btnClass}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isSelected || (isAnswerChecked && idx === currentQ.correctIndex)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isAnswerChecked && idx === currentQ.correctIndex && (
                    <Check className="w-5 h-5 text-emerald-600 shrink-0 stroke-[3]" />
                  )}
                  {isAnswerChecked && isSelected && idx !== currentQ.correctIndex && (
                    <X className="w-5 h-5 text-rose-500 shrink-0 stroke-[3]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Duolingo Signature Bottom Drawer */}
          <div
            className={`-mx-4 -mb-4 p-4 sm:p-5 border-t-2 transition-all ${
              !isAnswerChecked
                ? 'bg-white border-slate-200'
                : isCorrect
                ? 'bg-emerald-100 border-emerald-300 animate-in slide-in-from-bottom duration-200'
                : 'bg-rose-100 border-rose-300 animate-in slide-in-from-bottom duration-200'
            }`}
          >
            <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              {isAnswerChecked && (
                <div className="space-y-0.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {isCorrect ? (
                      <>
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <span className="text-base font-black text-emerald-800">
                          {t.duolingo.correct}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center">
                          <X className="w-4 h-4 stroke-[3]" />
                        </div>
                        <span className="text-base font-black text-rose-800">
                          {t.duolingo.incorrect}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 font-medium max-w-md">
                    {(activeQData || currentQ).explanation}
                  </p>
                </div>
              )}

              {/* Action Button: Vérifier or Continuer */}
              <div className="w-full sm:w-auto">
                {!isAnswerChecked ? (
                  <button
                    onClick={handleCheckAnswer}
                    disabled={selectedOptionIdx === null}
                    className="w-full sm:w-44 py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white disabled:text-slate-400 font-black text-sm uppercase tracking-wider border-b-4 border-emerald-700 disabled:border-slate-300 shadow-md transition-all cursor-pointer disabled:cursor-not-allowed active:translate-y-1 active:border-b-0"
                  >
                    {t.duolingo.check}
                  </button>
                ) : (
                  <button
                    onClick={handleContinue}
                    className={`w-full sm:w-44 py-3.5 px-6 rounded-2xl text-white font-black text-sm uppercase tracking-wider border-b-4 shadow-md transition-all cursor-pointer active:translate-y-1 active:border-b-0 ${
                      isCorrect
                        ? 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'
                        : 'bg-rose-500 hover:bg-rose-600 border-rose-700'
                    }`}
                  >
                    {t.duolingo.continueBtn}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: CUSTOM DUOLINGO GENERATOR (DOCUMENT + USER DEMAND) */}
      {isCustomGeneratorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border-2 border-emerald-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🦉</span>
                <span>Créer un Sentier KIPO Personnalisé (20 questions)</span>
              </h3>
              <button
                onClick={() => setIsCustomGeneratorOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateCustomPath} className="space-y-4">
              {/* Step 1: Select Document */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  1. Document source (cours, PDF ou texte analysé) :
                </label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 focus:border-emerald-500 outline-hidden"
                >
                  {availableDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      📄 {doc.title} ({doc.fileType.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Specific User Demand */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 block">
                  2. Votre demande spécifique pour ce parcours :
                </label>
                <textarea
                  rows={3}
                  value={userRequestInput}
                  onChange={(e) => setUserRequestInput(e.target.value)}
                  placeholder="Ex : Insiste particulièrement sur les formules de calcul, pose des questions pièges, niveau débutant, ou prépare-moi au contrôle..."
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                />

                {/* Quick suggestion chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    '🎯 Préparation au contrôle de demain',
                    '📐 Insister sur les formules & calculs',
                    '🧠 Questions pièges & subtilités',
                    '🌱 Explications simples pour débutant',
                    '⏱️ Définitions & vocabulaire clé',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setUserRequestInput(chip)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {genError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {genError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomGeneratorOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={isGeneratingPath || !selectedDocId}
                  className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 text-white font-black text-xs uppercase tracking-wider border-b-4 border-emerald-700 shadow-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isGeneratingPath ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Génération des 20 questions selon votre demande...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Générer le Sentier KIPO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
