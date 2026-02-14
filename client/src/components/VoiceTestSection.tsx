import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Square, Play, Loader2, AlertCircle } from "lucide-react";

export default function VoiceTestSection() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [transcription, setTranscription] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      setError("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError("فشل الوصول إلى الميكروفون. تأكد من منح الإذن.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const processAudio = async () => {
    if (!audioBlob) {
      setError("لم يتم تسجيل أي صوت");
      return;
    }

    setIsProcessing(true);
    setError("");
    setTranscription("");
    setResponse("");

    try {
      // في المستقبل، سيتم استدعاء الخادم الخلفي هنا
      // للآن، سنعرض رسالة توضيحية
      setTranscription("جاري معالجة الملف الصوتي...");
      setResponse("سيتم إضافة المعالجة الفعلية قريباً");
    } catch (err) {
      setError("حدث خطأ أثناء معالجة الملف الصوتي");
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.play();
    }
  };

  return (
    <section id="test" className="w-full py-20 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            اختبر النظام الآن
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            سجل رسالة صوتية باللهجة السعودية واشاهد كيف يعالجها النظام
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                مسجل الصوت التفاعلي
              </CardTitle>
              <CardDescription>
                اضغط على الزر لبدء التسجيل، ثم قل جملة باللهجة السعودية
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Recording Controls */}
              <div className="flex justify-center gap-4">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg"
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    ابدأ التسجيل
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-6 text-lg"
                  >
                    <Square className="mr-2 h-5 w-5" />
                    إيقاف التسجيل
                  </Button>
                )}
              </div>

              {/* Audio Playback */}
              {audioBlob && (
                <div className="flex justify-center gap-4">
                  <Button
                    onClick={playAudio}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    استمع إلى التسجيل
                  </Button>
                  <Button
                    onClick={processAudio}
                    disabled={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      "معالجة الصوت"
                    )}
                  </Button>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Results */}
              {(transcription || response) && (
                <div className="space-y-4">
                  {transcription && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-semibold text-blue-900 mb-2">النص المحول:</h3>
                      <p className="text-blue-800">{transcription}</p>
                    </div>
                  )}
                  {response && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-2">الاستجابة:</h3>
                      <p className="text-green-800">{response}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Info Box */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>ملاحظة:</strong> هذا النموذج التفاعلي قيد التطوير. سيتم إضافة المعالجة الفعلية مع نماذج Hugging Face قريباً.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
