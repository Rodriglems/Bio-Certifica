const photos = import.meta.glob("../assets/opcoes/*.webp", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

// Só opções com uma imagem que representa bem a resposta. "Outro", valores em dinheiro e
// quantidades ficam sem foto de propósito.
const PHOTO_BY_OPTION: Record<string, string> = {
  "Plantio": "plantio",
  "Colheita": "colheita",
  "Preparo da terra": "preparo",
  "Capina": "capina",
  "Tratos culturais": "tratos",
  "Milho": "milho",
  "Feijão": "feijao",
  "Hortaliças": "hortalicas",
  "Mandioca": "mandioca",
  "Roça": "roca",
  "Horta": "horta",
  "Área irrigada": "irrigada",
  "Consumo da família": "consumo",
  "Venda": "venda",
  "Doação": "doacao",
  "Troca": "troca",
  "Armazenado": "armazenado",
  "Sol": "sol",
  "Nublado": "nublado",
  "Chuva": "chuva",
  "Misto": "misto",
  "Praga": "praga",
  "Doença": "doenca",
  "Falta de chuva": "seca",
  "Excesso de chuva": "excesso",
  "Só o agricultor": "agricultor",
  "Família": "familia",
  "Diarista": "diarista",
  "Família + diarista": "familia-diarista",
  "Quintal produtivo": "quintal",
  "Semente": "semente",
  "Adubo orgânico": "adubo",
  "Transporte": "transporte",
  "Energia": "energia",
  "Comércio local": "comercio",
  "Feira": "feira",
  "Vizinho": "vizinho",
  "Programa": "programa",
  "Comunidade": "comunidade",
  "Alimento": "alimento",
  "Insumo": "insumo",
  "Serviço": "servico",
  "Crioula": "crioula",
  "Comercial": "comercial",
  "Guardada da produção": "guardada",
  "Monocultivo": "monocultivo",
  "Rotação de culturas": "rotacao",
};

export function getOptionPhoto(label: string) {
  const slug = PHOTO_BY_OPTION[label];
  return slug ? photos[`../assets/opcoes/${slug}.webp`] : undefined;
}
