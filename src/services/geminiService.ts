/**
 * Client-side service helper for interacting with Gemini API backend endpoints
 */

export interface GeminiStatusResponse {
  success: boolean;
  configured: boolean;
  message: string;
}

export interface GeminiGenerateResponse {
  success: boolean;
  text?: string;
  message?: string;
}

export async function checkGeminiApiStatus(): Promise<GeminiStatusResponse> {
  try {
    const res = await fetch('/api/gemini/status');
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      configured: false,
      message: 'عدم امکان برقراری ارتباط با سرور'
    };
  }
}

export async function generateWithGemini(prompt: string, systemInstruction?: string): Promise<GeminiGenerateResponse> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, systemInstruction })
    });
    const data = await res.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: 'خطا در شبکه یا عدم پاسخگویی سرور'
    };
  }
}
