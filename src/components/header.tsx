import { Leaf, Menu } from "lucide-react";
import { Button } from "./ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";

export function Header() {
  const navItems = ["Início", "Práticas", "Recursos", "Sobre"];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Leaf className="size-8 text-green-600" />
          <span className="text-green-800">AgroEco</span>
        </div>

        {/* Navegação para desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-gray-700 hover:text-green-600 transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        <Button className="hidden md:flex bg-green-600 hover:bg-green-700">
          Começar
        </Button>

        {/* Navegação para mobile */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="size-6" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <nav className="flex flex-col gap-4 mt-8">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  className="text-gray-700 hover:text-green-600 transition-colors"
                >
                  {item}
                </a>
              ))}
              <Button className="bg-green-600 hover:bg-green-700 w-full">
                Começar
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
