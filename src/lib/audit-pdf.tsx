import type { AppData, DailyRecord } from "../App";

const colors = {
  pageBg: "#f5fbf5",
  headerBg: "#14532d",
  headerAccent: "#22c55e",
  cardBg: "#ffffff",
  cardBorder: "#d1fae5",
  textPrimary: "#14532d",
  textSecondary: "#3f3f46",
  textMuted: "#71717a",
  tagBg: "#ecfdf3",
  tagText: "#15803d",
  divider: "#bbf7d0",
};

const formatShortDateTime = (iso: string) => {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const safe = (value: unknown) => (typeof value === "string" ? value : value ? String(value) : "-");

async function generateAuditPdf(appData: AppData) {
  const reactPdf = await import("@react-pdf/renderer");
  const { Document, Page, StyleSheet, Text, View, pdf } = reactPdf;

  const styles = StyleSheet.create({
    page: {
      backgroundColor: colors.pageBg,
      paddingTop: 0,
      paddingHorizontal: 28,
      paddingBottom: 28,
      fontSize: 10,
      color: colors.textSecondary,
      fontFamily: "Helvetica",
    },
    headerBand: {
      backgroundColor: colors.headerBg,
      paddingTop: 20,
      paddingBottom: 18,
      paddingHorizontal: 22,
      marginHorizontal: -28,
      marginBottom: 14,
      borderBottomLeftRadius: 14,
      borderBottomRightRadius: 14,
    },
    topAccent: {
      width: 74,
      height: 5,
      borderRadius: 999,
      backgroundColor: colors.headerAccent,
      marginBottom: 10,
    },
    title: {
      color: "#f0fdf4",
      fontSize: 18,
      fontWeight: 700,
      marginBottom: 4,
    },
    subtitle: {
      color: "#dcfce7",
      fontSize: 10,
    },
    metaRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    metaPill: {
      backgroundColor: "#166534",
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    metaText: {
      color: "#ecfdf5",
      fontSize: 9,
    },
    sectionCard: {
      backgroundColor: colors.cardBg,
      border: `1 solid ${colors.cardBorder}`,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    sectionTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: 700,
      color: colors.textPrimary,
    },
    sectionBadge: {
      backgroundColor: colors.tagBg,
      color: colors.tagText,
      borderRadius: 999,
      fontSize: 8,
      fontWeight: 700,
      paddingHorizontal: 7,
      paddingVertical: 3,
    },
    row: {
      flexDirection: "row",
      marginBottom: 5,
    },
    label: {
      width: "34%",
      color: colors.textMuted,
      fontSize: 9,
      paddingRight: 6,
    },
    value: {
      width: "66%",
      color: colors.textSecondary,
      fontSize: 10,
      lineHeight: 1.35,
    },
    divider: {
      borderTop: `1 solid ${colors.divider}`,
      marginTop: 2,
      marginBottom: 6,
    },
    recordCard: {
      backgroundColor: "#ffffff",
      border: `1 solid ${colors.cardBorder}`,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 10,
      marginBottom: 8,
    },
    recordHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 7,
    },
    recordDate: {
      fontSize: 9,
      color: colors.textMuted,
    },
    recordType: {
      backgroundColor: colors.tagBg,
      color: colors.tagText,
      borderRadius: 999,
      fontSize: 8,
      fontWeight: 700,
      paddingHorizontal: 6,
      paddingVertical: 3,
      maxWidth: "58%",
      textAlign: "center",
    },
    fieldText: {
      fontSize: 9.5,
      color: colors.textSecondary,
      lineHeight: 1.35,
      marginBottom: 3,
    },
    fieldLabel: {
      color: colors.textMuted,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: 10,
    },
    footer: {
      position: "absolute",
      bottom: 14,
      left: 28,
      right: 28,
      borderTop: `1 solid ${colors.divider}`,
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      fontSize: 8,
      color: colors.textMuted,
    },
  });

  const dataRow = (label: string, value: unknown) => (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{safe(value)}</Text>
    </View>
  );

  const RecordCard = ({ record, index }: { record: DailyRecord; index: number }) => (
    <View style={styles.recordCard} wrap={false}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordDate}>Registro {index + 1} • {formatShortDateTime(record.date)}</Text>
        <Text style={styles.recordType}>{safe(record.activityType)}</Text>
      </View>

      {record.production && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Produção: </Text>
          {safe(record.production.product)} • {safe(record.production.quantity)} {safe(record.production.unit)}
        </Text>
      )}

      <Text style={styles.fieldText}>
        <Text style={styles.fieldLabel}>Local: </Text>
        {safe(record.location)}
      </Text>

      <Text style={styles.fieldText}>
        <Text style={styles.fieldLabel}>Destino: </Text>
        {safe(record.destination)}
      </Text>

      {record.destinationDetails?.saleValue && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Valor de venda: </Text>
          {safe(record.destinationDetails.saleValue)}
        </Text>
      )}

      {record.destinationDetails?.buyer && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Comprador: </Text>
          {safe(record.destinationDetails.buyer)}
        </Text>
      )}

      {record.destinationDetails?.exchangeItem && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Troca por: </Text>
          {safe(record.destinationDetails.exchangeItem)}
        </Text>
      )}

      {record.destinationDetails?.donationRecipient && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Doação para: </Text>
          {safe(record.destinationDetails.donationRecipient)}
        </Text>
      )}

      {record.costs && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Despesa: </Text>
          {record.costs.hasExpense ? "Sim" : "Não"}
          {record.costs.type ? ` • ${safe(record.costs.type)}` : ""}
          {record.costs.value ? ` • ${safe(record.costs.value)}` : ""}
        </Text>
      )}

      <Text style={styles.fieldText}>
        <Text style={styles.fieldLabel}>Mão de obra: </Text>
        {safe(record.labor?.type)} • Pessoas: {safe(record.labor?.peopleCount)} • Pagamento: {record.labor?.hadPayment ? "Sim" : "Não"}
        {record.labor?.paymentValue ? ` (${safe(record.labor.paymentValue)})` : ""}
      </Text>

      <Text style={styles.fieldText}>
        <Text style={styles.fieldLabel}>Clima: </Text>
        {safe(record.fieldConditions?.weather)}
      </Text>

      <Text style={styles.fieldText}>
        <Text style={styles.fieldLabel}>Ocorrências: </Text>
        {safe(record.fieldConditions?.occurrences)}
      </Text>

      {record.fieldConditions?.occurrenceDetails && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Detalhes: </Text>
          {safe(record.fieldConditions.occurrenceDetails)}
        </Text>
      )}

      {record.fieldConditions?.pestOrDiseaseFound && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Praga/Doença encontrada: </Text>
          {safe(record.fieldConditions.pestOrDiseaseFound)}
        </Text>
      )}

      {record.fieldConditions?.appliedProduct && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Produto aplicado: </Text>
          {safe(record.fieldConditions.appliedProduct)}
        </Text>
      )}

      {record.fieldConditions?.homemadeProductPreparation && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Preparo do produto: </Text>
          {safe(record.fieldConditions.homemadeProductPreparation)}
        </Text>
      )}

      {record.observations && (
        <Text style={styles.fieldText}>
          <Text style={styles.fieldLabel}>Observações: </Text>
          {safe(record.observations)}
        </Text>
      )}
    </View>
  );

  const currentYear = new Date().getFullYear();
  const annual = appData.annual?.[String(currentYear)];
  const generatedAt = new Date().toISOString();

  const doc = (
    <Document title="Relatório de Manejo Vegetal" author="Bio CErtifica">
      <Page size="A4" style={styles.page}>
        <View style={styles.headerBand}>
          <View style={styles.topAccent} />
          <Text style={styles.title}>Relatório de Manejo Vegetal</Text>
          <Text style={styles.subtitle}>Aplicação Bio Certifica</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Gerado em {formatShortDateTime(generatedAt)}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{appData.records.length} registros</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Produtor</Text>
            <Text style={styles.sectionBadge}>Cadastro</Text>
          </View>

          {appData.farmer ? (
            <>
              {dataRow("Nome", appData.farmer.name)}
              {dataRow("Comunidade", appData.farmer.community)}
              {dataRow("Município", appData.farmer.municipality)}
              {appData.farmer.phone ? dataRow("Telefone", appData.farmer.phone) : null}
              {appData.farmer.propertySize ? dataRow("Tamanho", appData.farmer.propertySize) : null}
              {appData.farmer.produces ? dataRow("Produção", appData.farmer.produces) : null}
              {appData.farmer.accessDirections ? dataRow("Como chegar", appData.farmer.accessDirections) : null}
            </>
          ) : (
            <Text style={styles.emptyText}>Sem cadastro de produtor.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Safra / Ano</Text>
            <Text style={styles.sectionBadge}>{currentYear}</Text>
          </View>

          {appData.harvest ? (
            <>
              {dataRow("Cultura principal", appData.harvest.mainCrop)}
              {dataRow("Tipo de semente", appData.harvest.seedType)}
              {dataRow("Sistema de cultivo", appData.harvest.cultivationSystem)}
              {dataRow("Área plantada", appData.harvest.plantedArea)}
              {annual ? (
                <>
                  <View style={styles.divider} />
                  {dataRow("Atualização anual", annual.hadChanges ? "Houve mudanças" : "Sem mudanças")}
                  {annual.changesDetails ? dataRow("Detalhes", annual.changesDetails) : null}
                </>
              ) : null}
            </>
          ) : (
            <Text style={styles.emptyText}>Sem cadastro de safra.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Registros Diários</Text>
            <Text style={styles.sectionBadge}>Linha do tempo</Text>
          </View>

          {!appData.records.length ? (
            <Text style={styles.emptyText}>Nenhum registro diário encontrado.</Text>
          ) : (
            appData.records.map((record, index) => <RecordCard key={`${record.id}-${record.date}`} record={record} index={index} />)
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>Bio Certifica</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();

  const fileDate = new Intl.DateTimeFormat("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(new Date())
    .replaceAll("/", "-");

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio-agroecologia-${fileDate}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadAuditPdf(appData: AppData) {
  void generateAuditPdf(appData);
}
