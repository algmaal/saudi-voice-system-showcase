import { ENV } from "./_core/env";
import { transcribeAudio } from "./audioProcessing";

/**
 * نظام كول سنتر صوتي باللهجة السعودية
 *
 *  ====================================================================
 *  📋 مركز إدارة الأسئلة (المكان الموحد لإضافة/حذف/تعديل الأسئلة)
 *  ====================================================================
 *
 *  ❶ لإضافة سؤال جديد:   أضف عنصر في QUESTIONS بالترتيب المطلوب
 *  ❷ لحذف سؤال:          احذف العنصر من QUESTIONS
 *  ❸ لتعديل سؤال:        عدّل النص والبرومبتات مباشرة في QUESTIONS
 *  ❹ لتغيير الترتيب:     غيّر ترتيب العناصر في المصفوفة
 *
 *  الباقي كله تلقائي — الخطوات والتأكيدات تُبنى أوتوماتيكياً.
 */

// ============================================================================
// 📋 مركز إدارة الأسئلة — عدّل هنا فقط!
// ============================================================================

interface QuestionDef {
    /** مفتاح الحقل في بيانات العميل (مثلاً "name", "age") */
    field: string;
    /** تسمية الحقل بالعربي (للعرض والتأكيد) */
    label: string;
    /** سؤال الوكيل للعميل — استخدم {name} لإدراج اسم العميل */
    question: string;
    /** برومبت استخراج الإجابة من كلام العميل */
    extractPrompt: string;
    /** برومبت التحقق: هل الرد يحتوي فعلاً على الإجابة المطلوبة؟ */
    validationPrompt: string;
    /** رسائل إعادة السؤال عند إجابة غير واضحة */
    retryMessages: string[];
}

