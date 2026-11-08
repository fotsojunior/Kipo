import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  PlusCircle,
  LogIn,
  Share2,
  FileText,
  MessageSquare,
  Gamepad2,
  Shield,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Send,
  ExternalLink,
  Bot,
  Crown,
  Settings,
  HelpCircle,
  Loader2,
  Lock,
  Unlock,
  KeyRound,
  Upload,
  Image as ImageIcon,
  Download,
  Eye,
  Globe,
  UserPlus,
  CheckCircle,
  XCircle,
  Search,
  Paperclip,
  X,
  FileUp,
} from 'lucide-react';
import {
  StudyGroup,
  GroupMember,
  SharedDocumentItem,
  GroupChatMessage,
  AnalyzedDocument,
  UserProfile,
  SupportedLanguage,
  UserStats,
  GroupJoinRequest,
} from '../types';
import { storageService } from '../services/storageService';
import { apiService } from '../services/apiService';
import { historyNavigationService } from '../services/historyNavigationService';
import { soundEffects } from '../utils/soundEffects';
import { useAuth } from '../context/AuthContext';
import { translations } from '../i18n/translations';

interface CollaborativeSpacesViewProps {
  currentProfile: UserProfile;
  currentLanguage: SupportedLanguage;
  userStats: UserStats;
  onAwardXp: (amount: number, reason: string) => void;
  onOpenSharedDoc: (doc: SharedDocumentItem) => void;
  onPlayGroupQuiz: (quizId: string) => void;
}

type GroupTab = 'chat' | 'docs' | 'quizzes' | 'members' | 'requests' | 'settings';

const POPULAR_SUBJECT_SUGGESTIONS = [
  'Philosophie',
  'Sciences & SVT',
  'Mathématiques',
  'Physique-Chimie',
  'Histoire-Géographie',
  'Français & Littérature',
  'Informatique & Code',
  'Sciences Économiques',
  'Droit & Sciences Politiques',
  'Médecine & Santé',
  'Langues Vivantes (Anglais/Espagnol)',
];

