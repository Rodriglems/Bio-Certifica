import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Recycle, Droplets, Leaf, Bug, Sun, Wind } from "lucide-react";

const practices = [
  {
    id: "compostagem",
    icon: Recycle,
    title: "Compostagem",
    description: "Transforme resíduos orgânicos em adubo nutritivo",
    content: "A compostagem é o processo de decomposição de matéria orgânica que resulta em um adubo rico em nutrientes. Reduz resíduos, melhora a estrutura do solo e aumenta a retenção de água.",
    image: "https://images.unsplash.com/photo-1601408648796-349272138e57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wb3N0aW5nJTIwc29pbCUyMGhhbmRzfGVufDF8fHx8MTc2NDE2MTc2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    benefits: ["Reduz resíduos", "Enriquece o solo", "Economiza dinheiro"],
  },
  {
    id: "rotacao",
    icon: Sun,
    title: "Rotação de Culturas",
    description: "Alterne cultivos para manter o solo saudável",
    content: "A rotação de culturas previne o esgotamento do solo, quebra ciclos de pragas e doenças, e melhora a biodiversidade. Plantas diferentes têm necessidades nutricionais variadas.",
    image: "https://images.unsplash.com/photo-1741665604513-392643cd42fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9wJTIwcm90YXRpb24lMjBmaWVsZHxlbnwxfHx8fDE3NjQxNjE3Njl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    benefits: ["Previne pragas", "Melhora nutrientes", "Aumenta produção"],
  },
  {
    id: "permacultura",
    icon: Leaf,
    title: "Permacultura",
    description: "Crie sistemas agrícolas autossustentáveis",
    content: "A permacultura integra plantas, animais e estruturas para criar sistemas produtivos e sustentáveis que imitam padrões da natureza.",
    image: "https://images.unsplash.com/photo-1659817671412-1ed518dc2dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWdldGFibGUlMjBnYXJkZW4lMjBwZXJtYWN1bHR1cmV8ZW58MXx8fHwxNzY0MTYxNzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    benefits: ["Autossustentável", "Biodiversidade", "Baixa manutenção"],
  },
  {
    id: "controle",
    icon: Bug,
    title: "Controle Biológico",
    description: "Use predadores naturais contra pragas",
    content: "O controle biológico utiliza organismos vivos para controlar pragas agrícolas, reduzindo a necessidade de pesticidas químicos.",
    image: "https://images.unsplash.com/photo-1759750561166-5d049c2984d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBvcmdhbmljJTIwYWdyaWN1bHR1cmV8ZW58MXx8fHwxNzY0MTYxNzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    benefits: ["Sem químicos", "Natural", "Econômico"],
  },
  {
    id: "agua",
    icon: Droplets,
    title: "Gestão de Água",
    description: "Otimize o uso e conservação da água",
    content: "Técnicas como irrigação por gotejamento, captação de água da chuva e mulching ajudam a conservar este recurso precioso.",
    image: "https://images.unsplash.com/photo-1601408648796-349272138e57?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21wb3N0aW5nJTIwc29pbCUyMGhhbmRzfGVufDF8fHx8MTc2NDE2MTc2OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    benefits: ["Economia", "Sustentável", "Eficiente"],
  },
  {
    id: "agrofloresta",
    icon: Wind,
    title: "Agrofloresta",
    description: "Integre árvores com cultivos agrícolas",
    content: "Sistemas agroflorestais combinam árvores com culturas e/ou pecuária, criando ecossistemas produtivos e resilientes.",
    image: "https://images.unsplash.com/photo-1659817671412-1ed518dc2dc6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZWdldGFibGUlMjBnYXJkZW4lMjBwZXJtYWN1bHR1cmV8ZW58MXx8fHwxNzY0MTYxNzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    benefits: ["Diversidade", "Carbono zero", "Microclima"],
  },
];

export function PracticesSection() {
  return (
    <section id="práticas" className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-green-900 mb-4">Práticas Agroecológicas</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Explore técnicas sustentáveis que transformarão sua forma de cultivar
        </p>
      </div>

      <Tabs defaultValue="compostagem" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 w-full mb-8">
          {practices.map((practice) => {
            const Icon = practice.icon;
            return (
              <TabsTrigger key={practice.id} value={practice.id} className="flex items-center gap-2">
                <Icon className="size-4" />
                <span className="hidden sm:inline">{practice.title}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {practices.map((practice) => {
          const Icon = practice.icon;
          return (
            <TabsContent key={practice.id} value={practice.id}>
              <Card className="overflow-hidden">
                <div className="grid md:grid-cols-2 gap-6">
                  <ImageWithFallback
                    src={practice.image}
                    alt={practice.title}
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="p-6">
                    <CardHeader className="p-0 mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Icon className="size-6 text-green-600" />
                        </div>
                        <CardTitle className="text-green-900">{practice.title}</CardTitle>
                      </div>
                      <CardDescription>{practice.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <p className="text-gray-700">{practice.content}</p>
                      <div>
                        <h4 className="text-green-800 mb-3">Benefícios:</h4>
                        <ul className="space-y-2">
                          {practice.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="size-2 bg-green-600 rounded-full" />
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
}
