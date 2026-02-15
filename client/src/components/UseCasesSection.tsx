import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    HeadphonesIcon,
    GraduationCap,
    Languages,
    Stethoscope,
    Building2,
    ShoppingBag,
    ChevronLeft,
    ChevronRight,
    Sparkles,
} from "lucide-react";

// ============================================================================
// DATA
// ============================================================================

interface UseCase {
    id: string;
    icon: React.ReactNode;
    emoji: string;
    title: string;
    subtitle: string;
    description: string;
    features: string[];
    example: {
        input: string;
        output: string;
    };
    gradient: string;
    borderColor: string;
    badgeColor: string;
}

const USE_CASES: UseCase[] = [
    {
        id: "customer-service",
        icon: <HeadphonesIcon className="h-8 w-8" />,
        emoji: "🎧",
        title: "خدمة العملاء الذكية",
        subtitle: "تفاعل صوتي طبيعي مع العملاء",
        description:
            "مساعد صوتي يفهم اللهجة السعودية ويستجيب للعملاء بشكل طبيعي، مما يقلل أوقات الانتظار ويحسن تجربة العميل.",
        features: [
            "دعم فني متواصل 24/7",
            "فهم اللغة العامية والفصحى",
            "تحويل المكالمات تلقائياً",
            "تحليل رضا العملاء",
        ],
        example: {
            input: "وش وضع طلبي اللي طلبته أمس؟",
            output: "طلبك رقم #1234 في الطريق إليك وبيوصل بكرة إن شاء الله. هل تبي أرسل لك رابط التتبع؟",
        },
        gradient: "from-blue-500 to-cyan-500",
        borderColor: "border-blue-200",
        badgeColor: "bg-blue-100 text-blue-800",
    },
    {
        id: "education",
        icon: <GraduationCap className="h-8 w-8" />,
        emoji: "🎓",
        title: "التعليم التفاعلي",
        subtitle: "تجربة تعلم ممتعة بالصوت",
        description:
            "منصات تعليمية تتفاعل مع الطلاب صوتياً، مما يسهّل التعلم ويجعله أكثر متعة خاصة للأطفال وذوي الاحتياجات الخاصة.",
        features: [
            "اختبارات شفوية ذكية",
            "تصحيح نطق القرآن",
            "تعليم اللغة الإنجليزية",
            "مساعد دراسي شخصي",
        ],
        example: {
            input: "اشرح لي درس الكسور بطريقة سهلة",
            output: "تخيل عندك بيتزا وقسمتها نصين متساوين. كل نص يمثل ١/٢. لو قسمت كل نص لنصين، بيكون عندك ٤ قطع، وكل قطعة ١/٤.",
        },
        gradient: "from-purple-500 to-pink-500",
        borderColor: "border-purple-200",
        badgeColor: "bg-purple-100 text-purple-800",
    },
    {
        id: "translation",
        icon: <Languages className="h-8 w-8" />,
        emoji: "🌐",
        title: "الترجمة الفورية",
        subtitle: "كسر حواجز اللغة",
        description:
            "ترجمة فورية من وإلى اللهجة السعودية، مع القدرة على ترجمة المحادثات الحية والمكالمات في الوقت الفعلي.",
        features: [
            "ترجمة فورية للمحادثات",
            "دعم أكثر من 20 لغة",
            "فهم السياق والمعنى",
            "ترجمة المصطلحات المحلية",
        ],
        example: {
            input: "ترجم لي: 'يا ليت نتقابل عند الديرة'",
            output: "\"I wish we could meet downtown\" - يقصد بالديرة وسط المدينة أو المنطقة القديمة في الرياض.",
        },
        gradient: "from-green-500 to-emerald-500",
        borderColor: "border-green-200",
        badgeColor: "bg-green-100 text-green-800",
    },
    {
        id: "healthcare",
        icon: <Stethoscope className="h-8 w-8" />,
        emoji: "🏥",
        title: "الرعاية الصحية",
        subtitle: "خدمات صحية ذكية",
        description:
            "مساعد صوتي طبي يفهم الأعراض باللهجة المحلية ويقدم توجيهات أولية مع تسهيل حجز المواعيد والاستشارات.",
        features: [
            "وصف الأعراض صوتياً",
            "حجز مواعيد تلقائي",
            "تذكيرات الأدوية",
            "استشارات أولية",
        ],
        example: {
            input: "عندي صداع من أمس وحرارتي مرتفعة شوي",
            output: "أنصحك تشرب سوائل كثير وتاخذ خافض حرارة. لو الأعراض استمرت أكثر من يومين، أقدر أحجز لك موعد عند طبيب.",
        },
        gradient: "from-red-400 to-rose-500",
        borderColor: "border-red-200",
        badgeColor: "bg-red-100 text-red-800",
    },
    {
        id: "government",
        icon: <Building2 className="h-8 w-8" />,
        emoji: "🏛️",
        title: "الخدمات الحكومية",
        subtitle: "تبسيط الإجراءات الحكومية",
        description:
            "مساعد صوتي للمنصات الحكومية يسهّل على المواطنين الوصول للخدمات والاستفسار عن المعاملات بلغتهم المفضلة.",
        features: [
            "استعلام عن المعاملات",
            "حجز مواعيد إلكترونية",
            "شرح الأنظمة واللوائح",
            "إرشاد المتقاعدين",
        ],
        example: {
            input: "أبي أجدد جواز سفري، وش الإجراءات؟",
            output: "تقدر تجدد جوازك من أبشر. تحتاج صورة شخصية جديدة ورسوم 300 ريال. أقدر أفتح لك صفحة التجديد الحين.",
        },
        gradient: "from-amber-500 to-orange-500",
        borderColor: "border-amber-200",
        badgeColor: "bg-amber-100 text-amber-800",
    },
    {
        id: "ecommerce",
        icon: <ShoppingBag className="h-8 w-8" />,
        emoji: "🛍️",
        title: "التجارة الإلكترونية",
        subtitle: "تسوق بالصوت",
        description:
            "تسوق إلكتروني بالصوت يتيح للمستخدمين البحث عن المنتجات وإتمام الشراء بالأوامر الصوتية.",
        features: [
            "بحث صوتي عن المنتجات",
            "مقارنة الأسعار",
            "توصيات شخصية",
            "متابعة الطلبات",
        ],
        example: {
            input: "أبي أشتري أيفون جديد بأحسن سعر",
            output: "لقيت لك iPhone 15 Pro بأفضل سعر 3,999 ريال مع شحن مجاني. وفي عرض تقسيط بدون فوائد لمدة 12 شهر. تبي أضيف للسلة؟",
        },
        gradient: "from-indigo-500 to-violet-500",
        borderColor: "border-indigo-200",
        badgeColor: "bg-indigo-100 text-indigo-800",
    },
];