export const CollaborativeSpacesView: React.FC<CollaborativeSpacesViewProps> = ({
  currentProfile,
  currentLanguage,
  userStats,
  onAwardXp,
  onOpenSharedDoc,
  onPlayGroupQuiz,
}) => {
  const t = translations[currentLanguage];
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<StudyGroup | null>(null);
  const [activeTab, setActiveTab] = useState<GroupTab>('chat');
  const [directoryFilter, setDirectoryFilter] = useState<'all' | 'public' | 'private' | 'my'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // User identity: real Supabase authenticated user or unique persistent client visitor
  const { user } = useAuth();
  const currentUserId = user?.id || storageService.getClientUserId();
  const currentUserName =
    user?.user_metadata?.full_name ||
    (user?.email ? user.email.split('@')[0] : null) ||
    storageService.getClientUserName(currentProfile);
  const currentUserEmail = user?.email || undefined;

  // Chat message input & attachment
  const [chatInput, setChatInput] = useState('');
  const [chatAttachment, setChatAttachment] = useState<{
    name: string;
    type: 'image' | 'pdf' | 'text';
    data: string;
    size: number;
  } | null>(null);
  const [isAiAssisting, setIsAiAssisting] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isShareDocOpen, setIsShareDocOpen] = useState(false);
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState<SharedDocumentItem | null>(null);

  // Create group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupSubject, setNewGroupSubject] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [newGroupPrivacy, setNewGroupPrivacy] = useState<'public' | 'private'>('public');

  // Join code form state
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Direct file upload form state (photo or PDF)
  const [uploadFileTitle, setUploadFileTitle] = useState('');
  const [uploadFileDesc, setUploadFileDesc] = useState('');
  const [uploadedFileRaw, setUploadedFileRaw] = useState<{
    name: string;
    type: 'pdf' | 'image';
    data: string;
    size: number;
  } | null>(null);

  // Document sharing from studio
  const [availablePersonalDocs, setAvailablePersonalDocs] = useState<AnalyzedDocument[]>([]);
  const [selectedDocToShare, setSelectedDocToShare] = useState<AnalyzedDocument | null>(null);
  const [sharePermission, setSharePermission] = useState<'read_only' | 'interactive'>('interactive');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  const activeGroupIdRef = useRef<string | null>(null);
  activeGroupIdRef.current = activeGroup?.id || null;

  // Intercepte le bouton retour du téléphone pour fermer le groupe actif et revenir à la liste
  useEffect(() => {
    if (!activeGroup) return;
    return historyNavigationService.registerHandler('collabActiveGroup', 85, () => {
      setActiveGroup(null);
      return true;
    });
  }, [activeGroup]);

  // Intercepte le bouton retour pour fermer les modales de création et partage
  useEffect(() => {
    if (!isCreateOpen && !isShareDocOpen) return;
    return historyNavigationService.registerHandler('collabModal', 95, () => {
      setIsCreateOpen(false);
      setIsShareDocOpen(false);
      return true;
    });
  }, [isCreateOpen, isShareDocOpen]);

  const reloadGroups = async (isBackground = false) => {
    // 1. Get cached local groups (only update on initial load to avoid UI flicker)
    if (!isBackground) {
      const local = storageService.getStudyGroups();
      setGroups(local);
      if (!activeGroup && local.length > 0) {
        setActiveGroup(local[0]);
      } else if (activeGroup) {
        const refreshed = local.find((g) => g.id === activeGroup.id);
        if (refreshed) setActiveGroup(refreshed);
      }
    }

    // 2. Sync cross-user groups from server so all users see each other's groups & messages
    const synced = await storageService.syncGroupsFromServer();
    setGroups(synced);
    const targetId = activeGroupIdRef.current;
    if (targetId) {
      const refreshed = synced.find((g) => g.id === targetId);
      if (refreshed) setActiveGroup(refreshed);
    } else if (synced.length > 0 && !activeGroup) {
      setActiveGroup(synced[0]);
    }
  };

  useEffect(() => {
    reloadGroups();
    setAvailablePersonalDocs(storageService.getDocuments());

    // Live background polling every 4 seconds to sync messages, files, and members in real time
    const interval = setInterval(() => {
      reloadGroups(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleCopyInviteCode = () => {
    if (!activeGroup) return;
    navigator.clipboard.writeText(activeGroup.inviteCode);
    setCopiedCode(true);
    soundEffects.playCorrect();
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !newGroupSubject.trim()) return;

    const created = storageService.createStudyGroup({
      name: newGroupName.trim(),
      description: newGroupDesc.trim() || `Espace d'apprentissage collaboratif KIPO en ${newGroupSubject.trim()}.`,
      subject: newGroupSubject.trim(),
      privacy: newGroupPrivacy,
      profile: currentProfile,
      creatorId: currentUserId,
      creatorName: currentUserName,
    });

    onAwardXp(35, `Création du groupe d'étude : ${created.name}`);
    soundEffects.playLevelUp();
    reloadGroups();
    setActiveGroup(created);
    setIsCreateOpen(false);
    setNewGroupName('');
    setNewGroupSubject('');
    setNewGroupDesc('');
    setNewGroupPrivacy('public');
  };

  const handle1ClickJoinPublic = (group: StudyGroup) => {
    const joined = storageService.joinPublicGroup(group.id, currentProfile, currentUserId, currentUserName);
    if (joined) {
      onAwardXp(25, `Rejoint le groupe public : ${joined.name}`);
      soundEffects.playCorrect();
      reloadGroups();
      setActiveGroup(joined);
    }
  };

  const handleRequestJoinPrivate = (group: StudyGroup) => {
    const requested = storageService.requestToJoinPrivateGroup(group.id, currentProfile, currentUserId, currentUserName, currentUserEmail);
    if (requested) {
      soundEffects.playClick();
      reloadGroups();
      alert(`Votre demande pour rejoindre « ${group.name} » a été transmise à l'administrateur du groupe.`);
    }
  };

  const handleApproveRequest = (requestId: string) => {
    if (!activeGroup) return;
    const updated = storageService.approveJoinRequest(activeGroup.id, requestId);
    if (updated) {
      soundEffects.playCorrect();
      reloadGroups();
    }
  };

  const handleRejectRequest = (requestId: string) => {
    if (!activeGroup) return;
    const updated = storageService.rejectJoinRequest(activeGroup.id, requestId);
    if (updated) {
      soundEffects.playClick();
      reloadGroups();
    }
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    if (!joinCodeInput.trim()) return;

    const joined = storageService.joinStudyGroup(joinCodeInput.trim(), currentProfile, currentUserId, currentUserName);
    if (joined) {
      onAwardXp(25, `Rejoint le groupe d'étude : ${joined.name}`);
      soundEffects.playCorrect();
      reloadGroups();
      setActiveGroup(joined);
      setIsJoinOpen(false);
      setJoinCodeInput('');
    } else {
      setJoinError('Code d’invitation introuvable. Vérifiez l’orthographe (ex: KIPO-SVT-99).');
    }
  };

  // Direct Photo / PDF file upload into the group
  const handleSelectFileToUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('Veuillez sélectionner un fichier PDF ou une photo (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string) || '';
      setUploadedFileRaw({
        name: file.name,
        type: isPdf ? 'pdf' : 'image',
        data: base64,
        size: file.size,
      });
      if (!uploadFileTitle) {
        setUploadFileTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUploadFile = () => {
    if (!activeGroup || !uploadedFileRaw || !uploadFileTitle.trim()) return;

    const newDocItem: SharedDocumentItem = {
      id: `file-${Date.now()}`,
      docId: `doc-${Date.now()}`,
      title: uploadFileTitle.trim(),
      fileName: uploadedFileRaw.name,
      fileType: uploadedFileRaw.type,
      fileData: uploadedFileRaw.data,
      fileSize: uploadedFileRaw.size,
      sharedBy: currentUserId,
      sharedByName: currentUserName,
      sharedAt: new Date().toISOString(),
      permission: 'interactive',
      summary: uploadFileDesc.trim() || `Document ${uploadedFileRaw.type === 'pdf' ? 'PDF' : 'Photo'} partagé dans le groupe.`,
      keyConcepts: [activeGroup.subject, uploadedFileRaw.type.toUpperCase()],
      questionCount: 20,
    };

    storageService.shareFileToGroup(activeGroup.id, newDocItem);
    onAwardXp(25, `Fichier partagé dans le groupe : ${uploadFileTitle.trim()}`);
    soundEffects.playLevelUp();
    reloadGroups();
    setIsFileUploadModalOpen(false);
    setUploadedFileRaw(null);
    setUploadFileTitle('');
    setUploadFileDesc('');
  };

  // Chat message sending with optional attached photo/PDF
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !chatAttachment) || !activeGroup) return;

    const userMsg: GroupChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: activeGroup.createdBy === currentUserId ? 'admin' : 'member',
      content: chatInput.trim() || (chatAttachment ? `Partage d'un fichier : ${chatAttachment.name}` : ''),
      timestamp: new Date().toISOString(),
      attachment: chatAttachment
        ? {
            id: `att-${Date.now()}`,
            name: chatAttachment.name,
            mimeType: chatAttachment.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
            size: chatAttachment.size,
            data: chatAttachment.data,
            type: chatAttachment.type,
          }
        : undefined,
    };

    storageService.addGroupMessage(activeGroup.id, userMsg);
    setChatInput('');
    setChatAttachment(null);
    reloadGroups(true);
  };

  // Chat attachment selector
  const handleSelectChatAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const isImage = file.type.startsWith('image/');
    const type = isPdf ? 'pdf' : isImage ? 'image' : 'text';

    const reader = new FileReader();
    reader.onload = () => {
      setChatAttachment({
        name: file.name,
        type,
        data: (reader.result as string) || '',
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAiAssist = async (action: 'summarize' | 'moderate' | 'challenge') => {
    if (!activeGroup) return;
    setIsAiAssisting(true);

    try {
      const response = await apiService.groupAiAssist({
        groupName: activeGroup.name,
        subject: activeGroup.subject,
        messages: activeGroup.messages,
        action,
        language: currentLanguage,
      });

      const aiMsg: GroupChatMessage = {
        id: `ai-msg-${Date.now()}`,
        senderId: 'ai-moderator',
        senderName: 'KIPO AI Tuteur de Groupe',
        senderRole: 'ai_moderator',
        content: response.text,
        timestamp: response.timestamp,
        isAiSummary: action === 'summarize',
        isModeration: action === 'moderate',
      };

      storageService.addGroupMessage(activeGroup.id, aiMsg);
      soundEffects.playCorrect();
      reloadGroups(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsAiAssisting(false);
    }
  };

  const handleConfirmShareDocFromStudio = () => {
    if (!activeGroup || !selectedDocToShare) return;

    storageService.shareDocumentToGroup(activeGroup.id, selectedDocToShare, sharePermission, currentUserId, currentUserName);
    onAwardXp(20, `Document partagé dans le groupe : ${selectedDocToShare.title}`);
    soundEffects.playCorrect();
    reloadGroups(true);
    setIsShareDocOpen(false);
    setSelectedDocToShare(null);
  };

  const isMemberOfActive = activeGroup?.members.some((m) => m.id === currentUserId);
  const isAdminOfActive =
    activeGroup?.createdBy === currentUserId ||
    activeGroup?.members.some((m) => m.id === currentUserId && m.role === 'admin');
  const hasRequestedActive = activeGroup?.pendingRequests?.some((r) => r.userId === currentUserId);

  // Filter groups in the directory
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (directoryFilter === 'public') return g.privacy === 'public';
    if (directoryFilter === 'private') return g.privacy === 'private';
    if (directoryFilter === 'my') return g.members.some((m) => m.id === currentUserId);
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black border border-indigo-200 mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>{t.collab.badge}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{t.collab.title}</span>
            <span>👥</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
            {t.collab.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer border border-slate-200"
            title={t.collab.joinWithCode}
          >
            <KeyRound className="w-4 h-4 text-slate-600" />
            <span>{t.collab.joinWithCode}</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.collab.createGroup}</span>
          </button>
        </div>
      </div>

      {/* Directory of Groups: Visible across all users */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filters pills */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl overflow-x-auto scrollbar-none">
            {[
              { id: 'all', label: `${t.collab.filterAll} (${groups.length})` },
              { id: 'public', label: t.collab.filterPublic },
              { id: 'private', label: t.collab.filterPrivate },
              {
                id: 'my',
                label: `${t.collab.filterMy} (${groups.filter((g) => g.members.some((m) => m.id === currentUserId)).length})`,
              },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setDirectoryFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  directoryFilter === f.id
                    ? 'bg-white text-slate-900 shadow-2xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative min-w-[220px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.collab.searchPlaceholder}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Group Cards Grid in the open directory */}
        {filteredGroups.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl">
            {t.collab.noGroups}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGroups.map((grp) => {
              const isSelected = activeGroup?.id === grp.id;
              const isMember = grp.members.some((m) => m.id === currentUserId);
              const isCreator = grp.createdBy === currentUserId;
              const hasRequested = grp.pendingRequests?.some((r) => r.userId === currentUserId);

              return (
                <div
                  key={grp.id}
                  onClick={() => {
                    setActiveGroup(grp);
                    setActiveTab('chat');
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2.5 flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-200 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md font-bold bg-indigo-100 text-indigo-800 truncate max-w-[170px]">
                        {grp.subject}
                      </span>
                      {grp.privacy === 'public' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Globe className="w-3 h-3 text-emerald-600" />
                          <span>{t.collab.public}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>{t.collab.private}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-sm text-slate-900 leading-snug line-clamp-1">
                      {grp.name}
                    </h3>

                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {grp.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500 font-bold">
                      👥 {grp.members.length} {t.collab.membersCount}
                    </span>

                    {/* Join button based on status */}
                    {isMember ? (
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 font-black text-[11px]">
                        {isCreator ? `👑 ${t.collab.creatorBadge}` : `${t.collab.memberBadge} ✓`}
                      </span>
                    ) : grp.privacy === 'public' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handle1ClickJoinPublic(grp);
                        }}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        {t.collab.join}
                      </button>
                    ) : hasRequested ? (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {t.collab.pending} ⏳
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRequestJoinPrivate(grp);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        {t.collab.requestAccess}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Group Hub Area */}
      {activeGroup ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Group Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Matière : {activeGroup.subject}
                  </span>

                  {activeGroup.privacy === 'public' ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      <span>{t.collab.public}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-600" />
                      <span>{t.collab.private}</span>
                    </span>
                  )}

                  {isAdminOfActive && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 flex items-center gap-1">
                      <Crown className="w-3 h-3 text-purple-600" />
                      <span>{t.collab.adminBadge}</span>
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {activeGroup.name}
                </h2>
                <p className="text-xs text-slate-600">{activeGroup.description}</p>
              </div>

              {/* Action Buttons: Invite code & 1-click Join if not member */}
              <div className="flex items-center gap-2">
                {!isMemberOfActive && (
                  activeGroup.privacy === 'public' ? (
                    <button
                      onClick={() => handle1ClickJoinPublic(activeGroup)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{t.collab.enterGroup}</span>
                    </button>
                  ) : hasRequestedActive ? (
                    <span className="px-3.5 py-2 rounded-xl bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                      {t.collab.pending} ⏳
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRequestJoinPrivate(activeGroup)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Lock className="w-4 h-4" />
                      <span>{t.collab.requestAccess}</span>
                    </button>
                  )
                )}

                <button
                  onClick={handleCopyInviteCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  title={t.collab.joinWithCode}
                >
                  <span className="text-slate-400 font-mono text-[11px]">{activeGroup.inviteCode}</span>
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Inner Tabs Navigation */}
            <div className="flex items-center gap-1.5 mt-5 border-t border-slate-200 pt-3 overflow-x-auto scrollbar-none">
              {[
                { id: 'chat', label: t.collab.tabChat, icon: <MessageSquare className="w-4 h-4" /> },
                {
                  id: 'docs',
                  label: `${t.collab.tabDocs} (${activeGroup.sharedDocuments.length})`,
                  icon: <FileText className="w-4 h-4" />,
                },
                {
                  id: 'quizzes',
                  label: `${t.collab.tabQuizzes} (${activeGroup.groupQuizzes.length})`,
                  icon: <Gamepad2 className="w-4 h-4" />,
                },
                { id: 'members', label: `${t.collab.tabMembers} (${activeGroup.members.length})`, icon: <Users className="w-4 h-4" /> },
                ...(isAdminOfActive && activeGroup.privacy === 'private'
                  ? [
                      {
                        id: 'requests',
                        label: `${t.collab.tabRequests} (${activeGroup.pendingRequests?.length || 0})`,
                        icon: <UserPlus className="w-4 h-4 text-amber-600" />,
                        badge: activeGroup.pendingRequests && activeGroup.pendingRequests.length > 0 ? activeGroup.pendingRequests.length : undefined,
                      },
                    ]
                  : []),
                { id: 'settings', label: t.collab.tabSettings, icon: <Shield className="w-4 h-4" /> },
              ].map((tab: any) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as GroupTab)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {tab.badge && (
                      <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-black">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* TAB 1: GROUP CHAT & MULTIMODAL ATTACHMENTS */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-[520px]">
              {/* AI Group Coach quick trigger buttons */}
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-600 font-bold">
                  <Bot className="w-4 h-4 text-indigo-600" />
                  <span>{t.collab.aiCoach} :</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAiAssist('summarize')}
                    disabled={isAiAssisting}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {isAiAssisting ? '...' : t.collab.aiSummarize}
                  </button>
                  <button
                    onClick={() => handleAiAssist('challenge')}
                    disabled={isAiAssisting}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] transition-all cursor-pointer"
                  >
                    {t.collab.aiChallenge}
                  </button>
                </div>
              </div>

              {/* Messages timeline */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
                {activeGroup.messages.map((msg) => {
                  const isSelf = msg.senderId === currentUserId;
                  const isAi = msg.senderRole === 'ai_moderator';

                  if (isAi) {
                    return (
                      <div
                        key={msg.id}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-200/80 text-xs text-indigo-950 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between font-black text-indigo-900">
                          <span className="flex items-center gap-1.5">
                            <span>🦉</span>
                            <span>{msg.senderName}</span>
                          </span>
                          <span className="text-[10px] text-indigo-400">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-slate-800 leading-relaxed font-medium">{msg.content}</p>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                    >
                      <div className="text-[10px] text-slate-400 px-1 mb-0.5 font-bold">
                        {msg.senderName}
                      </div>
                      <div
                        className={`p-3 rounded-2xl max-w-md text-xs space-y-1.5 shadow-2xs ${
                          isSelf
                            ? 'bg-indigo-600 text-white rounded-tr-xs'
                            : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                        }`}
                      >
                        <p className="leading-relaxed font-medium">{msg.content}</p>

                        {/* Attached Image or PDF preview */}
                        {msg.attachment && (
                          <div className="mt-2 pt-2 border-t border-white/20">
                            {msg.attachment.type === 'image' ? (
                              <div className="space-y-1">
                                <img
                                  src={msg.attachment.data}
                                  alt={msg.attachment.name}
                                  className="max-h-48 rounded-xl object-cover border border-white/20"
                                />
                                <div className="flex items-center justify-between text-[10px] opacity-80">
                                  <span>{msg.attachment.name}</span>
                                  <a
                                    href={msg.attachment.data}
                                    download={msg.attachment.name}
                                    className="underline font-bold"
                                  >
                                    Télécharger
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-2 rounded-xl bg-black/20 text-[11px] gap-2">
                                <span className="flex items-center gap-1.5 truncate">
                                  <FileText className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">{msg.attachment.name}</span>
                                </span>
                                <a
                                  href={msg.attachment.data}
                                  download={msg.attachment.name}
                                  className="px-2 py-0.5 rounded bg-white text-slate-900 font-bold text-[10px] shrink-0"
                                >
                                  Ouvrir
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input & Attachment bar */}
              <div className="p-3 border-t border-slate-200 bg-white space-y-2">
                {/* Active Attachment preview chip */}
                {chatAttachment && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900">
                    <div className="flex items-center gap-2 truncate">
                      {chatAttachment.type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-rose-600" />
                      )}
                      <span className="font-bold truncate">{chatAttachment.name}</span>
                      <span className="text-[10px] text-indigo-500">
                        ({Math.round(chatAttachment.size / 1024)} Ko)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatAttachment(null)}
                      className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendChatMessage} className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={chatFileInputRef}
                    onChange={handleSelectChatAttachment}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => chatFileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                    title="Joindre une photo ou un fichier PDF"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t.collab.chatPlaceholder}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-indigo-500"
                  />

                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t.collab.send}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: SHARED DOCUMENTS, PHOTOS & PDFS */}
          {activeTab === 'docs' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    {t.collab.tabDocs}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.collab.subtitle}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFileUploadModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs cursor-pointer transition-all active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{t.collab.shareDoc}</span>
                  </button>

                  <button
                    onClick={() => setIsShareDocOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs cursor-pointer border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{t.collab.chooseFromStudio}</span>
                  </button>
                </div>
              </div>

              {activeGroup.sharedDocuments.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
                  <FileUp className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-bold">
                    Aucun document partagé dans ce groupe pour le moment.
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Partagez une photo de votre tableau, une fiche de cours ou un polycopié PDF pour étudier ensemble !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeGroup.sharedDocuments.map((doc) => {
                    const isPdf = doc.fileType === 'pdf';
                    const isImg = doc.fileType === 'image';

                    return (
                      <div
                        key={doc.id}
                        className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider ${
                                isPdf
                                  ? 'bg-rose-100 text-rose-800'
                                  : isImg
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {isPdf ? '📄 PDF' : isImg ? '📸 Photo' : '📝 Document'}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Partagé par {doc.sharedByName}
                            </span>
                          </div>

                          {/* Image preview thumbnail if available */}
                          {isImg && doc.fileData && (
                            <img
                              src={doc.fileData}
                              alt={doc.title}
                              className="w-full h-32 object-cover rounded-xl border border-slate-200"
                            />
                          )}

                          <h4 className="font-bold text-sm text-slate-900 leading-snug">
                            {doc.title}
                          </h4>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {doc.summary}
                          </p>

                          {doc.keyConcepts && doc.keyConcepts.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {doc.keyConcepts.slice(0, 3).map((concept, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium"
                                >
                                  {concept}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                          {doc.fileData ? (
                            <a
                              href={doc.fileData}
                              download={doc.fileName}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-center transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span>Télécharger</span>
                            </a>
                          ) : (
                            <button
                              onClick={() => onOpenSharedDoc(doc)}
                              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>Consulter</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenSharedDoc(doc)}
                            className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black transition-all cursor-pointer shadow-2xs"
                          >
                            Quiz Auto ⚡
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TEAM QUIZZES */}
          {activeTab === 'quizzes' && (
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900 text-sm">Quiz d’Équipe & Défis</h3>
                  <p className="text-xs text-slate-500">
                    Mesurez vos connaissances et gagnez de l’XP supplémentaire pour le groupe.
                  </p>
                </div>
              </div>

              {activeGroup.groupQuizzes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl space-y-2">
                  <Gamepad2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-600 font-bold">
                    Aucun quiz de groupe n'a encore été lancé.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Demandez à l'IA de lancer un défi depuis le chat du groupe !
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeGroup.groupQuizzes.map((quiz) => (
                    <div
                      key={quiz.id}
                      className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{quiz.title}</h4>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {quiz.questionCount} questions • Joué {quiz.playedCount} fois
                        </div>
                      </div>
                      <button
                        onClick={() => onPlayGroupQuiz(quiz.quizId)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-xs cursor-pointer"
                      >
                        Jouer le défi
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MEMBERS LIST */}
          {activeTab === 'members' && (
            <div className="p-5 sm:p-6 space-y-4">
              <h3 className="font-black text-slate-900 text-sm">
                Membres du Groupe ({activeGroup.members.length})
              </h3>
              <div className="divide-y divide-slate-100">
                {activeGroup.members.map((member) => (
                  <div key={member.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-2xs">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {member.role === 'admin' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Rejoint le {new Date(member.joinedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-indigo-700">
                      +{member.xpContributed} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: PENDING REQUESTS (FOR PRIVATE GROUPS ADMIN) */}
          {activeTab === 'requests' && isAdminOfActive && (
            <div className="p-5 sm:p-6 space-y-4">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <span>Demandes d'Adhésion en Attente d'Approbation</span>
              </h3>

              {(!activeGroup.pendingRequests || activeGroup.pendingRequests.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl text-xs text-slate-400">
                  Aucune demande en attente. Toutes les adhésions sont à jour !
                </div>
              ) : (
                <div className="space-y-3">
                  {activeGroup.pendingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-black text-xs text-slate-900 flex items-center gap-2">
                          <span>👤 {req.userName}</span>
                          <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px]">
                            {req.profile}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Demande envoyée le {new Date(req.requestedAt).toLocaleString('fr-FR')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 font-bold text-xs cursor-pointer"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: GROUP SETTINGS & PERMISSIONS */}
          {activeTab === 'settings' && (
            <div className="p-5 sm:p-6 space-y-4">
              <h3 className="font-black text-slate-900 text-sm">Paramètres & Règles du Groupe</h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-800">Type de groupe :</div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-xl text-xs font-black ${
                      activeGroup.privacy === 'public'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {activeGroup.privacy === 'public'
                      ? '🌐 Groupe Public (Tout le monde peut entrer)'
                      : '🔒 Groupe Privé (Approbation requise)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1">
                  Matière : <strong>{activeGroup.subject}</strong> • Créé par {activeGroup.createdByName}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* MODAL 1: CREATE GROUP WITH CUSTOM FREE SUBJECT & PUBLIC/PRIVATE */}
      {/* ============================================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <span>Créer un Groupe d'Étude</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
              {/* Group Name */}
              <div>
                <label className="font-black text-slate-800 block mb-1">
                  Nom du groupe d'étude * :
                </label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Équipe Terminale SVT & Génétique"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-hidden font-bold"
                />
              </div>

              {/* Free Custom Subject Input */}
              <div>
                <label className="font-black text-slate-800 block mb-1">
                  Matière d'étude (Tapez votre propre matière librement) * :
                </label>
                <input
                  type="text"
                  required
                  value={newGroupSubject}
                  onChange={(e) => setNewGroupSubject(e.target.value)}
                  placeholder="Ex: Philosophie, Électrotechnique, Droit constitutionnel..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-hidden font-bold"
                />
                <div className="mt-2 space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block">
                    Suggestions rapides de matières :
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {POPULAR_SUBJECT_SUGGESTIONS.map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setNewGroupSubject(subj)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 text-[10px] font-bold border border-slate-200 transition-colors cursor-pointer"
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Privacy: Public or Private */}
              <div>
                <label className="font-black text-slate-800 block mb-1.5">
                  Type de visibilité & Accès * :
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div
                    onClick={() => setNewGroupPrivacy('public')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                      newGroupPrivacy === 'public'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>🌐 Groupe Public</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Visible par tous les utilisateurs de l'application. N'importe qui peut entrer en 1 clic sans code.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewGroupPrivacy('private')}
                    className={`p-3 rounded-2xl border-2 transition-all cursor-pointer space-y-1 ${
                      newGroupPrivacy === 'private'
                        ? 'border-amber-500 bg-amber-50/50 text-amber-950'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>🔒 Groupe Privé</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Visible dans le catalogue, mais l'accès nécessite votre approbation en tant que créateur.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="font-black text-slate-800 block mb-1">
                  Description / Objectifs :
                </label>
                <textarea
                  rows={2}
                  value={newGroupDesc}
                  onChange={(e) => setNewGroupDesc(e.target.value)}
                  placeholder="Ex: Entraide pour réviser le bac et faire des exercices chaque soir."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:opacity-95 text-white font-black shadow-md cursor-pointer"
                >
                  Créer le Groupe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: UPLOAD PHOTO OR PDF DIRECTLY INTO THE GROUP */}
      {/* ============================================================== */}
      {isFileUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span>Partager une Photo ou un PDF</span>
              </h3>
              <button
                onClick={() => setIsFileUploadModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* File input drag/drop box */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleSelectFileToUpload}
                accept="application/pdf,image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50/70 hover:bg-emerald-50/30 text-center cursor-pointer transition-all space-y-2"
              >
                {uploadedFileRaw ? (
                  <div className="space-y-1">
                    <span className="text-2xl">{uploadedFileRaw.type === 'pdf' ? '📄' : '📸'}</span>
                    <div className="font-black text-slate-900 text-xs truncate">
                      {uploadedFileRaw.name}
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Fichier sélectionné ({Math.round(uploadedFileRaw.size / 1024)} Ko) • Cliquez pour changer
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-7 h-7 text-emerald-600 mx-auto" />
                    <div className="font-black text-slate-800">
                      Cliquez pour choisir une photo ou un fichier PDF
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Formats supportés : PDF, PNG, JPG, WEBP (Photos de cours, polycopiés, fiches)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Titre du document * :</label>
                <input
                  type="text"
                  value={uploadFileTitle}
                  onChange={(e) => setUploadFileTitle(e.target.value)}
                  placeholder="Ex: Fiche Révision - Chapitre 3"
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description / Notes :</label>
                <textarea
                  rows={2}
                  value={uploadFileDesc}
                  onChange={(e) => setUploadFileDesc(e.target.value)}
                  placeholder="Ex: Schéma récapitulatif pour le contrôle de demain."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFileUploadModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={!uploadedFileRaw || !uploadFileTitle.trim()}
                  onClick={handleConfirmUploadFile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 text-white font-black text-xs shadow-xs cursor-pointer"
                >
                  Partager dans le groupe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: SHARE DOCUMENT FROM ATELIER/STUDIO */}
      {/* ============================================================== */}
      {isShareDocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-indigo-600" />
              <span>Choisir un Cours de votre Atelier</span>
            </h3>

            {availablePersonalDocs.length === 0 ? (
              <p className="text-xs text-slate-500">
                Vous n'avez pas encore de document analysé dans votre Atelier Studio. Vous pouvez directement importer une photo ou un PDF avec le bouton vert !
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Sélectionner un cours analysé :
                  </label>
                  <select
                    value={selectedDocToShare?.id || ''}
                    onChange={(e) => {
                      const found = availablePersonalDocs.find((d) => d.id === e.target.value);
                      setSelectedDocToShare(found || null);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold bg-slate-50"
                  >
                    <option value="">-- Choisir un cours --</option>
                    {availablePersonalDocs.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.fileType})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Droits d'accès :</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSharePermission('interactive')}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold border ${
                        sharePermission === 'interactive'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Interactif + Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setSharePermission('read_only')}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold border ${
                        sharePermission === 'read_only'
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      Lecture Seule
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setIsShareDocOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold"
              >
                Fermer
              </button>
              <button
                type="button"
                disabled={!selectedDocToShare}
                onClick={handleConfirmShareDocFromStudio}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white font-black shadow-xs cursor-pointer"
              >
                Confirmer le partage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: JOIN WITH DIRECT CODE */}
      {/* ============================================================== */}
      {isJoinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <span>Rejoindre avec un Code d'Invitation</span>
            </h3>

            <p className="text-xs text-slate-500">
              Note : Vous pouvez aussi rejoindre n'importe quel groupe public directement depuis le catalogue sans code !
            </p>

            <form onSubmit={handleJoinWithCode} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Code d’invitation (ex: KIPO-SVT-99) :
                </label>
                <input
                  type="text"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  placeholder="KIPO-XXX-00"
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-mono tracking-wider uppercase focus:border-indigo-500 outline-hidden text-center font-black"
                />
              </div>

              {joinError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-bold">
                  {joinError}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xs cursor-pointer"
                >
                  Valider le code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
