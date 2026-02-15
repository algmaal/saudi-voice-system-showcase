import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { processAudioComplete } from "./audioProcessing";

export const voiceRouter = router({
  /**
   * معالجة ملف صوتي كامل
   * يقبل ملف صوتي ويعيد النص المحول والاستجابة
   */
  processAudio: publicProcedure
    .input(
      z.object({
        audioBase64: z.string().describe("الملف الصوتي مشفر بـ Base64"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // تحويل Base64 إلى Buffer
        const audioBuffer = Buffer.from(input.audioBase64, "base64");

        // معالجة الملف الصوتي
        const result = await processAudioComplete(audioBuffer);

        return {
          success: true,
          transcription: result.transcription,
          response: result.response,
          responseAudioBase64: result.responseAudioBase64 || "",
          processingTime: result.processingTime,
        };
      } catch (error) {
        console.error("Voice processing error:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "حدث خطأ أثناء معالجة الملف الصوتي",
          transcription: "",
          response: "",
          responseAudioBase64: "",
          processingTime: 0,
        };
      }
    }),

  /**
   * اختبار الاتصال بـ Hugging Face
   */
  testConnection: publicProcedure.query(async () => {
    try {
      const response = await fetch(
        "https://huggingface.co/api/models/NAMAA-Space/NAMAA-Saudi-TTS",
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY || ""}`,
          },
        }
      );

      return {
        connected: response.ok || response.status === 404,
        status: response.status,
        message: response.ok ? "✓ متصل بـ Hugging Face" : "✗ خطأ في الاتصال",
      };
    } catch (error) {
      return {
        connected: false,
        status: 0,
        message: `خطأ: ${error instanceof Error ? error.message : "خطأ غير معروف"}`,
      };
    }
  }),
});
