import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

export default function PipelineSection() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const pipelineImageUrl = "/assets/pipeline.png";

  const steps = [
    {
      number: 1,
      title: "الاستماع",
      description: "يقول المستخدم: 'كيف حالك اليوم؟'",
      color: "from-blue-500 to-blue-600"
    },
    {
      number: 2,
      title: "التحويل إلى نص",
      description: "Whisper Saudi يحول الكلام إلى: 'كيف حالك اليوم؟'",
      color: "from-purple-500 to-purple-600"
    },
    {
      number: 3,
      title: "المعالجة",
      description: "ALLaM يفهم السؤال ويولد: 'أنا بخير، شكراً لسؤالك'",
      color: "from-orange-500 to-orange-600"
    },
    {
      number: 4,
      title: "توليد الصوت",
      description: "NAMAA-Saudi-TTS يحول النص إلى كلام طبيعي",
      color: "from-green-500 to-green-600"
    },
    {
      number: 5,
      title: "الاستجابة",
      description: "التطبيق يستجيب صوتياً للمستخدم",
      color: "from-teal-500 to-teal-600"
    }
  ];

  const handlePlayAnimation = () => {
    setIsAnimating(!isAnimating);
    if (!isAnimating) {
      setCurrentStep(0);
      let step = 0;
      const interval = setInterval(() => {
        step++;
        if (step >= steps.length) {
          clearInterval(interval);
          setIsAnimating(false);
        } else {
          setCurrentStep(step);
        }
      }, 1500);
    }
  };

  return (
    <section id="pipeline" className="w-full py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
            دورة العمل التفاعلية
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            شاهد كيف يتم معالجة الكلام من البداية إلى النهاية
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <img
              src={pipelineImageUrl}
              alt="Pipeline Diagram"
              className="w-full max-w-md h-auto"
            />
          </div>

          <div className="space-y-6">
            {steps.map((step, index) => {
              const isActive = index <= currentStep;
              const bgClass = isActive
                ? `bg-gradient-to-r ${step.color} text-white shadow-lg scale-105`
                : 'bg-white text-gray-900 border-2 border-gray-200';
              const numberBgClass = isActive
                ? 'bg-white text-blue-600'
                : 'bg-gray-200 text-gray-600';

              return (
                <div
                  key={step.number}
                  className={`p-6 rounded-xl transition-all duration-500 transform ${bgClass}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${numberBgClass}`}>
                      {step.number}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {step.title}
                      </h3>
                      <p className="text-sm opacity-90">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="pt-6 flex justify-center">
              <Button
                onClick={handlePlayAnimation}
                size="lg"
                className={`px-8 py-6 text-lg font-semibold text-white ${isAnimating
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                  }`}
              >
                {isAnimating ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    إيقاف المحاكاة
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    تشغيل المحاكاة
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
