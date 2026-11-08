// KIPO Analytics & Founder Activity Tracking Service
// Tracks user sessions, page views, and questions asked (both registered & anonymous visitors)

export interface TrackedEvent {
  id: string;
  visitorId: string;
  userEmail: string | null;
  eventType: 'page_view' | 'question_asked' | 'session_start' | 'login';
  timestamp: string;
  formattedDate: {
    heure: string;
    jour: string;
    mois: string;
    annee: string;
    fullFr: string;
  };
  data: {
    page?: string;
    question?: string;
    subject?: string;
    answerPreview?: string;
    role?: string;
    deviceInfo?: string;
  };
}

export interface AdminDashboardData {
  authorized: boolean;
  adminEmail: string;
  stats: {
    totalVisitors: number;
    registeredCount: number;
    anonymousCount: number;
    totalPagesViews: number;
    totalQuestionsAsked: number;
  };
  users: Array<{
    id: string;
    email: string | null;
    isRegistered: boolean;
    firstSeen: string;
    lastSeen: string;
    role?: string;
    pagesCount: number;
    questionsCount: number;
    formattedLastSeen?: string;
  }>;
  recentQuestions: Array<{
    id: string;
    author: string;
    isRegistered: boolean;
    question: string;
    subject?: string;
    answerPreview?: string;
    timestamp: string;
    formattedDate: {
      heure: string;
      jour: string;
      mois: string;
      annee: string;
      fullFr: string;
    };
  }>;
  recentPageViews: Array<{
    id: string;
    author: string;
    isRegistered: boolean;
    page: string;
    timestamp: string;
    formattedDate: {
      heure: string;
      jour: string;
      mois: string;
      annee: string;
      fullFr: string;
    };
  }>;
}

const VISITOR_ID_KEY = 'kipo_visitor_id';
const LOCAL_ANALYTICS_EVENTS_KEY = 'kipo_local_analytics_events';
const ADMIN_EMAIL = 'fotsojunior756@gmail.com';

class AnalyticsService {
  private visitorId: string;
  private currentUserEmail: string | null = null;

  constructor() {
    this.visitorId = this.getOrCreateVisitorId();
  }

  public getOrCreateVisitorId(): string {
    try {
      let id = localStorage.getItem(VISITOR_ID_KEY);
      if (!id) {
        id = `anon_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
        localStorage.setItem(VISITOR_ID_KEY, id);
      }
      return id;
    } catch {
      return `anon_${Math.random().toString(36).substring(2, 8)}`;
    }
  }

  public setUserEmail(email: string | null) {
    this.currentUserEmail = email;
    if (email) {
      this.trackEvent('login', { role: 'authenticated' });
    }
  }

  public getAdminEmail(): string {
    return ADMIN_EMAIL;
  }

  public isFounder(email?: string | null): boolean {
    if (!email) return false;
    return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
  }

  private formatDate(date: Date) {
    const heure = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const jour = date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
    });
    const mois = date.toLocaleDateString('fr-FR', { month: 'long' });
    const annee = date.getFullYear().toString();
    const fullFr = `${date.toLocaleDateString('fr-FR')} à ${heure}`;

    return { heure, jour, mois, annee, fullFr };
  }

  public async trackEvent(
    eventType: TrackedEvent['eventType'],
    data: TrackedEvent['data']
  ): Promise<void> {
    const now = new Date();
    const event: TrackedEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      visitorId: this.visitorId,
      userEmail: this.currentUserEmail,
      eventType,
      timestamp: now.toISOString(),
      formattedDate: this.formatDate(now),
      data: {
        ...data,
        deviceInfo: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile (Android/iOS)' : 'Ordinateur (Desktop)') : 'Inconnu',
      },
    };

    // Store in local backup
    this.saveLocalEvent(event);

    // Send to backend API
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (e) {
      // Graceful offline failover
      console.warn('[Analytics] Sauvegarde locale active (réseau indisponible)');
    }
  }

  public trackPageView(pageName: string) {
    return this.trackEvent('page_view', { page: pageName });
  }

  public trackQuestion(params: {
    question: string;
    subject?: string;
    answerPreview?: string;
  }) {
    return this.trackEvent('question_asked', params);
  }

  public trackSessionStart(role?: string) {
    return this.trackEvent('session_start', { role });
  }

  private saveLocalEvent(event: TrackedEvent) {
    try {
      const existing = this.getLocalEvents();
      existing.unshift(event);
      // Keep up to 200 local events
      if (existing.length > 200) existing.length = 200;
      localStorage.setItem(LOCAL_ANALYTICS_EVENTS_KEY, JSON.stringify(existing));
    } catch {
      // Ignore quota errors
    }
  }

  public getLocalEvents(): TrackedEvent[] {
    try {
      const raw = localStorage.getItem(LOCAL_ANALYTICS_EVENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public async fetchAdminDashboardData(adminEmail: string): Promise<AdminDashboardData> {
    const res = await fetch(`/api/analytics/admin-data?email=${encodeURIComponent(adminEmail)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Accès non autorisé au tableau de bord administrateur.');
    }
    return await res.json();
  }

  public async fetchSupabaseUsers(adminEmail: string): Promise<SupabaseAdminUsersResponse> {
    const res = await fetch(`/api/admin/supabase-users?email=${encodeURIComponent(adminEmail)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Impossible de récupérer la liste des utilisateurs Supabase.');
    }
    return await res.json();
  }

  public async createSupabaseUser(params: {
    adminEmail: string;
    email: string;
    fullName?: string;
    role?: string;
    password?: string;
  }): Promise<SupabaseAuthUser> {
    const res = await fetch('/api/admin/supabase-users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors de la création du compte.');
    }
    return data.user;
  }

  public async deleteSupabaseUser(adminEmail: string, userId: string): Promise<void> {
    const res = await fetch('/api/admin/supabase-users/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, userId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors de la suppression.');
    }
  }

  public async toggleUserStatus(adminEmail: string, userId: string): Promise<string> {
    const res = await fetch('/api/admin/supabase-users/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminEmail, userId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Erreur lors du changement de statut.');
    }
    return data.status;
  }

  public async syncSession(params: {
    email: string;
    fullName?: string;
    role?: string;
    deviceInfo?: string;
    lastPage?: string;
  }): Promise<void> {
    try {
      await fetch('/api/auth/sync-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
    } catch {
      // Background non-blocking sync
    }
  }

  public async resetAnalyticsData(adminEmail: string): Promise<void> {
    const res = await fetch('/api/analytics/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail }),
    });
    if (!res.ok) {
      throw new Error('Impossible de réinitialiser les données.');
    }
  }
}

export interface SupabaseAuthUser {
  id: string;
  aud: string;
  role: string;
  email: string;
  email_confirmed_at: string | null;
  phone: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    full_name: string;
    role: string;
    avatar_url?: string;
  };
  identities: any[];
  created_at: string;
  updated_at: string;
  is_anonymous: boolean;
  banned_until: string | null;
  status: 'active' | 'suspended';
  is_admin: boolean;
  activity_stats: {
    pages_visited: number;
    questions_asked: number;
    podcasts_created: number;
    last_page: string;
    device_info: string;
  };
}

export interface SupabaseAdminUsersResponse {
  authorized: boolean;
  supabaseProject: {
    name: string;
    region: string;
    authEngine: string;
    jwtSecretStatus: string;
    status: string;
  };
  metrics: {
    totalUsers: number;
    activeToday: number;
    confirmedUsers: number;
    adminsCount: number;
  };
  users: SupabaseAuthUser[];
}

export const analyticsService = new AnalyticsService();

