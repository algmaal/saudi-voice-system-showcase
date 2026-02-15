import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Mic,
    Square,
    Loader2,
    Phone,
    PhoneOff,
    User,
    Calendar,
    Briefcase,
    MapPin,
    Smartphone,
    CheckCircle2,
    Volume2,
    MessageCircle,
    ArrowLeft,
    Download,
    RotateCcw,
    AlertCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ============================================================================
// TYPES
// ============================================================================

interface ChatMessage {
    id: string;
    role: "agent" | "customer" | "system";
    text: string;
    audioBase64?: string;
    timestamp: number;
    isRetry?: boolean;
}

interface CustomerData {
    [key: string]: string;
}

type CallPhase =
    | "idle"
    | "connecting"
    | "agent_speaking"
    | "listening"
    | "recording"
    | "processing"
    | "complete";

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_ICONS: Record<string, typeof User> = {
    ask_name: User,
    ask_age: Calendar,
    ask_dob: Calendar,
    ask_job: Briefcase,
    ask_city: MapPin,
    final_summary: CheckCircle2,
    done: CheckCircle2,
};

const STEP_NAMES: Record<string, string> = {
    welcome: "الترحيب",
    ask_name: "الاسم",
    ask_age: "العمر",
    ask_dob: "تاريخ الميلاد",
    ask_job: "الوظيفة",
    ask_city: "المدينة",
    final_summary: "الملخص النهائي",
    done: "اكتملت",
};

// خريطة ربط خطوات التأكيد بالخطوة الأصلية (للعرض في الشريط الجانبي)
const CONFIRM_TO_ASK: Record<string, string> = {
    confirm_name: "ask_name",
    confirm_age: "ask_age",
    confirm_dob: "ask_dob",
    confirm_job: "ask_job",
    confirm_city: "ask_city",
};

const ALL_STEPS = ["ask_name", "ask_age", "ask_dob", "ask_job", "ask_city", "final_summary"];

// ============================================================================
// AUDIO HELPERS
// ============================================================================

/**
 * كشف تلقائي لنوع الملف الصوتي
 */
function detectAudioMime(base64: string): string {
    try {
        const header = atob(base64.substring(0, 20));
        if (header.startsWith("RIFF")) return "audio/wav";
        if (header.startsWith("ID3") || (header.charCodeAt(0) === 0xFF && (header.charCodeAt(1) & 0xE0) === 0xE0)) return "audio/mpeg";
        if (header.startsWith("OggS")) return "audio/ogg";
        if (header.startsWith("fLaC")) return "audio/flac";
    } catch { /* fallback */ }
    return "audio/wav";
}

/**
 * تشغيل صوت من base64
 */
function playBase64Audio(base64: string): Promise<void> {
    return new Promise((resolve, reject) => {
        try {
            const mime = detectAudioMime(base64);
            console.log(`🔊 تشغيل صوت: ${mime} (${(base64.length * 0.75 / 1024).toFixed(1)} KB)`);
            const bytes = atob(base64);
            const arr = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
            const blob = new Blob([arr], { type: mime });
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audio.volume = 1.0;
            audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
            audio.onerror = (e) => {
                URL.revokeObjectURL(url);
                console.warn("❌ خطأ في تشغيل الصوت:", e);
                reject(new Error("فشل تشغيل الصوت"));
            };
            audio.play().catch((err) => {
                URL.revokeObjectURL(url);
                reject(err);
            });
        } catch (err) { reject(err); }
    });
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const bytes = atob(base64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mimeType });
}

