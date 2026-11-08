import {
  AnimalHero,
  AnimalCharacterId,
  AnimalAdventureGame,
  GameMission,
  GameMissionTask,
} from '../types';
import { getItemScoped, setItemScoped, getActiveUserId } from './storageService';

export const ANIMAL_HEROES: Record<AnimalCharacterId, AnimalHero> = {
  hibou: {
    id: 'hibou',
    name: 'Kipo le Hibou',
    species: 'Grand-Duc Savant',
    emoji: '🦉',
    role: 'Leader & Maître des Énigmes',
    title: 'L’Œil de la Sagesse',
    avatarColor: 'text-emerald-600 bg-emerald-100 border-emerald-300',
    bgGradient: 'from-emerald-500 to-teal-700',
    personality: 'Patient, perspicace et méthodique. Guide ancestral des savoirs.',
    catchphrase: '« Hou-hou ! La connaissance éclaire la nuit la plus sombre ! »',
    specialPower: {
      id: 'p_hibou',
      name: 'Vision Nocturne',
      description: 'Dévoile un indice décisif et élimine 2 mauvaises réponses.',
      emoji: '👁️',
      effect: 'fifty_fifty',
    },
    baseStats: {
      speed: 70,
      wisdom: 98,
      bravery: 85,
    },
  },
  chat: {
    id: 'chat',
    name: 'Miko le Chat',
    species: 'Félin Ninja',
    emoji: '🐱',
    role: 'Champion des Réflexes',
    title: 'La Griffe Foudroyante',
    avatarColor: 'text-amber-600 bg-amber-100 border-amber-300',
    bgGradient: 'from-amber-500 to-orange-600',
    personality: 'Vif, espiègle et agile. Maître de la rapidité et des défis chrono.',
    catchphrase: '« Miaou ! Plus rapide qu’un bond, plus affûté qu’une griffe ! »',
    specialPower: {
      id: 'p_chat',
      name: 'Coup de Griffe 50/50',
      description: 'Tranche instantanément 2 pièges pour ne laisser que le bon choix.',
      emoji: '🐾',
      effect: 'fifty_fifty',
    },
    baseStats: {
      speed: 99,
      wisdom: 75,
      bravery: 80,
    },
  },
  chien: {
    id: 'chien',
    name: 'Rocky le Chien',
    species: 'Berger Loyal',
    emoji: '🐶',
    role: 'Bouclier de Fidélité',
    title: 'Le Protecteur Invincible',
    avatarColor: 'text-sky-600 bg-sky-100 border-sky-300',
    bgGradient: 'from-sky-500 to-blue-700',
    personality: 'Loyal, courageux et protecteur. N’abandonne jamais un camarade.',
    catchphrase: '« Wouf ! Aucun problème ne résiste au courage d’une équipe soudée ! »',
    specialPower: {
      id: 'p_chien',
      name: 'Bouclier Protecteur',
      description: 'Annule la perte de cœur ❤️ sur la prochaine erreur.',
      emoji: '🛡️',
      effect: 'shield',
    },
    baseStats: {
      speed: 80,
      wisdom: 82,
      bravery: 98,
    },
  },
  souris: {
    id: 'souris',
    name: 'Pip la Souris',
    species: 'Souris Détective',
    emoji: '🐭',
    role: 'Génie Furtive',
    title: 'La Loupe Céleste',
    avatarColor: 'text-purple-600 bg-purple-100 border-purple-300',
    bgGradient: 'from-purple-500 to-pink-600',
    personality: 'Petite mais d’une vivacité d’esprit hors du commun. Rien ne lui échappe.',
    catchphrase: '« Petite taille, génie sans limite ! Les détails font les grands maîtres ! »',
    specialPower: {
      id: 'p_souris',
      name: 'Fromage Doré x2',
      description: 'Double les points et les XP récoltés pour la question.',
      emoji: '🧀',
      effect: 'double_xp',
    },
    baseStats: {
      speed: 92,
      wisdom: 90,
      bravery: 72,
    },
  },
  renard: {
    id: 'renard',
    name: 'Finn le Renard',
    species: 'Renard Tacticien',
    emoji: '🦊',
    role: 'Stratège des Étoiles',
    title: 'Le Maître des Arcanes',
    avatarColor: 'text-rose-600 bg-rose-100 border-rose-300',
    bgGradient: 'from-rose-500 to-red-600',
    personality: 'Fin calculateur, éloquent et toujours avec un plan de secours génial.',
    catchphrase: '« La ruse est l’art de transformer chaque obstacle en tremplin ! »',
    specialPower: {
      id: 'p_renard',
      name: 'Sablier Mystique',
      description: 'Gèle le chronomètre pendant 15 secondes pour réfléchir au calme.',
      emoji: '⏳',
      effect: 'freeze_time',
    },
    baseStats: {
      speed: 88,
      wisdom: 94,
      bravery: 84,
    },
  },
};

