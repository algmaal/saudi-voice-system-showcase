import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ComponentsSection() {
  const whisperImageUrl = "https://private-us-east-1.manuscdn.com/sessionFile/GFxqvHr2TLZr2VLJZ2n8uF/sandbox/TzH7rfx4jIQKSbhT3IVJWB-img-2_1771098914000_na1fn_d2hpc3Blci1jb21wb25lbnQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvR0Z4cXZIcjJUTFpyMlZMSloybjh1Ri9zYW5kYm94L1R6SDdyZng0aklRS1NiaFQzSVZKV0ItaW1nLTJfMTc3MTA5ODkxNDAwMF9uYTFmbl9kMmhwYzNCbGNpMWpiMjF3YjI1bGJuUS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=YPqnDb-lxiLlMaeHeUj8~7XtaZMLWue8IlHPAS82gDwhOgcGxFSqYb2iHRB7mnTqRVwuuoJXDyBZfrnYV5GOH6MGb~HryoPkpLdtlItcq1uWl1KJjynS8PV1m1W8QEME8X5hf9y6hHTGHNOgcntQp3soJqvgsqYtWVo5Mc5Lx0gM8ZSbNVj~~C0hDA7EKAVuudQlh5EY0jkhkqvMPJFW~KLXcsZiMAppik~n6G4y5F6wnqASlY8mcuvCnSmDuVV2OTwaWim~93ESLtEiyu8eBQqh0FazeDnSiEFAK~WRWD0xVfKes-kEQGPDe2ffjXmmIl6hOLqW0Qv7iAKGy8uyiA__";
  const allamImageUrl = "https://private-us-east-1.manuscdn.com/sessionFile/GFxqvHr2TLZr2VLJZ2n8uF/sandbox/TzH7rfx4jIQKSbhT3IVJWB-img-3_1771098920000_na1fn_YWxsYW0tY29tcG9uZW50.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvR0Z4cXZIcjJUTFpyMlZMSloybjh1Ri9zYW5kYm94L1R6SDdyZng0aklRS1NiaFQzSVZKV0ItaW1nLTNfMTc3MTA5ODkyMDAwMF9uYTFmbl9ZV3hzWVcwdFkyOXRjRzl1Wlc1MC5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=I-eTNUnmak5zuageNRmrXNsODGLbMWUVISlfwFtB0Fkg2JcL3xvHGCVmkfUeKlkG1pfIGF1xVYGXTS9mXVAUuvKSLp2VnpGkzBsVyJjMpgjEXVSl9mxxfNTY7ERG4hZqqF~9xYqS05U1lIrmQSdWx4AcIqBFW7cypjihg9h1AVEfBig3PG0h-RjnDDEIQEjr6fHK~kE9TdrTsvtjMFssyJwUfjdwNBROiZ1Nn3KhUpFQFihFMjwCwHs-Zlft5dnQOYP-X-5~GpWu1ikaRd1oAtRJmwAyUUU3nnhlVMUjxLBrbhRGKlH8khXlx46fG9D4dgnxXWePzjT1Nlur7YpJMQ__";
  const ttsImageUrl = "https://private-us-east-1.manuscdn.com/sessionFile/GFxqvHr2TLZr2VLJZ2n8uF/sandbox/TzH7rfx4jIQKSbhT3IVJWB-img-4_1771098913000_na1fn_dHRzLWNvbXBvbmVudA.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvR0Z4cXZIcjJUTFpyMlZMSloybjh1Ri9zYW5kYm94L1R6SDdyZng0aklRS1NiaFQzSVZKV0ItaW1nLTRfMTc3MTA5ODkxMzAwMF9uYTFmbl9kSFJ6TFdOdmJYQnZibVZ1ZEEucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=IGnxTdjXRwTtxfUButphTKDAIkBe34xfwS5cJnzGy8h6FKm-CftPCYJbAPthWL2Lbe-F4y2h1-THYKN2kiPnO6N4EUunz8cc6euBbOk~xuZtAnMKWIkM4Wi7jCz9DsAKeSWjQeiSMb~OPjHTkTLjv2hgXgaBB-RpwryglkFXvMRVOuor3awVlZ~JEX9t6u2m78OsYRwCN8-PggYppoiSuWAEi7X5K9SGsmoV415ZYyPhatpf0nzzfC1j2VjosmeZS6zllFx723pO4ZxjT7yxyRLwLB92I2dNeEBqHeuO7Tz45D60hVMtH3D8NFpsN4nlvicEA1GA1k~HiNFLa8YCbA__";

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
