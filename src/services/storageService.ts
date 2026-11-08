import {
  UserStats,
  UserProfile,
  SupportedLanguage,
  Badge,
  Conversation,
  Quiz,
  FlashcardDeck,
  AnalyzedDocument,
  StudyGroup,
  GroupMember,
  SharedDocumentItem,
  GroupChatMessage,
  DuolingoPath,
  LearningLesson,
} from '../types';
import { expandPathTo100Lessons, isScienceContaminated, CourseContext } from './curriculumService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEYS = {
  USER_STATS: 'kipo_user_stats_v2',
  CONVERSATIONS: 'kipo_conversations_v1',
  QUIZZES: 'kipo_quizzes_v1',
  FLASHCARDS: 'kipo_flashcards_v1',
  DOCUMENTS: 'kipo_documents_v1',
  STUDY_GROUPS: 'kipo_study_groups_v1',
  DUOLINGO_PATHS: 'kipo_duolingo_paths_v1',
};

// Retrieve active authenticated user ID (or 'guest') to guarantee total data privacy per account
export function getActiveUserId(): string {
  try {
    if (typeof window === 'undefined') return 'guest';
    const explicitId = localStorage.getItem('kipo_current_auth_user_id');
    if (explicitId && explicitId.trim()) return explicitId.trim();

    // Scan for active Supabase session tokens in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') && key.endsWith('-auth-token'))) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed?.user?.id) return parsed.user.id;
        }
      }
    }
  } catch {}
  return 'guest';
}

export function setActiveUserId(uid: string | null): void {
  try {
    if (uid && uid.trim()) {
      localStorage.setItem('kipo_current_auth_user_id', uid.trim());
    } else {
      localStorage.removeItem('kipo_current_auth_user_id');
    }
  } catch {}
}

export function getScopedStorageKey(baseKey: string, customUserId?: string): string {
  const uid = customUserId || getActiveUserId();
  return `${baseKey}_${uid}`;
}

export function getItemScoped(baseKey: string): string | null {
  try {
    const scopedKey = getScopedStorageKey(baseKey);
    const data = localStorage.getItem(scopedKey);
    if (data !== null) return data;

    // Backward compatibility: If current user doesn't have scoped key yet, check legacy un-scoped key
    const legacy = localStorage.getItem(baseKey);
    if (legacy !== null) {
      localStorage.setItem(scopedKey, legacy);
      return legacy;
    }
  } catch {}
  return null;
}

export function setItemScoped(baseKey: string, value: string): void {
  try {
    const scopedKey = getScopedStorageKey(baseKey);
    localStorage.setItem(scopedKey, value);
  } catch {}
}

export function removeItemScoped(baseKey: string): void {
  try {
    const scopedKey = getScopedStorageKey(baseKey);
    localStorage.removeItem(scopedKey);
  } catch {}
}

export function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function ensureUuid(id?: string): string {
  if (id && isValidUuid(id)) return id;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Fonctions d'arrière-plan pour la synchronisation Cloud Supabase sans bloquer l'interface
async function syncStatsToCloud(stats: UserStats): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update({
      xp: stats.xp,
      level: stats.level,
      level_title: stats.levelTitle,
      streak_days: stats.streakDays,
      last_active_date: stats.lastActiveDate,
      hearts: stats.hearts,
      max_hearts: stats.maxHearts,
      gems: stats.gems,
      questions_answered: stats.questionsAnswered,
      quizzes_completed: stats.quizzesCompleted,
      cards_mastered: stats.cardsMastered,
      badges: stats.badges,
      profile: stats.profile,
      language: stats.language,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id);
  } catch (err) {
    console.debug('Synchronisation Supabase profil ignorée (hors-ligne ou invité):', err);
  }
}

async function syncPathToCloud(path: DuolingoPath): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const validId = ensureUuid(path.id);
    path.id = validId;
    await supabase.from('duolingo_paths').upsert({
      id: validId,
      user_id: user.id,
      document_id: isValidUuid(path.documentId) ? path.documentId : null,
      title: path.title,
      subject: path.subject,
      user_request: path.userRequest || null,
      total_questions: path.totalQuestions || 100,
      lessons: path.lessons,
      units: path.units || [],
      doc_summary: path.docSummary || null,
      doc_key_concepts: path.docKeyConcepts || [],
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.debug('Synchronisation Supabase parcours ignorée:', err);
  }
}

async function syncQuizToCloud(quiz: Quiz): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const validId = ensureUuid(quiz.id);
    quiz.id = validId;
    await supabase.from('quizzes').upsert({
      id: validId,
      user_id: user.id,
      title: quiz.title,
      subject: quiz.subject,
      difficulty: quiz.difficulty,
      time_limit_seconds: quiz.timeLimitSeconds,
      questions: quiz.questions,
      times_played: quiz.timesPlayed,
      best_score: quiz.bestScore,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.debug('Synchronisation Supabase quiz ignorée:', err);
  }
}

async function syncDeckToCloud(deck: FlashcardDeck): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const validId = ensureUuid(deck.id);
    deck.id = validId;
    await supabase.from('flashcard_decks').upsert({
      id: validId,
      user_id: user.id,
      title: deck.title,
      subject: deck.subject,
      times_reviewed: deck.timesReviewed,
      cards: deck.cards,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.debug('Synchronisation Supabase flashcards ignorée:', err);
  }
}

async function syncDocToCloud(doc: AnalyzedDocument): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const validId = ensureUuid(doc.id);
    doc.id = validId;
    await supabase.from('documents').upsert({
      id: validId,
      user_id: user.id,
      title: doc.title,
      file_name: doc.fileName,
      file_type: doc.fileType,
      summary: doc.summary,
      key_concepts: doc.keyConcepts,
      study_tip: doc.studyTip,
      suggested_questions: doc.suggestedQuestions,
      raw_text_preview: doc.rawTextPreview,
      question_count: doc.questionCount || 0,
      storage_path: doc.storagePath || null,
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.debug('Synchronisation Supabase document ignorée:', err);
  }
}

async function syncConvToCloud(conv: Conversation): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const validId = ensureUuid(conv.id);
    conv.id = validId;
    const { error } = await supabase.from('conversations').upsert({
      id: validId,
      user_id: user.id,
      title: conv.title,
      profile: conv.profile,
      tags: conv.tags || [],
      updated_at: new Date(conv.updatedAt || Date.now()).toISOString(),
    });

    if (!error && Array.isArray(conv.messages) && conv.messages.length > 0) {
      const messagesToUpsert = conv.messages.map((m) => {
        const msgId = ensureUuid(m.id);
        m.id = msgId;
        return {
          id: msgId,
          conversation_id: validId,
          sender: m.role || 'user',
          text: m.content || '',
          timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString(),
          image_url: null,
          is_audio: false,
        };
      });
      await supabase.from('conversation_messages').upsert(messagesToUpsert);
    }
  } catch (err) {
    console.debug('Synchronisation Supabase conversation ignorée:', err);
  }
}