export const PRESET_ANIMAL_GAMES: AnimalAdventureGame[] = [
  {
    id: 'preset-maths-forest',
    title: 'La Forêt des Nombres Perdus',
    universeName: 'La Forêt Enchantée de Kipo',
    subject: 'Mathématiques & Raisonnement Logique',
    conceptSummary: 'Apprends le calcul mental, les équations et les proportions aux côtés de Kipo le Hibou et Miko le Chat !',
    targetLevel: 'college',
    storyline: 'Les stèles numériques de la Grande Canopée ont été déréglées par le Sphinx du Chaos. Accompagne l’escouade animale pour restaurer l’équilibre arithmétique !',
    leadAnimalId: 'hibou',
    rewards: {
      badgeName: 'Totem des Nombres Sacrés',
      badgeEmoji: '💎',
      totalXp: 450,
      trophyDescription: 'A rétabli l’ordre mathématique dans la Forêt Enchantée !',
    },
    createdAt: new Date().toISOString(),
    missions: [
      {
        id: 'm1_math',
        order: 1,
        title: 'Mission 1 : Le Réveil de la Clairière',
        storyIntro: 'Kipo le Hibou t’attend au sommet du grand chêne. Première énigme pour tester tes réflexes de calcul !',
        locationName: 'Le Grand Chêne Millénaire',
        environmentEmoji: '🌳',
        type: 'speed_trivia',
        heroCompanionId: 'hibou',
        completed: false,
        score: 0,
        stars: 0,
        tasks: [
          {
            id: 't1_1',
            type: 'question',
            prompt: 'Si 3 écureuils ramassent 18 noisettes en 6 minutes, combien 1 écureuil ramasse-t-il en 6 minutes ?',
            options: ['6 noisettes', '3 noisettes', '9 noisettes', '12 noisettes'],
            correctIndex: 0,
            explanation: '18 noisettes partagées équitablement entre 3 écureuils = 18 ÷ 3 = 6 noisettes par écureuil.',
            animalCommentary: {
              hibou: 'Parfait ! Tu calcules vite et bien.',
              chat: 'Miaou ! Même moi j’aurais pas attrapé autant de souris !',
            },
            points: 150,
            timeLimitSeconds: 30,
          },
          {
            id: 't1_2',
            type: 'question',
            prompt: 'Quelle est la solution de l’équation 4x - 8 = 16 ?',
            options: ['x = 6', 'x = 4', 'x = 8', 'x = 2'],
            correctIndex: 0,
            explanation: '4x = 16 + 8 = 24, donc x = 24 ÷ 4 = 6.',
            animalCommentary: {
              hibou: 'La méthode pas à pas est infaillible.',
              chien: 'Wouf ! Une précision militaire, bravo partenaire !',
            },
            points: 150,
            timeLimitSeconds: 30,
          },
          {
            id: 't1_3',
            type: 'question',
            prompt: 'Un article à 80 € bénéficie d’une remise de 25%. Quel est son nouveau prix ?',
            options: ['60 €', '55 €', '65 €', '70 €'],
            correctIndex: 0,
            explanation: '25% de 80 € = 80 ÷ 4 = 20 € de réduction. Prix final = 80 - 20 = 60 €.',
            animalCommentary: {
              souris: 'Hihi ! Mes calculs de graines sont d’accord avec toi !',
            },
            points: 150,
            timeLimitSeconds: 30,
          },
        ],
      },
      {
        id: 'm2_math',
        order: 2,
        title: 'Mission 2 : La Course de Miko sur la Rivière',
        storyIntro: 'Miko le Chat bondit de tronc en tronc. Réponds vite pour garder le tempo sans tomber dans l’eau !',
        locationName: 'Les Cascades Vrombissantes',
        environmentEmoji: '🌊',
        type: 'speed_trivia',
        heroCompanionId: 'chat',
        completed: false,
        score: 0,
        stars: 0,
        tasks: [
          {
            id: 't2_1',
            type: 'question',
            prompt: 'Quelle est la valeur de (-3)² - (-2) ?',
            options: ['11', '7', '-11', '-7'],
            correctIndex: 0,
            explanation: '(-3)² = 9, et -(-2) = +2. Donc 9 + 2 = 11.',
            animalCommentary: {
              chat: 'Miaou ! Attention au piège des signes négatifs, tu as sauté par-dessus avec brio !',
            },
            points: 200,
            timeLimitSeconds: 25,
          },
          {
            id: 't2_2',
            type: 'question',
            prompt: 'Dans un triangle rectangle, les côtés de l’angle droit mesurent 6 cm et 8 cm. Quelle est la longueur de l’hypoténuse ?',
            options: ['10 cm', '14 cm', '12 cm', '9 cm'],
            correctIndex: 0,
            explanation: 'Théorème de Pythagore : 6² + 8² = 36 + 64 = 100. √100 = 10 cm.',
            animalCommentary: {
              hibou: 'Pythagore lui-même applaudirait ce coup de serres !',
            },
            points: 200,
            timeLimitSeconds: 25,
          },
        ],
      },
      {
        id: 'm3_math',
        order: 3,
        title: 'Mission 3 : Le Terrier Mystère de Pip',
        storyIntro: 'Pip la Souris a découvert un coffre scellé par une suite logique. Déverrouille la serrure secrète !',
        locationName: 'Les Ruines Cristallines',
        environmentEmoji: '💎',
        type: 'mystery_riddle',
        heroCompanionId: 'souris',
        completed: false,
        score: 0,
        stars: 0,
        tasks: [
          {
            id: 't3_1',
            type: 'question',
            prompt: 'Quel nombre complète la suite : 2, 6, 12, 20, 30, ?',
            options: ['42', '40', '36', '48'],
            correctIndex: 0,
            explanation: 'Écarts successifs : +4, +6, +8, +10, puis +12 ! Donc 30 + 12 = 42.',
            animalCommentary: {
              souris: 'Cliqueti-clac ! La serrure s’est ouverte, tu as un cerveau en or massif !',
            },
            points: 200,
            timeLimitSeconds: 30,
          },
        ],
      },
      {
        id: 'm4_math',
        order: 4,
        title: 'Combat Ultime : Le Sphinx des Équations',
        storyIntro: 'L’arène tremble ! Le Sphinx géant bloque le passage vers la Lumière. Chaque bonne réponse lui inflige des dégâts massifs !',
        locationName: 'L’Arène du Crépuscule',
        environmentEmoji: '👑',
        type: 'boss_fight',
        heroCompanionId: 'chien',
        completed: false,
        score: 0,
        stars: 0,
        boss: {
          id: 'boss_sphinx',
          name: 'Sphinx des Équations',
          title: 'Dévoreur d’Incertitudes',
          emoji: '🦁',
          avatarBg: 'from-amber-600 to-rose-700',
          maxHp: 1000,
          tauntPhrase: '« Tu penses maîtriser les maths ? Mes énigmes vont broyer ta confiance ! »',
          defeatPhrase: '« Arghhh ! Tes animaux et ta rigueur m’ont vaincu... la Forêt est libre ! »',
          weaknessDescription: 'Vulnérable aux identités remarquables et au calcul rapide.',
        },
        tasks: [
          {
            id: 'b_1',
            type: 'question',
            prompt: 'Développe (2x + 3)². Quelle est la forme correcte ?',
            options: ['4x² + 12x + 9', '4x² + 6x + 9', '4x² + 9', '2x² + 12x + 9'],
            correctIndex: 0,
            explanation: 'Identité remarquable (a + b)² = a² + 2ab + b². Ici (2x)² + 2*(2x)*3 + 3² = 4x² + 12x + 9.',
            animalCommentary: {
              chien: 'Wouf ! Coup critique ! Le Sphinx vacille (-350 PV) !',
            },
            points: 250,
            timeLimitSeconds: 35,
          },
          {
            id: 'b_2',
            type: 'question',
            prompt: 'Si le périmètre d’un rectangle est de 34 cm et sa largeur est 7 cm, quelle est sa longueur ?',
            options: ['10 cm', '13 cm', '20 cm', '17 cm'],
            correctIndex: 0,
            explanation: 'Demi-périmètre = 34 ÷ 2 = 17 cm. Longueur = 17 - 7 = 10 cm.',
            animalCommentary: {
              hibou: 'Kipo plonge en piqué ! Attaque magique sur le Sphinx (-350 PV) !',
            },
            points: 250,
            timeLimitSeconds: 30,
          },
          {
            id: 'b_3',
            type: 'question',
            prompt: 'Quelle est la probabilité d’obtenir un nombre pair en lançant un dé classique à 6 faces ?',
            options: ['1/2 (ou 50%)', '1/3', '2/3', '1/6'],
            correctIndex: 0,
            explanation: 'Les faces paires sont {2, 4, 6}, soit 3 issues favorables sur 6 : 3/6 = 1/2.',
            animalCommentary: {
              chat: 'Miko porte le coup de grâce avec ses griffes scintillantes (-300 PV) ! KO DU BOSS !',
            },
            points: 300,
            timeLimitSeconds: 30,
          },
        ],
      },
    ],
  },
  {
    id: 'preset-science-mystery',
    title: 'Le Sanctuaire des Sciences & de la Vie',
    universeName: 'Le Temple Antique des Énigmes',
    subject: 'Sciences, Biologie & Univers',
    conceptSummary: 'Explore les secrets des cellules, de la photosynthèse, de l’énergie et des planètes avec l’escouade KIPO !',
    targetLevel: 'college',
    storyline: 'Le Gardien de l’Entropie a plongé le temple dans l’obscurité. Résous les énigmes scientifiques avec Rocky et Finn pour rallumer les étoiles !',
    leadAnimalId: 'renard',
    rewards: {
      badgeName: 'Orbe de la Connaissance Céleste',
      badgeEmoji: '🔬',
      totalXp: 500,
      trophyDescription: 'A maîtrisé les grands principes des sciences de la nature !',
    },
    createdAt: new Date().toISOString(),
    missions: [
      {
        id: 'm1_sci',
        order: 1,
        title: 'Mission 1 : Le Mystère de la Cellule Vivante',
        storyIntro: 'Rocky flaire une trace intrigante dans le laboratoire abandonné. Découvre les rouages du vivant !',
        locationName: 'L’Atelier Botanique',
        environmentEmoji: '🌿',
        type: 'speed_trivia',
        heroCompanionId: 'chien',
        completed: false,
        score: 0,
        stars: 0,
        tasks: [
          {
            id: 's1_1',
            type: 'question',
            prompt: 'Quel organite cellulaire est surnommé la "centrale énergétique" de la cellule ?',
            options: ['La mitochondrie', 'Le ribosome', 'Le chloroplaste', 'L’appareil de Golgi'],
            correctIndex: 0,
            explanation: 'La mitochondrie produit l’ATP (énergie cellulaire) via la respiration cellulaire.',
            animalCommentary: {
              chien: 'Wouf ! Une énergie débordante, exactement comme moi quand je cours !',
            },
            points: 150,
            timeLimitSeconds: 30,
          },
          {
            id: 's1_2',
            type: 'question',
            prompt: 'Que libèrent principalement les plantes vertes lors de la photosynthèse en présence de lumière ?',
            options: ['Du dioxygène (O₂)', 'Du dioxyde de carbone (CO₂)', 'Du méthane', 'De l’azote'],
            correctIndex: 0,
            explanation: 'Elles absorbent du CO₂ et de l’eau pour fabriquer du glucose en rejetant du dioxygène (O₂).',
            animalCommentary: {
              hibou: 'Un souffle d’air pur pour toute la planète !',
            },
            points: 150,
            timeLimitSeconds: 30,
          },
        ],
      },
      {
        id: 'm2_sci',
        order: 2,
        title: 'Mission 2 : L’Odyssée Cosmique avec Finn',
        storyIntro: 'Finn le Renard pointe sa longue-vue vers les astres. Les constellations nous guident !',
        locationName: 'L’Observatoire Stellaire',
        environmentEmoji: '✨',
        type: 'speed_trivia',
        heroCompanionId: 'renard',
        completed: false,
        score: 0,
        stars: 0,
        tasks: [
          {
            id: 's2_1',
            type: 'question',
            prompt: 'Quelle est la planète la plus volumineuse du système solaire ?',
            options: ['Jupiter', 'Saturne', 'Neptune', 'Mars'],
            correctIndex: 0,
            explanation: 'Jupiter est la géante gazeuse la plus massive, plus de 1300 fois le volume de la Terre !',
            animalCommentary: {
              renard: 'Un colosse de l’espace, mais ta sagacité est encore plus grande !',
            },
            points: 200,
            timeLimitSeconds: 25,
          },
        ],
      },
      {
        id: 'm3_sci',
        order: 3,
        title: 'Combat Ultime : Le Golem de l’Ignorance',
        storyIntro: 'Le Golem de pierre volcanique se dresse devant le sanctuaire. Seule la vérité scientifique peut briser sa carapace !',
        locationName: 'La Chambre Magmatique',
        environmentEmoji: '🌋',
        type: 'boss_fight',
        heroCompanionId: 'hibou',
        completed: false,
        score: 0,
        stars: 0,
        boss: {
          id: 'boss_golem',
          name: 'Le Golem de l’Ignorance',
          title: 'Colosse Obscur',
          emoji: '🗿',
          avatarBg: 'from-stone-700 to-red-800',
          maxHp: 900,
          tauntPhrase: '« La matière n’obéit qu’à ma force brute ! Rien ne peut percer ma roche ! »',
          defeatPhrase: '« Craaac ! La science et la raison ont fissuré mon armure... Je m’effondre ! »',
          weaknessDescription: 'Sensible aux lois de la physique et à la chimie élémentaire.',
        },
        tasks: [
          {
            id: 'sb_1',
            type: 'question',
            prompt: 'Quelle est la vitesse approximative de la lumière dans le vide ?',
            options: ['300 000 km/s', '30 000 km/s', '3 000 000 km/s', '340 m/s'],
            correctIndex: 0,
            explanation: 'La constante c vaut exactement 299 792 458 m/s, soit environ 300 000 kilomètres par seconde.',
            animalCommentary: {
              chat: 'Plus rapide que la lumière ! Coup de foudre sur le Golem (-300 PV) !',
            },
            points: 250,
            timeLimitSeconds: 30,
          },
          {
            id: 'sb_2',
            type: 'question',
            prompt: 'Quelle particule atomique possède une charge électrique négative ?',
            options: ['L’électron', 'Le proton', 'Le neutron', 'Le photon'],
            correctIndex: 0,
            explanation: 'L’électron porte une charge négative (-e), le proton est positif et le neutron est neutre.',
            animalCommentary: {
              chien: 'Bouclier de protons chargé ! Électrocution du boss (-300 PV) !',
            },
            points: 250,
            timeLimitSeconds: 30,
          },
          {
            id: 'sb_3',
            type: 'question',
            prompt: 'À quelle température l’eau pure bout-elle sous la pression atmosphérique normale au niveau de la mer ?',
            options: ['100 °C', '0 °C', '80 °C', '120 °C'],
            correctIndex: 0,
            explanation: 'Le point d’ébullition de l’eau à 1 atm est de 100 °C (ou 373,15 K).',
            animalCommentary: {
              souris: 'Le Golem bouillonne et part en vapeur ! VICTOIRE SCIENTIFIQUE !',
            },
            points: 300,
            timeLimitSeconds: 30,
          },
        ],
      },
    ],
  },
  {
    id: 'preset-language-quest',
    title: 'Le Royaume des Mots & des Légendes',
    universeName: 'Le Royaume Médiéval des Savoirs',
    subject: 'Français, Orthographe & Récits',
    conceptSummary: 'Maîtrise la grammaire, les figures de style et le vocabulaire d’élite pour délivrer le Grimoire Sacré !',
    targetLevel: 'college',
    storyline: 'Le Dragon des Fautes de Français a dévoré les parchemins royaux. Avec Miko et Pip, rétablis la beauté de la langue !',
    leadAnimalId: 'chat',
    rewards: {
      badgeName: 'Plume d’Or des Écrivains',
      badgeEmoji: '📜',
      totalXp: 450,
      trophyDescription: 'A défendu la langue française et vaincu le Dragon des Fautes !',
    },
    createdAt: new Date().toISOString(),
    missions: [
      {
        id: 'm1_fr',
        order: 1,
        title: 'Mission 1 : Le Pont des Homophones',
        storyIntro: 'Chaque pas sur le pont suspendu exige d’éviter les pièges d’orthographe !',
        locationName: 'Les Passerelles Suspendues',
        environmentEmoji: '🌉',
        type: 'speed_trivia',
        heroCompanionId: 'chat',
        completed: false,
        score: 0,
        stars: 0,
        tasks: [
          {
            id: 'fr1_1',
            type: 'question',
            prompt: 'Complète correctement : "Les oiseaux que nous avons [...] voler vers le sud."',
            options: ['vus', 'vu', 'vues', 'vuent'],
            correctIndex: 0,
            explanation: 'Le COD "que" (mis pour "les oiseaux", masculin pluriel) est placé avant le verbe avoir : accord au masculin pluriel "vus".',
            animalCommentary: {
              chat: 'Miaou ! L’accord du participe passé avec avoir, quelle élégance !',
            },
            points: 150,
            timeLimitSeconds: 30,
          },
        ],
      },
      {
        id: 'm2_fr',
        order: 2,
        title: 'Combat Ultime : Le Dragon des Fautes',
        storyIntro: 'Le Dragon crache des accords mal faits ! Seul ton vocabulaire affûté peut calmer sa colère.',
        locationName: 'La Salle du Trône Écroulé',
        environmentEmoji: '🏰',
        type: 'boss_fight',
        heroCompanionId: 'hibou',
        completed: false,
        score: 0,
        stars: 0,
        boss: {
          id: 'boss_dragon',
          name: 'Le Dragon des Fautes',
          title: 'Tyran des Solécismes',
          emoji: '🐲',
          avatarBg: 'from-purple-700 to-indigo-900',
          maxHp: 800,
          tauntPhrase: '« Vos accords sont bancals, votre syntaxe est fragile ! Vous allez brûler ! »',
          defeatPhrase: '« Une telle maîtrise des lettres... Je m’incline devant tant de poésie ! »',
          weaknessDescription: 'Sensible aux figures de style et à la concordance des temps.',
        },
        tasks: [
          {
            id: 'frb_1',
            type: 'question',
            prompt: 'Quelle figure de style est employée dans : "Cette obscure clarté qui tombe des étoiles" ?',
            options: ['Un oxymore', 'Une métaphore', 'Une anaphore', 'Une litote'],
            correctIndex: 0,
            explanation: 'L’oxymore juxtapose deux termes opposés ("obscure" et "clarté") pour créer une image poétique saisissante (Corneille).',
            animalCommentary: {
              hibou: 'Corneille lui-même approuve ! Le Dragon prend un coup de plume (-400 PV) !',
            },
            points: 250,
            timeLimitSeconds: 30,
          },
          {
            id: 'frb_2',
            type: 'question',
            prompt: 'Quel temps du subjonctif trouve-t-on dans : "Il fallait que nous prissions une décision" ?',
            options: ['Subjonctif imparfait', 'Subjonctif présent', 'Subjonctif plus-que-parfait', 'Conditionnel'],
            correctIndex: 0,
            explanation: '"Que nous prissions" est la 1ère personne du pluriel du subjonctif imparfait du verbe prendre.',
            animalCommentary: {
              souris: 'Sublime ! Le dragon est charmé et s’endort paisiblement (-400 PV) ! VICTOIRE ROYALE !',
            },
            points: 250,
            timeLimitSeconds: 30,
          },
        ],
      },
    ],
  },
];

