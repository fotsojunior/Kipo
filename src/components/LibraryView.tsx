import React, { useState, useEffect } from 'react';
import {
  FolderArchive,
  Search,
  FileText,
  Gamepad2,
  Brain,
  MessageSquare,
  Trash2,
  ExternalLink,
  Download,
  Calendar,
  Sparkles,
  Play,
} from 'lucide-react';
import {
  Conversation,
  Quiz,
  FlashcardDeck,
  AnalyzedDocument,
  SupportedLanguage,
} from '../types';
import { translations } from '../i18n/translations';
import { storageService } from '../services/storageService';

interface LibraryViewProps {
  currentLanguage: SupportedLanguage;
  onOpenConversation: (convId: string) => void;
  onPlayQuiz: (quiz: Quiz) => void;
  onOpenDeck: (deck: FlashcardDeck) => void;
  onViewDocument: (doc: AnalyzedDocument) => void;
  onLaunchDuolingo?: (doc: AnalyzedDocument) => void;
  initialSearchQuery?: string;
}

type LibraryTab = 'all' | 'docs' | 'quizzes' | 'cards' | 'chats';

export const LibraryView: React.FC<LibraryViewProps> = ({
  currentLanguage,
  onOpenConversation,
  onPlayQuiz,
  onOpenDeck,
  onViewDocument,
  onLaunchDuolingo,
  initialSearchQuery = '',
}) => {
  const t = translations[currentLanguage];

  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [documents, setDocuments] = useState<AnalyzedDocument[]>([]);

  const reloadData = () => {
    setConversations(storageService.getConversations());
    setQuizzes(storageService.getQuizzes());
    setDecks(storageService.getFlashcardDecks());
    setDocuments(storageService.getDocuments());
  };

  useEffect(() => {
    reloadData();
  }, []);

  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const q = searchQuery.toLowerCase().trim();

  // Filter items based on activeTab and query
  const filteredDocs = documents.filter(
    (d) =>
      !q ||
      d.title.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.keyConcepts.some((k) => k.toLowerCase().includes(q))
  );

  const filteredQuizzes = quizzes.filter(
    (qz) =>
      !q ||
      qz.title.toLowerCase().includes(q) ||
      qz.subject.toLowerCase().includes(q)
  );

  const filteredDecks = decks.filter(
    (dk) =>
      !q ||
      dk.title.toLowerCase().includes(q) ||
      dk.subject.toLowerCase().includes(q)
  );

  const filteredChats = conversations.filter(
    (c) =>
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      c.messages.some((m) => m.content.toLowerCase().includes(q))
  );

  const handleDeleteDoc = (id: string) => {
    storageService.deleteDocument(id);
    reloadData();
  };

  const handleDeleteQuiz = (id: string) => {
    storageService.deleteQuiz(id);
    reloadData();
  };

  const handleDeleteDeck = (id: string) => {
    storageService.deleteFlashcardDeck(id);
    reloadData();
  };

  const handleDeleteChat = (id: string) => {
    storageService.deleteConversation(id);
    reloadData();
  };

  const handleExportBackup = () => {
    const jsonStr = storageService.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kipo_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-indigo-600" />
            <span>{t.library.title}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">{t.library.subtitle}</p>
        </div>

        {/* Export Backup button */}
        <button
          onClick={handleExportBackup}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          title="Exporter une sauvegarde de tes données JSON"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exporter sauvegarde</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par titre, mot-clé, matière ou phrase..."
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-hidden transition-all shadow-2xs"
        />
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
          >
            Effacer
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: t.library.tabAll, count: documents.length + quizzes.length + decks.length + conversations.length },
          { id: 'docs', label: t.library.tabDocs, count: filteredDocs.length },
          { id: 'quizzes', label: t.library.tabQuizzes, count: filteredQuizzes.length },
          { id: 'cards', label: t.library.tabCards, count: filteredDecks.length },
          { id: 'chats', label: t.library.tabChats, count: filteredChats.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as LibraryTab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span className="ml-1.5 opacity-75">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="space-y-4">
        {/* Documents */}
        {(activeTab === 'all' || activeTab === 'docs') && filteredDocs.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Documents Analysés ({filteredDocs.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {doc.fileType.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                      {doc.summary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      {doc.keyConcepts.length} notions clés
                    </span>
                    <div className="flex items-center gap-2">
                      {onLaunchDuolingo && (
                        <button
                          onClick={() => onLaunchDuolingo(doc)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors border border-emerald-200"
                          title="Lancer le Sentier KIPO (100 leçons)"
                        >
                          <span>🦉 100L</span>
                        </button>
                      )}
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                      >
                        <span>Consulter</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quizzes */}
        {(activeTab === 'all' || activeTab === 'quizzes') && filteredQuizzes.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Quiz & Défis ({filteredQuizzes.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 transition-all shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        {quiz.difficulty}
                      </span>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {quiz.subject} • {quiz.questions.length} questions
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      Joué {quiz.timesPlayed} fois
                    </span>
                    <button
                      onClick={() => onPlayQuiz(quiz)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Jouer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flashcards */}
        {(activeTab === 'all' || activeTab === 'cards') && filteredDecks.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-violet-500" />
              <span>Cartes Mémoire ({filteredDecks.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-violet-300 transition-all shadow-2xs space-y-2.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-violet-50 text-violet-700 border border-violet-200">
                        {deck.subject}
                      </span>
                      <button
                        onClick={() => handleDeleteDeck(deck.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                      {deck.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {deck.cards.length} cartes de révision
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      Révisé {deck.timesReviewed} fois
                    </span>
                    <button
                      onClick={() => onOpenDeck(deck)}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Brain className="w-3 h-3" />
                      <span>Réviser</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversations History */}
        {(activeTab === 'all' || activeTab === 'chats') && filteredChats.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              <span>Discussions Enregistrées ({filteredChats.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredChats.map((chat) => (
                <div
                  key={chat.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 transition-all shadow-2xs space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {chat.profile}
                      </span>
                      <button
                        onClick={() => handleDeleteChat(chat.id)}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {chat.messages[chat.messages.length - 1]?.content || 'Discussion vide'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400">
                      {chat.messages.length} messages
                    </span>
                    <button
                      onClick={() => onOpenConversation(chat.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Reprendre</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredDocs.length === 0 &&
          filteredQuizzes.length === 0 &&
          filteredDecks.length === 0 &&
          filteredChats.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
              <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">{t.library.noItems}</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? 'Essaie avec un autre mot-clé de recherche.'
                  : 'Commence par poser une question au tuteur ou analyser un cours !'}
              </p>
            </div>
          )}
      </div>
    </div>
  );
};
