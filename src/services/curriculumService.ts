import { DuolingoPath, LearningLesson, QuizQuestion, PathUnit } from '../types';

export type { PathUnit };

export interface CourseContext {
  title: string;
  subject?: string;
  summary?: string;
  keyConcepts?: string[];
  suggestedQuestions?: string[];
  rawTextPreview?: string;
  userRequest?: string;
}

export const PATH_UNITS: PathUnit[] = [
  {
    unitNumber: 1,
    title: 'Unité 1 : Les Fondations & Découverte',
    theme: 'Concepts fondamentaux et équation globale',
    description: 'Comprendre les réactifs essentiels, la lumière et les bases de l’autotrophie.',
    startLesson: 1,
    endLesson: 10,
    accentColor: '#10b981', // emerald
    badgeIcon: '🌱',
  },
  {
    unitNumber: 2,
    title: 'Unité 2 : Anatomie & Structures Cellulaires',
    theme: 'L’usine microscopique de la feuille',
    description: 'Découvrir les chloroplastes, thylakoïdes, stomates et tissus foliaires.',
    startLesson: 11,
    endLesson: 20,
    accentColor: '#06b6d4', // cyan
    badgeIcon: '🔬',
  },
  {
    unitNumber: 3,
    title: 'Unité 3 : Pigments & Spectre Lumineux',
    theme: 'La capture des photons solaires',
    description: 'Chlorophylles A et B, caroténoïdes, magnésium et absorption spectrale.',
    startLesson: 21,
    endLesson: 30,
    accentColor: '#8b5cf6', // purple
    badgeIcon: '🌈',
  },
  {
    unitNumber: 4,
    title: 'Unité 4 : La Phase Lumineuse (Photochimique)',
    theme: 'Conversion d’énergie et photolyse',
    description: 'Photosystèmes I et II, chaîne d’électrons, gradient de protons et synthèse d’ATP.',
    startLesson: 31,
    endLesson: 40,
    accentColor: '#f59e0b', // amber
    badgeIcon: '⚡',
  },
  {
    unitNumber: 5,
    title: 'Unité 5 : Le Cycle de Calvin (Phase Chimique)',
    theme: 'Fixation du carbone dans le stroma',
    description: 'La Rubisco, le RuBP, la synthèse des trioses phosphates et du glucose.',
    startLesson: 41,
    endLesson: 50,
    accentColor: '#ec4899', // pink
    badgeIcon: '🧪',
  },
  {
    unitNumber: 6,
    title: 'Unité 6 : Réserves, Sèves & Métabolisme',
    theme: 'Devenir des molécules synthétisées',
    description: 'Amidon de réserve, cellulose pariétale, sève élaborée et respiration nocturne.',
    startLesson: 51,
    endLesson: 60,
    accentColor: '#3b82f6', // blue
    badgeIcon: '🪵',
  },
  {
    unitNumber: 7,
    title: 'Unité 7 : Facteurs Limitants & Régulation',
    theme: 'Optimisation et influences de l’environnement',
    description: 'Intensité lumineuse, teneur en CO2, température, stress hydrique et serres.',
    startLesson: 61,
    endLesson: 70,
    accentColor: '#ea580c', // orange
    badgeIcon: '☀️',
  },
  {
    unitNumber: 8,
    title: 'Unité 8 : Diversité & Adaptations (C3, C4, CAM)',
    theme: 'Stratégies évolutives des plantes',
    description: 'Plantes en milieu aride, séparation spatiale et temporelle, économie d’eau.',
    startLesson: 71,
    endLesson: 80,
    accentColor: '#14b8a6', // teal
    badgeIcon: '🌵',
  },
  {
    unitNumber: 9,
    title: 'Unité 9 : Écologie Globale & Puits de Carbone',
    theme: 'Le poumon vert et bleu de la planète',
    description: 'Phytoplancton océanique, forêts boréales et tropicales, cycle biosphérique.',
    startLesson: 81,
    endLesson: 90,
    accentColor: '#6366f1', // indigo
    badgeIcon: '🌍',
  },
  {
    unitNumber: 10,
    title: 'Unité 10 : L’Épreuve Suprême du Grand Maître',
    theme: 'Défis de haut niveau et consolidation',
    description: 'Analyses d’expériences historiques, calculs de rendement et maîtrise totale.',
    startLesson: 91,
    endLesson: 100,
    accentColor: '#eab308', // gold
    badgeIcon: '👑',
  },
];

// Helper to retrieve the unit for any given lesson number (1 to 100)
export function getUnitForLesson(lessonNumber: number, path?: DuolingoPath): PathUnit {
  const units = path?.units && path.units.length === 10 ? path.units : PATH_UNITS;
  const found = units.find(
    (u) => lessonNumber >= u.startLesson && lessonNumber <= u.endLesson
  );
  return found || units[0];
}

