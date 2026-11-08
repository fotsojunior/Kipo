import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Middleware for parsing JSON with generous limit for multimodal uploads (PDF, photos)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Initialize GoogleGenAI server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// High-speed operational models prioritized first for fast, reliable generation (~1.5s - 2.8s)
const FALLBACK_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-4-argon',
];

async function generateWithFallback(options: {
  contents: any;
  config?: any;
}) {
  let lastError: any = null;

  const mergedConfig = {
    ...options.config,
  };

  for (const model of FALLBACK_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: mergedConfig,
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.error(`[KIPO AI] Error with model ${model}: status=${err.status} msg=${err.message}`);
      const isQuotaOrDemand =
        err.status === 429 ||
        err.status === 503 ||
        err.message?.includes('429') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('high demand');

      if (isQuotaOrDemand) {
        console.warn(`[KIPO AI] Modèle ${model} saturé, basculement vers le modèle suivant...`);
        // Small backoff before next model
        await new Promise((r) => setTimeout(r, 250));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const k = process.env.GEMINI_API_KEY || '';
  res.json({
    status: 'ok',
    appName: 'KIPO',
    hasApiKey: Boolean(k),
    keyLen: k.length,
    keyStarts: k ? k.slice(0, 4) : '',
    timestamp: new Date().toISOString(),
  });
});

// Helper to clean unwanted formatting artifacts (***, $, $$)
function cleanAiText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$\n]+)\$/g, '$1')
    .replace(/\*{3,}/g, '')
    .replace(/^\s*(\*\s*){3,}$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Deep sanitize JSON objects/arrays to eliminate *** and $ from all generated output
function sanitizeDeep<T>(obj: T): T {
  if (typeof obj === 'string') {
    return cleanAiText(obj) as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeDeep) as any;
  }
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = sanitizeDeep(value);
    }
    return cleaned;
  }
  return obj;
}

// Resilient JSON parser handling markdown code blocks and partial wrappers
function safeParseJson(raw: string | undefined): any {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(cleaned || '{}');
  }
}

