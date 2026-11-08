import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Gamepad2,
  Brain,
  MessageSquare,
  CheckCircle,
  Lightbulb,
  HelpCircle,
  BookOpen,
  Loader2,
  AlertCircle,
  File,
  Users,
  Star,
  Play,
  X,
  PlusCircle,
} from 'lucide-react';
import {
  UserProfile,
  SupportedLanguage,
  AttachmentMeta,
  AnalyzedDocument,
} from '../types';
import { translations } from '../i18n/translations';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { historyNavigationService } from '../services/historyNavigationService';
import { soundEffects } from '../utils/soundEffects';

interface StudioViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
  onNavigateToQuiz: (sourceContent: string, subjectTitle: string) => void;
  onNavigateToFlashcards: (sourceContent: string, subjectTitle: string) => void;
  onNavigateToChatWithContext: (contextText: string, contextTitle: string) => void;
  onNavigateToDuolingoPath: (doc: AnalyzedDocument, userRequest?: string) => void;
  onNavigateToGames?: (content?: string, title?: string) => void;
  onShareToGroup?: (doc: AnalyzedDocument) => void;
}

const SAMPLE_COURSES = [
  {
    title: 'La Photosynthèse (SVT)',
    subject: 'Sciences Naturelles',
    content: `La photosynthèse est le processus biochimique par lequel les plantes vertes synthétisent des matières organiques (glucides) à partir de dioxyde de carbone et d'eau, en utilisant l'énergie solaire captée par la chlorophylle. 
Équation générale : 6 CO2 + 6 H2O + Énergie Lumineuse -> C6H12O6 + 6 O2.
Elle se divise en deux phases : la phase photochimique (dépendante de la lumière, production d'ATP et NADPH dans les thylakoïdes) et la phase biochimique ou cycle de Calvin (fixation du carbone dans le stroma sans lumière directe). Ce mécanisme est à la base de la chaîne trophique et de l'enrichissement en dioxygène de l'atmosphère terrestre.`,
  },
  {
    title: 'Le Théorème de Pythagore (Maths)',
    subject: 'Mathématiques',
    content: `Le théorème de Pythagore énonce que dans un triangle rectangle, le carré de la longueur de l'hypoténuse (le plus grand côté opposé à l'angle droit) est égal à la somme des carrés des longueurs des deux autres côtés.
Formule : si ABC est un triangle rectangle en A, alors BC² = AB² + AC².
Applications pratiques : calcul d'une longueur manquante dans un triangle rectangle, calcul de distances dans l'espace, vérification de l'orthogonalité (réciproque de Pythagore : si BC² = AB² + AC², alors le triangle est rectangle en A).`,
  },
  {
    title: 'La Révolution Industrielle (Histoire)',
    subject: 'Histoire',
    content: `La révolution industrielle est une période de transformation économique et sociale majeure débutée en Grande-Bretagne à la fin du XVIIIe siècle, puis étendue à l'Europe et aux États-Unis au XIXe siècle.
Moteurs clés : invention de la machine à vapeur perfectionnée par James Watt (1769), essor de la métallurgie et du textile, développement spectaculaire du chemin de fer.
Conséquences majeures : exode rural massif, naissance de la classe ouvrière (prolétariat) et essor de la bourgeoisie industrielle, apparition du syndicalisme et des lois sociales.`,
  },
];

