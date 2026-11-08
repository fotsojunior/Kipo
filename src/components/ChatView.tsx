import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Sparkles,
  Gamepad2,
  Brain,
  Copy,
  Check,
  RotateCcw,
  Bot,
  User,
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
} from 'lucide-react';
import {
  ChatMessage,
  AttachmentMeta,
  UserProfile,
  SupportedLanguage,
  Conversation,
} from '../types';
import { analyticsService } from '../services/analyticsService';
import { translations } from '../i18n/translations';
import { apiService } from '../services/apiService';
import { storageService } from '../services/storageService';
import { soundEffects } from '../utils/soundEffects';
import { voiceService } from '../services/voiceService';

interface ChatViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  onAwardXp: (amount: number, reason: string) => void;
  onNavigateToQuiz: (sourceContent: string, subjectTitle: string) => void;
  onNavigateToFlashcards: (sourceContent: string, subjectTitle: string) => void;
  initialConversationId?: string;
}

function parseInlineFormatting(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-extrabold text-indigo-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function renderCleanMessageContent(rawText: string) {
  // Strip unwanted formatting: ***, $$, $, and decorative lines of asterisks
  const cleaned = rawText
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$\n]+)\$/g, '$1')
    .replace(/\*{3,}/g, '')
    .replace(/^\s*(\*\s*){3,}$/gm, '');

  const paragraphs = cleaned.split(/\n\n+/);

  return (
    <div className="space-y-2 leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Headings (# Titre, ## Titre, ### Titre)
        if (trimmed.startsWith('#')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h4 key={pIdx} className="font-black text-sm text-indigo-900 mt-2 mb-1">
              {headingText}
            </h4>
          );
        }

        // Bullet lists
        if (trimmed.includes('\n- ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const lines = trimmed.split('\n');
          return (
            <ul key={pIdx} className="space-y-1 my-1 pl-1">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[\-\*]\s*/, '').trim();
                return (
                  <li key={lIdx} className="flex items-start gap-1.5 text-xs sm:text-sm">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span>{parseInlineFormatting(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard paragraph
        return (
          <p key={pIdx} className="text-xs sm:text-sm">
            {parseInlineFormatting(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export const ChatView: React.FC<ChatViewProps> = ({
  currentProfile,
  currentLanguage,
  onAwardXp,
  onNavigateToQuiz,
  onNavigateToFlashcards,
  initialConversationId,
}) => {
  const t = translations[currentLanguage];

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeConvId, setActiveConvId] = useState<string>(
    initialConversationId || `conv-${Date.now()}`
  );
  const [convTitle, setConvTitle] = useState('Nouvelle discussion pédagogique');

  // Voice States: Dictation (Speech-to-Text) and Vocal Tutor (Text-to-Speech)
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Subscribe to voice status and cleanup on unmount
  useEffect(() => {
    const unsubscribe = voiceService.subscribe(() => {
      setIsListening(voiceService.isListening());
      setSpeakingId(voiceService.getSpeakingId());
    });
    return () => {
      unsubscribe();
      voiceService.stopListening();
      voiceService.stopSpeaking();
    };
  }, []);

  // Load conversation if initialId provided or seed
  useEffect(() => {
    const convs = storageService.getConversations();
    if (initialConversationId) {
      const found = convs.find((c) => c.id === initialConversationId);
      if (found) {
        setMessages(found.messages);
        setConvTitle(found.title);
        setActiveConvId(found.id);
        setErrorMessage(null);
        setIsLoading(false);
        return;
      }
    }
    // If messages are empty, load last conversation or welcome
    if (convs.length > 0 && messages.length === 0) {
      const first = convs[0];
      setMessages(first.messages);
      setConvTitle(first.title);
      setActiveConvId(first.id);
      setErrorMessage(null);
    }
  }, [initialConversationId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Save conversation automatically when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const conv: Conversation = {
        id: activeConvId,
        title: convTitle,
        profile: currentProfile,
        messages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: [currentProfile, 'Tuteur KIPO'],
      };
      storageService.saveConversation(conv);
    }
  }, [messages, activeConvId, convTitle, currentProfile]);

  const handleStartNewChat = () => {
    const newId = `conv-${Date.now()}`;
    setActiveConvId(newId);
    setConvTitle('Nouvelle discussion');
    setMessages([]);
    setInputText('');
    setAttachments([]);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Check file size limit (25MB)
      if (file.size > 25 * 1024 * 1024) {
        setErrorMessage('Le fichier est trop volumineux (max 25 Mo).');
        return;
      }

      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';

      reader.onload = () => {
        const result = reader.result as string;
        // Strip base64 metadata prefix for clean API transmission
        const base64Data = result.includes(',') ? result.split(',')[1] : result;

        const newAttachment: AttachmentMeta = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          mimeType: file.type || (isPdf ? 'application/pdf' : 'text/plain'),
          size: file.size,
          data: base64Data,
          type: isImg ? 'image' : isPdf ? 'pdf' : 'text',
          previewUrl: isImg ? result : undefined,
        };

        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query && attachments.length === 0) return;

    setErrorMessage(null);
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString(),
      attachments: attachments.length > 0 ? [...attachments] : undefined,
    };

    // Auto title if first message
    if (messages.length === 0 && query) {
      setConvTitle(query.slice(0, 38) + (query.length > 38 ? '...' : ''));
    }

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage({
        message: query,
        history: messages,
        profile: currentProfile,
        language: currentLanguage,
        attachments: currentAttachments,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.text,
        timestamp: response.timestamp,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      soundEffects.playCorrect();

      // Award XP for engaging in pedagogical inquiry
      onAwardXp(12, 'Question posée au tuteur IA');

      // Track question for the founder dashboard (fotsojunior756@gmail.com)
      analyticsService.trackQuestion({
        question: query,
        subject: currentProfile === 'professeur' ? 'Enseignement' : currentProfile === 'etudiant' ? 'Études Supérieures' : 'Scolaire',
        answerPreview: response.text ? response.text.slice(0, 200) : '',
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err.message ||
          'Une erreur est survenue lors de la communication avec le tuteur IA.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      voiceService.stopListening();
      setIsListening(false);
      return;
    }

    setVoiceNotice(null);
    const langCode =
      currentLanguage === 'en' ? 'en-US' : currentLanguage === 'es' ? 'es-ES' : 'fr-FR';

    const started = voiceService.startListening({
      lang: langCode,
      onResult: (transcript, isFinal) => {
        setInputText((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
        if (isFinal) {
          soundEffects.playCardFlip();
        }
      },
      onError: (err) => {
        setVoiceNotice(err);
        setTimeout(() => setVoiceNotice(null), 4500);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    if (started) {
      soundEffects.playCardFlip();
    }
  };

  const handleToggleSpeak = (msgId: string, content: string) => {
    if (speakingId === msgId) {
      voiceService.stopSpeaking();
      setSpeakingId(null);
      return;
    }

    const langCode =
      currentLanguage === 'en' ? 'en-US' : currentLanguage === 'es' ? 'es-ES' : 'fr-FR';

    setSpeakingId(msgId);
    voiceService.speak(msgId, content, {
      lang: langCode,
      onStart: () => setSpeakingId(msgId),
      onEnd: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  };

  // Profile-specific styling and helper badge
  const profileBadgeConfig: Record<UserProfile, { label: string; bg: string }> = {
    eleve: {
      label: 'Niveau Élève • Explications claires, imagées & ludiques',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    etudiant: {
      label: 'Niveau Étudiant • Rigueur scientifique & préparation examens',
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    },
    professeur: {
      label: 'Niveau Professeur • Didactique, séquences & évaluation',
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    autre: {
      label: 'Niveau Autre • Professionnel, culture générale & curiosité',
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
    },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-4xl mx-auto bg-slate-50 border-x border-slate-200 shadow-xs">
      {/* Header Info */}
      <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div className="overflow-hidden">
            <h2 className="text-sm font-bold text-slate-800 truncate">
              {convTitle}
            </h2>
            <div
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                profileBadgeConfig[currentProfile].bg
              }`}
            >
              {profileBadgeConfig[currentProfile].label}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
          title="Nouvelle discussion"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Nouveau</span>
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4 animate-bounce">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {t.chat.emptyTitle}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {t.chat.emptySubtitle}
            </p>

            {/* Quick Suggestions */}
            <div className="w-full space-y-2 text-left">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Suggestions rapides :
              </p>
              {t.chat.quickSuggestions.map((sug, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(sug)}
                  className="w-full text-left p-3 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-200 text-xs font-medium text-slate-700 hover:text-indigo-700 transition-all shadow-2xs flex items-center justify-between group cursor-pointer"
                >
                  <span className="truncate pr-2">💡 {sug}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-xs'
                  }`}
                >
                  {/* Attachments preview if user uploaded any */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2.5 space-y-1.5">
                      {msg.attachments.map((att) => (
                        <div
                          key={att.id}
                          className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                            isUser
                              ? 'bg-indigo-700/60 border border-indigo-400/30 text-white'
                              : 'bg-slate-50 border border-slate-200 text-slate-700'
                          }`}
                        >
                          {att.type === 'image' ? (
                            att.previewUrl ? (
                              <img
                                src={att.previewUrl}
                                alt={att.name}
                                className="w-8 h-8 object-cover rounded-md"
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-emerald-400" />
                            )
                          ) : (
                            <FileText className="w-4 h-4 text-amber-400" />
                          )}
                          <span className="truncate font-medium">{att.name}</span>
                          <span className="text-[10px] opacity-75">
                            ({(att.size / 1024).toFixed(0)} Ko)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message body with clean formatting (no raw *** or $ symbols) */}
                  <div className="text-xs sm:text-sm leading-relaxed break-words">
                    {renderCleanMessageContent(msg.content)}
                  </div>

                  {/* Assistant Pedagogical Tools bar */}
                  {!isUser && (
                    <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() =>
                          onNavigateToQuiz(msg.content, convTitle || 'Quiz de révision')
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Créer un quiz à partir de cette explication"
                      >
                        <Gamepad2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Créer Quiz</span>
                      </button>

                      <button
                        onClick={() =>
                          onNavigateToFlashcards(
                            msg.content,
                            convTitle || 'Cartes de révision'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Créer des cartes mémoire"
                      >
                        <Brain className="w-3.5 h-3.5 text-violet-600" />
                        <span>Flashcards</span>
                      </button>

                      {/* Vocal Tutor button (Text-to-Speech) */}
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(msg.id, msg.content)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                          speakingId === msg.id
                            ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                        }`}
                        title={
                          speakingId === msg.id
                            ? 'Arrêter la lecture'
                            : 'Écouter l’explication de KIPO à voix haute'
                        }
                      >
                        {speakingId === msg.id ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-amber-700 text-amber-700" />
                            <span>Stop</span>
                            <span className="flex items-center gap-0.5 ml-0.5">
                              <span className="w-1 h-2 bg-amber-600 rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-1 h-3 bg-amber-600 rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-1 h-1.5 bg-amber-600 rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Écouter</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs transition-colors ml-auto cursor-pointer"
                        title="Copier le texte"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-medium text-[10px]">
                              Copié
                            </span>
                          </>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-xs px-4 py-3 shadow-xs flex items-center gap-2 text-xs text-indigo-700 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>{t.chat.analyzing}</span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Tray */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-slate-100/90 border-t border-slate-200 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="relative flex items-center gap-1.5 pl-2 pr-6 py-1 bg-white border border-slate-200 rounded-lg text-xs shadow-2xs"
            >
              {att.type === 'image' && att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  className="w-5 h-5 rounded object-cover"
                />
              ) : (
                <FileText className="w-4 h-4 text-indigo-500" />
              )}
              <span className="max-w-[120px] truncate font-medium text-slate-700">
                {att.name}
              </span>
              <button
                onClick={() => handleRemoveAttachment(att.id)}
                className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Active listening banner */}
      {isListening && (
        <div className="px-4 py-2 bg-rose-50 border-t border-rose-200 flex items-center justify-between text-xs text-rose-700">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-semibold">KIPO vous écoute... Parlez distinctement dans votre micro.</span>
          </div>
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline cursor-pointer"
          >
            Terminer la dictée
          </button>
        </div>
      )}

      {/* Voice notice / error banner */}
      {voiceNotice && (
        <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-200 text-xs text-amber-800 flex items-center justify-between">
          <span>{voiceNotice}</span>
          <button
            type="button"
            onClick={() => setVoiceNotice(null)}
            className="text-amber-500 hover:text-amber-800 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Input Bar */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* File attachment button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*,application/pdf,text/plain,.md"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer shrink-0"
            title={t.chat.attachFile}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Voice Input Button (Speech-to-Text) */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md animate-pulse ring-2 ring-rose-300'
                : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
            title={isListening ? 'Arrêter la dictée vocale' : 'Parler à KIPO (Dictée vocale)'}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">Écoute...</span>
              </>
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={isListening ? 'En train de vous écouter...' : t.chat.inputPlaceholder}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 text-sm bg-slate-100 focus:bg-white border rounded-xl outline-hidden transition-all text-slate-800 placeholder:text-slate-400 ${
              isListening
                ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/30'
                : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
            }`}
          />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || (!inputText.trim() && attachments.length === 0)}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
            title={t.chat.send}
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};
