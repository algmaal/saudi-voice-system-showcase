import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import {
    startConversation,
    processCustomerResponse,
    getConversationState,
    getAllCollectedData,
    getStepLabel,
} from "./callCenter";
import { synthesizeSpeech } from "./audioProcessing";

export const callCenterRouter = router({
    /**
     * بدء محادثة جديدة مع العميل
     */
    startSession: publicProcedure.mutation(async () => {
        try {
            const state = startConversation();
            const welcomeMessage =
                state.conversationHistory[state.conversationHistory.length - 1]?.text || "";

            // تحويل رسالة الترحيب إلى صوت
            let audioBase64 = "";
            try {
                console.log("🔊 تحويل رسالة الترحيب إلى صوت...");
                const ttsBuffer = await synthesizeSpeech(welcomeMessage);
                audioBase64 = ttsBuffer.toString("base64");
                console.log("✓ تم تحويل رسالة الترحيب إلى صوت");
            } catch (ttsError) {
                console.warn("⚠️ فشل TTS للترحيب:", (ttsError as Error).message);
            }

            return {
                success: true,
                sessionId: state.sessionId,
                agentMessage: welcomeMessage,
                agentAudioBase64: audioBase64,
                currentStep: state.currentStep,
                stepLabel: getStepLabel(state.currentStep),
                isComplete: false,
                wasRetry: false,
            };
        } catch (error) {
            console.error("❌ فشل بدء المحادثة:", error);
            return {
                success: false,
                sessionId: "",
                agentMessage: "",
                agentAudioBase64: "",
                currentStep: "welcome" as const,
                stepLabel: "خطأ",
                isComplete: false,
                wasRetry: false,
                error: error instanceof Error ? error.message : "فشل بدء المحادثة",
            };
        }
    }),

    /**
     * معالجة رد العميل الصوتي
     */
    processResponse: publicProcedure
        .input(
            z.object({
                sessionId: z.string(),
                audioBase64: z.string(),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const audioBuffer = Buffer.from(input.audioBase64, "base64");

                const { state, agentMessage, isComplete, wasRetry, extractedValue } =
                    await processCustomerResponse(input.sessionId, audioBuffer);

                // تحويل رد الوكيل إلى صوت
                let audioBase64 = "";
                try {
                    console.log("🔊 تحويل رد الوكيل إلى صوت...");
                    const ttsBuffer = await synthesizeSpeech(agentMessage);
                    audioBase64 = ttsBuffer.toString("base64");
                    console.log("✓ تم تحويل رد الوكيل إلى صوت");
                } catch (ttsError) {
                    console.warn("⚠️ فشل TTS:", (ttsError as Error).message);
                }

                return {
                    success: true,
                    agentMessage,
                    agentAudioBase64: audioBase64,
                    customerText: state.conversationHistory.filter((h) => h.role === "customer").pop()?.text || "",
                    currentStep: state.currentStep,
                    stepLabel: getStepLabel(state.currentStep),
                    customerData: state.customerData,
                    isComplete,
                    wasRetry,
                    extractedValue,
                    conversationHistory: state.conversationHistory,
                };
            } catch (error) {
                console.error("❌ فشل معالجة الرد:", error);
                return {
                    success: false,
                    agentMessage: "عذراً صار خطأ، ممكن تعيد مرة ثانية؟",
                    agentAudioBase64: "",
                    customerText: "",
                    currentStep: "welcome" as const,
                    stepLabel: "خطأ",
                    customerData: { name: "", age: "", dateOfBirth: "", job: "", city: "" },
                    isComplete: false,
                    wasRetry: false,
                    extractedValue: "",
                    conversationHistory: [],
                    error: error instanceof Error ? error.message : "فشل معالجة الرد الصوتي",
                };
            }
        }),

    /**
     * الحصول على حالة المحادثة
     */
    getSession: publicProcedure
        .input(z.object({ sessionId: z.string() }))
        .query(({ input }) => {
            const state = getConversationState(input.sessionId);
            if (!state) return { found: false, state: null };
            return { found: true, state: { ...state, stepLabel: getStepLabel(state.currentStep) } };
        }),

    /**
     * الحصول على جميع البيانات المجمعة
     */
    getAllData: publicProcedure.query(() => getAllCollectedData()),
});
