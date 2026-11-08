export interface LanguageOption {
  code: string;
  name: string; // French name
  nativeName: string; // Name in its native script
  flag: string; // Flag emoji
  region: 'populaire' | 'afrique' | 'europe' | 'asie' | 'moyen-orient' | 'ameriques' | 'oceanie' | 'autre';
}

export const WORLD_LANGUAGES: LanguageOption[] = [
  // --- LANGUES POPULAIRES ET MONDIALES ---
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', region: 'populaire' },
  { code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧', region: 'populaire' },
  { code: 'es', name: 'Espagnol', nativeName: 'Español', flag: '🇪🇸', region: 'populaire' },
  { code: 'ar', name: 'Arabe', nativeName: 'العربية', flag: '🇸🇦', region: 'populaire' },
  { code: 'zh-CN', name: 'Chinois (Simplifié)', nativeName: '简体中文', flag: '🇨🇳', region: 'populaire' },
  { code: 'zh-TW', name: 'Chinois (Traditionnel)', nativeName: '繁體中文', flag: '🇹🇼', region: 'populaire' },
  { code: 'de', name: 'Allemand', nativeName: 'Deutsch', flag: '🇩🇪', region: 'populaire' },
  { code: 'pt', name: 'Portugais', nativeName: 'Português', flag: '🇵🇹', region: 'populaire' },
  { code: 'ru', name: 'Russe', nativeName: 'Русский', flag: '🇷🇺', region: 'populaire' },
  { code: 'ja', name: 'Japonais', nativeName: '日本語', flag: '🇯🇵', region: 'populaire' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', region: 'populaire' },
  { code: 'it', name: 'Italien', nativeName: 'Italiano', flag: '🇮🇹', region: 'populaire' },
  { code: 'ko', name: 'Coréen', nativeName: '한국어', flag: '🇰🇷', region: 'populaire' },
  { code: 'tr', name: 'Turc', nativeName: 'Türkçe', flag: '🇹🇷', region: 'populaire' },

  // --- AFRIQUE (Langues africaines majeures) ---
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇹🇿', region: 'afrique' },
  { code: 'ha', name: 'Haoussa', nativeName: 'Harshen Hausa', flag: '🇳🇬', region: 'afrique' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Èdè Yorùbá', flag: '🇳🇬', region: 'afrique' },
  { code: 'ig', name: 'Igbo', nativeName: 'Asụsụ Igbo', flag: '🇳🇬', region: 'afrique' },
  { code: 'am', name: 'Amharique', nativeName: 'አማርኛ', flag: '🇪🇹', region: 'afrique' },
  { code: 'om', name: 'Oromo', nativeName: 'Afaan Oromoo', flag: '🇪🇹', region: 'afrique' },
  { code: 'so', name: 'Somali', nativeName: 'Af-Soomaali', flag: '🇸🇴', region: 'afrique' },
  { code: 'zu', name: 'Zoulou', nativeName: 'isiZulu', flag: '🇿🇦', region: 'afrique' },
  { code: 'xh', name: 'Xhosa', nativeName: 'isiXhosa', flag: '🇿🇦', region: 'afrique' },
  { code: 'mg', name: 'Malgache', nativeName: 'Malagasy', flag: '🇲🇬', region: 'afrique' },
  { code: 'rw', name: 'Kinyarwanda', nativeName: 'Ikinyarwanda', flag: '🇷🇼', region: 'afrique' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼', region: 'afrique' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', region: 'afrique' },
  { code: 'bm', name: 'Bambara', nativeName: 'Bamanankan', flag: '🇲🇱', region: 'afrique' },
  { code: 'wo', name: 'Wolof', nativeName: 'Wolof', flag: '🇸🇳', region: 'afrique' },
  { code: 'ti', name: 'Tigrigna', nativeName: 'ትግርኛ', flag: '🇪🇷', region: 'afrique' },
  { code: 'st', name: 'Sesotho', nativeName: 'Sesotho', flag: '🇱🇸', region: 'afrique' },
  { code: 'tn', name: 'Setswana', nativeName: 'Setswana', flag: '🇧🇼', region: 'afrique' },
  { code: 'ny', name: 'Chichewa', nativeName: 'ChiCheŵa', flag: '🇲🇼', region: 'afrique' },
  { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans', flag: '🇿🇦', region: 'afrique' },

  // --- EUROPE ---
  { code: 'nl', name: 'Néerlandais', nativeName: 'Nederlands', flag: '🇳🇱', region: 'europe' },
  { code: 'pl', name: 'Polonais', nativeName: 'Polski', flag: '🇵🇱', region: 'europe' },
  { code: 'uk', name: 'Ukrainien', nativeName: 'Українська', flag: '🇺🇦', region: 'europe' },
  { code: 'el', name: 'Grec', nativeName: 'Ελληνικά', flag: '🇬🇷', region: 'europe' },
  { code: 'cs', name: 'Tchèque', nativeName: 'Čeština', flag: '🇨🇿', region: 'europe' },
  { code: 'sv', name: 'Suédois', nativeName: 'Svenska', flag: '🇸🇪', region: 'europe' },
  { code: 'ro', name: 'Roumain', nativeName: 'Română', flag: '🇷🇴', region: 'europe' },
  { code: 'hu', name: 'Hongrois', nativeName: 'Magyar', flag: '🇭🇺', region: 'europe' },
  { code: 'da', name: 'Danois', nativeName: 'Dansk', flag: '🇩🇰', region: 'europe' },
  { code: 'fi', name: 'Finnois', nativeName: 'Suomi', flag: '🇫🇮', region: 'europe' },
  { code: 'no', name: 'Norvégien', nativeName: 'Norsk', flag: '🇳🇴', region: 'europe' },
  { code: 'sk', name: 'Slovaque', nativeName: 'Slovenčina', flag: '🇸🇰', region: 'europe' },
  { code: 'bg', name: 'Bulgare', nativeName: 'Български', flag: '🇧🇬', region: 'europe' },
  { code: 'hr', name: 'Croate', nativeName: 'Hrvatski', flag: '🇭🇷', region: 'europe' },
  { code: 'sr', name: 'Serbe', nativeName: 'Српски', flag: '🇷🇸', region: 'europe' },
  { code: 'sl', name: 'Slovène', nativeName: 'Slovenščina', flag: '🇸🇮', region: 'europe' },
  { code: 'lt', name: 'Lituanien', nativeName: 'Lietuvių', flag: '🇱🇹', region: 'europe' },
  { code: 'lv', name: 'Letton', nativeName: 'Latviešu', flag: '🇱🇻', region: 'europe' },
  { code: 'et', name: 'Estonien', nativeName: 'Eesti', flag: '🇪🇪', region: 'europe' },
  { code: 'ga', name: 'Irlandais', nativeName: 'Gaeilge', flag: '🇮🇪', region: 'europe' },
  { code: 'cy', name: 'Gallois', nativeName: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', region: 'europe' },
  { code: 'sq', name: 'Albanais', nativeName: 'Shqip', flag: '🇦🇱', region: 'europe' },
  { code: 'mk', name: 'Macédonien', nativeName: 'Македонски', flag: '🇲🇰', region: 'europe' },
  { code: 'is', name: 'Islandais', nativeName: 'Íslenska', flag: '🇮🇸', region: 'europe' },
  { code: 'mt', name: 'Maltais', nativeName: 'Malti', flag: '🇲🇹', region: 'europe' },
  { code: 'be', name: 'Biélorusse', nativeName: 'Беларуская', flag: '🇧🇾', region: 'europe' },
  { code: 'bs', name: 'Bosniaque', nativeName: 'Bosanski', flag: '🇧🇦', region: 'europe' },
  { code: 'ca', name: 'Catalan', nativeName: 'Català', flag: '🇪🇸', region: 'europe' },
  { code: 'eu', name: 'Basque', nativeName: 'Euskara', flag: '🇪🇸', region: 'europe' },
  { code: 'gl', name: 'Galicien', nativeName: 'Galego', flag: '🇪🇸', region: 'europe' },
  { code: 'lb', name: 'Luxembourgeois', nativeName: 'Lëtzebuergesch', flag: '🇱🇺', region: 'europe' },

  // --- ASIE ---
  { code: 'vi', name: 'Vietnamien', nativeName: 'Tiếng Việt', flag: '🇻🇳', region: 'asie' },
  { code: 'th', name: 'Thaï', nativeName: 'ไทย', flag: '🇹🇭', region: 'asie' },
  { code: 'id', name: 'Indonésien', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', region: 'asie' },
  { code: 'ms', name: 'Malais', nativeName: 'Bahasa Melayu', flag: '🇲🇾', region: 'asie' },
  { code: 'tl', name: 'Philippin / Tagalog', nativeName: 'Tagalog', flag: '🇵🇭', region: 'asie' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', region: 'asie' },
  { code: 'ur', name: 'Ourdou', nativeName: 'اردو', flag: '🇵🇰', region: 'asie' },
  { code: 'pa', name: 'Pendjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳', region: 'asie' },
  { code: 'ta', name: 'Tamoul', nativeName: 'தமிழ்', flag: '🇮🇳', region: 'asie' },
  { code: 'te', name: 'Télougou', nativeName: 'తెలుగు', flag: '🇮🇳', region: 'asie' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', region: 'asie' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', region: 'asie' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'asie' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳', region: 'asie' },
  { code: 'si', name: 'Cinghalais', nativeName: 'සිංහල', flag: '🇱🇰', region: 'asie' },
  { code: 'ne', name: 'Népalais', nativeName: 'नेपाली', flag: '🇳🇵', region: 'asie' },
  { code: 'my', name: 'Birman', nativeName: 'မြန်မာစာ', flag: '🇲🇲', region: 'asie' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', flag: '🇰🇭', region: 'asie' },
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦', region: 'asie' },
  { code: 'mn', name: 'Mongol', nativeName: 'Монгол', flag: '🇲🇳', region: 'asie' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақша', flag: '🇰🇿', region: 'asie' },
  { code: 'uz', name: 'Ouzbek', nativeName: 'Oʻzbekcha', flag: '🇺🇿', region: 'asie' },
  { code: 'ky', name: 'Kirghize', nativeName: 'Кыргызча', flag: '🇰🇬', region: 'asie' },
  { code: 'tg', name: 'Tadjik', nativeName: 'Тоҷикӣ', flag: '🇹🇯', region: 'asie' },
  { code: 'az', name: 'Azerbaïdjanais', nativeName: 'Azərbaycanca', flag: '🇦🇿', region: 'asie' },
  { code: 'hy', name: 'Arménien', nativeName: 'Հայերեն', flag: '🇦🇲', region: 'asie' },
  { code: 'ka', name: 'Géorgien', nativeName: 'ქართული', flag: '🇬🇪', region: 'asie' },

  // --- MOYEN-ORIENT ---
  { code: 'fa', name: 'Persan / Farsi', nativeName: 'فارسی', flag: '🇮🇷', region: 'moyen-orient' },
  { code: 'he', name: 'Hébreu', nativeName: 'עברית', flag: '🇮🇱', region: 'moyen-orient' },
  { code: 'ku', name: 'Kurde', nativeName: 'Kurdî', flag: '🇮🇶', region: 'moyen-orient' },
  { code: 'ps', name: 'Pachto', nativeName: 'پښتو', flag: '🇦🇫', region: 'moyen-orient' },

  // --- AMÉRIQUES ET OCÉANIE ---
  { code: 'ht', name: 'Créole Haïtien', nativeName: 'Kreyòl Ayisyen', flag: '🇭🇹', region: 'ameriques' },
  { code: 'qu', name: 'Quechua', nativeName: 'Runa Simi', flag: '🇵🇪', region: 'ameriques' },
  { code: 'gn', name: 'Guarani', nativeName: 'Avañeʼẽ', flag: '🇵🇾', region: 'ameriques' },
  { code: 'ay', name: 'Aymara', nativeName: 'Aymar aru', flag: '🇧🇴', region: 'ameriques' },
  { code: 'sm', name: 'Samoan', nativeName: 'Gagana Samoa', flag: '🇼🇸', region: 'oceanie' },
  { code: 'mi', name: 'Maori', nativeName: 'Te Reo Māori', flag: '🇳🇿', region: 'oceanie' },
  { code: 'haw', name: 'Hawaïen', nativeName: 'ʻŌlelo Hawaiʻi', flag: '🌺', region: 'oceanie' },
  { code: 'eo', name: 'Espéranto', nativeName: 'Esperanto', flag: '🌐', region: 'autre' },
  { code: 'la', name: 'Latin', nativeName: 'Latina', flag: '🏛️', region: 'autre' },
];

export const REGIONS_LABELS: Record<string, string> = {
  all: 'Toutes les langues',
  populaire: 'Populaires & Mondiales',
  afrique: 'Afrique',
  europe: 'Europe',
  asie: 'Asie',
  'moyen-orient': 'Moyen-Orient',
  ameriques: 'Amériques',
  oceanie: 'Océanie & Pacifique',
};

export function getLanguageByCode(code: string): LanguageOption {
  const found = WORLD_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
  if (found) return found;

  // Partial match or fallback
  const partial = WORLD_LANGUAGES.find((l) =>
    l.code.toLowerCase().startsWith(code.toLowerCase().slice(0, 2))
  );
  if (partial) return partial;

  return {
    code,
    name: code.toUpperCase(),
    nativeName: code.toUpperCase(),
    flag: '🌐',
    region: 'autre',
  };
}