// ============================================================================
// COMPONENT
// ============================================================================

export default function UseCasesSection() {
    const [selectedUseCase, setSelectedUseCase] = useState<UseCase>(USE_CASES[0]);
    const [currentPage, setCurrentPage] = useState(0);
    const casesPerPage = 3;
    const totalPages = Math.ceil(USE_CASES.length / casesPerPage);
    const currentCases = USE_CASES.slice(
        currentPage * casesPerPage,
        (currentPage + 1) * casesPerPage
    );

    return (
        <section id="use-cases" className="w-full py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* العنوان */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
                        <Sparkles className="h-4 w-4" />
                        حالات استخدام حقيقية
                    </div>
                    <h2
                        className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
                        style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                        كيف يُستخدم النظام؟
                    </h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        اكتشف كيف يمكن لنظام المساعد الصوتي السعودي أن يحدث ثورة في مختلف
                        القطاعات
                    </p>
                </div>

                {/* شبكة الحالات */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {currentCases.map((useCase) => (
                        <Card
                            key={useCase.id}
                            className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${selectedUseCase.id === useCase.id
                                    ? `${useCase.borderColor} shadow-lg scale-[1.02]`
                                    : "border-transparent hover:border-gray-200"
                                }`}
                            onClick={() => setSelectedUseCase(useCase)}
                        >
                            <CardHeader className="pb-3">
                                <div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center text-white mb-3`}
                                >
                                    {useCase.icon}
                                </div>
                                <CardTitle className="text-lg">{useCase.title}</CardTitle>
                                <CardDescription className="text-sm">
                                    {useCase.subtitle}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                    {useCase.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {useCase.features.slice(0, 2).map((feature) => (
                                        <Badge key={feature} variant="outline" className="text-xs">
                                            {feature}
                                        </Badge>
                                    ))}
                                    {useCase.features.length > 2 && (
                                        <Badge variant="outline" className="text-xs text-gray-400">
                                            +{useCase.features.length - 2}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* أزرار التنقل */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-3 mb-10">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                            disabled={currentPage === 0}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <Button
                                key={i}
                                variant={currentPage === i ? "default" : "outline"}
                                size="icon"
                                onClick={() => setCurrentPage(i)}
                                className="w-8 h-8"
                            >
                                {i + 1}
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                            disabled={currentPage === totalPages - 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* بطاقة التفاصيل - المحادثة التوضيحية */}
                <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* الجانب الأيسر - معلومات */}
                        <div className="p-8 lg:p-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${selectedUseCase.gradient} flex items-center justify-center text-white`}
                                >
                                    {selectedUseCase.icon}
                                </div>
                                <div>
                                    <h3
                                        className="text-2xl font-bold text-gray-900"
                                        style={{ fontFamily: "Poppins, sans-serif" }}
                                    >
                                        {selectedUseCase.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm">
                                        {selectedUseCase.subtitle}
                                    </p>
                                </div>
                            </div>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {selectedUseCase.description}
                            </p>
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-800 text-sm">
                                    المميزات الرئيسية:
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedUseCase.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center gap-2 text-sm"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedUseCase.gradient}`}
                                            ></div>
                                            <span className="text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* الجانب الأيمن - محاكاة المحادثة */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-10 text-white">
                            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <span className="text-2xl">{selectedUseCase.emoji}</span>
                                محاكاة المحادثة
                            </h4>

                            <div className="space-y-4">
                                {/* رسالة المستخدم */}
                                <div className="flex justify-start">
                                    <div className="bg-blue-600/30 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] border border-blue-500/20">
                                        <p className="text-sm text-blue-100 mb-1 font-medium">
                                            👤 المستخدم:
                                        </p>
                                        <p className="text-white text-sm leading-relaxed">
                                            {selectedUseCase.example.input}
                                        </p>
                                    </div>
                                </div>

                                {/* سهم */}
                                <div className="flex justify-center">
                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                        <span className="text-sm">⬇️</span>
                                    </div>
                                </div>

                                {/* رسالة النظام */}
                                <div className="flex justify-end">
                                    <div className="bg-green-600/30 backdrop-blur-sm rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%] border border-green-500/20">
                                        <p className="text-sm text-green-100 mb-1 font-medium">
                                            🤖 المساعد:
                                        </p>
                                        <p className="text-white text-sm leading-relaxed">
                                            {selectedUseCase.example.output}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* فاصل */}
                            <div className="mt-6 pt-6 border-t border-white/10">
                                <div className="flex items-center gap-2 text-white/60 text-xs">
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                                        <div
                                            className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"
                                            style={{ animationDelay: "0.2s" }}
                                        ></div>
                                        <div
                                            className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"
                                            style={{ animationDelay: "0.4s" }}
                                        ></div>
                                    </div>
                                    <span>
                                        تعمل بواسطة Whisper Saudi + ALLaM + NAMAA-Saudi-TTS
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </section>
    );
}