export const INITIAL_BADGES: Badge[] = [
  {
    id: 'first_step',
    title: 'Premier Pas',
    description: 'Pose ta première question ou lance une première révision.',
    icon: 'sparkles',
    unlocked: false,
    xpRequired: 15,
  },
  {
    id: 'quiz_ace',
    title: 'As des Quiz',
    description: 'Complète au moins 2 quiz avec succès.',
    icon: 'trophy',
    unlocked: false,
    xpRequired: 100,
  },
  {
    id: 'duolingo_master',
    title: 'Héros du Sentier',
    description: 'Complète au moins 10 leçons sur le grand sentier de 100 leçons.',
    icon: 'map',
    unlocked: false,
    xpRequired: 200,
  },
  {
    id: 'collab_pioneer',
    title: 'Esprit d’Équipe',
    description: 'Rejoins ou crée un Espace d’Étude Collaboratif.',
    icon: 'users',
    unlocked: false,
    xpRequired: 75,
  },
  {
    id: 'multimodal_explorer',
    title: 'Œil de Lynx',
    description: 'Importe et analyse une photo ou un document PDF avec l’IA.',
    icon: 'file-text',
    unlocked: false,
    xpRequired: 50,
  },
  {
    id: 'streak_flame',
    title: 'Flamme Assidue',
    description: 'Garde une série de révision active pendant plusieurs sessions.',
    icon: 'flame',
    unlocked: false,
    xpRequired: 250,
  },
];

export const LEVEL_TIERS = [
  { level: 1, minXp: 0, title: 'Curieux Novice' },
  { level: 2, minXp: 100, title: 'Apprenti Sagace' },
  { level: 3, minXp: 250, title: 'Explorateur du Savoir' },
  { level: 4, minXp: 500, title: 'Maître des Notions' },
  { level: 5, minXp: 1000, title: 'Génie Éducatif' },
  { level: 6, minXp: 2000, title: 'Grand Érudit KIPO' },
];

export function calculateLevel(xp: number): { level: number; title: string; nextLevelXp: number; prevLevelXp: number } {
  let currentTier = LEVEL_TIERS[0];
  let nextTier = LEVEL_TIERS[1];

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    if (xp >= LEVEL_TIERS[i].minXp) {
      currentTier = LEVEL_TIERS[i];
      nextTier = LEVEL_TIERS[i + 1] || { level: currentTier.level + 1, minXp: currentTier.minXp + 1500, title: 'Légende Immortelle' };
    }
  }

  return {
    level: currentTier.level,
    title: currentTier.title,
    nextLevelXp: nextTier.minXp,
    prevLevelXp: currentTier.minXp,
  };
}

const DEFAULT_USER_STATS: UserStats = {
  xp: 0,
  level: 1,
  levelTitle: 'Curieux Novice',
  streakDays: 0,
  lastActiveDate: new Date().toISOString().split('T')[0],
  badges: INITIAL_BADGES,
  questionsAnswered: 0,
  quizzesCompleted: 0,
  cardsMastered: 0,
  profile: 'eleve',
  language: 'fr',
  hearts: 5,
  maxHearts: 5,
  gems: 20,
};

