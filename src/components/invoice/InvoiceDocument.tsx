import path from "path";
import React from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { BUSINESS, stateCodeFor } from "@/lib/business";
import { computeGstBreakdown } from "@/lib/gst";

const LOGO_PATH = path.join(process.cwd(), "public", "logo.png");

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

const NAVY = "#243b5a";
const GRAY = "#6b7280";
const BORDER = "#e5e0d8";
const INK = "#1a1a2e";

// A single A4 page, everything sized to fit without overflowing to a
// second page. Row layouts (View flexDirection:"row" with Text/View
// children) render correctly in the installed @react-pdf/renderer
// version — verified with a standalone render check — so the invoice
// uses real side-by-side fields instead of an all-stacked layout.
const styles = StyleSheet.create({
  page: { padding: 0, fontSize: 9, color: INK, fontFamily: "Helvetica", backgroundColor: "#eef2f6" },
  topBar: { height: 8, backgroundColor: NAVY },
  card: { margin: 22, padding: 26, backgroundColor: "#ffffff", borderRadius: 10 },

  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logo: { width: 110, height: 56, marginBottom: 8 },
  sellerName: { fontSize: 10, fontWeight: 700, color: INK },
  sellerLine: { fontSize: 8, color: GRAY, marginTop: 2 },

  invoiceTitleRow: { flexDirection: "row", alignItems: "center" },
  invoiceTitle: { fontSize: 16, fontWeight: 700, color: NAVY },
  paidBadge: {
    marginLeft: 8,
    backgroundColor: "#e7f6ec",
    color: "#1a7f37",
    fontSize: 8,
    fontWeight: 700,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 10,
  },
  metaLabel: { fontSize: 7, color: GRAY, marginTop: 8, textAlign: "right" },
  metaValue: { fontSize: 9, fontWeight: 700, color: INK, marginTop: 2, textAlign: "right" },

  divider: { height: 1, backgroundColor: BORDER, marginTop: 16, marginBottom: 14 },
  hairline: { height: 1, backgroundColor: BORDER, marginTop: 8, marginBottom: 8 },

  twoColRow: { flexDirection: "row" },
  box: { borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12 },
  boxTitle: { fontSize: 7, color: GRAY, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 },
  boxBold: { fontSize: 10, fontWeight: 700, color: INK, marginBottom: 2 },
  boxLine: { fontSize: 8.5, color: "#4b5563", marginTop: 1 },

  planBox: { marginTop: 12, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12 },
  planName: { fontSize: 11, fontWeight: 700, color: INK, marginBottom: 6 },
  fieldRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  fieldLabel: { fontSize: 7, color: GRAY, textTransform: "uppercase" },
  fieldValue: { fontSize: 9, fontWeight: 700, color: INK, marginTop: 2 },

  amountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  amountLabel: { fontSize: 9, color: "#4b5563" },
  amountValue: { fontSize: 9, fontWeight: 700, color: INK },

  totalBar: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
  },
  totalBarLabel: { fontSize: 11, fontWeight: 700, color: "#ffffff" },
  totalBarValue: { fontSize: 18, fontWeight: 700, color: "#ffffff" },

  paymentBox: { marginTop: 12, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 12 },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },

  trustBar: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    backgroundColor: "#eef6fb",
    borderRadius: 8,
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10,
  },
  trustText: { fontSize: 8, fontWeight: 700, color: NAVY },

  footer: { marginTop: 16, fontSize: 7.5, lineHeight: 1.5, color: "#9ca3af", textAlign: "center" },
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
        <View style={styles.topBar} />

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View>
              <Image src={LOGO_PATH} style={styles.logo} />
              <Text style={styles.sellerName}>{BUSINESS.legalName}</Text>
              {BUSINESS.addressLines.map((line) => (
                <Text key={line} style={styles.sellerLine}>
                  {line}
                </Text>
              ))}
              <Text style={styles.sellerLine}>
                {BUSINESS.city}, {BUSINESS.state} - {BUSINESS.pincode}
              </Text>
              <Text style={styles.sellerLine}>GSTIN: {BUSINESS.gstin}</Text>
            </View>

            <View>
              <View style={styles.invoiceTitleRow}>
                <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
                <Text style={styles.paidBadge}>PAID</Text>
              </View>
              <Text style={styles.metaLabel}>Invoice #</Text>
              <Text style={styles.metaValue}>{data.invoiceNumber}</Text>
              <Text style={styles.metaLabel}>Invoice Date</Text>
              <Text style={styles.metaValue}>{formatDate(data.paidAt)}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.twoColRow}>
            <View style={[styles.box, { flex: 2, marginRight: 10 }]}>
              <Text style={styles.boxTitle}>Billed To</Text>
              <Text style={styles.boxBold}>{data.customerName}</Text>
              <Text style={styles.boxLine}>{data.customerMobile}</Text>
              <Text style={styles.boxLine}>{data.addressLine}</Text>
            </View>
            <View style={[styles.box, { flex: 1 }]}>
              <Text style={styles.boxTitle}>Place of Supply</Text>
              <Text style={styles.boxBold}>
                {data.customerState}
                {customerStateCode ? ` (${customerStateCode})` : ""}
              </Text>
            </View>
          </View>

          <View style={styles.planBox}>
            <Text style={styles.boxTitle}>Booking / Plan Details</Text>
            <Text style={styles.planName}>{data.planName}</Text>

            <View style={styles.fieldRow}>
              <View>
                <Text style={styles.fieldLabel}>Dog{data.dogNames.length === 1 ? "" : "s"}</Text>
                <Text style={styles.fieldValue}>{data.dogNames.join(", ")}</Text>
              </View>
              <View>
                <Text style={styles.fieldLabel}>Slot</Text>
                <Text style={styles.fieldValue}>{data.slotLabel}</Text>
              </View>
            </View>

            <View style={{ marginTop: 8 }}>
              <Text style={styles.fieldLabel}>Service Period</Text>
              <Text style={styles.fieldValue}>
                {formatDate(data.startDate)} - {formatDate(data.endDate)}
              </Text>
            </View>

            <View style={styles.hairline} />

            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Taxable value</Text>
              <Text style={styles.amountValue}>{formatMoney(gst.taxableValuePaise)}</Text>
            </View>

            {gst.isInterState ? (
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>IGST @ 18%</Text>
                <Text style={styles.amountValue}>{formatMoney(gst.igstPaise)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>CGST @ 9%</Text>
                  <Text style={styles.amountValue}>{formatMoney(gst.cgstPaise)}</Text>
                </View>
                <View style={styles.amountRow}>
                  <Text style={styles.amountLabel}>SGST @ 9%</Text>
                  <Text style={styles.amountValue}>{formatMoney(gst.sgstPaise)}</Text>
                </View>
              </>
            )}
          </View>

          <View style={styles.totalBar}>
            <Text style={styles.totalBarLabel}>TOTAL (INCL. GST)</Text>
            <Text style={styles.totalBarValue}>{formatMoney(data.amountPaise)}</Text>
          </View>

          <View style={styles.paymentBox}>
            <Text style={styles.boxTitle}>Payment Details</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.amountLabel}>Payment method</Text>
              <Text style={styles.amountValue}>Razorpay</Text>
            </View>
            {data.razorpayPaymentId && (
              <View style={styles.paymentRow}>
                <Text style={styles.amountLabel}>Payment ID</Text>
                <Text style={styles.amountValue}>{data.razorpayPaymentId}</Text>
              </View>
            )}
            <View style={styles.paymentRow}>
              <Text style={styles.amountLabel}>Booking ID</Text>
              <Text style={styles.amountValue}>{data.bookingId}</Text>
            </View>
          </View>

          <View style={styles.trustBar}>
            <Text style={styles.trustText}>
              Secure booking payment &nbsp;&nbsp;•&nbsp;&nbsp; GST tax invoice &nbsp;&nbsp;•&nbsp;&nbsp; No
              signature required
            </Text>
          </View>

          <Text style={styles.footer}>
            Questions? Contact Strollo support.{"\n"}
            This is a computer-generated tax invoice issued under GST regulations and does not require a
            signature. Seller GSTIN: {BUSINESS.gstin}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