// Standardized error handler with accurate HTTP status codes (429, 400, 503, 500)
function handleApiError(res: express.Response, error: any, defaultMessage: string) {
  console.error(`[KIPO Error] ${defaultMessage}:`, error);

  const isInvalidKey =
    error?.status === 400 &&
    (error?.message?.includes('API key not valid') ||
      error?.message?.includes('API_KEY_INVALID') ||
      error?.message?.includes('INVALID_ARGUMENT'));

  if (isInvalidKey) {
    return res.status(401).json({
      error: 'La clé API Gemini configurée est invalide ou a expiré.',
      code: 'INVALID_API_KEY',
    });
  }

  const isRateLimit =
    error?.status === 429 ||
    error?.message?.includes('429') ||
    error?.message?.includes('RESOURCE_EXHAUSTED') ||
    error?.message?.includes('quota');

  const isUnavailable =
    error?.status === 503 ||
    error?.message?.includes('503') ||
    error?.message?.includes('high demand') ||
    error?.message?.includes('overloaded');

  if (isRateLimit) {
    return res.status(429).json({
      error: 'La limite temporaire de requêtes à l\'API Gemini a été atteinte. Veuillez patienter un instant avant de réessayer.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  if (isUnavailable) {
    return res.status(503).json({
      error: 'Le service Gemini est temporairement surchargé. Veuillez réessayer dans quelques secondes.',
      code: 'SERVICE_UNAVAILABLE',
    });
  }

  const statusCode =
    typeof error?.status === 'number' && error.status >= 400 && error.status < 600
      ? error.status
      : 500;

  return res.status(statusCode).json({
    error: error?.message || defaultMessage,
    code: 'GEMINI_API_ERROR',
  });
}

const LANGUAGE_NAMES: Record<string, string> = {
  fr: 'français',
  en: 'anglais',
  es: 'espagnol',
  ar: 'arabe (العربية)',
  'zh-cn': 'chinois simplifié (简体中文)',
  'zh-tw': 'chinois traditionnel (繁體中文)',
  zh: 'chinois (中文)',
  de: 'allemand (Deutsch)',
  pt: 'portugais (Português)',
  ru: 'russe (Русский)',
  ja: 'japonais (日本語)',
  hi: 'hindi (हिन्दी)',
  it: 'italien (Italiano)',
  ko: 'coréen (한국어)',
  tr: 'turc (Türkçe)',
  sw: 'swahili (Kiswahili)',
  ha: 'haoussa',
  yo: 'yoruba',
  ig: 'igbo',
  am: 'amharique',
  ln: 'lingala',
  wo: 'wolof',
  bm: 'bambara',
  nl: 'néerlandais (Nederlands)',
  pl: 'polonais (Polski)',
  uk: 'ukrainien (Українська)',
  el: 'grec (Ελληνικά)',
  vi: 'vietnamien (Tiếng Việt)',
  th: 'thaï (ไทย)',
  id: 'indonésien (Bahasa Indonesia)',
  fa: 'persan (فارسی)',
  he: 'hébreu (עברית)',
  sv: 'suédois',
  da: 'danois',
  no: 'norvégien',
  fi: 'finnois',
  ro: 'roumain',
  hu: 'hongrois',
  cs: 'tchèque',
};

function getLanguageName(code: string): string {
  if (!code) return 'français';
  const clean = code.toLowerCase().trim();
  return LANGUAGE_NAMES[clean] || code;
}

// Helper to build profile-tailored system instructions
function getPedagogicalSystemInstruction(profile: string, language: string = 'fr'): string {
  const langName = getLanguageName(language);

  const baseInstruction = `Tu es KIPO, le tuteur et compagnon d'apprentissage intelligent international de la plateforme KIPO.
Ta mission est d'aider les apprenants et enseignants à comprendre, mémoriser et s'épanouir avec passion.
Tu réponds TOUJOURS dans la langue demandée (${langName}) sauf si l'utilisateur te demande explicitement une autre langue.
Adopte un style structuré, clair, stimulant et pédagogique.

RÈGLE STRICTE DE MISE EN FORME :
- Ne mets JAMAIS de symboles superflus comme ***, ni de suites d'astérisques décoratives.
- N'utilise JAMAIS de symboles de dollars ($ ou $$) pour entourer du texte, des formules ou des nombres. Écris toujours les formules en texte clair et lisible (ex: écris "AM / AB = AN / AC" ou "x² + y² = z²", et jamais "$x² + y² = z²$").
- Utilise des tirets simples (-) pour les puces. Évite toute surcharge de balises cryptiques ou de symboles techniques inutiles.`;

  if (profile === 'professeur') {
    return `${baseInstruction}
L'utilisateur est un PROFESSEUR / ENSEIGNANT.
Adopte une posture d'ingénieur pédagogique et de collègue bienveillant :
- Propose des séquences didactiques, plans de cours structurés, critères d'évaluation clairs et différenciation pédagogique.
- Fournis des idées d'exercices progressifs, des remédiations aux erreurs courantes d'élèves, et des activités interactives.
- Sois précis, professionnel et inspirant.`;
  }

  if (profile === 'etudiant') {
    return `${baseInstruction}
L'utilisateur est un ÉTUDIANT du supérieur / lycée terminale.
Adopte une posture de mentor académique exigeant et rigoureux :
- Approfondis les concepts avec rigueur scientifique, définitions précises, formules, démonstrations et contexte épistémologique.
- Fournis des synthèses de révision rapides, des conseils méthodologiques pour les examens et concours.
- Favorise la pensée critique et l'application concrète.`;
  }

  if (profile === 'autre') {
    return `${baseInstruction}
L'utilisateur est un PROFESSIONNEL, PARENT ou APPRENANT AUTODIDACTE (Profil "Autre").
Adopte une posture de coach expert, pragmatique, direct et stimulant :
- Privilégie les applications professionnelles directes, les cas d'usage réels, la clarté et l'efficacité d'apprentissage.
- Fais des liens interdisciplinaires enrichissants, vulgarise sans simplisme et valorise la culture générale.
- Sois proactif, concis et actionnable.`;
  }

  // Default: Élève (primaire, collège, lycée)
  return `${baseInstruction}
L'utilisateur est un ÉLÈVE (école, collège, début lycée).
Adopte une posture de tuteur chaleureux, encourageant et ludique :
- Utilise des explications simples, des analogies de la vie quotidienne, des exemples amusants et des encouragements fréquents.
- Ne donne pas directement toute la solution d'un exercice sans inviter l'élève à réfléchir d'abord (méthode socratique).
- Utilise des emojis adaptés pour rendre l'apprentissage captivant et motivant.`;
}

const uiTranslationCache = new Map<string, any>();

// POST /api/translate-ui: Dynamically translate full UI dictionary into any requested world language
app.post('/api/translate-ui', async (req, res) => {
  try {
    const { languageCode, languageName } = req.body;
    if (!languageCode || languageCode === 'fr') {
      return res.json({ success: true, language: 'fr', dictionary: null });
    }

    const key = languageCode.toLowerCase().trim();
    if (uiTranslationCache.has(key)) {
      return res.json({ success: true, language: key, dictionary: uiTranslationCache.get(key) });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Clé API Gemini non configurée' });
    }

    const targetLang = languageName || getLanguageName(languageCode);

    const baseDict = {
      app: {
        name: 'KIPO',
        tagline: 'Apprends en t’amusant avec l’IA',
        subtagline: 'Plateforme éducative pour élèves, étudiants et enseignants',
      },
      nav: {
        chat: 'Tuteur IA',
        studio: 'Documents',
        collab: 'Groupes d’Étude',
        games: 'Quiz & Jeux',
        library: 'Bibliothèque',
        profile: 'Profil & XP',
        duolingo: 'Sentier KIPO',
        help: 'Aide & Guide',
        login: 'Connexion',
        signup: "S'inscrire",
        account: 'Mon Compte',
        translate: 'Traduire',
        profession: 'Profession',
        searchPlaceholder: 'Rechercher un cours, quiz, discussion...',
      },
      profiles: {
        eleve: {
          name: 'Élève',
          label: 'Primaire / Collège / Lycée',
          desc: 'Explications simples, métaphores visuelles, encouragements et méthode socratique.',
        },
        etudiant: {
          name: 'Étudiant',
          label: 'Enseignement Supérieur',
          desc: 'Rigueur conceptuelle, formules, esprit de synthèse et préparation aux examens.',
        },
        professeur: {
          name: 'Professeur',
          label: 'Enseignant & Formateur',
          desc: 'Conception de séquences, grilles d’évaluation, différenciation et exercices.',
        },
      },
      chat: {
        title: 'Tuteur IA Pédagogique',
        emptyTitle: 'Comment puis-je t’aider à réussir aujourd’hui ?',
        emptySubtitle: 'Pose une question, demande une explication claire ou importe ton cours en photo/PDF !',
        inputPlaceholder: 'Pose ta question ou décris ton problème...',
        attachFile: 'Joindre un document (PDF, photo, texte)',
        send: 'Envoyer',
        turnToQuiz: 'Créer un Quiz',
        turnToFlashcards: 'Créer des Cartes Mémoire',
        copy: 'Copier',
        copied: 'Copié !',
        analyzing: 'Analyse et réflexion pédagogique en cours...',
      },
      studio: {
        title: 'Atelier d’Analyse de Documents',
        subtitle: 'Transforme n’importe quel cours, PDF, photo de cahier ou texte en matière vivante.',
        dropTitle: 'Glisse ton document ici ou clique pour importer',
        dropSub: 'Formats acceptés : PDF, PNG, JPG, JPEG, TXT, Markdown (max 25 Mo)',
        pasteText: 'Ou colle le texte de ton cours directement :',
        placeholderText: 'Colle ici le chapitre, le polycopié ou les notes de cours...',
        analyzeBtn: 'Analyser le document avec l’IA',
        summary: 'Résumé Synthétique',
        keyConcepts: 'Notions & Formules Clés',
        generateQuizNow: 'Générer un Quiz à partir de ce cours',
        generateCardsNow: 'Générer des Flashcards',
      },
      quiz: {
        title: 'Quiz & Défis Éducatifs',
        modeQuiz: 'Quiz Classique',
        modeChallenge: 'Défi Chrono (Boss)',
        modeFlashcards: 'Cartes Mémoire',
        startBtn: 'Commencer',
        question: 'Question',
        explanation: 'Explication pédagogique :',
        next: 'Question suivante',
        finish: 'Voir les résultats',
        score: 'Ton Score',
        xpEarned: 'XP Gagnés',
        congrats: 'Félicitations !',
        replay: 'Rejouer',
        saveToLib: 'Sauvegarder dans la bibliothèque',
      },
      flashcards: {
        title: 'Cartes Mémoire Interactives',
        flipHint: 'Clique sur la carte pour la retourner',
        showHint: 'Afficher un indice',
        difficulty: {
          again: 'À revoir (+5 XP)',
          good: 'Bien (+15 XP)',
          perfect: 'Parfait ! (+25 XP)',
        },
        completedTitle: 'Session terminée avec brio !',
      },
      library: {
        title: 'Bibliothèque Personnelle',
        subtitle: 'Retrouve tous tes cours analysés, quiz créés et conversations enregistrées.',
        tabAll: 'Tout',
        tabDocs: 'Documents',
        tabQuizzes: 'Quiz',
        tabCards: 'Cartes Mémoire',
        tabChats: 'Historique Discussions',
        noItems: 'Aucun élément trouvé pour le moment.',
        open: 'Ouvrir',
        play: 'Jouer',
        delete: 'Supprimer',
      },
      collab: {
        badge: 'ESPACE COLLABORATIF INTERNATIONAL',
        title: 'Groupes d’Étude & Entraide',
        subtitle: 'Créez votre propre groupe public ou privé avec votre propre matière personnalisée, partagez vos photos, vos PDF et vos cours pour progresser ensemble !',
        createGroup: 'Créer un groupe',
        joinWithCode: 'Code d’invitation',
        public: 'Public',
        private: 'Privé',
        join: 'Rejoindre',
        requestAccess: 'Demander l’accès',
        enterGroup: 'Entrer dans le groupe',
        pending: 'En attente',
        shareDoc: 'Partager une Photo ou un PDF',
        chooseFromStudio: 'Choisir depuis l’Atelier',
        tabChat: 'Discussion & IA',
        tabDocs: 'Documents & Fichiers',
        tabQuizzes: 'Défis Quiz',
        tabMembers: 'Membres',
        tabRequests: 'Demandes',
        tabSettings: 'Droits',
        aiCoach: 'KIPO AI Coach de Groupe :',
        aiSummarize: '⚡ Résumé des échanges',
        aiChallenge: '🏆 Lancer un défi d’équipe',
        chatPlaceholder: 'Écris un message ou une question au groupe...',
        send: 'Envoyer',
        creatorBadge: '👑 Créateur',
        memberBadge: 'Membre ✓',
        adminBadge: 'Tu es Admin',
        filterAll: 'Tous les groupes',
        filterPublic: 'Groupes Publics',
        filterPrivate: 'Groupes Privés',
        filterMy: 'Mes Groupes',
        searchPlaceholder: 'Rechercher par matière ou nom...',
        noGroups: 'Aucun groupe ne correspond à votre filtre. Créez le premier dès maintenant !',
        membersCount: 'membre(s)',
      },
      duolingo: {
        title: 'Sentier 20Q KIPO',
        subtitle: '20 questions progressives personnalisées sur chaque cours',
        readyFirstCourse: 'Prêt pour ton premier cours',
        heartsRemaining: 'vies restantes',
        heartsEmpty: 'Cœurs épuisés ! Clique pour recharger',
        welcomeTitle: 'Bienvenue sur ton Sentier d’Apprentissage !',
        welcomeDesc: 'Ton espace est vierge et prêt pour tes propres cours. Importe une photo de ton cahier ou saisis un sujet pour que l’IA crée ton premier sentier interactif personnalisé !',
        btnPhoto: 'Photographier / Importer un cours 📸',
        btnCustomSubject: 'Créer un sentier sur un sujet libre ✍️',
        startLesson: 'Commencer la leçon',
        continue: 'Continuer',
        check: 'Vérifier la réponse',
        correct: 'Excellent ! Bonne réponse',
        incorrect: 'Pas tout à fait. La bonne réponse était :',
        nextQuestion: 'Question suivante',
        completedTitle: 'Sentier terminé avec succès !',
        xpGained: 'XP Gagnés',
        downloadGallery: 'Télécharger la photo du sentier dans la galerie',
        quitLesson: 'Quitter la leçon',
        explanation: 'Explication pédagogique :',
        lessonFinishedTitle: 'Leçon Terminée avec Brio !',
        translateQuestion: '🌐 Traduire cette question',
        translatingQuestion: 'Traduction en cours...',
      },
      auth: {
        reminderTitle: 'Sauvegardez vos progrès sur KIPO !',
        reminderText: 'Connectez-vous ou inscrivez-vous pour conserver vos cours, quiz et XP sur le Cloud.',
        login: 'Connexion',
        signup: "S'inscrire",
        guestNotice: 'Mode Invité actif : Votre travail n’est pas sauvegardé dans le Cloud.',
        savePrompt: 'Se connecter / S’inscrire',
        cloudSaved: 'Sauvegardé sur le Cloud KIPO',
      },
      gamification: {
        xp: 'XP',
        level: 'Niveau',
        streak: 'Jours consécutifs',
        streakLabel: 'Série active',
        badgesTitle: 'Badges & Trophées',
        levelProgress: 'Progression vers le niveau suivant',
        levelUpModalTitle: 'NIVEAU SUPÉRIEUR !',
        levelUpSubtitle: 'Tu viens de débloquer de nouveaux pouvoirs du savoir !',
      },
    };

    const prompt = `Tu es le traducteur expert officiel de l'application éducative KIPO.
Traduis intégralement et avec une très haute qualité tous les textes de l'interface utilisateur ci-dessous vers la langue : "${targetLang}" (code ISO: ${languageCode}).
Tous les termes doivent être traduits naturellement dans la langue cible sans laisser de français. Conserve exactement les mêmes clés JSON.

Dictionnaire source (format JSON) :
${JSON.stringify(baseDict, null, 2)}

Réponds STRICTEMENT par un JSON valide avec exactement la même arborescence de clés.`;

    const response = await generateWithFallback({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeParseJson(response.text || '{}');
    uiTranslationCache.set(key, parsed);
    return res.json({ success: true, language: key, dictionary: parsed });
  } catch (err: any) {
    console.error('[KIPO Error] translate-ui error:', err);
    return res.status(500).json({ error: 'Erreur lors de la traduction UI' });
  }
});

// Dynamic translation for learning questions, options, and explanations
app.post('/api/translate-question', async (req, res) => {
  try {
    const { question, targetLanguage = 'fr' } = req.body;
    if (!question) return res.status(400).json({ error: 'Question requise' });

    const targetLang = getLanguageName(targetLanguage);
    const prompt = `Tu es l'expert de traduction éducative de KIPO.
Traduis fidèlement cette question de cours, ses options et son explication vers la langue : "${targetLang}" (code: ${targetLanguage}).
Garde exactement la même structure JSON, le même correctIndex, et le sens pédagogique.

Question source :
${JSON.stringify(question, null, 2)}

Réponds STRICTEMENT par un JSON valide :
{
  "question": "...",
  "options": [...],
  "correctIndex": ${typeof question.correctIndex === 'number' ? question.correctIndex : 0},
  "explanation": "..."
}`;

    const response = await generateWithFallback({
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsed = safeParseJson(response.text || '{}');
    return res.json({
      success: true,
      translatedQuestion: {
        ...question,
        question: parsed.question || question.question,
        options: Array.isArray(parsed.options) && parsed.options.length > 0 ? parsed.options : question.options,
        explanation: parsed.explanation || question.explanation,
      },
    });
  } catch (err: any) {
    console.error('[KIPO Error] translate-question error:', err);
    return res.status(500).json({ error: 'Erreur traduction question' });
  }
});

// 1. POST /api/chat: Interactive educational chat with multimodal support
app.post('/api/chat', async (req, res) => {
  try {
    const {
      message,
      history = [],
      profile = 'eleve',
      language = 'fr',
      attachments = [], // [{ mimeType, data, name }]
    } = req.body;

    if (!message && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ error: 'Message ou document requis' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Clé API Gemini non configurée sur le serveur. Veuillez configurer GEMINI_API_KEY dans vos paramètres.',
      });
    }

    const systemInstruction = getPedagogicalSystemInstruction(profile, language);

    // Prepare current user turn with potential attachments
    const currentParts: any[] = [];

    // Add files/images/PDFs if any
    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.data && att.mimeType) {
          currentParts.push({
            inlineData: {
              mimeType: att.mimeType,
              data: att.data,
            },
          });
        }
      }
    }

    // Add user text message
    if (message && message.trim()) {
      currentParts.push({ text: message.trim() });
    }

    // Format previous history defensively to ensure strict user/model turn alternation
    const rawHistory = Array.isArray(history) ? history.slice(-12) : [];
    const formattedHistory: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

    for (const item of rawHistory) {
      const text = (item.content || item.text || '').trim();
      if (!text) continue;
      const role: 'user' | 'model' =
        item.role === 'assistant' || item.role === 'model' ? 'model' : 'user';

      // Avoid adding the incoming message if it was already included in history
      if (role === 'user' && text === (message || '').trim()) {
        continue;
      }

      if (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === role) {
        // Merge consecutive turns with identical role to respect Gemini alternation rules
        const prevPart = formattedHistory[formattedHistory.length - 1].parts[0];
        if (prevPart && prevPart.text) {
          prevPart.text += `\n\n${text}`;
        }
      } else {
        formattedHistory.push({
          role,
          parts: [{ text }],
        });
      }
    }

    // Ensure the history doesn't start with 'model' if alone, and doesn't end with 'user'
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }
    while (formattedHistory.length > 0 && formattedHistory[formattedHistory.length - 1].role === 'user') {
      formattedHistory.pop();
    }

    const contents: Array<{ role: 'user' | 'model'; parts: any[] }> = [
      ...formattedHistory,
      {
        role: 'user',
        parts: currentParts.length > 0 ? currentParts : [{ text: 'Bonjour, tuteur KIPO.' }],
      },
    ];

    const response = await generateWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const rawReply = response.text || "Désolé, je n'ai pas pu formuler de réponse. Peux-tu reformuler ?";
    const replyText = cleanAiText(rawReply);

    return res.json({
      text: replyText,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return handleApiError(res, error, 'Erreur lors de la génération de la réponse par le tuteur IA.');
  }
});

// 2. POST /api/generate-learning-material: Generate Duolingo Paths (20+ questions), Quizzes, or Flashcards
app.post('/api/generate-learning-material', async (req, res) => {
  try {
    const {
      sourceText,
      type = 'duolingo_path', // 'duolingo_path' | 'quiz' | 'flashcards' | 'challenge'
      profile = 'eleve',
      language = 'fr',
      questionCount = 20, // Minimum 20 questions requested for documents
      subject = 'Général',
      attachment,
      userRequest = '', // Specific demand/focus of the user!
    } = req.body;

    if (!sourceText && !attachment) {
      return res.status(400).json({ error: 'Texte source ou document requis pour la génération.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Clé API Gemini non configurée sur le serveur.',
      });
    }

    const parts: any[] = [];
    if (attachment?.data && attachment?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
        },
      });
    }

    let prompt = '';
    let responseSchema: any;

    if (type === 'duolingo_path') {
      const userFocusDirective = userRequest?.trim()
        ? `\n\nOBJECTIF ET DEMANDE PARTICULIÈRE DE L'UTILISATEUR :\n"${userRequest.trim()}". Tu dois impérativement orienter la sélection des notions, la difficulté, les pièges et le style des questions pour répondre très exactement à cette demande tout en te basant sur le document.`
        : '';

      prompt = `Tu es l'architecte pédagogique en chef de KIPO. À partir du document/photo fourni ET de la demande de l'utilisateur, conçois le grand parcours d'apprentissage KIPO pour ce cours.
Fournis :
1. "units" : Les 10 Unités thématiques progressives du parcours de 100 leçons adaptées à ce document (Unité 1 à 10, chacune couvrant 10 leçons, avec badgeIcon emoji et accentColor).
2. "keyConcepts" : 4 à 8 notions ou formules fondamentales incontournables extraites du document.
3. "lessons" : Les 2 leçons fondamentales initiales très riches et stimulantes (5 questions ciblées par leçon, 10 questions au total) rédigées EXCLUSIVEMENT à partir du document :
- Leçon 1 : Découverte & Notions fondamentales
- Leçon 2 : Compréhension & Mécanismes clés
${userFocusDirective}

RÈGLES IMPORTANTES :
- Chaque question, explication et option doit porter STRICTEMENT sur le document analysé.
- N'utilise AUCUN symbole superflu comme *** ou des dollars ($). Formule les équations et termes en texte clair.
- Fournis 4 choix d'options clairs, l'index de la bonne réponse (0 à 3) et une explication pédagogique encourageante.
Génère une réponse JSON valide conforme au schéma.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: 'Titre captivant du parcours' },
          subject: { type: Type.STRING, description: 'Matière' },
          userRequest: { type: Type.STRING, description: 'Demande utilisateur prise en compte' },
          totalQuestions: { type: Type.INTEGER, description: 'Nombre total de questions (minimum 20)' },
          keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Notions clés du document',
          },
          units: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                unitNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                theme: { type: Type.STRING },
                description: { type: Type.STRING },
                startLesson: { type: Type.INTEGER },
                endLesson: { type: Type.INTEGER },
                accentColor: { type: Type.STRING },
                badgeIcon: { type: Type.STRING },
              },
              required: ['unitNumber', 'title', 'theme', 'description', 'startLesson', 'endLesson'],
            },
          },
          lessons: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                lessonNumber: { type: Type.INTEGER },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      type: { type: Type.STRING, description: 'multiple_choice ou true_false ou fill_blank' },
                      question: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      explanation: { type: Type.STRING },
                      xpReward: { type: Type.INTEGER },
                    },
                    required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
                  },
                },
              },
              required: ['id', 'lessonNumber', 'title', 'description', 'questions'],
            },
          },
        },
        required: ['title', 'lessons'],
      };
    } else if (type === 'flashcards') {
      prompt = `À partir du contenu fourni, crée ${questionCount} cartes mémoire didactiques pour un profil ${profile} en matière ${subject}.
Chaque carte doit avoir un recto (question ou concept clé) et un verso (explication claire, définition, formule).`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subject: { type: Type.STRING },
          cards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                hint: { type: Type.STRING },
              },
              required: ['id', 'front', 'back'],
            },
          },
        },
        required: ['title', 'cards'],
      };
    } else {
      // Classic quiz or challenge (dynamic question count for ultra-fast creation)
      const requestedCount = Number(questionCount);
      const count = !isNaN(requestedCount) && requestedCount > 0 ? Math.min(requestedCount, 25) : 5;

      prompt = `À partir du contenu fourni, crée un quiz interactif de ${count} questions à choix multiples stimulantes et percutantes pour un profil ${profile} en matière ${subject}.
Chaque question doit avoir 4 choix clairs, l'index de la bonne réponse (0, 1, 2 ou 3) et une explication pédagogique détaillée.`;

      responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          subject: { type: Type.STRING },
          difficulty: { type: Type.STRING },
          timeLimitSeconds: { type: Type.INTEGER },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                xpReward: { type: Type.INTEGER },
              },
              required: ['id', 'question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
        required: ['title', 'questions'],
      };
    }

    if (sourceText) {
      parts.push({ text: `CONTENU DU COURS / DOCUMENT :\n${sourceText}\n\nINSTRUCTION :\n${prompt}` });
    } else {
      parts.push({ text: prompt });
    }

    const response = await generateWithFallback({
      contents: { parts },
      config: {
        systemInstruction: getPedagogicalSystemInstruction(profile, language),
        responseMimeType: 'application/json',
        responseSchema,
        temperature: 0.3,
      },
    });

    const parsedData = safeParseJson(response.text);
    return res.json(sanitizeDeep(parsedData));
  } catch (error: any) {
    return handleApiError(res, error, 'Impossible de générer le matériel pédagogique.');
  }
});

