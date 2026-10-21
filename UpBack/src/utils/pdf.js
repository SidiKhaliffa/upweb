import PdfPrinter from "pdfmake";
import vfs from "pdfmake/build/vfs_fonts.js";

// Roboto ships inside pdfmake as base64, so no font files to deploy.
const font = (name) => Buffer.from(vfs[name], "base64");
const printer = new PdfPrinter({
  Roboto: {
    normal: font("Roboto-Regular.ttf"),
    bold: font("Roboto-Medium.ttf"),
    italics: font("Roboto-Italic.ttf"),
    bolditalics: font("Roboto-MediumItalic.ttf"),
  },
});

// Colors of the QuestPDF palette the .NET PDFs used.
const HEADER_FILL = "#E0E0E0"; // Grey.Lighten2
const TOTAL_FILL = "#EEEEEE"; // Grey.Lighten3
const LINE_COLOR = "#9E9E9E"; // Grey.Medium

// French format with thousands separators ("10 000", "1 234,5"). Intl's
// narrow no-break space is swapped for a regular one, which every font
// renders with a visible width.
const numberFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 2,
});
export const formatNumber = (value) =>
  numberFormatter.format(Number(value) || 0).replace(/\u202f/g, "\u00a0");

// formatNumber with blanks for empty or zero values, as in the .NET PDFs.
export function formatAmount(value) {
  if (value === null || value === undefined || Number(value) === 0) return "";
  return formatNumber(value);
}

export const headerCell = (text, fontSize) => ({
  text,
  bold: true,
  fontSize,
  fillColor: HEADER_FILL,
});

export const cell = (text, fontSize, alignment = "left") => ({
  text: text ?? "",
  fontSize,
  alignment,
});

export const totalCell = (text, fontSize, extra = {}) => ({
  text: text ?? "",
  bold: true,
  fontSize,
  alignment: "right",
  fillColor: TOTAL_FILL,
  ...extra,
});

// Placeholder cells pdfmake expects after a colSpan.
export const spanFill = (count) => Array.from({ length: count }, () => ({}));

export function borderedTable(widths, header, rows, padding) {
  return {
    table: { headerRows: 1, widths, body: [header, ...rows] },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "black",
      vLineColor: () => "black",
      paddingLeft: () => padding,
      paddingRight: () => padding,
      paddingTop: () => padding,
      paddingBottom: () => padding,
    },
  };
}

// Signature blocks: a label with room to sign and a line underneath.
export function signatures(labels, { landscape }) {
  const gap = 20;
  const lineWidth =
    ((landscape ? 841.89 : 595.28) - 40 - gap * (labels.length - 1)) /
    labels.length;
  const alignments =
    labels.length === 2 ? ["left", "right"] : ["left", "center", "right"];
  return {
    margin: [0, 20, 0, 0],
    columnGap: gap,
    columns: labels.map((label, i) => ({
      stack: [
        { text: label, fontSize: 10, alignment: alignments[i] },
        {
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: lineWidth,
              y2: 0,
              lineWidth: 1,
              lineColor: LINE_COLOR,
            },
          ],
          margin: [0, 60, 0, 0],
        },
      ],
    })),
  };
}

// Title (and optional subtitle) repeated at the top of every page.
export function pageDocument({ title, subtitle, landscape, content }) {
  return {
    pageSize: "A4",
    pageOrientation: landscape ? "landscape" : "portrait",
    pageMargins: [20, subtitle ? 70 : 55, 20, 35],
    header: () => ({
      margin: [20, 15, 20, 0],
      alignment: "center",
      stack: [
        { text: title, fontSize: 16, bold: true },
        subtitle ? { text: subtitle, fontSize: 14, bold: true } : "",
      ],
    }),
    footer: (currentPage, pageCount) => ({
      text: `Page ${currentPage} / ${pageCount}`,
      alignment: "right",
      fontSize: 8,
      color: "#666666",
      margin: [20, 12, 20, 0],
    }),
    content,
    defaultStyle: { font: "Roboto" },
  };
}

export function renderPdf(docDefinition) {
  return new Promise((resolve, reject) => {
    const doc = printer.createPdfKitDocument(docDefinition);
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

export async function sendPdf(res, docDefinition, filename) {
  const buffer = await renderPdf(docDefinition);
  res.set({
    "Content-Type": "application/pdf",
    // ASCII fallback plus the UTF-8 name, for commercial names with accents.
    "Content-Disposition": `attachment; filename="${filename.replace(
      /[^\x20-\x7e]|"/g,
      "_"
    )}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  });
  res.send(buffer);
}

// Column widths from relative weights (QuestPDF's RelativeColumn), so a
// table fills the page. pdfmake widths exclude cell padding and borders.
export function relativeWidths(weights, { landscape, padding }) {
  const pageWidth = landscape ? 841.89 : 595.28;
  const available =
    pageWidth - 40 - weights.length * 2 * padding - (weights.length + 1);
  const total = weights.reduce((sum, w) => sum + w, 0);
  return weights.map((w) => (w * available) / total);
}
