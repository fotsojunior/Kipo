import {
  AttachmentMeta,
  ChatMessage,
  Quiz,
  FlashcardDeck,
  AnalyzedDocument,
  UserProfile,
  SupportedLanguage,
  DuolingoPath,
  GroupChatMessage,
} from '../types';

export interface ChatResponse {
  text: string;
  timestamp: string;
}

export interface GenerateMaterialParams {
  sourceText?: string;
  attachment?: { mimeType: string; data: string; name: string };
  type: 'duolingo_path' | 'quiz' | 'flashcards' | 'challenge';
  profile: UserProfile;
  language: SupportedLanguage;
  questionCount?: number;
  subject?: string;
  userRequest?: string;
}

export interface AnalyzeDocParams {
  text?: string;
  attachment?: { mimeType: string; data: string; name: string };
  profile: UserProfile;
  language: SupportedLanguage;
}

export const apiService = {
  async checkHealth(): Promise<{ status: string; hasApiKey: boolean }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API indisponible');
      return await res.json();
    } catch {
      return { status: 'offline', hasApiKey: false };
    }
  },

  async sendChatMessage(params: {
    message: string;
    history?: ChatMessage[];
    profile: UserProfile;
    language: SupportedLanguage;
    attachments?: AttachmentMeta[];
  }): Promise<ChatResponse> {
    const payload = {
      message: params.message,
      history: params.history?.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      profile: params.profile,
      language: params.language,
      attachments: params.attachments?.map((a) => ({
        mimeType: a.mimeType,
        data: a.data,
        name: a.name,
      })),
    };

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Erreur serveur (${res.status}): Impossible de contacter le tuteur IA.`
      );
    }

    return await res.json();
  },

  async generateLearningMaterial(params: GenerateMaterialParams): Promise<any> {
    const res = await fetch('/api/generate-learning-material', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de la génération du contenu éducatif.');
    }

    return await res.json();
  },

  async analyzeDocument(params: AnalyzeDocParams): Promise<Omit<AnalyzedDocument, 'id' | 'fileName' | 'fileType' | 'createdAt'>> {
    const res = await fetch('/api/analyze-document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Erreur lors de l'analyse du document.");
    }

    return await res.json();
  },

  async groupAiAssist(params: {
    groupName: string;
    subject: string;
    messages: GroupChatMessage[];
    action: 'summarize' | 'moderate' | 'challenge';
    language: SupportedLanguage;
  }): Promise<{ text: string; action: string; timestamp: string }> {
    const res = await fetch('/api/group-ai-assist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Erreur lors de l’assistance IA du groupe.');
    }

    return await res.json();
  },

  async translateQuestion(question: any, targetLanguage: string): Promise<any> {
    try {
      const res = await fetch('/api/translate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, targetLanguage }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.translatedQuestion) {
          return data.translatedQuestion;
        }
      }
    } catch {}
    return question;
  },
};
