import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComponentsSection() {
  const whisperImageUrl = "/assets/whisper.png";
  const allamImageUrl = "/assets/allam.png";
  const ttsImageUrl = "/assets/tts.png";

  const components = [
    {
      id: "whisper",
      title: "Whisper Saudi",
      subtitle: "تحويل الكلام إلى نص",
      description: "نموذج متخصص في التعرف على الكلام باللهجة السعودية. يحول الموجات الصوتية إلى نص مكتوب بدقة عالية.",
      image: whisperImageUrl,
      features: ["دقة عالية", "دعم اللهجة السعودية", "معالجة الضجيج"],
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: "allam",
      title: "ALLaM",
      subtitle: "معالجة اللغة الطبيعية",
      description: "نموذج لغوي كبير سعودي متقدم. يفهم السياق ويولد استجابات ذكية بناءً على فهم عميق للغة العربية والثقافة السعودية.",
      image: allamImageUrl,
      features: ["فهم السياق", "توليد نصوص", "دعم اللهجات"],
      color: "from-purple-500 to-pink-500"
    },
    {
      id: "tts",
      title: "NAMAA-Saudi-TTS",
      subtitle: "تحويل النص إلى كلام",
      description: "نموذج متخصص في توليد كلام طبيعي باللهجة السعودية. ينتج صوتاً واقعياً وطبيعياً يحاكي النطق السعودي الحقيقي.",
      image: ttsImageUrl,
      features: ["صوت طبيعي", "إيقاع سعودي", "استنساخ الصوت"],
      color: "from-green-500 to-emerald-500"
    }
  ];

  return (
    <section id="components" className="w-full py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            المكونات الثلاثة الرئيسية
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            نظام متكامل يجمع بين ثلاثة نماذج ذكاء اصطناعي متقدمة لتوفير تجربة صوتية سعودية فريدة
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {components.map((component) => (
            <Card key={component.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-0">
              <div className={`h-48 bg-gradient-to-br ${component.color} relative overflow-hidden`}>
                <img
                  src={component.image}
                  alt={component.title}
                  className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                />
              </div>
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <CardTitle className="text-2xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {component.title}
                    </CardTitle>
                    <CardDescription className="text-base mt-1">
                      {component.subtitle}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 leading-relaxed">
                  {component.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {component.features.map((feature) => (
                    <Badge key={feature} className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
