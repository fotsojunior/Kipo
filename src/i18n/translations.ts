import { SupportedLanguage } from '../types';

export interface TranslationSchema {
  app: {
    name: string;
    tagline: string;
    subtagline: string;
  };
  nav: {
    chat: string;
    studio: string;
    podcast?: string;
    collab: string;
    games: string;
    library: string;
    profile: string;
    duolingo: string;
    help: string;
    login: string;
    signup: string;
    account: string;
    translate: string;
    profession: string;
    searchPlaceholder: string;
  };
  profiles: {
    eleve: { name: string; label: string; desc: string };
    etudiant: { name: string; label: string; desc: string };
    professeur: { name: string; label: string; desc: string };
    autre: { name: string; label: string; desc: string };
  };
  chat: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    inputPlaceholder: string;
    attachFile: string;
    send: string;
    quickSuggestions: string[];
    turnToQuiz: string;
    turnToFlashcards: string;
    copy: string;
    copied: string;
    analyzing: string;
  };
  studio: {
    title: string;
    subtitle: string;
    dropTitle: string;
    dropSub: string;
    pasteText: string;
    placeholderText: string;
    analyzeBtn: string;
    sampleCourses: string;
    summary: string;
    keyConcepts: string;
    studyTip: string;
    testQuestions: string;
    generateQuizNow: string;
    generateCardsNow: string;
  };
  collab: {
    badge: string;
    title: string;
    subtitle: string;
    createGroup: string;
    joinWithCode: string;
    public: string;
    private: string;
    join: string;
    requestAccess: string;
    enterGroup: string;
    pending: string;
    shareDoc: string;
    chooseFromStudio: string;
    tabChat: string;
    tabDocs: string;
    tabQuizzes: string;
    tabMembers: string;
    tabRequests: string;
    tabSettings: string;
    aiCoach: string;
    aiSummarize: string;
    aiChallenge: string;
    chatPlaceholder: string;
    send: string;
    creatorBadge: string;
    memberBadge: string;
    adminBadge: string;
    filterAll: string;
    filterPublic: string;
    filterPrivate: string;
    filterMy: string;
    searchPlaceholder: string;
    noGroups: string;
    membersCount: string;
  };
  duolingo: {
    title: string;
    subtitle: string;
    readyFirstCourse: string;
    heartsRemaining: string;
    heartsEmpty: string;
    welcomeTitle: string;
    welcomeDesc: string;
    btnPhoto: string;
    btnCustomSubject: string;
    startLesson: string;
    continue: string;
    continueBtn: string;
    check: string;
    correct: string;
    incorrect: string;
    nextQuestion: string;
    completedTitle: string;
    xpGained: string;
    downloadGallery: string;
    quitLesson: string;
    explanation: string;
    lessonFinishedTitle: string;
    translateQuestion: string;
    translatingQuestion: string;
  };
  auth: {
    reminderTitle: string;
    reminderText: string;
    login: string;
    signup: string;
    guestNotice: string;
    savePrompt: string;
    cloudSaved: string;
  };
  quiz: {
    title: string;
    modeQuiz: string;
    modeChallenge: string;
    modeFlashcards: string;
    startBtn: string;
    question: string;
    explanation: string;
    next: string;
    finish: string;
    score: string;
    xpEarned: string;
    congrats: string;
    replay: string;
    saveToLib: string;
    newQuizBtn: string;
  };
  flashcards: {
    title: string;
    flipHint: string;
    showHint: string;
    difficulty: {
      again: string;
      good: string;
      perfect: string;
    };
    completedTitle: string;
  };
  library: {
    title: string;
    subtitle: string;
    tabAll: string;
    tabDocs: string;
    tabQuizzes: string;
    tabCards: string;
    tabChats: string;
    noItems: string;
    open: string;
    play: string;
    delete: string;
  };
  gamification: {
    xp: string;
    level: string;
    streak: string;
    streakLabel: string;
    badgesTitle: string;
    levelProgress: string;
    levelUpModalTitle: string;
    levelUpSubtitle: string;
  };
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

