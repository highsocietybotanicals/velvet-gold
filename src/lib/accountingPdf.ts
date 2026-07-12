import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type AccountingType = "site" | "pro";

export interface AccountingLine {
  id: string;
  invoiceNumber: string;
  date: string; // ISO
  type: AccountingType;
  client: string;
  ht: number;
  tva: number;
  ttc: number;
  status: string;
}

export interface AccountingSummary {
  count: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export const summarize = (lines: AccountingLine[]): AccountingSummary =>
  lines.reduce(
    (acc, l) => ({
      count: acc.count + 1,
      totalHT: acc.totalHT + l.ht,
      totalTVA: acc.totalTVA + l.tva,
      totalTTC: acc.totalTTC + l.ttc,
    }),
    { count: 0, totalHT: 0, totalTVA: 0, totalTTC: 0 }
  );

const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";

export const generateAccountingPdf = (
  lines: AccountingLine[],
  from: Date,
  to: Date
) => {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(184, 134, 11);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("HIGH SOCIETY BOTANICALS", 12, 12);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Récapitulatif comptable", pageWidth - 12, 12, { align: "right" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Journal des factures", 12, 32);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Période : ${format(from, "dd/MM/yyyy")} → ${format(to, "dd/MM/yyyy")}`,
    12,
    39
  );
  doc.text(
    `Édité le ${format(new Date(), "dd/MM/yyyy 'à' HH:mm", { locale: fr })}`,
    12,
    44
  );

  // Group by month if spans > 1 month
  const spanMonths =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
  const grouped = new Map<string, AccountingLine[]>();
  lines.forEach((l) => {
    const key = format(new Date(l.date), "yyyy-MM");
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(l);
  });

  const body: any[] = [];
  const sortedMonths = Array.from(grouped.keys()).sort();
  sortedMonths.forEach((key) => {
    const monthLines = grouped.get(key)!;
    if (spanMonths > 1) {
      body.push([
        {
          content: format(new Date(key + "-01"), "MMMM yyyy", { locale: fr }).toUpperCase(),
          colSpan: 7,
          styles: { fillColor: [245, 240, 225], textColor: [120, 90, 10], fontStyle: "bold", halign: "left" },
        },
      ]);
    }
    monthLines.forEach((l) => {
      body.push([
        l.invoiceNumber,
        format(new Date(l.date), "dd/MM/yyyy"),
        l.type === "site" ? "Site" : "Pro",
        l.client,
        { content: fmt(l.ht), styles: { halign: "right" } },
        { content: fmt(l.tva), styles: { halign: "right" } },
        { content: fmt(l.ttc), styles: { halign: "right", fontStyle: "bold" } },
      ]);
    });
    if (spanMonths > 1) {
      const s = summarize(monthLines);
      body.push([
        {
          content: `Sous-total ${format(new Date(key + "-01"), "MMMM yyyy", { locale: fr })} (${s.count})`,
          colSpan: 4,
          styles: { fontStyle: "italic", halign: "right", fillColor: [250, 246, 235] },
        },
        { content: fmt(s.totalHT), styles: { halign: "right", fillColor: [250, 246, 235], fontStyle: "italic" } },
        { content: fmt(s.totalTVA), styles: { halign: "right", fillColor: [250, 246, 235], fontStyle: "italic" } },
        { content: fmt(s.totalTTC), styles: { halign: "right", fillColor: [250, 246, 235], fontStyle: "bold" } },
      ]);
    }
  });

  autoTable(doc, {
    startY: 50,
    head: [["N° Facture", "Date", "Type", "Client", "HT", "TVA (20%)", "TTC"]],
    body,
    headStyles: { fillColor: [184, 134, 11], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 22 },
      2: { cellWidth: 15 },
      3: { cellWidth: 50 },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 22, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
    },
    margin: { left: 12, right: 12 },
  });

  // Final VAT recap
  const s = summarize(lines);
  const finalY = (doc as any).lastAutoTable.finalY + 8;
  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.5);
  doc.line(12, finalY, pageWidth - 12, finalY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(184, 134, 11);
  doc.text("RÉCAPITULATIF TVA", 12, finalY + 8);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  const rY = finalY + 16;
  doc.text(`Nombre de factures :`, 12, rY);
  doc.text(String(s.count), 80, rY, { align: "right" });
  doc.text(`Total HT :`, 12, rY + 6);
  doc.text(fmt(s.totalHT), 80, rY + 6, { align: "right" });
  doc.text(`TVA collectée (20%) :`, 12, rY + 12);
  doc.text(fmt(s.totalTVA), 80, rY + 12, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(184, 134, 11);
  doc.setFontSize(12);
  doc.text(`Total TTC :`, 12, rY + 20);
  doc.text(fmt(s.totalTTC), 80, rY + 20, { align: "right" });

  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text(
    "High Society Botanicals — SIRET : 994 621 910 00011 — TVA Intra. : FR 48 994 621 910",
    pageWidth / 2,
    pageHeight - 8,
    { align: "center" }
  );

  const fname = `comptabilite_${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}.pdf`;
  doc.save(fname);
};

export const generateAccountingCsv = (lines: AccountingLine[], from: Date, to: Date) => {
  const header = "numero;date;type;client;ht;tva;ttc;statut\n";
  const rows = lines
    .map((l) =>
      [
        l.invoiceNumber,
        format(new Date(l.date), "yyyy-MM-dd"),
        l.type === "site" ? "Site" : "Pro",
        (l.client || "").replace(/[;\n]/g, " "),
        l.ht.toFixed(2).replace(".", ","),
        l.tva.toFixed(2).replace(".", ","),
        l.ttc.toFixed(2).replace(".", ","),
        l.status,
      ].join(";")
    )
    .join("\n");
  const s = summarize(lines);
  const totals = `\n;;;TOTAL (${s.count});${s.totalHT.toFixed(2).replace(".", ",")};${s.totalTVA.toFixed(2).replace(".", ",")};${s.totalTTC.toFixed(2).replace(".", ",")};`;
  const csv = "\uFEFF" + header + rows + totals;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comptabilite_${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
