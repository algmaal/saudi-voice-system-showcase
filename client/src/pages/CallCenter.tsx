import CallCenterSection from "@/components/CallCenterSection";

export default function CallCenter() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-950">
            {/* Navigation Bar */}
            <nav className="w-full bg-slate-900/80 backdrop-blur-sm border-b border-white/10 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📞</span>
                    </div>
                    <h1 className="text-white font-bold text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        كول سنتر سعودي
                    </h1>
                </div>
                <a
                    href="/"
                    className="text-blue-300 hover:text-white text-sm transition-colors flex items-center gap-1"
                >
                    ← الرجوع للصفحة الرئيسية
                </a>
            </nav>

            {/* Main Content */}
            <CallCenterSection />
        </div>
    );
}
