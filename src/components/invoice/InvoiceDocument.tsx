import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS, stateCodeFor } from "@/lib/business";
import { computeGstBreakdown } from "@/lib/gst";

export type InvoiceData = {
  invoiceNumber: string;
  bookingId: string;
  razorpayPaymentId: string | null;
  paidAt: Date;
  customerName: string;
  customerMobile: string;
  customerState: string;
  planName: string;
  dogNames: string[];
  slotLabel: string;
  startDate: Date;
  endDate: Date;
  addressLine: string;
  amountPaise: number;
};

// Flat, stacked layout on purpose — an earlier version used nested
// flex rows (a View wrapping several Text elements as one child of a
// row, sibling to another Text) and react-pdf's Yoga layout engine
// silently truncated everything from that point on with no error. This
// structure (single Text per line, no nested-View-inside-a-row) is the
// one confirmed to render in full.
const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1a1a2e", fontFamily: "Helvetica" },
  brand: { fontSize: 20, fontWeight: 700, color: "#243b5a" },
  tagline: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  sellerLine: { fontSize: 9, color: "#6b7280", marginTop: 8 },
  invoiceTitle: { fontSize: 14, fontWeight: 700, marginTop: 16 },
  invoiceMeta: { fontSize: 9, color: "#6b7280", marginTop: 2 },
  divider: { marginTop: 16, marginBottom: 16, height: 2, backgroundColor: "#243b5a" },
  hairline: { marginTop: 8, marginBottom: 8, height: 1, backgroundColor: "#e5e0d8" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 9, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 },
  bold: { fontWeight: 700 },
  label: { color: "#6b7280" },
  planName: { fontSize: 11, fontWeight: 700, marginBottom: 3 },
  planMeta: { fontSize: 9, color: "#6b7280", marginBottom: 2 },
  amountLabel: { fontSize: 9, color: "#6b7280", marginTop: 8 },
  amountValue: { fontSize: 10, marginTop: 1 },
  totalLabel: { fontSize: 12, fontWeight: 700, marginTop: 4 },
  totalValue: { fontSize: 16, fontWeight: 700, color: "#243b5a", marginTop: 2 },
  paymentLine: { fontSize: 10, marginBottom: 4 },
  footer: { marginTop: 32, fontSize: 8, color: "#9ca3af" },
});

function formatMoney(paise: number) {
  return `Rs. ${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function InvoiceDocument({ data }: { data: InvoiceData }) {
  const gst = computeGstBreakdown(data.amountPaise, data.customerState);
  const customerStateCode = stateCodeFor(data.customerState);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>Strollo</Text>
        <Text style={styles.tagline}>Happy Steps, Happy Dogs</Text>
        <Text style={styles.sellerLine}>{BUSINESS.legalName}</Text>
        {BUSINESS.addressLines.map((line) => (
          <Text key={line} style={styles.sellerLine}>
            {line}
          </Text>
        ))}
        <Text style={styles.sellerLine}>
          {BUSINESS.city}, {BUSINESS.state} - {BUSINESS.pincode}
        </Text>
        <Text style={styles.sellerLine}>GSTIN: {BUSINESS.gstin}</Text>

        <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
        <Text style={styles.invoiceMeta}>Invoice #{data.invoiceNumber}</Text>
        <Text style={styles.invoiceMeta}>{formatDate(data.paidAt)}</Text>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billed to</Text>
          <Text style={styles.bold}>{data.customerName}</Text>
          <Text style={styles.label}>{data.customerMobile}</Text>
          <Text style={styles.label}>{data.addressLine}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Place of supply</Text>
          <Text style={styles.label}>
            {data.customerState}
            {customerStateCode ? ` (${customerStateCode})` : ""}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan details</Text>
          <View style={styles.hairline} />
          <Text style={styles.planName}>{data.planName}</Text>
          <Text style={styles.planMeta}>
            Dog{data.dogNames.length === 1 ? "" : "s"}: {data.dogNames.join(", ")}
          </Text>
          <Text style={styles.planMeta}>
            {formatDate(data.startDate)} - {formatDate(data.endDate)} ({data.slotLabel} slot)
          </Text>

          <View style={styles.hairline} />

          <Text style={styles.amountLabel}>Taxable value</Text>
          <Text style={styles.amountValue}>{formatMoney(gst.taxableValuePaise)}</Text>

          {gst.isInterState ? (
            <>
              <Text style={styles.amountLabel}>IGST @ 18%</Text>
              <Text style={styles.amountValue}>{formatMoney(gst.igstPaise)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.amountLabel}>CGST @ 9%</Text>
              <Text style={styles.amountValue}>{formatMoney(gst.cgstPaise)}</Text>
              <Text style={styles.amountLabel}>SGST @ 9%</Text>
              <Text style={styles.amountValue}>{formatMoney(gst.sgstPaise)}</Text>
            </>
          )}

          <View style={styles.hairline} />
          <Text style={styles.totalLabel}>Total (incl. GST)</Text>
          <Text style={styles.totalValue}>{formatMoney(data.amountPaise)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment details</Text>
          <Text style={styles.paymentLine}>Payment method: Razorpay</Text>
          {data.razorpayPaymentId && (
            <Text style={styles.paymentLine}>Payment ID: {data.razorpayPaymentId}</Text>
          )}
          <Text style={styles.paymentLine}>Booking ID: {data.bookingId}</Text>
        </View>

        <View style={styles.hairline} />
        <Text style={styles.footer}>
          This is a computer-generated tax invoice issued under GST regulations and does not
          require a signature. Seller GSTIN: {BUSINESS.gstin}. For questions, contact Strollo
          support.
        </Text>
      </Page>
    </Document>
  );
}
