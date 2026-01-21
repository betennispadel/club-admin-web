import { apiKeyService } from './apiKeyService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeminiResponse {
  success: boolean;
  content: string;
  error?: string;
}

const GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro'
];

export async function callGeminiAPI(
  systemPrompt: string,
  message: string,
  history: ChatMessage[] = []
): Promise<GeminiResponse> {
  try {
    const apiKey = await apiKeyService.getGoogleGeminiKey();

    if (!apiKey) {
      return {
        success: false,
        content: '',
        error: 'Gemini API key not found'
      };
    }

    // Build conversation content
    const conversationHistory = history
      .map(m => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`)
      .join('\n');

    const fullPrompt = `${systemPrompt}\n\n---\nKonuşma geçmişi:\n${conversationHistory}\n---\n\nKullanıcı: ${message}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: fullPrompt }]
      }
    ];

    // Try different Gemini models
    for (const model of GEMINI_MODELS) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
              },
              safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
              ]
            })
          }
        );

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              success: true,
              content: text
            };
          }
        }
      } catch (err) {
        // Try next model
        continue;
      }
    }

    return {
      success: false,
      content: '',
      error: 'All Gemini models failed'
    };
  } catch (error: any) {
    return {
      success: false,
      content: '',
      error: error.message || 'Unknown error'
    };
  }
}

// Magazine-specific prompts
export const MAGAZINE_SYSTEM_PROMPT = `Sen bir tenis kulübü dergisi içerik asistanısın. Adın Mery.
Kullanıcıların dergi içerikleri oluşturmasına yardım ediyorsun.

Görevlerin:
- Makale girişleri ve içerikleri yazmak
- İçerik fikirleri önermek
- Metinleri düzenlemek ve geliştirmek
- Yaratıcı yazılar oluşturmak
- Başlıklar ve alt başlıklar önermek

Kuralların:
- Türkçe yanıt ver (aksi belirtilmedikçe)
- Tenis ve spor temalı içeriklere odaklan
- Samimi ve profesyonel bir dil kullan
- Kısa ve öz yanıtlar ver, gereksiz uzatma
- Markdown formatlaması kullanabilirsin (kalın, italik, liste vb.)

Şimdi kullanıcıya yardımcı ol.`;
