import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Github, BookOpen } from "lucide-react";

export default function ResourcesSection() {
  const resources = [
    {
      title: "Whisper Saudi",
      description: "نموذج متخصص في التعرف على الكلام باللهجة السعودية",
      link: "https://huggingface.co/speechbrain/asr-whisper-large-v2-commonvoice-ar",
      icon: "🎤",
      tags: ["STT", "Speech Recognition", "Arabic"]
    },
    {
      title: "ALLaM",
      description: "نموذج لغوي كبير سعودي متقدم للفهم والمعالجة",
      link: "https://huggingface.co/ALLaM-AI/ALLaM-7B-Instruct-preview",
      icon: "🧠",
      tags: ["LLM", "Language Model", "Arabic"]
    },
    {
      title: "NAMAA-Saudi-TTS",
      description: "نموذج متخصص في توليد كلام طبيعي باللهجة السعودية",
      link: "https://huggingface.co/NAMAA-Space/NAMAA-Saudi-TTS",
      icon: "🔊",
      tags: ["TTS", "Text-to-Speech", "Saudi"]
    }
  ];

  const documentation = [
    {
      title: "دليل التكامل البرمجي",
      description: "شرح تفصيلي لكيفية دمج النماذج الثلاثة معاً",
      link: "#",
      icon: "📖"
    },
    {
      title: "أمثلة الأكواد",
      description: "نماذج برمجية جاهزة للاستخدام في Python و JavaScript",
      link: "#",
      icon: "💻"
    },
    {
      title: "الأسئلة الشائعة",
      description: "إجابات على الأسئلة الشائعة حول النظام",
      link: "#",
      icon: "❓"
    }
  ];

  return (
    <section className="w-full py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            الموارد والروابط
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            وصول سريع إلى جميع النماذج والوثائق والموارد التقنية
          </p>
        </div>

        {/* Models Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
            النماذج على Hugging Face
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0">
                <CardHeader>
                  <div className="text-4xl mb-4">{resource.icon}</div>
                  <CardTitle className="text-xl">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button 
                    asChild
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <a href={resource.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      زيارة النموذج
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Documentation Section */}
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-8" style={{ fontFamily: 'Poppins, sans-serif' }}>
            الوثائق والأمثلة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {documentation.map((doc, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                  <div className="text-4xl mb-4">{doc.icon}</div>
                  <CardTitle className="text-lg">{doc.title}</CardTitle>
                  <CardDescription>{doc.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline"
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    اقرأ المزيد
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            هل أنت مستعد للبدء؟
          </h3>
          <p className="text-lg mb-8 opacity-90">
            ابدأ باستخدام النماذج الآن وبناء تطبيقك الصوتي السعودي الخاص
          </p>
          <Button 
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg font-semibold"
          >
            <Github className="mr-2 h-5 w-5" />
            استكشف المشروع على GitHub
          </Button>
        </div>
      </div>
    </section>
  );
}
