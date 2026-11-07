import { Capacitor } from "@capacitor/core";
import type { AppData, DailyRecord } from "../App";
import type { AuditData } from "./api";
import { DESTINATION_NOT_APPLICABLE, isHarvestActivity, parseQuantity, recordCode } from "./record-format";

// No app instalado a WebView ignora downloads de blob: o PDF é salvo e aberto no menu de compartilhar.
async function shareNativePdf(blob: Blob, fileName: string) {
  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import("@capacitor/filesystem"),
    import("@capacitor/share"),
  ]);

  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error ?? new Error("Falha ao ler o PDF"));
    reader.readAsDataURL(blob);
  });

  const { uri } = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });

  try {
    await Share.share({ title: "Caderno de campo Bio Certifica", url: uri, dialogTitle: "Salvar ou enviar o caderno de campo" });
  } catch (error) {
    // Fechar o menu sem escolher um aplicativo não é erro.
    if (!/cancel/i.test(error instanceof Error ? error.message : String(error))) throw error;
  }
}

const INK = "#1f2937";
const MUTED = "#4b5563";
const RULE = "#9ca3af";
const LIGHT_RULE = "#d1d5db";
const HEAD_BG = "#e5e7eb";
const GREEN = "#14532d";

const dateFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
const dateTimeFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const formatDate = (iso: string) => dateFormat.format(new Date(iso));
const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso));
const formatNumber = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);

const DESTINATIONS = ["Consumo da família", "Venda", "Doação", "Troca", "Armazenado"];

interface HarvestTotal {
  product: string;
  unit: string;
  harvested: number;
  byDestination: Record<string, number>;
  entries: number;
}

function buildTotals(records: DailyRecord[]) {
  const totals = new Map<string, HarvestTotal>();
  let unreadable = 0;

  for (const record of records) {
    if (!isHarvestActivity(record.activityType) || !record.production) continue;
    const quantity = parseQuantity(record.production.quantity);
    if (quantity === null) {
      unreadable++;
      continue;
    }
    const product = record.production.product || "-";
    const unit = record.production.unit || "-";
    const key = `${product}|${unit}`.toLowerCase();
    const total = totals.get(key) ?? { product, unit, harvested: 0, byDestination: {}, entries: 0 };
    total.harvested += quantity;
    total.entries++;
    total.byDestination[record.destination] = (total.byDestination[record.destination] ?? 0) + quantity;
    totals.set(key, total);
  }

  return { rows: [...totals.values()].sort((a, b) => a.product.localeCompare(b.product)), unreadable };
}

function splitGps(directions: string | undefined) {
  const text = directions ?? "";
  const match = text.match(/GPS da propriedade: Latitude (-?[\d.]+), Longitude (-?[\d.]+)/);
  if (!match) return { coordinates: null, directions: text.trim() };
  return {
    coordinates: `Latitude ${match[1]}, Longitude ${match[2]}`,
    directions: text.replace(match[0], "").trim(),
  };
}

function describeProduction(record: DailyRecord) {
  const lines: string[] = [];
  const production = record.production;
  if (production?.product) {
    const amount = [production.quantity, production.unit].filter(Boolean).join(" ");
    lines.push(amount ? `${production.product}: ${amount}` : `Cultura: ${production.product}`);
  }
  if (record.destination && record.destination !== DESTINATION_NOT_APPLICABLE) {
    lines.push(`Destino: ${record.destination}`);
  }
  const details = record.destinationDetails;
  if (details?.saleValue) lines.push(`Valor de venda: ${details.saleValue}`);
  if (details?.buyer) lines.push(`Comprador: ${details.buyer}`);
  if (details?.exchangeItem) lines.push(`Troca por: ${details.exchangeItem}`);
  if (details?.donationRecipient) lines.push(`Doação para: ${details.donationRecipient}`);
  return lines;
}