// 100 distinct lesson curricula templates
const LESSON_CURRICULUM_DATA: Array<{
  title: string;
  description: string;
  questions: Array<{
    question: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string;
  }>;
}> = [
  // --- UNITÉ 1 (1 à 10) ---
  {
    title: 'Leçon 1 : Découverte & Équation Globale',
    description: 'Comprendre ce qu’est la photosynthèse et les réactifs nécessaires.',
    questions: [
      {
        question: 'Quel est l’objectif principal de la photosynthèse pour la plante ?',
        options: [
          'Produire du glucose organique à partir d’énergie lumineuse',
          'Absorber de l’oxygène pour respirer la nuit',
          'Réchauffer la tige de la plante',
          'Refléter la lumière verte pour faire joli',
        ],
        correctIndex: 0,
        explanation: 'La photosynthèse transforme l’énergie lumineuse en énergie chimique stockée dans le glucose.',
      },
      {
        question: 'Quels sont les deux réactifs consommés lors de la photosynthèse ?',
        options: [
          'L’eau (H2O) et le dioxyde de carbone (CO2)',
          'Le glucose et l’oxygène',
          'L’azote et le chlore',
          'Le méthane et le fer',
        ],
        correctIndex: 0,
        explanation: 'La formule bilan requiert du CO2 capté dans l’air et de l’H2O puisé par les racines.',
      },
      {
        question: 'Quel gaz essentiel pour la vie terrestre est rejeté par la photosynthèse ?',
        options: ['Le dioxygène (O2)', 'Le monoxyde de carbone', 'L’argon', 'L’hydrogène pur'],
        correctIndex: 0,
        explanation: 'L’oxygène rejeté provient de la dissociation de l’eau dans les chloroplastes.',
      },
    ],
  },
  {
    title: 'Leçon 2 : Notions de Réactifs et Formule Chimique',
    description: 'Maîtriser les proportions de l’équation 6 CO2 + 6 H2O.',
    questions: [
      {
        question: 'Combien de molécules de CO2 sont nécessaires pour former 1 molécule de glucose C6H12O6 ?',
        options: ['6 molécules', '1 molécule', '12 molécules', '3 molécules'],
        correctIndex: 0,
        explanation: 'Il faut 6 atomes de carbone provenant de 6 molécules de CO2.',
      },
      {
        question: 'Quelle est la formule chimique brute du glucose produit ?',
        options: ['C6H12O6', 'CO2', 'C2H6O', 'C12H22O11'],
        correctIndex: 0,
        explanation: 'Le glucose est un hexose de formule moléculaire C6H12O6.',
      },
    ],
  },
  {
    title: 'Leçon 3 : La Lumière & le Rôle des Photons',
    description: 'Comprendre comment l’énergie solaire initie la réaction.',
    questions: [
      {
        question: 'Sous quelle forme l’énergie lumineuse parvient-elle aux feuilles ?',
        options: ['Sous forme de photons', 'Sous forme d’électrons libres', 'Sous forme de chaleur pure', 'Sous forme d’ondes sonores'],
        correctIndex: 0,
        explanation: 'Les photons transportent des quanta d’énergie électromagnétique captés par les pigments.',
      },
      {
        question: 'Que se passe-t-il si une feuille est placée dans l’obscurité totale ?',
        options: [
          'La photosynthèse s’arrête immédiatement',
          'Elle produit deux fois plus de sucre',
          'Elle change instantanément de couleur',
          'Elle absorbe de l’azote',
        ],
        correctIndex: 0,
        explanation: 'La photosynthèse dépend directement de l’apport en photons lumineux.',
      },
    ],
  },
  {
    title: 'Leçon 4 : Le Glucose, Carburant Vital',
    description: 'Le rôle central des glucides dans la physiologie végétale.',
    questions: [
      {
        question: 'À quoi sert le glucose immédiatement après sa synthèse ?',
        options: [
          'À fournir de l’énergie via la respiration et servir de brique de construction',
          'À repousser les insectes herbivores',
          'À attirer la pluie sur les feuilles',
          'À remplacer les racines',
        ],
        correctIndex: 0,
        explanation: 'Le glucose alimente le métabolisme cellulaire ou est polymérisé en amidon et cellulose.',
      },
    ],
  },
  {
    title: 'Leçon 5 : Le Dioxygène, Gaz Vital Rejeté',
    description: 'Origine et importance du dégagement d’O2.',
    questions: [
      {
        question: 'D’où provient exactement le dioxygène rejeté par les feuilles ?',
        options: [
          'De la molécule d’eau (H2O)',
          'Du dioxyde de carbone (CO2)',
          'Du nitrate du sol',
          'De la chlorophylle',
        ],
        correctIndex: 0,
        explanation: 'L’oxygène provient de la photolyse de l’eau (H2O -> 2 H+ + 2 e- + 1/2 O2).',
      },
    ],
  },
  {
    title: 'Leçon 6 : Autotrophie vs Hétérotrophie',
    description: 'Comprendre la place unique des végétaux dans la biosphère.',
    questions: [
      {
        question: 'Que signifie le terme "autotrophe" ?',
        options: [
          'Capable de synthétiser sa propre matière organique à partir de matière minérale',
          'Qui se nourrit exclusivement d’autres organismes vivants',
          'Qui vit sous terre sans lumière',
          'Qui n’a pas besoin d’eau',
        ],
        correctIndex: 0,
        explanation: 'Les organismes autotrophes produisent leur propre matière carbonée sans ingérer d’autres êtres vivants.',
      },
    ],
  },
  {
    title: 'Leçon 7 : Les Organes de la Plante',
    description: 'Rôles respectifs de la feuille, de la tige et des racines.',
    questions: [
      {
        question: 'Quel est l’organe principal dédié à la capture de la lumière ?',
        options: ['La feuille', 'Le tronc', 'La racine pivotante', 'Le fruit'],
        correctIndex: 0,
        explanation: 'La feuille possède une grande surface aplatie optimisée pour intercepter les photons.',
      },
    ],
  },
  {
    title: 'Leçon 8 : L’Absorption Racinaire & Sève Brute',
    description: 'Comment l’eau et les sels minéraux montent du sol.',
    questions: [
      {
        question: 'Comment s’appelle la sève contenant l’eau et les minéraux puisés dans le sol ?',
        options: ['La sève brute', 'La sève élaborée', 'Le latex', 'Le suc vacuolaire'],
        correctIndex: 0,
        explanation: 'La sève brute monte par le xylème depuis les poils absorbants des racines.',
      },
    ],
  },
  {
    title: 'Leçon 9 : La Sève Élaborée & Distribution',
    description: 'Le transport des sucres depuis les feuilles vers tous les organes.',
    questions: [
      {
        question: 'Quel tissu conducteur transporte la sève élaborée riche en sucres ?',
        options: ['Le phloème', 'Le xylème', 'L’épiderme', 'La moelle osseuse'],
        correctIndex: 0,
        explanation: 'Le phloème distribue les sucres élaborés vers les zones de croissance et les réserves.',
      },
    ],
  },
  {
    title: 'Leçon 10 : Étape 1 : Synthèse des Fondamentaux',
    description: 'Validation de l’Unité 1 et ouverture du premier Coffre de Maîtrise.',
    questions: [
      {
        question: 'La photosynthèse est qualifiée de réaction endergonique car :',
        options: [
          'Elle nécessite un apport d’énergie extérieur (la lumière)',
          'Elle produit de l’énergie spontanément',
          'Elle fonctionne à température négative',
          'Elle détruit les molécules de sucre',
        ],
        correctIndex: 0,
        explanation: 'Endergonique signifie qu’elle absorbe de l’énergie pour stocker des liaisons chimiques.',
      },
      {
        question: 'Quel est le bilan global correct ?',
        options: [
          '6 CO2 + 6 H2O + Lumière -> C6H12O6 + 6 O2',
          'C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O',
          'CO2 + O2 -> Glucose + Eau',
          '6 H2O + 6 O2 -> Glucose + CO2',
        ],
        correctIndex: 0,
        explanation: 'Cette équation chimique résume la conversion photosynthétique globale.',
      },
    ],
  },

  // --- UNITÉ 2 (11 à 20) ---
  {
    title: 'Leçon 11 : Le Tissu Foliaire & Mésophylle',
    description: 'Découvrir la structure interne d’une coupe de feuille.',
    questions: [
      {
        question: 'Quelle partie de la feuille contient la plus forte densité de chloroplastes ?',
        options: ['Le mésophylle palissadique', 'L’épiderme supérieur', 'La cuticule cireuse', 'Les nervures'],
        correctIndex: 0,
        explanation: 'Les cellules allongées du parenchyme palissadique sont gorgées de chloroplastes.',
      },
    ],
  },
  {
    title: 'Leçon 12 : L’Usine Cellulaire : Le Chloroplaste',
    description: 'Zoom sur l’organite spécialisé de la photosynthèse.',
    questions: [
      {
        question: 'Dans quel domaine cellulaire se trouve le chloroplaste ?',
        options: ['Chez les eucaryotes végétaux', 'Chez tous les animaux', 'Chez les champignons uniquement', 'Dans les virus'],
        correctIndex: 0,
        explanation: 'Le chloroplaste est un organite exclusif des cellules végétales et de certaines algues.',
      },
    ],
  },
  {
    title: 'Leçon 13 : La Double Membrane Plastidiale',
    description: 'Comprendre l’origine endosymbiotique du chloroplaste.',
    questions: [
      {
        question: 'Combien de membranes enveloppent un chloroplaste végétal ?',
        options: ['Deux membranes (interne et externe)', 'Une seule membrane simple', 'Quatre parois rigides', 'Aucune membrane'],
        correctIndex: 0,
        explanation: 'Cette double membrane témoigne de l’endosymbiose d’une ancienne cyanobactérie.',
      },
    ],
  },
  {
    title: 'Leçon 14 : Les Thylakoïdes & Grana',
    description: 'Les disques membranaires empilés où siège la chlorophylle.',
    questions: [
      {
        question: 'Comment nomme-t-on un empilement de thylakoïdes ?',
        options: ['Un granum (des grana)', 'Un centrosome', 'Un lysosome', 'Un ribosome'],
        correctIndex: 0,
        explanation: 'Les grana maximisent la surface de membrane disponible pour capter les photons.',
      },
    ],
  },
  {
    title: 'Leçon 15 : Le Stroma & Milieu Réactionnel',
    description: 'Le fluide liquide interne entourant les thylakoïdes.',
    questions: [
      {
        question: 'Que trouve-t-on en abondance dissous dans le stroma du chloroplaste ?',
        options: [
          'Des enzymes solubles dont la Rubisco, des ribosomes et de l’ADN plastidial',
          'De l’acide gastrique',
          'Des globules rouges',
          'Du pétrole brut',
        ],
        correctIndex: 0,
        explanation: 'Le stroma contient toute la machinerie enzymatique pour le cycle de Calvin.',
      },
    ],
  },
  {
    title: 'Leçon 16 : Les Stomates & Ostioles',
    description: 'Les vannes d’aération situées sous la feuille.',
    questions: [
      {
        question: 'Quelle est la fonction essentielle des stomates ?',
        options: [
          'Permettre l’entrée du CO2 et réguler l’évapotranspiration',
          'Capturer les insectes volants',
          'Filtrer la lumière ultraviolette',
          'Secréter du parfum',
        ],
        correctIndex: 0,
        explanation: 'Les stomates sont des pores ajustables régulant les flux de gaz et de vapeur d’eau.',
      },
    ],
  },
  {
    title: 'Leçon 17 : Mécanisme d’Ouverture des Stomates',
    description: 'Rôle du potassium (K+) et de la pression de turgescence.',
    questions: [
      {
        question: 'Qu’est-ce qui provoque l’ouverture de l’ostiole du stomate ?',
        options: [
          'L’entrée d’ions K+ provoquant un afflux d’eau et la turgescence des cellules de garde',
          'Le dessèchement complet de la feuille',
          'L’absence totale de lumière',
          'Le froid polaire',
        ],
        correctIndex: 0,
        explanation: 'Quand les cellules de garde gonflent sous la pression d’eau, leur courbure ouvre l’ostiole.',
      },
    ],
  },
  {
    title: 'Leçon 18 : La Cuticule & Protection Foliaire',
    description: 'La couche cireuse hydrophobe limitant les pertes d’eau.',
    questions: [
      {
        question: 'De quelle substance cireuse est composée la cuticule protectrice ?',
        options: ['La cutine', 'La kératine', 'Le collagène', 'L’hémoglobine'],
        correctIndex: 0,
        explanation: 'La cutine forme un film imperméable limitant l’évaporation incontrôlée.',
      },
    ],
  },
  {
    title: 'Leçon 19 : Cellule Animale vs Cellule Végétale',
    description: 'Différencier les organites et organigrammes cellulaires.',
    questions: [
      {
        question: 'Lequel de ces éléments est présent chez la cellule végétale mais absent chez la cellule animale ?',
        options: ['La paroi pectocellulosique et les chloroplastes', 'Le noyau', 'Les mitochondries', 'La membrane plasmique'],
        correctIndex: 0,
        explanation: 'La paroi rigide et les chloroplastes sont caractéristiques du règne végétal.',
      },
    ],
  },
  {
    title: 'Leçon 20 : Étape 2 : Maîtrise Cellulaire',
    description: 'Validation de l’Unité 2 et ouverture du Coffre d’Étape 2.',
    questions: [
      {
        question: 'Si on détruit les membranes des thylakoïdes tout en préservant le stroma :',
        options: [
          'La phase photochimique ne peut plus se dérouler faute de gradient de protons',
          'La plante produit encore plus d’oxygène',
          'Le cycle de Calvin s’accélère',
          'Les stomates s’ouvrent en permanence',
        ],
        correctIndex: 0,
        explanation: 'L’intégrité membranaire des thylakoïdes est requise pour créer le gradient électrochimique.',
      },
    ],
  },

  // --- UNITÉ 3 (21 à 30) ---
  {
    title: 'Leçon 21 : La Chlorophylle A et B',
    description: 'Les pigments verts maîtres de la photosynthèse.',
    questions: [
      {
        question: 'Quelle est la différence structurelle majeure entre chlorophylle a et b ?',
        options: [
          'Un groupement méthyle (-CH3) sur la chlorophylle a contre un groupement formyle (-CHO) sur la b',
          'L’absence totale de carbone dans la b',
          'La couleur rouge vif de la b',
          'Le poids atomique divisé par deux',
        ],
        correctIndex: 0,
        explanation: 'Cette légère modification décale leur spectre d’absorption lumineuse.',
      },
    ],
  },
  {
    title: 'Leçon 22 : Le Magnésium au Cœur de la Molécule',
    description: 'L’atome métallique central chélaté dans l’hème.',
    questions: [
      {
        question: 'Quel oligo-élément métallique se trouve au centre de l’anneau porphyrine de la chlorophylle ?',
        options: ['Le Magnésium (Mg2+)', 'Le Fer (Fe2+)', 'Le Cuivre (Cu2+)', 'Le Zinc (Zn2+)'],
        correctIndex: 0,
        explanation: 'Le magnésium confère à la chlorophylle ses propriétés de résonance électronique.',
      },
    ],
  },
  {
    title: 'Leçon 23 : Les Pigments Accessoires',
    description: 'Caroténoïdes, xanthophylles et protection contre l’excès de lumière.',
    questions: [
      {
        question: 'Quel est le double rôle des caroténoïdes ?',
        options: [
          'Élargir le spectre d’absorption et protéger contre la photo-oxydation',
          'Fabriquer des fleurs bleues',
          'Absorber l’oxygène toxique',
          'Attirer les vers de terre',
        ],
        correctIndex: 0,
        explanation: 'Ils dissipent l’excès d’énergie lumineuse nocive et collectent des longueurs d’onde complémentaires.',
      },
    ],
  },
  {
    title: 'Leçon 24 : Le Spectre d’Absorption Lumineuse',
    description: 'Quelles longueurs d’onde sont réellement utilisées par les feuilles ?',
    questions: [
      {
        question: 'Quelles couleurs du spectre visible sont le plus fortement absorbées par la chlorophylle ?',
        options: ['Le bleu (430 nm) et le rouge (660 nm)', 'Le vert pur uniquement', 'Le jaune et l’orange uniquement', 'Les rayons X'],
        correctIndex: 0,
        explanation: 'La chlorophylle a deux pics d’absorption majeurs dans le bleu et le rouge.',
      },
    ],
  },
  {
    title: 'Leçon 25 : Pourquoi les Feuilles Sont-elles Vertes ?',
    description: 'Comprendre la réflexion de la lumière non absorbée.',
    questions: [
      {
        question: 'Pourquoi voyons-nous les feuilles vertes ?',
        options: [
          'Parce que la chlorophylle n’absorbe pas le vert et le diffuse vers nos yeux',
          'Parce que le vert est la couleur la plus énergétique',
          'Parce que la feuille émet sa propre lumière laser verte',
          'À cause du reflet de l’herbe sur le sol',
        ],
        correctIndex: 0,
        explanation: 'La fraction verte du spectre n’étant pas retenue, elle est réfléchie et parvient à notre œil.',
      },
    ],
  },
  {
    title: 'Leçon 26 : Les Couleurs d’Automne',
    description: 'Dégradation de la chlorophylle et révélation des pigments chauds.',
    questions: [
      {
        question: 'Pourquoi les feuilles des arbres jaunissent-elles ou rougissent-elles en automne ?',
        options: [
          'La chlorophylle est dégradée et recyclée, révélant les caroténoïdes et anthocyanes',
          'La plante injecte de la peinture dans les feuilles',
          'Le froid fait geler le carbone',
          'Les racines meurent en automne',
        ],
        correctIndex: 0,
        explanation: 'Avant de perdre ses feuilles, l’arbre rapatrie le magnésium et l’azote, masquant le vert.',
      },
    ],
  },
  {
    title: 'Leçon 27 : L’Excitation des Électrons par un Photon',
    description: 'Transition énergétique et état excité de la molécule.',
    questions: [
      {
        question: 'Lorsqu’un photon frappe une molécule de chlorophylle :',
        options: [
          'Un électron saute vers une orbitale d’énergie supérieure (état excité)',
          'La molécule se brise en atomes libres',
          'La feuille se réchauffe de 50 degrés',
          'L’atome de magnésium est éjecté',
        ],
        correctIndex: 0,
        explanation: 'L’énergie lumineuse est emmagasinée par excitation électronique transitoire.',
      },
    ],
  },
  {
    title: 'Leçon 28 : Les Photosystèmes I et II',
    description: 'Les super-complexes protéiques intégrés dans les thylakoïdes.',
    questions: [
      {
        question: 'Quel photosystème intervient le premier dans la chaîne acyclique ?',
        options: ['Le Photosystème II (P680)', 'Le Photosystème I (P700)', 'Le Photosystème Z', 'La Rubisco'],
        correctIndex: 0,
        explanation: 'Bien que nommé II pour des raisons historiques de découverte, il intervient en premier.',
      },
    ],
  },
  {
    title: 'Leçon 29 : Le Centre Réactionnel & Antenne Collectrice',
    description: 'Transmission de l’énergie par résonance de Forster (FRET).',
    questions: [
      {
        question: 'Quel est le rôle de l’antenne collectrice d’un photosystème ?',
        options: [
          'Capter les photons et transmettre l’énergie d’excitation vers la paire spéciale du centre réactionnel',
          'Recevoir les signaux radio',
          'Protéger la feuille de la grêle',
          'Attirer les pollinisateurs',
        ],
        correctIndex: 0,
        explanation: 'Des centaines de molécules de pigments canalisent l’énergie lumineuse vers le cœur réactionnel.',
      },
    ],
  },
  {
    title: 'Leçon 30 : Étape 3 : Maîtrise des Pigments',
    description: 'Validation de l’Unité 3 et ouverture du Coffre d’Étape 3.',
    questions: [
      {
        question: 'Une plante éclairée uniquement par une lumière verte pure :',
        options: [
          'Aura un taux de photosynthèse quasi nul car le vert est très peu absorbé',
          'Poussera deux fois plus vite',
          'Produira des fleurs géantes',
          'Consommera tout son azote',
        ],
        correctIndex: 0,
        explanation: 'Sans absorption de photons bleus ou rouges, l’énergie transmise est insuffisante.',
      },
    ],
  },

  // --- UNITÉ 4 (31 à 40) ---
  {
    title: 'Leçon 31 : Vue d’Ensemble de la Phase Claire',
    description: 'Transformation de l’énergie lumineuse en énergie chimique (ATP & NADPH).',
    questions: [
      {
        question: 'Où se déroulent les réactions de la phase photochimique ?',
        options: ['Dans la membrane des thylakoïdes', 'Dans le cytosol de la cellule', 'Dans les mitochondries', 'Dans la vacuole'],
        correctIndex: 0,
        explanation: 'Les photosystèmes et chaînes transporteuses sont ancrés dans la membrane thylakoïdienne.',
      },
    ],
  },
  {
    title: 'Leçon 32 : La Photolyse de l’Eau',
    description: 'Casser H2O pour fournir des électrons au PSII.',
    questions: [
      {
        question: 'Quel complexe enzymatique catalyse la photolyse de l’eau au niveau du PSII ?',
        options: ['Le complexe de dégagement d’oxygène (OEC à manganèse)', 'L’ADN polymérase', 'La catalase', 'L’amylase'],
        correctIndex: 0,
        explanation: 'Le cluster de 4 atomes de manganèse oxyde l’eau en extrayant 4 électrons.',
      },
    ],
  },
  {
    title: 'Leçon 33 : La Chaîne de Transporteurs d’Électrons',
    description: 'Plastoquinone, cytochrome b6f et plastocyanine.',
    questions: [
      {
        question: 'Comment les électrons se déplacent-ils le long de la chaîne ?',
        options: [
          'Par cascades redox successives de potentiels croissants',
          'Par téléportation quantique sans transporteur',
          'Par gravitation universelle',
          'Par diffusion passive dans l’air',
        ],
        correctIndex: 0,
        explanation: 'Chaque transporteur intermédiaire a une affinité électronique ajustée pour favoriser le flux.',
      },
    ],
  },
  {
    title: 'Leçon 34 : Le Gradient de Protons Transmembranaire',
    description: 'L’accumulation de protons H+ dans le lumen.',
    questions: [
      {
        question: 'Où les protons (H+) s’accumulent-ils créant un pH très acide ?',
        options: ['À l’intérieur du lumen thylakoïdien', 'Dans le stroma extérieur', 'Dans le cytoplasme', 'Dans la vacuole'],
        correctIndex: 0,
        explanation: 'Le pompage de protons vers le lumen génère une force proton-motrice colossale.',
      },
    ],
  },
  {
    title: 'Leçon 35 : L’ATP Synthase & Moteur Rotatif',
    description: 'Le nanorotor biologique qui fabrique l’ATP.',
    questions: [
      {
        question: 'Quelle force anime la rotation de l’ATP synthase ?',
        options: ['Le reflux des protons H+ du lumen vers le stroma', 'L’électricité statique', 'La lumière directe', 'La gravité'],
        correctIndex: 0,
        explanation: 'Le passage des protons à travers le canal F0 fait tourner la sous-unité catalytique F1.',
      },
    ],
  },
  {
    title: 'Leçon 36 : La Production d’ATP',
    description: 'La liaison phosphate riche en énergie (ADP + Pi -> ATP).',
    questions: [
      {
        question: 'Que signifie l’acronyme ATP ?',
        options: ['Adénosine Triphosphate', 'Acide Tétra-Phosphorique', 'Amidon Total Purifié', 'Agent de Transport Plastique'],
        correctIndex: 0,
        explanation: 'L’ATP est la monnaie énergétique universelle de toute cellule vivante.',
      },
    ],
  },
  {
    title: 'Leçon 37 : La Réduction du NADP+ en NADPH',
    description: 'Le stockage du pouvoir réducteur pour la phase sombre.',
    questions: [
      {
        question: 'Quelle enzyme terminale transfère les électrons au NADP+ ?',
        options: ['La Ferrédoxine-NADP+ Réductase (FNR)', 'L’hélicase', 'La phosphatase acide', 'La lipase'],
        correctIndex: 0,
        explanation: 'La FNR produit du NADPH, indispensable aux réductions chimiques du cycle de Calvin.',
      },
    ],
  },
  {
    title: 'Leçon 38 : Photophosphorylation Cyclique vs Non-Cyclique',
    description: 'Ajuster le ratio ATP / NADPH selon les besoins cellulaires.',
    questions: [
      {
        question: 'En mode cyclique, que produit la chaîne d’électrons ?',
        options: ['Uniquement de l’ATP (sans NADPH ni dégagement d’O2)', 'Uniquement du CO2', 'De l’oxygène pur sans sucre', 'Du glucose direct'],
        correctIndex: 0,
        explanation: 'Les électrons de la ferrédoxine retournent au cytochrome b6f pour fabriquer un surplus d’ATP.',
      },
    ],
  },
  {
    title: 'Leçon 39 : Bilan Énergétique de la Phase Claire',
    description: 'Comptabiliser les photons, ATP et NADPH produits.',
    questions: [
      {
        question: 'Quel est le résultat net de la phase photochimique ?',
        options: [
          'De l’ATP, du NADPH et du dioxygène (O2)',
          'Du glucose et de l’eau',
          'Du CO2 et de la chaleur',
          'Des lipides et du calcium',
        ],
        correctIndex: 0,
        explanation: 'L’énergie solaire est désormais immobilisée sous forme d’ATP et de NADPH.',
      },
    ],
  },
  {
    title: 'Leçon 40 : Étape 4 : Maîtrise de la Phase Claire',
    description: 'Validation de l’Unité 4 et ouverture du Coffre d’Étape 4.',
    questions: [
      {
        question: 'Un inhibiteur bloquant le transfert d’électrons entre le PSII et la plastoquinone entraînera :',
        options: [
          'L’arrêt immédiat de la synthèse d’ATP et du dégagement d’O2',
          'Une accélération de la synthèse de glucose',
          'Une coloration violette des feuilles',
          'Une ouverture forcée des stomates',
        ],
        correctIndex: 0,
        explanation: 'C’est le mécanisme d’action de certains herbicides comme le DCMU.',
      },
    ],
  },

  // --- UNITÉ 5 (41 à 50) ---
  {
    title: 'Leçon 41 : Entrée dans la Phase Sombre (Cycle de Calvin)',
    description: 'L’assimilation du carbone minéral en carbone organique.',
    questions: [
      {
        question: 'Pourquoi appelait-on autrefois cette phase la "phase sombre" ?',
        options: [
          'Car elle ne requiert pas directement de lumière incidente, bien qu’elle se passe le jour',
          'Car elle ne se produit qu’à minuit pile',
          'Car les feuilles deviennent noires',
          'Car elle détruit la lumière',
        ],
        correctIndex: 0,
        explanation: 'Elle utilise l’ATP et le NADPH générés le jour pour réduire le CO2.',
      },
    ],
  },
  {
    title: 'Leçon 42 : Le Stroma, Théâtre du Cycle',
    description: 'Le compartiment soluble où opèrent les enzymes de synthèse.',
    questions: [
      {
        question: 'Où se situe physiquement le cycle de Calvin dans la cellule ?',
        options: ['Dans le stroma du chloroplaste', 'Dans les crêtes mitochondriales', 'Dans le réticulum endoplasmique', 'Dans la membrane plasmique'],
        correctIndex: 0,
        explanation: 'Toutes les enzymes solubles du cycle de Calvin nagent dans le stroma.',
      },
    ],
  },
  {
    title: 'Leçon 43 : Le Ribulose 1,5-bisphosphate (RuBP)',
    description: 'La molécule accepteuse à 5 carbones.',
    questions: [
      {
        question: 'Combien d’atomes de carbone possède la molécule de RuBP ?',
        options: ['5 atomes de carbone', '3 atomes', '6 atomes', '2 atomes'],
        correctIndex: 0,
        explanation: 'Le RuBP est un pentose biphosphorylé qui capture une molécule de CO2 à 1 carbone.',
      },
    ],
  },
  {
    title: 'Leçon 44 : La Rubisco, Reine des Enzymes',
    description: 'L’enzyme la plus abondante de la planète Terre.',
    questions: [
      {
        question: 'Quel est le nom complet de l’enzyme Rubisco ?',
        options: [
          'Ribulose-1,5-bisphosphate carboxylase/oxygénase',
          'RNA Universal Biopolymer Synthesis Complex',
          'Régulateur Universel de Biosynthèse Cellulaire',
          'Réductase d’Urée Bactérienne et Isomérase',
        ],
        correctIndex: 0,
        explanation: 'Elle représente jusqu’à 50% des protéines solubles d’une feuille verte !',
      },
    ],
  },
  {
    title: 'Leçon 45 : Fixation du Carbone & Formation du 3-PGA',
    description: 'L’étape de carboxylation initiale.',
    questions: [
      {
        question: 'La fixation d’un CO2 sur un RuBP donne un intermédiaire instable qui se scinde en :',
        options: ['Deux molécules de 3-phosphoglycérate (3-PGA à 3 carbones)', 'Une molécule de cholestérol', 'Deux molécules d’eau', 'Trois acides gras'],
        correctIndex: 0,
        explanation: '1 pentose (5C) + 1 CO2 (1C) = 6C instables se scindant en 2 x 3C (3-PGA).',
      },
    ],
  },
  {
    title: 'Leçon 46 : Réduction du 3-PGA en G3P',
    description: 'Consommation d’ATP et de NADPH pour former des trioses phosphates.',
    questions: [
      {
        question: 'Que nécessite la réduction du 3-PGA en glycéraldéhyde-3-phosphate (G3P) ?',
        options: ['De l’ATP et du NADPH', 'De l’oxygène pur', 'De l’acide sulfurique', 'De l’azote liquide'],
        correctIndex: 0,
        explanation: 'C’est ici que l’énergie issue de la phase claire est injectée dans le squelette carboné.',
      },
    ],
  },
  {
    title: 'Leçon 47 : Régénération du RuBP',
    description: 'Fermer le cycle pour perpétuer la fixation du carbone.',
    questions: [
      {
        question: 'Sur 6 molécules de G3P formées, combien sont recyclées pour régénérer le RuBP ?',
        options: ['5 molécules sont recyclées (seule 1 sert à fabriquer des sucres)', 'Toutes les 6 sont détruites', 'Aucune, tout devient glucose', 'Une seule'],
        correctIndex: 0,
        explanation: 'Il faut régénérer les molécules accepteuses de départ pour maintenir le cycle en marche.',
      },
    ],
  },
  {
    title: 'Leçon 48 : Synthèse du Glucose et Fructose',
    description: 'L’assemblage des hexoses à partir des trioses exportés.',
    questions: [
      {
        question: 'Combien de tours de cycle de Calvin sont nécessaires pour synthétiser 1 molécule de glucose ?',
        options: ['6 tours (fixant 6 molécules de CO2)', '1 seul tour', '100 tours', '2 tours'],
        correctIndex: 0,
        explanation: 'Chaque tour fixant 1 carbone, 6 tours sont indispensables pour constituer les 6 carbones du glucose.',
      },
    ],
  },
  {
    title: 'Leçon 49 : La Photorespiration & Fuite d’Énergie',
    description: 'Quand la Rubisco fixe l’oxygène au lieu du CO2.',
    questions: [
      {
        question: 'Que se passe-t-il lorsque la Rubisco fixe de l’O2 au lieu de CO2 ?',
        options: [
          'La photorespiration se déclenche, gaspillant de l’énergie et réduisant le rendement',
          'La plante double sa taille',
          'Le cycle devient 100% plus efficace',
          'Du bois se forme instantanément',
        ],
        correctIndex: 0,
        explanation: 'L’activité oxygénase de la Rubisco est une imperfection évolutive coûteuse pour la plante.',
      },
    ],
  },
  {
    title: 'Leçon 50 : Étape 5 : Maîtrise du Cycle de Calvin',
    description: 'Validation de l’Unité 5 et ouverture du Coffre d’Étape 5 (Mi-Parcours).',
    questions: [
      {
        question: 'Quel est le bilan global de consommation pour synthétiser 1 mole de glucose ?',
        options: [
          '6 CO2 + 18 ATP + 12 NADPH',
          '1 CO2 + 2 ATP + 1 NADPH',
          '100 CO2 + 10 ATP',
          '6 O2 + 18 H2O',
        ],
        correctIndex: 0,
        explanation: 'Ce bilan quantitatif rigoureux illustre le coût énergétique de la synthèse carbonée.',
      },
    ],
  },

  // --- UNITÉ 6 (51 à 60) ---
  {
    title: 'Leçon 51 : Devenir des Sucres : L’Amidon de Réserve',
    description: 'Polymérisation du glucose pour un stockage à long terme.',
    questions: [
      {
        question: 'Pourquoi la plante stocke-t-elle le glucose sous forme d’amidon insoluble ?',
        options: [
          'Pour éviter d’augmenter la pression osmotique interne de la cellule',
          'Pour alourdir la feuille',
          'Pour attirer les fourmis',
          'Parce que le glucose pur est toxique au toucher',
        ],
        correctIndex: 0,
        explanation: 'Des milliers de molécules de glucose libres attireraient trop d’eau par osmose.',
      },
    ],
  },
  {
    title: 'Leçon 52 : La Cellulose & Charpente Pariétale',
    description: 'Le polymère structural le plus abondant sur notre planète.',
    questions: [
      {
        question: 'Quelle est la fonction majeure de la cellulose chez les plantes ?',
        options: ['Former la paroi rigide assurant le maintien mécanique de la cellule', 'Stocker les graisses', 'Attirer la foudre', 'Servir d’antigel'],
        correctIndex: 0,
        explanation: 'Les microfibrilles de cellulose confèrent aux végétaux leur port dressé et leur solidité.',
      },
    ],
  },
  {
    title: 'Leçon 53 : Synthèse des Acides Aminés & Protéines',
    description: 'Intégration de l’azote du sol aux squelettes carbonés.',
    questions: [
      {
        question: 'Quel élément minéral doit être combiné aux sucres pour fabriquer des acides aminés ?',
        options: ['L’Azote (sous forme de nitrates NO3- ou ammonium NH4+)', 'L’Or pur', 'Le Chlore gazeux', 'Le Plomb'],
        correctIndex: 0,
        explanation: 'L’assimilation de l’azote permet de transformer les métabolites du cycle en protéines.',
      },
    ],
  },
  {
    title: 'Leçon 54 : Synthèse des Lipides & Huiles Végétales',
    description: 'Conversion des glucides en triglycérides énergétiques.',
    questions: [
      {
        question: 'Dans quelles parties de la plante trouve-t-on le plus de réserves lipidiques ?',
        options: ['Dans les graines oléagineuses (colza, tournesol, olive)', 'Dans les racines profondes', 'Dans les épines de cactus', 'Dans l’écorce sèche'],
        correctIndex: 0,
        explanation: 'Les lipides fournissent une densité énergétique maximale pour l’embryon de la graine.',
      },
    ],
  },
  {
    title: 'Leçon 55 : Métabolites Secondaires & Défense',
    description: 'Tanins, alcaloïdes et pigments floraux.',
    questions: [
      {
        question: 'À quoi servent les métabolites secondaires comme les tanins ?',
        options: [
          'À décourager les herbivores et se protéger contre les bactéries et champignons',
          'À accélérer la chute de la neige',
          'À remplacer la sève en été',
          'À absorber les ondes radio',
        ],
        correctIndex: 0,
        explanation: 'Ces molécules confèrent aux plantes un arsenal de défense chimique sophistiqué.',
      },
    ],
  },
  {
    title: 'Leçon 56 : Organes de Réserve Spécialisés',
    description: 'Tubercules, bulbes, rhizomes et graines.',
    questions: [
      {
        question: 'Lequel de ces aliments est un organe de réserve souterrain riche en amidon ?',
        options: ['La pomme de terre (tubercule)', 'La feuille de salade', 'Le brin de persil', 'La fleur de pissenlit'],
        correctIndex: 0,
        explanation: 'Le tubercule de pomme de terre stocke d’immenses quantités de grains d’amidon (amyloplastes).',
      },
    ],
  },
  {
    title: 'Leçon 57 : La Respiration Cellulaire des Plantes',
    description: 'Rappelez-vous : les plantes respirent aussi 24h sur 24 !',
    questions: [
      {
        question: 'Les plantes respirent-elles comme les animaux ?',
        options: [
          'Oui, elles consomment de l’O2 et rejettent du CO2 via leurs mitochondries jour et nuit',
          'Non, elles ne respirent jamais',
          'Seulement en hiver quand il fait zéro degré',
          'Uniquement les plantes carnivores',
        ],
        correctIndex: 0,
        explanation: 'La respiration mitochondriale dégrade le glucose pour fournir de l’ATP à toutes les cellules.',
      },
    ],
  },
  {
    title: 'Leçon 58 : Bilan Net Journalier',
    description: 'Pourquoi la photosynthèse domine largement la respiration le jour.',
    questions: [
      {
        question: 'Sur une journée de 24h normale en été, le bilan gazeux d’une plante est :',
        options: [
          'Largement net producteur d’O2 et consommateur de CO2',
          'Neutre à zéro',
          'Déficitaire en oxygène',
          'Exclusivement producteur de méthane',
        ],
        correctIndex: 0,
        explanation: 'En journée ensoleillée, la photosynthèse est 10 à 20 fois plus rapide que la respiration.',
      },
    ],
  },
  {
    title: 'Leçon 59 : Le Point de Compensation Lumineuse',
    description: 'L’équilibre exact entre photosynthèse et respiration.',
    questions: [
      {
        question: 'Qu’est-ce que le point de compensation lumineuse ?',
        options: [
          'L’intensité lumineuse où la production d’O2 compense exactement sa consommation par la respiration',
          'Le moment où la plante s’endort',
          'L’instant où le soleil se couche',
          'La température maximale supportée par la feuille',
        ],
        correctIndex: 0,
        explanation: 'En dessous de ce seuil d’éclairement, la plante perd de la biomasse.',
      },
    ],
  },
  {
    title: 'Leçon 60 : Étape 6 : Maîtrise des Réserves',
    description: 'Validation de l’Unité 6 et ouverture du Coffre d’Étape 6.',
    questions: [
      {
        question: 'Un arbre centenaire en hiver qui a perdu toutes ses feuilles :',
        options: [
          'Survit en puisant dans ses réserves d’amidon stockées dans le tronc et les racines',
          'Continue à faire de la photosynthèse invisible',
          'Est cliniquement mort',
          'Absorbe du glucose par son écorce',
        ],
        correctIndex: 0,
        explanation: 'Les réserves accumulées durant l’été maintiennent le métabolisme de base en dormance.',
      },
    ],
  },

  // --- UNITÉ 7 (61 à 70) ---
  {
    title: 'Leçon 61 : Qu’est-ce qu’un Facteur Limitant ?',
    description: 'La loi du minimum de Liebig appliquée à la photosynthèse.',
    questions: [
      {
        question: 'Selon la loi du facteur limitant de Blackman :',
        options: [
          'La vitesse du processus est bornée par le facteur environnemental le plus défavorable',
          'Le facteur le plus abondant détermine tout',
          'Tous les facteurs ont toujours le même poids',
          'La photosynthèse ne dépend d’aucun paramètre externe',
        ],
        correctIndex: 0,
        explanation: 'Si le CO2 manque, augmenter l’éclairage ne servira à rien : le CO2 est le facteur limitant.',
      },
    ],
  },
  {
    title: 'Leçon 62 : L’Influence de l’Intensité Lumineuse',
    description: 'Point de saturation lumineuse et photo-inhibition.',
    questions: [
      {
        question: 'Que se passe-t-il au-delà du point de saturation lumineuse ?',
        options: [
          'La vitesse plafonne, et un excès peut même provoquer de la photo-inhibition par stress oxydatif',
          'La plante explose',
          'La vitesse augmente jusqu’à l’infini',
          'Les feuilles deviennent blanches en une seconde',
        ],
        correctIndex: 0,
        explanation: 'Les centres réactionnels étant tous saturés, l’énergie excédentaire génère des dérivés réactifs d’oxygène.',
      },
    ],
  },
  {
    title: 'Leçon 63 : L’Effet de la Concentration en CO2',
    description: 'Comprendre pourquoi le CO2 atmosphérique actuel limite souvent les plantes C3.',
    questions: [
      {
        question: 'Si on double la concentration de CO2 dans une serre fermée bien éclairée :',
        options: [
          'Le rendement photosynthétique des plantes C3 augmente sensiblement',
          'Les plantes meurent étouffées',
          'La photosynthèse s’arrête',
          'La serre devient invivable pour les végétaux',
        ],
        correctIndex: 0,
        explanation: 'C’est le principe de la fertilisation carbonée employée en maraîchage sous serre.',
      },
    ],
  },
  {
    title: 'Leçon 64 : L’Impact de la Température sur les Enzymes',
    description: 'Optimum thermique et dénaturation des protéines.',
    questions: [
      {
        question: 'Pourquoi la photosynthèse s’effondre-t-elle au-delà de 45°C pour la plupart des plantes tempérées ?',
        options: [
          'Les enzymes comme la Rubisco se dénaturent et perdent leur conformation tertiaire active',
          'L’eau se transforme instantanément en glace',
          'Les photons perdent leur énergie',
          'Les parois végétales fondent',
        ],
        correctIndex: 0,
        explanation: 'Comme toute protéine, les enzymes photosynthétiques ont un optimum thermique (20-30°C).',
      },
    ],
  },
  {
    title: 'Leçon 65 : Le Stress Hydrique & Fermeture des Stomates',
    description: 'Le dilemme vital : garder l’eau ou faire entrer le CO2 ?',
    questions: [
      {
        question: 'En période de sécheresse sévère, l’acide abscissique (ABA) commande :',
        options: [
          'La fermeture des stomates pour limiter la transpiration, bloquant l’entrée du CO2',
          'L’ouverture maximale des stomates',
          'La floraison immédiate',
          'La perte immédiate des racines',
        ],
        correctIndex: 0,
        explanation: 'Pour éviter de mourir de soif, la plante ferme ses stomates au détriment de sa photosynthèse.',
      },
    ],
  },
  {
    title: 'Leçon 66 : L’Optimisation en Serre Maraîchère',
    description: 'Contrôle agronomique des 3 facteurs clés.',
    questions: [
      {
        question: 'Quels sont les 3 paramètres ajustés dans une serre de haute technologie ?',
        options: ['Lumière (LEDs), température et enrichissement en CO2', 'Couleur des pots, musique et parfum', 'Pression atmosphérique et azote pur', 'Chlore et sel de mer'],
        correctIndex: 0,
        explanation: 'Le contrôle synergique de ces 3 paramètres élimine les facteurs limitants.',
      },
    ],
  },
  {
    title: 'Leçon 67 : L’Éclairage Artificiel Horticole',
    description: 'Spectres horticoles optimisés (Spectre rouge + bleu).',
    questions: [
      {
        question: 'Pourquoi les lampes horticoles modernes émettent-elles souvent une lumière rose-violette ?',
        options: [
          'Elles combinent des LED bleues et rouges, correspondant précisément aux deux pics d’absorption de la chlorophylle',
          'Pour faire joli dans la serre',
          'Parce que le rose effraie les rongeurs',
          'Car les LED vertes sont interdites par la loi',
        ],
        correctIndex: 0,
        explanation: 'Cela évite de gaspiller de l’énergie électrique dans des longueurs d’onde non exploitées.',
      },
    ],
  },
  {
    title: 'Leçon 68 : La Nutrition Minérale (NPK)',
    description: 'Azote, Phosphore et Potassium dans le métabolisme.',
    questions: [
      {
        question: 'Pourquoi le phosphore (P) est-il indispensable à la photosynthèse ?',
        options: [
          'Il est un composant structurel de l’ATP, du NADPH et des sucres phosphorylés (RuBP, 3-PGA)',
          'Il colore les fleurs en rouge',
          'Il protège des champignons',
          'Il donne le goût sucré aux fruits',
        ],
        correctIndex: 0,
        explanation: 'Sans phosphore, la phosphorylation de l’ADP en ATP est impossible.',
      },
    ],
  },
  {
    title: 'Leçon 69 : La Salinité & Métabolisme Osmo-Régulateur',
    description: 'Comment les halophytes tolèrent le sel marin.',
    questions: [
      {
        question: 'Comment les plantes halophytes (plantes de marais salants) maintiennent-elles leur turgescence ?',
        options: [
          'En accumulant des solutés compatibles (proline, bétaïne) pour compenser le potentiel osmotique externe',
          'En buvant uniquement de l’huile',
          'En expulsant toute leur eau',
          'En fermant leurs racines',
        ],
        correctIndex: 0,
        explanation: 'Cette régulation osmotique permet aux racines de continuer à puiser de l’eau salée.',
      },
    ],
  },
  {
    title: 'Leçon 70 : Étape 7 : Maîtrise Agronomique',
    description: 'Validation de l’Unité 7 et ouverture du Coffre d’Étape 7.',
    questions: [
      {
        question: 'Une plante de plein soleil placée à l’ombre profonde d’un sous-bois :',
        options: [
          'Ne produit pas assez d’ATP pour compenser sa respiration basale et dépérit',
          'Adapte instantanément sa chlorophylle en 5 minutes',
          'Devient carnivore',
          'Se met à respirer de l’azote',
        ],
        correctIndex: 0,
        explanation: 'Elle se situe en dessous de son point de compensation lumineuse spécifique.',
      },
    ],
  },

  // --- UNITÉ 8 (71 à 80) ---
  {
    title: 'Leçon 71 : Les Plantes C3 (Blé, Riz, Soja)',
    description: 'La voie ancestrale majoritaire mais vulnérable à la chaleur.',
    questions: [
      {
        question: 'Quel pourcentage des espèces végétales terrestres utilise la voie C3 ?',
        options: ['Environ 85% à 90% des espèces', 'Moins de 5%', 'Uniquement les arbres fruitiers', '100% de la Terre'],
        correctIndex: 0,
        explanation: 'La grande majorité des végétaux (dont la plupart des arbres) est de type C3.',
      },
    ],
  },
  {
    title: 'Leçon 72 : Le Piège de la Photorespiration en Climat Chaud',
    description: 'Pourquoi la Rubisco se trompe davantage avec la température.',
    questions: [
      {
        question: 'Pourquoi la photorespiration augmente-t-elle fortement quand la température monte ?',
        options: [
          'La solubilité du CO2 dans l’eau diminue plus vite que celle de l’O2, favorisant l’activité oxygénase',
          'La plante produit du feu',
          'L’oxygène disparaît de l’air',
          'Les chloroplastes changent de place',
        ],
        correctIndex: 0,
        explanation: 'Le ratio [CO2]/[O2] dissous baisse, ce qui trompe l’affinité de la Rubisco.',
      },
    ],
  },
  {
    title: 'Leçon 73 : La Voie C4 : Séparation Spatiale',
    description: 'L’adaptation ingénieuse du Maïs et de la Canne à Sucre.',
    questions: [
      {
        question: 'Comment les plantes C4 évitent-elles la photorespiration ?',
        options: [
          'En séparant la fixation initiale du CO2 (dans le mésophylle) du cycle de Calvin (dans la gaine périfasciculaire)',
          'En fermant leurs stomates à jamais',
          'En vivant sous l’eau',
          'En ne produisant pas d’oxygène',
        ],
        correctIndex: 0,
        explanation: 'Cette pompe à CO2 concentre le carbone autour de la Rubisco à un taux très élevé.',
      },
    ],
  },
  {
    title: 'Leçon 74 : L’Anatomie Kranz des Feuilles C4',
    description: 'La structure en couronne des faisceaux conducteurs.',
    questions: [
      {
        question: 'Que signifie "Kranz" en allemand désignant l’anatomie des plantes C4 ?',
        options: ['Couronne (décrivant l’anneau de cellules de la gaine)', 'Feuille verte', 'Racine géante', 'Épine dure'],
        correctIndex: 0,
        explanation: 'Les cellules de la gaine entourent les nervures en formant une couronne protectrice.',
      },
    ],
  },
  {
    title: 'Leçon 75 : L’Enzyme PEP Carboxylase',
    description: 'Une enzyme fixatrice insensible à l’oxygène.',
    questions: [
      {
        question: 'Pourquoi la PEP carboxylase est-elle bien plus efficace que la Rubisco en milieu chaud ?',
        options: [
          'Elle a une très haute affinité pour les ions bicarbonate et aucune affinité pour l’O2',
          'Elle utilise du sel au lieu de l’eau',
          'Elle est 10 fois plus petite',
          'Elle fonctionne la nuit sans ATP',
        ],
        correctIndex: 0,
        explanation: 'Elle ne présente aucune activité oxygénase, éliminant totalement la photorespiration initiale.',
      },
    ],
  },
  {
    title: 'Leçon 76 : La Voie CAM : Séparation Temporelle',
    description: 'Le métabolisme acide des Crassulacées (Cactus, Ananas, Agaves).',
    questions: [
      {
        question: 'Quelle est la stratégie unique des plantes CAM pour survivre dans les déserts arides ?',
        options: [
          'Ouvrir leurs stomates la nuit pour capter le CO2 et les fermer le jour pour bloquer l’évaporation',
          'Absorber l’eau par leurs fleurs',
          'Ne jamais fabriquer de sucre',
          'Vivre uniquement pendant la saison des pluies',
        ],
        correctIndex: 0,
        explanation: 'En n’ouvrant leurs stomates que la nuit, leur transpiration est réduite de 95% !',
      },
    ],
  },
  {
    title: 'Leçon 77 : Le Stockage Nocturne d’Acide Malique',
    description: 'L’accumulation d’acides organiques dans la grande vacuole.',
    questions: [
      {
        question: 'Sous quelle forme le CO2 capté la nuit est-il temporairement stocké par les plantes CAM ?',
        options: ['Sous forme de malate (acide malique) dans les vacuoles', 'Sous forme de bulles de gaz', 'Sous forme d’amidon pur', 'Sous forme d’huile'],
        correctIndex: 0,
        explanation: 'Le jour venu, le malate est décarboxylé pour alimenter la Rubisco stomates fermés.',
      },
    ],
  },
  {
    title: 'Leçon 78 : Rendement & Économie d’Eau Comparés',
    description: 'Comparer l’efficience d’utilisation de l’eau (EUE).',
    questions: [
      {
        question: 'Lequel de ces types consomme le moins d’eau par gramme de matière sèche produite ?',
        options: ['Les plantes CAM', 'Les plantes C3', 'Les fougères aquatiques', 'Les algues microscopiques'],
        correctIndex: 0,
        explanation: 'Les plantes CAM ont la plus haute efficience d’utilisation de l’eau de toute la biosphère.',
      },
    ],
  },
  {
    title: 'Leçon 79 : Algues Brunes, Rouges & Photosynthèse Océanique',
    description: 'Fucoxanthine, phycobilines et adaptation aux profondeurs.',
    questions: [
      {
        question: 'Comment les algues rouges (Rhodophytes) parviennent-elles à vivre en eau plus profonde ?',
        options: [
          'Leur pigment rouge (phycoérythrine) absorbe la lumière bleue-verte, la seule qui pénètre en profondeur',
          'Elles fabriquent leur propre lumière laser',
          'Elles montent flotter à la surface la nuit',
          'Elles mangent des poissons',
        ],
        correctIndex: 0,
        explanation: 'Le bleu et le vert pénétrant le plus profondément dans l’eau de mer, leurs pigments y sont adaptés.',
      },
    ],
  },
  {
    title: 'Leçon 80 : Étape 8 : Maîtrise des Adaptations',
    description: 'Validation de l’Unité 8 et ouverture du Coffre d’Étape 8.',
    questions: [
      {
        question: 'Dans un contexte de réchauffement planétaire avec canicules récurrentes :',
        options: [
          'Les cultures C4 (comme le sorgho ou le maïs) et CAM conservent un avantage physiologique sur les C3',
          'Toutes les plantes sans exception vont disparaître',
          'Les plantes C3 vont arrêter de respirer',
          'La Rubisco va muter spontanément en chlorophylle',
        ],
        correctIndex: 0,
        explanation: 'Leur tolérance thermique et leur économie d’eau sont de précieux atouts agronomiques.',
      },
    ],
  },

  // --- UNITÉ 9 (81 à 90) ---
  {
    title: 'Leçon 81 : Producteurs Primaires & Réseaux Trophiques',
    description: 'La base inviolable de toute la chaîne alimentaire sur Terre.',
    questions: [
      {
        question: 'Pourquoi dit-on que sans photosynthèse, la quasi-totalité de la vie animale disparaîtrait ?',
        options: [
          'Car les producteurs primaires sont la seule source de matière organique et d’O2 pour les consommateurs',
          'Parce que les animaux mangent uniquement des feuilles vertes',
          'Parce que le soleil s’éteindrait',
          'Parce que les rivières cesseraient de couler',
        ],
        correctIndex: 0,
        explanation: 'Tous les herbivores, carnivores et décomposeurs dépendent ultimement de la biomasse végétale.',
      },
    ],
  },
  {
    title: 'Leçon 82 : Les Forêts : Puits et Réservoirs de Carbone',
    description: 'Stockage du carbone dans le bois (lignine) et les sols forestiers.',
    questions: [
      {
        question: 'Comment un arbre stocke-t-il le carbone atmosphérique pendant des siècles ?',
        options: ['En incorporant les polymères de cellulose et de lignine dans son tronc et ses racines', 'En le comprimant sous forme de diamant', 'En le rejetant dans l’air', 'En le transformant en sel'],
        correctIndex: 0,
        explanation: 'Le bois est composé à environ 50% de carbone capté dans l’air.',
      },
    ],
  },
  {
    title: 'Leçon 83 : Le Phytoplancton Océanique, Poumon Bleu',
    description: 'Diatomées, coccolithophores et cyanobactéries marines.',
    questions: [
      {
        question: 'Quelle proportion de l’oxygène terrestre est produite par les océans ?',
        options: ['Environ 50% à 70% de l’oxygène mondial', 'Moins de 5%', '100% sans exception', 'Aucune, l’océan ne produit rien'],
        correctIndex: 0,
        explanation: 'Le phytoplancton marin produit autant, voire plus d’oxygène que toutes les forêts terrestres réunies !',
      },
    ],
  },
  {
    title: 'Leçon 84 : Le Cycle Biogéochimique du Carbone',
    description: 'Flux entre atmosphère, biosphère, hydrosphère et lithosphère.',
    questions: [
      {
        question: 'Quel phénomène géologique transforme à très long terme la biomasse photosynthétique enfouie ?',
        options: ['La formation des combustibles fossiles (charbon, pétrole, gaz naturel)', 'L’érosion éolienne', 'L’évaporation des mers', 'Les tremblements de terre'],
        correctIndex: 0,
        explanation: 'Le charbon et le pétrole sont d’anciens dépôts de matière végétale fossilisés sur des millions d’années.',
      },
    ],
  },
  {
    title: 'Leçon 85 : Photosynthèse & Régulation du Climat',
    description: 'La modération naturelle de l’effet de serre.',
    questions: [
      {
        question: 'En absorbant environ 30% des émissions anthropiques de CO2, la biosphère agit comme :',
        options: ['Un puits de carbone naturel amortisseur du réchauffement', 'Un accélérateur de l’effet de serre', 'Une source de rayonnement gamma', 'Un filtre à ozone'],
        correctIndex: 0,
        explanation: 'Sans cette absorption biologique, l’accumulation de CO2 dans l’air serait nettement plus rapide.',
      },
    ],
  },
  {
    title: 'Leçon 86 : La Déforestation & Perte de Séquestration',
    description: 'Impact du brûlis et de la fragmentation forestière.',
    questions: [
      {
        question: 'Lorsqu’une forêt est brûlée par déforestation, quel est le double impact carbone ?',
        options: [
          'Le stock de carbone contenu dans le bois est relâché en CO2 et la capacité future de fixation est perdue',
          'Elle produit de l’eau douce',
          'La photosynthèse augmente dans les cendres',
          'L’atmosphère se refroidit',
        ],
        correctIndex: 0,
        explanation: 'La combustion libère massivement le carbone emmagasiné tout en détruisant le capteur végétal.',
      },
    ],
  },
  {
    title: 'Leçon 87 : L’Acidification des Océans & Impact Planctonique',
    description: 'Quand l’excès de CO2 dissous menace les carapaces calcaires.',
    questions: [
      {
        question: 'Quel impact l’acidification de l’eau a-t-elle sur les coccolithophores et diatomées ?',
        options: [
          'Elle fragilise leurs tests calcaires et perturbe la photosynthèse marine',
          'Elle transforme le sel en sucre',
          'Elle colore la mer en jaune',
          'Elle n’a aucun effet mesurable',
        ],
        correctIndex: 0,
        explanation: 'La diminution du pH marin entrave la calcification et la dynamique du phytoplancton.',
      },
    ],
  },
  {
    title: 'Leçon 88 : La Photosynthèse Artificielle',
    description: 'Technologies bio-inspirées pour produire de l’hydrogène vert.',
    questions: [
      {
        question: 'Quel est l’objectif de la photosynthèse artificielle développée en laboratoire ?',
        options: [
          'Copier la photolyse de l’eau avec des catalyseurs solaires pour produire de l’hydrogène (H2) propre',
          'Fabriquer des feuilles en plastique vertes',
          'Remplacer les arbres par des antennes 5G',
          'Refroidir le Soleil',
        ],
        correctIndex: 0,
        explanation: 'Scinder l’eau par énergie solaire permet de générer des carburants solaires renouvelables.',
      },
    ],
  },
  {
    title: 'Leçon 89 : Biocarburants à Base de Micro-Algues',
    description: 'Des usines vivantes à très haut rendement de lipides.',
    questions: [
      {
        question: 'Pourquoi les micro-algues cultivées en photobioréacteurs surpassent-elles le maïs pour les biocarburants ?',
        options: [
          'Leur rendement à l’hectare est 10 à 30 fois supérieur et elles n’empiètent pas sur les terres arables',
          'Elles ne nécessitent aucune lumière',
          'Elles produisent de l’essence sans raffinage',
          'Elles absorbent le pétrole du sol',
        ],
        correctIndex: 0,
        explanation: 'Leur biomasse se multiplie en quelques heures avec une teneur lipidique exceptionnelle.',
      },
    ],
  },
  {
    title: 'Leçon 90 : Étape 9 : Maîtrise Écologique',
    description: 'Validation de l’Unité 9 et ouverture de l’avant-dernier Coffre d’Étape.',
    questions: [
      {
        question: 'Quelle est la conclusion écologique majeure sur le rôle de la photosynthèse ?',
        options: [
          'C’est le mécanisme biogéochimique central équilibrant l’atmosphère et permettant la vie aérobie',
          'C’est un phénomène mineur négligeable',
          'Elle ne sert qu’aux fleurs décoratives',
          'Elle sera remplacée par des machines dans 10 ans',
        ],
        correctIndex: 0,
        explanation: 'Elle est le socle thermodynamique de la quasi-totalité de la biosphère planétaire.',
      },
    ],
  },

  // --- UNITÉ 10 (91 à 100) ---
  {
    title: 'Leçon 91 : Défi Calculs de Rendement Énergétique',
    description: 'Calculer le pourcentage réel de l’énergie solaire convertie en biomasse.',
    questions: [
      {
        question: 'Quel est le rendement photosynthétique global moyen de conversion de l’énergie solaire incidente chez une plante C3 ?',
        options: ['Environ 1% à 3%', 'Près de 95%', '50% exactement', '0,0001%'],
        correctIndex: 0,
        explanation: 'En tenant compte de la réflexion, transmission et photorespiration, le rendement net reste modeste mais colossal à l’échelle du globe.',
      },
    ],
  },
  {
    title: 'Leçon 92 : Défi L’Expérience Historique d’Engelmann',
    description: 'L’expérience de 1883 avec le spirogyre et les bactéries aérophiles.',
    questions: [
      {
        question: 'Qu’a démontré Engelmann en observant des bactéries attirées par l’oxygène le long d’une algue sous prisme ?',
        options: [
          'Les bactéries se regroupent dans les zones bleu et rouge du spectre où la production d’O2 est maximale',
          'Les bactéries aiment la lumière verte',
          'Les algues sont toxiques',
          'La photosynthèse ne dépend pas de la couleur',
        ],
        correctIndex: 0,
        explanation: 'C’est la preuve expérimentale directe reliant le spectre d’absorption au spectre d’action photosynthétique.',
      },
    ],
  },
  {
    title: 'Leçon 93 : Défi L’Expérience de Calvin & Benson (14C)',
    description: 'Le marquage isotopique au carbone 14 pour élucider le cycle.',
    questions: [
      {
        question: 'Quel intermédiaire apparaît en premier après seulement 5 secondes d’exposition au 14CO2 ?',
        options: ['Le 3-phosphoglycérate (3-PGA)', 'Le saccharose', 'L’amidon', 'Le glucose'],
        correctIndex: 0,
        explanation: 'Le marquage radioactif ultra-rapide a prouvé que le premier corps stable formé est à 3 carbones.',
      },
    ],
  },
  {
    title: 'Leçon 94 : Défi L’Expérience de Robert Hill (1937)',
    description: 'La réaction de Hill démontrant la dissociation de l’eau indépendamment du CO2.',
    questions: [
      {
        question: 'Qu’a prouvé Hill en ajoutant un accepteur d’électrons artificiel à des chloroplastes isolés sans CO2 ?',
        options: [
          'La production d’O2 peut avoir lieu sans fixation de CO2 : la photolyse de l’eau est découplée de la phase sombre',
          'Les chloroplastes explosent sans CO2',
          'L’eau ne sert à rien',
          'L’oxygène vient du CO2',
        ],
        correctIndex: 0,
        explanation: 'Cette découverte fondamentale a prouvé que l’oxygène émis provient de l’eau et non du gaz carbonique.',
      },
    ],
  },
  {
    title: 'Leçon 95 : Défi Diagnostic d’Anomalies Métaboliques',
    description: 'Cas clinique végétal : carence en magnésium et chlorose.',
    questions: [
      {
        question: 'Un plant de tomate présente un jaunissement entre les nervures des feuilles âgées. Quel est le diagnostic probable ?',
        options: [
          'Une carence en magnésium (chlorose foliaire), perturbant la synthèse du noyau de la chlorophylle',
          'Une attaque extraterrestre',
          'Un surplus d’eau distillée',
          'Une mutation spontanée en cactus',
        ],
        correctIndex: 0,
        explanation: 'Le magnésium étant mobile, la plante le sacrifie sur les vieilles feuilles pour nourrir les jeunes pousses.',
      },
    ],
  },
  {
    title: 'Leçon 96 : Défi Questions Pièges & Idées Reçues',
    description: 'Démystifier les fausses croyances courantes en sciences.',
    questions: [
      {
        question: 'Vrai ou Faux : Est-il dangereux pour la santé d’avoir une plante verte dans sa chambre la nuit ?',
        options: [
          'Faux : la quantité d’O2 consommée par une plante la nuit est minuscule par rapport à un être humain ou un chat',
          'Vrai : la plante aspire tout l’air en 2 heures',
          'Vrai : la plante produit du poison la nuit',
          'Vrai : elle absorbe l’azote',
        ],
        correctIndex: 0,
        explanation: 'C’est une vieille légende urbaine sans aucun fondement physiologique.',
      },
    ],
  },
  {
    title: 'Leçon 97 : Défi Synthèse Multidisciplinaire',
    description: 'Croisement entre physique quantique, chimie redox et écologie.',
    questions: [
      {
        question: 'Comment peut-on résumer la photosynthèse en une phrase scientifique fondamentale ?',
        options: [
          'C’est la conversion d’une énergie électromagnétique (photons) en énergie de liaisons chimiques stables (sucres)',
          'C’est la fabrication de pluie par les arbres',
          'C’est une réaction nucléaire de fusion froide',
          'C’est l’évaporation de l’eau par le vent',
        ],
        correctIndex: 0,
        explanation: 'Cette définition embrasse les aspects thermodynamiques et biologiques du vivant.',
      },
    ],
  },
  {
    title: 'Leçon 98 : Défi Épreuve Chrono & Réflexes Rapides',
    description: 'Valider les 5 chiffres clés du cours en un instant.',
    questions: [
      {
        question: 'Associez : 6 molécules de CO2 + 6 molécules de H2O donnent :',
        options: [
          '1 molécule de C6H12O6 + 6 molécules de O2',
          '6 molécules de C6H12O6 + 1 molécule de O2',
          '12 molécules de sucre + 2 O2',
          'Rien du tout',
        ],
        correctIndex: 0,
        explanation: 'Équilibre stœchiométrique parfait et rigoureux.',
      },
    ],
  },
  {
    title: 'Leçon 99 : L’Avant-Dernier Jalon : Vers le Sommet',
    description: 'Dernière étape avant la consécration du sentier.',
    questions: [
      {
        question: 'Quel état d’esprit définit le véritable apprenant KIPO au terme de ce parcours ?',
        options: [
          'Une compréhension profonde des mécanismes du vivant, de la rigueur scientifique et de la curiosité',
          'Avoir mémorisé des réponses sans rien comprendre',
          'Vouloir détruire les plantes',
          'Ignorer les lois de la nature',
        ],
        correctIndex: 0,
        explanation: 'KIPO forme des esprits éclairés, critiques et passionnés par la science.',
      },
    ],
  },
  {
    title: 'Leçon 100 : Le Sacre du Grand Maître KIPO',
    description: 'L’Épreuve Suprême finale ouvrant le Grand Coffre de Maîtrise 100/100.',
    questions: [
      {
        question: 'Question Ultime : Pourquoi la photosynthèse est-elle le pont entre le cosmos et la vie sur Terre ?',
        options: [
          'Parce qu’elle capte le feu thermonucléaire du Soleil et le transforme en chair, en pensée et en oxygène pour le vivant',
          'Parce que les plantes viennent de la Lune',
          'Parce que le dioxygène est un gaz extra-terrestre',
          'Parce qu’elle éclaire la nuit',
        ],
        correctIndex: 0,
        explanation: 'Félicitations Grand Maître ! Tu as accompli les 100 leçons du Sentier KIPO avec les plus hauts honneurs !',
      },
    ],
  },
];