const QUESTIONS: QuestionDef[] = [
    // ────────────── ① الاسم ──────────────
    {
        field: "name",
        label: "الاسم",
        question: "", // فارغ لأن الترحيب يسأل عن الاسم
        extractPrompt:
            'استخرج اسم الشخص الكامل من هذا النص. إذا ذكر اسمه أرجع الاسم فقط بدون أي كلام إضافي. إذا لم يذكر اسمه أرجع "غير_محدد".',
        validationPrompt:
            'هل هذا النص يحتوي على اسم شخص؟ أجب بـ "نعم" أو "لا" فقط. النص: ',
        retryMessages: [
            "عذراً ما سمعت اسمك زين، ممكن تعيد لي اسمك الكامل مرة ثانية؟",
            "ما عليك أمر، بس أبي اسمك الكامل يعني الاسم الأول واسم العائلة؟",
        ],
    },

    // ────────────── ② العمر ──────────────
    {
        field: "age",
        label: "العمر",
        question: "أهلاً يا {name}! كم عمرك لو سمحت؟",
        extractPrompt:
            `استخرج العمر كرقم من هذا النص.
قواعد مهمة:
- إذا قال "ستة وأربعين" أو "46" أرجع "46"
- إذا قال "خمسة وعشرين" أرجع "25"
- إذا قال "ثلاثين" أرجع "30"
- إذا قال "أربعة وستين" أرجع "64"
- تأكد من ترتيب الأرقام: "ستة وأربعين" = 46 وليس 64
- "ستة وأربعين" تعني 6 + 40 = 46
- "أربعة وستين" تعني 4 + 60 = 64
- أرجع الرقم فقط. إذا لم يذكر عمره أرجع "غير_محدد".`,
        validationPrompt:
            'هل هذا النص يحتوي على عمر أو رقم يمثل سنوات العمر؟ أجب بـ "نعم" أو "لا" فقط. النص: ',
        retryMessages: [
            "ما قدرت أفهم عمرك، ممكن تقولي كم عمرك بالأرقام؟",
            "يعني كم سنة عمرك الحين؟ قولها بالأرقام لو سمحت",
        ],
    },

    // ────────────── ③ تاريخ الميلاد ──────────────
    {
        field: "dateOfBirth",
        label: "تاريخ الميلاد",
        question: "جميل! متى تاريخ ميلادك؟ يعني اليوم والشهر والسنة؟",
        extractPrompt:
            'استخرج تاريخ الميلاد من هذا النص بأي صيغة. إذا ذكر فقط السنة اكتبها. إذا لم يذكر تاريخ أرجع "غير_محدد".',
        validationPrompt:
            'هل هذا النص يحتوي على تاريخ أو سنة ميلاد؟ أجب بـ "نعم" أو "لا" فقط. النص: ',
        retryMessages: [
            "ما سمعت تاريخ ميلادك زين، ممكن تعيد؟ قول اليوم والشهر والسنة",
            "بس أبي تاريخ ميلادك يعني متى ولدت؟ لو تقدر تقول السنة على الأقل",
        ],
    },

    // ────────────── ④ الوظيفة ──────────────
    {
        field: "job",
        label: "الوظيفة",
        question: "حلو! وش شغلك الحين؟ يعني وش وظيفتك الحالية؟",
        extractPrompt:
            'استخرج الوظيفة أو المهنة من هذا النص. أرجع اسم الوظيفة فقط. إذا لم يذكر وظيفته أرجع "غير_محدد".',
        validationPrompt:
            'هل هذا النص يحتوي على وظيفة أو مهنة أو نوع عمل؟ أجب بـ "نعم" أو "لا" فقط. النص: ',
        retryMessages: [
            "ما فهمت وظيفتك، ممكن تقولي وش شغلك أو تخصصك؟",
            "يعني وش المجال اللي تشتغل فيه؟ مهندس، دكتور، معلم مثلاً؟",
        ],
    },

    // ────────────── ⑤ المدينة ──────────────
    {
        field: "city",
        label: "المدينة",
        question: "ما شاء الله! وفي أي مدينة ساكن الحين؟",
        extractPrompt:
            'استخرج اسم المدينة أو المنطقة من هذا النص. أرجع اسم المدينة فقط بالعربي. إذا لم يذكر مدينته أرجع "غير_محدد".',
        validationPrompt:
            'هل هذا النص يحتوي على اسم مدينة أو منطقة أو مكان سكن؟ أجب بـ "نعم" أو "لا" فقط. النص: ',
        retryMessages: [
            "ما سمعت المدينة زين، في أي مدينة ساكن؟ يعني الرياض، جدة، الدمام مثلاً؟",
            "بس أبي أعرف مدينتك، وين ساكن الحين؟",
        ],
    },

    // ────────────────────────────────────────────────────────
    //  🔧 لإضافة سؤال جديد، أضف كائن هنا بنفس الصيغة:
    //
    //  {
    //      field: "اسم_الحقل",
    //      label: "التسمية بالعربي",
    //      question: "السؤال باللهجة السعودية",
    //      extractPrompt: "برومبت الاستخراج",
    //      validationPrompt: "برومبت التحقق",
    //      retryMessages: ["رسالة إعادة ١", "رسالة إعادة ٢"],
    //  },
    // ────────────────────────────────────────────────────────
];

// ============================================================================
// رسالة الترحيب — تسأل عن أول سؤال
// ============================================================================

const WELCOME_MESSAGE =
    "أهلاً وسهلاً فيك! أنا المساعد الصوتي حقك. يسعدني أخدمك اليوم. خلنا نبدأ ببعض الأسئلة البسيطة عشان نسجل بياناتك. ممكن تقولي اسمك الكامل لو سمحت؟";

const MAX_RETRIES = 2;

// ============================================================================
// أنواع البيانات — تُبنى تلقائياً من QUESTIONS
// ============================================================================

export interface CustomerData {
    [key: string]: string;
}

/** خطوات المحادثة: تُولد تلقائياً */
export type ConversationStep = string;

export interface ConversationState {
    sessionId: string;
    currentStep: ConversationStep;
    customerData: CustomerData;
    conversationHistory: { role: "agent" | "customer"; text: string }[];
    retryCount: number;
    pendingValue: string;
    createdAt: number;
    updatedAt: number;
}

// بناء خريطة الخطوات تلقائياً
function getQuestionIndex(step: string): number {
    if (step.startsWith("ask_")) {
        const field = step.slice(4);
        return QUESTIONS.findIndex(q => q.field === field);
    }
    if (step.startsWith("confirm_")) {
        const field = step.slice(8);
        return QUESTIONS.findIndex(q => q.field === field);
    }
    return -1;
}