function describeCosts(record: DailyRecord) {
  const costs = record.costs;
  if (!costs) return ["Não informado"];
  if (!costs.hasExpense) return ["Sem gasto"];
  const lines = [costs.type || "Gasto"];
  if (costs.value) lines.push(`Valor: ${costs.value}`);
  if (costs.purchaseLocation) lines.push(`Comprado em: ${costs.purchaseLocation}`);
  return lines;
}

function describeLabor(record: DailyRecord) {
  const labor = record.labor;
  const lines = [labor?.type || "-", `Pessoas: ${labor?.peopleCount || "-"}`];
  lines.push(labor?.hadPayment ? `Pago: ${labor.paymentValue || "Sim"}` : "Sem pagamento");
  return lines;
}

function describeField(record: DailyRecord) {
  const field = record.fieldConditions;
  const lines = [`Clima: ${field?.weather || "-"}`, `Ocorrências: ${field?.occurrences || "-"}`];
  if (field?.pestOrDiseaseFound) lines.push(`Praga ou doença: ${field.pestOrDiseaseFound}`);
  if (field?.appliedProduct) lines.push(`Produto aplicado: ${field.appliedProduct}`);
  if (field?.appliedDose) lines.push(`Quantidade e área: ${field.appliedDose}`);
  if (field?.homemadeProductPreparation) lines.push(`Preparo: ${field.homemadeProductPreparation}`);
  return lines;
}

