import { ENV } from "./_core/env";

/**
 * معالج الملفات الصوتية - يدمج نماذج Hugging Face الثلاثة
 */

interface AudioProcessingResult {
  transcription: string;
  response: string;
  confidence?: number;
  processingTime: number;
}

/**
 * تحويل الملف الصوتي إلى نص (STT)
 * باستخدام نموذج Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  if (!ENV.huggingfaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not configured");
  }

  try {
    const formData = new FormData();
    formData.append("files", new Blob([audioBuffer], { type: "audio/wav" }));

    const response = await fetch(
      "https://api-inference.huggingface.co/models/speechbrain/asr-whisper-large-v2-commonvoice-ar",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`Transcription failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.text || "";
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

/**
 * معالجة النص باستخدام نموذج اللغة (LLM)
 * باستخدام نموذج ALLaM
 */
export async function generateResponse(userText: string): Promise<string> {
  if (!ENV.huggingfaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/ALLaM-AI/ALLaM-7B-Instruct-preview",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: userText,
          parameters: {
            max_length: 256,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const result = await response.json();
    if (Array.isArray(result) && result[0]) {
      return result[0].generated_text || "";
    }
    return "";
  } catch (error) {
    console.error("LLM generation error:", error);
    throw error;
  }
}

/**
 * تحويل النص إلى كلام (TTS)
 * باستخدام نموذج NAMAA-Saudi-TTS
 */
export async function synthesizeSpeech(text: string): Promise<Buffer> {
  if (!ENV.huggingfaceApiKey) {
    throw new Error("HUGGINGFACE_API_KEY is not configured");
  }

  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/NAMAA-Space/NAMAA-Saudi-TTS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: text,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`TTS synthesis failed with status ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("TTS synthesis error:", error);
    throw error;
  }
}

/**
 * معالجة كاملة للملف الصوتي
 * 1. تحويل الصوت إلى نص (STT)
 * 2. معالجة النص بالنموذج اللغوي (LLM)
 * 3. تحويل الرد إلى صوت (TTS)
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

    // المرحلة 3: تحويل الرد إلى صوت (اختياري - قد يستغرق وقتاً)
    // const audioResponse = await synthesizeSpeech(response);

    const processingTime = Date.now() - startTime;

    return {
      transcription,
      response,
      processingTime,
    };
  } catch (error) {
    console.error("Complete audio processing error:", error);
    throw error;
  }
}