export const StudioView: React.FC<StudioViewProps> = ({
  currentProfile,
  currentLanguage,
  onAwardXp,
  onNavigateToQuiz,
  onNavigateToFlashcards,
  onNavigateToChatWithContext,
  onNavigateToDuolingoPath,
  onNavigateToGames,
  onShareToGroup,
}) => {
  const t = translations[currentLanguage];

  const [rawText, setRawText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<AttachmentMeta | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [analyzedResult, setAnalyzedResult] = useState<AnalyzedDocument | null>(() => {
    const docs = storageService.getDocuments();
    return docs.length > 0 ? docs[0] : null;
  });

  // Modal state for user's custom demand when launching Duolingo 20Q path
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [userDemandInput, setUserDemandInput] = useState('');

  // Intercepte le bouton retour du téléphone pour fermer la modale sans quitter l'app
  useEffect(() => {
    if (!isDemandModalOpen) return;
    return historyNavigationService.registerHandler('studioDemandModal', 95, () => {
      setIsDemandModalOpen(false);
      return true;
    });
  }, [isDemandModalOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('Fichier supérieur à la limite de 25 Mo.');
      return;
    }

    const isImg = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.includes(',') ? result.split(',')[1] : result;

      setUploadedFile({
        id: `file-${Date.now()}`,
        name: file.name,
        mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
        size: file.size,
        data: base64Data,
        type: isImg ? 'image' : isPdf ? 'pdf' : 'text',
        previewUrl: isImg ? result : undefined,
      });
      setErrorMessage(null);
    };

    if (file.type.startsWith('text/')) {
      const textReader = new FileReader();
      textReader.onload = () => {
        setRawText(textReader.result as string);
      };
      textReader.readAsText(file);
    }

    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_COURSES[0]) => {
    setRawText(sample.content);
    setUploadedFile(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!rawText.trim() && !uploadedFile) {
      setErrorMessage('Veuillez importer un fichier ou coller un texte de cours.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep(1);
    setErrorMessage(null);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 400);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 900);

    try {
      const response = await apiService.analyzeDocument({
        text: rawText.trim() || undefined,
        attachment: uploadedFile
          ? {
              mimeType: uploadedFile.mimeType,
              data: uploadedFile.data,
              name: uploadedFile.name,
            }
          : undefined,
        profile: currentProfile,
        language: currentLanguage,
      });

      const doc: AnalyzedDocument = {
        id: `doc-${Date.now()}`,
        title: response.title || uploadedFile?.name || 'Document Pédagogique',
        fileName: uploadedFile?.name || 'Texte personnalisé',
        fileType: uploadedFile?.type || 'text',
        questionCount: 20,
        summary: response.summary,
        keyConcepts: response.keyConcepts || [],
        studyTip: response.studyTip,
        suggestedQuestions: response.suggestedQuestions,
        createdAt: new Date().toISOString(),
        rawTextPreview: rawText.slice(0, 300),
      };

      setAnalyzedResult(doc);
      storageService.saveDocument(doc);
      soundEffects.playCorrect();

      onAwardXp(30, 'Analyse intelligente de cours');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message || "Erreur lors de l'analyse du document par l'IA."
      );
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleConfirmLaunchDuolingo = () => {
    if (!analyzedResult) return;
    setIsDemandModalOpen(false);
    onNavigateToDuolingoPath(analyzedResult, userDemandInput.trim() || undefined);
    setUserDemandInput('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title Header */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <span>{t.studio.title}</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1">{t.studio.subtitle}</p>
      </div>

      {/* Upload & Input Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
        {/* Dropzone */}
        <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-indigo-50/30 hover:bg-indigo-50/60 transition-all group">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,application/pdf,text/plain,.md"
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 group-hover:scale-110 text-indigo-600 flex items-center justify-center mb-3 transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-bold text-slate-800">{t.studio.dropTitle}</p>
          <p className="text-xs text-slate-500 mt-1">{t.studio.dropSub}</p>
        </label>

        {/* Selected file preview pill */}
        {uploadedFile && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              {uploadedFile.type === 'image' ? (
                uploadedFile.previewUrl ? (
                  <img
                    src={uploadedFile.previewUrl}
                    alt={uploadedFile.name}
                    className="w-10 h-10 object-cover rounded-md shrink-0"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-indigo-600" />
                )
              ) : (
                <File className="w-5 h-5 text-amber-500" />
              )}
              <div className="overflow-hidden">
                <p className="font-bold text-slate-800 truncate">{uploadedFile.name}</p>
                <p className="text-[11px] text-slate-500">
                  {(uploadedFile.size / 1024).toFixed(0)} Ko • Format {uploadedFile.type.toUpperCase()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              className="text-slate-400 hover:text-rose-500 font-bold px-2 py-1 cursor-pointer"
            >
              Retirer
            </button>
          </div>
        )}

        {/* Or Paste Text */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            {t.studio.pasteText}
          </label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={4}
            placeholder={t.studio.placeholderText}
            className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all text-slate-800 placeholder:text-slate-400 font-normal leading-relaxed"
          />
        </div>

        {/* Sample courses pills */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {t.studio.sampleCourses}
          </span>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_COURSES.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSample(sample)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors cursor-pointer"
              >
                ✨ {sample.title}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || (!rawText.trim() && !uploadedFile)}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-300 text-white font-black text-sm uppercase tracking-wider shadow-md shadow-indigo-600/20 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2.5">
              <Loader2 className="w-5 h-5 animate-spin text-amber-300" />
              <span>
                {analysisStep === 1 && '⚡ Scan éclair du cours...'}
                {analysisStep === 2 && '🧠 Synthèse des notions clés...'}
                {analysisStep >= 3 && '✨ Finalisation instantanée...'}
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>{t.studio.analyzeBtn}</span>
              <span className="hidden sm:inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/20 text-white tracking-wider">
                Éclair ~1s
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Analysis Results Display */}
      {analyzedResult && (
        <div className="bg-white rounded-3xl p-6 border-2 border-indigo-100 shadow-sm space-y-6 animate-in fade-in duration-300">
          {/* Duolingo Banner Hero on Document */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white shadow-md border-b-4 border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-3xl shrink-0 shadow-inner">
                🦉
              </div>
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-700 text-emerald-100">
                  Document + Demande Personnalisée
                </span>
                <h3 className="text-lg font-black tracking-tight mt-1">
                  Sentier KIPO : 20 Questions Adaptées
                </h3>
                <p className="text-xs text-emerald-100">
                  Créé à partir de ce cours et de vos consignes (niveau, formules, examen...).
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsDemandModalOpen(true)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-emerald-700 text-emerald-700" />
              <span>Lancer le Sentier KIPO (100 Leçons)</span>
            </button>
          </div>

          <div className="border-b border-slate-100 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Document Actif
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {analyzedResult.title}
              </h2>
            </div>

            {/* Quick action transformers */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() =>
                  onNavigateToQuiz(
                    `${analyzedResult.title}\n${analyzedResult.summary}\n${analyzedResult.keyConcepts.join('\n')}`,
                    analyzedResult.title
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>Quiz Classique</span>
              </button>

              <button
                onClick={() => {
                  if (onNavigateToGames) {
                    onNavigateToGames(analyzedResult.summary, analyzedResult.title);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-linear-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black transition-all shadow-xs cursor-pointer"
              >
                <span className="text-sm">🐾</span>
                <span>Créer Jeu Animaux</span>
              </button>

              <button
                onClick={() =>
                  onNavigateToFlashcards(
                    `${analyzedResult.title}\n${analyzedResult.keyConcepts.join('\n')}`,
                    analyzedResult.title
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Brain className="w-4 h-4" />
                <span>Créer Flashcards</span>
              </button>

              {onShareToGroup && (
                <button
                  onClick={() => onShareToGroup(analyzedResult)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  <span>Partager au Groupe</span>
                </button>
              )}

              <button
                onClick={() =>
                  onNavigateToChatWithContext(
                    `Voici mon cours "${analyzedResult.title}":\n${analyzedResult.summary}\nNotions clés: ${analyzedResult.keyConcepts.join(', ')}`,
                    analyzedResult.title
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Discuter avec l’IA</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>{t.studio.summary}</span>
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {analyzedResult.summary}
            </p>
          </div>

          {/* Key Concepts Grid */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>{t.studio.keyConcepts}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {analyzedResult.keyConcepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="font-medium leading-relaxed">{concept}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Study Tip Mnemonic */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>{t.studio.studyTip}</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              {analyzedResult.studyTip}
            </p>
          </div>
        </div>
      )}

      {/* MODAL: CUSTOM DEMAND BEFORE LAUNCHING DUOLINGO PATH */}
      {isDemandModalOpen && analyzedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border-2 border-emerald-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span>🦉</span>
                <span>Sentier KIPO du cours (100 Leçons)</span>
              </h3>
              <button
                onClick={() => setIsDemandModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 font-medium">
              📄 Document analysé : <strong>{analyzedResult.title}</strong>
              <div className="text-[11px] text-emerald-700 mt-0.5">
                100 leçons progressives structurées en 10 unités thématiques directement adaptées à ce document.
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 block">
                Votre consigne ou focus particulier pour ce sentier (optionnel) :
              </label>
              <textarea
                rows={3}
                value={userDemandInput}
                onChange={(e) => setUserDemandInput(e.target.value)}
                placeholder="Ex : Insiste particulièrement sur les formules et calculs, pose des questions pièges, ou simplifie pour un grand débutant..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
              />

              {/* Suggestions chips */}
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
                    onClick={() => setUserDemandInput(chip)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDemandModalOpen(false);
                  onNavigateToDuolingoPath(analyzedResult);
                }}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Lancer direct (Par défaut)
              </button>

              <button
                type="button"
                onClick={handleConfirmLaunchDuolingo}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider border-b-4 border-emerald-700 shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Générer avec ma demande</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