async function generateAuditPdf(appData: AppData, audit: AuditData | null) {
  const { Document, Font, Page, StyleSheet, Text, View, pdf } = await import("@react-pdf/renderer");

  // Sem hifenização: palavras cortadas em colunas estreitas atrapalham a leitura e a busca no PDF.
  Font.registerHyphenationCallback((word) => [word]);

  const styles = StyleSheet.create({
    page: {
      paddingTop: 58,
      paddingHorizontal: 30,
      paddingBottom: 34,
      fontSize: 9,
      color: INK,
      fontFamily: "Helvetica",
      lineHeight: 1.3,
    },
    recordsPage: { paddingTop: 76 },
    running: {
      position: "absolute",
      top: 22,
      left: 30,
      right: 30,
    },
    runningRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      borderBottom: `1.5 solid ${GREEN}`,
      paddingBottom: 5,
    },
    runningTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GREEN },
    runningMeta: { fontSize: 8.5, color: MUTED },
    footer: {
      position: "absolute",
      bottom: 16,
      left: 30,
      right: 30,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: MUTED,
    },
    title: { fontSize: 18, lineHeight: 1.2, fontFamily: "Helvetica-Bold", color: GREEN, marginBottom: 6 },
    subtitle: { fontSize: 10, color: MUTED, marginBottom: 12 },
    columns: { flexDirection: "row", gap: 22 },
    column: { flex: 1 },
    section: { marginBottom: 12 },
    heading: { fontSize: 11, fontFamily: "Helvetica-Bold", color: GREEN, marginBottom: 5 },
    fieldRow: { flexDirection: "row", marginBottom: 2 },
    fieldLabel: { width: 96, color: MUTED },
    fieldValue: { flex: 1 },
    note: { fontSize: 8.5, color: MUTED, marginTop: 4 },
    warning: { fontSize: 9, fontFamily: "Helvetica-Bold", marginBottom: 8 },
    tableHead: {
      flexDirection: "row",
      backgroundColor: HEAD_BG,
      borderTop: `1 solid ${RULE}`,
      borderBottom: `1 solid ${RULE}`,
    },
    tableRow: { flexDirection: "row", borderBottom: `0.5 solid ${LIGHT_RULE}` },
    headCell: { fontFamily: "Helvetica-Bold", fontSize: 8.5, paddingVertical: 3, paddingHorizontal: 4 },
    cell: { paddingVertical: 3, paddingHorizontal: 4 },
    numberCell: { textAlign: "right" },
    code: { fontFamily: "Helvetica-Bold" },
    small: { fontSize: 7.5, color: MUTED },
    pendingMark: { fontSize: 7.5, fontFamily: "Helvetica-Bold" },
    observation: {
      paddingHorizontal: 4,
      paddingBottom: 4,
      marginTop: -1,
    },
    declaration: { marginBottom: 26, fontSize: 10, lineHeight: 1.45 },
    signatures: { flexDirection: "row", gap: 28, marginTop: 8 },
    signature: { flex: 1, borderTop: `1 solid ${INK}`, paddingTop: 4, fontSize: 9 },
  });

  const farmer = appData.farmer;
  const generatedAt = new Date().toISOString();
  const records = [...appData.records].sort((a, b) => a.date.localeCompare(b.date));
  const pendingCount = records.filter((record) => record.syncStatus === "pending").length;
  const { rows: totals, unreadable } = buildTotals(records);
  const { coordinates, directions } = splitGps(farmer?.accessDirections);
  const annualAnswers = Object.values(appData.annual ?? {}).sort((a, b) => a.year - b.year);
  const harvests = audit?.harvests.length
    ? audit.harvests
    : appData.harvest
      ? [{ ...appData.harvest, createdAt: null as string | null }]
      : [];
  const period = records.length
    ? `${formatDate(records[0].date)} a ${formatDate(records[records.length - 1].date)}`
    : "Sem registros";

  const Field = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    ) : null;

  const Running = () => (
    <View style={styles.running} fixed>
      <View style={styles.runningRow}>
        <Text style={styles.runningTitle}>Caderno de campo</Text>
        <Text style={styles.runningMeta}>
          {farmer?.name ?? "Produtor não informado"}, {farmer?.municipality ?? "-"}. Período: {period}
        </Text>
      </View>
    </View>
  );

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text>Bio Certifica. Gerado em {formatDateTime(generatedAt)}</Text>
      <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
    </View>
  );

  const RECORD_COLUMNS = [
    { label: "Código", width: "11%" },
    { label: "Data", width: "10%" },
    { label: "Atividade", width: "9%" },
    { label: "Local", width: "8%" },
    { label: "Produção e destino", width: "18%" },
    { label: "Gastos e insumos", width: "14%" },
    { label: "Mão de obra", width: "11%" },
    { label: "Clima e ocorrências", width: "19%" },
  ];

  const lines = (values: string[]) => values.map((line, index) => <Text key={index}>{line}</Text>);

  const RecordRow = ({ record }: { record: DailyRecord }) => (
    <View style={styles.tableRow} wrap={false}>
      <View style={{ width: "100%" }}>
        <View style={{ flexDirection: "row" }}>
          <View style={[styles.cell, { width: "11%" }]}>
            <Text style={styles.code}>{recordCode(record.id)}</Text>
            {record.syncStatus === "pending" && <Text style={styles.pendingMark}>Não enviado</Text>}
          </View>
          <View style={[styles.cell, { width: "10%" }]}>
            <Text>{formatDate(record.date)}</Text>
            {record.loggedAt && <Text style={styles.small}>Lançado em {formatDateTime(record.loggedAt)}</Text>}
          </View>
          <View style={[styles.cell, { width: "9%" }]}><Text>{record.activityType}</Text></View>
          <View style={[styles.cell, { width: "8%" }]}><Text>{record.location}</Text></View>
          <View style={[styles.cell, { width: "18%" }]}>{lines(describeProduction(record))}</View>
          <View style={[styles.cell, { width: "14%" }]}>{lines(describeCosts(record))}</View>
          <View style={[styles.cell, { width: "11%" }]}>{lines(describeLabor(record))}</View>
          <View style={[styles.cell, { width: "19%" }]}>{lines(describeField(record))}</View>
        </View>
        {record.observations && (
          <Text style={styles.observation}>Observações: {record.observations}</Text>
        )}
      </View>
    </View>
  );

  const doc = (
    <Document title="Caderno de campo" author="Bio Certifica">
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Running />
        <Footer />
        <Text style={styles.title}>Caderno de campo</Text>
        <Text style={styles.subtitle}>
          Registros de {period}, {records.length} {records.length === 1 ? "atividade" : "atividades"}
        </Text>

        {pendingCount > 0 && (
          <Text style={styles.warning}>
            Atenção: {pendingCount} {pendingCount === 1 ? "registro ainda não foi enviado" : "registros ainda não foram enviados"} ao servidor. Estão marcados como "Não enviado".
          </Text>
        )}
        {!audit && (
          <Text style={styles.warning}>
            Relatório gerado sem conexão: os registros excluídos e o histórico de safras não puderam ser consultados.
          </Text>
        )}

        <View style={styles.columns}>
          <View style={[styles.section, styles.column]}>
            <Text style={styles.heading}>Produtor</Text>
            {farmer ? (
              <>
                <Field label="Nome" value={farmer.name} />
                <Field label="Comunidade" value={farmer.community} />
                <Field label="Município" value={farmer.municipality} />
                <Field label="Telefone" value={farmer.phone} />
                <Field label="Tamanho da área" value={farmer.propertySize} />
                <Field label="Produção" value={farmer.produces} />
                <Field label="Coordenadas (GPS)" value={coordinates} />
                <Field label="Como chegar" value={directions} />
              </>
            ) : (
              <Text>Sem cadastro de produtor.</Text>
            )}
          </View>

          <View style={[styles.section, styles.column]}>
            <Text style={styles.heading}>Mudanças informadas a cada ano</Text>
            {annualAnswers.length === 0 && <Text>Nenhuma resposta anual registrada.</Text>}
            {annualAnswers.map((answer) => (
              <Field
                key={answer.year}
                label={String(answer.year)}
                value={answer.hadChanges ? `Houve mudanças. ${answer.changesDetails ?? ""}`.trim() : "Sem mudanças"}
              />
            ))}
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.heading}>Safras informadas</Text>
          <View style={styles.tableHead}>
            {["Informada em", "Cultura principal", "Tipo de semente", "Sistema de cultivo", "Área plantada"].map((label) => (
              <Text key={label} style={[styles.headCell, { width: "20%" }]}>{label}</Text>
            ))}
          </View>
          {harvests.length === 0 && <Text style={styles.cell}>Sem cadastro de safra.</Text>}
          {harvests.map((harvest, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, { width: "20%" }]}>{harvest.createdAt ? formatDate(harvest.createdAt) : "-"}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{harvest.mainCrop}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{harvest.seedType}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{harvest.cultivationSystem}</Text>
              <Text style={[styles.cell, { width: "20%" }]}>{harvest.plantedArea}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.heading}>Totais colhidos e destino</Text>
          <View style={styles.tableHead}>
            <Text style={[styles.headCell, { width: "22%" }]}>Produto</Text>
            <Text style={[styles.headCell, { width: "8%" }]}>Unidade</Text>
            <Text style={[styles.headCell, styles.numberCell, { width: "10%" }]}>Colhido</Text>
            {DESTINATIONS.map((destination) => (
              <Text key={destination} style={[styles.headCell, styles.numberCell, { width: "12%" }]}>{destination}</Text>
            ))}
          </View>
          {totals.length === 0 && <Text style={styles.cell}>Nenhuma colheita com quantidade registrada.</Text>}
          {totals.map((total) => (
            <View key={`${total.product}-${total.unit}`} style={styles.tableRow}>
              <Text style={[styles.cell, { width: "22%" }]}>{total.product}</Text>
              <Text style={[styles.cell, { width: "8%" }]}>{total.unit}</Text>
              <Text style={[styles.cell, styles.numberCell, styles.code, { width: "10%" }]}>{formatNumber(total.harvested)}</Text>
              {DESTINATIONS.map((destination) => (
                <Text key={destination} style={[styles.cell, styles.numberCell, { width: "12%" }]}>
                  {total.byDestination[destination] ? formatNumber(total.byDestination[destination]) : "-"}
                </Text>
              ))}
            </View>
          ))}
          {unreadable > 0 && (
            <Text style={styles.note}>
              {unreadable} {unreadable === 1 ? "colheita ficou" : "colheitas ficaram"} fora da soma porque a quantidade não é um número.
            </Text>
          )}
        </View>
      </Page>

      <Page size="A4" orientation="landscape" style={[styles.page, styles.recordsPage]}>
        <View style={styles.running} fixed>
          <View style={styles.runningRow}>
            <Text style={styles.runningTitle}>Caderno de campo: registros em ordem de data</Text>
            <Text style={styles.runningMeta}>
              {farmer?.name ?? "Produtor não informado"}, {farmer?.municipality ?? "-"}. Período: {period}
            </Text>
          </View>
          <View style={[styles.tableHead, { marginTop: 8 }]}>
            {RECORD_COLUMNS.map((column) => (
              <Text key={column.label} style={[styles.headCell, { width: column.width }]}>{column.label}</Text>
            ))}
          </View>
        </View>
        <Footer />
        {records.length === 0 && <Text>Nenhum registro diário encontrado.</Text>}
        {records.map((record) => <RecordRow key={record.id} record={record} />)}
      </Page>

      <Page size="A4" orientation="landscape" style={styles.page}>
        <Running />
        <Footer />
        <View style={styles.section}>
          <Text style={styles.heading}>Registros excluídos</Text>
          {!audit ? (
            <Text>Não consultados: relatório gerado sem conexão.</Text>
          ) : audit.deletedRecords.length === 0 ? (
            <Text>Nenhum registro foi excluído.</Text>
          ) : (
            <>
              <View style={styles.tableHead}>
                <Text style={[styles.headCell, { width: "10%" }]}>Código</Text>
                <Text style={[styles.headCell, { width: "11%" }]}>Data</Text>
                <Text style={[styles.headCell, { width: "26%" }]}>Atividade e cultura</Text>
                <Text style={[styles.headCell, { width: "15%" }]}>Excluído em</Text>
                <Text style={[styles.headCell, { width: "38%" }]}>Motivo</Text>
              </View>
              {audit.deletedRecords.map((record) => (
                <View key={record.id} style={styles.tableRow} wrap={false}>
                  <Text style={[styles.cell, styles.code, { width: "10%" }]}>{recordCode(record.id)}</Text>
                  <Text style={[styles.cell, { width: "11%" }]}>{formatDate(record.date)}</Text>
                  <Text style={[styles.cell, { width: "26%" }]}>
                    {[record.activityType, record.product].filter(Boolean).join(": ")}
                  </Text>
                  <Text style={[styles.cell, { width: "15%" }]}>{formatDateTime(record.deletedAt)}</Text>
                  <Text style={[styles.cell, { width: "38%" }]}>{record.reason || "Excluído antes da exigência de motivo"}</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={[styles.section, { marginTop: 14 }]} wrap={false}>
          <Text style={styles.heading}>Declaração do produtor</Text>
          <Text style={styles.declaration}>
            Declaro que as informações deste caderno de campo são verdadeiras e correspondem às atividades realizadas na minha unidade de produção no período indicado.
          </Text>
          <View style={styles.signatures}>
            <Text style={styles.signature}>Assinatura do produtor</Text>
            <Text style={styles.signature}>Data</Text>
            <Text style={styles.signature}>Responsável pela verificação</Text>
          </View>
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();

  const fileDate = dateFormat.format(new Date()).replaceAll("/", "-");
  const fileName = `caderno-de-campo-${fileDate}.pdf`;
  if (Capacitor.isNativePlatform()) {
    await shareNativePdf(blob, fileName);
    return;
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadAuditPdf(appData: AppData, audit: AuditData | null) {
  await generateAuditPdf(appData, audit);
}
