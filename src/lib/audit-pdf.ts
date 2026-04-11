import { jsPDF } from "jspdf";
import type { AppData, DailyRecord } from "../App";

const formatShortDateTime = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
};

const safe = (value: unknown) => (typeof value === "string" ? value : value ? String(value) : "-");

const addLine = (doc: jsPDF, text: string, x: number, y: number, maxWidth: number) => {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * 14;
};

const ensurePage = (doc: jsPDF, y: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y < pageHeight - 60) return y;
  doc.addPage();
  return 40;
};

const recordToLines = (record: DailyRecord) => {
  const lines: string[] = [];
  lines.push(`Data: ${formatShortDateTime(record.date)}`);
  lines.push(`Tipo de atividade: ${safe(record.activityType)}`);

  if (record.production) {
    lines.push(
      `Produção: ${safe(record.production.product)} — ${safe(record.production.quantity)} ${safe(record.production.unit)}`
    );
  }

  lines.push(`Local: ${safe(record.location)}`);
  lines.push(`Destino: ${safe(record.destination)}`);

  if (record.destinationDetails) {
    const d = record.destinationDetails;
    if (d.saleValue) lines.push(`Valor de venda: ${safe(d.saleValue)}`);
    if (d.buyer) lines.push(`Comprador: ${safe(d.buyer)}`);
    if (d.exchangeItem) lines.push(`Troca por: ${safe(d.exchangeItem)}`);
    if (d.donationRecipient) lines.push(`Doação para: ${safe(d.donationRecipient)}`);
  }

  if (record.costs) {
    lines.push(`Teve despesa: ${record.costs.hasExpense ? "Sim" : "Não"}`);
    if (record.costs.type) lines.push(`Tipo de despesa: ${safe(record.costs.type)}`);
    if (record.costs.value) lines.push(`Valor: ${safe(record.costs.value)}`);
    if (record.costs.purchaseLocation) lines.push(`Local de compra: ${safe(record.costs.purchaseLocation)}`);
  }

  if (record.labor) {
    lines.push(`Mão de obra: ${safe(record.labor.type)} — Pessoas: ${safe(record.labor.peopleCount)}`);
    lines.push(`Houve pagamento: ${record.labor.hadPayment ? "Sim" : "Não"}`);
    if (record.labor.paymentValue) lines.push(`Valor pago: ${safe(record.labor.paymentValue)}`);
  }

  if (record.fieldConditions) {
    lines.push(`Clima: ${safe(record.fieldConditions.weather)}`);
    lines.push(`Ocorrências: ${safe(record.fieldConditions.occurrences)}`);
    if (record.fieldConditions.occurrenceDetails) {
      lines.push(`Detalhes: ${safe(record.fieldConditions.occurrenceDetails)}`);
    }
    if (record.fieldConditions.pestOrDiseaseFound) {
      lines.push(`Praga/Doença encontrada: ${safe(record.fieldConditions.pestOrDiseaseFound)}`);
    }
    if (record.fieldConditions.appliedProduct) {
      lines.push(`Produto aplicado: ${safe(record.fieldConditions.appliedProduct)}`);
    }
    if (record.fieldConditions.homemadeProductPreparation) {
      lines.push(`Preparo do produto: ${safe(record.fieldConditions.homemadeProductPreparation)}`);
    }
  }

  if (record.observations) lines.push(`Observações: ${safe(record.observations)}`);

  return lines;
};

export function downloadAuditPdf(appData: AppData) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const width = doc.internal.pageSize.getWidth() - left * 2;
  let y = 44;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Relatório de Manejo (Auditoria)", left, y);
  y += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = addLine(doc, `Gerado em: ${formatShortDateTime(new Date().toISOString())}`, left, y, width);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Produtor", left, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (appData.farmer) {
    y = addLine(doc, `Nome: ${safe(appData.farmer.name)}`, left, y, width);
    y = addLine(doc, `Comunidade/Propriedade: ${safe(appData.farmer.community)}`, left, y, width);
    y = addLine(doc, `Município: ${safe(appData.farmer.municipality)}`, left, y, width);
    if (appData.farmer.phone) y = addLine(doc, `Telefone: ${safe(appData.farmer.phone)}`, left, y, width);
    if (appData.farmer.propertySize) y = addLine(doc, `Tamanho da propriedade: ${safe(appData.farmer.propertySize)}`, left, y, width);
    if (appData.farmer.produces) y = addLine(doc, `Produção: ${safe(appData.farmer.produces)}`, left, y, width);
    if (appData.farmer.accessDirections) {
      y = addLine(doc, `Como chegar na propriedade: ${safe(appData.farmer.accessDirections)}`, left, y, width);
    }
  } else {
    y = addLine(doc, "Sem cadastro de produtor.", left, y, width);
  }

  y += 10;
  y = ensurePage(doc, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Safra / Ano", left, y);
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (appData.harvest) {
    y = addLine(doc, `Cultura principal: ${safe(appData.harvest.mainCrop)}`, left, y, width);
    y = addLine(doc, `Tipo de semente: ${safe(appData.harvest.seedType)}`, left, y, width);
    y = addLine(doc, `Sistema de cultivo: ${safe(appData.harvest.cultivationSystem)}`, left, y, width);
    y = addLine(doc, `Área plantada: ${safe(appData.harvest.plantedArea)}`, left, y, width);
  } else {
    y = addLine(doc, "Sem cadastro de safra.", left, y, width);
  }

  const currentYear = new Date().getFullYear();
  const annual = appData.annual?.[String(currentYear)];
  if (annual) {
    y += 6;
    y = addLine(doc, `Atualização anual (${currentYear}): ${annual.hadChanges ? "Houve mudanças" : "Sem mudanças"}`, left, y, width);
    if (annual.changesDetails) y = addLine(doc, `Detalhes: ${annual.changesDetails}`, left, y, width);
  }

  y += 14;
  y = ensurePage(doc, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Registros Diários", left, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if (!appData.records?.length) {
    y = addLine(doc, "Nenhum registro diário encontrado.", left, y, width);
  } else {
    for (const record of appData.records) {
      y = ensurePage(doc, y);
      doc.setDrawColor(220);
      doc.line(left, y, left + width, y);
      y += 10;

      const lines = recordToLines(record);
      for (const line of lines) {
        y = ensurePage(doc, y);
        y = addLine(doc, line, left, y, width);
      }
      y += 8;
    }
  }

  const fileDate = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  })
    .format(new Date())
    .replaceAll("/", "-");

  doc.save(`relatorio-agroecologia-${fileDate}.pdf`);
}
