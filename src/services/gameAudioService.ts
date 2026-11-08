// Web Audio API Synthesizer for Kipo Animal Games (Zero external dependencies)
class GameAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playCorrect() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);

        gain.gain.setValueAtTime(0.001, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.28);
      });
    } catch {
      // AudioContext policy fallback
    }
  }

  public playWrong() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.25);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  public playAttack() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {}
  }

  public playBossHit() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.3);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  public playPowerUp() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [392, 493.88, 587.33, 783.99, 987.77, 1174.66];

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.001, now + idx * 0.05);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.05 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.38);
      });
    } catch {}
  }

  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const melody = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 523.25, d: 0.12 }, // C5
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.3 },  // E5
        { f: 783.99, d: 0.2 },  // G5
        { f: 1046.5, d: 0.6 },  // C6
      ];

      let t = now;
      melody.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + note.d + 0.05);
        t += note.d + 0.02;
      });
    } catch {}
  }

  public playCoin() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {}
  }

  // Squishy wet tomato splat sound when answer is wrong
  public playTomatoSplat() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Dual oscillator for wet squish impact
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(320, now);
      osc1.frequency.exponentialRampToValueAtTime(60, now + 0.22);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(140, now);
      osc2.frequency.exponentialRampToValueAtTime(40, now + 0.25);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch {}
  }

  // Sparkling bloom chime when flowers & hearts cover screen on correct answer
  public playFlowerCelebration() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5]; // C5, E5, G5, B5, C6, E6

      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.06);

        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.42);
      });
    } catch {}
  }

  // Animal Onomatopoeias & Realistic sound synthesis
  // Chien: aboiement "Wouf ! Wouf !"
  public playDogBark() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // 2 quick bursts of bark (Wouf ! Wouf !)
      [0, 0.16].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(340, now + offset);
        osc.frequency.exponentialRampToValueAtTime(110, now + offset + 0.11);

        gain.gain.setValueAtTime(0.35, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.12);
      });
    } catch {}
  }

  // Chat: miaulement "Miaou !"
  public playCatMeow() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Pitch curves upward then descends gracefully (Mi-aa-ou)
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.38);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }

  // Hibou: hululer "Hou-hou !"
  public playOwlHoot() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Hou... Houuu !
      [
        { start: 0, dur: 0.18, freq: 380 },
        { start: 0.22, dur: 0.35, freq: 340 },
      ].forEach((h) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(h.freq, now + h.start);
        osc.frequency.exponentialRampToValueAtTime(h.freq - 40, now + h.start + h.dur);

        gain.gain.setValueAtTime(0.001, now + h.start);
        gain.gain.linearRampToValueAtTime(0.25, now + h.start + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + h.start + h.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + h.start);
        osc.stop(now + h.start + h.dur);
      });
    } catch {}
  }

  // Souris: couinement aigu "Iiiik ! Iiiik !"
  public playMouseSqueak() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [0, 0.12].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2200, now + offset);
        osc.frequency.exponentialRampToValueAtTime(2800, now + offset + 0.04);
        osc.frequency.exponentialRampToValueAtTime(1900, now + offset + 0.09);

        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(0.18, now + offset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } catch {}
  }

  // Renard: glapissement / cri malicieux
  public playFoxCall() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  // Dispatch animal sound effect
  public playAnimalSound(animalId: string) {
    switch (animalId) {
      case 'chien':
        this.playDogBark();
        break;
      case 'chat':
        this.playCatMeow();
        break;
      case 'hibou':
        this.playOwlHoot();
        break;
      case 'souris':
        this.playMouseSqueak();
        break;
      case 'renard':
        this.playFoxCall();
        break;
      default:
        this.playOwlHoot();
    }
  }

  // Speaks dialogue out loud via browser Web Speech API in French with authentic sound prelude
  public speakAnimalVoice(text: string, animalId: string = 'hibou', playCry: boolean = true) {
    if (this.isMuted) return;

    // First trigger the characteristic animal cry sound effect
    if (playCry) {
      this.playAnimalSound(animalId);
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech

      // Prepend animal onomatopoeia to speech if not already present
      let vocalText = text;
      if (animalId === 'chien' && !text.startsWith('Wouf')) {
        vocalText = `Wouf wouf ! ${text}`;
      } else if (animalId === 'chat' && !text.startsWith('Miaou')) {
        vocalText = `Miaou ! ${text}`;
      } else if (animalId === 'hibou' && !text.startsWith('Hou')) {
        vocalText = `Hou hou ! ${text}`;
      } else if (animalId === 'souris' && !text.startsWith('Iiiik') && !text.startsWith('Hihi')) {
        vocalText = `Iiiik ! ${text}`;
      } else if (animalId === 'renard' && !text.startsWith('Yip')) {
        vocalText = `Yip yip ! ${text}`;
      }

      const utterance = new SpeechSynthesisUtterance(vocalText);
      utterance.lang = 'fr-FR';

      // Pitch and speed modulation per animal character
      if (animalId === 'souris') {
        utterance.pitch = 1.7; // Très aigu, petite souris rapide
        utterance.rate = 1.3;
      } else if (animalId === 'chat') {
        utterance.pitch = 1.45; // Félin espiègle et vif
        utterance.rate = 1.15;
      } else if (animalId === 'chien') {
        utterance.pitch = 0.85; // Grave, énergique et puissant comme un chien loyal
        utterance.rate = 1.15;
      } else if (animalId === 'renard') {
        utterance.pitch = 1.2; // Rusé, agile et vif
        utterance.rate = 1.1;
      } else {
        // Hibou (sage, posé, solennel)
        utterance.pitch = 0.8;
        utterance.rate = 0.95;
      }

      // Try finding French voice
      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }

      // Slight delay so the synthesized cry (bark, meow, hoot) rings out clearly first
      setTimeout(() => {
        try {
          window.speechSynthesis.speak(utterance);
        } catch {}
      }, 180);
    } catch {
      // Speech synthesis unsupported or blocked
    }
  }

  // Stop any ongoing speech
  public stopSpeaking() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  // Reads the question prompt followed by each answer option out loud
  public readQuestionAndOptions(
    prompt: string,
    options: string[],
    animalId: string = 'hibou',
    onComplete?: () => void
  ) {
    if (this.isMuted || typeof window === 'undefined' || !window.speechSynthesis) {
      onComplete?.();
      return;
    }

    try {
      this.stopSpeaking();

      const letters = ['A', 'B', 'C', 'D'];
      const formattedOptions = options
        .map((opt, idx) => `Choix ${letters[idx] || idx + 1} : ${opt}`)
        .join('. ');

      const fullText = `Question : ${prompt}. ${formattedOptions}.`;

      const utterance = new SpeechSynthesisUtterance(fullText);
      utterance.lang = 'fr-FR';

      if (animalId === 'souris') {
        utterance.pitch = 1.45;
        utterance.rate = 1.15;
      } else if (animalId === 'chat') {
        utterance.pitch = 1.25;
        utterance.rate = 1.1;
      } else if (animalId === 'chien') {
        utterance.pitch = 1.05;
        utterance.rate = 1.05;
      } else if (animalId === 'renard') {
        utterance.pitch = 1.1;
        utterance.rate = 1.05;
      } else {
        utterance.pitch = 0.95;
        utterance.rate = 1.0;
      }

      const voices = window.speechSynthesis.getVoices();
      const frVoice = voices.find((v) => v.lang.startsWith('fr'));
      if (frVoice) {
        utterance.voice = frVoice;
      }

      if (onComplete) {
        utterance.onend = () => onComplete();
        utterance.onerror = () => onComplete();
      }

      window.speechSynthesis.speak(utterance);
    } catch {
      onComplete?.();
    }
  }
}

export const gameAudioService = new GameAudioService();