// 100-Lesson Grand Duolingo Path Seed (10 Units x 10 Lessons = 100 Progressive Lessons)
const SEED_DUOLINGO_PATH_PHOTO: DuolingoPath = expandPathTo100Lessons({
  id: 'path-seed-photo-100',
  documentId: 'seed-doc-photo',
  title: 'La Photosynthèse & Biologie Végétale',
  subject: 'Sciences Naturelles (SVT)',
  totalQuestions: 100,
  createdAt: new Date().toISOString(),
  lessons: [
    {
      id: 'l1',
      lessonNumber: 1,
      title: 'Leçon 1 : Découverte & Équation Globale',
      description: 'Comprendre ce qu’est la photosynthèse et les réactifs nécessaires.',
      isCompleted: true,
      stars: 3,
      questions: [
        {
          id: 'l1-q1',
          question: 'Quel est l’objectif principal de la photosynthèse pour la plante ?',
          options: [
            'Produire de la matière organique (glucose) à partir de lumière',
            'Absorber de l’oxygène pour respirer la nuit',
            'Réchauffer la tige de la plante',
            'Refléter la lumière verte pour faire joli',
          ],
          correctIndex: 0,
          explanation: 'La photosynthèse transforme l’énergie lumineuse en énergie chimique stockée dans le glucose.',
          xpReward: 15,
        },
        {
          id: 'l1-q2',
          question: 'Quels sont les deux réactifs consommés par la plante lors de la photosynthèse ?',
          options: [
            'L’eau (H2O) et le dioxyde de carbone (CO2)',
            'Le glucose et l’oxygène',
            'L’azote et le chlore',
            'Le méthane et le fer',
          ],
          correctIndex: 0,
          explanation: 'La formule bilan requiert du CO2 capté dans l’air et de l’H2O puisé par les racines.',
          xpReward: 15,
        },
        {
          id: 'l1-q3',
          question: 'Quel gaz essentiel pour la vie humaine est rejeté par la photosynthèse ?',
          options: ['Le dioxygène (O2)', 'Le monoxyde de carbone', 'L’argon', 'L’hydrogène pur'],
          correctIndex: 0,
          explanation: 'L’oxygène rejeté provient de la photolyse de l’eau dans les chloroplastes.',
          xpReward: 15,
        },
        {
          id: 'l1-q4',
          question: 'Vrai ou Faux : Les champignons réalisent la photosynthèse comme les feuilles.',
          options: ['Faux, les champignons sont hétérotrophes', 'Vrai, ils ont de la chlorophylle'],
          correctIndex: 0,
          explanation: 'Faux ! Les champignons ne possèdent pas de chloroplastes ni de chlorophylle.',
          xpReward: 15,
        },
        {
          id: 'l1-q5',
          question: 'Quelle est la formule chimique du glucose synthétisé ?',
          options: ['C6H12O6', 'CO2', 'H2O2', 'NaCl'],
          correctIndex: 0,
          explanation: 'Le glucose a pour formule moléculaire C6H12O6.',
          xpReward: 20,
        },
      ],
    },
    {
      id: 'l2',
      lessonNumber: 2,
      title: 'Leçon 2 : L’Usine Cellulaire (Chloroplastes & Chlorophylle)',
      description: 'Zoom dans les organites et les pigments photorécepteurs.',
      isCompleted: false,
      stars: 0,
      questions: [
        {
          id: 'l2-q1',
          question: 'Dans quel organite cellulaire se déroule la photosynthèse végétale ?',
          options: ['Le chloroplaste', 'La vacuole', 'L’appareil de Golgi', 'Le centrosome'],
          correctIndex: 0,
          explanation: 'Le chloroplaste contient les pigments et les structures membranaires nécessaires.',
          xpReward: 15,
        },
        {
          id: 'l2-q2',
          question: 'Pourquoi la chlorophylle donne-t-elle cette couleur verte aux feuilles ?',
          options: [
            'Elle absorbe le bleu et le rouge, et diffuse la lumière verte',
            'Elle n’absorbe que la lumière verte',
            'Elle produit des colorants verts chimiques',
            'C’est un effet d’optique du ciel',
          ],
          correctIndex: 0,
          explanation: 'Le vert n’est pas absorbé par la chlorophylle, il est donc réfléchi vers nos yeux.',
          xpReward: 15,
        },
        {
          id: 'l2-q3',
          question: 'Comment s’appellent les empilements de sacs membranaires dans le chloroplaste ?',
          options: ['Les thylakoïdes (grana)', 'Les ribosomes', 'Les cils vibratiles', 'Les microtubules'],
          correctIndex: 0,
          explanation: 'Les thylakoïdes empilés forment des grana où se situent les photosystèmes.',
          xpReward: 20,
        },
        {
          id: 'l2-q4',
          question: 'Par quels orifices de la feuille le CO2 entre-t-il dans les tissus ?',
          options: ['Les stomates', 'Les capillaires', 'Les pores nucléaires', 'Les racines'],
          correctIndex: 0,
          explanation: 'Les stomates sont de minuscules ouvertures régulant les échanges gazeux et la transpiration.',
          xpReward: 20,
        },
        {
          id: 'l2-q5',
          question: 'Quel métal se situe au cœur de la molécule de chlorophylle ?',
          options: ['Le Magnésium (Mg)', 'Le Fer (Fe)', 'Le Cuivre (Cu)', 'Le Calcium (Ca)'],
          correctIndex: 0,
          explanation: 'Un atome de magnésium Mg2+ est chélaté au centre de l’anneau porphyrine.',
          xpReward: 25,
        },
      ],
    },
    {
      id: 'l3',
      lessonNumber: 3,
      title: 'Leçon 3 : Les Deux Phases (Lumineuse & Sombre)',
      description: 'Décortiquer la phase photochimique et le cycle de Calvin.',
      isCompleted: false,
      stars: 0,
      questions: [
        {
          id: 'l3-q1',
          question: 'Où se déroule la phase photochimique (dépendante de la lumière) ?',
          options: [
            'Dans la membrane des thylakoïdes',
            'Dans le cytoplasme',
            'Dans le noyau cellulaire',
            'Dans la paroi pectocellulosique',
          ],
          correctIndex: 0,
          explanation: 'Les photosystèmes capteurs de photons sont intégrés dans la membrane des thylakoïdes.',
          xpReward: 20,
        },
        {
          id: 'l3-q2',
          question: 'Quelles molécules énergétiques sont produites pendant la phase lumineuse ?',
          options: ['L’ATP et le NADPH', 'L’ADN et l’ARN', 'L’urée et l’acide lactique', 'Le glycogène'],
          correctIndex: 0,
          explanation: 'L’énergie solaire est convertie en liaisons riches en énergie (ATP) et pouvoir réducteur (NADPH).',
          xpReward: 20,
        },
        {
          id: 'l3-q3',
          question: 'Comment s’appelle la phase de fixation du CO2 sans besoin direct de photons ?',
          options: [
            'Le Cycle de Calvin (dans le stroma)',
            'Le Cycle de Krebs',
            'La glycolyse',
            'La phosphorylation oxydative',
          ],
          correctIndex: 0,
          explanation: 'Le Cycle de Calvin utilise l’ATP et NADPH pour réduire le CO2 en sucres.',
          xpReward: 20,
        },
        {
          id: 'l3-q4',
          question: 'Quelle enzyme célèbre catalyse la première fixation du CO2 dans le cycle de Calvin ?',
          options: ['La Rubisco', 'L’amylase', 'La kinase', 'L’hélicase'],
          correctIndex: 0,
          explanation: 'La Rubisco (Ribulose-1,5-bisphosphate carboxylase/oxygénase) est l’enzyme la plus abondante sur Terre !',
          xpReward: 25,
        },
        {
          id: 'l3-q5',
          question: 'Que se passe-t-il si une plante est privée totalement de lumière pendant plusieurs jours ?',
          options: [
            'La photosynthèse s’arrête et la plante consomme ses réserves par respiration',
            'Elle produit deux fois plus d’oxygène',
            'Ses feuilles deviennent instantanément bleues',
            'Elle commence à synthétiser du CO2 pur',
          ],
          correctIndex: 0,
          explanation: 'Sans lumière, la phase claire s’arrête ; la plante ne fait plus que respirer (consomme de l’O2).',
          xpReward: 20,
        },
      ],
    },
    {
      id: 'l4',
      lessonNumber: 4,
      title: 'Leçon 4 : Maîtrise, Facteurs & Enjeux Planétaires',
      description: 'Facteurs limitants, chaîne trophique et climat global.',
      isCompleted: false,
      stars: 0,
      questions: [
        {
          id: 'l4-q1',
          question: 'Quel est l’impact de la photosynthèse sur le réchauffement climatique mondial ?',
          options: [
            'Elle agit comme un puits de carbone en stockant le CO2 atmosphérique',
            'Elle augmente l’effet de serre',
            'Elle détruit la couche d’ozone',
            'Elle n’a aucun effet sur l’atmosphère',
          ],
          correctIndex: 0,
          explanation: 'En fixant des milliards de tonnes de CO2, les forêts et le phytoplancton atténuent l’effet de serre.',
          xpReward: 20,
        },
        {
          id: 'l4-q2',
          question: 'Qui produit la majorité de l’oxygène de la biosphère terrestre ?',
          options: [
            'Le phytoplancton des océans (algues et cyanobactéries)',
            'La forêt amazonienne uniquement',
            'Les déserts de cactus',
            'Les champs de blé',
          ],
          correctIndex: 0,
          explanation: 'Plus de 50% de l’oxygène terrestre est produit par le phytoplancton océanique.',
          xpReward: 20,
        },
        {
          id: 'l4-q3',
          question: 'Qu’appelle-t-on "facteur limitant" dans la photosynthèse ?',
          options: [
            'Le paramètre (lumière, CO2 ou température) le plus éloigné de son optimum',
            'La taille de la racine',
            'L’âge du pot de fleur',
            'La forme de la feuille',
          ],
          correctIndex: 0,
          explanation: 'Si le CO2 manque, même avec beaucoup de lumière, la vitesse de photosynthèse plafonne.',
          xpReward: 25,
        },
        {
          id: 'l4-q4',
          question: 'Sous quelle forme les plantes stockent-elles leurs surplus de sucres ?',
          options: ['Sous forme d’amidon', 'Sous forme de cholestérol', 'Sous forme de kératine', 'Sous forme de chitine'],
          correctIndex: 0,
          explanation: 'L’amidon est un polymère de glucose insoluble servant de réserve dans les tubercules et graines.',
          xpReward: 20,
        },
        {
          id: 'l4-q5',
          question: 'Question défi : Pourquoi dit-on que les végétaux sont des producteurs primaires autotrophes ?',
          options: [
            'Parce qu’ils fabriquent leur propre matière organique à partir de matière minérale',
            'Parce qu’ils mangent d’autres animaux la nuit',
            'Parce qu’ils sont les premiers à pousser au printemps',
            'Parce qu’ils n’ont pas de squelette',
          ],
          correctIndex: 0,
          explanation: 'Autotrophe signifie "se nourrir soi-même" : ils n’ont pas besoin d’ingérer d’autres êtres vivants.',
          xpReward: 30,
        },
      ],
    },
  ],
});