/**
 * تحويل AudioBuffer إلى WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
    const numChannels = 1; // mono
    const sampleRate = buffer.sampleRate;
    const samples = buffer.getChannelData(0);
    const dataLength = samples.length * 2; // 16-bit = 2 bytes per sample
    const headerLength = 44;
    const totalLength = headerLength + dataLength;
    const arrayBuffer = new ArrayBuffer(totalLength);
    const view = new DataView(arrayBuffer);

    // RIFF header
    writeString(view, 0, "RIFF");
    view.setUint32(4, totalLength - 8, true);
    writeString(view, 8, "WAVE");
    // fmt chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // chunk size
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true); // byte rate
    view.setUint16(32, numChannels * 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    // data chunk
    writeString(view, 36, "data");
    view.setUint32(40, dataLength, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        offset += 2;
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
    }
}

// ============================================================================
// VAD - كشف الصمت (Voice Activity Detection)
// ============================================================================

const VAD_SILENCE_THRESHOLD = 0.015;  // عتبة RMS للصمت
const VAD_SILENCE_DURATION = 2000;    // مدة الصمت قبل الإيقاف (2 ثواني)
const VAD_MIN_RECORDING_MS = 1500;    // أقل مدة تسجيل قبل السماح بالإيقاف
const VAD_MAX_RECORDING_MS = 30000;   // أقصى مدة تسجيل (30 ثانية)

// ============================================================================
// COMPONENT
// ============================================================================

export default function CallCenterSection() {
    // == State ==
    const [phase, setPhase] = useState<CallPhase>("idle");
    const [sessionId, setSessionId] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [currentApiStep, setCurrentApiStep] = useState("");
    const [customerData, setCustomerData] = useState<CustomerData>({
        name: "", age: "", dateOfBirth: "", job: "", city: "",
    });
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState("");
    const [callDuration, setCallDuration] = useState(0);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevel, setAudioLevel] = useState(0); // مستوى الصوت الحالي
    const [isConverting, setIsConverting] = useState(false);

    // == Recording refs ==
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const maxRecTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const autoRecordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionIdRef = useRef("");

    // == VAD refs ==
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const vadFrameRef = useRef<number>(0);
    const silenceStartRef = useRef<number | null>(null);
    const recordingStartRef = useRef<number>(0);

    // == Call recording (كل المقاطع الصوتية) ==
    const callRecordingBlobsRef = useRef<Blob[]>([]);

    // == tRPC ==
    const startSessionMutation = trpc.callCenter.startSession.useMutation();
    const processResponseMutation = trpc.callCenter.processResponse.useMutation();

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // == Helpers ==
    const addMsg = useCallback(
        (role: ChatMessage["role"], text: string, audioBase64?: string, isRetry?: boolean) => {
            const msg: ChatMessage = {
                id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                role, text, audioBase64, timestamp: Date.now(), isRetry,
            };
            setMessages((prev) => [...prev, msg]);
            return msg;
        },
        []
    );

    const formatTime = (s: number) =>
        `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

    // ============================================================================
    // CORE FLOW: agent speaks → auto-record with VAD → process → repeat
    // ============================================================================

    /**
     * تشغيل صوت الوكيل (NAMAA TTS) ثم بدء التسجيل تلقائياً
     */
    const playAgentAndAutoRecord = useCallback(
        async (audioBase64: string | undefined) => {
            setPhase("agent_speaking");

            // تشغيل صوت NAMAA TTS
            if (audioBase64) {
                try {
                    callRecordingBlobsRef.current.push(base64ToBlob(audioBase64, detectAudioMime(audioBase64)));
                    await playBase64Audio(audioBase64);
                    console.log("✅ تم تشغيل صوت NAMAA TTS بنجاح");
                } catch (e) {
                    console.warn("⚠️ فشل تشغيل الصوت:", e);
                }
            } else {
                console.warn("⚠️ لا يوجد صوت TTS — NAMAA فشل في كل المحاولات");
                // انتظار قصير حتى يقرأ المستخدم النص
                await new Promise(r => setTimeout(r, 2000));
            }

            // بدء التسجيل تلقائياً بعد 500ms
            setPhase("listening");
            autoRecordTimeoutRef.current = setTimeout(() => {
                autoStartRecording();
            }, 500);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // ============================================================================
    // START CALL
    // ============================================================================

    const startCall = async () => {
        setPhase("connecting");
        setError("");
        setMessages([]);
        setCustomerData({ name: "", age: "", dateOfBirth: "", job: "", city: "" });
        setIsComplete(false);
        setCallDuration(0);
        callRecordingBlobsRef.current = [];

        try {
            const result = await startSessionMutation.mutateAsync();
            if (!result.success) throw new Error(result.error || "فشل بدء المحادثة");

            setSessionId(result.sessionId);
            sessionIdRef.current = result.sessionId;
            setCurrentApiStep(result.currentStep);

            // بدء عداد المكالمة
            callTimerRef.current = setInterval(() => setCallDuration((p) => p + 1), 1000);

            // إضافة رسالة ترحيب
            addMsg("agent", result.agentMessage, result.agentAudioBase64);

            // تشغيل الصوت ثم التسجيل التلقائي
            await playAgentAndAutoRecord(result.agentAudioBase64);
        } catch (err) {
            setError(err instanceof Error ? err.message : "فشل بدء المحادثة");
            setPhase("idle");
        }
    };

    // ============================================================================
    // VAD - مراقبة الصوت وكشف الصمت
    // ============================================================================

    const startVAD = useCallback((stream: MediaStream) => {
        try {
            const ctx = new AudioContext();
            const source = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            analyser.smoothingTimeConstant = 0.3;
            source.connect(analyser);

            audioContextRef.current = ctx;
            analyserRef.current = analyser;
            silenceStartRef.current = null;
            recordingStartRef.current = Date.now();

            const dataArray = new Float32Array(analyser.fftSize);

            const checkLevel = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getFloatTimeDomainData(dataArray);

                // حساب RMS (مستوى الصوت)
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i] * dataArray[i];
                }
                const rms = Math.sqrt(sum / dataArray.length);
                setAudioLevel(rms);

                const elapsed = Date.now() - recordingStartRef.current;

                // كشف الصمت
                if (rms < VAD_SILENCE_THRESHOLD) {
                    if (!silenceStartRef.current) {
                        silenceStartRef.current = Date.now();
                    } else {
                        const silenceDuration = Date.now() - silenceStartRef.current;
                        // إيقاف تلقائي إذا كان الصمت أكثر من 2 ثانية وتم التسجيل لمدة كافية
                        if (silenceDuration >= VAD_SILENCE_DURATION && elapsed >= VAD_MIN_RECORDING_MS) {
                            console.log(`🔇 VAD: صمت لمدة ${(silenceDuration / 1000).toFixed(1)}s → إيقاف التسجيل تلقائياً`);
                            stopRecordingVAD();
                            return;
                        }
                    }
                } else {
                    // يوجد صوت → إعادة تعيين عداد الصمت
                    silenceStartRef.current = null;
                }

                // حد أقصى للتسجيل
                if (elapsed >= VAD_MAX_RECORDING_MS) {
                    console.log("⏱️ VAD: وصل الحد الأقصى للتسجيل");
                    stopRecordingVAD();
                    return;
                }

                vadFrameRef.current = requestAnimationFrame(checkLevel);
            };

            vadFrameRef.current = requestAnimationFrame(checkLevel);
            console.log("🎙️ VAD: بدأت مراقبة الصوت");
        } catch (err) {
            console.warn("⚠️ فشل تشغيل VAD:", err);
        }
    }, []);

    const stopVAD = useCallback(() => {
        if (vadFrameRef.current) {
            cancelAnimationFrame(vadFrameRef.current);
            vadFrameRef.current = 0;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        silenceStartRef.current = null;
        setAudioLevel(0);
    }, []);

    // ============================================================================
    // RECORDING مع VAD
    // ============================================================================

    const autoStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { channelCount: 1, sampleRate: 16000, echoCancellation: true, noiseSuppression: true },
            });

            const recorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
                    ? "audio/webm;codecs=opus" : "audio/webm",
            });

            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                stopVAD();
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                stream.getTracks().forEach((t) => t.stop());
                // حفظ صوت العميل في تسجيل المكالمة
                callRecordingBlobsRef.current.push(blob);
                await handleCustomerAudio(blob);
            };

            recorder.start(100);
            setPhase("recording");
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime((p) => p + 1), 1000);

            // تشغيل VAD لكشف الصمت التلقائي
            startVAD(stream);

            // إيقاف تلقائي احتياطي بعد 30 ثانية
            maxRecTimerRef.current = setTimeout(() => stopRecordingVAD(), VAD_MAX_RECORDING_MS);
        } catch {
            setError("فشل الوصول إلى الميكروفون. تأكد من إعطاء الصلاحيات.");
            setPhase("listening");
        }
    };

    const stopRecordingVAD = useCallback(() => {
        stopVAD();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (maxRecTimerRef.current) clearTimeout(maxRecTimerRef.current);
    }, [stopVAD]);

    // أيضاً نحتفظ بالإيقاف اليدوي
    const stopRecording = useCallback(() => {
        stopRecordingVAD();
    }, [stopRecordingVAD]);

    // ============================================================================
    // PROCESS CUSTOMER AUDIO
    // ============================================================================

    const handleCustomerAudio = async (blob: Blob) => {
        setPhase("processing");

        try {
            const reader = new FileReader();
            const audioBase64 = await new Promise<string>((resolve, reject) => {
                reader.onload = () => resolve((reader.result as string).split(",")[1]);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

            const sid = sessionIdRef.current;
            const result = await processResponseMutation.mutateAsync({ sessionId: sid, audioBase64 });

            if (!result.success) throw new Error(result.error || "فشل المعالجة");

            // إضافة رد العميل
            if (result.customerText) {
                addMsg("customer", result.customerText);
            }

            // إضافة رد الوكيل
            addMsg("agent", result.agentMessage, result.agentAudioBase64, result.wasRetry);

            // تحديث البيانات
            setCustomerData(result.customerData);
            setCurrentApiStep(result.currentStep);

            if (result.isComplete) {
                setIsComplete(true);
                // تشغيل رسالة الإنهاء
                setPhase("agent_speaking");
                if (result.agentAudioBase64) {
                    callRecordingBlobsRef.current.push(base64ToBlob(result.agentAudioBase64, detectAudioMime(result.agentAudioBase64)));
                    try { await playBase64Audio(result.agentAudioBase64); } catch { }
                }
                endCall();
                return;
            }

            // تشغيل صوت الوكيل ثم فتح الميكروفون مع VAD
            await playAgentAndAutoRecord(result.agentAudioBase64);
        } catch (err) {
            setError(err instanceof Error ? err.message : "فشل معالجة الرد");
            setPhase("listening");
        }
    };

    // ============================================================================
    // END CALL
    // ============================================================================

    const endCall = useCallback(() => {
        stopVAD();
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (callTimerRef.current) clearInterval(callTimerRef.current);
        if (maxRecTimerRef.current) clearTimeout(maxRecTimerRef.current);
        if (autoRecordTimeoutRef.current) clearTimeout(autoRecordTimeoutRef.current);
        setPhase("complete");
    }, [stopVAD]);

    // ============================================================================
    // DOWNLOAD CALL RECORDING (WAV)
    // ============================================================================

    const downloadRecording = async () => {
        const blobs = callRecordingBlobsRef.current;
        if (blobs.length === 0) return;

        setIsConverting(true);
        try {
            const ctx = new AudioContext();
            const audioBuffers: AudioBuffer[] = [];

            // فك ترميز كل المقاطع الصوتية
            for (const blob of blobs) {
                try {
                    const arrBuf = await blob.arrayBuffer();
                    const decoded = await ctx.decodeAudioData(arrBuf);
                    audioBuffers.push(decoded);
                } catch (e) {
                    console.warn("⚠️ تخطي مقطع صوتي لا يمكن فك ترميزه:", e);
                }
            }

            if (audioBuffers.length === 0) {
                setError("لا توجد مقاطع صوتية صالحة للتحميل");
                return;
            }

            // حساب الطول الإجمالي
            const sampleRate = audioBuffers[0].sampleRate;
            let totalLength = 0;
            for (const buf of audioBuffers) {
                // إعادة العينات إذا كان معدل العينات مختلف
                totalLength += Math.round(buf.length * sampleRate / buf.sampleRate);
            }

            // إنشاء AudioBuffer موحد
            const combined = ctx.createBuffer(1, totalLength, sampleRate);
            const output = combined.getChannelData(0);
            let offset = 0;

            for (const buf of audioBuffers) {
                const data = buf.getChannelData(0);
                if (buf.sampleRate === sampleRate) {
                    output.set(data, offset);
                    offset += data.length;
                } else {
                    // إعادة تعيين العينات (resampling بسيط)
                    const ratio = buf.sampleRate / sampleRate;
                    const newLen = Math.round(data.length / ratio);
                    for (let i = 0; i < newLen; i++) {
                        const srcIdx = Math.min(Math.floor(i * ratio), data.length - 1);
                        output[offset + i] = data[srcIdx];
                    }
                    offset += newLen;
                }
            }

            // تحويل إلى WAV
            const wavBlob = audioBufferToWav(combined);
            ctx.close();

            // تحميل
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `call_recording_${sessionId}_${new Date().toISOString().slice(0, 10)}.wav`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`✅ تم تحميل التسجيل كـ WAV (${(wavBlob.size / 1024 / 1024).toFixed(2)} MB)`);
        } catch (err) {
            console.error("❌ خطأ في تحويل التسجيل:", err);
            setError("فشل تحويل التسجيل إلى WAV");
        } finally {
            setIsConverting(false);
        }
    };

    // ============================================================================
    // RESET
    // ============================================================================

    const resetCall = () => {
        endCall();
        setPhase("idle");
        setMessages([]);
        setCustomerData({ name: "", age: "", dateOfBirth: "", job: "", city: "" });
        setIsComplete(false);
        setSessionId("");
        sessionIdRef.current = "";
        setCallDuration(0);
        setError("");
        callRecordingBlobsRef.current = [];
    };

    // ============================================================================
    // RENDER HELPERS
    // ============================================================================

    const isActive = phase !== "idle" && phase !== "complete" && phase !== "connecting";

    const phaseLabel = {
        idle: "في الانتظار",
        connecting: "جاري الاتصال...",
        agent_speaking: "الوكيل يتحدث... 🔊",
        listening: "جاري فتح الميكروفون...",
        recording: "يسمعك... تكلم 🎤",
        processing: "جاري المعالجة... ⏳",
        complete: "انتهت المكالمة",
    }[phase];

    const phaseColor = {
        idle: "bg-slate-600",
        connecting: "bg-yellow-500 animate-pulse",
        agent_speaking: "bg-blue-500 animate-pulse",
        listening: "bg-emerald-500 animate-pulse",
        recording: "bg-red-500 animate-pulse",
        processing: "bg-amber-500 animate-pulse",
        complete: "bg-purple-600",
    }[phase];

    // ============================================================================
    // RENDER
    // ============================================================================

    return (
        <section id="call-center" className="w-full py-16 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 min-h-screen">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-10">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-1.5 mb-4">
                        <Phone className="ml-2 h-4 w-4" />
                        كول سنتر ذكي باللهجة السعودية
                    </Badge>
                    <h2 className="text-4xl lg:text-5xl font-bold text-white mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
                        مركز الاتصال الصوتي
                    </h2>
                    <p className="text-lg text-blue-200/70 max-w-2xl mx-auto">
                        مكالمة حقيقية بالذكاء الاصطناعي — يرحب بك، يسألك، ويتأكد من إجاباتك
                    </p>
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* ======== LEFT: CHAT ======== */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 bg-white/5 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden border border-white/10 flex flex-col h-[680px]">
                            {/* Call Header Bar */}
                            <div className={`px-5 py-3 flex items-center justify-between ${isActive ? "bg-gradient-to-r from-emerald-600/80 to-emerald-700/80"
                                : phase === "complete" ? "bg-gradient-to-r from-purple-600/80 to-purple-700/80"
                                    : "bg-gradient-to-r from-blue-600/80 to-blue-700/80"
                                }`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${phaseColor}`} />
                                    <div>
                                        <h3 className="text-white font-bold text-sm">
                                            {phase === "idle" ? "كول سنتر سعودي" : phaseLabel}
                                        </h3>
                                        {isActive && (
                                            <span className="text-white/60 text-xs font-mono">{formatTime(callDuration)}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isActive && (
                                        <Button onClick={endCall} size="sm" className="bg-red-500 hover:bg-red-600 text-white rounded-full text-xs px-3 h-7">
                                            <PhoneOff className="h-3 w-3 ml-1" />
                                            إنهاء
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Chat Area */}
                            <div className="flex-1 p-5 space-y-3 overflow-y-auto bg-gradient-to-b from-slate-900/50 to-slate-800/50">
                                {/* Idle */}
                                {phase === "idle" && messages.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full gap-5 text-center">
                                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-xl shadow-emerald-500/20 animate-pulse">
                                            <Phone className="h-10 w-10 text-white" />
                                        </div>
                                        <h3 className="text-white text-xl font-bold">مرحباً بك في الكول سنتر</h3>
                                        <p className="text-blue-200/50 text-sm max-w-sm">
                                            اضغط الزر عشان تبدأ المكالمة. النظام بيرحب فيك ويبدأ يسألك أسئلة صوتية وينتظر ردودك تلقائياً
                                        </p>
                                        <Button onClick={startCall} disabled={startSessionMutation.isPending}
                                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-5 text-base rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105"
                                        >
                                            {startSessionMutation.isPending ? (
                                                <><Loader2 className="ml-2 h-5 w-5 animate-spin" />جاري الاتصال...</>
                                            ) : (
                                                <><Phone className="ml-2 h-5 w-5" />ابدأ المكالمة</>
                                            )}
                                        </Button>
                                    </div>
                                )}

                                {/* Messages */}
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.role === "agent" ? "justify-start" : msg.role === "customer" ? "justify-end" : "justify-center"}`}>
                                        {msg.role === "system" ? (
                                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs px-3 py-1">
                                                {msg.text}
                                            </Badge>
                                        ) : (
                                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "agent"
                                                ? msg.isRetry
                                                    ? "bg-gradient-to-r from-amber-600/50 to-amber-500/50 text-white rounded-tl-sm border border-amber-500/20"
                                                    : "bg-gradient-to-r from-blue-600/50 to-blue-500/50 text-white rounded-tl-sm"
                                                : "bg-gradient-to-r from-emerald-600/50 to-emerald-500/50 text-white rounded-tr-sm"
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[11px] font-bold opacity-60">
                                                        {msg.role === "agent" ? (msg.isRetry ? "🔄 الوكيل (إعادة)" : "🤖 الوكيل") : "🎤 أنت"}
                                                    </span>
                                                    {msg.audioBase64 && (
                                                        <button onClick={() => playBase64Audio(msg.audioBase64!)} className="opacity-50 hover:opacity-100 transition-opacity" title="إعادة تشغيل">
                                                            <Volume2 className="h-3 w-3" />
                                                        </button>
                                                    )}
                                                </div>
                                                <p className="text-sm leading-relaxed" dir="rtl">{msg.text}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Live indicators */}
                                {phase === "processing" && (
                                    <div className="flex justify-start">
                                        <div className="bg-blue-600/30 rounded-2xl px-4 py-3 rounded-tl-sm flex items-center gap-2">
                                            <Loader2 className="h-4 w-4 text-blue-300 animate-spin" />
                                            <span className="text-blue-200 text-sm">جاري التحليل والتحقق...</span>
                                        </div>
                                    </div>
                                )}

                                {phase === "agent_speaking" && (
                                    <div className="flex justify-center">
                                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 animate-pulse text-xs">
                                            <Volume2 className="ml-1 h-3 w-3" /> الوكيل يتحدث...
                                        </Badge>
                                    </div>
                                )}

                                <div ref={chatEndRef} />
                            </div>

                            {/* Bottom Bar */}
                            <div className="px-5 py-3 bg-slate-800/80 border-t border-white/5">
                                {phase === "recording" && (
                                    <div className="flex items-center justify-center gap-4">
                                        <Button onClick={stopRecording}
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-14 h-14 p-0 shadow-lg shadow-red-500/30 animate-pulse"
                                        >
                                            <Square className="h-5 w-5" />
                                        </Button>
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-2 text-red-400 font-mono text-sm">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                                {formatTime(recordingTime)}
                                            </div>
                                            {/* مؤشر مستوى الصوت */}
                                            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-100"
                                                    style={{ width: `${Math.min(audioLevel * 500, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                        <span className="text-blue-200/40 text-xs">يوقف تلقائي عند السكوت</span>
                                    </div>
                                )}

                                {phase === "listening" && (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-blue-200/50 text-sm">جاري فتح الميكروفون تلقائياً...</span>
                                    </div>
                                )}

                                {phase === "agent_speaking" && (
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-blue-200/50 text-sm">استمع للوكيل... الميكروفون يفتح بعد ما يخلص</span>
                                    </div>
                                )}

                                {phase === "processing" && (
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
                                        <span className="text-blue-200/50 text-sm">جاري التحقق من إجابتك...</span>
                                    </div>
                                )}

                                {phase === "complete" && (
                                    <div className="flex items-center justify-center gap-3">
                                        <Button onClick={downloadRecording} disabled={isConverting}
                                            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 rounded-xl text-sm"
                                        >
                                            {isConverting ? (
                                                <><Loader2 className="ml-1.5 h-4 w-4 animate-spin" />جاري التحويل لـ WAV...</>
                                            ) : (
                                                <><Download className="ml-1.5 h-4 w-4" />تحميل التسجيل (WAV)</>
                                            )}
                                        </Button>
                                        <Button onClick={resetCall}
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 rounded-xl text-sm"
                                        >
                                            <RotateCcw className="ml-1.5 h-4 w-4" />
                                            مكالمة جديدة
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="px-5 py-2 bg-red-500/15 border-t border-red-500/20 flex items-center gap-2 justify-center">
                                    <AlertCircle className="h-4 w-4 text-red-400" />
                                    <p className="text-red-300 text-xs">{error}</p>
                                    <button onClick={() => setError("")} className="text-red-400 hover:text-red-300 text-xs underline">إغلاق</button>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ======== RIGHT: SIDEBAR ======== */}
                    <div className="space-y-4">
                        {/* Status */}
                        {isActive && (
                            <Card className="border-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                                <div className={`px-4 py-2 text-center text-xs font-bold text-white ${phaseColor}`}>
                                    {phaseLabel}
                                </div>
                                <CardContent className="p-4 text-center">
                                    <span className="text-white/60 font-mono text-2xl">{formatTime(callDuration)}</span>
                                </CardContent>
                            </Card>
                        )}

                        {/* Progress */}
                        <Card className="border-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                            <CardContent className="p-4">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                                    <MessageCircle className="h-4 w-4 text-blue-400" />
                                    مراحل المحادثة
                                </h3>
                                <div className="space-y-1.5">
                                    {ALL_STEPS.map((step) => {
                                        const Icon = STEP_ICONS[step] || User;
                                        const si = ALL_STEPS.indexOf(step);
                                        // حوّل خطوات التأكيد (confirm_xxx) لخطوة السؤال (ask_xxx) للمقارنة
                                        const displayStep = CONFIRM_TO_ASK[currentApiStep] || currentApiStep;
                                        const ci = ALL_STEPS.indexOf(displayStep);
                                        const isConfirming = CONFIRM_TO_ASK[currentApiStep] === step;
                                        const isPast = isComplete || (ci >= 0 && si < ci);
                                        const isCurrent = (step === displayStep && !isComplete) || isConfirming;

                                        return (
                                            <div key={step} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all text-xs ${isCurrent ? (isConfirming ? "bg-amber-500/20 border border-amber-500/30" : "bg-blue-500/20 border border-blue-500/30") : isPast ? "bg-emerald-500/10" : "opacity-30"
                                                }`}>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isPast ? "bg-emerald-500/30" : isCurrent ? (isConfirming ? "bg-amber-500/30 animate-pulse" : "bg-blue-500/30 animate-pulse") : "bg-white/10"
                                                    }`}>
                                                    {isPast ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Icon className="h-3 w-3 text-white/60" />}
                                                </div>
                                                <span className={`font-medium ${isPast ? "text-emerald-300" : isCurrent ? (isConfirming ? "text-amber-300" : "text-blue-300") : "text-white/40"}`}>
                                                    {STEP_NAMES[step]}
                                                    {isConfirming && <span className="mr-1 text-[10px] text-amber-400/80">(تأكيد)</span>}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Data */}
                        <Card className="border-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                            <CardContent className="p-4">
                                <h3 className="text-white font-bold mb-3 flex items-center gap-2 text-sm">
                                    <User className="h-4 w-4 text-emerald-400" />
                                    بيانات العميل
                                </h3>
                                <div className="space-y-2">
                                    {[
                                        { key: "name", label: "الاسم", icon: User },
                                        { key: "age", label: "العمر", icon: Calendar },
                                        { key: "dateOfBirth", label: "تاريخ الميلاد", icon: Calendar },
                                        { key: "job", label: "الوظيفة", icon: Briefcase },
                                        { key: "city", label: "المدينة", icon: MapPin },
                                    ].map(({ key, label, icon: Icon }) => {
                                        const value = customerData[key as keyof CustomerData];
                                        const hasValue = !!value && value !== "غير_محدد";
                                        return (
                                            <div key={key} className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all ${hasValue ? "bg-emerald-500/10 border border-emerald-500/15" : "bg-white/5"
                                                }`}>
                                                <Icon className={`h-3.5 w-3.5 ${hasValue ? "text-emerald-400" : "text-white/25"}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white/40 text-[10px] leading-none mb-0.5">{label}</p>
                                                    <p className={`text-xs truncate ${hasValue ? "text-white font-medium" : "text-white/15"}`}>
                                                        {hasValue ? value : "—"}
                                                    </p>
                                                </div>
                                                {hasValue && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
                                            </div>
                                        );
                                    })}
                                </div>

                                {isComplete && (
                                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                                        <p className="text-emerald-300 text-xs text-center font-medium">✅ تم حفظ البيانات بنجاح!</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Instructions */}
                        {phase === "idle" && (
                            <Card className="border-0 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
                                <CardContent className="p-4">
                                    <h3 className="text-white font-bold mb-2 text-sm">كيف يشتغل النظام؟</h3>
                                    <ul className="space-y-1.5 text-blue-200/50 text-xs">
                                        <li>1️⃣ اضغط "ابدأ المكالمة"</li>
                                        <li>2️⃣ النظام يرحب فيك صوتياً</li>
                                        <li>3️⃣ الميكروفون يفتح تلقائي</li>
                                        <li>4️⃣ جاوب على الأسئلة بصوتك</li>
                                        <li>5️⃣ النظام يتحقق من إجابتك</li>
                                        <li>6️⃣ لو ما فهم يعيد السؤال</li>
                                        <li>7️⃣ في النهاية يراجع بياناتك</li>
                                        <li>📥 تقدر تحمل تسجيل المكالمة</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