export function ensureMissionHas5Tasks(
  mission: GameMission,
  missionIndex: number,
  subject: string,
  fallbackSeeds: GameMissionTask[] = []
): GameMission {
  const currentTasks = Array.isArray(mission.tasks) ? [...mission.tasks] : [];
  const subjectName = subject || 'la leçon';

  const defaultArchetypes = [
    {
      label: 'Fondement & Définition',
      difficulty: 'facile' as const,
      time: 60,
      prompt: `Quelle est la règle essentielle ou la définition fondamentale concernant ${subjectName} ?`,
      options: [
        `Identifier méthodiquement les hypothèses et appliquer la démarche pas à pas`,
        `Répondre au hasard sans vérifier la cohérence des résultats`,
        `Confondre les causes et ignorer les étapes intermédiaires`,
        `Abandonner face à la difficulté apparente`,
      ],
      explanation: `Sur ${subjectName}, la rigueur d'analyse et le respect de chaque étape intermédiaire permettent d'éviter les erreurs et de triompher !`,
    },
    {
      label: 'Application & Calcul Pratique',
      difficulty: 'difficile' as const,
      time: 120,
      prompt: `Dans la pratique au Palier ${missionIndex}, comment applique-t-on la méthode pour résoudre un cas concret sur ${subjectName} ?`,
      options: [
        `Poser clairement les formules, convertir les unités et vérifier le calcul`,
        `Faire une estimation vague sans poser les calculs précis`,
        `Oublier la formule de base et inventer un résultat approximatif`,
        `Changer les unités au hasard sans facteur multiplicateur`,
      ],
      explanation: `L'application méthodique et la vérification des unités assurent un résultat juste et sans faille.`,
    },
    {
      label: 'Piège Fréquent & Contre-Exemple',
      difficulty: 'facile' as const,
      time: 60,
      prompt: `Quel piège classique ou fausse idée reçue faut-il absolument déjouer sur ${subjectName} ?`,
      options: [
        `Garder son esprit critique et tester les cas particuliers ou contre-exemples`,
        `Généraliser une impression sans démonstration rigoureuse`,
        `Négliger les exceptions et les conditions d'application`,
        `Confondre corrélation et causalité directe`,
      ],
      explanation: `Tester des contre-exemples permet de démasquer immédiatement les fausses évidences !`,
    },
    {
      label: 'Raisonnement & Déduction Logique',
      difficulty: 'difficile' as const,
      time: 120,
      prompt: `Si l'on analyse une situation complexe au Palier ${missionIndex}, quelle déduction rigoureuse s'impose sur ${subjectName} ?`,
      options: [
        `Décomposer le problème complexe en sous-questions simples et indépendantes`,
        `Essayer de tout résoudre d'un seul bloc sans structuration`,
        `Supposer le résultat déjà acquis avant d'avoir prouvé les étapes`,
        `Prendre le premier résultat intermédiaire comme réponse finale`,
      ],
      explanation: `La décomposition méthodique cartésienne permet de surmonter tous les problèmes épineux.`,
    },
    {
      label: 'Synthèse & Règle d’Or',
      difficulty: 'difficile' as const,
      time: 120,
      prompt: `Quelle conclusion générale et astuce d'expert résume le mieux la démarche gagnante sur ${subjectName} ?`,
      options: [
        `Relire soigneusement la consigne, encadrer le résultat et vérifier la vraisemblance`,
        `Rendre sa copie le plus vite possible sans relecture`,
        `Ignorer la question posée si le calcul semble élégant`,
        `Ne jamais vérifier la cohérence physique ou logique du résultat`,
      ],
      explanation: `La vérification finale et la relecture de la consigne garantissent le score maximal de 100% !`,
    },
  ];

  // While currentTasks has fewer than 5 tasks, pad with seed tasks or archetype tasks
  for (let t = currentTasks.length; t < 5; t++) {
    const seed = fallbackSeeds.length > 0 ? fallbackSeeds[t % fallbackSeeds.length] : null;
    const arch = defaultArchetypes[t % defaultArchetypes.length];

    if (seed && seed.prompt && Array.isArray(seed.options) && seed.options.length >= 2) {
      currentTasks.push({
        ...seed,
        id: `m${missionIndex}_t${t + 1}`,
      });
    } else {
      currentTasks.push({
        id: `m${missionIndex}_t${t + 1}`,
        type: 'question',
        prompt: `${arch.prompt} (${arch.label})`,
        options: arch.options,
        correctIndex: 0,
        explanation: arch.explanation,
        animalCommentary: {
          hibou: 'Parfaitement raisonné, la sagesse triomphe !',
          chat: 'Miaou ! Rapide et précis comme une griffe !',
          chien: 'Wouf ! Une fidélité absolue à la méthode !',
          souris: 'C’est dans la boîte, aucun détail ne t’échappe !',
          renard: 'Coup de maître digne des plus grands stratèges !',
        },
        points: arch.difficulty === 'difficile' ? 250 : 150,
        difficulty: arch.difficulty,
        timeLimitSeconds: arch.time,
      });
    }
  }

  // Ensure all 5 tasks have valid 4 options and valid properties
  const validatedTasks: GameMissionTask[] = currentTasks.slice(0, 5).map((task, idx) => {
    const safeOptions = Array.isArray(task.options) && task.options.length >= 2
      ? task.options
      : defaultArchetypes[idx % 5].options;
    const safeCorrectIndex =
      typeof task.correctIndex === 'number' &&
      task.correctIndex >= 0 &&
      task.correctIndex < safeOptions.length
        ? task.correctIndex
        : 0;
    const isDiff =
      task.difficulty === 'difficile' ||
      (task.timeLimitSeconds || 60) > 60 ||
      idx % 2 === 1;

    return {
      ...task,
      id: task.id || `m${missionIndex}_t${idx + 1}`,
      type: 'question',
      prompt: task.prompt || `Défi ${idx + 1} du Palier ${missionIndex} sur ${subjectName}`,
      options: safeOptions,
      correctIndex: safeCorrectIndex,
      explanation: task.explanation || `Explication détaillée de la méthode sur ${subjectName}.`,
      difficulty: isDiff ? 'difficile' : 'facile',
      timeLimitSeconds: isDiff ? 120 : 60,
      points: isDiff ? 250 : 150,
    };
  });

  return {
    ...mission,
    tasks: validatedTasks,
  };
}