// Seed Study Group for Collaborative Learning Spaces
const SEED_STUDY_GROUPS: StudyGroup[] = [
  {
    id: 'group-svt-terminale',
    name: '🌿 Groupe d’Étude SVT & Bac Scientifique',
    description: 'Espace collaboratif pour réviser la génétique, la photosynthèse et la géologie en équipe avec l’aide du tuteur KIPO.',
    subject: 'Sciences & Biologie',
    privacy: 'public',
    inviteCode: 'KIPO-SVT-99',
    createdBy: 'user-self',
    createdByName: 'Toi (Fondateur)',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    permissions: {
      whoCanShareDocs: 'all',
      whoCanCreateQuizzes: 'all',
      defaultDocAccess: 'interactive',
    },
    members: [
      {
        id: 'user-self',
        name: 'Toi',
        avatar: '🎒',
        role: 'admin',
        profile: 'eleve',
        joinedAt: new Date(Date.now() - 172800000).toISOString(),
        xpContributed: 240,
      },
      {
        id: 'member-sarah',
        name: 'Sarah M.',
        avatar: '👩‍🔬',
        role: 'member',
        profile: 'etudiant',
        joinedAt: new Date(Date.now() - 86400000).toISOString(),
        xpContributed: 310,
      },
      {
        id: 'member-lucas',
        name: 'Lucas B.',
        avatar: '🧑‍💻',
        role: 'member',
        profile: 'eleve',
        joinedAt: new Date(Date.now() - 43200000).toISOString(),
        xpContributed: 180,
      },
      {
        id: 'member-prof-dupont',
        name: 'Prof. Martin',
        avatar: '💼',
        role: 'admin',
        profile: 'professeur',
        joinedAt: new Date(Date.now() - 120000000).toISOString(),
        xpContributed: 450,
      },
    ],
    sharedDocuments: [
      {
        id: 'shared-doc-1',
        docId: 'seed-doc-photo',
        title: 'La Photosynthèse & le Cycle du Végétal (20 questions)',
        fileName: 'cours_biologie_svt.pdf',
        sharedBy: 'user-self',
        sharedByName: 'Toi',
        sharedAt: new Date(Date.now() - 86400000).toISOString(),
        permission: 'interactive',
        summary: 'Cours complet sur la phase photochimique et le cycle de Calvin.',
        keyConcepts: ['Chlorophylle', 'Rubisco', 'Phase claire/sombre', 'Stomates'],
        questionCount: 20,
      },
    ],
    messages: [
      {
        id: 'gm-1',
        senderId: 'member-sarah',
        senderName: 'Sarah M.',
        senderRole: 'member',
        content: 'Salut l’équipe ! Quelqu’un peut m’expliquer la différence exacte entre le stroma et le thylakoïde ?',
        timestamp: new Date(Date.now() - 72000000).toISOString(),
      },
      {
        id: 'gm-2',
        senderId: 'member-prof-dupont',
        senderName: 'Prof. Martin',
        senderRole: 'admin',
        content: 'Très bonne question Sarah ! Pense au thylakoïde comme à des "panneaux solaires" (phase lumineuse) et au stroma comme au fluide de l’usine où le sucre est fabriqué (cycle de Calvin).',
        timestamp: new Date(Date.now() - 50000000).toISOString(),
      },
      {
        id: 'gm-3',
        senderId: 'ai-moderator',
        senderName: 'KIPO AI Modérateur',
        senderRole: 'ai_moderator',
        content: '💡 **Synthèse KIPO :**\n- **Thylakoïdes :** Production d’ATP et NADPH grâce aux photons de lumière.\n- **Stroma :** Utilisation de cette énergie pour fixer le CO₂ via la Rubisco.',
        timestamp: new Date(Date.now() - 36000000).toISOString(),
        isAiSummary: true,
      },
    ],
    groupQuizzes: [
      {
        id: 'gq-1',
        title: 'Défi Collectif : La Photosynthèse (20 questions)',
        quizId: 'seed-quiz-space',
        creatorName: 'Prof. Martin',
        questionCount: 20,
        createdAt: new Date(Date.now() - 25000000).toISOString(),
        playedCount: 4,
      },
    ],
  },
];

// Seed Quizzes
const SEED_QUIZZES: Quiz[] = [
  {
    id: 'seed-quiz-space',
    title: 'Mystères du Système Solaire & Astrophysique',
    subject: 'Sciences & Astronomie',
    difficulty: 'Moyen',
    timeLimitSeconds: 30,
    timesPlayed: 3,
    bestScore: 4,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    questions: [
      {
        id: 'q1',
        question: 'Quelle est la planète la plus proche du Soleil ?',
        options: ['Vénus', 'Mercure', 'Mars', 'Jupiter'],
        correctIndex: 1,
        explanation: 'Mercure est la planète la plus proche du Soleil, située à environ 58 millions de kilomètres.',
        xpReward: 20,
      },
      {
        id: 'q2',
        question: 'Pourquoi la planète Mars apparaît-elle rougeoyante ?',
        options: [
          'En raison de sa chaleur volcanique',
          'À cause de l’oxyde de fer (rouille) sur sa surface',
          'Parce qu’elle reflète la lumière du Soleil',
          'En raison de son atmosphère de méthane',
        ],
        correctIndex: 1,
        explanation: 'La surface martienne est recouverte de poussière riche en oxyde de fer, ce qui lui donne cette teinte rouge caractéristique.',
        xpReward: 25,
      },
      {
        id: 'q3',
        question: 'Quelle est la plus grande lune du système solaire ?',
        options: ['Titan', 'La Lune (Terre)', 'Ganymède', 'Europe'],
        correctIndex: 2,
        explanation: 'Ganymède, qui orbite autour de Jupiter, est plus grande que la planète Mercure !',
        xpReward: 25,
      },
    ],
  },
];

const SEED_FLASHCARDS: FlashcardDeck[] = [
  {
    id: 'seed-deck-bio',
    title: 'Biologie Fondamentale : La Cellule',
    subject: 'Sciences Naturelles',
    timesReviewed: 4,
    createdAt: new Date(Date.now() - 100000000).toISOString(),
    cards: [
      {
        id: 'c1',
        front: 'Mitochondrie',
        back: 'Organite cellulaire responsable de la respiration cellulaire et de la production d’ATP (centrale énergétique).',
        hint: 'Centrale énergétique de la cellule.',
      },
      {
        id: 'c2',
        front: 'Membrane plasmique',
        back: 'Barrière semi-perméable constituée d’une bicouche lipidique qui délimite la cellule.',
        hint: 'Frontière protectrice et régulatrice.',
      },
      {
        id: 'c3',
        front: 'Ribosome',
        back: 'Structure cellulaire responsable de la synthèse des protéines par traduction de l’ARNm.',
        hint: 'Usine d’assemblage des protéines.',
      },
      {
        id: 'c4',
        front: 'Chloroplaste',
        back: 'Organite présent chez les végétaux qui réalise la photosynthèse grâce à la chlorophylle.',
        hint: 'Capture la lumière pour créer du glucose.',
      },
    ],
  },
];

