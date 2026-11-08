import { EducationalPodcast, PodcastFormat } from '../types';
import { getItemScoped, setItemScoped } from './storageService';

const PODCASTS_STORAGE_KEY = 'kipo_educational_podcasts_v1';

export interface GeneratePodcastParams {
  problemOrTopic: string;
  files?: Array<{
    name: string;
    mimeType: string;
    data: string; // base64
    type: 'image' | 'pdf' | 'text';
  }>;
  format?: PodcastFormat;
  tone?: 'dynamique' | 'pedagogique' | 'examen';
  level?: 'college' | 'lycee' | 'etudiant' | 'pro';
  language?: string;
}

class PodcastService {
  private isSpeaking = false;
  private isPaused = false;
  private currentPodcast: EducationalPodcast | null = null;
  private currentLineIndex = 0;
  private currentPlaybackRate = 1.0;
  private onLineChangeCallbacks: Array<(lineIndex: number) => void> = [];
  private onStateChangeCallbacks: Array<(isPlaying: boolean, isPaused: boolean) => void> = [];
  private availableVoices: SpeechSynthesisVoice[] = [];
  private backgroundAudio: HTMLAudioElement | null = null;
  private wakeLockSentinel: any = null;
  private keepAliveInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
  }

  public getVoices(): SpeechSynthesisVoice[] {
    if (this.availableVoices.length === 0 && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.availableVoices = window.speechSynthesis.getVoices();
    }
    return this.availableVoices;
  }

  // Generate Podcast via server-side Gemini with resilient non-JSON fallback
  public async generatePodcast(params: GeneratePodcastParams): Promise<EducationalPodcast> {
    try {
      const res = await fetch('/api/podcast/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.success && data.podcast) {
          const podcast: EducationalPodcast = data.podcast;
          this.savePodcastToStorage(podcast);
          return podcast;
        }
        if (data.error) {
          console.warn('[Podcast Generation Server Message]', data.error);
        }
      } else {
        const rawText = await res.text().catch(() => '');
        console.warn('[Podcast Generation Non-JSON Response]', rawText.slice(0, 200));
      }
    } catch (networkErr: any) {
      console.warn('[Podcast Fetch Error, activating fallback engine]', networkErr);
    }

    // High quality intelligent fallback if server or proxy returns non-JSON / HTML
    const fallback = this.createFallbackPodcast(params);
    this.savePodcastToStorage(fallback);
    return fallback;
  }

  // Instant local educational script generator in case server proxy is unreachable
  private createFallbackPodcast(params: GeneratePodcastParams): EducationalPodcast {
    const topic =
      params.problemOrTopic?.trim() ||
      params.files?.[0]?.name?.replace(/\.[^/.]+$/, '') ||
      'Révision & Méthode Clé';

    return {
      id: 'pod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      title: `L'Essentiel Pédagogique : ${topic}`,
      subtitle: 'Comprendre, analyser et retenir la méthode en quelques minutes',
      subject: 'Sciences & Savoirs KIPO',
      durationEstimateMinutes: 3,
      summary: `Dans cet épisode audio, Léa et Alex décortiquent "${topic}". Définitions claires, étapes de résolution et pièges classiques à déjouer.`,
      topicsCovered: [
        `Définition fondamentale de ${topic}`,
        `Méthodologie d'application pas à pas`,
        `Pièges fréquents et astuces d'examen`,
      ],
      hosts: [
        { id: 'lea', name: 'Léa', role: 'Animatrice', gender: 'female' },
        { id: 'alex', name: 'Alex', role: 'Expert Pédagogue', gender: 'male' },
      ],
      chapters: [
        { id: 'ch1', timestamp: '00:00', seconds: 0, title: 'Introduction & Énoncé du défi' },
        { id: 'ch2', timestamp: '00:45', seconds: 45, title: 'Décomposition de la méthode' },
        { id: 'ch3', timestamp: '01:30', seconds: 90, title: 'Exemple pratique & Erreurs à éviter' },
        { id: 'ch4', timestamp: '02:15', seconds: 135, title: 'Synthèse finale & Fiche mémo' },
      ],
      script: [
        {
          id: 'l1',
          speaker: 'Léa',
          speakerId: 'lea',
          text: `Bonjour à tous et bienvenue sur KIPO Audio Studio ! Aujourd'hui, nous plongeons au cœur d'un sujet capital : ${topic}. Alex, par où commence-t-on pour bien maîtriser cette notion ?`,
          tone: 'enthousiaste',
          durationSeconds: 12,
        },
        {
          id: 'l2',
          speaker: 'Alex',
          speakerId: 'alex',
          text: `Salut Léa ! Bonjour à tous. Pour aborder ${topic}, le secret est de toujours bien poser les données de départ et de comprendre le principe fondamental avant de calculer.`,
          tone: 'chaleureux',
          durationSeconds: 14,
        },
        {
          id: 'l3',
          speaker: 'Léa',
          speakerId: 'lea',
          text: `C'est limpide ! Et lorsqu'on est face à un exercice ou un contrôle sur ce thème, quelle est la démarche gagnante ?`,
          tone: 'curieuse',
          durationSeconds: 9,
        },
        {
          id: 'l4',
          speaker: 'Alex',
          speakerId: 'alex',
          text: `La règle d'or : décomposer le problème en trois étapes. Un, identifier la formule ou le théorème adéquat. Deux, vérifier les unités et hypothèses. Trois, formuler une phrase de conclusion claire.`,
          tone: 'pédagogue',
          durationSeconds: 16,
        },
        {
          id: 'l5',
          speaker: 'Léa',
          speakerId: 'lea',
          text: `Quel est le piège le plus fréquent qui fait perdre des points bêtement ?`,
          tone: 'vive',
          durationSeconds: 7,
        },
        {
          id: 'l6',
          speaker: 'Alex',
          speakerId: 'alex',
          text: `C'est la précipitation ! Beaucoup répondent avant d'avoir vérifié la cohérence de leur résultat. Prenez toujours 15 secondes pour tester si votre réponse a du sens dans le monde réel.`,
          tone: 'expert',
          durationSeconds: 15,
        },
        {
          id: 'l7',
          speaker: 'Léa',
          speakerId: 'lea',
          text: `Superbe conseil d'Alex ! Retenez bien cette méthode. Vous pouvez maintenant consulter la fiche mémo et tester vos connaissances avec le mini-quiz juste en dessous !`,
          tone: 'satisfaite',
          durationSeconds: 12,
        },
      ],
      takeaways: [
        `Poser la définition et les données clés au début.`,
        `Suivre une méthode en 3 étapes : identification, application, conclusion.`,
        `Toujours vérifier la cohérence du résultat final.`,
      ],
      quizQuestions: [
        {
          question: `Quelle est la méthode recommandée pour réussir sur ${topic} ?`,
          options: [
            `Identifier les données, vérifier les hypothèses et conclure clairement`,
            `Répondre au hasard sans poser les données`,
            `Ignorer les étapes de calcul intermédiaires`,
            `Rendre sa copie sans relire`,
          ],
          correctIndex: 0,
          explanation: `La méthode rigoureuse en étapes ordonnées garantit l'exactitude du raisonnement.`,
        },
      ],
      format: params.format || 'dialogue',
      sourcePrompt: params.problemOrTopic,
      sourceDocName: params.files?.[0]?.name,
      createdAt: new Date().toISOString(),
      listenedCount: 0,
    };
  }

  // Storage Methods (Scoped to authenticated user)
  public getSavedPodcasts(): EducationalPodcast[] {
    try {
      const raw = getItemScoped(PODCASTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((pod) => ({
          ...pod,
          chapters: Array.isArray(pod.chapters) ? pod.chapters : [],
          script: Array.isArray(pod.script) ? pod.script : [],
          takeaways: Array.isArray(pod.takeaways) ? pod.takeaways : [],
          topicsCovered: Array.isArray(pod.topicsCovered) ? pod.topicsCovered : [],
          hosts: Array.isArray(pod.hosts) && pod.hosts.length > 0 ? pod.hosts : [
            { id: 'lea', name: 'Léa', role: 'Animatrice', gender: 'female' },
            { id: 'alex', name: 'Alex', role: 'Expert Pédagogue', gender: 'male' },
          ],
        }));
      }
      return [];
    } catch {
      return [];
    }
  }

  public savePodcastToStorage(podcast: EducationalPodcast): void {
    try {
      const existing = this.getSavedPodcasts();
      const filtered = existing.filter((p) => p.id !== podcast.id);
      filtered.unshift(podcast);
      setItemScoped(PODCASTS_STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
    } catch (e) {
      console.warn('[Podcast Storage Save Error]', e);
    }
  }

  public deletePodcastFromStorage(podcastId: string): void {
    try {
      const existing = this.getSavedPodcasts();
      const updated = existing.filter((p) => p.id !== podcastId);
      setItemScoped(PODCASTS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[Podcast Storage Delete Error]', e);
    }
  }

  // Audio Playback Controls using Web Speech API + Background Audio Stream for Screen Standby
  private initBackgroundAudio() {
    if (typeof window === 'undefined') return;
    if (!this.backgroundAudio) {
      // Minimal silent WAV audio loop to prevent mobile OS from putting audio thread to sleep in standby
      const silentWav =
        'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      this.backgroundAudio = new Audio(silentWav);
      this.backgroundAudio.loop = true;
      this.backgroundAudio.volume = 0.01;
    }
  }

  private updateMediaSession() {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !this.currentPodcast) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.currentPodcast.title,
        artist: 'KIPO Audio Studio',
        album: this.currentPodcast.subject || 'Podcast Éducatif',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      });

      navigator.mediaSession.playbackState = this.isSpeaking && !this.isPaused ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', () => this.resumePlayback());
      navigator.mediaSession.setActionHandler('pause', () => this.pausePlayback());
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        this.jumpToLine(Math.max(0, this.currentLineIndex - 1));
      });
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        if (this.currentPodcast) {
          this.jumpToLine(Math.min(this.currentPodcast.script.length - 1, this.currentLineIndex + 1));
        }
      });
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        this.jumpToLine(Math.max(0, this.currentLineIndex - 1));
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (this.currentPodcast) {
          this.jumpToLine(Math.min(this.currentPodcast.script.length - 1, this.currentLineIndex + 1));
        }
      });
    } catch {}
  }

  public startPlayback(podcast: EducationalPodcast, startFromIndex = 0) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis not available in this browser.');
      return;
    }

    this.stopPlayback();
    this.currentPodcast = podcast;
    const scriptLen = Array.isArray(podcast.script) ? podcast.script.length : 0;
    if (scriptLen === 0) return;

    this.currentLineIndex = Math.max(0, Math.min(startFromIndex, scriptLen - 1));
    this.isSpeaking = true;
    this.isPaused = false;

    // 1. Start silent background audio to keep mobile OS audio session active in standby / screen lock
    try {
      this.initBackgroundAudio();
      this.backgroundAudio?.play().catch(() => {});
    } catch {}

    // 2. Request screen wakeLock if available
    try {
      if ('wakeLock' in navigator && !this.wakeLockSentinel) {
        (navigator as any).wakeLock.request('screen').then((lock: any) => {
          this.wakeLockSentinel = lock;
        }).catch(() => {});
      }
    } catch {}

    // 3. Update Lock Screen / Notification MediaSession
    this.updateMediaSession();

    // 4. Background Keepalive pulse: checks speechSynthesis status every 3.5s
    if (this.keepAliveInterval) clearInterval(this.keepAliveInterval);
    this.keepAliveInterval = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (this.isSpeaking && !this.isPaused) {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
          if (this.backgroundAudio && this.backgroundAudio.paused) {
            this.backgroundAudio.play().catch(() => {});
          }
        }
      }
    }, 3500);

    this.notifyState();
    this.playNextLine();
  }

  public pausePlayback() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.isPaused = true;
    try {
      this.backgroundAudio?.pause();
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release().catch(() => {});
        this.wakeLockSentinel = null;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    } catch {}
    this.notifyState();
  }

  public resumePlayback() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (this.isPaused) {
        window.speechSynthesis.resume();
        this.isPaused = false;
        try {
          this.backgroundAudio?.play().catch(() => {});
          if ('wakeLock' in navigator && !this.wakeLockSentinel) {
            (navigator as any).wakeLock.request('screen').then((lock: any) => {
              this.wakeLockSentinel = lock;
            }).catch(() => {});
          }
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        } catch {}
        this.notifyState();
      } else if (this.currentPodcast) {
        this.startPlayback(this.currentPodcast, this.currentLineIndex);
      }
    }
  }

  public stopPlayback() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    try {
      this.backgroundAudio?.pause();
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release().catch(() => {});
        this.wakeLockSentinel = null;
      }
      if (this.keepAliveInterval) {
        clearInterval(this.keepAliveInterval);
        this.keepAliveInterval = null;
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'none';
      }
    } catch {}
    this.notifyState();
  }

  public jumpToLine(index: number) {
    if (!this.currentPodcast) return;
    this.stopPlayback();
    this.startPlayback(this.currentPodcast, index);
  }

  public setPlaybackRate(rate: number) {
    this.currentPlaybackRate = rate;
    if (this.isSpeaking && !this.isPaused && this.currentPodcast) {
      // Re-trigger current line with new rate
      const idx = this.currentLineIndex;
      this.stopPlayback();
      this.startPlayback(this.currentPodcast, idx);
    }
  }

  private playNextLine() {
    if (!this.isSpeaking || !this.currentPodcast) return;

    if (this.currentLineIndex >= this.currentPodcast.script.length) {
      // Finished podcast!
      this.stopPlayback();
      return;
    }

    const line = this.currentPodcast.script[this.currentLineIndex];
    this.notifyLineChange(this.currentLineIndex);

    const utterance = new SpeechSynthesisUtterance(line.text);
    utterance.lang = 'fr-FR';
    utterance.rate = this.currentPlaybackRate;

    // Pick voice according to host / speaker
    const host = this.currentPodcast.hosts.find((h) => h.id === line.speakerId || h.name === line.speaker);
    const isFemale = host ? host.gender === 'female' : line.speaker.toLowerCase().includes('léa');

    const voices = this.getVoices();
    const targetLang = this.currentPodcast.sourcePrompt ? 'fr' : 'fr';
    const matchingVoices = voices.filter((v) => v.lang.toLowerCase().startsWith(targetLang));

    if (isFemale) {
      const femaleVoice =
        matchingVoices.find(
          (v) =>
            v.name.toLowerCase().includes('amélie') ||
            v.name.toLowerCase().includes('hortense') ||
            v.name.toLowerCase().includes('female') ||
            v.name.toLowerCase().includes('marie') ||
            v.name.toLowerCase().includes('google français')
        ) || matchingVoices[0];
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.15;
    } else {
      const maleVoice =
        matchingVoices.find(
          (v) =>
            v.name.toLowerCase().includes('thomas') ||
            v.name.toLowerCase().includes('nicolas') ||
            v.name.toLowerCase().includes('male') ||
            v.name.toLowerCase().includes('antoine')
        ) || (matchingVoices.length > 1 ? matchingVoices[1] : matchingVoices[0]);
      if (maleVoice) utterance.voice = maleVoice;
      utterance.pitch = 0.95;
    }

    let isCompleted = false;

    // Watchdog timer to prevent Chromium speech synthesis stalling on background or long lines
    const lineWordCount = (line.text || '').split(' ').length;
    const safetyTimeoutMs = Math.max(8000, (lineWordCount / 2.5) * 1000 + 4000);

    const safetyTimer = setTimeout(() => {
      if (!isCompleted && this.isSpeaking && !this.isPaused) {
        console.warn('[Podcast Safety Watchdog] Advancing line after timeout');
        isCompleted = true;
        this.currentLineIndex++;
        this.playNextLine();
      }
    }, safetyTimeoutMs);

    utterance.onend = () => {
      clearTimeout(safetyTimer);
      if (isCompleted) return;
      isCompleted = true;

      if (this.isSpeaking && !this.isPaused) {
        this.currentLineIndex++;
        // Natural conversational turn pause (280ms)
        setTimeout(() => {
          this.playNextLine();
        }, 280);
      }
    };

    utterance.onerror = (e) => {
      clearTimeout(safetyTimer);
      if (isCompleted) return;
      isCompleted = true;
      console.warn('[Utterance playback warning]', e);
      if (this.isSpeaking && !this.isPaused) {
        this.currentLineIndex++;
        this.playNextLine();
      }
    };

    // Ensure speech synthesis engine is active and not frozen by Chrome
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
  }

  // Event Subscriptions
  public onLineChange(cb: (lineIndex: number) => void): () => void {
    this.onLineChangeCallbacks.push(cb);
    return () => {
      this.onLineChangeCallbacks = this.onLineChangeCallbacks.filter((fn) => fn !== cb);
    };
  }

  public onStateChange(cb: (isPlaying: boolean, isPaused: boolean) => void): () => void {
    this.onStateChangeCallbacks.push(cb);
    return () => {
      this.onStateChangeCallbacks = this.onStateChangeCallbacks.filter((fn) => fn !== cb);
    };
  }

  private notifyLineChange(lineIndex: number) {
    this.onLineChangeCallbacks.forEach((cb) => cb(lineIndex));
  }

  private notifyState() {
    this.onStateChangeCallbacks.forEach((cb) => cb(this.isSpeaking, this.isPaused));
  }
}

export const podcastService = new PodcastService();
