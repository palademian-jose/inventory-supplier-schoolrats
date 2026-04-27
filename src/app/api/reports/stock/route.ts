import { NextRequest } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { requireAuth, ApiError } from "@/lib/auth";
import { query } from "@/lib/db";
import { errorResponse } from "@/lib/api-utils";

type ReportType = "inventory-summary" | "low-stock" | "transaction-history";

function drawWrappedText(
  page: import("pdf-lib").PDFPage,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  font: import("pdf-lib").PDFFont,
  size: number,
  color = rgb(0.1, 0.1, 0.1)
) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
      continue;
    }

    if (currentLine) lines.push(currentLine);
    currentLine = word;
  }

  if (currentLine) lines.push(currentLine);

  lines.forEach((line, index) => {
    page.drawText(line, { x, y: y - index * (size + 4), size, font, color });
  });

  return y - lines.length * (size + 4);
}

async function buildInventorySummary() {
  const [totals] = await query<{
    total_items: number;
    low_stock_items: number;
    total_stock_units: number;
    total_suppliers: number;
  }>(
    `SELECT
       COUNT(*) AS total_items,
       SUM(CASE WHEN stock_quantity <= reorder_level THEN 1 ELSE 0 END) AS low_stock_items,
       COALESCE(SUM(stock_quantity), 0) AS total_stock_units,
       (SELECT COUNT(*) FROM suppliers) AS total_suppliers
     FROM items`
  );

  const rows = await query<{
    name: string;
    category_name: string | null;
    stock_quantity: number;
    reorder_level: number;
    unit_symbol: string | null;
  }>(
    `SELECT i.name, c.name AS category_name, i.stock_quantity, i.reorder_level, u.symbol AS unit_symbol
     FROM items i
     LEFT JOIN categories c ON c.id = i.category_id
     LEFT JOIN units_of_measure u ON u.id = i.unit_id
     ORDER BY i.stock_quantity ASC, i.name ASC
     LIMIT 12`
  );

  return {
    title: "Inventory Summary Report",
    subtitle: "High-level stock and supplier overview.",
    metrics: [
      `Total items: ${Number(totals.total_items)}`,
      `Low stock items: ${Number(totals.low_stock_items)}`,
      `Total stock units: ${Number(totals.total_stock_units)}`,
      `Suppliers tracked: ${Number(totals.total_suppliers)}`,
    ],
    sectionTitle: "Current Stock Snapshot",
    rows: rows.map((row) => [
      row.name,
      row.category_name || "-",
      `${Number(row.stock_quantity)} ${row.unit_symbol || ""}`.trim(),
      String(row.reorder_level),
    ]),
    headers: ["Item", "Category", "Stock", "Reorder"],
  };
}

async function buildLowStock() {
  const rows = await query<{
    name: string;
    category_name: string | null;
    stock_quantity: number;
    reorder_level: number;
    unit_symbol: string | null;
  }>(
    `SELECT i.name, c.name AS category_name, i.stock_quantity, i.reorder_level, u.symbol AS unit_symbol
     FROM items i
     LEFT JOIN categories c ON c.id = i.category_id
     LEFT JOIN units_of_measure u ON u.id = i.unit_id
     WHERE i.stock_quantity <= i.reorder_level
     ORDER BY i.stock_quantity ASC, i.name ASC
     LIMIT 18`
  );

  return {
    title: "Low Stock Report",
    subtitle: "Items that need procurement attention.",
    metrics: [`Items below reorder threshold: ${rows.length}`],
    sectionTitle: "Low Stock Items",
    rows: rows.map((row) => [
      row.name,
      row.category_name || "-",
      `${Number(row.stock_quantity)} ${row.unit_symbol || ""}`.trim(),
      String(row.reorder_level),
    ]),
    headers: ["Item", "Category", "Stock", "Reorder"],
  };
}

async function buildTransactionHistory() {
  const rows = await query<{
    item_name: string;
    transaction_type: string;
    quantity: number;
    reference_type: string | null;
    transaction_date: string;
  }>(
    `SELECT i.name AS item_name, st.transaction_type, st.quantity, st.reference_type, st.transaction_date
     FROM stock_transactions st
     JOIN items i ON i.id = st.item_id
     ORDER BY st.transaction_date DESC, st.id DESC
     LIMIT 18`
  );

  return {
    title: "Stock Transaction History Report",
    subtitle: "Recent stock receipts and stock issues.",
    metrics: [`Recent transactions listed: ${rows.length}`],
    sectionTitle: "Recent Stock Activity",
    rows: rows.map((row) => [
      row.item_name,
      row.transaction_type,
      String(row.quantity),
      row.reference_type || "-",
      new Date(row.transaction_date).toLocaleDateString(),
    ]),
    headers: ["Item", "Type", "Qty", "Reference", "Date"],
  };
}

async function loadReport(type: ReportType) {
  if (type === "inventory-summary") return buildInventorySummary();
  if (type === "low-stock") return buildLowStock();
  if (type === "transaction-history") return buildTransactionHistory();
  throw new ApiError(400, "Invalid report type");
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const type = request.nextUrl.searchParams.get("type") as ReportType | null;

    if (!type) {
      throw new ApiError(400, "Report type is required");
    }

    const report = await loadReport(type);
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const { width, height } = page.getSize();
    let y = height - 50;

    page.drawRectangle({ x: 36, y: height - 90, width: width - 72, height: 54, color: rgb(0.95, 0.97, 1) });
    page.drawText(report.title, { x: 50, y, size: 20, font: boldFont, color: rgb(0.11, 0.16, 0.31) });
    y = drawWrappedText(page, report.subtitle, 50, y - 24, width - 100, regularFont, 11, rgb(0.32, 0.36, 0.45));
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: 50,
      y: y - 8,
      size: 10,
      font: regularFont,
      color: rgb(0.38, 0.42, 0.5),
    });

    y -= 50;
    report.metrics.forEach((metric) => {
      page.drawText(metric, { x: 50, y, size: 11, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
      y -= 18;
    });

    y -= 12;
    page.drawText(report.sectionTitle, { x: 50, y, size: 14, font: boldFont, color: rgb(0.11, 0.16, 0.31) });
    y -= 22;

    const left = 50;
    const colWidths = report.headers.length === 5 ? [200, 120, 60, 120, 90] : [250, 180, 120, 100];
    const rowHeight = 22;

    page.drawRectangle({ x: left, y: y - 4, width: colWidths.reduce((sum, value) => sum + value, 0), height: rowHeight, color: rgb(0.88, 0.92, 0.98) });
    let currentX = left + 8;
    report.headers.forEach((header, index) => {
      page.drawText(header, { x: currentX, y: y + 4, size: 10, font: boldFont, color: rgb(0.11, 0.16, 0.31) });
      currentX += colWidths[index];
    });

    y -= 28;

    for (const row of report.rows.length ? report.rows : [["No data available", "-", "-", "-"]]) {
      currentX = left + 8;
      page.drawRectangle({
        x: left,
        y: y - 4,
        width: colWidths.reduce((sum, value) => sum + value, 0),
        height: rowHeight,
        borderColor: rgb(0.88, 0.9, 0.93),
        borderWidth: 1,
      });

      row.forEach((cell, index) => {
        const value = String(cell).slice(0, 34);
        page.drawText(value, { x: currentX, y: y + 4, size: 9, font: regularFont, color: rgb(0.12, 0.12, 0.12) });
        currentX += colWidths[index] || 100;
      });

      y -= rowHeight;
      if (y < 60) break;
    }

    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${type}-report.pdf"`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