function getAskStep(index: number): string {
    return `ask_${QUESTIONS[index].field}`;
}

function getConfirmStep(index: number): string {
    return `confirm_${QUESTIONS[index].field}`;
}

function getNextAskStep(index: number): string | "final_summary" {
    if (index + 1 < QUESTIONS.length) return getAskStep(index + 1);
    return "final_summary";
}

/** الحصول على كل أسماء الخطوات (للعرض في الواجهة) */
export function getAllStepNames(): { step: string; label: string }[] {
    const steps = QUESTIONS.map(q => ({
        step: `ask_${q.field}`,
        label: q.label,
    }));
    steps.push({ step: "final_summary", label: "الملخص النهائي" });
    return steps;
}

/** الحصول على قائمة الحقول المسجلة */
export function getFieldsList(): { field: string; label: string }[] {
    return QUESTIONS.map(q => ({ field: q.field, label: q.label }));
}

// ============================================================================
// SESSION STORE
// ============================================================================

const sessions = new Map<string, ConversationState>();
const collectedData: { sessionId: string; data: CustomerData; timestamp: number }[] = [];

function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function buildEmptyCustomerData(): CustomerData {
    const data: CustomerData = {};
    QUESTIONS.forEach(q => { data[q.field] = ""; });
    return data;
}

// ============================================================================
// LLM HELPERS
// ============================================================================

async function callLLM(systemPrompt: string, userMessage: string, maxTokens = 50): Promise<string> {
    if (!ENV.huggingfaceApiKey) throw new Error("HUGGINGFACE_API_KEY غير مُعد");

    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${ENV.huggingfaceApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "meta-llama/Llama-3.1-8B-Instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
            ],
            max_tokens: maxTokens,
            temperature: 0.1,
        }),
    });

    if (!response.ok) {
        const err = await response.text().catch(() => "");
        throw new Error(`LLM error (HTTP ${response.status}): ${err.substring(0, 200)}`);
    }

    const result = (await response.json()) as any;
    return result.choices?.[0]?.message?.content?.trim()?.replace(/"/g, "") || "";
}

async function extractDataFromText(userText: string, extractPrompt: string): Promise<string> {
    try {
        const value = await callLLM(
            `أنت مساعد يستخرج بيانات محددة من نص العميل. أرجع القيمة فقط بدون شرح.\n\nالمهمة: ${extractPrompt}`,
            userText
        );
        return value || "غير_محدد";
    } catch (error) {
        console.error("❌ خطأ في استخراج البيانات:", error);
        return "غير_محدد";
    }
}

async function validateResponse(userText: string, validationPrompt: string): Promise<boolean> {
    try {
        const answer = await callLLM(
            'أنت مدقق إجابات. مهمتك هي التحقق هل الإجابة مناسبة للسؤال. أجب بكلمة واحدة فقط: "نعم" أو "لا".',
            validationPrompt + `"${userText}"`
        );
        const normalized = answer.toLowerCase().trim();
        return normalized.includes("نعم") || normalized.includes("yes") || normalized.includes("صح");
    } catch (error) {
        console.warn("⚠️ فشل التحقق، نقبل الإجابة:", error);
        return true;
    }
}

async function analyzeConfirmation(userText: string, fieldLabel: string, pendingValue: string): Promise<{
    confirmed: boolean;
    correctedValue: string | null;
}> {
    try {
        const analysis = await callLLM(
            `أنت محلل ردود. العميل كان يُسأل للتأكيد على ${fieldLabel} وهي "${pendingValue}".
رد العميل هو النص التالي. حدد:
1. هل أكد العميل أن البيان صحيح (قال نعم، صح، أيوا، إي، تمام، صحيح)؟
2. أو نفى وقال أن البيان خطأ (قال لا، غلط، خطأ، مو كذا)؟
3. هل ذكر العميل قيمة مصححة في رده؟

أجب بالصيغة التالية فقط بدون أي كلام إضافي:
- إذا أكد: "مؤكد"
- إذا نفى بدون تصحيح: "مرفوض"
- إذا نفى مع تصحيح: "تصحيح: [القيمة الجديدة]"`,
            userText,
            30
        );

        const result = analysis.toLowerCase().trim();
        console.log(`🔍 تحليل التأكيد: "${result}" (رد العميل: "${userText}")`);

        if (result.includes("مؤكد") || result.includes("نعم") || result.includes("صح")) {
            return { confirmed: true, correctedValue: null };
        }

        if (result.includes("تصحيح:")) {
            const corrected = result.split("تصحيح:")[1]?.trim();
            if (corrected && corrected.length > 0) {
                return { confirmed: false, correctedValue: corrected };
            }
        }

        return { confirmed: false, correctedValue: null };
    } catch (error) {
        console.warn("⚠️ فشل تحليل التأكيد، نعتبره مؤكد:", error);
        return { confirmed: true, correctedValue: null };
    }
}

