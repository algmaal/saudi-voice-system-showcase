import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Mic, Square, Play, Loader2, AlertCircle, CheckCircle2, Clock, Trash2, Volume2, Wifi, WifiOff, Speaker } from "lucide-react";
import { trpc } from "@/lib/trpc";

// ============================================================================
// TYPES
// ============================================================================

interface ProcessingStage {
  id: string;
  label: string;
  icon: string;
  status: "pending" | "active" | "done" | "error";
}

interface CachedResult {
  transcription: string;
  response: string;
  processingTime: number;
  timestamp: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INITIAL_STAGES: ProcessingStage[] = [
  { id: "record", label: "تسجيل الصوت", icon: "🎤", status: "pending" },
  { id: "upload", label: "رفع الملف", icon: "📤", status: "pending" },
  { id: "stt", label: "تحويل الكلام إلى نص (Whisper)", icon: "📝", status: "pending" },
  { id: "llm", label: "معالجة اللغة (ALLaM)", icon: "🧠", status: "pending" },
  { id: "tts", label: "تحويل الرد إلى كلام (NAMAA-TTS)", icon: "🔊", status: "pending" },
  { id: "complete", label: "اكتمال المعالجة", icon: "✅", status: "pending" },
];

const MAX_RECORDING_DURATION = 30_000; // 30 ثانية

// ============================================================================
// CACHE HELPERS
// ============================================================================

const CACHE_KEY = "voice-test-results";

function getCachedResults(): CachedResult[] {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
}

function addToCache(result: CachedResult): void {
  try {
    const cached = getCachedResults();
    cached.unshift(result);
    // الاحتفاظ بآخر 5 نتائج فقط
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached.slice(0, 5)));
  } catch {
    // تجاهل أخطاء التخزين
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function VoiceTestSection() {
  // حالة التسجيل
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  // حالة المعالجة
  const [isProcessing, setIsProcessing] = useState(false);
  const [stages, setStages] = useState<ProcessingStage[]>(INITIAL_STAGES);
  const [overallProgress, setOverallProgress] = useState(0);

  // النتائج
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [responseAudioBase64, setResponseAudioBase64] = useState("");
  const [processingTime, setProcessingTime] = useState(0);
  const [error, setError] = useState("");

  // التخزين المؤقت
  const [cachedResults, setCachedResults] = useState<CachedResult[]>(getCachedResults());
  const [showHistory, setShowHistory] = useState(false);

  // حالة الاتصال
  const [connectionStatus, setConnectionStatus] = useState<"checking" | "connected" | "error">("checking");

  // المراجع
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // tRPC mutations
  const processAudioMutation = trpc.voice.processAudio.useMutation();
  const connectionQuery = trpc.voice.testConnection.useQuery(undefined, {
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // فحص حالة الاتصال
  useEffect(() => {
    if (connectionQuery.isLoading) {
      setConnectionStatus("checking");
    } else if (connectionQuery.data?.connected) {
      setConnectionStatus("connected");
    } else {
      setConnectionStatus("error");
    }
  }, [connectionQuery.data, connectionQuery.isLoading]);

  // تحديث مرحلة معينة
  const updateStage = useCallback((stageId: string, status: ProcessingStage["status"]) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, status } : s));
  }, []);

  // حساب التقدم الإجمالي
  const calculateProgress = useCallback((stages: ProcessingStage[]) => {
    const doneCount = stages.filter(s => s.status === "done").length;
    return Math.round((doneCount / stages.length) * 100);
  }, []);

  // بدء التسجيل
  const startRecording = async () => {
    try {
      setError("");
      setTranscription("");
      setResponse("");
      setProcessingTime(0);
      setStages(INITIAL_STAGES);
      setOverallProgress(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        updateStage("record", "done");
      };

      mediaRecorder.start(100); // جمع البيانات كل 100 مللي ثانية
      setIsRecording(true);
      updateStage("record", "active");

      // عداد الوقت
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // إيقاف تلقائي بعد 30 ثانية
      maxTimerRef.current = setTimeout(() => {
        stopRecording();
      }, MAX_RECORDING_DURATION);

    } catch (err) {
      setError("فشل الوصول إلى الميكروفون. تأكد من منح إذن الوصول للمتصفح.");
    }
  };

  // إيقاف التسجيل
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (maxTimerRef.current) {
      clearTimeout(maxTimerRef.current);
      maxTimerRef.current = null;
    }
  }, []);

  // تشغيل الصوت المسجل
  const playAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    }
  };

  // تشغيل صوت الرد (TTS)
  const playResponseAudio = useCallback((base64Audio?: string) => {
    const audio64 = base64Audio || responseAudioBase64;
    if (!audio64) return;
    try {
      const byteCharacters = atob(audio64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error("فشل تشغيل صوت الرد:", err);
    }
  }, [responseAudioBase64]);

  // تحويل Blob إلى Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // إزالة بادئة data URL
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // معالجة الصوت - الدالة الرئيسية
  const processAudio = async () => {
    if (!audioBlob) {
      setError("لم يتم تسجيل أي صوت بعد");
      return;
    }

    setIsProcessing(true);
    setError("");
    setTranscription("");
    setResponse("");
    setResponseAudioBase64("");
    setProcessingTime(0);

    // إعادة تعيين المراحل
    const freshStages = INITIAL_STAGES.map(s => ({
      ...s,
      status: s.id === "record" ? "done" as const : "pending" as const
    }));
    setStages(freshStages);
    setOverallProgress(20);

    try {
      // المرحلة 2: رفع الملف
      updateStage("upload", "active");
      setOverallProgress(30);

      const audioBase64 = await blobToBase64(audioBlob);
      updateStage("upload", "done");
      setOverallProgress(40);

      // المرحلة 3: تحويل الكلام إلى نص
      updateStage("stt", "active");
      setOverallProgress(50);

      // المرحلة 4: معالجة اللغة (تتم مع STT في نفس الطلب)
      const result = await processAudioMutation.mutateAsync({
        audioBase64,
      });

      if (!result.success) {
        throw new Error(result.error || "فشلت معالجة الصوت");
      }

      updateStage("stt", "done");
      setOverallProgress(55);

      updateStage("llm", "active");
      setOverallProgress(60);

      // تحديث النتائج
      setTranscription(result.transcription);
      setResponse(result.response);

      updateStage("llm", "done");
      setOverallProgress(70);

      // مرحلة TTS
      updateStage("tts", result.responseAudioBase64 ? "done" : "done");
      setOverallProgress(90);

      if (result.responseAudioBase64) {
        setResponseAudioBase64(result.responseAudioBase64);
      }

      setProcessingTime(result.processingTime);

      // اكتمال
      updateStage("complete", "done");
      setOverallProgress(100);

      // تشغيل صوت الرد تلقائياً بعد الاكتمال
      if (result.responseAudioBase64) {
        setTimeout(() => {
          playResponseAudio(result.responseAudioBase64);
        }, 500);
      }

      // حفظ في التخزين المؤقت
      const cachedResult: CachedResult = {
        transcription: result.transcription,
        response: result.response,
        processingTime: result.processingTime,
        timestamp: Date.now(),
      };
      addToCache(cachedResult);
      setCachedResults(getCachedResults());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "حدث خطأ غير متوقع";

      // تحديد المرحلة التي فشلت
      setStages(prev => prev.map(s =>
        s.status === "active" ? { ...s, status: "error" as const } : s
      ));

      if (errorMessage.includes("503") || errorMessage.includes("loading")) {
        setError("النموذج قيد التحميل على Hugging Face. يرجى المحاولة مرة أخرى بعد دقيقة.");
      } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        setError("مفتاح Hugging Face API غير صالح. تحقق من الإعدادات.");
      } else if (errorMessage.includes("HUGGINGFACE_API_KEY")) {
        setError("مفتاح Hugging Face API غير مُعد. أضف HUGGINGFACE_API_KEY في ملف .env");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // حذف التسجيل
  const clearRecording = () => {
    setAudioBlob(null);
    setTranscription("");
    setResponse("");
    setResponseAudioBase64("");
    setProcessingTime(0);
    setError("");
    setStages(INITIAL_STAGES);
    setOverallProgress(0);
    setRecordingTime(0);
  };

  // تنسيق الوقت
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section id="test" className="w-full py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <div className="container mx-auto px-4">
        {/* العنوان */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            اختبر النظام الآن
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            سجل رسالة صوتية باللهجة السعودية وشاهد كيف يعالجها النظام في الوقت الفعلي
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* حالة الاتصال */}
          <div className="flex justify-center">
            <Badge
              className={`px-4 py-2 text-sm font-medium ${connectionStatus === "connected"
                ? "bg-green-100 text-green-800 border-green-300"
                : connectionStatus === "error"
                  ? "bg-red-100 text-red-800 border-red-300"
                  : "bg-yellow-100 text-yellow-800 border-yellow-300"
                }`}
            >
              {connectionStatus === "connected" ? (
                <>
                  <Wifi className="ml-2 h-4 w-4" />
                  متصل بـ Hugging Face
                </>
              ) : connectionStatus === "error" ? (
                <>
                  <WifiOff className="ml-2 h-4 w-4" />
                  خطأ في الاتصال
                </>
              ) : (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري فحص الاتصال...
                </>
              )}
            </Badge>
          </div>

          {/* بطاقة التسجيل الرئيسية */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                مسجل الصوت التفاعلي
              </CardTitle>
              <CardDescription className="text-base">
                اضغط على الزر لبدء التسجيل، ثم قل جملة باللهجة السعودية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* منطقة التسجيل */}
              <div className="flex flex-col items-center gap-4">
                {/* زر التسجيل الدائري */}
                <div className="relative">
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" style={{ width: "120px", height: "120px", margin: "-10px" }}></div>
                  )}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl ${isRecording
                      ? "bg-gradient-to-br from-red-500 to-red-700 text-white scale-110"
                      : "bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:scale-105"
                      } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    {isRecording ? (
                      <Square className="h-8 w-8" />
                    ) : (
                      <Mic className="h-8 w-8" />
                    )}
                  </button>
                </div>

                {/* عداد وقت التسجيل */}
                {isRecording && (
                  <div className="flex items-center gap-2 text-red-600 font-mono text-lg animate-pulse">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    {formatTime(recordingTime)}
                    <span className="text-sm text-gray-500">/ 0:30</span>
                  </div>
                )}

                {/* نص الحالة */}
                <p className="text-sm text-gray-500">
                  {isRecording
                    ? "جاري التسجيل... اضغط لإيقاف"
                    : audioBlob
                      ? "تم التسجيل بنجاح!"
                      : "اضغط على الزر لبدء التسجيل"
                  }
                </p>
              </div>

              {/* أزرار التحكم بعد التسجيل */}
              {audioBlob && !isRecording && (
                <div className="flex justify-center gap-3 flex-wrap">
                  <Button
                    onClick={playAudio}
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    disabled={isProcessing}
                  >
                    <Volume2 className="ml-2 h-4 w-4" />
                    استمع للتسجيل
                  </Button>
                  <Button
                    onClick={processAudio}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Play className="ml-2 h-4 w-4" />
                        معالجة الصوت
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={clearRecording}
                    variant="ghost"
                    className="text-gray-500 hover:text-red-500"
                    disabled={isProcessing}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    مسح
                  </Button>
                </div>
              )}

              {/* مؤشر التقدم الرئيسي */}
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>التقدم الإجمالي</span>
                    <span>{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} className="h-3" />
                </div>
              )}

              {/* مراحل المعالجة */}
              {(isProcessing || overallProgress > 0) && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <h4 className="font-semibold text-gray-700 text-sm mb-3">مراحل المعالجة:</h4>
                  {stages.map((stage) => (
                    <div key={stage.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${stage.status === "active" ? "bg-blue-50 border border-blue-200" :
                      stage.status === "done" ? "bg-green-50" :
                        stage.status === "error" ? "bg-red-50 border border-red-200" :
                          ""
                      }`}>
                      {/* أيقونة الحالة */}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                        {stage.status === "active" ? (
                          <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                        ) : stage.status === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : stage.status === "error" ? (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        ) : (
                          <span className="text-lg">{stage.icon}</span>
                        )}
                      </div>
                      {/* معلومات المرحلة */}
                      <span className={`text-sm font-medium ${stage.status === "active" ? "text-blue-700" :
                        stage.status === "done" ? "text-green-700" :
                          stage.status === "error" ? "text-red-700" :
                            "text-gray-500"
                        }`}>
                        {stage.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* رسالة الخطأ */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3 items-start animate-in fade-in duration-300">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-800 font-medium">{error}</p>
                    <Button
                      onClick={processAudio}
                      variant="link"
                      className="text-red-600 hover:text-red-800 p-0 h-auto mt-1 text-sm"
                    >
                      إعادة المحاولة
                    </Button>
                  </div>
                </div>
              )}

              {/* النتائج */}
              {(transcription || response) && !isProcessing && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* وقت المعالجة */}
                  {processingTime > 0 && (
                    <div className="flex justify-center">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                        <Clock className="ml-1 h-3 w-3" />
                        وقت المعالجة: {(processingTime / 1000).toFixed(1)} ثانية
                      </Badge>
                    </div>
                  )}

                  {transcription && (
                    <div className="p-5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl">
                      <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">📝</span>
                        النص المحول (Whisper):
                      </h3>
                      <p className="text-blue-800 text-lg leading-relaxed">{transcription}</p>
                    </div>
                  )}
                  {response && (
                    <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-100 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-green-900 flex items-center gap-2">
                          <span className="text-lg">🧠</span>
                          الاستجابة (ALLaM):
                        </h3>
                        {responseAudioBase64 && (
                          <Button
                            onClick={() => playResponseAudio()}
                            size="sm"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white gap-1.5 shadow-md"
                          >
                            <Speaker className="h-4 w-4" />
                            استمع للرد
                          </Button>
                        )}
                      </div>
                      <p className="text-green-800 text-lg leading-relaxed">{response}</p>
                      {responseAudioBase64 && (
                        <div className="mt-3 pt-3 border-t border-green-200">
                          <p className="text-green-600 text-sm flex items-center gap-1.5">
                            <span>🔊</span>
                            تم إنشاء الرد الصوتي بنجاح عبر NAMAA-Saudi-TTS
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* سجل النتائج السابقة */}
              {cachedResults.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Clock className="h-4 w-4" />
                    {showHistory ? "إخفاء" : "عرض"} النتائج السابقة ({cachedResults.length})
                  </button>

                  {showHistory && (
                    <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      {cachedResults.map((cached, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-400 text-xs">
                              {new Date(cached.timestamp).toLocaleString("ar-SA")}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {(cached.processingTime / 1000).toFixed(1)}ث
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-1">
                            <strong>النص:</strong> {cached.transcription || "—"}
                          </p>
                          <p className="text-gray-600">
                            <strong>الرد:</strong> {cached.response || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
