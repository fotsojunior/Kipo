// Voice Service for KIPO AI: Speech-to-Text (Dictation) & Text-to-Speech (Vocal Tutor)

export interface VoiceServiceStatus {
  isListening: boolean;
  isSpeaking: boolean;
  speakingId: string | null;
  supportedSpeechRecognition: boolean;
  supportedSpeechSynthesis: boolean;
  error?: string | null;
}

// Clean markdown, symbols, hashtags, asterisks and LaTeX formulas before reading aloud
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1') // Strip $$
    .replace(/\$([^\$\n]+)\$/g, '$1')     // Strip $
    .replace(/```[\s\S]*?```/g, '')       // Strip code blocks
    .replace(/`([^`]+)`/g, '$1')          // Strip inline code
    .replace(/^#+\s+/gm, '')              // Strip markdown headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')    // Strip bold **
    .replace(/\*([^*]+)\*/g, '$1')        // Strip italic *
    .replace(/^[\-\*]\s+/gm, '')          // Strip bullet list markers
    .replace(/\s+/g, ' ')                 // Normalize whitespace
    .trim();
}

type SpeechRecognitionType = any;

class VoiceService {
  private recognition: SpeechRecognitionType | null = null;
  private isRecognitionActive = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentlySpeakingId: string | null = null;
  private onStatusChangeListeners: Set<() => void> = new Set();

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;
      } catch (e) {
        console.warn('SpeechRecognition initialization failed:', e);
      }
    }
  }

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window;
  }

  public isListening(): boolean {
    return this.isRecognitionActive;
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
    return window.speechSynthesis.speaking;
  }

  public getSpeakingId(): string | null {
    return this.isSpeaking() ? this.currentlySpeakingId : null;
  }

  public subscribe(listener: () => void): () => void {
    this.onStatusChangeListeners.add(listener);
    return () => this.onStatusChangeListeners.delete(listener);
  }

  private notify() {
    this.onStatusChangeListeners.forEach((l) => l());
  }

  /**
   * Start listening to user voice input.
   * Calls onResult with transcript (interim or final), and onEnd when stopped.
   */
  public startListening(options: {
    lang?: string;
    onResult: (transcript: string, isFinal: boolean) => void;
    onError?: (error: string) => void;
    onEnd?: () => void;
  }): boolean {
    if (!this.recognition) {
      this.initRecognition();
    }

    if (!this.recognition) {
      options.onError?.('La reconnaissance vocale n\'est pas prise en charge par ce navigateur.');
      return false;
    }

    // Stop speaking if AI is talking
    this.stopSpeaking();

    try {
      this.recognition.lang = options.lang || 'fr-FR';

      this.recognition.onstart = () => {
        this.isRecognitionActive = true;
        this.notify();
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        options.onResult(transcript, isFinal);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Voice input error:', event.error);
        this.isRecognitionActive = false;
        this.notify();

        let friendlyMsg = 'Erreur lors de la capture vocale.';
        if (event.error === 'not-allowed') {
          friendlyMsg = 'Accès au microphone refusé. Autorisez le micro dans votre navigateur.';
        } else if (event.error === 'no-speech') {
          friendlyMsg = 'Aucune voix détectée.';
        }
        options.onError?.(friendlyMsg);
      };

      this.recognition.onend = () => {
        this.isRecognitionActive = false;
        this.notify();
        options.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err) {
      console.warn('Failed to start speech recognition:', err);
      this.isRecognitionActive = false;
      this.notify();
      options.onError?.('Impossible d\'activer le microphone pour le moment.');
      return false;
    }
  }

  /**
   * Stop listening to microphone.
   */
  public stopListening(): void {
    if (this.recognition && this.isRecognitionActive) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Ignored
      }
      this.isRecognitionActive = false;
      this.notify();
    }
  }

  /**
   * Read text aloud using browser SpeechSynthesis (Vocal Tutor KIPO).
   */
  public speak(
    id: string,
    rawText: string,
    options?: {
      lang?: string;
      rate?: number;
      pitch?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (!this.isSpeechSynthesisSupported()) {
      options?.onError?.('La synthèse vocale n\'est pas supportée sur cet appareil.');
      return;
    }

    // If already speaking this item, toggle stop
    if (this.currentlySpeakingId === id && this.isSpeaking()) {
      this.stopSpeaking();
      return;
    }

    // Stop previous utterance
    this.stopSpeaking();

    const cleanText = cleanTextForSpeech(rawText);
    if (!cleanText) return;

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      const targetLang = options?.lang || 'fr-FR';
      utterance.lang = targetLang;
      utterance.rate = options?.rate ?? 1.0;
      utterance.pitch = options?.pitch ?? 1.0;

      // Try selecting a natural sounding voice
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()) &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Amélie') ||
              v.name.includes('Thomas') ||
              v.name.includes('Audrey'))
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(targetLang.slice(0, 2).toLowerCase()));

        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      this.currentlySpeakingId = id;
      this.currentUtterance = utterance;

      utterance.onstart = () => {
        options?.onStart?.();
        this.notify();
      };

      utterance.onend = () => {
        if (this.currentlySpeakingId === id) {
          this.currentlySpeakingId = null;
          this.currentUtterance = null;
        }
        options?.onEnd?.();
        this.notify();
      };

      utterance.onerror = (e) => {
        if (this.currentlySpeakingId === id) {
          this.currentlySpeakingId = null;
          this.currentUtterance = null;
        }
        options?.onError?.(e);
        this.notify();
      };

      window.speechSynthesis.speak(utterance);
      this.notify();
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      this.currentlySpeakingId = null;
      this.currentUtterance = null;
      this.notify();
    }
  }

  /**
   * Stop speaking immediately.
   */
  public stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // Ignored
      }
    }
    this.currentlySpeakingId = null;
    this.currentUtterance = null;
    this.notify();
  }
}

export const voiceService = new VoiceService();