export function expandGameTo100Missions(baseGame: AnimalAdventureGame): AnimalAdventureGame {
  const existingMissions = baseGame.missions || [];
  const seedTasks: GameMissionTask[] = [];
  existingMissions.forEach((m) => {
    if (m.tasks) seedTasks.push(...m.tasks);
  });

  if (baseGame.missions && baseGame.missions.length >= 100) {
    const fixedMissions = baseGame.missions.map((m, idx) =>
      ensureMissionHas5Tasks(m, idx + 1, baseGame.subject || 'Savoirs', seedTasks)
    );
    return {
      ...baseGame,
      missions: fixedMissions,
    };
  }

  const companions: AnimalCharacterId[] = ['hibou', 'chat', 'chien', 'souris', 'renard'];
  const fullMissions: GameMission[] = [];

  const chapterThemes = [
    { name: "L'Éveil des Connaissances", icon: '🌱' },
    { name: "Le Défi des Réflexes de Miko", icon: '⚡' },
    { name: "Le Terrier aux Énigmes de Pip", icon: '🔍' },
    { name: "Le Bastion de Courage de Rocky", icon: '🛡️' },
    { name: "Le Sanctuaire Céleste de Finn", icon: '✨' },
    { name: "Le Labyrinthe des Pièges & Contre-Exemples", icon: '🧩' },
    { name: "La Vallée des Grands Théorèmes", icon: '📜' },
    { name: "L'Arène des Étoiles & Défi Chrono", icon: '⭐' },
    { name: "La Citadelle des Maîtres", icon: '🏰' },
    { name: "L'Épreuve Ultime du 100ème Palier", icon: '👑' },
  ];

  for (let i = 1; i <= 100; i++) {
    const chapterIndex = Math.min(9, Math.floor((i - 1) / 10));
    const chapterTheme = chapterThemes[chapterIndex];
    const isBoss = i % 10 === 0;
    const companionId = companions[(i - 1) % companions.length];

    // Exactly 5 distinct questions per mission as requested by user
    const missionTasks: GameMissionTask[] = [];
    const taskCount = 5;

    const questionArchetypes = [
      {
        typeKey: 'definition',
        label: 'Fondement & Définition',
        difficulty: 'facile' as const,
        time: 60,
        promptPrefix: (subj: string) => `Quelle est la règle essentielle ou la définition fondamentale concernant ${subj} ?`,
      },
      {
        typeKey: 'application',
        label: 'Application & Calcul Pratique',
        difficulty: 'difficile' as const,
        time: 120,
        promptPrefix: (subj: string) => `Dans la pratique au Palier ${i}, comment applique-t-on la méthode pour résoudre un cas concret sur ${subj} ?`,
      },
      {
        typeKey: 'piege',
        label: 'Piège Fréquent & Contre-Exemple',
        difficulty: 'facile' as const,
        time: 60,
        promptPrefix: (subj: string) => `Quel piège classique ou fausse idée reçue faut-il absolument déjouer sur ${subj} ?`,
      },
      {
        typeKey: 'deduction',
        label: 'Raisonnement & Déduction Logique',
        difficulty: 'difficile' as const,
        time: 120,
        promptPrefix: (subj: string) => `Si l'on analyse une situation complexe au Palier ${i}, quelle déduction rigoureuse s'impose sur ${subj} ?`,
      },
      {
        typeKey: 'synthese',
        label: 'Synthèse & Règle d’Or',
        difficulty: (isBoss ? 'difficile' : 'facile') as 'facile' | 'difficile',
        time: isBoss ? 120 : 60,
        promptPrefix: (subj: string) => `Quelle conclusion générale et astuce d'expert résume le mieux la démarche gagnante sur ${subj} ?`,
      },
    ];

    for (let t = 0; t < taskCount; t++) {
      const arch = questionArchetypes[t];
      const isDifficult = arch.difficulty === 'difficile';
      const timeLimitSeconds = arch.time;
      const difficulty = arch.difficulty;

      // Use seed task if available, or generate a customized question variation
      const seedTaskIndex = (i * 5 + t) % (seedTasks.length || 1);
      const seedTask = seedTasks.length > 0 ? seedTasks[seedTaskIndex] : null;

      if (seedTask && t < 2) {
        missionTasks.push({
          id: `m${i}_t${t + 1}`,
          type: 'question',
          prompt: seedTask.prompt,
          options: seedTask.options,
          correctIndex: seedTask.correctIndex,
          explanation: seedTask.explanation,
          animalCommentary: seedTask.animalCommentary,
          points: isDifficult ? 250 : 150,
          difficulty,
          timeLimitSeconds,
        });
      } else {
        const customPrompt = arch.promptPrefix(baseGame.subject);
        missionTasks.push({
          id: `m${i}_t${t + 1}`,
          type: 'question',
          prompt: `${customPrompt} (${arch.label})`,
          options: [
            `Identifier méthodiquement les hypothèses et appliquer la démarche pas à pas`,
            `Répondre au hasard sans vérifier la cohérence des résultats`,
            `Confondre les causes et ignorer les étapes intermédiaires`,
            `Abandonner face à la difficulté apparente`,
          ],
          correctIndex: 0,
          explanation: `Sur ${baseGame.subject}, la rigueur d'analyse et le respect de chaque étape intermédiaire permettent d'éviter les erreurs et de triompher !`,
          animalCommentary: {
            hibou: 'Parfaitement raisonné, la sagesse triomphe !',
            chat: 'Miaou ! Rapide et précis comme une griffe !',
            chien: 'Wouf ! Une fidélité absolue à la méthode !',
            souris: 'C’est dans la boîte, aucun détail ne t’échappe !',
            renard: 'Coup de maître digne des plus grands stratèges !',
          },
          points: isDifficult ? 250 : 150,
          difficulty,
          timeLimitSeconds,
        });
      }
    }

    fullMissions.push({
      id: `m_${i}`,
      order: i,
      title: isBoss
        ? `Palier ${i} : Combat de Boss de Chapitre`
        : `Mission ${i} : ${chapterTheme.name} (Étape ${(i - 1) % 10 + 1}/10)`,
      storyIntro: isBoss
        ? `Le Boss du Palier ${i} se dresse ! Tu dois réussir au moins 3 questions sur 5 pour débloquer le palier suivant !`
        : `Avance dans le chapitre ${chapterIndex + 1} avec ton équipe d'animaux. 5 questions t'attendent !`,
      locationName: `${chapterTheme.name} - Zone ${(i - 1) % 10 + 1}`,
      environmentEmoji: isBoss ? '👑' : chapterTheme.icon,
      type: isBoss ? 'boss_fight' : 'speed_trivia',
      heroCompanionId: companionId,
      boss: isBoss
        ? {
            id: `boss_${i}`,
            name: i === 100
              ? 'Le Titan Suprême des 100 Savoirs'
              : `Gardien Colossal du Palier ${i}`,
            title: i === 100
              ? 'Maître Absolu de la Connaissance KIPO'
              : `Seigneur du Chapitre ${chapterIndex + 1}`,
            emoji: i === 100 ? '👹' : i % 20 === 0 ? '🐲' : '🦁',
            avatarBg: i === 100 ? 'from-purple-700 to-rose-900' : 'from-amber-600 to-red-700',
            maxHp: 800 + i * 10,
            tauntPhrase: `Tu as atteint le Palier ${i}, mais ce Boss ne te laissera pas passer sans trouver au moins 3 bonnes réponses !`,
            defeatPhrase: `Incroyable... Ta détermination au Palier ${i} est totale ! Gloire à toi et à tes animaux !`,
            weaknessDescription: 'Vulnérable aux raisonnements rigoureux et aux réponses précises.',
          }
        : undefined,
      tasks: missionTasks,
      completed: false,
      score: 0,
      stars: 0,
    });
  }

  return {
    ...baseGame,
    missions: fullMissions,
  };
}

