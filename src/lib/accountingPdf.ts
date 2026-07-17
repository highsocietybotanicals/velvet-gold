import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export type AccountingType = "site" | "pro" | "mileage";

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
  paymentStatus?: string;
  details?: string;
  departureAddress?: string;
  arrivalAddress?: string;
  distanceKm?: number;
  ratePerKm?: number;
}

export interface AccountingSummary {
  count: number;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

const isCancelled = (l: AccountingLine) => l.status === "cancelled";

export const summarize = (lines: AccountingLine[]): AccountingSummary =>
  lines.reduce(
    (acc, l) => {
      if (isCancelled(l)) return acc;
      return {
        count: acc.count + 1,
        totalHT: acc.totalHT + l.ht,
        totalTVA: acc.totalTVA + l.tva,
        totalTTC: acc.totalTTC + l.ttc,
      };
    },
    { count: 0, totalHT: 0, totalTVA: 0, totalTTC: 0 }
  );

const fmt = (n: number) => n.toFixed(2).replace(".", ",") + " €";

const typeLabel = (l: AccountingLine) => {
  if (l.type === "site") return "Site";
  if (l.type === "pro") return "Pro";
  if (l.type === "mileage") return "Frais km";
  return l.type;
};

const statusLabel = (l: AccountingLine) => {
  if (l.type === "mileage") {
    if (l.status === "computed") return "Calculé";
    if (l.status === "failed") return "Échec";
    return l.status || "—";
  }
  if (l.status === "cancelled") return "Annulée";
  if (l.type === "site") {
    if (l.paymentStatus === "paid") return "Payée";
    if (l.paymentStatus === "unpaid") return "Impayée";
    return l.paymentStatus || l.status || "—";
  }
  if (l.status === "paid") return "Payée";
  if (l.status === "pending") return "En attente";
  if (l.status === "issued") return "Émise";
  return l.status || "—";
};

const buildBody = (lines: AccountingLine[], spanMonths: number) => {
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
          colSpan: 8,
          styles: { fillColor: [245, 240, 225], textColor: [120, 90, 10], fontStyle: "bold", halign: "left" },
        },
      ]);
    }
    monthLines.forEach((l) => {
      const cancelled = isCancelled(l);
      const rowStyle: any = cancelled ? { textColor: [160, 40, 40], fontStyle: "italic" } : {};
      body.push([
        { content: l.invoiceNumber, styles: rowStyle },
        { content: format(new Date(l.date), "dd/MM/yyyy"), styles: rowStyle },
        { content: typeLabel(l), styles: rowStyle },
        { content: l.client, styles: rowStyle },
        { content: statusLabel(l), styles: rowStyle },
        { content: fmt(l.ht), styles: { ...rowStyle, halign: "right" } },
        { content: fmt(l.tva), styles: { ...rowStyle, halign: "right" } },
        { content: fmt(l.ttc), styles: { ...rowStyle, halign: "right", fontStyle: cancelled ? "italic" : "bold" } },
      ]);
    });
    if (spanMonths > 1) {
      const s = summarize(monthLines);
      body.push([
        {
          content: `Sous-total ${format(new Date(key + "-01"), "MMMM yyyy", { locale: fr })} (${s.count})`,
          colSpan: 5,
          styles: { fontStyle: "italic", halign: "right", fillColor: [250, 246, 235] },
        },
        { content: fmt(s.totalHT), styles: { halign: "right", fillColor: [250, 246, 235], fontStyle: "italic" } },
        { content: fmt(s.totalTVA), styles: { halign: "right", fillColor: [250, 246, 235], fontStyle: "italic" } },
        { content: fmt(s.totalTTC), styles: { halign: "right", fillColor: [250, 246, 235], fontStyle: "bold" } },
      ]);
    }
  });
  return body;
};

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
  doc.text("Journal comptable — factures & frais kilométriques", 12, 32);
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

  const spanMonths =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;

  const invoiceLines = lines.filter((l) => l.type !== "mileage");
  const mileageLines = lines.filter((l) => l.type === "mileage");

  let startY = 50;

  // Invoice table
  autoTable(doc, {
    startY,
    head: [["N° Facture", "Date", "Type", "Client", "Statut", "HT", "TVA (20%)", "TTC"]],
    body: buildBody(invoiceLines, spanMonths),
    headStyles: { fillColor: [184, 134, 11], textColor: [255, 255, 255], fontSize: 9 },
    styles: { fontSize: 8, cellPadding: 1.4 },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 20 },
      2: { cellWidth: 12 },
      3: { cellWidth: 40 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20, halign: "right" },
      6: { cellWidth: 20, halign: "right" },
      7: { cellWidth: 20, halign: "right" },
    },
    margin: { left: 12, right: 12 },
  });

  let finalY = (doc as any).lastAutoTable.finalY + 8;

  // Mileage table
  if (mileageLines.length > 0) {
    if (finalY > 200) {
      doc.addPage();
      finalY = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(184, 134, 11);
    doc.text("Frais kilométriques (livraisons personnelles)", 12, finalY);

    const mileageBody: any[] = [];
    const groupedM = new Map<string, AccountingLine[]>();
    mileageLines.forEach((l) => {
      const key = format(new Date(l.date), "yyyy-MM");
      if (!groupedM.has(key)) groupedM.set(key, []);
      groupedM.get(key)!.push(l);
    });
    Array.from(groupedM.keys()).sort().forEach((key) => {
      const monthLines = groupedM.get(key)!;
      if (spanMonths > 1) {
        mileageBody.push([
          {
            content: format(new Date(key + "-01"), "MMMM yyyy", { locale: fr }).toUpperCase(),
            colSpan: 8,
            styles: { fillColor: [245, 240, 225], textColor: [120, 90, 10], fontStyle: "bold", halign: "left" },
          },
        ]);
      }
      monthLines.forEach((l) => {
        mileageBody.push([
          l.invoiceNumber,
          format(new Date(l.date), "dd/MM/yyyy"),
          l.client,
          l.departureAddress || "15 rue des écoles, 44170 Abbaretz",
          l.arrivalAddress || "—",
          { content: (l.distanceKm ?? 0).toFixed(1), styles: { halign: "right" } },
          { content: (l.ratePerKm ?? 0).toFixed(2).replace(".", ",") + " €", styles: { halign: "right" } },
          { content: fmt(l.ttc), styles: { halign: "right", fontStyle: "bold" } },
        ]);
      });
    });

    autoTable(doc, {
      startY: finalY + 4,
      head: [["N° Livraison", "Date", "Client", "Départ", "Arrivée", "Km", "€/km", "Total TTC"]],
      body: mileageBody,
      headStyles: { fillColor: [120, 90, 10], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7.5, cellPadding: 1.2, overflow: "linebreak", valign: "middle" },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 18 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 40 },
        5: { cellWidth: 12, halign: "right" },
        6: { cellWidth: 14, halign: "right" },
        7: { cellWidth: 20, halign: "right" },
      },
      margin: { left: 12, right: 12 },
    });
    finalY = (doc as any).lastAutoTable.finalY + 8;
  }

  doc.setDrawColor(184, 134, 11);
  doc.setLineWidth(0.5);
  doc.line(12, finalY, pageWidth - 12, finalY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(184, 134, 11);
  doc.text("RÉCAPITULATIF (hors annulées)", 12, finalY + 8);

  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  const rY = finalY + 16;
  const invoiceSummary = summarize(invoiceLines);
  const mileageSummary = summarize(mileageLines);
  doc.text(`Nombre de factures :`, 12, rY);
  doc.text(String(invoiceSummary.count), 80, rY, { align: "right" });
  doc.text(`Total HT factures :`, 12, rY + 6);
  doc.text(fmt(invoiceSummary.totalHT), 80, rY + 6, { align: "right" });
  doc.text(`TVA collectée (20%) :`, 12, rY + 12);
  doc.text(fmt(invoiceSummary.totalTVA), 80, rY + 12, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(184, 134, 11);
  doc.setFontSize(12);
  doc.text(`Total TTC factures :`, 12, rY + 20);
  doc.text(fmt(invoiceSummary.totalTTC), 80, rY + 20, { align: "right" });

  if (mileageLines.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`Nombre de livraisons :`, 110, rY);
    doc.text(String(mileageSummary.count), 178, rY, { align: "right" });
    doc.text(`Frais kilométriques HT/TTC :`, 110, rY + 6);
    doc.text(fmt(mileageSummary.totalHT), 178, rY + 6, { align: "right" });
    doc.text(`TVA non récupérable :`, 110, rY + 12);
    doc.text(fmt(mileageSummary.totalTVA), 178, rY + 12, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(184, 134, 11);
    doc.setFontSize(12);
    doc.text(`Total frais km :`, 110, rY + 20);
    doc.text(fmt(mileageSummary.totalTTC), 178, rY + 20, { align: "right" });
  }

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
  const header = "numero;date;type;client;statut;ht;tva;ttc;details\n";
  const rows = lines
    .map((l) =>
      [
        l.invoiceNumber,
        format(new Date(l.date), "yyyy-MM-dd"),
        typeLabel(l),
        (l.client || "").replace(/[;\n]/g, " "),
        statusLabel(l),
        l.ht.toFixed(2).replace(".", ","),
        l.tva.toFixed(2).replace(".", ","),
        l.ttc.toFixed(2).replace(".", ","),
        (l.details || "").replace(/[;\n]/g, " "),
      ].join(";")
    )
    .join("\n");
  const invoiceLines = lines.filter((l) => l.type !== "mileage");
  const mileageLines = lines.filter((l) => l.type === "mileage");
  const invoiceSummary = summarize(invoiceLines);
  const mileageSummary = summarize(mileageLines);
  const totals = invoiceLines.length > 0
    ? `\n;;;;TOTAL FACTURES hors annulées (${invoiceSummary.count});${invoiceSummary.totalHT.toFixed(2).replace(".", ",")};${invoiceSummary.totalTVA.toFixed(2).replace(".", ",")};${invoiceSummary.totalTTC.toFixed(2).replace(".", ",")};`
    : "";
  const mileageTotals = mileageLines.length > 0
    ? `\n;;;;TOTAL FRAIS KM (${mileageSummary.count});${mileageSummary.totalHT.toFixed(2).replace(".", ",")};${mileageSummary.totalTVA.toFixed(2).replace(".", ",")};${mileageSummary.totalTTC.toFixed(2).replace(".", ",")};`
    : "";
  const csv = "\uFEFF" + header + rows + totals + mileageTotals;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `comptabilite_${format(from, "yyyy-MM-dd")}_${format(to, "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
