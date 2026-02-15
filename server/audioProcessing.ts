import { ENV } from "./_core/env";

/**
 * معالج الملفات الصوتية - يدمج نماذج Hugging Face
 *
 * الـ API الجديد لـ Hugging Face:
 * - STT (Whisper): https://router.huggingface.co/hf-inference/models/{model}
 * - LLM (Chat):    https://router.huggingface.co/v1/chat/completions
 */

// ============================================================================
// TYPES
// ============================================================================

interface AudioProcessingResult {
  transcription: string;
  response: string;
  responseAudioBase64?: string;
  confidence?: number;
  processingTime: number;
}

// ============================================================================
// RETRY HELPER
// ============================================================================

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<Response> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.ok) return response;

    // إذا كان النموذج قيد التحميل (503)، ننتظر ونعيد المحاولة
    if (response.status === 503 && attempt < maxRetries) {
      const body = await response.json().catch(() => ({}));
      const estimatedTime = (body as any).estimated_time || 15;
      console.log(
        `⏳ النموذج قيد التحميل (محاولة ${attempt}/${maxRetries}). الانتظار ${Math.ceil(estimatedTime)} ثانية...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(estimatedTime * 1000, 30000))
      );
      continue;
    }

    // أي خطأ آخر
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `فشل الطلب (HTTP ${response.status}): ${errorBody.substring(0, 300)}`
    );
  }

  throw new Error("تم تجاوز الحد الأقصى لعدد المحاولات");
}

// ============================================================================
// STT - تحويل الكلام إلى نص
// ============================================================================

/**
 * تحويل الملف الصوتي إلى نص باستخدام Whisper
 * Endpoint: router.huggingface.co/hf-inference/models/openai/whisper-large-v3
 * يقبل raw audio bytes مباشرة مع Content-Type مناسب
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  if (!ENV.huggingfaceApiKey) {
    throw new Error("مفتاح HUGGINGFACE_API_KEY غير مُعد");
  }

  try {
    console.log(`📦 حجم الملف الصوتي: ${(audioBuffer.length / 1024).toFixed(1)} KB`);

    const response = await fetchWithRetry(
      "https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
          "Content-Type": "audio/webm",
        },
        body: new Uint8Array(audioBuffer),
      }
    );

    const result = await response.json();
    console.log("🔍 Whisper response:", JSON.stringify(result));

    return (result as any).text || "";
  } catch (error) {
    console.error("❌ خطأ في تحويل الكلام إلى نص:", error);
    throw error;
  }
}

// ============================================================================
// LLM - معالجة اللغة الطبيعية
// ============================================================================

/**
 * معالجة النص باستخدام نموذج لغة كبير
 * Endpoint: router.huggingface.co/v1/chat/completions (OpenAI-compatible)
 * النموذج: meta-llama/Llama-3.1-8B-Instruct
 */
export async function generateResponse(userText: string): Promise<string> {
  if (!ENV.huggingfaceApiKey) {
    throw new Error("مفتاح HUGGINGFACE_API_KEY غير مُعد");
  }

  if (!userText || userText.trim() === "") {
    return "لم يتم التعرف على أي نص من الملف الصوتي.";
  }

  try {
    const response = await fetchWithRetry(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.1-8B-Instruct",
          messages: [
            {
              role: "system",
              content:
                "أنت مساعد ذكي سعودي. تفهم اللهجة السعودية وترد باللغة العربية بشكل مختصر ومفيد. إذا سألك أحد بالسعودي، رد عليه باللهجة السعودية.",
            },
            {
              role: "user",
              content: userText,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      }
    );

    const result = await response.json();
    console.log("🔍 LLM response:", JSON.stringify(result).substring(0, 400));

    // OpenAI-compatible format
    const data = result as any;
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content || "";
    }

    return "تعذرت معالجة الرد من النموذج اللغوي.";
  } catch (error) {
    console.error("❌ خطأ في معالجة اللغة:", error);
    throw error;
  }
}

// ============================================================================
// TTS - تحويل النص إلى كلام باستخدام NAMAA-Saudi-TTS
// ============================================================================

const NAMAA_SPACE_URL = "https://omarelshehy-namaa-saudi-voice.hf.space/gradio_api";

/**
 * تحويل النص إلى كلام باستخدام NAMAA-Saudi-TTS عبر Gradio Space
 * 
 * يستخدم Gradio async API ذي خطوتين:
 * 1. إرسال الطلب -> الحصول على event_id
 * 2. استقبال النتيجة عبر SSE -> URL الملف الصوتي
 * 3. تحميل الملف الصوتي وتحويله إلى Buffer
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  try {
    console.log(`🔊 TTS: تحويل النص إلى كلام: "${text.substring(0, 50)}..."`);

    // الخطوة 1: إرسال الطلب والحصول على event_id
    const callResponse = await fetch(`${NAMAA_SPACE_URL}/call/generate_tts_audio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          text,   // النص
          null,   // صوت مرجعي (اختياري - نستخدم الافتراضي)
          0.5,    // Exaggeration
          0.8,    // Temperature
          0,      // Seed
          0.5,    // CFG / Pace
        ],
      }),
    });

    if (!callResponse.ok) {
      const errText = await callResponse.text().catch(() => "");
      throw new Error(`فشل إرسال طلب TTS (HTTP ${callResponse.status}): ${errText.substring(0, 200)}`);
    }

    const { event_id } = (await callResponse.json()) as { event_id: string };
    console.log(`📋 TTS event_id: ${event_id}`);

    // الخطوة 2: انتظار النتيجة عبر SSE (Server-Sent Events)
    const resultResponse = await fetch(
      `${NAMAA_SPACE_URL}/call/generate_tts_audio/${event_id}`,
      { method: "GET", signal: AbortSignal.timeout(120_000) }
    );

    if (!resultResponse.ok) {
      throw new Error(`فشل استقبال نتيجة TTS (HTTP ${resultResponse.status})`);
    }

    const sseText = await resultResponse.text();

    // تحليل استجابة SSE للحصول على URL الملف
    const dataLine = sseText.split("\n").find(line => line.startsWith("data: "));
    if (!dataLine) {
      throw new Error("لم يتم العثور على بيانات في استجابة TTS");
    }

    const data = JSON.parse(dataLine.replace("data: ", ""));
    const audioUrl = data[0]?.url;

    if (!audioUrl) {
      throw new Error("لم يتم العثور على رابط الملف الصوتي في استجابة TTS");
    }

    console.log(`🔗 TTS audio URL: ${audioUrl}`);

    // الخطوة 3: تحميل الملف الصوتي
    const audioResponse = await fetch(audioUrl, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!audioResponse.ok) {
      throw new Error(`فشل تحميل الملف الصوتي (HTTP ${audioResponse.status})`);
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    console.log(`✓ TTS: تم تحميل الملف الصوتي (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

    return audioBuffer;
  } catch (error) {
    console.error("❌ خطأ في تحويل النص إلى كلام:", error);
    throw error;
  }
}

// ============================================================================
// PIPELINE - المعالجة الكاملة
// ============================================================================

/**
 * معالجة كاملة للملف الصوتي:
 * 1. تحويل الصوت إلى نص (Whisper)
 * 2. معالجة النص بالنموذج اللغوي (Llama)
 * 3. تحويل الرد إلى كلام (NAMAA-Saudi-TTS)
 */
export async function processAudioComplete(
  audioBuffer: Buffer
): Promise<AudioProcessingResult> {
  const startTime = Date.now();

  try {
    // المرحلة 1: تحويل الصوت إلى نص
    console.log("🎤 المرحلة 1: تحويل الصوت إلى نص...");
    const transcription = await transcribeAudio(audioBuffer);
    console.log(`✓ النص المحول: "${transcription}"`);

    // المرحلة 2: معالجة النص بالنموذج اللغوي
    console.log("🧠 المرحلة 2: معالجة النص...");
    const response = await generateResponse(transcription);
    console.log(`✓ الاستجابة: "${response}"`);

    // المرحلة 3: تحويل الرد إلى كلام
    let responseAudioBase64: string | undefined;
    try {
      console.log("🔊 المرحلة 3: تحويل الرد إلى كلام...");
      const ttsBuffer = await synthesizeSpeech(response);
      responseAudioBase64 = ttsBuffer.toString("base64");
      console.log(`✓ تم إنشاء الصوت بنجاح`);
    } catch (ttsError) {
      // TTS ليس حرجاً - إذا فشل نستمر بدونه
      console.warn("⚠️ فشل تحويل النص إلى كلام (TTS)، سنستمر بدون صوت:", (ttsError as Error).message);
    }

    const processingTime = Date.now() - startTime;
    console.log(`⏱️ إجمالي وقت المعالجة: ${(processingTime / 1000).toFixed(1)} ثانية`);

    return {
      transcription,
      response,
      responseAudioBase64,
      processingTime,
    };
  } catch (error) {
    console.error("❌ خطأ في المعالجة الكاملة:", error);
    throw error;
  }
}