// Helper to clean titles
function cleanCourseName(rawTitle: string): string {
  if (!rawTitle) return 'Ce cours';
  return rawTitle.replace(/\s*\([^)]*\)/g, '').replace(/^(Parcours\s*:\s*|Sentier\s*:\s*|Photo\s*:\s*)/i, '').trim();
}

// Generate 10 customized units for any given course, PDF, or photo
export function generateCourseUnits(context: {
  title: string;
  subject?: string;
  keyConcepts?: string[];
  summary?: string;
}): PathUnit[] {
  const cleanTitle = cleanCourseName(context.title);
  const subj = (context.subject || context.title || '').toLowerCase();
  const concepts = (context.keyConcepts && context.keyConcepts.length > 0)
    ? context.keyConcepts
    : [cleanTitle, 'Concepts Clés', 'Propriétés', 'Méthodes', 'Applications'];

  const c1 = concepts[0] || cleanTitle;
  const c2 = concepts[1] || concepts[0] || 'Principes fondamentaux';
  const c3 = concepts[2] || 'Règles et structures';
  const c4 = concepts[3] || 'Applications directes';

  // Domain detection
  const isMath = /math|pythagor|thal|géom|alg|calcul|trigo|fonct|probab/i.test(subj + ' ' + cleanTitle);
  const isHistory = /histoir|révolut|guerre|siècl|époqu|empire|sociét/i.test(subj + ' ' + cleanTitle);
  const isPhysics = /physiq|chimi|élec|mécan|atom|moléc|force|optiq/i.test(subj + ' ' + cleanTitle);
  const isBio = /bio|svt|chloroph|photosynth|cellul|génét|organ/i.test(subj + ' ' + cleanTitle);
  const isLang = /anglais|espagnol|allemand|langue|vocab|gramm|littérat|français/i.test(subj + ' ' + cleanTitle);

  if (isMath) {
    const icons = ['📐', '📏', '🔢', '✏️', '🔍', '⚖️', '🧭', '🧩', '🚀', '👑'];
    const colors = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6', '#ea580c', '#14b8a6', '#8b5cf6', '#eab308'];
    const themes = [
      `Fondations géométriques & Notions de départ (${c1})`,
      `Énoncé fondamental & Propriétés clés (${c2})`,
      `Formules algébriques & Égalités fondamentales`,
      `Calculs directs de longueurs & Mesures inconnues`,
      `Réciproque, conditions & Démonstrations rigoureuses`,
      `Contraposée & Détection des pièges fréquents`,
      `Problèmes concrets & Applications dans le monde réel`,
      `Figures composées & Triangles particuliers`,
      `Géométrie dans l'espace & Problèmes types examen`,
      `L'Épreuve Suprême du Grand Mathématicien KIPO`,
    ];
    return icons.map((icon, idx) => ({
      unitNumber: idx + 1,
      title: `Unité ${idx + 1} : ${themes[idx].split('(')[0].trim()}`,
      theme: themes[idx],
      description: `Maîtrise progressive de ${cleanTitle} : étape ${idx + 1}/10 du sentier.`,
      startLesson: idx * 10 + 1,
      endLesson: (idx + 1) * 10,
      accentColor: colors[idx],
      badgeIcon: icon,
    }));
  }

  if (isHistory) {
    const icons = ['📜', '🚂', '⏳', '🏛️', '👥', '⚔️', '⚖️', '🌍', '📖', '👑'];
    const colors = ['#b45309', '#0284c7', '#7c3aed', '#d97706', '#be185d', '#2563eb', '#c2410c', '#0f766e', '#4f46e5', '#ca8a04'];
    const themes = [
      `Contexte historique & Origines de ${cleanTitle}`,
      `Facteurs déclencheurs & Notions majeures (${c1})`,
      `Grandes étapes chronologiques & Événements clés`,
      `Acteurs majeurs, forces en présence & Rôles clés`,
      `Mutations sociales & Économiques majeures`,
      `Idéologies, débats d'époque & Tensions`,
      `Tournants décisifs & Résistances historiques`,
      `Conséquences durables & Impact sur le monde actuel`,
      `Analyse critique de documents historiques`,
      `Le Sacre du Grand Historien KIPO`,
    ];
    return icons.map((icon, idx) => ({
      unitNumber: idx + 1,
      title: `Unité ${idx + 1} : ${themes[idx].split('&')[0].trim()}`,
      theme: themes[idx],
      description: `Comprendre les tournants majeurs de ${cleanTitle} (étape ${idx + 1}/10).`,
      startLesson: idx * 10 + 1,
      endLesson: (idx + 1) * 10,
      accentColor: colors[idx],
      badgeIcon: icon,
    }));
  }

  if (isPhysics) {
    const icons = ['⚡', '🧲', '🔬', '🪐', '⚙️', '🧪', '💡', '📡', '🎯', '👑'];
    const colors = ['#0284c7', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#ea580c', '#3b82f6', '#14b8a6', '#8b5cf6', '#eab308'];
    const themes = [
      `Grandeurs physiques & Notions fondamentales (${c1})`,
      `Lois & Relations mathématiques fondamentales`,
      `Expériences clés & Observations de référence`,
      `Forces, énergies & Transferts en jeu`,
      `Applications directes & Calculs pas à pas`,
      `Incertitudes de mesure & Pièges à éviter`,
      `Cas limites & Systèmes complexes`,
      `Mise en relation des grandeurs physiques`,
      `Problèmes d'épreuve & Raisonnement guidé`,
      `Maîtrise Totale des Sciences Physiques KIPO`,
    ];
    return icons.map((icon, idx) => ({
      unitNumber: idx + 1,
      title: `Unité ${idx + 1} : ${themes[idx].split('&')[0].trim()}`,
      theme: themes[idx],
      description: `Approfondissement rigoureux de ${cleanTitle} (étape ${idx + 1}/10).`,
      startLesson: idx * 10 + 1,
      endLesson: (idx + 1) * 10,
      accentColor: colors[idx],
      badgeIcon: icon,
    }));
  }

  if (isBio && cleanTitle.toLowerCase().includes('photosynth')) {
    return PATH_UNITS;
  }

  // General / Default Universal Course Units
  const defaultIcons = ['🌱', '🔬', '💡', '⚡', '🧪', '🪵', '☀️', '🌵', '🌍', '👑'];
  const defaultColors = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6', '#ea580c', '#14b8a6', '#6366f1', '#eab308'];
  const defaultThemes = [
    `Les Fondations & Notions Fondamentales (${c1})`,
    `Principes Directeurs & Définitions Clés (${c2})`,
    `Mécanismes, Règles & Propriétés Spécifiques (${c3})`,
    `Formules, Démarches & Applications Directes (${c4})`,
    `Études de Cas, Textes & Exemples Concrets`,
    `Vigilance Méthodologique & Pièges Fréquents`,
    `Approfondissements, Variantes & Cas Particuliers`,
    `Esprit de Synthèse & Liens Interdisciplinaires`,
    `Résolution de Problèmes & Épreuves Types`,
    `L'Épreuve Suprême du Grand Maître KIPO`,
  ];

  return defaultIcons.map((icon, idx) => ({
    unitNumber: idx + 1,
    title: `Unité ${idx + 1} : ${defaultThemes[idx].split('&')[0].trim()}`,
    theme: defaultThemes[idx],
    description: `Maîtriser tous les aspects de « ${cleanTitle} » : niveau ${idx + 1}/10.`,
    startLesson: idx * 10 + 1,
    endLesson: (idx + 1) * 10,
    accentColor: defaultColors[idx],
    badgeIcon: icon,
  }));
}

// Get or dynamically generate the 10 units of a path
export function getPathUnits(path: DuolingoPath): PathUnit[] {
  if (path.units && path.units.length === 10) {
    return path.units;
  }
  return generateCourseUnits({
    title: path.title,
    subject: path.subject,
    keyConcepts: path.docKeyConcepts,
    summary: path.docSummary,
  });
}

// List of science / photosynthesis terms to detect contamination in non-biology courses
export const SCIENCE_CONTAMINATION_TERMS = [
  'photosynth',
  'chlorophylle',
  'chloroplaste',
  'thylako',
  'stroma',
  'calvin',
  'rubisco',
  'dioxygène rejeté',
  'photolyse',
  'autotrophie',
  'sève élaborée',
  'caroténoïde',
  'feuille foliaire',
  'stomate',
];

export function isScienceContaminated(text?: string, isBioSubject = false): boolean {
  if (isBioSubject || !text) return false;
  const lower = text.toLowerCase();
  return SCIENCE_CONTAMINATION_TERMS.some((term) => lower.includes(term));
}

// Helper to clean answers from previous format prefixes
function cleanAns(str?: string): string {
  if (!str) return 'Affirmation démontrée dans le cours';
  return str
    .replace(/^[A-D][.):\s-]+/i, '')
    .replace(/^(Vrai|Faux|Exact|Inexact)\s*:\s*/i, '')
    .replace(/^\[\.\.\.\]\s*/, '')
    .replace(/^(Conforme|Validé|Erreur)\s*:\s*/i, '')
    .trim();
}

