import ExcelJS from 'exceljs';
import { Payment } from '../models/Payment';
import { Shipment } from '../models/Shipment';

// ─── Helpers ────────────────────────────────────────────────────────────────

const COL_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' },     // dark navy
};

const SUMMARY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE8F5E9' },     // soft green
};

const DANGER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFCE4EC' },     // soft red
};

const WARNING_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF3E0' },     // soft yellow
};

function applyHeaderStyle(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.fill = COL_HEADER_FILL;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFB0BECF' } },
    };
  });
  row.height = 32;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class ExcelService {

  /**
   * Reporte de Pagos por fecha
   * Columnas: N°, Cliente, Monto, Fecha, Hora, Registrado por
   * Resumen al final: total cobrado
   */
  async generatePaymentsReport(filters: {
    startDate?: string;
    endDate?: string;
    paymentDate?: string;
  }): Promise<ExcelJS.Buffer> {

    // ── Build query ──────────────────────────────────────────────────────────
    const query: any = {};

    if (filters.paymentDate) {
      const [y, m, d] = filters.paymentDate.split('-').map(Number);
      query.paymentDate = {
        $gte: new Date(y, m - 1, d, 0, 0, 0, 0),
        $lte: new Date(y, m - 1, d, 23, 59, 59, 999),
      };
    } else if (filters.startDate || filters.endDate) {
      query.paymentDate = {};
      if (filters.startDate) {
        const [y, m, d] = filters.startDate.split('-').map(Number);
        query.paymentDate.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (filters.endDate) {
        const [y, m, d] = filters.endDate.split('-').map(Number);
        query.paymentDate.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    const payments = await Payment.find(query)
      .populate('client', 'fullName')
      .populate('registeredBy', 'fullName')
      .sort({ paymentDate: 1 });

    // ── Workbook ──────────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Teo Vale Sistema';
    wb.created = new Date();

    const ws = wb.addWorksheet('Reporte de Pagos', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // ── Title block ───────────────────────────────────────────────────────────
    ws.mergeCells('A1:F1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'REPORTE DE PAGOS';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 36;

    ws.mergeCells('A2:F2');
    const subtitleCell = ws.getCell('A2');
    const dateLabel = filters.paymentDate
      ? `Fecha: ${formatDate(filters.paymentDate)}`
      : filters.startDate || filters.endDate
        ? `Período: ${filters.startDate ? formatDate(filters.startDate) : '—'} al ${filters.endDate ? formatDate(filters.endDate) : '—'}`
        : 'Todos los registros';
    subtitleCell.value = dateLabel;
    subtitleCell.font = { size: 11, color: { argb: 'FF546E7A' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 24;

    ws.mergeCells('A3:F3');
    ws.getCell('A3').value = `Generado el: ${new Date().toLocaleString('es-PE')}`;
    ws.getCell('A3').font = { size: 9, italic: true, color: { argb: 'FF888888' } };
    ws.getCell('A3').alignment = { horizontal: 'right' };
    ws.getRow(3).height = 18;

    // ── Header row ────────────────────────────────────────────────────────────
    ws.columns = [
      { key: 'num',          width: 7  },
      { key: 'client',       width: 30 },
      { key: 'amount',       width: 16 },
      { key: 'date',         width: 18 },
      { key: 'time',         width: 14 },
      { key: 'registeredBy', width: 28 },
    ];

    const headerRow = ws.getRow(4);
    headerRow.values = ['N°', 'Cliente', 'Monto (S/)', 'Fecha de Pago', 'Hora', 'Registrado por'];
    applyHeaderStyle(headerRow);

    // Spacer before data
    ws.getRow(5).height = 4;

    // ── Data rows ─────────────────────────────────────────────────────────────
    let totalAmount = 0;

    payments.forEach((p, idx) => {
      const client = (p.client as any)?.fullName ?? '-';
      const registeredBy = (p.registeredBy as any)?.fullName ?? '-';
      const amount = p.amountPaid ?? 0;
      totalAmount += amount;

      const row = ws.addRow({
        num: idx + 1,
        client,
        amount,
        date: formatDate(p.paymentDate?.toString()),
        time: p.paymentTime ?? '-',
        registeredBy,
      });

      // Alternate row background
      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        });
      }

      // Amount cell formatting
      const amountCell = row.getCell('amount');
      amountCell.numFmt = '"S/ "#,##0.00';
      amountCell.font = { bold: true, color: { argb: 'FF1B5E20' } };
      amountCell.alignment = { horizontal: 'right' };

      row.getCell('num').alignment = { horizontal: 'center' };
      row.getCell('date').alignment = { horizontal: 'center' };
      row.getCell('time').alignment = { horizontal: 'center' };
      row.height = 22;
    });

    // ── Summary rows ──────────────────────────────────────────────────────────
    ws.addRow([]); // spacer

    const totalRow = ws.addRow(['', 'TOTAL', totalAmount, '', '', '']);
    totalRow.getCell('num').value = '';
    const labelCell = totalRow.getCell('client');
    labelCell.value = 'TOTAL COBRADO';
    labelCell.font = { bold: true, size: 12 };
    labelCell.alignment = { horizontal: 'right' };

    const totalCell = totalRow.getCell('amount');
    totalCell.numFmt = '"S/ "#,##0.00';
    totalCell.font = { bold: true, size: 13, color: { argb: 'FF1B5E20' } };
    totalCell.alignment = { horizontal: 'right' };

    totalRow.eachCell((cell) => { cell.fill = SUMMARY_FILL; });
    totalRow.height = 28;

    const countRow = ws.addRow(['', `Total de pagos: ${payments.length}`, '', '', '', '']);
    countRow.getCell('client').font = { italic: true, color: { argb: 'FF546E7A' } };
    countRow.getCell('client').alignment = { horizontal: 'right' };

    return await wb.xlsx.writeBuffer() as ExcelJS.Buffer;
  }

  /**
   * Reporte de Entregas (Shipments)
   * Columnas: N°, Cliente, Fecha Entrega, Monto, Monto Pagado, Estado Pago, Estado Entrega
   * Resumen al final: total monto, total cobrado, total pendiente, conteos por estado
   */
  async generateDeliveriesReport(filters: {
    deliveryDate?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    status?: string;
  }): Promise<ExcelJS.Buffer> {

    // ── Build query ──────────────────────────────────────────────────────────
    const query: any = {};

    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.status) query.status = filters.status;

    if (filters.deliveryDate) {
      const [y, m, d] = filters.deliveryDate.split('-').map(Number);
      query.deliveryDate = {
        $gte: new Date(y, m - 1, d, 0, 0, 0, 0),
        $lte: new Date(y, m - 1, d, 23, 59, 59, 999),
      };
    } else if (filters.startDate || filters.endDate) {
      query.deliveryDate = {};
      if (filters.startDate) {
        const [y, m, d] = filters.startDate.split('-').map(Number);
        query.deliveryDate.$gte = new Date(y, m - 1, d, 0, 0, 0, 0);
      }
      if (filters.endDate) {
        const [y, m, d] = filters.endDate.split('-').map(Number);
        query.deliveryDate.$lte = new Date(y, m - 1, d, 23, 59, 59, 999);
      }
    }

    const shipments = await Shipment.find(query)
      .populate('client', 'fullName')
      .sort({ deliveryDate: 1, 'client.fullName': 1 });

    // ── Workbook ──────────────────────────────────────────────────────────────
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Teo Vale Sistema';
    wb.created = new Date();

    const ws = wb.addWorksheet('Reporte de Entregas', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // ── Title block ───────────────────────────────────────────────────────────
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'REPORTE DE ENTREGAS';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 36;

    ws.mergeCells('A2:G2');
    const subtitleCell = ws.getCell('A2');
    const parts: string[] = [];
    if (filters.deliveryDate) parts.push(`Fecha: ${formatDate(filters.deliveryDate)}`);
    else if (filters.startDate || filters.endDate)
      parts.push(`Período: ${filters.startDate ? formatDate(filters.startDate) : '—'} al ${filters.endDate ? formatDate(filters.endDate) : '—'}`);
    if (filters.paymentStatus) {
      const labels: Record<string, string> = { COMPLETED: 'Pagado', INCOMPLETE: 'Parcial', UNPAID: 'Sin pagar' };
      parts.push(`Estado de pago: ${labels[filters.paymentStatus] ?? filters.paymentStatus}`);
    }
    if (filters.status) parts.push(`Estado entrega: ${filters.status}`);
    subtitleCell.value = parts.length ? parts.join(' • ') : 'Todos los registros';
    subtitleCell.font = { size: 11, color: { argb: 'FF546E7A' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 24;

    ws.mergeCells('A3:G3');
    ws.getCell('A3').value = `Generado el: ${new Date().toLocaleString('es-PE')}`;
    ws.getCell('A3').font = { size: 9, italic: true, color: { argb: 'FF888888' } };
    ws.getCell('A3').alignment = { horizontal: 'right' };
    ws.getRow(3).height = 18;

    // ── Header row ────────────────────────────────────────────────────────────
    ws.columns = [
      { key: 'num',           width: 7  },
      { key: 'client',        width: 30 },
      { key: 'deliveryDate',  width: 18 },
      { key: 'amount',        width: 16 },
      { key: 'amountPaid',    width: 16 },
      { key: 'paymentStatus', width: 18 },
      { key: 'status',        width: 18 },
    ];

    const headerRow = ws.getRow(4);
    headerRow.values = ['N°', 'Cliente', 'Fecha Entrega', 'Monto (S/)', 'Monto Pagado (S/)', 'Estado Pago', 'Estado Entrega'];
    applyHeaderStyle(headerRow);

    ws.getRow(5).height = 4; // spacer

    // ── Data rows ─────────────────────────────────────────────────────────────
    let totalAmount = 0;
    let totalPaid = 0;
    let countCompleted = 0;
    let countIncomplete = 0;
    let countUnpaid = 0;
    let countDelivered = 0;
    let countCancelled = 0;

    const paymentStatusLabel = (s: string) =>
      s === 'COMPLETED' ? 'Pagado' : s === 'INCOMPLETE' ? 'Pago Parcial' : 'Sin Pagar';

    const deliveryStatusLabel = (s: string) =>
      s === 'DELIVERED' ? 'Entregado' : s === 'CANCELLED' ? 'Cancelado' : s;

    shipments.forEach((sh, idx) => {
      const client = (sh.client as any)?.fullName ?? '-';
      const amount = sh.amount ?? 0;
      const amountPaid = sh.amountPaid ?? 0;
      const pStatus = sh.paymentStatus ?? 'UNPAID';
      const dStatus = sh.status ?? '-';

      totalAmount += amount;
      totalPaid += amountPaid;
      if (pStatus === 'COMPLETED') countCompleted++;
      else if (pStatus === 'INCOMPLETE') countIncomplete++;
      else countUnpaid++;
      if (dStatus === 'DELIVERED') countDelivered++;
      else if (dStatus === 'CANCELLED') countCancelled++;

      const row = ws.addRow({
        num: idx + 1,
        client,
        deliveryDate: formatDate(sh.deliveryDate?.toString()),
        amount,
        amountPaid,
        paymentStatus: paymentStatusLabel(pStatus),
        status: deliveryStatusLabel(dStatus),
      });

      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        });
      }

      // Amount columns
      const amountCell = row.getCell('amount');
      amountCell.numFmt = '"S/ "#,##0.00';
      amountCell.font = { bold: true };
      amountCell.alignment = { horizontal: 'right' };

      const paidCell = row.getCell('amountPaid');
      paidCell.numFmt = '"S/ "#,##0.00';
      paidCell.font = { color: { argb: 'FF1B5E20' } };
      paidCell.alignment = { horizontal: 'right' };

      // Payment status cell coloring
      const psCell = row.getCell('paymentStatus');
      psCell.alignment = { horizontal: 'center' };
      if (pStatus === 'COMPLETED') {
        psCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        psCell.font = { bold: true, color: { argb: 'FF2E7D32' } };
      } else if (pStatus === 'INCOMPLETE') {
        psCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3E0' } };
        psCell.font = { bold: true, color: { argb: 'FFE65100' } };
      } else {
        psCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
        psCell.font = { bold: true, color: { argb: 'FFC62828' } };
      }

      // Delivery status coloring
      const dsCell = row.getCell('status');
      dsCell.alignment = { horizontal: 'center' };
      if (dStatus === 'DELIVERED') {
        dsCell.font = { color: { argb: 'FF2E7D32' } };
      } else if (dStatus === 'CANCELLED') {
        dsCell.fill = DANGER_FILL;
        dsCell.font = { color: { argb: 'FFC62828' } };
      }

      row.getCell('num').alignment = { horizontal: 'center' };
      row.getCell('deliveryDate').alignment = { horizontal: 'center' };
      row.height = 22;
    });

    // ── Summary section ───────────────────────────────────────────────────────
    ws.addRow([]);

    // Section title
    const sumTitleRow = ws.addRow(['', 'RESUMEN DEL REPORTE']);
    ws.mergeCells(`B${sumTitleRow.number}:G${sumTitleRow.number}`);
    sumTitleRow.getCell('client').font = { bold: true, size: 13, color: { argb: 'FF1E3A5F' } };
    sumTitleRow.getCell('client').alignment = { horizontal: 'left' };
    sumTitleRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    });
    sumTitleRow.height = 26;

    const totalDebt = totalAmount - totalPaid;

    const addSummaryRow = (label: string, value: string | number, isAmount = false, fill?: ExcelJS.Fill) => {
      const r = ws.addRow(['', label, isAmount ? value : '', '', isAmount ? '' : value, '', '']);
      r.getCell('client').font = { bold: true, color: { argb: 'FF37474F' } };
      r.getCell('client').alignment = { horizontal: 'right' };
      if (isAmount) {
        const c = r.getCell('amount');
        c.value = value;
        c.numFmt = '"S/ "#,##0.00';
        c.font = { bold: true };
        c.alignment = { horizontal: 'right' };
      } else {
        const c = r.getCell('amountPaid');
        c.value = value;
        c.alignment = { horizontal: 'center' };
        c.font = { bold: true };
      }
      if (fill) r.eachCell((cell) => { cell.fill = fill!; });
      r.height = 22;
    };

    addSummaryRow('Total entregas:', shipments.length);
    addSummaryRow('Total monto facturado:', totalAmount, true, SUMMARY_FILL);
    addSummaryRow('Total cobrado:', totalPaid, true, SUMMARY_FILL);
    addSummaryRow('Total pendiente (deuda):', totalDebt, true, totalDebt > 0 ? DANGER_FILL : SUMMARY_FILL);

    ws.addRow([]);

    addSummaryRow('✅ Pagado completo:', countCompleted);
    addSummaryRow('⚠️  Pago parcial:', countIncomplete);
    addSummaryRow('❌ Sin pagar:', countUnpaid);
    addSummaryRow('📦 Entregas realizadas:', countDelivered);
    addSummaryRow('🚫 Entregas canceladas:', countCancelled);

    return await wb.xlsx.writeBuffer() as ExcelJS.Buffer;
  }
}