const rawTranslations: { fr: TranslationSchema; en: TranslationSchema } & Record<string, DeepPartial<TranslationSchema>> = {
  fr: {
    app: {
      name: 'KIPO',
      tagline: 'Apprends en t’amusant avec l’IA',
      subtagline: 'Plateforme éducative pour élèves, étudiants et enseignants',
    },
    nav: {
      chat: 'Tuteur IA',
      studio: 'Documents',
      collab: 'Groupes',
      games: 'Quiz & Jeux',
      library: 'Bibliothèque',
      profile: 'Profil & XP',
      duolingo: 'Sentier KIPO',
      help: 'Aide',
      login: 'Connexion',
      signup: "S'inscrire",
      account: 'Mon Compte',
      translate: 'Traduire',
      profession: 'Profession :',
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
      autre: {
        name: 'Autre',
        label: 'Professionnel / Passionné / Parent',
        desc: 'Apprentissage continu, reconversion professionnelle, culture générale et curiosité.',
      },
    },
    chat: {
      title: 'Tuteur IA Pédagogique',
      emptyTitle: 'Comment puis-je t’aider à réussir aujourd’hui ?',
      emptySubtitle: 'Pose une question, demande une explication claire ou importe ton cours en photo/PDF !',
      inputPlaceholder: 'Pose ta question ou décris ton problème...',
      attachFile: 'Joindre un document (PDF, photo, texte)',
      send: 'Envoyer',
      quickSuggestions: [
        'Explique-moi la mitose cellulaire simplement',
        'Fais-moi réviser le théorème de Pythagore',
        'Résume les causes de la Seconde Guerre mondiale',
        'Donne-moi une astuce pour mémoriser les verbes irréguliers',
      ],
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
      sampleCourses: 'Exemples de cours à tester en 1 clic :',
      summary: 'Résumé Synthétique',
      keyConcepts: 'Notions & Formules Clés',
      studyTip: 'Astuce de Mémorisation',
      testQuestions: 'Questions d’Auto-évaluation',
      generateQuizNow: 'Générer un Quiz à partir de ce cours',
      generateCardsNow: 'Générer des Flashcards',
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
      title: 'Sentier d’Apprentissage 20Q',
      subtitle: '20 questions progressives par document pour maîtriser ton cours',
      readyFirstCourse: 'Prêt pour ton premier cours',
      heartsRemaining: 'vies restantes',
      heartsEmpty: 'Cœurs épuisés ! Clique pour recharger',
      welcomeTitle: 'Bienvenue sur ton Sentier d’Apprentissage !',
      welcomeDesc: 'Ton espace est vierge et prêt pour tes propres cours. Importe une photo de ton cahier ou saisis un sujet pour que l’IA crée ton premier sentier interactif personnalisé !',
      btnPhoto: 'Photographier / Importer un cours 📸',
      btnCustomSubject: 'Créer un sentier sur un sujet libre ✍️',
      startLesson: 'Commencer la leçon',
      continue: 'Continuer',
      continueBtn: 'Continuer',
      check: 'Vérifier la réponse',
      correct: 'Excellent ! Bonne réponse',
      incorrect: 'Pas tout à fait. La bonne réponse était :',
      nextQuestion: 'Question suivante',
      completedTitle: 'Leçon terminée avec succès !',
      xpGained: 'Points XP Gagnés',
      downloadGallery: 'Télécharger la photo du sentier dans la galerie',
      quitLesson: 'Quitter la leçon',
      explanation: 'Explication pédagogique :',
      lessonFinishedTitle: 'Leçon Terminée avec Brio !',
      translateQuestion: '🌐 Traduire cette question',
      translatingQuestion: 'Traduction en cours...',
    },
    auth: {
      reminderTitle: 'Sauvegardez vos progrès sur KIPO !',
      reminderText: 'Connectez-vous ou inscrivez-vous dès maintenant pour enregistrer vos cours, vos quiz et vos progrès sur le Cloud.',
      login: 'Connexion',
      signup: "S'inscrire",
      guestNotice: 'Mode Invité actif : Votre travail n’est pas sauvegardé dans le Cloud.',
      savePrompt: 'Se connecter / S’inscrire',
      cloudSaved: 'Sauvegardé sur le Cloud',
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
      newQuizBtn: 'Créer un nouveau Quiz IA',
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
  },

  en: {
    app: {
      name: 'KIPO',
      tagline: 'Learn while having fun with AI',
      subtagline: 'International educational platform for students and teachers',
    },
    nav: {
      chat: 'AI Tutor',
      studio: 'Documents',
      collab: 'Study Groups',
      games: 'Quiz & Games',
      library: 'Library',
      profile: 'Profile & XP',
      duolingo: '20Q Path',
      help: 'Help',
      login: 'Log In',
      signup: 'Sign Up',
      account: 'My Account',
      translate: 'Translate',
      profession: 'Role:',
      searchPlaceholder: 'Search a lesson, quiz, discussion...',
    },
    profiles: {
      eleve: {
        name: 'Student',
        label: 'K-12 Pupil',
        desc: 'Simple explanations, visual metaphors, encouragement, and socratic guiding.',
      },
      etudiant: {
        name: 'Higher Ed',
        label: 'University Student',
        desc: 'Academic rigor, formulas, synthesis, and exam preparation.',
      },
      professeur: {
        name: 'Teacher',
        label: 'Educator & Professor',
        desc: 'Lesson planning, assessment rubrics, differentiated instruction, and exercises.',
      },
      autre: {
        name: 'Other',
        label: 'Professional / Lifelong Learner',
        desc: 'Continuous learning, career change, general knowledge, and personal growth.',
      },
    },
    chat: {
      title: 'Pedagogical AI Tutor',
      emptyTitle: 'How can I help you learn today?',
      emptySubtitle: 'Ask a question, request a clear explanation, or upload your lesson notes/PDF!',
      inputPlaceholder: 'Ask your question or describe your problem...',
      attachFile: 'Attach a file (PDF, photo, text)',
      send: 'Send',
      quickSuggestions: [
        'Explain cellular mitosis simply',
        'Help me revise the Pythagorean theorem',
        'Summarize the causes of World War II',
        'Give me a mnemonic trick for irregular verbs',
      ],
      turnToQuiz: 'Create Quiz',
      turnToFlashcards: 'Create Flashcards',
      copy: 'Copy',
      copied: 'Copied!',
      analyzing: 'AI pedagogical analysis in progress...',
    },
    studio: {
      title: 'Document Analysis Studio',
      subtitle: 'Turn any lesson notes, PDF, photo, or text into interactive learning materials.',
      dropTitle: 'Drag your document here or click to upload',
      dropSub: 'Supported formats: PDF, PNG, JPG, JPEG, TXT, Markdown (max 25 MB)',
      pasteText: 'Or paste your lesson text directly:',
      placeholderText: 'Paste here your textbook chapter or notes...',
      analyzeBtn: 'Analyze with AI',
      sampleCourses: '1-click sample lessons to test:',
      summary: 'Summary',
      keyConcepts: 'Key Notions & Formulas',
      studyTip: 'Memory Tip',
      testQuestions: 'Self-check Questions',
      generateQuizNow: 'Generate a Quiz from this lesson',
      generateCardsNow: 'Generate Flashcards',
    },
    collab: {
      badge: 'INTERNATIONAL COLLABORATIVE SPACE',
      title: 'Study Groups & Mutual Help',
      subtitle: 'Create your own public or private group with your own custom subject, share photos, PDFs, and notes to succeed together!',
      createGroup: 'Create Study Group',
      joinWithCode: 'Invite Code',
      public: 'Public',
      private: 'Private',
      join: 'Join',
      requestAccess: 'Request Access',
      enterGroup: 'Enter Group',
      pending: 'Pending',
      shareDoc: 'Share Photo or PDF',
      chooseFromStudio: 'Choose from Studio',
      tabChat: 'Discussion & AI',
      tabDocs: 'Documents & Files',
      tabQuizzes: 'Team Quizzes',
      tabMembers: 'Members',
      tabRequests: 'Requests',
      tabSettings: 'Permissions',
      aiCoach: 'KIPO AI Group Coach:',
      aiSummarize: '⚡ Discussion Summary',
      aiChallenge: '🏆 Start Team Challenge',
      chatPlaceholder: 'Write a message or question to the group...',
      send: 'Send',
      creatorBadge: '👑 Creator',
      memberBadge: 'Member ✓',
      adminBadge: 'You are Admin',
      filterAll: 'All Groups',
      filterPublic: 'Public Groups',
      filterPrivate: 'Private Groups',
      filterMy: 'My Groups',
      searchPlaceholder: 'Search by subject or name...',
      noGroups: 'No group matches your filter. Create the first one now!',
      membersCount: 'member(s)',
    },
    duolingo: {
      title: '20Q Learning Path',
      subtitle: '20 progressive questions per document to master your subject',
      readyFirstCourse: 'Ready for your first lesson',
      heartsRemaining: 'hearts remaining',
      heartsEmpty: 'Hearts depleted! Click to refill',
      welcomeTitle: 'Welcome to your Learning Path!',
      welcomeDesc: 'Your space is clean and ready for your own lessons. Take a photo of your notebook or enter a topic for AI to generate your first path!',
      btnPhoto: 'Photograph / Upload a course 📸',
      btnCustomSubject: 'Create a path on any topic ✍️',
      startLesson: 'Start Lesson',
      continue: 'Continue',
      continueBtn: 'Continue',
      check: 'Check Answer',
      correct: 'Awesome! Correct answer',
      incorrect: 'Not quite. The correct answer was:',
      nextQuestion: 'Next Question',
      completedTitle: 'Lesson completed successfully!',
      xpGained: 'XP Points Earned',
      downloadGallery: 'Download path photo to gallery',
      quitLesson: 'Quit Lesson',
      explanation: 'Educational explanation:',
      lessonFinishedTitle: 'Lesson Successfully Completed!',
      translateQuestion: '🌐 Translate this question',
      translatingQuestion: 'Translating question...',
    },
    auth: {
      reminderTitle: 'Save your progress on KIPO!',
      reminderText: 'Log in or sign up now to keep your courses, quizzes, and XP safely in the Cloud.',
      login: 'Log In',
      signup: 'Sign Up',
      guestNotice: 'Guest mode active: Your work is not saved in the Cloud.',
      savePrompt: 'Log In / Sign Up',
      cloudSaved: 'Saved to Cloud',
    },
    quiz: {
      title: 'Quizzes & Challenges',
      modeQuiz: 'Classic Quiz',
      modeChallenge: 'Timed Challenge (Boss)',
      modeFlashcards: 'Flashcards',
      startBtn: 'Start',
      question: 'Question',
      explanation: 'Pedagogical explanation:',
      next: 'Next question',
      finish: 'View results',
      score: 'Your Score',
      xpEarned: 'XP Earned',
      congrats: 'Congratulations!',
      replay: 'Play again',
      saveToLib: 'Save to library',
      newQuizBtn: 'Create a new AI Quiz',
    },
    flashcards: {
      title: 'Interactive Flashcards',
      flipHint: 'Click card to flip',
      showHint: 'Show hint',
      difficulty: {
        again: 'Review (+5 XP)',
        good: 'Good (+15 XP)',
        perfect: 'Perfect! (+25 XP)',
      },
      completedTitle: 'Session completed with brilliance!',
    },
    library: {
      title: 'Personal Library',
      subtitle: 'Find all your analyzed courses, saved quizzes, and discussions.',
      tabAll: 'All',
      tabDocs: 'Documents',
      tabQuizzes: 'Quizzes',
      tabCards: 'Flashcards',
      tabChats: 'Chat History',
      noItems: 'No items found yet.',
      open: 'Open',
      play: 'Play',
      delete: 'Delete',
    },
    gamification: {
      xp: 'XP',
      level: 'Level',
      streak: 'Day streak',
      streakLabel: 'Active streak',
      badgesTitle: 'Badges & Trophies',
      levelProgress: 'Progress to next level',
      levelUpModalTitle: 'LEVEL UP!',
      levelUpSubtitle: 'You unlocked new knowledge powerups!',
    },
  },

  es: {
    app: {
      name: 'KIPO',
      tagline: 'Aprende divirtiéndote con la IA',
      subtagline: 'Plataforma educativa para alumnos, estudiantes y profesores',
    },
    nav: {
      chat: 'Tutor IA',
      studio: 'Documentos',
      collab: 'Grupos',
      games: 'Quiz y Juegos',
      library: 'Biblioteca',
      profile: 'Perfil y XP',
      duolingo: 'Sendero 20Q',
      help: 'Ayuda',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      account: 'Mi Cuenta',
      translate: 'Traducir',
      profession: 'Rol:',
      searchPlaceholder: 'Buscar un curso, quiz o conversación...',
    },
    profiles: {
      eleve: {
        name: 'Alumno',
        label: 'Primaria / Secundaria',
        desc: 'Explicaciones claras, metáforas sencillas, motivación y método socrático.',
      },
      etudiant: {
        name: 'Estudiante',
        label: 'Universidad',
        desc: 'Rigor conceptual, fórmulas, capacidad de síntesis y preparación de exámenes.',
      },
      professeur: {
        name: 'Profesor',
        label: 'Docente y Formador',
        desc: 'Planes de clase, rúbricas de evaluación, diferenciación pedagógica y actividades.',
      },
      autre: {
        name: 'Otro',
        label: 'Profesional / Curioso / Adulto',
        desc: 'Aprendizaje continuo, reconversión profesional, cultura general y superación.',
      },
    },
    chat: {
      title: 'Tutor Pedagógico IA',
      emptyTitle: '¿Cómo puedo ayudarte a aprender hoy?',
      emptySubtitle: 'Haz una pregunta, solicita una explicación o sube tu curso en foto o PDF.',
      inputPlaceholder: 'Escribe tu pregunta o duda...',
      attachFile: 'Adjuntar documento (PDF, foto, texto)',
      send: 'Enviar',
      quickSuggestions: [
        'Explícame la mitosis celular de forma sencilla',
        'Ayúdame a repasar el teorema de Pitágoras',
        'Resume las causas de la Segunda Guerra Mundial',
        'Dame un truco mnemotécnico para los verbos irregulares',
      ],
      turnToQuiz: 'Crear un Quiz',
      turnToFlashcards: 'Crear Tarjetas de Memoria',
      copy: 'Copiar',
      copied: '¡Copiado!',
      analyzing: 'Análisis pedagógico de IA en curso...',
    },
    studio: {
      title: 'Taller de Análisis de Documentos',
      subtitle: 'Convierte apuntes, PDFs, fotos de cuadernos o textos en material interactivo.',
      dropTitle: 'Arrastra tu documento aquí o haz clic para subir',
      dropSub: 'Formatos admitidos: PDF, PNG, JPG, JPEG, TXT, Markdown (máx 25 MB)',
      pasteText: 'O pega el texto de tu lección directamente:',
      placeholderText: 'Pega aquí el capítulo, apuntes o ejercicios...',
      analyzeBtn: 'Analizar documento con IA',
      sampleCourses: 'Cursos de ejemplo en 1 clic:',
      summary: 'Resumen Sintético',
      keyConcepts: 'Conceptos y Fórmulas Clave',
      studyTip: 'Consejo de Memorización',
      testQuestions: 'Preguntas de Autoevaluación',
      generateQuizNow: 'Generar Quiz a partir de este curso',
      generateCardsNow: 'Generar Tarjetas de Memoria',
    },
    collab: {
      title: 'Espacios de Estudio Colaborativos',
      subtitle: 'Únete o crea grupos públicos o privados para repasar y compartir.',
      createGroup: 'Crear grupo de estudio',
      public: 'Público',
      private: 'Privado',
      join: 'Unirse',
      pending: 'Pendiente',
      shareDoc: 'Compartir documento (Foto / PDF)',
    },
    duolingo: {
      title: 'Sendero de Aprendizaje 20Q',
      subtitle: '20 preguntas progresivas por documento para dominar tu tema',
      startLesson: 'Comenzar lección',
      continue: 'Continuar',
      check: 'Comprobar respuesta',
      correct: '¡Excelente! Respuesta correcta',
      incorrect: 'No exactamente. La respuesta correcta era:',
      nextQuestion: 'Siguiente pregunta',
      completedTitle: '¡Lección completada con éxito!',
      xpGained: 'Puntos XP Ganados',
    },
    auth: {
      reminderTitle: '¡Guarda tu progreso en KIPO!',
      reminderText: 'Inicia sesión o regístrate para almacenar tus cursos, quiz y XP en la Nube.',
      login: 'Iniciar Sesión',
      signup: 'Registrarse',
      guestNotice: 'Modo Invitado activo: Tu trabajo no se guarda en la Nube.',
      savePrompt: 'Iniciar Sesión / Registrarse',
      cloudSaved: 'Guardado en la Nube',
    },
    quiz: {
      title: 'Quiz y Desafíos Educativos',
      modeQuiz: 'Quiz Clásico',
      modeChallenge: 'Desafío Cronometrado (Jefe)',
      modeFlashcards: 'Tarjetas de Memoria',
      startBtn: 'Comenzar',
      question: 'Pregunta',
      explanation: 'Explicación pedagógica:',
      next: 'Siguiente pregunta',
      finish: 'Ver resultados',
      score: 'Tu Puntuación',
      xpEarned: 'XP Ganados',
      congrats: '¡Felicitaciones!',
      replay: 'Jugar de nuevo',
      saveToLib: 'Guardar en biblioteca',
      newQuizBtn: 'Crear nuevo Quiz IA',
    },
    flashcards: {
      title: 'Tarjetas de Memoria Interactivas',
      flipHint: 'Haz clic en la tarjeta para girarla',
      showHint: 'Mostrar pista',
      difficulty: {
        again: 'Repasar (+5 XP)',
        good: 'Bien (+15 XP)',
        perfect: '¡Perfecto! (+25 XP)',
      },
      completedTitle: '¡Sesión completada con éxito!',
    },
    library: {
      title: 'Biblioteca Personal',
      subtitle: 'Encuentra todos tus cursos analizados, quiz creados y conversaciones guardadas.',
      tabAll: 'Todo',
      tabDocs: 'Documentos',
      tabQuizzes: 'Quiz',
      tabCards: 'Tarjetas',
      tabChats: 'Historial',
      noItems: 'No hay elementos guardados aún.',
      open: 'Abrir',
      play: 'Jugar',
      delete: 'Eliminar',
    },
    gamification: {
      xp: 'XP',
      level: 'Nivel',
      streak: 'Días seguidos',
      streakLabel: 'Racha activa',
      badgesTitle: 'Medallas y Trofeos',
      levelProgress: 'Progreso al siguiente nivel',
      levelUpModalTitle: '¡NIVEL SUPERIOR!',
      levelUpSubtitle: '¡Desbloqueaste nuevos poderes del saber!',
    },
  },

  ar: {
    app: {
      name: 'KIPO',
      tagline: 'تعلم واستمتع مع الذكاء الاصطناعي',
      subtagline: 'منصة تعليمية ذكية للتلاميذ والطلاب والمعلمين',
    },
    nav: {
      chat: 'المعلم الذكي',
      studio: 'المستندات',
      collab: 'مجموعات الدراسة',
      games: 'اختبارات وألعاب',
      library: 'المكتبة',
      profile: 'الملف الشخصي',
      duolingo: 'مسار 20 سؤالاً',
      help: 'مساعدة',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      account: 'حسابي',
      translate: 'ترجمة',
      profession: 'الدور:',
      searchPlaceholder: 'ابحث عن درس أو اختبار أو محادثة...',
    },
    profiles: {
      eleve: {
        name: 'تلميذ',
        label: 'ابتدائي / إعدادي / ثانوي',
        desc: 'شروحات مبسطة، أمثلة بصرية، وتشجيع مستمر على الفهم والتفوق.',
      },
      etudiant: {
        name: 'طالب جامعي',
        label: 'تعليم عالي',
        desc: 'دقة علمية، معادلات متقدمة، وملخصات شاملة للتحضير للامتحانات.',
      },
      professeur: {
        name: 'أستاذ',
        label: 'معلم ومدرّب',
        desc: 'إعداد خطط الدروس، معايير التقييم، وتصميم أنشطة تفاعلية للطلاب.',
      },
      autre: {
        name: 'آخر',
        label: 'مهني / متعلم شغوف / ولي أمر',
        desc: 'التعلم المستمر، التطوير المهني، والثقافة العامة.',
      },
    },
    chat: {
      title: 'المعلم التربوي الذكي',
      emptyTitle: 'كيف يمكنني مساعدتك في النجاح اليوم؟',
      emptySubtitle: 'اطرح سؤالاً، اطلب شرحاً مبسطاً، أو ارفع درسك كصورة أو ملف PDF!',
      inputPlaceholder: 'اكتب سؤالك أو مسألتك هنا...',
      attachFile: 'إرفاق ملف (PDF، صورة، نص)',
      send: 'إرسال',
      quickSuggestions: [
        'اشرح لي الانقسام الخلوي ببساطة',
        'ساعدني في مراجعة مبرهنة فيثاغورس',
        'لخص أسباب الحرب العالمية الثانية',
        'أعطني حيلة لتذكر الأفعال الشاذة',
      ],
      turnToQuiz: 'إنشاء اختبار',
      turnToFlashcards: 'إنشاء بطاقات تعليمية',
      copy: 'نسخ',
      copied: 'تم النسخ!',
      analyzing: 'جاري التحليل والتفكير التربوي...',
    },
    studio: {
      title: 'ورشة تحليل المستندات',
      subtitle: 'حول أي درس أو كتاب أو صورة إلى مسار تعليمي تفاعلي حي.',
      dropTitle: 'اسحب مستندك هنا أو انقر للتحميل',
      dropSub: 'الصيغ المدعومة: PDF، PNG، JPG، JPEG، TXT (حتى 25 ميغابايت)',
      pasteText: 'أو الصق نص الدرس مباشرة:',
      placeholderText: 'الصق هنا نص الفصل أو الملاحظات...',
      analyzeBtn: 'تحليل المستند بالذكاء الاصطناعي',
      sampleCourses: 'دروس تجريبية بنقرة واحدة:',
      summary: 'ملخص شامل',
      keyConcepts: 'المفاهيم والمعادلات الأساسية',
      studyTip: 'نصيحة للحفظ والفهم',
      testQuestions: 'أسئلة تقييم ذاتي',
      generateQuizNow: 'إنشاء اختبار من هذا الدرس',
      generateCardsNow: 'إنشاء بطاقات تعليمية',
    },
    collab: {
      title: 'مساحات الدراسة التعاونية',
      subtitle: 'انضم أو أنشئ مجموعات دراسية عامة أو خاصة للمراجعة ومشاركة الملفات.',
      createGroup: 'إنشاء مجموعة دراسة',
      public: 'عام (متاح للجميع)',
      private: 'خاص (يتطلب موافقة)',
      join: 'انضمام',
      pending: 'في الانتظار',
      shareDoc: 'مشاركة مستند (صورة / PDF)',
    },
    duolingo: {
      title: 'مسار التعلم التفاعلي 20Q',
      subtitle: '20 سؤالاً تدريجياً لإتقان درسك بالكامل',
      startLesson: 'بدء الدرس',
      continue: 'متابعة',
      check: 'تحقق من الإجابة',
      correct: 'ممتاز! إجابة صحيحة',
      incorrect: 'ليس تماماً. الإجابة الصحيحة هي:',
      nextQuestion: 'السؤال التالي',
      completedTitle: 'اكتمل الدرس بنجاح باهر!',
      xpGained: 'نقاط الخبرة XP المكتسبة',
    },
    auth: {
      reminderTitle: 'احفظ تقدمك على KIPO!',
      reminderText: 'سجل الدخول أو أنشئ حساباً مجانياً لتخزين دروسك واختباراتك في السحابة.',
      login: 'تسجيل الدخول',
      signup: 'إنشاء حساب',
      guestNotice: 'وضع الزائر: عملك غير محفوظ في السحابة حالياً.',
      savePrompt: 'تسجيل الدخول / إنشاء حساب',
      cloudSaved: 'محفوظ في السحابة',
    },
    quiz: {
      title: 'الاختبارات والتحديات',
      modeQuiz: 'اختبار كلاسيكي',
      modeChallenge: 'تحدي زمني ضد الوقت',
      modeFlashcards: 'بطاقات تعليمية',
      startBtn: 'ابدأ',
      question: 'سؤال',
      explanation: 'التفسير والشرح التربوي:',
      next: 'السؤال التالي',
      finish: 'عرض النتائج',
      score: 'نتيجتك',
      xpEarned: 'نقاط XP المكتسبة',
      congrats: 'تهانينا الحارة!',
      replay: 'إعادة المحاولة',
      saveToLib: 'حفظ في المكتبة',
      newQuizBtn: 'إنشاء اختبار ذكي جديد',
    },
    flashcards: {
      title: 'بطاقات الذاكرة التفاعلية',
      flipHint: 'انقر على البطاقة لقلبها',
      showHint: 'إظهار تلميح',
      difficulty: {
        again: 'يحتاج مراجعة (+5 XP)',
        good: 'جيد (+15 XP)',
        perfect: 'ممتاز جداً! (+25 XP)',
      },
      completedTitle: 'تم إنهاء الجلسة بنجاح وتفوق!',
    },
    library: {
      title: 'المكتبة الشخصية',
      subtitle: 'جميع دروسك المحللة واختباراتك ومحادثاتك محفوظة هنا.',
      tabAll: 'الكل',
      tabDocs: 'المستندات',
      tabQuizzes: 'الاختبارات',
      tabCards: 'البطاقات',
      tabChats: 'المحادثات',
      noItems: 'لا توجد عناصر محفوظة حتى الآن.',
      open: 'فتح',
      play: 'لعب',
      delete: 'حذف',
    },
    gamification: {
      xp: 'XP',
      level: 'المستوى',
      streak: 'أيام الحماسة',
      streakLabel: 'السلسلة النشطة',
      badgesTitle: 'الأوسمة والجوائز',
      levelProgress: 'التقدم نحو المستوى التالي',
      levelUpModalTitle: 'ترقية إلى مستوى أعلى!',
      levelUpSubtitle: 'لقد فتحت قدرات ومعارف جديدة مدهشة!',
    },
  },

  'zh-cn': {
    app: {
      name: 'KIPO',
      tagline: '用AI让学习充满乐趣',
      subtagline: '面向中小学生、大学生和教师的全球智能教育平台',
    },
    nav: {
      chat: 'AI导师',
      studio: '文档工坊',
      collab: '学习小组',
      games: '测验与游戏',
      library: '我的资料库',
      profile: '个人主页',
      duolingo: '20题通关',
      help: '帮助指南',
      login: '登录',
      signup: '注册',
      account: '我的账户',
      translate: '翻译',
      profession: '身份：',
      searchPlaceholder: '搜索课程、测验或讨论...',
    },
    profiles: {
      eleve: {
        name: '中小学生',
        label: '小学 / 初中 / 高中',
        desc: '生动形象的解说、直观比喻与苏格拉底式启发引导。',
      },
      etudiant: {
        name: '大学生',
        label: '高等教育',
        desc: '严谨的学术思维、公式推演与高效备考复习。',
      },
      professeur: {
        name: '教师',
        label: '教育工作者',
        desc: '课程设计、评分标准与差异化教学教案助手。',
      },
      autre: {
        name: '其他',
        label: '职场人士 / 自学者 / 家长',
        desc: '终身学习、职业技能拓展、通识文化与好奇心探索。',
      },
    },
    chat: {
      title: 'AI 教学导师',
      emptyTitle: '今天想探索什么新知识？',
      emptySubtitle: '提出任何疑问、索取详细讲解，或直接上传课件/照片/PDF！',
      inputPlaceholder: '输入你的问题或作业难题...',
      attachFile: '添加附件 (PDF、图片、文本)',
      send: '发送',
      quickSuggestions: [
        '通俗易懂地解释细胞有丝分裂',
        '带我复习勾股定理与应用题',
        '简述第二次世界大战的核心起因',
        '分享高效记忆英语不规则动词的诀窍',
      ],
      turnToQuiz: '生成测验',
      turnToFlashcards: '生成记忆卡片',
      copy: '复制',
      copied: '已复制！',
      analyzing: 'AI 正在深入分析与构思讲解...',
    },
    studio: {
      title: '智能文档解析工坊',
      subtitle: '将教材、笔记、试卷或PDF瞬间转化为趣味互动学习资源。',
      dropTitle: '拖拽文档到此处或点击上传',
      dropSub: '支持格式：PDF, PNG, JPG, JPEG, TXT, Markdown (最高25MB)',
      pasteText: '或直接在此粘贴课程文本：',
      placeholderText: '在此粘贴课文、讲义或课堂笔记...',
      analyzeBtn: '使用 AI 智能分析',
      sampleCourses: '一键试用精选课程范例：',
      summary: '课程精炼摘要',
      keyConcepts: '核心公式与概念',
      studyTip: '高效记忆秘诀',
      testQuestions: '自我检验考题',
      generateQuizNow: '由此课程生成自测题',
      generateCardsNow: '生成强化记忆卡',
    },
    collab: {
      title: '协作学习空间',
      subtitle: '加入或创建公开或私密学习小组，共同讨论并分享课件。',
      createGroup: '创建学习小组',
      public: '公开群组',
      private: '私密群组',
      join: '申请加入',
      pending: '审核中',
      shareDoc: '分享资料 (图片/PDF)',
    },
    duolingo: {
      title: '20题渐进通关路',
      subtitle: '专为每份讲义定制的20道循序渐进闯关题',
      startLesson: '开始本节挑战',
      continue: '继续',
      check: '核对答案',
      correct: '太棒了！回答正确！',
      incorrect: '遗憾答错。正确答案是：',
      nextQuestion: '下一题',
      completedTitle: '恭喜通关！完美完成！',
      xpGained: '斩获经验值 XP',
    },
    auth: {
      reminderTitle: '云端同步你的学习进度！',
      reminderText: '立即登录或免费注册，让笔记、测验与经验值永不丢失。',
      login: '立即登录',
      signup: '免费注册',
      guestNotice: '访客模式：当前进度未保存至云端。',
      savePrompt: '登录 / 注册',
      cloudSaved: '已安全保存至云端',
    },
    quiz: {
      title: '智能测验挑战',
      modeQuiz: '标准自测',
      modeChallenge: '计时闯关挑战',
      modeFlashcards: '记忆翻卡',
      startBtn: '即刻开练',
      question: '问题',
      explanation: '题目精析：',
      next: '下一题',
      finish: '查看评测报告',
      score: '你的得分',
      xpEarned: '获得经验值',
      congrats: '热烈祝贺！',
      replay: '再试一次',
      saveToLib: '保存到资料库',
      newQuizBtn: 'AI 重新出题',
    },
    flashcards: {
      title: '互动复习抽认卡',
      flipHint: '点击卡片即可翻转看答案',
      showHint: '查看提示',
      difficulty: {
        again: '需复习 (+5 XP)',
        good: '良好 (+15 XP)',
        perfect: '完美熟记！ (+25 XP)',
      },
      completedTitle: '本组卡片学习大功告成！',
    },
    library: {
      title: '个人云端书库',
      subtitle: '集中管理已解析的教材、专属测验与问答历史。',
      tabAll: '全部内容',
      tabDocs: '课程文档',
      tabQuizzes: '自测考卷',
      tabCards: '记忆卡组',
      tabChats: '咨询记录',
      noItems: '资料库目前空空如也。',
      open: '打开查看',
      play: '开始闯关',
      delete: '删除',
    },
    gamification: {
      xp: 'XP',
      level: '等级',
      streak: '连续打卡',
      streakLabel: '坚持天数',
      badgesTitle: '荣誉勋章室',
      levelProgress: '升级进度条',
      levelUpModalTitle: '升级啦！',
      levelUpSubtitle: '你的知识宝库解锁了崭新力量！',
    },
  },
};

// Aliases for short codes
rawTranslations['zh'] = rawTranslations['zh-cn'];

/**
 * Register dynamically translated dictionary from /api/translate-ui
 */
export function registerDynamicLanguage(langCode: string, dictionary: TranslationSchema) {
  if (!langCode || !dictionary) return;
  const key = langCode.toLowerCase().trim();
  rawTranslations[key] = dictionary;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`kipo_i18n_${key}`, JSON.stringify(dictionary));
    } catch {}
    window.dispatchEvent(new CustomEvent('kipo_i18n_updated', { detail: { language: key } }));
  }
}

