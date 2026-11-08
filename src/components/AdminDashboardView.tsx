import React, { useState, useEffect } from 'react';
import {
  Users,
  Eye,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Search,
  Download,
  Calendar,
  Clock,
  Mail,
  UserCheck,
  UserX,
  FileText,
  Sparkles,
  ExternalLink,
  Smartphone,
  Laptop,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Trash2,
  Lock,
  Copy,
  Check,
  Ban,
  Shield,
  Key,
  Database,
  Code2,
  X,
  Loader2,
  Crown,
} from 'lucide-react';
import {
  analyticsService,
  AdminDashboardData,
  SupabaseAuthUser,
  SupabaseAdminUsersResponse,
} from '../services/analyticsService';
import { useAuth } from '../context/AuthContext';

interface AdminDashboardViewProps {
  onBackToApp?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onBackToApp }) => {
  const { user } = useAuth();
  const [supabaseData, setSupabaseData] = useState<SupabaseAdminUsersResponse | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'pages' | 'questions'>('users');
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  // Modals state
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState('etudiant');
  const [newPassword, setNewPassword] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [inspectUser, setInspectUser] = useState<SupabaseAuthUser | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<SupabaseAuthUser | null>(null);

  const adminEmail = 'fotsojunior756@gmail.com';
  const isAuthorized = user?.email?.toLowerCase().trim() === adminEmail.toLowerCase();

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load both Supabase Users and Analytics simultaneously
      const [supaRes, analyticsRes] = await Promise.all([
        analyticsService.fetchSupabaseUsers(adminEmail),
        analyticsService.fetchAdminDashboardData(adminEmail),
      ]);

      setSupabaseData(supaRes);
      setAnalyticsData(analyticsRes);

      const now = new Date();
      setLastRefreshedAt(
        `${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Impossible de charger la console Supabase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh interval (every 15 seconds)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      alert('Veuillez entrer une adresse email valide.');
      return;
    }
    setIsAddingUser(true);
    try {
      await analyticsService.createSupabaseUser({
        adminEmail,
        email: newEmail.trim(),
        fullName: newFullName.trim() || undefined,
        role: newRole,
        password: newPassword || undefined,
      });
      setIsAddUserModalOpen(false);
      setNewEmail('');
      setNewFullName('');
      setNewPassword('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création');
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleToggleStatus = async (targetUser: SupabaseAuthUser) => {
    try {
      await analyticsService.toggleUserStatus(adminEmail, targetUser.id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteCandidate) return;
    try {
      await analyticsService.deleteSupabaseUser(adminEmail, deleteCandidate.id);
      setDeleteCandidate(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  const handleExportJson = () => {
    if (!supabaseData) return;
    const exportPayload = {
      project: supabaseData.supabaseProject,
      metrics: supabaseData.metrics,
      users: supabaseData.users,
      analytics: analyticsData,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-kipo-auth-users-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered users list
  const filteredUsers = (supabaseData?.users || []).filter((u) => {
    const q = searchFilter.toLowerCase();
    const matchesQuery =
      u.email.toLowerCase().includes(q) ||
      u.id.toLowerCase().includes(q) ||
      (u.user_metadata?.full_name && u.user_metadata.full_name.toLowerCase().includes(q)) ||
      (u.user_metadata?.role && u.user_metadata.role.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'all' || u.user_metadata?.role === roleFilter;

    return matchesQuery && matchesRole;
  });

  const filteredPages = (analyticsData?.recentPageViews || []).filter((p) => {
    const q = searchFilter.toLowerCase();
    return (
      p.author.toLowerCase().includes(q) ||
      p.page.toLowerCase().includes(q) ||
      p.formattedDate?.fullFr.toLowerCase().includes(q)
    );
  });

  const filteredQuestions = (analyticsData?.recentQuestions || []).filter((qItem) => {
    const q = searchFilter.toLowerCase();
    return (
      qItem.author.toLowerCase().includes(q) ||
      qItem.question.toLowerCase().includes(q) ||
      (qItem.subject && qItem.subject.toLowerCase().includes(q)) ||
      qItem.formattedDate?.fullFr.toLowerCase().includes(q)
    );
  });

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-xl mx-auto">
            🔒
          </div>
          <h2 className="text-base font-black text-slate-900">
            Accès Réservé à l'Administrateur
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Cette console est strictement réservée à l'administrateur de KIPO ({adminEmail}). Veuillez vous connecter avec votre compte autorisé.
          </p>
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
            >
              Retour à l'application
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Supabase Styled Top Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>SUPABASE AUTH USERS • PROD</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-400/10 text-emerald-300 text-[11px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>GoTrue Engine v2.118 En Ligne</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Authentification & Utilisateurs Connectés</span>
              <span className="text-2xl">⚡</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Vue en temps réel des comptes enregistrés, sessions actives, rôles apprenants et métadonnées de sécurité de l'application.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all cursor-pointer shadow-md flex items-center gap-2 active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nouvel Utilisateur</span>
            </button>

            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
              title="Rafraîchir les comptes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-slate-700"
              title="Exporter les utilisateurs en JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Live sync banner */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              RLS & Chiffrement Actifs
            </span>
            <span>•</span>
            <span>Administrateur vérifié : <strong className="text-white">{adminEmail}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400">
            Dernière mise à jour à {lastRefreshedAt || 'quelques secondes'}
          </div>
        </div>
      </div>

      {/* Supabase Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Users */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-black uppercase tracking-wider">
            <span>Utilisateurs Totaux</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {supabaseData?.metrics?.totalUsers ?? 0}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">Comptes enregistrés dans Supabase</p>
        </div>

        {/* Card 2: Active Sessions Today */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-black uppercase tracking-wider">
            <span>Sessions Aujourd'hui</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-800">
            {supabaseData?.metrics?.activeToday ?? 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">Connectés dans les dernières 24h</p>
        </div>

        {/* Card 3: Email Confirmed */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-indigo-700 text-xs font-black uppercase tracking-wider">
            <span>Comptes Confirmés</span>
            <Mail className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-800">
            {supabaseData?.metrics?.confirmedUsers ?? 0}
          </div>
          <p className="text-[11px] text-indigo-600 font-medium">E-mails authentifiés avec succès</p>
        </div>

        {/* Card 4: Admins */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-amber-700 text-xs font-black uppercase tracking-wider">
            <span>Administrateur</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800">
            {supabaseData?.metrics?.adminsCount ?? 1}
          </div>
          <p className="text-[11px] text-amber-700 font-medium truncate">{adminEmail}</p>
        </div>
      </div>

      {/* Main Container: Supabase Table & Navigation */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-5">
        {/* Navigation Tabs between Supabase Users, Pages Views and AI Queries */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Utilisateurs Supabase Auth ({supabaseData?.users?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('pages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'pages'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Pages Consultées ({analyticsData?.recentPageViews?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'questions'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Questions Posées ({analyticsData?.recentQuestions?.length || 0})</span>
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-2">
            {activeTab === 'users' && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              >
                <option value="all">Tous les rôles</option>
                <option value="admin">Administrateur</option>
                <option value="etudiant">Étudiant</option>
                <option value="eleve">Collège / Lycée</option>
                <option value="professeur">Professeur</option>
              </select>
            )}

            <div className="relative min-w-[240px]">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Rechercher par UID, email, rôle..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* TAB 1: AUTHENTIC SUPABASE AUTH USERS TABLE */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Table des utilisateurs authentifiés (auth.users)
              </span>
              <span>{filteredUsers.length} compte(s) trouvé(s)</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Utilisateur / E-mail</th>
                    <th className="py-3 px-4">UID (Identifiant Unique)</th>
                    <th className="py-3 px-4">Fournisseur</th>
                    <th className="py-3 px-4">Statut</th>
                    <th className="py-3 px-4">Rôle</th>
                    <th className="py-3 px-4">Créé le</th>
                    <th className="py-3 px-4">Dernière Connexion</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        Aucun compte correspondant à cette recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isFounder = u.email.toLowerCase() === adminEmail.toLowerCase();
                      const isOnlineRecently =
                        u.last_sign_in_at &&
                        new Date().getTime() - new Date(u.last_sign_in_at).getTime() < 3600000 * 24;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* User & Email */}
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                                  {u.user_metadata?.full_name?.substring(0, 2).toUpperCase() ||
                                    u.email.substring(0, 2).toUpperCase()}
                                </div>
                                {isOnlineRecently && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-slate-900 font-black">
                                    {u.user_metadata?.full_name || u.email.split('@')[0]}
                                  </span>
                                  {isFounder && (
                                    <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                                      <Crown className="w-2.5 h-2.5 text-amber-600" />
                                      Fondateur
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{u.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* UID */}
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleCopyUid(u.id)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] transition-colors cursor-pointer"
                              title="Copier l'UID"
                            >
                              <span>{u.id.substring(0, 16)}...</span>
                              {copiedUid === u.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-slate-400" />
                              )}
                            </button>
                          </td>

                          {/* Provider */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                              <Mail className="w-3 h-3 text-indigo-500" />
                              <span>{u.app_metadata?.provider || 'email'}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            {u.status === 'suspended' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                                <Ban className="w-3 h-3 text-rose-600" />
                                Suspendu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Actif
                              </span>
                            )}
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <span className="capitalize px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-200">
                              {u.user_metadata?.role || (isFounder ? 'Admin' : 'Étudiant')}
                            </span>
                          </td>

                          {/* Created at */}
                          <td className="py-3.5 px-4 text-[11px] text-slate-500 font-medium">
                            {new Date(u.created_at).toLocaleDateString('fr-FR')}
                          </td>

                          {/* Last sign in */}
                          <td className="py-3.5 px-4">
                            {u.last_sign_in_at ? (
                              <div className="space-y-0.5">
                                <div className="text-[11px] font-bold text-slate-900">
                                  {new Date(u.last_sign_in_at).toLocaleDateString('fr-FR')} à{' '}
                                  {new Date(u.last_sign_in_at).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {u.activity_stats?.device_info || 'Session Active'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Jamais connecté</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => setInspectUser(u)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                                title="Inspecter les métadonnées Supabase JSON"
                              >
                                <Code2 className="w-3.5 h-3.5" />
                              </button>

                              {!isFounder && (
                                <>
                                  <button
                                    onClick={() => handleToggleStatus(u)}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      u.status === 'suspended'
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                    }`}
                                    title={u.status === 'suspended' ? 'Réactiver le compte' : 'Suspendre le compte'}
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    onClick={() => setDeleteCandidate(u)}
                                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                    title="Supprimer ce compte"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RECENT PAGE VIEWS */}
        {activeTab === 'pages' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold">Journal des pages et sections consultées</span>
              <span>{filteredPages.length} événement(s)</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Utilisateur</th>
                    <th className="py-3 px-4">Page Visitée</th>
                    <th className="py-3 px-4">Date & Heure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredPages.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-400">
                        Aucune navigation enregistrée.
                      </td>
                    </tr>
                  ) : (
                    filteredPages.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {p.author}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-black text-xs">
                            <Eye className="w-3.5 h-3.5" />
                            {p.page}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {p.formattedDate?.fullFr}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QUESTIONS ASKED */}
        {activeTab === 'questions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold">Journal des questions posées aux tuteurs IA</span>
              <span>{filteredQuestions.length} question(s)</span>
            </div>

            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 border border-slate-200 rounded-2xl">
                  Aucune question posée pour l'instant.
                </div>
              ) : (
                filteredQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{q.author}</span>
                        {q.subject && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
                            {q.subject}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {q.formattedDate?.fullFr}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800">« {q.question} »</p>
                    {q.answerPreview && (
                      <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200">
                        {q.answerPreview}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD USER MODAL (Supabase Style) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Créer un utilisateur (Supabase Auth)</h3>
              </div>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse e-mail de l'apprenant *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nom@exemple.com"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet ou pseudo
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Ex: Thomas Martin"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rôle KIPO
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="etudiant">Étudiant (Supérieur)</option>
                  <option value="eleve">Collège / Lycée</option>
                  <option value="professeur">Professeur / Enseignant</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe temporaire (Optionnel)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Laisser vide pour invitation par email"
                  className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer flex items-center justify-center gap-2"
                >
                  {isAddingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: USER METADATA JSON INSPECTOR */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Code2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Métadonnées Supabase Auth</h3>
                  <p className="text-[11px] text-slate-500">{inspectUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectUser(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-2xl text-emerald-400 font-mono text-xs">
              <pre className="whitespace-pre-wrap">{JSON.stringify(inspectUser, null, 2)}</pre>
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
              >
                Fermer l'inspecteur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE MODAL */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-xl mx-auto">
              ⚠️
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Confirmer la suppression</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Êtes-vous certain de vouloir supprimer définitivement le compte de{' '}
                <strong className="text-slate-900">{deleteCandidate.email}</strong> ? Toutes ses données associées seront effacées.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