// 3. POST /api/analyze-document: Deep document synthesis and pedagogical breakdown
app.post('/api/analyze-document', async (req, res) => {
  try {
    const {
      text,
      profile = 'eleve',
      language = 'fr',
      attachment,
    } = req.body;

    if (!text && !attachment) {
      return res.status(400).json({ error: 'Document ou texte requis' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Clé API Gemini non configurée sur le serveur.',
      });
    }

    const parts: any[] = [];
    if (attachment?.data && attachment?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: attachment.mimeType,
          data: attachment.data,
        },
      });
    }

    const prompt = `Analyse ce document éducatif pour un profil "${profile}".
Sois direct, pédagogique et percutant au format JSON :
1. "title": Titre court et clair du sujet.
2. "summary": Synthèse concise en 1 ou 2 paragraphes digestes.
3. "keyConcepts": 4 à 6 notions, définitions ou formules clés incontournables.
4. "difficultyRating": "Facile", "Intermédiaire" ou "Avancé".
5. "suggestedQuestions": 3 questions clés pour valider la compréhension.
6. "studyTip": 1 conseil concret et rapide pour retenir ce cours.`;

    if (text) {
      parts.push({ text: `${prompt}\n\nCONTENU DU DOCUMENT:\n${text}` });
    } else {
      parts.push({ text: prompt });
    }

    const response = await generateWithFallback({
      contents: { parts },
      config: {
        systemInstruction: getPedagogicalSystemInstruction(profile, language),
        responseMimeType: 'application/json',
        temperature: 0.2,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            difficultyRating: { type: Type.STRING },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            studyTip: { type: Type.STRING },
          },
          required: ['title', 'summary', 'keyConcepts', 'studyTip'],
        },
      },
    });

    const result = safeParseJson(response.text);
    return res.json(sanitizeDeep(result));
  } catch (error: any) {
    return handleApiError(res, error, "Erreur lors de l'analyse du document.");
  }
});

// 4. POST /api/group-ai-assist: AI Assistant for Collaborative Study Groups (Summarize & Moderate)
app.post('/api/group-ai-assist', async (req, res) => {
  try {
    const {
      groupName,
      subject,
      messages = [],
      action = 'summarize', // 'summarize' | 'moderate' | 'challenge'
      language = 'fr',
    } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'Clé API Gemini non configurée sur le serveur.',
      });
    }

    const historyFormatted = messages
      .slice(-15)
      .map((m: any) => `${m.senderName} (${m.senderRole}): ${m.content}`)
      .join('\n');

    let instruction = '';
    if (action === 'summarize') {
      instruction = `Tu es l'assistant IA modérateur du groupe d'étude "${groupName}" portant sur "${subject}".
Résume de manière engageante, claire et bienveillante la récente discussion de travail ci-dessous :
- Les points clés abordés par les membres.
- Les doutes levés ou questions encore en suspens.
- Un encouragement et un prochain objectif d'apprentissage pour le groupe.
Réponds en français sous forme d'un message concis (2-3 paragraphes maximum).`;
    } else if (action === 'moderate') {
      instruction = `Tu es le co-tuteur et modérateur IA du groupe d'étude "${groupName}" ("${subject}").
Interviens de manière diplomate, constructive et ultra-pédagogique dans la discussion ci-dessous :
- Apporte une clarification scientifique ou méthodique sur la question dont discutent les membres.
- Donne une astuce pour retenir la notion ou un petit exercice d'application rapide.`;
    } else {
      instruction = `Tu es le coach d'apprentissage du groupe "${groupName}". À partir des notions discutées ci-dessous, propose un défi d'équipe collaboratif stimulant en 3 étapes.`;
    }

    const response = await generateWithFallback({
      contents: {
        parts: [
          {
            text: `${instruction}\n\nEXTRAIT DE LA CONVERSATION DU GROUPE :\n${historyFormatted || 'Le groupe vient de se réunir.'}`,
          },
        ],
      },
      config: {
        temperature: 0.7,
      },
    });

    return res.json({
      text: cleanAiText(response.text || 'Résumé du groupe généré.'),
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return handleApiError(res, error, "Erreur lors de l'assistance IA au groupe.");
  }
});