const STORAGE_GAMES_KEY = 'kipo_animal_adventure_games_v2';
const STORAGE_GAME_PROGRESS_KEY = 'kipo_animal_games_progress_v2';

let cachedGamesList: AnimalAdventureGame[] | null = null;
let cachedUserId: string | null = null;

export class GameService {
  public getGames(): AnimalAdventureGame[] {
    const currentUid = getActiveUserId();
    if (cachedGamesList && cachedGamesList.length > 0 && cachedUserId === currentUid) {
      return cachedGamesList;
    }

    try {
      const data = getItemScoped(STORAGE_GAMES_KEY);
      if (data) {
        const parsed: AnimalAdventureGame[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all games are expanded to 100 missions with 5 tasks
          const upgraded = parsed.map((g) => expandGameTo100Missions(g));
          const customIds = new Set(upgraded.map((g: any) => g.id));
          const missingPresets = PRESET_ANIMAL_GAMES.map((p) => expandGameTo100Missions(p)).filter(
            (p) => !customIds.has(p.id)
          );
          cachedGamesList = [...upgraded, ...missingPresets];
          cachedUserId = currentUid;
          return cachedGamesList;
        }
      }
    } catch {}

    cachedGamesList = PRESET_ANIMAL_GAMES.map((p) => expandGameTo100Missions(p));
    cachedUserId = currentUid;
    return cachedGamesList;
  }

