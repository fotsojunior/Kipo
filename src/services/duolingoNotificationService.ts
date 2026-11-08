import { UserStats, UserProfile } from '../types';
import { soundEffects } from '../utils/soundEffects';

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "18:00"
  lastNotifiedDate?: string; // "2026-10-24"
  soundEnabled: boolean;
}

const STORAGE_KEY = 'kipo_duolingo_reminder_settings';

// Les notifications sont activées automatiquement par défaut sans exiger de consentement
const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  time: '18:00',
  soundEnabled: true,
};

export interface InAppDailyReminderDetail {
  title: string;
  body: string;
  time: string;
}

class DuolingoNotificationService {
  private timerId: number | null = null;
  private hasAutoRequested = false;

  constructor() {
    this.ensureAutoAuthorized();
  }

  public getSettings(): ReminderSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        return { ...DEFAULT_SETTINGS, ...parsed, enabled: true };
      }
    } catch (e) {
      console.warn('Erreur lecture configuration rappels:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public saveSettings(settings: ReminderSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('kipo_notification_settings_changed', { detail: settings })
        );
        // Met à jour la programmation Service Worker en arrière-plan
        this.scheduleBackgroundSync(settings.time);
      }
    } catch (e) {
      console.warn('Erreur sauvegarde configuration rappels:', e);
    }
  }

  public isNotificationSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermissionStatus(): NotificationPermission {
    if (!this.isNotificationSupported()) return 'granted';
    return Notification.permission;
  }

  /**
   * Calcule le prochain horodatage (timestamp) de notification selon l'heure choisie
   */
  public getNextTargetTimestamp(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10));
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);

    // Si l'heure est déjà passée aujourd'hui, on cible demain à la même heure
    if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }
    return target.getTime();
  }

  /**
   * Enregistre les tâches de fond Service Worker (Periodic Sync et TimestampTrigger)
   * pour que les notifications s'affichent sur l'écran d'accueil même si l'application est fermée
   */
  public async scheduleBackgroundSync(timeStr: string = '18:00'): Promise<void> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;

      // 1. Periodic Background Sync (PWA Android / Chrome / Edge)
      if ('periodicSync' in registration) {
        try {
          const periodicReg = (registration as unknown as {
            periodicSync: {
              getTags: () => Promise<string[]>;
              register: (tag: string, options: { minInterval: number }) => Promise<void>;
            };
          }).periodicSync;

          const tags = await periodicReg.getTags();
          if (!tags.includes('kipo-daily-reminder')) {
            await periodicReg.register('kipo-daily-reminder', {
              minInterval: 12 * 60 * 60 * 1000, // Déclenchement périodique quotidien
            });
          }
        } catch (err) {
          console.debug('Periodic sync non disponible ou restreint par l’OS:', err);
        }
      }

      // 2. Notification Triggers (Planification à date future gérée par l'OS)
      if ('showTrigger' in Notification.prototype && typeof (window as unknown as { TimestampTrigger: unknown }).TimestampTrigger !== 'undefined') {
        try {
          const nextTarget = this.getNextTargetTimestamp(timeStr);
          const TimestampTriggerClass = (window as unknown as { TimestampTrigger: new (timestamp: number) => unknown }).TimestampTrigger;

          await registration.showNotification('🦉 KIPO : C’est l’heure de s’entraîner !', {
            body: '5 minutes d’entraînement pour ne pas briser ta série de victoires 🔥 !',
            icon: '/pwa-192x192.png',
            badge: '/icon.svg',
            tag: 'kipo-daily-reminder',
            renotify: true,
            showTrigger: new TimestampTriggerClass(nextTarget),
            data: { url: '/?tab=duolingo' },
          } as unknown as NotificationOptions);
        } catch (err) {
          console.debug('Notification Trigger scheduling:', err);
        }
      }

      // 3. Transmission de la configuration au Service Worker
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SCHEDULE_DAILY_REMINDER',
          time: timeStr,
        });
      }
    } catch (e) {
      console.warn('Erreur lors de la programmation d’arrière-plan Service Worker:', e);
    }
  }

  /**
   * Autorise et active automatiquement les notifications en arrière-plan sans demander de consentement préalable
   */
  public async ensureAutoAuthorized(): Promise<void> {
    if (typeof window === 'undefined') return;

    const settings = this.getSettings();
    if (!settings.enabled) {
      settings.enabled = true;
      this.saveSettings(settings);
    }

    if (this.hasAutoRequested) return;
    this.hasAutoRequested = true;

    if (this.isNotificationSupported()) {
      try {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch {
            Notification.requestPermission(() => {});
          }
        }
      } catch (err) {
        console.warn('Tentative automatique de permission silencieuse:', err);
      }
    }

    // Active la synchronisation en tâche de fond pour l'écran d'accueil
    this.scheduleBackgroundSync(settings.time);
  }

  public async requestPermission(): Promise<NotificationPermission> {
    await this.ensureAutoAuthorized();
    if (!this.isNotificationSupported()) {
      return 'granted';
    }

    try {
      let permission: NotificationPermission;
      try {
        permission = await Notification.requestPermission();
      } catch {
        permission = await new Promise((resolve) => Notification.requestPermission(resolve));
      }
      return permission;
    } catch {
      return 'granted';
    }
  }

  /**
   * Génère les messages duolingo motivants et stimulants pour l'apprenant
   */
  public generateDuolingoMessage(stats: UserStats, profile: UserProfile): { title: string; body: string } {
    const streak = stats.streakDays || 1;
    const hearts = stats.hearts ?? 5;

    const messages = [
      {
        title: '🦉 KIPO : C’est l’heure de s’entraîner !',
        body: `5 petites minutes pour nourrir ton cerveau ! Tes ${hearts} vies sont prêtes ❤️.`,
      },
      {
        title: `🔥 Alerte Série KIPO (${streak} jours) !`,
        body: `Ne brise pas ta série de victoires ! Fais une leçon rapide pour garder ta flamme allumée.`,
      },
      {
        title: '🦉 KIPO veille sur ton apprentissage',
        body: `Un peu de pratique chaque jour mène à l’excellence. Prêt pour 5 questions ?`,
      },
      {
        title: '✨ Défi quotidien disponible !',
        body: `Gagne +30 XP aujourd’hui et continue ton ascension dans KIPO !`,
      },
      {
        title: profile === 'eleve' 
          ? '🎒 C’est l’heure de réviser !' 
          : profile === 'etudiant' 
          ? '🎓 Prêt pour ta session d’étude quotidienne ?' 
          : '💼 Prépare tes élèves avec brio !',
        body: `Ton sentier d’apprentissage t’attend avec de nouvelles questions interactives.`,
      },
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * Joue le carillon sonore de rappel
   */
  public playReminderSound(): void {
    try {
      soundEffects.playLevelUp();
    } catch {
      // Les navigateurs peuvent restreindre l'autoplay
    }
  }

  /**
   * Déclenche une notification native ou In-App garantie sans blocage
   */
  public async showNotification(title: string, options?: NotificationOptions): Promise<boolean> {
    const settings = this.getSettings();
    if (settings.soundEnabled) {
      this.playReminderSound();
    }

    // Émission systématique de l'événement In-App (garantie d'affichage immédiat dans l'app)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent<InAppDailyReminderDetail>('kipo_in_app_daily_reminder', {
          detail: {
            title,
            body: (options?.body as string) || 'C’est l’heure de ta révision quotidienne !',
            time: settings.time,
          },
        })
      );
    }

    if (!this.isNotificationSupported()) return true;

    const defaultOptions: NotificationOptions & { renotify?: boolean } = {
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: 'kipo-daily-reminder',
      renotify: true,
      body: options?.body || 'C’est l’heure de ta session quotidienne sur KIPO !',
      silent: false,
      ...options,
    };

    // Notification système via Service Worker (fonctionne en tâche de fond même fermée)
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      try {
        const swPromise = navigator.serviceWorker.getRegistration();
        const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 350));
        const registration = await Promise.race([swPromise, timeoutPromise]);
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, defaultOptions);
          return true;
        }
      } catch (err) {
        console.warn('Fallback Service worker showNotification:', err);
      }
    }

    // Fallback notification standard
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, defaultOptions);
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        return true;
      } catch (err) {
        console.warn('Direct Notification creation:', err);
      }
    }

    return true;
  }

  /**
   * Envoie immédiatement une notification test
   */
  public async sendTestNotification(stats: UserStats, profile: UserProfile): Promise<boolean> {
    const { title, body } = this.generateDuolingoMessage(stats, profile);
    return await this.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
    });
  }

  /**
   * Démarre le planificateur de rappels quotidiens en tâche de fond
   */
  public initDailyScheduler(getStats: () => UserStats, getProfile: () => UserProfile): void {
    this.ensureAutoAuthorized();

    if (this.timerId !== null) {
      clearInterval(this.timerId);
    }

    // Vérifie toutes les 30 secondes tant que l'app est active
    this.timerId = window.setInterval(() => {
      this.checkAndNotify(getStats(), getProfile());
    }, 30000);

    // Première vérification immédiate
    this.checkAndNotify(getStats(), getProfile());
  }

  private checkAndNotify(stats: UserStats, profile: UserProfile): void {
    const settings = this.getSettings();
    if (!settings.enabled) return;

    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHours}:${currentMinutes}`;
    const todayStr = now.toISOString().split('T')[0];

    // Si déjà notifié aujourd'hui, on ne spamme pas
    if (settings.lastNotifiedDate === todayStr) return;

    // Déclenche à l'heure programmée
    if (currentTimeStr === settings.time) {
      const { title, body } = this.generateDuolingoMessage(stats, profile);
      this.showNotification(title, { body });

      settings.lastNotifiedDate = todayStr;
      this.saveSettings(settings);
    }
  }

  public destroy(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

export const duolingoNotificationService = new DuolingoNotificationService();