const SEED_DOCUMENTS: AnalyzedDocument[] = [
  {
    id: 'seed-doc-photo',
    title: 'La Photosynthèse & Biologie Végétale (Parcours 20 questions)',
    fileName: 'cours_biologie_svt.pdf',
    fileType: 'pdf',
    questionCount: 20,
    generatedPathId: 'path-seed-photo-20',
    summary:
      'La photosynthèse est le processus bioénergétique permettant aux plantes vertes, algues et certaines bactéries de transformer l’énergie lumineuse solaire en matière organique (glucose) à partir d’eau et de dioxyde de carbone, tout en rejetant du dioxygène.',
    keyConcepts: [
      'Équation bilan : 6 CO₂ + 6 H₂O + Lumière ➔ C₆H₁₂O₆ + 6 O₂',
      'Chlorophylle : pigment vert captant la lumière dans les chloroplastes',
      'Phase lumineuse (photochimique) dans les thylakoïdes (ATP + NADPH)',
      'Phase sombre (Cycle de Calvin) dans le stroma (Fixation du CO2 par la Rubisco)',
    ],
    studyTip:
      'Pense au thylakoïde comme à un capteur photovoltaïque, et au stroma comme à la cuisine où la recette du sucre est préparée.',
    suggestedQuestions: [
      'Quel est le rôle précis de la chlorophylle ?',
      'Que devient le glucose produit par la plante ?',
      'Pourquoi la photosynthèse est-elle indispensable à la vie terrestre ?',
    ],
    createdAt: new Date(Date.now() - 250000000).toISOString(),
  },
];

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'seed-conv-1',
    title: 'Explication du Théorème de Thalès',
    profile: 'eleve',
    tags: ['Maths', 'Géométrie', 'Brevet'],
    createdAt: new Date(Date.now() - 400000000).toISOString(),
    updatedAt: new Date(Date.now() - 390000000).toISOString(),
    messages: [
      {
        id: 'm1',
        role: 'user',
        content: 'Salut KIPO ! Comment on utilise le théorème de Thalès pour trouver une longueur inconnue ?',
        timestamp: new Date(Date.now() - 400000000).toISOString(),
      },
      {
        id: 'm2',
        role: 'assistant',
        content:
          'Bonjour ! Le théorème de Thalès est magique pour calculer des distances inaccessibles.\n\n1. La condition essentielle :\nTu dois avoir deux droites sécantes coupées par deux droites parallèles.\n\n2. La règle des proportions :\nAM / AB = AN / AC = MN / BC\n\nAstuce KIPO 💡 :\nRepère toujours le sommet commun (ici A), puis écris toujours : "Petit côté sur Grand côté" !',
        timestamp: new Date(Date.now() - 390000000).toISOString(),
      },
    ],
  },
];

