import { GoogleGenAI } from "@google/genai";

export const DEFAULT_CUSTOM_ENDPOINT = "http://192.168.100.54:5000/v1beta/models/gemini-3.5-flash-lite:generateContent";

/**
 * Gemini AI Helper Module
 * Supports custom server endpoint with fallback to standard GoogleGenAI SDK
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Utility to check if Gemini API (Custom Endpoint or SDK Secret) is configured
 */
export function isGeminiConfigured(customEndpointOverride?: string): boolean {
  const customUrl = customEndpointOverride || process.env.CUSTOM_GEMINI_ENDPOINT || DEFAULT_CUSTOM_ENDPOINT;
  const apiKey = process.env.GEMINI_API_KEY;
  return Boolean(customUrl || (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0));
}

/**
 * Text content generator using custom server endpoint as primary, with fallback to GoogleGenAI SDK
 */
export async function generateGeminiText(
  prompt: string,
  systemInstruction?: string,
  endpointOverride?: string,
  timeoutMs: number = 15000
): Promise<string> {
  const endpointUrl = (endpointOverride || process.env.CUSTOM_GEMINI_ENDPOINT || DEFAULT_CUSTOM_ENDPOINT).trim();

  // Try Primary: Custom Server Endpoint
  if (endpointUrl) {
    try {
      console.log(`📡 [Gemini API] تلاش برای برقراری ارتباط با اندپوینت ابری: ${endpointUrl}`);
      
      const payload: any = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [
            { text: systemInstruction }
          ]
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.max(3000, timeoutMs));

      const response = await fetch(endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        // Extract output text across various response structures
        let extractedText: string | undefined;
        if (typeof data.text === "string" && data.text) {
          extractedText = data.text;
        } else if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          extractedText = data.candidates[0].content.parts[0].text;
        } else if (Array.isArray(data.candidates?.[0]?.content?.parts)) {
          extractedText = data.candidates[0].content.parts.map((p: any) => p.text || "").join("");
        }

        if (extractedText && extractedText.trim().length > 0) {
          console.log(`✅ [Gemini API] پاسخ موفقیت‌آمیز از اندپوینت ابری دریافت شد.`);
          return extractedText;
        }
      } else {
        console.warn(`⚠️ [Gemini API] اندپوینت ابری با وضعیت ${response.status} پاسخ داد. استفاده از مکانیزم Fallback...`);
      }
    } catch (err: any) {
      console.warn(`⚠️ [Gemini API] خطا یا عدم دسترسی به اندپوینت ابری (${err?.message || err}). استفاده از Fallback محلی...`);
    }
  }

  // Fallback: Standard GoogleGenAI SDK
  console.log(`🔄 [Gemini API] فراخوانی هوش مصنوعی از طریق SDK محلی GoogleGenAI (Fallback)`);
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error("ارتباط با اندپوینت ابری برقرار نشد و کلید GEMINI_API_KEY نیز در تنظیمات سیستم ثبت نشده است.");
  }

  const sdkResponse = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    ...(systemInstruction ? { config: { systemInstruction } } : {}),
  });

  if (!sdkResponse.text) {
    throw new Error("پاسخ متنی از مدل دریافت نشد.");
  }

  return sdkResponse.text;
}
