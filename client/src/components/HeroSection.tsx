import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  const heroImageUrl = "/assets/hero.png";

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
                نظام المساعد الصوتي السعودي المتكامل
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                دمج ثلاثة نماذج ذكاء اصطناعي متقدمة لبناء مساعد صوتي يفهم ويتحدث باللهجة السعودية بطلاقة وطبيعية.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                onClick={() => document.getElementById('components')?.scrollIntoView({ behavior: 'smooth' })}
              >
                اكتشف المكونات
                <ArrowRight className="mr-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
                onClick={() => document.getElementById('pipeline')?.scrollIntoView({ behavior: 'smooth' })}
              >
                شاهد دورة العمل
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'Poppins, sans-serif' }}>3</div>
                <p className="text-sm text-gray-600 mt-2">نماذج متقدمة</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600" style={{ fontFamily: 'Poppins, sans-serif' }}>100%</div>
                <p className="text-sm text-gray-600 mt-2">مفتوح المصدر</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Poppins, sans-serif' }}>سعودي</div>
                <p className="text-sm text-gray-600 mt-2">محسّن للهجة</p>
              </div>
            </div>
          </div>

          {/* Right image */}
          <div className="relative h-96 lg:h-full min-h-96 flex items-center justify-center">
            <img
              src={heroImageUrl}
              alt="Saudi Voice System"
              className="w-full h-full object-cover rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
