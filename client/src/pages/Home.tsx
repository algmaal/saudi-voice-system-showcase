import { useAuth } from "@/_core/hooks/useAuth";
import HeroSection from "@/components/HeroSection";
import ComponentsSection from "@/components/ComponentsSection";
import PipelineSection from "@/components/PipelineSection";
import UseCasesSection from "@/components/UseCasesSection";
import ResourcesSection from "@/components/ResourcesSection";
import VoiceTestSection from "@/components/VoiceTestSection";

export default function Home() {
  // The userAuth hooks provides authentication state
  // To implement login/logout functionality, simply call logout() or redirect to getLoginUrl()
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeroSection />
      <ComponentsSection />
      <PipelineSection />
      <UseCasesSection />
      <VoiceTestSection />

      {/* Call Center Banner */}
      <section className="w-full py-16 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <span className="inline-block px-4 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-full text-sm font-medium mb-4 border border-emerald-500/30">
              📞 جديد!
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              جرب الكول سنتر الذكي
            </h2>
            <p className="text-blue-200/70 text-lg mb-8">
              محادثة صوتية تفاعلية باللهجة السعودية لجمع بيانات العميل - مدعومة بالذكاء الاصطناعي
            </p>
            <a
              href="/call-center"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              📞 ابدأ المكالمة الآن
            </a>
          </div>
        </div>
      </section>

      <ResourcesSection />

      {/* Footer */}
      <footer className="w-full bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                نظام المساعد الصوتي السعودي
              </h4>
              <p className="text-gray-400">
                نظام متكامل يجمع بين أفضل نماذج الذكاء الاصطناعي الصوتية مفتوحة المصدر
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                الروابط السريعة
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#components" className="hover:text-white transition">المكونات</a></li>
                <li><a href="#pipeline" className="hover:text-white transition">دورة العمل</a></li>
                <li><a href="#use-cases" className="hover:text-white transition">حالات الاستخدام</a></li>
                <li><a href="#test" className="hover:text-white transition">اختبر الآن</a></li>
                <li><a href="#resources" className="hover:text-white transition">الموارد</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                المطورون
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://huggingface.co/NAMAA-Space" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">NAMAA Community</a></li>
                <li><a href="https://huggingface.co/humain-ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">HUMAIN</a></li>
                <li><a href="https://sdaia.gov.sa" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">SDAIA</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>© 2026 نظام المساعد الصوتي السعودي المتكامل. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