export const storageService = {
  // User Stats & Gamification
  getUserStats(): UserStats {
    try {
      const data = getItemScoped(STORAGE_KEYS.USER_STATS);
      if (data) {
        const stats: UserStats = JSON.parse(data);
        const { level, title } = calculateLevel(stats.xp);
        stats.level = level;
        stats.levelTitle = title;
        if (typeof stats.hearts === 'undefined') stats.hearts = 5;
        if (typeof stats.maxHearts === 'undefined') stats.maxHearts = 5;
        if (typeof stats.gems === 'undefined') stats.gems = 50;
        return stats;
      }
    } catch (e) {
      console.warn('Storage read failed:', e);
    }
    return DEFAULT_USER_STATS;
  },

  saveUserStats(stats: UserStats): void {
    const { level, title } = calculateLevel(stats.xp);
    stats.level = level;
    stats.levelTitle = title;
    try {
      setItemScoped(STORAGE_KEYS.USER_STATS, JSON.stringify(stats));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
    // Synchronisation en arrière-plan avec Supabase
    syncStatsToCloud(stats);
  },

  loseHeart(): number {
    const stats = this.getUserStats();
    stats.hearts = Math.max(0, stats.hearts - 1);
    this.saveUserStats(stats);
    return stats.hearts;
  },

  refillHearts(): void {
    const stats = this.getUserStats();
    stats.hearts = stats.maxHearts;
    this.saveUserStats(stats);
  },

  awardXp(
    amount: number,
    reason?: string
  ): {
    newStats: UserStats;
    leveledUp: boolean;
    unlockedBadges: Badge[];
  } {
    const stats = this.getUserStats();
    const oldLevel = stats.level;
    stats.xp += amount;
    stats.gems += Math.floor(amount / 10); // Gems earned alongside XP!

    const { level, title } = calculateLevel(stats.xp);
    const leveledUp = level > oldLevel;
    stats.level = level;
    stats.levelTitle = title;

    // Check badges
    const newlyUnlocked: Badge[] = [];
    stats.badges = stats.badges.map((badge) => {
      if (!badge.unlocked && stats.xp >= badge.xpRequired) {
        badge.unlocked = true;
        badge.unlockedAt = new Date().toISOString();
        newlyUnlocked.push(badge);
      }
      return badge;
    });

    this.saveUserStats(stats);
    return { newStats: stats, leveledUp, unlockedBadges: newlyUnlocked };
  },

  // Duolingo Paths (100 progressive lessons structured in 10 units)
  getDuolingoPaths(): DuolingoPath[] {
    try {
      const data = getItemScoped(STORAGE_KEYS.DUOLINGO_PATHS);
      if (data) {
        const parsed: DuolingoPath[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const docs = this.getDocuments();
          let hasUpgraded = false;
          const upgraded = parsed.map((p) => {
            const doc = p.documentId ? docs.find((d) => d.id === p.documentId) : undefined;
            const docContext: CourseContext | undefined = doc
              ? {
                  title: doc.title,
                  subject: doc.title,
                  summary: doc.summary,
                  keyConcepts: doc.keyConcepts,
                  rawTextPreview: doc.rawTextPreview,
                  suggestedQuestions: doc.suggestedQuestions,
                  userRequest: p.userRequest,
                }
              : undefined;

            // Check if path is missing units or lessons, or if non-photosynthesis path has photosynthesis lessons
            const isBio = p.title.toLowerCase().includes('photosynth');
            const hasScienceContamination =
              !isBio &&
              p.lessons?.some(
                (l) =>
                  l.lessonNumber > 4 &&
                  (isScienceContaminated(`${l.title} ${l.description}`) ||
                    l.questions?.some((q) =>
                      isScienceContaminated(`${q.question} ${q.explanation} ${q.options.join(' ')}`)
                    ))
              );

            const needsRefresh =
              !p.lessons ||
              p.lessons.length < 100 ||
              !p.units ||
              p.units.length !== 10 ||
              hasScienceContamination;

            if (needsRefresh) {
              hasUpgraded = true;
              return expandPathTo100Lessons(p, docContext);
            }
            return p;
          });
          if (hasUpgraded) {
            this.saveDuolingoPaths(upgraded);
          }
          return upgraded;
        }
      }
    } catch {}
    return [];
  },

  saveDuolingoPaths(paths: DuolingoPath[]): void {
    try {
      setItemScoped(STORAGE_KEYS.DUOLINGO_PATHS, JSON.stringify(paths));
    } catch {}
  },

  saveDuolingoPath(path: DuolingoPath): void {
    const doc = path.documentId ? this.getDocuments().find((d) => d.id === path.documentId) : undefined;
    const docContext: CourseContext | undefined = doc
      ? {
          title: doc.title,
          subject: doc.title,
          summary: doc.summary,
          keyConcepts: doc.keyConcepts,
          rawTextPreview: doc.rawTextPreview,
          suggestedQuestions: doc.suggestedQuestions,
          userRequest: path.userRequest,
        }
      : undefined;

    const fullPath = expandPathTo100Lessons(path, docContext);

    const list = this.getDuolingoPaths();
    const idx = list.findIndex((p) => p.id === fullPath.id);
    if (idx >= 0) {
      list[idx] = fullPath;
    } else {
      list.unshift(fullPath);
    }
    this.saveDuolingoPaths(list);
    // Synchronisation en arrière-plan avec Supabase
    syncPathToCloud(fullPath);
  },

  buildFull100LessonPath(base: Partial<DuolingoPath>, docContext?: CourseContext): DuolingoPath {
    if (!docContext && base.documentId) {
      const doc = this.getDocuments().find((d) => d.id === base.documentId);
      if (doc) {
        docContext = {
          title: doc.title,
          subject: doc.title,
          summary: doc.summary,
          keyConcepts: doc.keyConcepts,
          rawTextPreview: doc.rawTextPreview,
          suggestedQuestions: doc.suggestedQuestions,
          userRequest: base.userRequest,
        };
      }
    }
    return expandPathTo100Lessons(base, docContext);
  },

  getDuolingoPathByDocId(docId: string): DuolingoPath | undefined {
    return this.getDuolingoPaths().find((p) => p.documentId === docId);
  },

  // Study Groups (Collaborative Learning Spaces)
  getStudyGroups(): StudyGroup[] {
    try {
      const data = getItemScoped(STORAGE_KEYS.STUDY_GROUPS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveStudyGroups(groups: StudyGroup[]): void {
    try {
      setItemScoped(STORAGE_KEYS.STUDY_GROUPS, JSON.stringify(groups));
    } catch {}
  },

  saveStudyGroup(group: StudyGroup): void {
    const list = this.getStudyGroups();
    const idx = list.findIndex((g) => g.id === group.id);
    if (idx >= 0) {
      list[idx] = group;
    } else {
      list.unshift(group);
    }
    this.saveStudyGroups(list);
  },

  getClientUserId(): string {
    try {
      let id = localStorage.getItem('kipo_client_user_id_v2');
      if (!id || id === 'user-self') {
        id = `usr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('kipo_client_user_id_v2', id);
      }
      return id;
    } catch {
      return 'usr-anon';
    }
  },

  getClientUserName(profile?: UserProfile): string {
    try {
      const saved = localStorage.getItem('kipo_client_user_name_v2');
      if (saved && saved.trim() && saved !== 'Toi' && saved !== 'Toi (Créateur)') {
        return saved.trim();
      }
    } catch {}
    return profile === 'professeur' ? 'Enseignant KIPO' : profile === 'etudiant' ? 'Étudiant KIPO' : 'Élève KIPO';
  },

  setClientUserName(name: string): void {
    try {
      if (name && name.trim()) {
        localStorage.setItem('kipo_client_user_name_v2', name.trim());
      }
    } catch {}
  },


  createStudyGroup(params: {
    name: string;
    description: string;
    subject: string;
    privacy?: 'public' | 'private';
    profile: UserProfile;
    creatorId?: string;
    creatorName?: string;
  }): StudyGroup {
    const creatorId = params.creatorId || this.getClientUserId();
    const creatorName = params.creatorName || this.getClientUserName(params.profile);
    const cleanSubject = params.subject.trim() || 'Général';
    const randomCode = `KIPO-${cleanSubject.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(100 + Math.random() * 900)}`;
    const privacy = params.privacy || 'public';
    const newGroup: StudyGroup = {
      id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: params.name.trim(),
      description: params.description.trim() || 'Espace d’apprentissage collaboratif KIPO.',
      subject: cleanSubject,
      privacy,
      inviteCode: randomCode,
      createdBy: creatorId,
      createdByName: creatorName,
      createdAt: new Date().toISOString(),
      permissions: {
        whoCanShareDocs: 'all',
        whoCanCreateQuizzes: 'all',
        defaultDocAccess: 'interactive',
      },
      members: [
        {
          id: creatorId,
          name: creatorName,
          avatar: params.profile === 'professeur' ? '💼' : params.profile === 'etudiant' ? '🎓' : '🎒',
          role: 'admin',
          profile: params.profile,
          joinedAt: new Date().toISOString(),
          xpContributed: 50,
        },
      ],
      pendingRequests: [],
      sharedDocuments: [],
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderId: 'ai-moderator',
          senderName: 'KIPO AI Modérateur',
          senderRole: 'ai_moderator',
          content: `👋 Bienvenue dans l'espace collaboratif **${params.name}** ! Matière : **${cleanSubject}** (${privacy === 'public' ? '🌐 Groupe Public - Visible par tous' : '🔒 Groupe Privé sur approbation'}). Partagez vos cours, photos et PDF pour réviser ensemble !`,
          timestamp: new Date().toISOString(),
          isAiSummary: true,
        },
      ],
      groupQuizzes: [],
    };

    this.saveStudyGroup(newGroup);

    // Sync to server so all users can see this group
    try {
      fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGroup),
      }).catch(() => {});
    } catch {}

    return newGroup;
  },

  async syncGroupsFromServer(): Promise<StudyGroup[]> {
    try {
      const res = await fetch('/api/groups');
      if (res.ok) {
        const serverGroups: StudyGroup[] = await res.json();
        if (Array.isArray(serverGroups)) {
          this.saveStudyGroups(serverGroups);
          return serverGroups;
        }
      }
    } catch {}
    return this.getStudyGroups();
  },

  joinPublicGroup(groupId: string, userProfile: UserProfile, userId?: string, userName?: string): StudyGroup | null {
    const effectiveUserId = userId || this.getClientUserId();
    const effectiveUserName = userName || this.getClientUserName(userProfile);
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    const isMember = group.members.some((m) => m.id === effectiveUserId);
    if (!isMember) {
      group.members.push({
        id: effectiveUserId,
        name: effectiveUserName,
        avatar: userProfile === 'professeur' ? '💼' : userProfile === 'etudiant' ? '🎓' : '🎒',
        role: 'member',
        profile: userProfile,
        joinedAt: new Date().toISOString(),
        xpContributed: 20,
      });
      group.messages.push({
        id: `msg-${Date.now()}`,
        senderId: 'ai-moderator',
        senderName: 'KIPO AI Modérateur',
        senderRole: 'ai_moderator',
        content: `🎉 **${effectiveUserName}** vient de rejoindre le groupe ! Bienvenue parmi nous.`,
        timestamp: new Date().toISOString(),
      });
      this.saveStudyGroup(group);

      try {
        fetch(`/api/groups/${groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: effectiveUserId, userName: effectiveUserName, profile: userProfile }),
        }).catch(() => {});
      } catch {}
    }
    return group;
  },

  requestToJoinPrivateGroup(groupId: string, userProfile: UserProfile, userId?: string, userName?: string, userEmail?: string): StudyGroup | null {
    const effectiveUserId = userId || this.getClientUserId();
    const effectiveUserName = userName || this.getClientUserName(userProfile);
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return null;

    if (!group.pendingRequests) group.pendingRequests = [];
    const hasReq = group.pendingRequests.some((r) => r.userId === effectiveUserId);
    if (!hasReq) {
      group.pendingRequests.push({
        id: `req-${Date.now()}`,
        userId: effectiveUserId,
        userName: effectiveUserName,
        userEmail,
        profile: userProfile,
        requestedAt: new Date().toISOString(),
      });
      this.saveStudyGroup(group);

      try {
        fetch(`/api/groups/${groupId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: effectiveUserId, userName: effectiveUserName, userEmail, profile: userProfile }),
        }).catch(() => {});
      } catch {}
    }
    return group;
  },

  approveJoinRequest(groupId: string, requestId: string): StudyGroup | null {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.pendingRequests) return null;

    const reqIdx = group.pendingRequests.findIndex((r) => r.id === requestId);
    if (reqIdx < 0) return null;

    const reqItem = group.pendingRequests[reqIdx];
    group.pendingRequests.splice(reqIdx, 1);

    if (!group.members.some((m) => m.id === reqItem.userId)) {
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
        content: `✅ La demande d'adhésion de **${reqItem.userName}** a été approuvée !`,
        timestamp: new Date().toISOString(),
      });
    }

    this.saveStudyGroup(group);

    try {
      fetch(`/api/groups/${groupId}/approve-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      }).catch(() => {});
    } catch {}

    return group;
  },

  rejectJoinRequest(groupId: string, requestId: string): StudyGroup | null {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group || !group.pendingRequests) return null;

    group.pendingRequests = group.pendingRequests.filter((r) => r.id !== requestId);
    this.saveStudyGroup(group);

    try {
      fetch(`/api/groups/${groupId}/reject-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId }),
      }).catch(() => {});
    } catch {}

    return group;
  },

  joinStudyGroup(inviteCode: string, userProfile: UserProfile, userId?: string, userName?: string): StudyGroup | null {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase());
    if (!group) return null;

    return this.joinPublicGroup(group.id, userProfile, userId, userName);
  },

  shareFileToGroup(groupId: string, fileItem: SharedDocumentItem): boolean {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return false;

    if (!group.sharedDocuments) group.sharedDocuments = [];
    group.sharedDocuments.unshift(fileItem);

    const typeLabel = fileItem.fileType === 'pdf' ? 'PDF' : fileItem.fileType === 'image' ? 'Photo / Scan' : 'Document';
    group.messages.push({
      id: `msg-share-${Date.now()}`,
      senderId: fileItem.sharedBy || this.getClientUserId(),
      senderName: fileItem.sharedByName || 'Membre',
      senderRole: 'member',
      content: `📁 **Nouveau ${typeLabel} partagé :** « ${fileItem.title} »`,
      timestamp: new Date().toISOString(),
      attachment: fileItem.fileData ? {
        id: `att-${Date.now()}`,
        name: fileItem.fileName,
        mimeType: fileItem.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        size: fileItem.fileSize || 0,
        data: fileItem.fileData,
        type: fileItem.fileType === 'pdf' ? 'pdf' : 'image',
      } : undefined,
    });

    this.saveStudyGroup(group);

    try {
      fetch(`/api/groups/${groupId}/share-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docItem: fileItem }),
      }).catch(() => {});
    } catch {}

    return true;
  },

  shareDocumentToGroup(groupId: string, doc: AnalyzedDocument, permission: 'read_only' | 'interactive', userId?: string, userName?: string): boolean {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return false;

    const effectiveUserId = userId || this.getClientUserId();
    const effectiveUserName = userName || this.getClientUserName();

    // Check existing
    const alreadyShared = group.sharedDocuments.some((d) => d.docId === doc.id);
    if (alreadyShared) return true;

    const item: SharedDocumentItem = {
      id: `shared-${Date.now()}`,
      docId: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      fileType: (doc.fileType as any) || 'document',
      fileData: undefined,
      sharedBy: effectiveUserId,
      sharedByName: effectiveUserName,
      sharedAt: new Date().toISOString(),
      permission,
      summary: doc.summary,
      keyConcepts: doc.keyConcepts,
      questionCount: doc.questionCount || 20,
    };

    return this.shareFileToGroup(groupId, item);
  },

  addGroupMessage(groupId: string, message: GroupChatMessage): void {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    if (!group.messages.some((m) => m.id === message.id)) {
      group.messages.push(message);
      this.saveStudyGroup(group);
    }
    try {
      fetch(`/api/groups/${groupId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      }).catch(() => {});
    } catch {}
  },

  updateGroupPermissions(groupId: string, permissions: StudyGroup['permissions']): void {
    const groups = this.getStudyGroups();
    const group = groups.find((g) => g.id === groupId);
    if (!group) return;
    group.permissions = permissions;
    this.saveStudyGroup(group);
  },

  // Conversations
  getConversations(): Conversation[] {
    try {
      const data = getItemScoped(STORAGE_KEYS.CONVERSATIONS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveConversations(convs: Conversation[]): void {
    try {
      setItemScoped(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
    } catch {}
  },

  saveConversation(conv: Conversation): void {
    const list = this.getConversations();
    const index = list.findIndex((c) => c.id === conv.id);
    if (index >= 0) {
      list[index] = conv;
    } else {
      list.unshift(conv);
    }
    this.saveConversations(list);
    syncConvToCloud(conv);
  },

  deleteConversation(id: string): void {
    const list = this.getConversations().filter((c) => c.id !== id);
    this.saveConversations(list);
    if (isSupabaseConfigured && supabase && isValidUuid(id)) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase!.from('conversations').delete().eq('id', id).eq('user_id', user.id).then();
        }
      }).catch(() => {});
    }
  },

  searchConversations(query: string): Conversation[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getConversations();
    return this.getConversations().filter((c) => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchTag = c.tags.some((t) => t.toLowerCase().includes(q));
      const matchMessage = c.messages.some((m) => m.content.toLowerCase().includes(q));
      return matchTitle || matchTag || matchMessage;
    });
  },

  // Quizzes
  getQuizzes(): Quiz[] {
    try {
      const data = getItemScoped(STORAGE_KEYS.QUIZZES);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveQuizzes(quizzes: Quiz[]): void {
    try {
      setItemScoped(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));
    } catch {}
  },

  saveQuiz(quiz: Quiz): void {
    const list = this.getQuizzes();
    const index = list.findIndex((q) => q.id === quiz.id);
    if (index >= 0) {
      list[index] = quiz;
    } else {
      list.unshift(quiz);
    }
    this.saveQuizzes(list);
    syncQuizToCloud(quiz);
  },

  deleteQuiz(id: string): void {
    const list = this.getQuizzes().filter((q) => q.id !== id);
    this.saveQuizzes(list);
    if (isSupabaseConfigured && supabase && isValidUuid(id)) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase!.from('quizzes').delete().eq('id', id).eq('user_id', user.id).then();
        }
      }).catch(() => {});
    }
  },

  // Flashcards
  getFlashcardDecks(): FlashcardDeck[] {
    try {
      const data = getItemScoped(STORAGE_KEYS.FLASHCARDS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveFlashcardDecks(decks: FlashcardDeck[]): void {
    try {
      setItemScoped(STORAGE_KEYS.FLASHCARDS, JSON.stringify(decks));
    } catch {}
  },

  saveFlashcardDeck(deck: FlashcardDeck): void {
    const list = this.getFlashcardDecks();
    const index = list.findIndex((d) => d.id === deck.id);
    if (index >= 0) {
      list[index] = deck;
    } else {
      list.unshift(deck);
    }
    this.saveFlashcardDecks(list);
    syncDeckToCloud(deck);
  },

  deleteFlashcardDeck(id: string): void {
    const list = this.getFlashcardDecks().filter((d) => d.id !== id);
    this.saveFlashcardDecks(list);
    if (isSupabaseConfigured && supabase && isValidUuid(id)) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase!.from('flashcard_decks').delete().eq('id', id).eq('user_id', user.id).then();
        }
      }).catch(() => {});
    }
  },

  // Documents
  getDocuments(): AnalyzedDocument[] {
    try {
      const data = getItemScoped(STORAGE_KEYS.DOCUMENTS);
      if (data) return JSON.parse(data);
    } catch {}
    return [];
  },

  saveDocuments(docs: AnalyzedDocument[]): void {
    try {
      setItemScoped(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));
    } catch {}
  },

  saveDocument(doc: AnalyzedDocument): void {
    const list = this.getDocuments();
    const index = list.findIndex((d) => d.id === doc.id);
    if (index >= 0) {
      list[index] = doc;
    } else {
      list.unshift(doc);
    }
    this.saveDocuments(list);
    syncDocToCloud(doc);
  },

  deleteDocument(id: string): void {
    const list = this.getDocuments().filter((d) => d.id !== id);
    this.saveDocuments(list);
    if (isSupabaseConfigured && supabase && isValidUuid(id)) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase!.from('documents').delete().eq('id', id).eq('user_id', user.id).then();
        }
      }).catch(() => {});
    }
  },

  async loadUserDataFromCloud(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase || !userId) return false;
    setActiveUserId(userId);
    try {
      let changed = false;

      // 1. Profil utilisateur & stats
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileData) {
        const current = this.getUserStats();
        const merged: UserStats = {
          ...current,
          xp: typeof profileData.xp === 'number' ? profileData.xp : current.xp,
          level: profileData.level || current.level,
          levelTitle: profileData.level_title || current.levelTitle,
          streakDays: typeof profileData.streak_days === 'number' ? profileData.streak_days : current.streakDays,
          lastActiveDate: profileData.last_active_date || current.lastActiveDate,
          hearts: typeof profileData.hearts === 'number' ? profileData.hearts : current.hearts,
          maxHearts: typeof profileData.max_hearts === 'number' ? profileData.max_hearts : current.maxHearts,
          gems: typeof profileData.gems === 'number' ? profileData.gems : current.gems,
          questionsAnswered: typeof profileData.questions_answered === 'number' ? profileData.questions_answered : current.questionsAnswered,
          quizzesCompleted: typeof profileData.quizzes_completed === 'number' ? profileData.quizzes_completed : current.quizzesCompleted,
          cardsMastered: typeof profileData.cards_mastered === 'number' ? profileData.cards_mastered : current.cardsMastered,
          badges: Array.isArray(profileData.badges) && profileData.badges.length > 0 ? profileData.badges : current.badges,
          profile: (profileData.profile as UserProfile) || current.profile,
          language: (profileData.language as SupportedLanguage) || current.language,
        };
        setItemScoped(STORAGE_KEYS.USER_STATS, JSON.stringify(merged));
        changed = true;
      } else {
        // Premier enregistrement : créer le profil vierge dans Supabase
        await supabase.from('profiles').insert({
          id: userId,
          xp: 0,
          level: 1,
          level_title: 'Curieux Novice',
          streak_days: 0,
          hearts: 5,
          max_hearts: 5,
          gems: 20,
          questions_answered: 0,
          quizzes_completed: 0,
          cards_mastered: 0,
          badges: INITIAL_BADGES,
          profile: 'eleve',
          language: 'fr',
          last_active_date: new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        });
        setItemScoped(STORAGE_KEYS.USER_STATS, JSON.stringify(DEFAULT_USER_STATS));
        changed = true;
      }

      // 2. Duolingo Paths
      const { data: pathsData } = await supabase
        .from('duolingo_paths')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const paths: DuolingoPath[] = (pathsData || []).map((row: any) => ({
        id: row.id,
        documentId: row.document_id,
        title: row.title,
        subject: row.subject,
        userRequest: row.user_request,
        totalQuestions: row.total_questions || 100,
        lessons: row.lessons || [],
        units: row.units || [],
        docSummary: row.doc_summary,
        docKeyConcepts: row.doc_key_concepts || [],
        createdAt: row.created_at,
      }));
      setItemScoped(STORAGE_KEYS.DUOLINGO_PATHS, JSON.stringify(paths));
      changed = true;

      // 3. Quizzes
      const { data: quizData } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const quizzes: Quiz[] = (quizData || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        subject: row.subject,
        difficulty: row.difficulty,
        timeLimitSeconds: row.time_limit_seconds,
        questions: row.questions || [],
        timesPlayed: row.times_played || 0,
        bestScore: row.best_score || 0,
        createdAt: row.created_at,
      }));
      setItemScoped(STORAGE_KEYS.QUIZZES, JSON.stringify(quizzes));

      // 4. Flashcards
      const { data: deckData } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const decks: FlashcardDeck[] = (deckData || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        subject: row.subject,
        timesReviewed: row.times_reviewed || 0,
        cards: row.cards || [],
        createdAt: row.created_at,
      }));
      setItemScoped(STORAGE_KEYS.FLASHCARDS, JSON.stringify(decks));

      // 5. Documents
      const { data: docData } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const docs: AnalyzedDocument[] = (docData || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        fileName: row.file_name,
        fileType: row.file_type,
        summary: row.summary,
        keyConcepts: row.key_concepts || [],
        studyTip: row.study_tip,
        suggestedQuestions: row.suggested_questions || [],
        rawTextPreview: row.raw_text_preview,
        questionCount: row.question_count || 0,
        storagePath: row.storage_path,
        createdAt: row.created_at,
      }));
      setItemScoped(STORAGE_KEYS.DOCUMENTS, JSON.stringify(docs));

      // 6. Conversations
      const { data: convData } = await supabase
        .from('conversations')
        .select('*, conversation_messages(*)')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      const convs: Conversation[] = (convData || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        profile: row.profile,
        tags: row.tags || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        messages: (row.conversation_messages || []).map((m: any) => ({
          id: m.id,
          role: (m.sender === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: m.text || '',
          timestamp: m.timestamp,
        })),
      }));
      setItemScoped(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));
      setItemScoped(STORAGE_KEYS.STUDY_GROUPS, JSON.stringify([]));

      if (changed) {
        window.dispatchEvent(new CustomEvent('kipo_cloud_data_synced'));
      }
      return true;
    } catch (err) {
      console.warn('Erreur lors du chargement des données Supabase:', err);
      return false;
    }
  },

  exportBackupJson(): string {
    const payload = {
      userStats: this.getUserStats(),
      conversations: this.getConversations(),
      quizzes: this.getQuizzes(),
      flashcards: this.getFlashcardDecks(),
      documents: this.getDocuments(),
      studyGroups: this.getStudyGroups(),
      duolingoPaths: this.getDuolingoPaths(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(payload, null, 2);
  },

  resetToDefault(): void {
    removeItemScoped(STORAGE_KEYS.USER_STATS);
    removeItemScoped(STORAGE_KEYS.CONVERSATIONS);
    removeItemScoped(STORAGE_KEYS.QUIZZES);
    removeItemScoped(STORAGE_KEYS.FLASHCARDS);
    removeItemScoped(STORAGE_KEYS.DOCUMENTS);
    removeItemScoped(STORAGE_KEYS.STUDY_GROUPS);
    removeItemScoped(STORAGE_KEYS.DUOLINGO_PATHS);
    setActiveUserId(null);
  },
};