  public saveGame(game: AnimalAdventureGame): void {
    try {
      const expanded = expandGameTo100Missions(game);
      const existing = this.getGames();
      const filtered = existing.filter((g) => g.id !== expanded.id);
      filtered.unshift(expanded);
      setItemScoped(STORAGE_GAMES_KEY, JSON.stringify(filtered));
      cachedGamesList = filtered;
      cachedUserId = getActiveUserId();
    } catch {}
  }

  public getGameById(id: string): AnimalAdventureGame | undefined {
    return this.getGames().find((g) => g.id === id);
  }

  public deleteGame(id: string): void {
    try {
      const existing = this.getGames().filter((g) => g.id !== id);
      setItemScoped(STORAGE_GAMES_KEY, JSON.stringify(existing));
      cachedGamesList = existing;
      cachedUserId = getActiveUserId();
    } catch {}
  }

  // Saves mission result and unlocks next mission if correctCount >= 3 (max 2 errors)
  public saveMissionResult(
    gameId: string,
    missionId: string,
    stars: number,
    score: number,
    correctCount: number = 3
  ): void {
    try {
      const progressStr = getItemScoped(STORAGE_GAME_PROGRESS_KEY) || '{}';
      const progress = JSON.parse(progressStr);
      if (!progress[gameId]) progress[gameId] = {};
      const prev = progress[gameId][missionId] || { stars: 0, score: 0, correctCount: 0, passed: false };

      const isPassed = correctCount >= 3;

      progress[gameId][missionId] = {
        completed: isPassed ? true : (prev.completed || false),
        passed: isPassed || prev.passed || false,
        stars: isPassed ? Math.max(prev.stars || 0, stars) : (prev.stars || 0),
        score: Math.max(prev.score || 0, score),
        correctCount: Math.max(prev.correctCount || 0, correctCount),
        lastPlayed: new Date().toISOString(),
      };
      setItemScoped(STORAGE_GAME_PROGRESS_KEY, JSON.stringify(progress));
    } catch {}
  }

  public getGameProgress(
    gameId: string
  ): Record<string, { completed: boolean; passed?: boolean; stars: number; score: number; correctCount?: number }> {
    try {
      const progressStr = getItemScoped(STORAGE_GAME_PROGRESS_KEY) || '{}';
      const progress = JSON.parse(progressStr);
      return progress[gameId] || {};
    } catch {
      return {};
    }
  }

  public async generateGameWithAI(payload: {
    problemOrTopic: string;
    files?: Array<{ name: string; mimeType: string; data: string; type: string }>;
    universe?: 'foret' | 'temple' | 'espace' | 'royaume';
    level?: string;
    language?: string;
  }): Promise<AnimalAdventureGame> {
    const res = await fetch('/api/game/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la génération du jeu avec l’IA.');
    }

    const data = await res.json();
    if (!data.game) throw new Error('Format de jeu invalide reçu du serveur.');

    const expanded = expandGameTo100Missions(data.game);
    this.saveGame(expanded);
    return expanded;
  }
}

export const gameService = new GameService();

