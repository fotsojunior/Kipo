import React from 'react';
import {
  MessageSquare,
  FileText,
  Users,
  FolderArchive,
  User,
  Sparkles,
  Map,
  Headphones,
} from 'lucide-react';
import { translations } from '../i18n/translations';
import { SupportedLanguage } from '../types';

export type ActiveTab =
  | 'duolingo'
  | 'chat'
  | 'studio'
  | 'podcast'
  | 'games'
  | 'collab'
  | 'library'
  | 'profile'
  | 'admin';

interface MobileBottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  language: SupportedLanguage;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onChangeTab,
  language,
}) => {
  const t = translations[language || 'fr'];
  const items: Array<{ id: ActiveTab; label: string; icon: React.ReactNode }> = [
    {
      id: 'duolingo',
      label: t.nav.duolingo,
      icon: <span className="text-base">🦉</span>,
    },
    {
      id: 'games',
      label: 'Jeux',
      icon: <span className="text-base">🎮</span>,
    },
    {
      id: 'podcast',
      label: 'Podcasts',
      icon: <Headphones className="w-5 h-5 text-purple-600" />,
    },
    {
      id: 'chat',
      label: t.nav.chat,
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: 'studio',
      label: t.nav.studio,
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'library',
      label: t.nav.library,
      icon: <FolderArchive className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 px-2 py-1.5 pb-safe shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 scale-105 font-black'
                  : 'text-slate-500 hover:text-slate-700 font-medium'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-colors flex items-center justify-center ${
                  isActive ? 'bg-emerald-100 text-emerald-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