/**
 * Try to load cached dictionary from localStorage on boot
 */
if (typeof window !== 'undefined') {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('kipo_i18n_')) {
        const langCode = key.replace('kipo_i18n_', '');
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (data && data.app) {
          rawTranslations[langCode] = data;
        }
      }
    }
  } catch {}
}

function createSafeDictionary(source: any, fallback: any): any {
  if (!source || typeof source !== 'object') return fallback;
  return new Proxy(source, {
    get(target, prop: string | symbol) {
      if (typeof prop !== 'string') return target[prop];
      const val = target[prop];
      const fallbackVal = fallback ? fallback[prop] : undefined;
      if (val === undefined || val === null) {
        return fallbackVal;
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        return createSafeDictionary(val, fallbackVal);
      }
      return val;
    },
  });
}

/**
 * Safe proxy that falls back to French if a language or any nested key is missing
 */
export const translations: Record<string, TranslationSchema> = new Proxy(rawTranslations, {
  get(target, prop: string | symbol) {
    if (typeof prop === 'string') {
      const key = prop.toLowerCase().trim();
      let matched: any = undefined;
      if (key in target) {
        matched = (target as any)[key];
      } else {
        const prefix = key.split('-')[0];
        if (prefix in target) {
          matched = (target as any)[prefix];
        }
      }
      if (matched) {
        return createSafeDictionary(matched, target.fr);
      }
    }
    return target.fr;
  },
}) as any;