// Helper to clean prompt questions
function cleanPrompt(str?: string): string {
  if (!str) return 'quelle conclusion essentielle doit-on retenir ?';
  return str.trim();
}

// Deterministic option shuffler so that the correct answer is cleanly distributed across options A, B, C, D
function shuffleDeterministic<T>(
  correctOption: T,
  distractors: T[],
  seed: number
): { options: [T, T, T, T]; correctIndex: number } {
  const all: T[] = [correctOption, ...distractors.slice(0, 3)];
  // Guarantee 4 items
  while (all.length < 4) {
    all.push(distractors[0] || correctOption);
  }
  const targetIndex = Math.abs(seed) % 4;
  const temp = all[0];
  all[0] = all[targetIndex];
  all[targetIndex] = temp;
  return {
    options: all as [T, T, T, T],
    correctIndex: targetIndex,
  };
}

// Extracts all authentic base questions from the analyzed document, lessons 1-4, key concepts and summary
export function extractDocumentBaseQuestions(
  existingLessons: LearningLesson[],
  docContext?: CourseContext,
  courseTitle = 'Ce cours',
  isBioSubject = false
): QuizQuestion[] {
  const cleanTitle = cleanCourseName(courseTitle);
  const basePool: QuizQuestion[] = [];

  // 1. Collect questions from existing lessons (specifically lessons 1 to 4 generated from document analysis)
  for (const lesson of existingLessons) {
    if (lesson.questions && Array.isArray(lesson.questions)) {
      for (const q of lesson.questions) {
        // Discard any question contaminated with science if this is not a biology course
        if (!isBioSubject && isScienceContaminated(`${q.question} ${q.explanation} ${q.options.join(' ')}`, false)) {
          continue;
        }
        if (q.question && q.options && q.options.length >= 2 && q.correctIndex >= 0) {
          basePool.push({
            id: q.id,
            question: q.question.trim(),
            options: [...q.options],
            correctIndex: q.correctIndex,
            explanation: q.explanation || `Notion validée d'après le cours sur « ${cleanTitle} ».`,
            xpReward: q.xpReward || 15,
          });
        }
      }
    }
  }

  // 2. Add questions from docContext.suggestedQuestions if available
  if (docContext?.suggestedQuestions && docContext.suggestedQuestions.length > 0) {
    docContext.suggestedQuestions.forEach((sq, idx) => {
      const trimmed = sq.replace(/^[-•\d.:\s]+/, '').trim();
      if (trimmed.length > 10 && !basePool.some((b) => b.question.toLowerCase() === trimmed.toLowerCase())) {
        const correct = `Elle est directement démontrée et confirmée dans l'analyse de « ${cleanTitle} ».`;
        const distractors = [
          `C'est une supposition exclue par les règles du cours`,
          `Cette question ne concerne absolument pas ce chapitre`,
          `Le document n'apporte aucune validation à ce sujet`,
        ];
        const shuffled = shuffleDeterministic(correct, distractors, idx * 11 + 3);
        basePool.push({
          id: `suggested-${idx + 1}`,
          question: trimmed,
          options: shuffled.options,
          correctIndex: shuffled.correctIndex,
          explanation: `Dans le cours sur « ${cleanTitle} », cette problématique est centrale pour comprendre les mécanismes fondamentaux.`,
          xpReward: 20,
        });
      }
    });
  }

  // 3. Add questions from docContext.keyConcepts if available
  if (docContext?.keyConcepts && docContext.keyConcepts.length > 0) {
    docContext.keyConcepts.forEach((kc, idx) => {
      const cleanConcept = kc.replace(/^[-•\d.:\s]+/, '').trim();
      if (cleanConcept.length > 2 && !basePool.some((b) => b.question.includes(cleanConcept))) {
        const correct = `C'est une notion centrale de « ${cleanTitle} » qui structure la méthode et l'analyse.`;
        const distractors = [
          `C'est une théorie obsolète réfutée dans le chapitre`,
          `C'est un élément accessoire sans portée pratique`,
          `Cette notion n'intervient jamais dans les exercices`,
        ];
        const shuffled = shuffleDeterministic(correct, distractors, idx * 13 + 7);
        basePool.push({
          id: `concept-${idx + 1}`,
          question: `Dans le document analysé, quel est le rôle principal associé à « ${cleanConcept} » ?`,
          options: shuffled.options,
          correctIndex: shuffled.correctIndex,
          explanation: `Dans « ${cleanTitle} », « ${cleanConcept} » constitue un repère indispensable.`,
          xpReward: 20,
        });
      }
    });
  }

  // 4. Add questions from docContext.summary sentences if needed
  if (docContext?.summary && basePool.length < 10) {
    const sentences = docContext.summary
      .split(/[.!?;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 150);
    sentences.forEach((sent, idx) => {
      const correct = `Vrai : ${sent}`;
      const distractors = [
        `Faux : le document soutient exactement le point de vue inverse`,
        `Faux : cette règle ne concerne pas les notions de ce cours`,
        `Inexact : l'affirmation a été rejetée lors de l'analyse`,
      ];
      const shuffled = shuffleDeterministic(correct, distractors, idx * 23 + 5);
      basePool.push({
        id: `summary-fact-${idx + 1}`,
        question: `D'après le résumé du cours « ${cleanTitle} », que doit-on retenir concernant ce point ?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `Cette proposition découle directement du texte du document : "${sent}".`,
        xpReward: 15,
      });
    });
  }

  // 5. Fallback if pool is still empty (e.g., bare course title)
  if (basePool.length === 0) {
    const defaultConcepts = [
      'Notion fondamentale',
      'Propriété caractéristique',
      'Règle d’application',
      'Méthode de résolution',
      'Cas particulier',
    ];
    defaultConcepts.forEach((dc, idx) => {
      const correct = `Appliquer rigoureusement la règle du cours sur « ${cleanTitle} ».`;
      const distractors = [
        `Ignorer les définitions de base du cours`,
        `Supposer un résultat au hasard sans justification`,
        `Considérer la règle comme optionnelle`,
      ];
      const shuffled = shuffleDeterministic(correct, distractors, idx * 17 + 5);
      basePool.push({
        id: `default-${idx + 1}`,
        question: `Dans le cadre de « ${cleanTitle} », comment aborder « ${dc} » ?`,
        options: shuffled.options,
        correctIndex: shuffled.correctIndex,
        explanation: `La rigueur méthodologique est indispensable pour réussir les exercices sur ${cleanTitle}.`,
        xpReward: 15,
      });
    });
  }

  return basePool;
}

// Reformulate an authentic document question across 8 distinct pedagogical angles:
// Mode 0: Reformulation directe / Relecture attentive
// Mode 1: Validation d'exactitude (Vrai / Faux)
// Mode 2: Détection d'erreur / Piège (Inversion - identifier la fausse affirmation)
// Mode 3: Mise en situation concrète / Démarche pratique
// Mode 4: Complétion de proposition / Règle inachevée
// Mode 5: Question réciproque (trouver la problématique correspondant à la solution)
// Mode 6: Cause & Justification (pourquoi cette conclusion s'impose)
// Mode 7: Défi flash & Consolidation rapide
export function reformulateDocumentQuestion(params: {
  baseQ: QuizQuestion;
  mode: number;
  lessonNumber: number;
  questionIndex: number;
  courseTitle: string;
  unit: PathUnit;
}): QuizQuestion {
  const { baseQ, mode, lessonNumber, questionIndex, courseTitle, unit } = params;
  const cleanTitle = cleanCourseName(courseTitle);
  const correctRaw = baseQ.options[baseQ.correctIndex] || baseQ.options[0] || 'Affirmation conforme au cours';
  const wrongOptionsRaw = baseQ.options.filter((_, idx) => idx !== baseQ.correctIndex);
  if (wrongOptionsRaw.length === 0) {
    wrongOptionsRaw.push(
      'Affirmation réfutée par le document',
      'Hypothèse non retenue dans ce cours',
      'Cas non applicable ici'
    );
  }
  while (wrongOptionsRaw.length < 3) {
    wrongOptionsRaw.push(`Alternative non conforme (${wrongOptionsRaw.length + 1})`);
  }

  const correctAns = cleanAns(correctRaw);
  const wrongOptions = wrongOptionsRaw.map((w) => cleanAns(w));
  const basePrompt = cleanPrompt(baseQ.question);
  const baseExplanation = baseQ.explanation || `D'après le cours sur « ${cleanTitle} », cette notion est validée.`;
  const seed = lessonNumber * 37 + questionIndex * 19 + mode * 13;
  const xp = 15 + Math.floor(lessonNumber / 10) * 2;
  const qId = `l${lessonNumber}-q${questionIndex + 1}`;

  // Mode 0: Reformulation Directe avec Perspective de Révision
  if (mode === 0) {
    const prefixes = [
      `En examinant ce point clé de « ${cleanTitle} » :`,
      `D'après les explications du document :`,
      `Question essentielle issue du document :`,
      `Pour consolider votre apprentissage de « ${cleanTitle} » :`,
    ];
    const prefix = prefixes[(lessonNumber + questionIndex) % prefixes.length];
    const shuffled = shuffleDeterministic(correctAns, wrongOptions, seed);
    return {
      id: qId,
      question: `${prefix} ${basePrompt}`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Rappel méthodique du cours : ${baseExplanation}`,
      xpReward: xp,
    };
  }

  // Mode 1: Validation d'Affirmation (Vrai / Exactitude du Document)
  if (mode === 1) {
    const shuffled = shuffleDeterministic(
      `Exact : ${correctAns}`,
      [
        `Inexact : ${wrongOptions[0]}`,
        `Inexact : ${wrongOptions[1]}`,
        `Inexact : ${wrongOptions[2]}`,
      ],
      seed
    );
    return {
      id: qId,
      question: `D'après le document analysé (« ${cleanTitle} »), laquelle de ces affirmations est rigoureusement EXACTE ?`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Cette affirmation est rigoureusement confirmée par le document analysé. ${baseExplanation}`,
      xpReward: xp,
    };
  }

  // Mode 2: Détection d'Erreur & Piège (Inversion - trouver l'affirmation FAUSSE)
  if (mode === 2) {
    // Here the user is asked to find the FALSE statement. The correct answer is the false statement!
    const falseStatement = `Erreur : ${wrongOptions[0]}`;
    const trueStatements = [
      `Conforme : ${correctAns}`,
      `Validé : cette notion respecte les principes du document`,
      `Exact : la démarche est attestée dans ce chapitre`,
    ];
    const shuffled = shuffleDeterministic(falseStatement, trueStatements, seed);
    return {
      id: qId,
      question: `Concernant la notion étudiée dans « ${cleanTitle} », identifiez l'affirmation FAUSSE parmi ces propositions :`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Bien vu ! Cette affirmation était fausse. Le document établit au contraire que : ${correctAns}.`,
      xpReward: xp + 5,
    };
  }

  // Mode 3: Mise en Situation Concrète / Cas Pratique
  if (mode === 3) {
    const shuffled = shuffleDeterministic(correctAns, wrongOptions, seed);
    return {
      id: qId,
      question: `Dans une application concrète du cours « ${cleanTitle} » : ${basePrompt}`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Application pratique validée par le document : ${baseExplanation}`,
      xpReward: xp,
    };
  }

  // Mode 4: Complétion de Règle / Proposition Inachevée
  if (mode === 4) {
    const shuffled = shuffleDeterministic(
      `[...] ${correctAns}`,
      [
        `[...] ${wrongOptions[0]}`,
        `[...] ${wrongOptions[1]}`,
        `[...] ${wrongOptions[2]}`,
      ],
      seed
    );
    return {
      id: qId,
      question: `Complétez la règle du document analysé : « Au sujet de ce principe de « ${cleanTitle} », on retient que [...] »`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Règle complétée avec succès : « ${correctAns} ». ${baseExplanation}`,
      xpReward: xp,
    };
  }

  // Mode 5: Question Inverse (Retrouver la Problématique)
  if (mode === 5) {
    const shuffled = shuffleDeterministic(
      baseQ.question,
      [
        `Une problématique sans lien avec le sujet de « ${cleanTitle} »`,
        `Une hypothèse rejetée lors de l'étude du document`,
        `Une question portant sur un autre chapitre`,
      ],
      seed
    );
    return {
      id: qId,
      question: `À quelle question essentielle du cours correspond directement la conclusion suivante : « ${correctAns} » ?`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Cette conclusion répond directement à : "${baseQ.question}". ${baseExplanation}`,
      xpReward: xp + 5,
    };
  }

  // Mode 6: Cause et Justification (Pourquoi / Conséquence)
  if (mode === 6) {
    const shuffled = shuffleDeterministic(
      `Parce que cela découle directement de : ${basePrompt}`,
      [
        `Parce qu'il s'agit d'une convention arbitraire sans fondement`,
        `Parce que le cours démontre l'exact opposé`,
        `Parce que cette notion n'est qu'une exception temporaire`,
      ],
      seed
    );
    return {
      id: qId,
      question: `Pourquoi la conclusion « ${correctAns} » est-elle validée dans l'analyse de « ${cleanTitle} » ?`,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      explanation: `Justification du cours : ${baseExplanation}`,
      xpReward: xp,
    };
  }

  // Mode 7: Défi Flash & Consolidation Rapide
  const shuffled = shuffleDeterministic(correctAns, wrongOptions, seed);
  return {
    id: qId,
    question: `Défi de maîtrise rapide : « ${cleanTitle} » – ${basePrompt}`,
    options: shuffled.options,
    correctIndex: shuffled.correctIndex,
    explanation: `Notion consolidée ! ${baseExplanation}`,
    xpReward: xp,
  };
}

// Generate the complete 100-lesson array strictly based on the analyzed document/course
export function generate100Lessons(
  courseTitle: string,
  subject: string,
  existingLessons: LearningLesson[] = [],
  docContext?: CourseContext,
  units?: PathUnit[]
): LearningLesson[] {
  const isBioSubject =
    courseTitle.toLowerCase().includes('photosynth') &&
    (!docContext || docContext.title.toLowerCase().includes('photosynth'));

  // If this is the specific default seed course on Photosynthesis and NO conflicting document was passed, use the crafted 100 lessons
  if (isBioSubject && (!existingLessons || existingLessons.length <= 4)) {
    const result: LearningLesson[] = [];
    for (let i = 1; i <= 100; i++) {
      const existing = existingLessons.find((l) => l.lessonNumber === i);
      const template = LESSON_CURRICULUM_DATA[i - 1];

      if (existing && existing.questions && existing.questions.length > 0) {
        result.push({
          ...existing,
          lessonNumber: i,
          title: existing.title.startsWith('Leçon') ? existing.title : `Leçon ${i} : ${existing.title}`,
        });
      } else if (template) {
        const unit = getUnitForLesson(i);
        const questions: QuizQuestion[] = template.questions.map((q, qIdx) => ({
          id: `l${i}-q${qIdx + 1}`,
          question: q.question,
          options: [...q.options],
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          xpReward: 15 + Math.floor(i / 10) * 2,
        }));

        result.push({
          id: `l${i}`,
          lessonNumber: i,
          title: template.title,
          description: template.description || `${unit.theme} - Notions clés`,
          isCompleted: i === 1,
          stars: i === 1 ? 3 : 0,
          questions,
        });
      }
    }
    return result;
  }

  // --- UNIVERSAL COURSE GENERATOR: 100 LESSONS STRICTLY ABOUT THE ANALYZED DOCUMENT/PHOTO/PDF ---
  const cleanTitle = cleanCourseName(courseTitle);
  const activeUnits =
    units && units.length === 10
      ? units
      : generateCourseUnits({
          title: courseTitle,
          subject,
          keyConcepts: docContext?.keyConcepts,
          summary: docContext?.summary,
        });

  // Extract base questions pool strictly from the analyzed document
  const baseQuestions = extractDocumentBaseQuestions(
    existingLessons,
    docContext,
    courseTitle,
    isBioSubject
  );

  // Extract concepts list for pedagogical titles
  const concepts: string[] = [];
  if (docContext?.keyConcepts && docContext.keyConcepts.length > 0) {
    concepts.push(...docContext.keyConcepts.map((c) => c.replace(/^[-•\d.:\s]+/, '').trim()).filter(Boolean));
  }
  if (concepts.length === 0) {
    concepts.push(
      cleanTitle,
      'Notion fondamentale',
      'Propriété caractéristique',
      'Formule ou règle',
      'Exemple d’application',
      'Cas particulier'
    );
  }

  const result: LearningLesson[] = [];

  for (let i = 1; i <= 100; i++) {
    const existing = existingLessons.find((l) => l.lessonNumber === i);
    const unitIdx = Math.floor((i - 1) / 10);
    const unit = activeUnits[unitIdx] || activeUnits[0];
    const stepInUnit = (i - 1) % 10;
    const currentConcept = concepts[(i - 1) % concepts.length];

    // For lessons 1 to 4: preserve original authentic document lessons if clean
    if (i <= 4 && existing && existing.questions && existing.questions.length > 0) {
      const isClean = isBioSubject || !existing.questions.some((q) =>
        isScienceContaminated(`${q.question} ${q.explanation} ${q.options.join(' ')}`, false)
      );
      if (isClean) {
        result.push({
          ...existing,
          lessonNumber: i,
          title: existing.title.startsWith('Leçon') ? existing.title : `Leçon ${i} : ${existing.title}`,
        });
        continue;
      }
    }

    // Determine pedagogical lesson title for this course
    let lessonSubTitle = '';
    let lessonDesc = '';

    if (stepInUnit === 0) {
      lessonSubTitle = `Découverte & Vue d'Ensemble de ${cleanTitle}`;
      lessonDesc = `Introduction et repères clés de l'unité ${unit.unitNumber} (${unit.theme}).`;
    } else if (stepInUnit === 1) {
      lessonSubTitle = `Notions Fondamentales : ${currentConcept}`;
      lessonDesc = `Comprendre la définition précise et le rôle de ${currentConcept}.`;
    } else if (stepInUnit === 2) {
      lessonSubTitle = `Propriétés & Règles Essentielles`;
      lessonDesc = `Décrypter les principes directeurs et les liens avec ${currentConcept}.`;
    } else if (stepInUnit === 3) {
      lessonSubTitle = `Mise en Pratique & Démarche`;
      lessonDesc = `Exercices d'application directe et méthode de résolution pas à pas.`;
    } else if (stepInUnit === 4) {
      lessonSubTitle = `Étude d'un Exemple Concret : ${currentConcept}`;
      lessonDesc = `Mise en situation pratique tirée du document et cas représentatifs.`;
    } else if (stepInUnit === 5) {
      lessonSubTitle = `Vrai ou Faux & Analyse Critique`;
      lessonDesc = `Valider la compréhension des propositions du cours et chasser les doutes.`;
    } else if (stepInUnit === 6) {
      lessonSubTitle = `Pièges Classiques à Éviter sur ${currentConcept}`;
      lessonDesc = `Identifier les erreurs fréquentes et consolider la rigueur d'analyse.`;
    } else if (stepInUnit === 7) {
      lessonSubTitle = `Variations & Cas Particuliers`;
      lessonDesc = `Nuances importantes, exceptions et cas limites relatifs à ${cleanTitle}.`;
    } else if (stepInUnit === 8) {
      lessonSubTitle = `Synthèse & Liens Entre Notions`;
      lessonDesc = `Articulation globale des concepts étudiés au sein de l'unité ${unit.unitNumber}.`;
    } else {
      if (i === 100) {
        lessonSubTitle = `Le Sacre du Grand Maître KIPO : ${cleanTitle}`;
        lessonDesc = `L'Épreuve Ultime 100/100 validant la maîtrise totale et absolue de ce cours !`;
      } else {
        lessonSubTitle = `Étape ${unit.unitNumber} : Bilan & Validation de Maîtrise`;
        lessonDesc = `Validation de l'Unité ${unit.unitNumber} et ouverture du Coffre d'Étape (${i}/100).`;
      }
    }

    // Lessons 5 to 100: Generate questions strictly from the analyzed document,
    // reformulating the document's questions across diverse pedagogical styles!
    const questionsCount = i === 100 ? 4 : 3;
    const questions: QuizQuestion[] = [];

    for (let qIdx = 0; qIdx < questionsCount; qIdx++) {
      const baseIdx = ((i - 1) * 3 + qIdx) % baseQuestions.length;
      const baseQ = baseQuestions[baseIdx];
      // Mode cycles through 8 distinct pedagogical styles
      const mode = ((i - 1) * 2 + qIdx) % 8;
      questions.push(
        reformulateDocumentQuestion({
          baseQ,
          mode,
          lessonNumber: i,
          questionIndex: qIdx,
          courseTitle: cleanTitle,
          unit,
        })
      );
    }

    result.push({
      id: `l${i}`,
      lessonNumber: i,
      title: `Leçon ${i} : ${lessonSubTitle}`,
      description: lessonDesc,
      isCompleted: existing ? existing.isCompleted : (i === 1),
      stars: existing ? existing.stars : (i === 1 ? 3 : 0),
      questions,
    });
  }

  return result;
}

// Expands any DuolingoPath into a pristine 100-lesson path fully tailored to the analyzed document
export function expandPathTo100Lessons(
  path: Partial<DuolingoPath>,
  docContext?: CourseContext
): DuolingoPath {
  const currentLessons = path.lessons || [];
  const title = path.title || docContext?.title || 'Sentier KIPO';
  const subject = path.subject || docContext?.subject || 'Général';
  const isBioSubject =
    title.toLowerCase().includes('photosynth') &&
    (!docContext || docContext.title.toLowerCase().includes('photosynth'));

  const units =
    path.units && path.units.length === 10
      ? path.units
      : generateCourseUnits({
          title,
          subject,
          keyConcepts: docContext?.keyConcepts || path.docKeyConcepts,
          summary: docContext?.summary || path.docSummary,
        });

  // Check if currentLessons has science contamination on a non-science path, or if lessons 5-100 are missing/stale
  const hasScienceContamination =
    !isBioSubject &&
    currentLessons.some(
      (l) =>
        l.lessonNumber > 4 &&
        (isScienceContaminated(`${l.title} ${l.description}`) ||
          l.questions?.some((q) => isScienceContaminated(`${q.question} ${q.explanation} ${q.options.join(' ')}`)))
    );

  const needsFullRegeneration =
    currentLessons.length !== 100 ||
    hasScienceContamination ||
    !path.units ||
    path.units.length !== 10;

  const validExistingLessons = hasScienceContamination
    ? currentLessons.filter((l) => l.lessonNumber <= 4 && !isScienceContaminated(`${l.title} ${l.description}`))
    : currentLessons;

  const lessons100 = needsFullRegeneration
    ? generate100Lessons(title, subject, validExistingLessons, docContext, units)
    : currentLessons;

  const totalQuestions = lessons100.reduce((acc, l) => acc + (l.questions?.length || 0), 0);

  return {
    id: path.id || `path-100-${Date.now()}`,
    documentId: path.documentId,
    title,
    subject,
    userRequest: path.userRequest || docContext?.userRequest,
    totalQuestions,
    lessons: lessons100,
    units,
    docSummary: docContext?.summary || path.docSummary,
    docKeyConcepts: docContext?.keyConcepts || path.docKeyConcepts,
    createdAt: path.createdAt || new Date().toISOString(),
  };
}
