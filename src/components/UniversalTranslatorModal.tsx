import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  X,
  Check,
  RotateCcw,
  Sparkles,
  Languages,
  Info,
  Loader2,
} from 'lucide-react';
import { WORLD_LANGUAGES, LanguageOption, REGIONS_LABELS, getLanguageByCode } from '../data/languages';
import { translatorService } from '../utils/translatorService';

interface UniversalTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (langCode: string, langName: string) => void;
}

export const UniversalTranslatorModal: React.FC<UniversalTranslatorModalProps> = ({
  isOpen,
  onClose,
  currentLanguage,
  onSelectLanguage,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationSuccess, setTranslationSuccess] = useState<string | null>(null);

  const activeLangOption = useMemo(
    () => getLanguageByCode(currentLanguage || 'fr'),
    [currentLanguage]
  );

  // Filter languages based on search query and region tab
  const filteredLanguages = useMemo(() => {
    let list = WORLD_LANGUAGES;

    // Filter by region if specified
    if (selectedRegion !== 'all') {
      if (selectedRegion === 'populaire') {
        list = list.filter((l) => l.region === 'populaire');
      } else if (selectedRegion === 'afrique') {
        list = list.filter((l) => l.region === 'afrique');
      } else if (selectedRegion === 'europe') {
        list = list.filter((l) => l.region === 'europe');
      } else if (selectedRegion === 'asie') {
        list = list.filter((l) => l.region === 'asie');
      } else if (selectedRegion === 'moyen-orient') {
        list = list.filter((l) => l.region === 'moyen-orient');
      } else if (selectedRegion === 'ameriques') {
        list = list.filter((l) => l.region === 'ameriques' || l.region === 'oceanie');
      }
    }

    // Filter by search query (name, nativeName, code)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.nativeName.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, selectedRegion]);

  if (!isOpen) return null;

  const handleApplyLanguage = async (lang: LanguageOption) => {
    setIsTranslating(true);
    setTranslationSuccess(null);

    try {
      await translatorService.applyLanguage(lang.code, lang.name);
      onSelectLanguage(lang.code, lang.name);
      setTranslationSuccess(`Application traduite en ${lang.name} (${lang.nativeName}) !`);

      setTimeout(() => {
        setIsTranslating(false);
        setTranslationSuccess(null);
        onClose();
      }, 700);
    } catch (err) {
      console.error('[Translator] Error applying language:', err);
      setIsTranslating(false);
      onSelectLanguage(lang.code, lang.name);
      onClose();
    }
  };

  const handleResetFrench = async () => {
    setIsTranslating(true);
    try {
      translatorService.resetToOriginal();
      onSelectLanguage('fr', 'Français');
      setTranslationSuccess('Langue réinitialisée en Français d’origine !');
      setTimeout(() => {
        setIsTranslating(false);
        setTranslationSuccess(null);
        onClose();
      }, 600);
    } catch {
      setIsTranslating(false);
      onClose();
    }
  };

  const regionTabs = [
    { id: 'all', label: 'Toutes (130+)' },
    { id: 'populaire', label: 'Mondiales & Populaires' },
    { id: 'afrique', label: 'Afrique' },
    { id: 'europe', label: 'Europe' },
    { id: 'asie', label: 'Asie' },
    { id: 'moyen-orient', label: 'Moyen-Orient' },
    { id: 'ameriques', label: 'Amériques & Océanie' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white relative shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0">
                🌐
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg sm:text-xl font-black tracking-tight">
                    Traducteur Universel KIPO
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                    130+ Langues
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
                  Traduisez instantanément l’ensemble de l’application, les cours et le tuteur IA
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Language Bar & Reset Shortcut */}
          <div className="mt-4 pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-white/80 font-medium">Langue active :</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-sm font-black text-white border border-white/30">
                <span>{activeLangOption.flag}</span>
                <span>{activeLangOption.name}</span>
                <span className="text-[10px] text-emerald-200">({activeLangOption.nativeName})</span>
              </span>
            </div>

            {currentLanguage !== 'fr' && (
              <button
                onClick={handleResetFrench}
                disabled={isTranslating}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold transition-all cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rétablir Français d’origine</span>
              </button>
            )}
          </div>
        </div>

        {/* Translation In-Progress Banner */}
        {isTranslating && (
          <div className="bg-amber-500 text-slate-950 px-4 py-2 flex items-center justify-center gap-2 text-xs font-black shrink-0 animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Traduction instantanée de l'application en cours...</span>
          </div>
        )}

        {/* Success Feedback Banner */}
        {translationSuccess && !isTranslating && (
          <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-black shrink-0 animate-in fade-in">
            <Check className="w-4 h-4" />
            <span>{translationSuccess}</span>
          </div>
        )}

        {/* Search and Filter Controls */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-3 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une langue (ex: Arabe, Anglais, Espagnol, Swahili, 中文, Lingala...)"
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all shadow-inner"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Effacer recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Region Tabs (scrollable horizontally on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {regionTabs.map((tab) => {
              const isSelected = selectedRegion === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedRegion(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-200/70 text-slate-600 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredLanguages.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                🔍
              </div>
              <p className="text-sm font-bold text-slate-700">
                Aucune langue trouvée pour « {searchQuery} »
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Essayez d’écrire le nom en français, en anglais ou dans son écriture d’origine (ex : العربية, Kiswahili, etc.).
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedRegion('all');
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {filteredLanguages.map((lang) => {
                const isActive =
                  currentLanguage.toLowerCase() === lang.code.toLowerCase() ||
                  (lang.code === 'fr' && (!currentLanguage || currentLanguage === 'fr'));

                return (
                  <button
                    key={lang.code}
                    onClick={() => handleApplyLanguage(lang)}
                    disabled={isTranslating}
                    className={`flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer border active:scale-95 group ${
                      isActive
                        ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300/60 shadow-xs'
                        : 'bg-white hover:bg-slate-50/90 border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0 leading-none">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p
                            className={`text-xs font-extrabold truncate ${
                              isActive ? 'text-emerald-900' : 'text-slate-800 group-hover:text-emerald-700'
                            }`}
                          >
                            {lang.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium truncate">
                          {lang.nativeName}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 ml-1">
                      {isActive ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-emerald-600 uppercase">
                          {lang.code.slice(0, 4)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Info */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Traduction automatique universelle en temps réel (130+ langues prises en charge).
            </span>
          </div>

          <div className="flex items-center gap-2 font-medium">
            <span>{filteredLanguages.length} langues affichées</span>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