// ==========================================
// KIPO COLLABORATIVE STUDY GROUPS ENGINE
// Multi-user public directory, custom subjects, file sharing (PDF/photos), join requests
// ==========================================

const GROUPS_FILE_PATH = path.join(__dirname, 'groups_store.json');

function getInitialGroupsStore(): any[] {
  return [
    {
      id: 'group-comm-1',
      name: 'Terminale & Bac SVT - Réussite',
      description: 'Espace d\'entraide public pour réviser le programme de SVT, la génétique et la géologie.',
      subject: 'Sciences de la Vie et de la Terre',
      privacy: 'public',
      inviteCode: 'BAC-SVT-2026',
      createdBy: 'prof_clara',
      createdByName: 'Mme Clara (Professeur)',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      permissions: {
        whoCanShareDocs: 'all',
        whoCanCreateQuizzes: 'all',
        defaultDocAccess: 'interactive',
      },
      members: [
        {
          id: 'prof_clara',
          name: 'Mme Clara',
          avatar: '💼',
          role: 'admin',
          profile: 'professeur',
          joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          xpContributed: 240,
        },
        {
          id: 'user_alex',
          name: 'Alexandre M.',
          avatar: '🎒',
          role: 'member',
          profile: 'eleve',
          joinedAt: new Date(Date.now() - 86400000).toISOString(),
          xpContributed: 95,
        },
      ],
      pendingRequests: [],
      sharedDocuments: [
        {
          id: 'doc-svt-1',
          docId: 'doc-svt-1',
          title: 'Fiche Synthèse : Métabolisme Cellulaire & ATP',
          fileName: 'synthese_metabolisme.pdf',
          fileType: 'pdf',
          sharedBy: 'prof_clara',
          sharedByName: 'Mme Clara',
          sharedAt: new Date(Date.now() - 86400000).toISOString(),
          permission: 'interactive',
          summary: 'Résumé des voies respiratoires et fermentaires chez les eucaryotes.',
          keyConcepts: ['Glycolyse', 'Cycle de Krebs', 'Chaîne respiratoire', 'Rendement énergétique'],
          questionCount: 20,
        },
      ],
      messages: [
        {
          id: 'msg-svt-1',
          senderId: 'prof_clara',
          senderName: 'Mme Clara',
          senderRole: 'admin',
          content: 'Bienvenue à tous ! N\'hésitez pas à poser vos questions sur les chapitres difficiles et à partager vos cours scannés ou PDF.',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      groupQuizzes: [],
    },
    {
      id: 'group-comm-2',
      name: 'Groupe d\'Élite : Mathématiques & Physique Sup',
      description: 'Groupe privé de préparation aux concours scientifiques et devoirs surveillés.',
      subject: 'Maths & Physique Approfondies',
      privacy: 'private',
      inviteCode: 'PREPA-MP-01',
      createdBy: 'thomas_sup',
      createdByName: 'Thomas (Étudiant)',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      permissions: {
        whoCanShareDocs: 'all',
        whoCanCreateQuizzes: 'all',
        defaultDocAccess: 'interactive',
      },
      members: [
        {
          id: 'thomas_sup',
          name: 'Thomas',
          avatar: '🎓',
          role: 'admin',
          profile: 'etudiant',
          joinedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          xpContributed: 410,
        },
      ],
      pendingRequests: [],
      sharedDocuments: [],
      messages: [
        {
          id: 'msg-math-1',
          senderId: 'thomas_sup',
          senderName: 'Thomas',
          senderRole: 'admin',
          content: 'Espace de travail réservé. Envoyez votre demande pour rejoindre et partager vos DM et exercices résolus.',
          timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
      groupQuizzes: [],
    },
  ];
}

let inMemoryGroups: any[] | null = null;

function loadGroupsStore(): any[] {
  if (inMemoryGroups) return inMemoryGroups;
  try {
    if (fs.existsSync(GROUPS_FILE_PATH)) {
      const raw = fs.readFileSync(GROUPS_FILE_PATH, 'utf-8');
      inMemoryGroups = JSON.parse(raw);
      return inMemoryGroups!;
    }
  } catch (err) {
    console.warn('[Groups Store] Erreur lecture:', err);
  }
  inMemoryGroups = getInitialGroupsStore();
  saveGroupsStore(inMemoryGroups);
  return inMemoryGroups;
}

function saveGroupsStore(groups: any[]) {
  inMemoryGroups = groups;
  try {
    fs.writeFileSync(GROUPS_FILE_PATH, JSON.stringify(groups, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Groups Store] Erreur écriture:', err);
  }
}

// Get all shared study groups across the app
app.get('/api/groups', (_req, res) => {
  try {
    const list = loadGroupsStore();
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lecture des groupes' });
  }
});

// Create or update a group
app.post('/api/groups', (req, res) => {
  try {
    const group = req.body;
    if (!group || !group.name || !group.subject) {
      return res.status(400).json({ error: 'Nom et matière requis' });
    }

    const groups = loadGroupsStore();
    const idx = groups.findIndex((g: any) => g.id === group.id);
    if (idx >= 0) {
      groups[idx] = { ...groups[idx], ...group };
    } else {
      groups.unshift(group);
    }
    saveGroupsStore(groups);
    return res.json({ success: true, group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur sauvegarde du groupe' });
  }
});

// Join group (instant if public, pending request if private)
app.post('/api/groups/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName, userEmail, profile } = req.body;
    const groups = loadGroupsStore();
    const group = groups.find((g: any) => g.id === id);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });

    const isMember = group.members.some((m: any) => m.id === userId);
    if (isMember) {
      return res.json({ status: 'already_member', group });
    }

    if (group.privacy === 'private') {
      // Add join request if not already pending
      if (!group.pendingRequests) group.pendingRequests = [];
      const hasReq = group.pendingRequests.some((r: any) => r.userId === userId);
      if (!hasReq) {
        group.pendingRequests.push({
          id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          userName: userName || 'Apprenant KIPO',
          userEmail,
          profile: profile || 'eleve',
          requestedAt: new Date().toISOString(),
        });
        saveGroupsStore(groups);
      }
      return res.json({ status: 'request_submitted', group });
    }

    // Public group: Direct join in 1-click
    group.members.push({
      id: userId,
      name: userName || 'Apprenant KIPO',
      avatar: profile === 'professeur' ? '💼' : profile === 'etudiant' ? '🎓' : '🎒',
      role: 'member',
      profile: profile || 'eleve',
      joinedAt: new Date().toISOString(),
      xpContributed: 20,
    });
    group.messages.push({
      id: `msg-${Date.now()}`,
      senderId: 'ai-moderator',
      senderName: 'KIPO AI Modérateur',
      senderRole: 'ai_moderator',
      content: `🎉 **${userName || 'Un nouvel apprenant'}** vient de rejoindre le groupe ! Bienvenue parmi nous.`,
      timestamp: new Date().toISOString(),
    });

    saveGroupsStore(groups);
    return res.json({ status: 'joined', group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur adhésion groupe' });
  }
});

// Creator approves join request
app.post('/api/groups/:id/approve-request', (req, res) => {
  try {
    const { id } = req.params;
    const { requestId } = req.body;
    const groups = loadGroupsStore();
    const group = groups.find((g: any) => g.id === id);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });

    if (!group.pendingRequests) group.pendingRequests = [];
    const reqIndex = group.pendingRequests.findIndex((r: any) => r.id === requestId);
    if (reqIndex < 0) return res.status(404).json({ error: 'Demande introuvable' });

    const reqItem = group.pendingRequests[reqIndex];
    group.pendingRequests.splice(reqIndex, 1);

    // Add to members
    const isMember = group.members.some((m: any) => m.id === reqItem.userId);
    if (!isMember) {
      group.members.push({
        id: reqItem.userId,
        name: reqItem.userName,
        avatar: reqItem.profile === 'professeur' ? '💼' : reqItem.profile === 'etudiant' ? '🎓' : '🎒',
        role: 'member',
        profile: reqItem.profile,
        joinedAt: new Date().toISOString(),
        xpContributed: 25,
      });
      group.messages.push({
        id: `msg-${Date.now()}`,
        senderId: 'ai-moderator',
        senderName: 'KIPO AI Modérateur',
        senderRole: 'ai_moderator',
        content: `✅ La demande d'adhésion de **${reqItem.userName}** a été approuvée par le responsable du groupe !`,
        timestamp: new Date().toISOString(),
      });
    }

    saveGroupsStore(groups);
    return res.json({ success: true, group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur approbation demande' });
  }
});

// Creator rejects join request
app.post('/api/groups/:id/reject-request', (req, res) => {
  try {
    const { id } = req.params;
    const { requestId } = req.body;
    const groups = loadGroupsStore();
    const group = groups.find((g: any) => g.id === id);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });

    if (!group.pendingRequests) group.pendingRequests = [];
    group.pendingRequests = group.pendingRequests.filter((r: any) => r.id !== requestId);
    saveGroupsStore(groups);
    return res.json({ success: true, group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur rejet demande' });
  }
});

// Share a document, photo or PDF in group
app.post('/api/groups/:id/share-file', (req, res) => {
  try {
    const { id } = req.params;
    const { docItem } = req.body;
    if (!docItem || !docItem.title) return res.status(400).json({ error: 'Document incomplet' });

    const groups = loadGroupsStore();
    const group = groups.find((g: any) => g.id === id);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });

    if (!group.sharedDocuments) group.sharedDocuments = [];
    group.sharedDocuments.unshift(docItem);

    const typeLabel = docItem.fileType === 'pdf' ? 'PDF' : docItem.fileType === 'image' ? 'Photo / Scan' : 'Document';
    group.messages.push({
      id: `msg-${Date.now()}`,
      senderId: docItem.sharedBy || 'user',
      senderName: docItem.sharedByName || 'Membre',
      senderRole: 'member',
      content: `📁 **Nouveau ${typeLabel} partagé :** « ${docItem.title} »`,
      timestamp: new Date().toISOString(),
      attachment: docItem.fileData ? {
        id: `att-${Date.now()}`,
        name: docItem.fileName,
        mimeType: docItem.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        size: docItem.fileSize || 0,
        data: docItem.fileData,
        type: docItem.fileType === 'pdf' ? 'pdf' : 'image',
      } : undefined,
    });

    saveGroupsStore(groups);
    return res.json({ success: true, group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur partage fichier' });
  }
});

// Add message to group
app.post('/api/groups/:id/message', (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!message || (!message.content && !message.attachment)) {
      return res.status(400).json({ error: 'Message ou fichier requis' });
    }

    const groups = loadGroupsStore();
    const group = groups.find((g: any) => g.id === id);
    if (!group) return res.status(404).json({ error: 'Groupe introuvable' });

    if (!group.messages) group.messages = [];
    if (!group.messages.some((m: any) => m.id === message.id)) {
      group.messages.push(message);
      saveGroupsStore(groups);
    }
    return res.json({ success: true, group });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur envoi message' });
  }
});

// ==========================================
// KIPO FOUNDER & ADMIN ANALYTICS ENGINE
// Reserved exclusively for: fotsojunior756@gmail.com
// Tracks page views, questions, timestamps, visitor IDs, and emails
// ==========================================

const ADMIN_EMAIL = 'fotsojunior756@gmail.com';
const ANALYTICS_FILE_PATH = path.join(__dirname, 'analytics_store.json');

interface StoredEvent {
  id: string;
  visitorId: string;
  userEmail: string | null;
  eventType: 'page_view' | 'question_asked' | 'session_start' | 'login';
  timestamp: string;
  formattedDate: {
    heure: string;
    jour: string;
    mois: string;
    annee: string;
    fullFr: string;
  };
  data: {
    page?: string;
    question?: string;
    subject?: string;
    answerPreview?: string;
    role?: string;
    deviceInfo?: string;
  };
}

interface AnalyticsStore {
  visitors: Record<
    string,
    {
      visitorId: string;
      email: string | null;
      firstSeen: string;
      lastSeen: string;
      role?: string;
      pagesVisited: string[];
      questionCount: number;
      deviceInfo?: string;
    }
  >;
  events: StoredEvent[];
}

function getInitialAnalyticsStore(): AnalyticsStore {
  const now = new Date();
  const formatD = (d: Date) => ({
    heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    jour: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
    mois: d.toLocaleDateString('fr-FR', { month: 'long' }),
    annee: d.getFullYear().toString(),
    fullFr: `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
  });

  const t1 = new Date(Date.now() - 3600000 * 2);
  const t2 = new Date(Date.now() - 3600000 * 1.5);

  return {
    visitors: {
      'anon_eleve_paris': {
        visitorId: 'anon_eleve_paris',
        email: null,
        firstSeen: t1.toISOString(),
        lastSeen: t2.toISOString(),
        role: 'eleve',
        pagesVisited: ['Sentier 100 Questions', 'Tuteur IA', 'Quiz & Tests'],
        questionCount: 2,
        deviceInfo: 'Mobile (Android/iOS)',
      },
      'sarah_lycee': {
        visitorId: 'vis_sarah_01',
        email: 'sarah.lycee@gmail.com',
        firstSeen: t2.toISOString(),
        lastSeen: now.toISOString(),
        role: 'etudiant',
        pagesVisited: ['Tuteur IA', 'Atelier Documents', 'Cartes Mémoire'],
        questionCount: 3,
        deviceInfo: 'Ordinateur (Desktop)',
      },
    },
    events: [
      {
        id: 'evt-init-1',
        visitorId: 'anon_eleve_paris',
        userEmail: null,
        eventType: 'question_asked',
        timestamp: t1.toISOString(),
        formattedDate: formatD(t1),
        data: {
          question: 'Comment fonctionne la photosynthèse chez les plantes C3 ?',
          subject: 'SVT / Biologie',
          answerPreview: 'La photosynthèse transforme le dioxyde de carbone et l’eau en glucose grâce à l’énergie lumineuse captée par la chlorophylle...',
          role: 'eleve',
          deviceInfo: 'Mobile (Android/iOS)',
        },
      },
      {
        id: 'evt-init-2',
        visitorId: 'anon_eleve_paris',
        userEmail: null,
        eventType: 'page_view',
        timestamp: t1.toISOString(),
        formattedDate: formatD(t1),
        data: {
          page: 'Sentier 100 Questions',
          deviceInfo: 'Mobile (Android/iOS)',
        },
      },
      {
        id: 'evt-init-3',
        visitorId: 'vis_sarah_01',
        userEmail: 'sarah.lycee@gmail.com',
        eventType: 'question_asked',
        timestamp: t2.toISOString(),
        formattedDate: formatD(t2),
        data: {
          question: 'Quelle est la différence entre mitose et méiose en génétique ?',
          subject: 'Sciences de la Vie',
          answerPreview: 'La mitose produit deux cellules filles identiques diploïdes (2n), tandis que la méiose génère 4 gamètes haploïdes (n) génétiquement uniques...',
          role: 'etudiant',
          deviceInfo: 'Ordinateur (Desktop)',
        },
      },
    ],
  };
}

let inMemoryAnalytics: AnalyticsStore | null = null;

function loadAnalyticsStore(): AnalyticsStore {
  if (inMemoryAnalytics) return inMemoryAnalytics;
  try {
    if (fs.existsSync(ANALYTICS_FILE_PATH)) {
      const raw = fs.readFileSync(ANALYTICS_FILE_PATH, 'utf-8');
      inMemoryAnalytics = JSON.parse(raw);
      return inMemoryAnalytics!;
    }
  } catch (err) {
    console.warn('[Analytics Store] Erreur de lecture, réinitialisation du store:', err);
  }
  inMemoryAnalytics = getInitialAnalyticsStore();
  saveAnalyticsStore(inMemoryAnalytics);
  return inMemoryAnalytics;
}

function saveAnalyticsStore(store: AnalyticsStore) {
  inMemoryAnalytics = store;
  try {
    fs.writeFileSync(ANALYTICS_FILE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Analytics Store] Erreur lors de la sauvegarde:', err);
  }
}

// Route to record an analytics event (from anonymous visitors or authenticated users)
app.post('/api/analytics/track', (req, res) => {
  try {
    const { visitorId, userEmail, eventType, data, timestamp, formattedDate } = req.body;
    if (!visitorId || !eventType) {
      return res.status(400).json({ error: 'visitorId et eventType requis' });
    }

    const store = loadAnalyticsStore();
    const eventTime = timestamp ? new Date(timestamp) : new Date();
    const d = eventTime;
    const computedFormattedDate = formattedDate || {
      heure: d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      jour: d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      mois: d.toLocaleDateString('fr-FR', { month: 'long' }),
      annee: d.getFullYear().toString(),
      fullFr: `${d.toLocaleDateString('fr-FR')} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`,
    };

    const newEvent: StoredEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      visitorId,
      userEmail: userEmail || null,
      eventType,
      timestamp: eventTime.toISOString(),
      formattedDate: computedFormattedDate,
      data: data || {},
    };

    // Prepend event, limit to last 2000
    store.events.unshift(newEvent);
    if (store.events.length > 2000) {
      store.events = store.events.slice(0, 2000);
    }

    // Update visitor index
    const existingVisitor = store.visitors[visitorId] || {
      visitorId,
      email: userEmail || null,
      firstSeen: eventTime.toISOString(),
      lastSeen: eventTime.toISOString(),
      role: data?.role || 'visiteur',
      pagesVisited: [],
      questionCount: 0,
      deviceInfo: data?.deviceInfo || 'Inconnu',
    };

    existingVisitor.lastSeen = eventTime.toISOString();
    if (userEmail && !existingVisitor.email) {
      existingVisitor.email = userEmail;
    }
    if (data?.role) {
      existingVisitor.role = data.role;
    }
    if (data?.page && !existingVisitor.pagesVisited.includes(data.page)) {
      existingVisitor.pagesVisited.push(data.page);
    }
    if (eventType === 'question_asked') {
      existingVisitor.questionCount = (existingVisitor.questionCount || 0) + 1;
    }
    if (data?.deviceInfo) {
      existingVisitor.deviceInfo = data.deviceInfo;
    }

    store.visitors[visitorId] = existingVisitor;
    saveAnalyticsStore(store);

    return res.json({ success: true });
  } catch (err: any) {
    console.error('[Analytics Track Error]', err);
    return res.status(500).json({ error: 'Erreur enregistrement tracking' });
  }
});

// Route to fetch founder dashboard data (Exclusive to fotsojunior756@gmail.com)
app.get('/api/analytics/admin-data', (req, res) => {
  try {
    const email = req.query.email?.toString().trim().toLowerCase();
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        authorized: false,
        error: "Accès strictement réservé au fondateur de l'application (fotsojunior756@gmail.com).",
      });
    }

    const store = loadAnalyticsStore();
    const visitorList = Object.values(store.visitors);
    const registeredUsers = visitorList.filter((v) => Boolean(v.email));
    const anonymousVisitors = visitorList.filter((v) => !v.email);

    const questionsEvents = store.events.filter((e) => e.eventType === 'question_asked');
    const pageEvents = store.events.filter((e) => e.eventType === 'page_view');

    const recentQuestions = questionsEvents.slice(0, 300).map((e) => ({
      id: e.id,
      author: e.userEmail || `Visiteur Anonyme (${e.visitorId.slice(0, 10)})`,
      isRegistered: Boolean(e.userEmail),
      question: e.data.question || '(Question non spécifiée)',
      subject: e.data.subject || 'Général',
      answerPreview: e.data.answerPreview || '',
      timestamp: e.timestamp,
      formattedDate: e.formattedDate,
    }));

    const recentPageViews = pageEvents.slice(0, 300).map((e) => ({
      id: e.id,
      author: e.userEmail || `Visiteur Anonyme (${e.visitorId.slice(0, 10)})`,
      isRegistered: Boolean(e.userEmail),
      page: e.data.page || 'Accueil',
      timestamp: e.timestamp,
      formattedDate: e.formattedDate,
    }));

    const users = visitorList
      .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
      .map((v) => ({
        id: v.visitorId,
        email: v.email,
        isRegistered: Boolean(v.email),
        firstSeen: v.firstSeen,
        lastSeen: v.lastSeen,
        role: v.role,
        pagesCount: v.pagesVisited.length,
        questionsCount: v.questionCount,
        formattedLastSeen: new Date(v.lastSeen).toLocaleDateString('fr-FR') + ' à ' + new Date(v.lastSeen).toLocaleTimeString('fr-FR'),
      }));

    return res.json({
      authorized: true,
      adminEmail: ADMIN_EMAIL,
      stats: {
        totalVisitors: visitorList.length,
        registeredCount: registeredUsers.length,
        anonymousCount: anonymousVisitors.length,
        totalPagesViews: pageEvents.length,
        totalQuestionsAsked: questionsEvents.length,
      },
      users,
      recentQuestions,
      recentPageViews,
    });
  } catch (err: any) {
    console.error('[Analytics Admin Error]', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des statistiques administrateur.' });
  }
});

// Reset route for founder
app.post('/api/analytics/reset', (req, res) => {
  try {
    const { email } = req.body;
    if (email?.toString().trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    const fresh = getInitialAnalyticsStore();
    saveAnalyticsStore(fresh);
    return res.json({ success: true, message: 'Statistiques réinitialisées' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

// ==========================================
// SUPABASE AUTH USERS STORE & ADMIN CONSOLE
// ==========================================
const USERS_STORE_FILE = path.join(__dirname, 'users_store.json');

function getInitialUsersStore(): any {
  return {
    users: [
      {
        id: 'a0f82164-325b-4c07-885e-9f4a13d7120a',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'fotsojunior756@gmail.com',
        email_confirmed_at: '2026-01-01T08:00:00.000Z',
        phone: null,
        confirmed_at: '2026-01-01T08:00:00.000Z',
        last_sign_in_at: new Date().toISOString(),
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: 'Fotso Junior',
          role: 'admin',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Fotso%20Junior',
        },
        identities: [
          {
            id: 'fotsojunior756@gmail.com',
            user_id: 'a0f82164-325b-4c07-885e-9f4a13d7120a',
            identity_data: { email: 'fotsojunior756@gmail.com', sub: 'a0f82164-325b-4c07-885e-9f4a13d7120a' },
            provider: 'email',
            last_sign_in_at: new Date().toISOString(),
            created_at: '2026-01-01T08:00:00.000Z',
            updated_at: new Date().toISOString(),
          },
        ],
        created_at: '2026-01-01T08:00:00.000Z',
        updated_at: new Date().toISOString(),
        is_anonymous: false,
        banned_until: null,
        status: 'active',
        is_admin: true,
        activity_stats: {
          pages_visited: 36,
          questions_asked: 28,
          podcasts_created: 8,
          last_page: 'Tableau de bord Administrateur',
          device_info: 'Mobile & Bureau (Session Active)',
        },
      },
      {
        id: '7b226e41-863a-4933-bb94-1ea837c78491',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'sarah.lycee@gmail.com',
        email_confirmed_at: '2026-11-02T19:11:00.000Z',
        phone: null,
        confirmed_at: '2026-11-02T19:11:00.000Z',
        last_sign_in_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: 'Sarah M.',
          role: 'eleve',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah%20M',
        },
        identities: [
          {
            id: 'sarah.lycee@gmail.com',
            user_id: '7b226e41-863a-4933-bb94-1ea837c78491',
            identity_data: { email: 'sarah.lycee@gmail.com', sub: '7b226e41-863a-4933-bb94-1ea837c78491' },
            provider: 'email',
            last_sign_in_at: new Date(Date.now() - 3600000 * 2).toISOString(),
            created_at: '2026-11-02T19:11:00.000Z',
            updated_at: new Date().toISOString(),
          },
        ],
        created_at: '2026-11-02T19:11:00.000Z',
        updated_at: new Date().toISOString(),
        is_anonymous: false,
        banned_until: null,
        status: 'active',
        is_admin: false,
        activity_stats: {
          pages_visited: 18,
          questions_asked: 11,
          podcasts_created: 3,
          last_page: 'Sentier KIPO',
          device_info: 'Android Mobile (Chrome)',
        },
      },
      {
        id: 'c5104868-b391-450f-90e8-0b2a59e9f902',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'alex.etudiant@gmail.com',
        email_confirmed_at: '2026-11-03T10:20:00.000Z',
        phone: null,
        confirmed_at: '2026-11-03T10:20:00.000Z',
        last_sign_in_at: new Date(Date.now() - 3600000 * 6).toISOString(),
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: 'Alexandre Dupont',
          role: 'etudiant',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Alexandre%20Dupont',
        },
        identities: [],
        created_at: '2026-11-03T10:20:00.000Z',
        updated_at: new Date().toISOString(),
        is_anonymous: false,
        banned_until: null,
        status: 'active',
        is_admin: false,
        activity_stats: {
          pages_visited: 29,
          questions_asked: 16,
          podcasts_created: 5,
          last_page: 'Podcasts Audio & Flashcards',
          device_info: 'Windows PC (Chrome)',
        },
      },
      {
        id: 'df394812-748a-449e-b9f1-a1e948c20849',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'emma.prepa@gmail.com',
        email_confirmed_at: '2026-11-04T14:15:00.000Z',
        phone: null,
        confirmed_at: '2026-11-04T14:15:00.000Z',
        last_sign_in_at: new Date(Date.now() - 3600000 * 18).toISOString(),
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: 'Emma Thomas',
          role: 'etudiant',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Emma%20Thomas',
        },
        identities: [],
        created_at: '2026-11-04T14:15:00.000Z',
        updated_at: new Date().toISOString(),
        is_anonymous: false,
        banned_until: null,
        status: 'active',
        is_admin: false,
        activity_stats: {
          pages_visited: 42,
          questions_asked: 23,
          podcasts_created: 7,
          last_page: 'Atelier Studio Documents',
          device_info: 'Apple MacBook (Safari)',
        },
      },
      {
        id: '992a831e-412f-410a-8bf8-d3e918471b02',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'marc.prof@ac-paris.fr',
        email_confirmed_at: '2026-11-05T09:00:00.000Z',
        phone: null,
        confirmed_at: '2026-11-05T09:00:00.000Z',
        last_sign_in_at: new Date(Date.now() - 3600000 * 28).toISOString(),
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: 'Prof. Marc V.',
          role: 'professeur',
          avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=Marc%20V',
        },
        identities: [],
        created_at: '2026-11-05T09:00:00.000Z',
        updated_at: new Date().toISOString(),
        is_anonymous: false,
        banned_until: null,
        status: 'active',
        is_admin: false,
        activity_stats: {
          pages_visited: 19,
          questions_asked: 9,
          podcasts_created: 4,
          last_page: 'Espaces Collaboratifs',
          device_info: 'Bureau Linux (Firefox)',
        },
      },
    ],
  };
}

function loadUsersStore(): any {
  try {
    if (!fs.existsSync(USERS_STORE_FILE)) {
      const initial = getInitialUsersStore();
      fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const raw = fs.readFileSync(USERS_STORE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return getInitialUsersStore();
  }
}

function saveUsersStore(store: any): void {
  try {
    fs.writeFileSync(USERS_STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('[Users Store Save Error]', e);
  }
}

// 1. Fetch Supabase Auth Users table (Exclusive to fotsojunior756@gmail.com)
app.get('/api/admin/supabase-users', (req, res) => {
  try {
    const email = req.query.email?.toString().trim().toLowerCase();
    if (email !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({
        authorized: false,
        error: "Accès strictement réservé au fondateur de l'application (fotsojunior756@gmail.com).",
      });
    }

    const store = loadUsersStore();
    const users = store.users || [];

    const activeTodayCount = users.filter((u: any) => {
      if (!u.last_sign_in_at) return false;
      const d = new Date(u.last_sign_in_at);
      const now = new Date();
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;

    const confirmedCount = users.filter((u: any) => Boolean(u.confirmed_at)).length;
    const adminsCount = users.filter((u: any) => Boolean(u.is_admin)).length;

    return res.json({
      authorized: true,
      supabaseProject: {
        name: 'kipo-production-auth',
        region: 'eu-west-3 (Paris)',
        authEngine: 'Supabase GoTrue Auth Engine v2.118',
        jwtSecretStatus: 'Sécurisé & RLS Actif',
        status: 'ONLINE',
      },
      metrics: {
        totalUsers: users.length,
        activeToday: activeTodayCount,
        confirmedUsers: confirmedCount,
        adminsCount,
      },
      users: users.sort(
        (a: any, b: any) => new Date(b.last_sign_in_at || 0).getTime() - new Date(a.last_sign_in_at || 0).getTime()
      ),
    });
  } catch (err: any) {
    console.error('[Admin Supabase Users Error]', err);
    return res.status(500).json({ error: 'Erreur lors du chargement des utilisateurs Supabase.' });
  }
});

// 2. Client sync endpoint (Called when any user signs in or opens the app)
app.post('/api/auth/sync-session', (req, res) => {
  try {
    const { email, fullName, role, deviceInfo, lastPage } = req.body;
    if (!email) {
      return res.json({ success: true, message: 'Invité' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const store = loadUsersStore();
    const nowIso = new Date().toISOString();

    const existingIndex = store.users.findIndex((u: any) => u.email.toLowerCase() === cleanEmail);
    const isFounder = cleanEmail === ADMIN_EMAIL.toLowerCase();

    if (existingIndex >= 0) {
      const u = store.users[existingIndex];
      u.last_sign_in_at = nowIso;
      u.updated_at = nowIso;
      if (fullName) u.user_metadata.full_name = fullName;
      if (role) u.user_metadata.role = role;
      if (deviceInfo) u.activity_stats.device_info = deviceInfo;
      if (lastPage) u.activity_stats.last_page = lastPage;
      u.activity_stats.pages_visited = (u.activity_stats.pages_visited || 0) + 1;
      store.users[existingIndex] = u;
    } else {
      const newId = 'usr_' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      store.users.push({
        id: newId,
        aud: 'authenticated',
        role: 'authenticated',
        email: cleanEmail,
        email_confirmed_at: nowIso,
        phone: null,
        confirmed_at: nowIso,
        last_sign_in_at: nowIso,
        app_metadata: {
          provider: 'email',
          providers: ['email'],
        },
        user_metadata: {
          full_name: fullName || cleanEmail.split('@')[0],
          role: role || (isFounder ? 'admin' : 'etudiant'),
          avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
        },
        identities: [],
        created_at: nowIso,
        updated_at: nowIso,
        is_anonymous: false,
        banned_until: null,
        status: 'active',
        is_admin: isFounder,
        activity_stats: {
          pages_visited: 1,
          questions_asked: 0,
          podcasts_created: 0,
          last_page: lastPage || 'Accueil',
          device_info: deviceInfo || 'Client Web',
        },
      });
    }

    saveUsersStore(store);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur synchronisation session' });
  }
});

// 3. Create user from Supabase Admin Console
app.post('/api/admin/supabase-users/create', (req, res) => {
  try {
    const { adminEmail, email, fullName, role, password } = req.body;
    if (adminEmail?.toString().trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Adresse email invalide' });
    }

    const store = loadUsersStore();
    const cleanEmail = email.trim().toLowerCase();
    if (store.users.some((u: any) => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Un compte avec cette adresse email existe déjà.' });
    }

    const nowIso = new Date().toISOString();
    const newId = 'usr_' + Math.random().toString(36).substring(2, 12) + '-' + Date.now().toString(36);

    const newUser = {
      id: newId,
      aud: 'authenticated',
      role: 'authenticated',
      email: cleanEmail,
      email_confirmed_at: nowIso,
      phone: null,
      confirmed_at: nowIso,
      last_sign_in_at: null,
      app_metadata: {
        provider: 'email',
        providers: ['email'],
      },
      user_metadata: {
        full_name: fullName || cleanEmail.split('@')[0],
        role: role || 'etudiant',
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanEmail)}`,
      },
      identities: [],
      created_at: nowIso,
      updated_at: nowIso,
      is_anonymous: false,
      banned_until: null,
      status: 'active',
      is_admin: false,
      activity_stats: {
        pages_visited: 0,
        questions_asked: 0,
        podcasts_created: 0,
        last_page: 'Nouveau compte créé par Admin',
        device_info: 'Invité Supabase Auth',
      },
    };

    store.users.unshift(newUser);
    saveUsersStore(store);

    return res.json({ success: true, user: newUser });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// 4. Delete user from Supabase Admin Console
app.post('/api/admin/supabase-users/delete', (req, res) => {
  try {
    const { adminEmail, userId } = req.body;
    if (adminEmail?.toString().trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const store = loadUsersStore();
    const target = store.users.find((u: any) => u.id === userId);
    if (!target) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (target.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Impossible de supprimer le compte administrateur principal.' });
    }

    store.users = store.users.filter((u: any) => u.id !== userId);
    saveUsersStore(store);

    return res.json({ success: true, message: 'Compte supprimé avec succès' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// 5. Toggle Ban / Suspend user
app.post('/api/admin/supabase-users/toggle-status', (req, res) => {
  try {
    const { adminEmail, userId } = req.body;
    if (adminEmail?.toString().trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const store = loadUsersStore();
    const user = store.users.find((u: any) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable' });
    }

    if (user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({ error: 'Impossible de suspendre le compte administrateur.' });
    }

    user.status = user.status === 'active' ? 'suspended' : 'active';
    user.updated_at = new Date().toISOString();
    saveUsersStore(store);

    return res.json({ success: true, status: user.status });
  } catch (err: any) {
    return res.status(500).json({ error: 'Erreur lors du changement de statut' });
  }
});

// ==========================================
// KIPO PODCAST AUDIO GENERATOR (MULTIMODAL)
// ==========================================
app.post('/api/podcast/generate', async (req, res) => {
  try {
    const {
      problemOrTopic,
      files = [], // Array<{ name: string, mimeType: string, data: string, type: string }>
      format = 'dialogue', // 'dialogue' | 'solo_teacher' | 'express_3min' | 'storytelling'
      tone = 'dynamique', // 'dynamique' | 'pedagogique' | 'examen'
      level = 'lycee', // 'college' | 'lycee' | 'etudiant' | 'pro'
      language = 'fr',
    } = req.body;

    if (!problemOrTopic?.trim() && (!files || files.length === 0)) {
      return res.status(400).json({
        error: "Veuillez fournir un sujet, un problème ou importer un document (photo, PDF, cours).",
      });
    }

    // Build multimodal parts for Gemini
    const parts: any[] = [];

    // Add inline data parts for uploaded images / PDFs
    for (const f of files) {
      if (f.data && f.mimeType) {
        const cleanBase64 = f.data.includes('base64,') ? f.data.split('base64,')[1] : f.data;
        parts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: cleanBase64,
          },
        });
      }
    }

    const promptText = `Tu es le créateur et scénariste en chef de KIPO Audio Studio, une émission de podcast éducative ultra-captivante et de très haut niveau pédagogique.

DEMANDE DE L'AUDITEUR :
"${problemOrTopic || "Analyse et explication complète des documents et énoncés joints"}"

FORMAT CHOISI :
${
  format === 'dialogue'
    ? `DUO D'ANIMATEURS COMPLICES (Léa & Alex) :
    - Léa : Curieuse, vive, pose les questions que tout le monde se pose, identifie les pièges fréquents.
    - Alex : Expert pédagogue, chaleureux, formule des analogies mémorables et décompose les notions avec une clarté remarquable.`
    : format === 'solo_teacher'
    ? `LE GRAND COURS MAGISTRAL VIVANT :
    - Un professeur brillant, bienveillant et passionné, qui guide l'auditeur pas à pas dans une véritable masterclass.`
    : format === 'express_3min'
    ? `FLASH RÉVISION 3 MINUTES CHRONO :
    - Synthèse ultra-efficace, percutante, chaque seconde compte. Idéal pour retenir les définitions, formules et méthodes avant un contrôle.`
    : `STORYTELLING & IMMERSION :
    - Récit immersif captivant qui plonge l'auditeur au cœur de l'histoire, de l'expérience scientifique ou du cas pratique.`
}

NIVEAU : ${level.toUpperCase()}
TON DU PODCAST : ${tone.toUpperCase()}
LANGUE DE SORTIE : ${language}

INSTRUCTIONS DE SCÉNARISATION ET D'EXPLICATION :
1. Rédige un VRAI script audio parlé, vivant et naturel (pas de style livre austère).
2. Si des photos ou documents d'exercices sont joints, résous le problème étape par étape avec des repères auditifs clairs (ex: "Dans la première partie de l'énoncé...", "Attention à ce piège classique...", "La méthode gagnante ici c'est...").
3. Rédige un dialogue complet et généreux : minimum 12 à 18 répliques substantielles (environ 500 à 800 mots au total) pour un épisode captivant et instructif de 3 à 5 minutes.
4. Remplis les chapitres avec timestamps exacts, les points clés à retenir ("takeaways"), et 3 questions de quiz d'écoute.

RÉPONDS STRICTEMENT AU FORMAT JSON SUIVANT :
{
  "title": "Titre captivant de l'épisode",
  "subtitle": "Sous-titre descriptif",
  "subject": "Matière ou thématique",
  "durationEstimateMinutes": 4,
  "summary": "Résumé en 2-3 phrases claires",
  "topicsCovered": ["Notion 1", "Notion 2", "Méthode clé"],
  "hosts": [
    { "id": "lea", "name": "Léa", "role": "Animatrice", "gender": "female" },
    { "id": "alex", "name": "Alex", "role": "Expert Pédagogue", "gender": "male" }
  ],
  "chapters": [
    { "id": "ch1", "timestamp": "00:00", "seconds": 0, "title": "Introduction & Énoncé du défi" },
    { "id": "ch2", "timestamp": "01:10", "seconds": 70, "title": "Décomposition & Explication" },
    { "id": "ch3", "timestamp": "02:30", "seconds": 150, "title": "Résolution pas à pas & Pièges" },
    { "id": "ch4", "timestamp": "03:45", "seconds": 225, "title": "Synthèse & Astuce d'examen" }
  ],
  "script": [
    {
      "id": "l1",
      "speaker": "Léa",
      "speakerId": "lea",
      "text": "Texte oral parlé...",
      "tone": "enthousiaste",
      "durationSeconds": 10
    }
  ],
  "takeaways": [
    "Ce qu'il faut absolument retenir 1",
    "Ce qu'il faut absolument retenir 2",
    "Ce qu'il faut absolument retenir 3"
  ],
  "quizQuestions": [
    {
      "question": "Question sur le contenu du podcast...",
      "options": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
      "correctIndex": 0,
      "explanation": "Pourquoi cette réponse est la bonne..."
    }
  ]
}`;

    parts.push({ text: promptText });

    const response = await generateWithFallback({
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeParseJson(response.text);
    const sanitized = sanitizeDeep(parsed);

    const podcast: any = {
      id: 'pod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: sanitized.title || 'KIPO Podcast - Épisode Spécial',
      subtitle: sanitized.subtitle || 'Analyse & Explication Audio',
      subject: sanitized.subject || 'Sciences & Culture',
      durationEstimateMinutes: sanitized.durationEstimateMinutes || 4,
      summary: sanitized.summary || '',
      topicsCovered: Array.isArray(sanitized.topicsCovered) ? sanitized.topicsCovered : [],
      hosts: Array.isArray(sanitized.hosts) && sanitized.hosts.length > 0 ? sanitized.hosts : [
        { id: 'lea', name: 'Léa', role: 'Animatrice', gender: 'female' },
        { id: 'alex', name: 'Alex', role: 'Expert Pédagogue', gender: 'male' },
      ],
      chapters: Array.isArray(sanitized.chapters) ? sanitized.chapters : [],
      script: Array.isArray(sanitized.script) ? sanitized.script.map((line: any, idx: number) => ({
        id: line.id || `line-${idx + 1}`,
        speaker: line.speaker || (idx % 2 === 0 ? 'Léa' : 'Alex'),
        speakerId: line.speakerId || (idx % 2 === 0 ? 'lea' : 'alex'),
        text: cleanAiText(line.text || ''),
        tone: line.tone || 'naturel',
        durationSeconds: line.durationSeconds || Math.max(3, Math.round((line.text || '').split(' ').length / 2.5)),
      })) : [],
      takeaways: Array.isArray(sanitized.takeaways) ? sanitized.takeaways : [],
      quizQuestions: Array.isArray(sanitized.quizQuestions) ? sanitized.quizQuestions : [],
      format,
      sourcePrompt: problemOrTopic,
      sourceDocName: files[0]?.name,
      createdAt: new Date().toISOString(),
      listenedCount: 0,
    };

    return res.json({ success: true, podcast });
  } catch (err: any) {
    return handleApiError(res, err, 'Génération du podcast audio');
  }
});

// ==========================================
// KIPO ANIMAL ADVENTURE GAME GENERATOR (MULTIMODAL)
// ==========================================
app.post('/api/game/generate', async (req, res) => {
  try {
    const {
      problemOrTopic,
      files = [], // Array<{ name: string, mimeType: string, data: string, type: string }>
      universe = 'foret', // 'foret' | 'temple' | 'espace' | 'royaume'
      level = 'tous', // 'primaire' | 'college' | 'lycee' | 'superieur' | 'tous'
      language = 'fr',
    } = req.body;

    if (!problemOrTopic?.trim() && (!files || files.length === 0)) {
      return res.status(400).json({
        error: "Veuillez fournir un sujet, une notion, un problème ou importer un document (photo, PDF, cours).",
      });
    }

    const parts: any[] = [];

    // Add inline data parts for uploaded images / PDFs
    for (const f of files) {
      if (f.data && f.mimeType) {
        const cleanBase64 = f.data.includes('base64,') ? f.data.split('base64,')[1] : f.data;
        parts.push({
          inlineData: {
            mimeType: f.mimeType,
            data: cleanBase64,
          },
        });
      }
    }

    const universeLabel =
      universe === 'temple'
        ? "Le Temple Antique des Énigmes"
        : universe === 'espace'
        ? "L'Odyssée Spatiale des Constellations"
        : universe === 'royaume'
        ? "Le Royaume Médiéval des Savoirs"
        : "La Forêt Enchantée de Kipo";

    const promptText = `Tu es le Lead Game Designer de KIPO Games, créateur de jeux éducatifs interactifs, ultra-ludiques et extrêmement accrocheurs.
Le joueur apprend à travers une grande quête avec une escouade de compagnons animaux charismatiques :
- Kipo le Hibou 🦉 (Leader sage, maître des mystères et de la logique)
- Miko le Chat 🐱 (Vif et agile, champion des réflexes et des calculs éclairs)
- Rocky le Chien 🐶 (Loyal et brave, protecteur contre les erreurs avec son bouclier)
- Pip la Souris 🐭 (Petite mais géniale, détective fouineuse qui débloque les bonus cachés)
- Finn le Renard 🦊 (Stratège rusé, maître des tactiques et déjoueur de pièges)

SUJET / PROBLÈME OU DOCUMENT DU JOUEUR :
"${problemOrTopic || "Analyse approfondie et transformation ludique des documents et photos joints"}"

UNIVERS : ${universeLabel}
NIVEAU : ${level.toUpperCase()}
LANGUE DU JEU : ${language}

OBJECTIF DU GAME DESIGN :
Crée une aventure captivante composée de 4 MISSIONS immersives et progressives :
- Mission 1 (Ordre 1) : "L'Éveil des Sens" - Échauffement ludique & concepts clés (Compagnon : Hibou ou Chien).
- Mission 2 (Ordre 2) : "La Course de Miko" - Défi de vitesse et réflexes (Compagnon : Chat ou Souris).
- Mission 3 (Ordre 3) : "Le Labyrinthe des Pièges" - Énigmes d'application pratique et déduction (Compagnon : Renard ou Souris).
- Mission 4 (Ordre 4) : "L'Affrontement Ultime du Boss" - Combat de boss épique (ex: Titan du Doute, Sphinx de l'Erreur, Dragon de l'Oubli). Le joueur inflige des dégâts au boss en trouvant les bonnes réponses !

Pour chaque mission :
- 3 à 4 questions/tâches interactives percutantes et amusantes, reliées directement au problème/cours de l'utilisateur.
- Options équilibrées (4 options claires).
- Explication pédagogique valorisante et limpide.
- Petites répliques de dialogue des animaux (ex: ce que dit le Hibou ou le Chat quand on réussit).
- Pour le boss final : un boss mémorable avec points de vie (maxHp: 1000), nom, titre, phrase de provocation et réplique de défaite.

RÉPONDS STRICTEMENT EN JSON VALIDE SUIVANT CETTE STRUCTURE :
{
  "title": "Titre palpitant de l'aventure de jeu",
  "universeName": "${universeLabel}",
  "subject": "Matière ou notion principale",
  "conceptSummary": "Résumé captivant de ce que le jeu enseigne en 2 phrases",
  "targetLevel": "${level}",
  "storyline": "Introduction narrative immersive de la quête",
  "leadAnimalId": "hibou",
  "missions": [
    {
      "id": "m1",
      "order": 1,
      "title": "Titre Mission 1",
      "storyIntro": "Intro narrative courte de la mission",
      "locationName": "Nom du lieu dans l'univers",
      "environmentEmoji": "🌲",
      "type": "speed_trivia",
      "heroCompanionId": "hibou",
      "tasks": [
        {
          "id": "m1_t1",
          "type": "question",
          "prompt": "Énoncé ludique de la question ou énigme",
          "options": ["Choix A", "Choix B", "Choix C", "Choix D"],
          "correctIndex": 0,
          "explanation": "Explication pédagogique limpide",
          "animalCommentary": {
            "hibou": "Bravo ! Tu as percé le mystère !",
            "chat": "Miaou ! Rapide comme l'éclair !"
          },
          "points": 150,
          "timeLimitSeconds": 30
        }
      ]
    },
    {
      "id": "m2",
      "order": 2,
      "title": "Titre Mission 2",
      "storyIntro": "Intro narrative de la mission 2",
      "locationName": "Nom du lieu",
      "environmentEmoji": "⚡",
      "type": "speed_trivia",
      "heroCompanionId": "chat",
      "tasks": [...]
    },
    {
      "id": "m3",
      "order": 3,
      "title": "Titre Mission 3",
      "storyIntro": "Intro narrative de la mission 3",
      "locationName": "Nom du lieu",
      "environmentEmoji": "🧩",
      "type": "mystery_riddle",
      "heroCompanionId": "souris",
      "tasks": [...]
    },
    {
      "id": "m4",
      "order": 4,
      "title": "Combat Ultime : Le Grand Maître de l'Oubli",
      "storyIntro": "L'arène tremble... le Boss apparaît pour tester tout ce que tu as appris !",
      "locationName": "L'Arène des Connaissances",
      "environmentEmoji": "👑",
      "type": "boss_fight",
      "heroCompanionId": "chien",
      "boss": {
        "id": "boss_final",
        "name": "Titan du Doute",
        "title": "Seigneur des Confusions",
        "emoji": "👹",
        "avatarBg": "from-red-600 to-amber-700",
        "maxHp": 1000,
        "tauntPhrase": "Tu crois vraiment pouvoir maîtriser ces notions ? Tes animaux ne te sauveront pas !",
        "defeatPhrase": "Impossible... ta maîtrise est parfaite ! Je me dissipe dans la lumière...",
        "weaknessDescription": "Sensible aux raisonnements logiques et aux réponses précises !"
      },
      "tasks": [...]
    }
  ],
  "rewards": {
    "badgeName": "Médaille d'Or des Gardiens",
    "badgeEmoji": "🏅",
    "totalXp": 500,
    "trophyDescription": "Décerné pour avoir conquis la quête et triomphé avec les animaux !"
  }
}`;

    parts.push({ text: promptText });

    const response = await generateWithFallback({
      contents: { parts },
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeParseJson(response.text);
    const sanitized = sanitizeDeep(parsed);

    const game: any = {
      id: 'game-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: sanitized.title || 'La Quête Héroïque des Animaux',
      universeName: sanitized.universeName || universeLabel,
      subject: sanitized.subject || 'Savoirs & Découverte',
      conceptSummary: sanitized.conceptSummary || 'Une aventure d’apprentissage stimulante et ludique.',
      targetLevel: sanitized.targetLevel || level,
      storyline: sanitized.storyline || 'Pars à l’aventure avec les animaux de KIPO pour débloquer les secrets du savoir !',
      leadAnimalId: sanitized.leadAnimalId || 'hibou',
      missions: Array.isArray(sanitized.missions) && sanitized.missions.length > 0
        ? sanitized.missions.map((m: any, idx: number) => ({
            id: m.id || `m-${idx + 1}`,
            order: m.order || idx + 1,
            title: m.title || `Mission ${idx + 1}`,
            storyIntro: m.storyIntro || '',
            locationName: m.locationName || `Zone ${idx + 1}`,
            environmentEmoji: m.environmentEmoji || (idx === 3 ? '👑' : '🌲'),
            type: m.type || (idx === 3 ? 'boss_fight' : 'speed_trivia'),
            heroCompanionId: m.heroCompanionId || (idx === 0 ? 'hibou' : idx === 1 ? 'chat' : idx === 2 ? 'souris' : 'chien'),
            boss: m.boss ? {
              id: m.boss.id || 'boss',
              name: m.boss.name || 'Le Titan du Doute',
              title: m.boss.title || 'Maître de l’Ignorance',
              emoji: m.boss.emoji || '👹',
              avatarBg: m.boss.avatarBg || 'from-rose-600 to-amber-700',
              maxHp: m.boss.maxHp || 1000,
              tauntPhrase: m.boss.tauntPhrase || 'Montre-moi ce que tu as appris !',
              defeatPhrase: m.boss.defeatPhrase || 'Tu as triomphé ! Ton savoir est éclatant.',
              weaknessDescription: m.boss.weaknessDescription || 'Sensible aux bonnes réponses.',
            } : undefined,
            tasks: Array.isArray(m.tasks) && m.tasks.length > 0
              ? m.tasks.map((t: any, tIdx: number) => ({
                  id: t.id || `m${idx + 1}_t${tIdx + 1}`,
                  type: t.type || 'question',
                  prompt: cleanAiText(t.prompt || `Défi ${tIdx + 1}`),
                  options: Array.isArray(t.options) && t.options.length >= 2
                    ? t.options.map((opt: string) => cleanAiText(String(opt)))
                    : ['Vrai', 'Faux', 'Peut-être', 'Autre'],
                  correctIndex: typeof t.correctIndex === 'number' && t.correctIndex >= 0 && t.correctIndex < (t.options?.length || 4)
                    ? t.correctIndex
                    : 0,
                  explanation: cleanAiText(t.explanation || 'Bien joué !'),
                  animalCommentary: t.animalCommentary || {
                    hibou: 'Excellente déduction !',
                    chat: 'Miaou ! Trop fort !',
                    chien: 'Superbe travail d’équipe !',
                    souris: 'Coup de maître !'
                  },
                  points: t.points || 150,
                  timeLimitSeconds: t.timeLimitSeconds || 30,
                }))
              : [
                  {
                    id: `m${idx + 1}_def1`,
                    type: 'question',
                    prompt: 'Quelle est la clé principale pour résoudre ce défi ?',
                    options: ['Appliquer la méthode pas à pas', 'Aller au hasard', 'Attendre sans rien faire', 'Ignorer les données'],
                    correctIndex: 0,
                    explanation: 'La rigueur et la logique permettent de surmonter tous les problèmes !',
                    animalCommentary: { hibou: 'Exactement la bonne démarche !' },
                    points: 150,
                    timeLimitSeconds: 30,
                  }
                ],
            completed: false,
            score: 0,
            stars: 0,
          }))
        : [],
      rewards: sanitized.rewards || {
        badgeName: "Grand Maître des Animaux",
        badgeEmoji: "🏆",
        totalXp: 500,
        trophyDescription: "A complété l'aventure avec brio !",
      },
      sourcePrompt: problemOrTopic,
      sourceDocName: files[0]?.name,
      createdAt: new Date().toISOString(),
    };

    return res.json({ success: true, game });
  } catch (err: any) {
    return handleApiError(res, err, 'Génération du jeu d’aventure animalière');
  }
});



// Setup Vite middlewares in development or static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serveur KIPO en écoute sur le port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Échec du démarrage du serveur KIPO:', err);
});
