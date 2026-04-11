import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer id="sobre" className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="size-8 text-green-500" />
              <span className="text-white">AgroEco</span>
            </div>
            <p className="text-sm">
              Transformando a agricultura através de práticas sustentáveis e respeito à natureza.
            </p>
          </div>

          <div>
            <h4 className="text-white mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#início" className="hover:text-green-500 transition-colors">Início</a></li>
              <li><a href="#práticas" className="hover:text-green-500 transition-colors">Práticas</a></li>
              <li><a href="#recursos" className="hover:text-green-500 transition-colors">Recursos</a></li>
              <li><a href="#sobre" className="hover:text-green-500 transition-colors">Sobre</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-4">Recursos</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-green-500 transition-colors">Guias</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Vídeos</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Comunidade</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Blog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-4">Contato</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-green-500" />
                <span>contato@agroeco.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="size-4 text-green-500" />
                <span>(11) 1234-5678</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-green-500" />
                <span>Brasil</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>&copy; 2025 AgroEco. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