async function handleInterruption(userText: string, currentStep: string): Promise<string | null> {
    if (currentStep.startsWith("confirm_")) return null;

    const qi = getQuestionIndex(currentStep);
    if (qi < 0) return null;

    try {
        const q = QUESTIONS[qi];
        const analysis = await callLLM(
            `أنت محلل محادثات. حدد هل هذا الرد هو:
1. "إجابة" - إجابة مباشرة على سؤال عن ${q.label}
2. "سؤال" - العميل يسأل سؤال
3. "مقاطعة" - العميل يتحدث عن شيء آخر

أجب بكلمة واحدة فقط: "إجابة" أو "سؤال" أو "مقاطعة"`,
            userText,
            20
        );

        const type = analysis.toLowerCase().trim();
        if (type.includes("سؤال") || type.includes("مقاطعة")) {
            const response = await callLLM(
                `أنت موظف كول سنتر سعودي. العميل قاطعك أو سأل سؤال. أجب عليه بإيجاز باللهجة السعودية ثم أعد السؤال عن ${q.label} بطريقة لطيفة. اجعل ردك قصير وطبيعي.`,
                userText,
                100
            );
            return response;
        }

        return null;
    } catch {
        return null;
    }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function startConversation(): ConversationState {
    const sessionId = generateSessionId();
    const state: ConversationState = {
        sessionId,
        currentStep: getAskStep(0), // أول سؤال
        customerData: buildEmptyCustomerData(),
        conversationHistory: [],
        retryCount: 0,
        pendingValue: "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    state.conversationHistory.push({ role: "agent", text: WELCOME_MESSAGE });
    sessions.set(sessionId, state);
    console.log(`📞 بدء محادثة جديدة: ${sessionId}`);
    return state;
}

export async function processCustomerResponse(
    sessionId: string,
    audioBuffer: Buffer
): Promise<{
    state: ConversationState;
    agentMessage: string;
    isComplete: boolean;
    wasRetry: boolean;
    extractedValue: string;
}> {
    const state = sessions.get(sessionId);
    if (!state) throw new Error("جلسة غير موجودة");

    const currentStep = state.currentStep;

    // تحويل الصوت إلى نص
    console.log(`🎤 [${sessionId}] تحويل صوت العميل (${currentStep})...`);
    const transcription = await transcribeAudio(audioBuffer);
    console.log(`✓ [${sessionId}] النص: "${transcription}"`);

    state.conversationHistory.push({ role: "customer", text: transcription });

    // تجاهل الصوت الفارغ
    const cleanText = transcription.trim().replace(/[\s.]+/g, "").toLowerCase();
    if (!cleanText || cleanText.length < 2) {
        const retryMsg = "ما سمعت ردك زين، ممكن تعيد مرة ثانية لو سمحت؟";
        state.conversationHistory.push({ role: "agent", text: retryMsg });
        state.updatedAt = Date.now();
        sessions.set(sessionId, state);
        return { state, agentMessage: retryMsg, isComplete: false, wasRetry: true, extractedValue: "" };
    }

    // هل نحن في خطوة تأكيد؟
    if (currentStep.startsWith("confirm_")) {
        return handleConfirmationStep(state, transcription, currentStep);
    }

    // خطوة سؤال عادية (ask_xxx)
    return handleAskStep(state, transcription, currentStep);
}

// ============================================================================
// INTERNAL STEP HANDLERS
// ============================================================================

async function handleConfirmationStep(
    state: ConversationState,
    transcription: string,
    confirmStep: string
): Promise<{
    state: ConversationState;
    agentMessage: string;
    isComplete: boolean;
    wasRetry: boolean;
    extractedValue: string;
}> {
    const qi = getQuestionIndex(confirmStep);
    if (qi < 0) throw new Error(`خطوة تأكيد غير معروفة: ${confirmStep}`);

    const q = QUESTIONS[qi];
    const pendingValue = state.pendingValue;

    console.log(`✅ [${state.sessionId}] تحليل تأكيد ${q.field}: "${transcription}" (القيمة: "${pendingValue}")`);

    const { confirmed, correctedValue } = await analyzeConfirmation(transcription, q.label, pendingValue);

    if (confirmed) {
        // ✅ تأكيد → حفظ والانتقال
        state.customerData[q.field] = pendingValue;
        state.pendingValue = "";
        state.retryCount = 0;
        console.log(`✓ [${state.sessionId}] تأكيد ${q.field} = "${pendingValue}"`);
        return moveToNextStep(state, getNextAskStep(qi));
    }

    if (correctedValue) {
        // 🔄 تصحيح → تأكيد القيمة الجديدة
        state.pendingValue = correctedValue;
        console.log(`🔄 [${state.sessionId}] تصحيح ${q.field}: "${pendingValue}" → "${correctedValue}"`);
        const confirmMsg = `فهمت، يعني ${q.label} هو ${correctedValue}، صح كذا؟`;
        state.conversationHistory.push({ role: "agent", text: confirmMsg });
        state.updatedAt = Date.now();
        sessions.set(state.sessionId, state);
        return { state, agentMessage: confirmMsg, isComplete: false, wasRetry: false, extractedValue: correctedValue };
    }

    // ❌ رفض بدون تصحيح → إعادة السؤال
    state.pendingValue = "";
    state.currentStep = getAskStep(qi);
    const retryMsg = `طيب ماعليش، خلنا نعيد. ${q.retryMessages[0] || `ممكن تقولي ${q.label} مرة ثانية؟`}`;
    state.conversationHistory.push({ role: "agent", text: retryMsg });
    state.updatedAt = Date.now();
    sessions.set(state.sessionId, state);
    return { state, agentMessage: retryMsg, isComplete: false, wasRetry: true, extractedValue: "" };
}

async function handleAskStep(
    state: ConversationState,
    transcription: string,
    currentStep: string
): Promise<{
    state: ConversationState;
    agentMessage: string;
    isComplete: boolean;
    wasRetry: boolean;
    extractedValue: string;
}> {
    const qi = getQuestionIndex(currentStep);
    if (qi < 0) {
        // final_summary أو done
        return moveToNextStep(state, "done");
    }

    const q = QUESTIONS[qi];

    // فحص المقاطعات
    const interruptionResponse = await handleInterruption(transcription, currentStep);
    if (interruptionResponse) {
        console.log(`🗣️ [${state.sessionId}] مقاطعة/سؤال من العميل`);
        state.conversationHistory.push({ role: "agent", text: interruptionResponse });
        state.updatedAt = Date.now();
        sessions.set(state.sessionId, state);
        return { state, agentMessage: interruptionResponse, isComplete: false, wasRetry: true, extractedValue: "" };
    }

    // التحقق من صحة الإجابة
    if (q.validationPrompt) {
        console.log(`🔍 [${state.sessionId}] التحقق من صحة الإجابة لـ ${q.field}...`);
        const isValid = await validateResponse(transcription, q.validationPrompt);

        if (!isValid && state.retryCount < MAX_RETRIES) {
            state.retryCount++;
            const retryMsg = q.retryMessages[state.retryCount - 1] || q.retryMessages[0];
            console.log(`🔄 [${state.sessionId}] إعادة السؤال (${state.retryCount}/${MAX_RETRIES})`);
            state.conversationHistory.push({ role: "agent", text: retryMsg });
            state.updatedAt = Date.now();
            sessions.set(state.sessionId, state);
            return { state, agentMessage: retryMsg, isComplete: false, wasRetry: true, extractedValue: "" };
        }
    }

    // استخراج البيانات
    console.log(`🔍 [${state.sessionId}] استخراج ${q.field}...`);
    const extractedValue = await extractDataFromText(transcription, q.extractPrompt);
    console.log(`✓ [${state.sessionId}] القيمة المستخرجة لـ ${q.field}: "${extractedValue}"`);

    state.retryCount = 0;

    // إذا فشل الاستخراج → إعادة السؤال
    if (!extractedValue || extractedValue === "غير_محدد") {
        const retryMsg = q.retryMessages[0] || `ممكن تقولي ${q.label} مرة ثانية لو سمحت؟`;
        state.conversationHistory.push({ role: "agent", text: retryMsg });
        state.updatedAt = Date.now();
        sessions.set(state.sessionId, state);
        return { state, agentMessage: retryMsg, isComplete: false, wasRetry: true, extractedValue: "" };
    }

    // الانتقال للتأكيد
    state.pendingValue = extractedValue;
    state.currentStep = getConfirmStep(qi);
    const confirmMsg = buildConfirmQuestion(q.label, extractedValue);
    state.conversationHistory.push({ role: "agent", text: confirmMsg });
    state.updatedAt = Date.now();
    sessions.set(state.sessionId, state);

    console.log(`❓ [${state.sessionId}] سؤال تأكيد: "${confirmMsg}"`);
    return { state, agentMessage: confirmMsg, isComplete: false, wasRetry: false, extractedValue };
}

function moveToNextStep(
    state: ConversationState,
    nextStep: string
): {
    state: ConversationState;
    agentMessage: string;
    isComplete: boolean;
    wasRetry: boolean;
    extractedValue: string;
} {
    let agentMessage: string;
    let isComplete = false;

    if (nextStep === "final_summary" || nextStep === "done") {
        agentMessage = buildFinalSummary(state.customerData);
        state.currentStep = "done";
        isComplete = true;
        collectedData.push({ sessionId: state.sessionId, data: { ...state.customerData }, timestamp: Date.now() });
        console.log(`💾 [${state.sessionId}] تم حفظ بيانات العميل!`);
    } else {
        state.currentStep = nextStep;
        const qi = getQuestionIndex(nextStep);
        if (qi >= 0) {
            agentMessage = QUESTIONS[qi].question.replace("{name}", state.customerData.name || "عزيزي");
        } else {
            agentMessage = "خلنا نكمل...";
        }
    }

    state.conversationHistory.push({ role: "agent", text: agentMessage });
    state.updatedAt = Date.now();
    sessions.set(state.sessionId, state);
    return { state, agentMessage, isComplete, wasRetry: false, extractedValue: "" };
}

// ============================================================================
// MESSAGE BUILDERS
// ============================================================================

function buildConfirmQuestion(fieldLabel: string, value: string): string {
    const templates = [
        `تمام، يعني ${fieldLabel} هو ${value}، صح كذا؟`,
        `أوكي فهمت إن ${fieldLabel} ${value}، صحيح ولا لا؟`,
        `خلني أتأكد، ${fieldLabel} هو ${value}، صح؟`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
}

function buildFinalSummary(data: CustomerData): string {
    const parts = ["تمام الحين خلني أراجع معاك كل البيانات اللي أكدتها"];

    QUESTIONS.forEach(q => {
        if (data[q.field] && data[q.field] !== "غير_محدد") {
            parts.push(`${q.label}: ${data[q.field]}`);
        }
    });

    parts.push("شكراً لك على تعاونك! تم حفظ بياناتك بنجاح وراح نتواصل معاك قريب إن شاء الله. الله يسعدك ويعطيك العافية!");
    return parts.join(". ");
}

// ============================================================================
// GETTERS
// ============================================================================

export function getConversationState(sessionId: string): ConversationState | undefined {
    return sessions.get(sessionId);
}

export function getAllCollectedData() {
    return collectedData;
}

export function getStepLabel(step: ConversationStep): string {
    // يتعامل مع كل الخطوات ديناميكياً
    if (step === "welcome") return "الترحيب";
    if (step === "final_summary") return "الملخص النهائي";
    if (step === "done") return "اكتملت";

    const qi = getQuestionIndex(step);
    if (qi >= 0) {
        const q = QUESTIONS[qi];
        if (step.startsWith("confirm_")) return `تأكيد ${q.label}`;
        return q.label;
    }

    return step;
}
