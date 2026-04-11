import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { BookOpen, Video, Users, Download, ArrowRight } from "lucide-react";

const resources = [
  {
    icon: BookOpen,
    title: "Guias e Manuais",
    description: "Material educativo completo sobre práticas agroecológicas",
    count: "50+ guias",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Video,
    title: "Vídeo Tutoriais",
    description: "Aprenda na prática com vídeos demonstrativos",
    count: "100+ vídeos",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Users,
    title: "Comunidade",
    description: "Conecte-se com outros agricultores agroecológicos",
    count: "500+ membros",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Download,
    title: "Ferramentas",
    description: "Calculadoras e planilhas para gestão agrícola",
    count: "20+ ferramentas",
    color: "bg-orange-100 text-orange-600",
  },
];

const tips = [
  {
    title: "Comece pequeno",
    description: "Inicie com uma área reduzida para experimentar as técnicas",
  },
  {
    title: "Observe a natureza",
    description: "A natureza é seu melhor guia para práticas sustentáveis",
  },
  {
    title: "Seja paciente",
    description: "Transições agroecológicas levam tempo, mas valem a pena",
  },
  {
    title: "Compartilhe conhecimento",
    description: "Troque experiências com outros agricultores",
  },
];

export function ResourcesSection() {
  return (
    <section id="recursos" className="bg-gray-50 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-green-900 mb-4">Recursos e Ferramentas</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Tudo que você precisa para começar sua jornada agroecológica
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {resources.map((resource) => {
            const Icon = resource.icon;
            return (
              <Card key={resource.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`p-3 ${resource.color} rounded-lg w-fit mb-3`}>
                    <Icon className="size-6" />
                  </div>
                  <CardTitle className="text-gray-900">{resource.title}</CardTitle>
                  <CardDescription>{resource.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-600">{resource.count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-white mb-4">Dicas para Iniciantes</h3>
                <div className="space-y-4">
                  {tips.map((tip, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="size-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="text-white mb-1">{tip.title}</h4>
                        <p className="text-green-100 text-sm">{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 space-y-4">
                <h4 className="text-white">Pronto para começar?</h4>
                <p className="text-green-100">
                  Baixe nosso guia completo para iniciantes e comece sua transformação agroecológica hoje.
                </p>
                <Button className="bg-white text-green-600 hover:bg-green-50 w-full">
                  Baixar Guia Grátis
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
