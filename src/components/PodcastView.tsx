import React, { useState, useEffect, useRef } from 'react';
import {
  Headphones,
  Mic,
  Upload,
  FileText,
  Image as ImageIcon,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Clock,
  BookOpen,
  Award,
  HelpCircle,
  Radio,
  Share2,
  FileCheck,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import {
  EducationalPodcast,
  PodcastFormat,
  UserProfile,
  SupportedLanguage,
} from '../types';
import { podcastService, GeneratePodcastParams } from '../services/podcastService';

interface PodcastViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
}

export const PodcastView: React.FC<PodcastViewProps> = ({
  currentProfile,
  currentLanguage,
  onAwardXp,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'player' | 'library'>('create');
  const [problemOrTopic, setProblemOrTopic] = useState('');
  const [format, setFormat] = useState<PodcastFormat>('dialogue');
  const [tone, setTone] = useState<'dynamique' | 'pedagogique' | 'examen'>('dynamique');
  const [level, setLevel] = useState<'college' | 'lycee' | 'etudiant' | 'pro'>('lycee');

  // Uploaded documents & photos
  const [attachedFiles, setAttachedFiles] = useState<
    Array<{
      id: string;
      name: string;
      mimeType: string;
      data: string; // base64
      type: 'image' | 'pdf' | 'text';
      size: number;
    }>
  >([]);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Active Podcast & Playback State
  const [currentPodcast, setCurrentPodcast] = useState<EducationalPodcast | null>(null);
  const [savedPodcasts, setSavedPodcasts] = useState<EducationalPodcast[]>(() =>
    podcastService.getSavedPodcasts()
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  // Subscribe to playback events
  useEffect(() => {
    const unsubLine = podcastService.onLineChange((idx) => {
      setActiveLineIndex(idx);
      // Auto-scroll active line into view
      const lineEl = document.getElementById(`dialogue-line-${idx}`);
      if (lineEl && transcriptContainerRef.current) {
        lineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    const unsubState = podcastService.onStateChange((playing, paused) => {
      setIsPlaying(playing);
      setIsPaused(paused);
    });

    return () => {
      unsubLine();
      unsubState();
      podcastService.stopPlayback();
    };
  }, []);

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');

      if (!isImage && !isPdf && !isText) {
        setError(`Le format du fichier "${file.name}" n'est pas supporté (Images, PDF ou Texte uniquement).`);
        return;
      }

      if (file.size > 20 * 1024 * 1024) {
        setError(`Le fichier "${file.name}" dépasse la limite maximale de 20 Mo.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const cleanBase64 = result.includes('base64,') ? result.split('base64,')[1] : result;

        setAttachedFiles((prev) => [
          ...prev,
          {
            id: 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            name: file.name,
            mimeType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            data: cleanBase64,
            type: isImage ? 'image' : isPdf ? 'pdf' : 'text',
            size: file.size,
          },
        ]);
        setError(null);
      };

      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Generate Podcast Action
  const handleGeneratePodcast = async () => {
    if (!problemOrTopic.trim() && attachedFiles.length === 0) {
      setError("Veuillez saisir votre sujet ou joindre au moins un document/photo.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGenerationStep("1/3 : Analyse approfondie de votre énoncé et des documents joints...");

    try {
      setTimeout(() => {
        setGenerationStep("2/3 : Écriture du scénario audio pédagogique et des répliques...");
      }, 1400);

      setTimeout(() => {
        setGenerationStep("3/3 : Finalisation des chapitres et préparation du studio audio...");
      }, 2800);

      const params: GeneratePodcastParams = {
        problemOrTopic: problemOrTopic.trim(),
        files: attachedFiles.map((f) => ({
          name: f.name,
          mimeType: f.mimeType,
          data: f.data,
          type: f.type,
        })),
        format,
        tone,
        level,
        language: currentLanguage || 'fr',
      };

      const podcast = await podcastService.generatePodcast(params);

      setCurrentPodcast(podcast);
      setSavedPodcasts(podcastService.getSavedPodcasts());
      setActiveTab('player');
      setActiveLineIndex(0);
      setSelectedQuizAnswers({});
      setQuizScore(null);
      onAwardXp(30, 'Création d’un podcast audio KIPO');

      // Start playing automatically
      setTimeout(() => {
        podcastService.startPlayback(podcast, 0);
      }, 400);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossible de générer le podcast audio. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Playback handlers
  const handleTogglePlay = () => {
    if (!currentPodcast) return;
    if (isPlaying && !isPaused) {
      podcastService.pausePlayback();
    } else if (isPaused) {
      podcastService.resumePlayback();
    } else {
      podcastService.startPlayback(currentPodcast, activeLineIndex);
    }
  };

  const handleRestart = () => {
    if (!currentPodcast) return;
    podcastService.startPlayback(currentPodcast, 0);
  };

  const handleSkipForward = () => {
    if (!currentPodcast) return;
    const nextIdx = Math.min(activeLineIndex + 1, currentPodcast.script.length - 1);
    podcastService.jumpToLine(nextIdx);
  };

  const handleSkipBack = () => {
    if (!currentPodcast) return;
    const prevIdx = Math.max(activeLineIndex - 1, 0);
    podcastService.jumpToLine(prevIdx);
  };

  const handleChangeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    podcastService.setPlaybackRate(speed);
  };

  const handleSelectSavedPodcast = (pod: EducationalPodcast) => {
    if (!pod) return;
    const safePod: EducationalPodcast = {
      ...pod,
      chapters: Array.isArray(pod.chapters) ? pod.chapters : [],
      script:
        Array.isArray(pod.script) && pod.script.length > 0
          ? pod.script
          : [
              {
                id: 'l1',
                speaker: 'Léa',
                speakerId: 'lea',
                text: pod.summary || pod.title,
                durationSeconds: 6,
              },
            ],
      hosts:
        Array.isArray(pod.hosts) && pod.hosts.length > 0
          ? pod.hosts
          : [
              { id: 'lea', name: 'Léa', role: 'Animatrice', gender: 'female' },
              { id: 'alex', name: 'Alex', role: 'Expert Pédagogue', gender: 'male' },
            ],
      takeaways: Array.isArray(pod.takeaways) ? pod.takeaways : [],
      topicsCovered: Array.isArray(pod.topicsCovered) ? pod.topicsCovered : [],
      quizQuestions: Array.isArray(pod.quizQuestions) ? pod.quizQuestions : [],
    };
    setCurrentPodcast(safePod);
    setActiveTab('player');
    setActiveLineIndex(0);
    setSelectedQuizAnswers({});
    setQuizScore(null);
    podcastService.startPlayback(safePod, 0);
  };

  const handleDeleteSavedPodcast = (podId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    podcastService.deletePodcastFromStorage(podId);
    setSavedPodcasts(podcastService.getSavedPodcasts());
    if (currentPodcast?.id === podId) {
      podcastService.stopPlayback();
      setCurrentPodcast(null);
      setActiveTab('create');
    }
  };

  const handleDownloadScript = () => {
    if (!currentPodcast) return;
    const chapters = Array.isArray(currentPodcast.chapters) ? currentPodcast.chapters : [];
    const script = Array.isArray(currentPodcast.script) ? currentPodcast.script : [];
    const takeaways = Array.isArray(currentPodcast.takeaways) ? currentPodcast.takeaways : [];
    const formattedDate =
      currentPodcast.createdAt && !isNaN(new Date(currentPodcast.createdAt).getTime())
        ? new Date(currentPodcast.createdAt).toLocaleDateString('fr-FR')
        : 'Récemment';

    const lines = [
      `Titre : ${currentPodcast.title}`,
      `Sous-titre : ${currentPodcast.subtitle || ''}`,
      `Durée estimée : ~${currentPodcast.durationEstimateMinutes || 3} minutes`,
      `Date : ${formattedDate}`,
      '',
      '=== CHAPITRES ===',
      ...chapters.map((ch) => `[${ch.timestamp || '00:00'}] ${ch.title}`),
      '',
      '=== TRANSCRIPTION INTÉGRALE ===',
      ...script.map((l) => `${(l.speaker || 'INTERVENANT').toUpperCase()} : ${l.text}`),
      '',
      '=== CE QU\'IL FAUT RETENIR ===',
      ...takeaways.map((t, idx) => `${idx + 1}. ${t}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kipo-podcast-${currentPodcast.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentSpeaker = currentPodcast?.script[activeLineIndex];
  const activeHost = currentPodcast?.hosts.find(
    (h) => h.id === currentSpeaker?.speakerId || h.name === currentSpeaker?.speaker
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-purple-800/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-400/20 text-purple-300 text-xs font-black border border-purple-400/30">
              <Radio className="w-3.5 h-3.5 animate-pulse text-purple-400" />
              <span>KIPO PODCAST STUDIO • IA VOCALE MULTIMODALE</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Podcasts Audio Pédagogiques</span>
              <span className="text-2xl">🎙️</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
              Rédigez un problème, envoyez une photo d'exercice, un PDF ou vos cours : l'application crée un podcast audio interactif et vivant pour réviser partout !
            </p>
          </div>

          {/* Quick Stats or Current playing chip */}
          {isPlaying && (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-pulse">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <div className="text-xs font-bold">
                <p className="text-emerald-300 text-[10px] uppercase font-black">En lecture vocale</p>
                <p className="truncate max-w-[160px] text-white">{currentPodcast?.title}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-purple-800/40">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white text-purple-950 shadow-md'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Nouveau Podcast</span>
          </button>

          <button
            onClick={() => currentPodcast && setActiveTab('player')}
            disabled={!currentPodcast}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-white text-purple-950 shadow-md'
                : 'text-purple-200 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <Headphones className="w-4 h-4 text-indigo-600" />
            <span>Lecteur & Script {currentPodcast && '(Actif)'}</span>
          </button>

          <button
            onClick={() => {
              setSavedPodcasts(podcastService.getSavedPodcasts());
              setActiveTab('library');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-white text-purple-950 shadow-md'
                : 'text-purple-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Mes Podcasts ({savedPodcasts.length})</span>
          </button>
        </div>
      </div>

      {/* Error message banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 1: CREATOR VIEW (Form, Multimodal upload & settings) */}
      {/* ======================================================== */}
      {activeTab === 'create' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>Créer un Podcast Audio sur-mesure</span>
              <Mic className="w-5 h-5 text-purple-600" />
            </h2>
            <p className="text-xs text-slate-500">
              Tapez un problème, collez un cours ou importez vos photos & documents d'exercices.
            </p>
          </div>

          {/* 1. Problem / Subject Input */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              1. Votre sujet, problème ou énoncé d'exercice
            </label>
            <textarea
              value={problemOrTopic}
              onChange={(e) => setProblemOrTopic(e.target.value)}
              placeholder="Ex: Explique-moi le théorème de Pythagore et résous l'exercice 2 de la photo jointe..."
              rows={4}
              className="w-full p-4 rounded-2xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all font-medium leading-relaxed"
            />
          </div>

          {/* 2. File Upload Box (Photos, PDFs, Docs) */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              2. Photos & Documents joints (Optionnel mais recommandé)
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/40 hover:bg-purple-50/70 p-6 rounded-2xl text-center cursor-pointer transition-all space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,application/pdf,text/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-white text-purple-600 shadow-xs flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                Glissez vos photos d'exercices, PDF ou fiches de cours
              </p>
              <p className="text-[11px] text-slate-500">
                Prenez une photo de votre devoir ou choisissez un PDF (Max 20 Mo)
              </p>
            </div>

            {/* Uploaded files preview chips */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-purple-900 shadow-2xs"
                  >
                    {file.type === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    )}
                    <span className="truncate max-w-[180px] text-[11px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 rounded-lg hover:bg-purple-200/60 text-purple-700 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Format Selection Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
              3. Style & Format du Podcast
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  id: 'dialogue' as PodcastFormat,
                  title: 'Duo d’Animateurs',
                  desc: 'Léa & Alex : dynamique, complice et interactif.',
                  badge: 'Populaire',
                  icon: '👥',
                },
                {
                  id: 'solo_teacher' as PodcastFormat,
                  title: 'Cours Magistral',
                  desc: 'Professeur bienveillant, clair et structuré.',
                  badge: 'Posé',
                  icon: '🎓',
                },
                {
                  id: 'express_3min' as PodcastFormat,
                  title: 'Flash 3 Minutes',
                  desc: 'Condensé et percutant avant une interro.',
                  badge: 'Express',
                  icon: '⚡',
                },
                {
                  id: 'storytelling' as PodcastFormat,
                  title: 'Storytelling',
                  desc: 'Récit immersif et anecdotes passionnantes.',
                  badge: 'Immersion',
                  icon: '📖',
                },
              ].map((f) => (
                <div
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    format === f.id
                      ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-2 ring-purple-200'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{f.icon}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        format === f.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {f.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">{f.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Tone & Level Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Niveau d'explication
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              >
                <option value="college">Collège (6e - 3e)</option>
                <option value="lycee">Lycée (2nde - Terminale / Bac)</option>
                <option value="etudiant">Enseignement Supérieur (BTS, Licence, Prépa)</option>
                <option value="pro">Adulte / Professionnel</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider">
                Ton audio
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-400"
              >
                <option value="dynamique">Dynamique & Vivant (Radio / Podcast)</option>
                <option value="pedagogique">Pédagogique & Méthodique (Pas à pas)</option>
                <option value="examen">Focus Examen & Pièges à éviter</option>
              </select>
            </div>
          </div>

          {/* Submit Generator Button */}
          <div className="pt-3">
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGeneratePodcast}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white font-black text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-3 active:scale-98"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{generationStep || 'Génération du podcast audio en cours...'}</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>🎙️ Générer mon Podcast Audio avec l'IA</span>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">
              Génération complète avec voix naturelle, script interactif, chapitrage et quiz d'écoute.
            </p>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ACTIVE PLAYER & SYNCHRONIZED TRANSCRIPT           */}
      {/* ======================================================== */}
      {activeTab === 'player' && currentPodcast && (
        <div className="space-y-6">
          {/* Main Podcast Cover & Player Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-md space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-500 text-white flex items-center justify-center text-3xl shadow-md shrink-0">
                  🎧
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                      {currentPodcast.subject}
                    </span>
                    <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{currentPodcast.durationEstimateMinutes} min
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight mt-0.5">
                    {currentPodcast.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">{currentPodcast.subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadScript}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Télécharger le script texte"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Script .TXT</span>
                </button>
              </div>
            </div>

            {/* Live Speaking Host Status Pill */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 via-indigo-50/50 to-slate-50 border border-purple-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-purple-300 text-purple-700 font-black flex items-center justify-center text-sm shadow-xs">
                  {currentSpeaker?.speaker?.substring(0, 2).toUpperCase() || '🎙️'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {currentSpeaker?.speaker || 'Animateur'}
                    </span>
                    {isPlaying && !isPaused && (
                      <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Au micro
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {activeHost?.role || 'Animateur du podcast'}
                  </p>
                </div>
              </div>

              {/* Animated Sound Equalizer bars when speaking */}
              {isPlaying && !isPaused && (
                <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-purple-200 shadow-2xs">
                  <span className="w-1 h-4 bg-purple-500 rounded-full animate-bounce" />
                  <span className="w-1 h-6 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                  <span className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                  <span className="w-1 h-5 bg-purple-600 rounded-full animate-bounce [animation-delay:0.45s]" />
                </div>
              )}
            </div>

            {/* Big Audio Player Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white shadow-lg">
              {/* Play / Skip / Restart Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRestart}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Recommencer depuis le début"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  onClick={handleSkipBack}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Réplique précédente"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center transition-all shadow-md cursor-pointer active:scale-95"
                  title={isPlaying && !isPaused ? 'Mettre en pause' : 'Écouter'}
                >
                  {isPlaying && !isPaused ? (
                    <Pause className="w-6 h-6 fill-white" />
                  ) : (
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleSkipForward}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                  title="Réplique suivante"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Progress counter & Scrubber */}
              <div className="flex-1 w-full sm:max-w-xs space-y-1">
                <div className="flex justify-between text-[11px] font-bold text-slate-400">
                  <span>
                    Réplique {activeLineIndex + 1} / {currentPodcast.script.length}
                  </span>
                  <span>{Math.round(((activeLineIndex + 1) / currentPodcast.script.length) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((activeLineIndex + 1) / currentPodcast.script.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Playback speed buttons */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl">
                {[0.8, 1.0, 1.25, 1.5].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleChangeSpeed(spd)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                      playbackSpeed === spd
                        ? 'bg-emerald-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* Chapters Bar */}
            {currentPodcast.chapters.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  Chapitres de l'épisode
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentPodcast.chapters.map((ch, idx) => {
                    const targetLineIndex = Math.min(
                      Math.floor((idx / currentPodcast.chapters.length) * currentPodcast.script.length),
                      currentPodcast.script.length - 1
                    );
                    const isPassed = activeLineIndex >= targetLineIndex;
                    return (
                      <button
                        key={ch.id || idx}
                        onClick={() => podcastService.jumpToLine(targetLineIndex)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                          isPassed
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-75">{ch.timestamp}</span>
                        <span>{ch.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Synchronized Script Transcript */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>Transcription en direct (Karaoké Synchronisé)</span>
                <Volume2 className="w-4 h-4 text-purple-600" />
              </h3>
              <span className="text-[11px] text-slate-400">
                Cliquez sur une réplique pour écouter à partir de ce moment
              </span>
            </div>

            <div
              ref={transcriptContainerRef}
              className="space-y-3 max-h-[460px] overflow-y-auto pr-2 scroll-smooth"
            >
              {currentPodcast.script.map((line, idx) => {
                const isActive = activeLineIndex === idx;
                const isLéa = line.speaker.toLowerCase().includes('léa');

                return (
                  <div
                    key={line.id || idx}
                    id={`dialogue-line-${idx}`}
                    onClick={() => podcastService.jumpToLine(idx)}
                    className={`p-3.5 sm:p-4 rounded-2xl transition-all cursor-pointer border ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300 ring-2 ring-purple-200 shadow-xs scale-[1.01]'
                        : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-md ${
                            isLéa
                              ? 'bg-purple-200 text-purple-900'
                              : 'bg-indigo-200 text-indigo-900'
                          }`}
                        >
                          {line.speaker}
                        </span>
                        {line.tone && (
                          <span className="text-[10px] text-slate-400 font-medium italic">
                            ({line.tone})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        #{idx + 1}
                      </span>
                    </div>
                    <p
                      className={`text-xs sm:text-sm leading-relaxed ${
                        isActive ? 'text-slate-900 font-bold' : 'text-slate-700 font-medium'
                      }`}
                    >
                      {line.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key Takeaways Card */}
          {currentPodcast.takeaways.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white rounded-3xl p-5 sm:p-7 border border-emerald-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-black text-sm uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Ce qu'il faut absolument retenir (Fiche Mémoire)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {currentPodcast.takeaways.map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-emerald-200 text-xs text-slate-800 font-medium leading-relaxed shadow-2xs flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{takeaway}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Mini-Quiz from Podcast */}
          {currentPodcast.quizQuestions && currentPodcast.quizQuestions.length > 0 && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Validation d'écoute (Quiz Flash)</span>
                </h3>
                {quizScore !== null && (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">
                    Score : {quizScore} / {currentPodcast.quizQuestions.length}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {currentPodcast.quizQuestions.map((q, qIdx) => {
                  const selected = selectedQuizAnswers[qIdx];
                  const hasAnswered = selected !== undefined;
                  const isCorrect = selected === q.correctIndex;

                  return (
                    <div key={qIdx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <p className="text-xs font-black text-slate-900">
                        {qIdx + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isOptSelected = selected === optIdx;
                          const isRightAnswer = optIdx === q.correctIndex;

                          let btnClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                          if (hasAnswered) {
                            if (isRightAnswer) {
                              btnClass = 'bg-emerald-100 border-emerald-400 text-emerald-900 font-black';
                            } else if (isOptSelected) {
                              btnClass = 'bg-rose-100 border-rose-400 text-rose-900 font-bold';
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={hasAnswered}
                              onClick={() => {
                                const newAnswers = { ...selectedQuizAnswers, [qIdx]: optIdx };
                                setSelectedQuizAnswers(newAnswers);
                                if (Object.keys(newAnswers).length === currentPodcast.quizQuestions!.length) {
                                  let correctCount = 0;
                                  currentPodcast.quizQuestions!.forEach((qq, i) => {
                                    if (newAnswers[i] === qq.correctIndex) correctCount++;
                                  });
                                  setQuizScore(correctCount);
                                  onAwardXp(correctCount * 10, 'Quiz de podcast réussi');
                                }
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${btnClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <p className={`text-[11px] font-medium ${isCorrect ? 'text-emerald-700' : 'text-slate-600'}`}>
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: SAVED PODCASTS LIBRARY                            */}
      {/* ======================================================== */}
      {activeTab === 'library' && (
        <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>Ma Bibliothèque de Podcasts Audio</span>
                <span className="text-xl">📚</span>
              </h2>
              <p className="text-xs text-slate-500">
                Retrouvez tous vos épisodes générés pour les réécouter hors-ligne à tout moment.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('create')}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </button>
          </div>

          {savedPodcasts.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center text-2xl mx-auto shadow-inner">
                🎙️
              </div>
              <h3 className="text-sm font-black text-slate-800">Aucun podcast enregistré pour l'instant</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Créez votre premier podcast en rédigeant un problème ou en important une photo de votre cours !
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all cursor-pointer shadow-xs"
              >
                Créer un podcast maintenant
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedPodcasts.map((pod) => (
                <div
                  key={pod.id}
                  onClick={() => handleSelectSavedPodcast(pod)}
                  className="p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/30 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                        {pod.subject}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        ~{pod.durationEstimateMinutes} min
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                      {pod.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {pod.summary || pod.subtitle}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[11px] text-slate-400">
                      {pod.createdAt && !isNaN(new Date(pod.createdAt).getTime())
                        ? new Date(pod.createdAt).toLocaleDateString('fr-FR')
                        : 'Enregistré'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedPodcast(pod.id, e)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Supprimer ce podcast"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <span className="px-3 py-1.5 rounded-xl bg-purple-600 group-hover:bg-purple-700 text-white font-bold text-xs transition-all flex items-center gap-1">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Écouter</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
