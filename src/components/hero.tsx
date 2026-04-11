import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";
import { ArrowRight, Sprout } from "lucide-react";

export function Hero() {
  return (
    <section id="início" className="container mx-auto px-4 py-16 md:py-24">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
            <Sprout className="size-4" />
            <span className="text-sm">Agricultura Sustentável</span>
          </div>
          
          <h1 className="text-green-900">
            Transforme sua forma de cultivar com Agroecologia
          </h1>
          
          <p className="text-gray-600 text-lg">
            Descubra práticas sustentáveis que respeitam a natureza, aumentam a 
            produtividade e garantem um futuro mais saudável para todos.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="bg-green-600 hover:bg-green-700" size="lg">
              Explorar Práticas
              <ArrowRight className="ml-2 size-4" />
            </Button>
            <Button variant="outline" size="lg">
              Saiba Mais
            </Button>
          </div>

          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-green-600">500+</div>
              <p className="text-sm text-gray-600">Agricultores</p>
            </div>
            <div>
              <div className="text-green-600">50+</div>
              <p className="text-sm text-gray-600">Práticas</p>
            </div>
            <div>
              <div className="text-green-600">100%</div>
              <p className="text-sm text-gray-600">Sustentável</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-green-600/10 rounded-3xl transform rotate-3"></div>
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1759750561166-5d049c2984d2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGZhcm1pbmclMjBvcmdhbmljJTIwYWdyaWN1bHR1cmV8ZW58MXx8fHwxNzY0MTYxNzY5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Agricultura sustentável"
            className="relative rounded-3xl shadow-2xl w-full h-[500px] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
