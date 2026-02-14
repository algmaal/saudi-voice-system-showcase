import HeroSection from "@/components/HeroSection";
import ComponentsSection from "@/components/ComponentsSection";
import PipelineSection from "@/components/PipelineSection";
import ResourcesSection from "@/components/ResourcesSection";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <HeroSection />
      <ComponentsSection />
      <PipelineSection />
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
