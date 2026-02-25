import ExcelJS from 'exceljs';
import { Payment } from '../models/Payment';
import { Shipment } from '../models/Shipment';

// ─── Helpers ────────────────────────────────────────────────────────────────

const COL_HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1E3A5F' },
};

const SUMMARY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE8F5E9' },
};

const DANGER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFCE4EC' },
};

const WARNING_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF3E0' },
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
   * Reporte de Pagos — resumen con fórmulas Excel (SUM, COUNTA)
   */
  async generatePaymentsReport(filters: {
    startDate?: string;
    endDate?: string;
    paymentDate?: string;
  }): Promise<ExcelJS.Buffer> {

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

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Teo Vale Sistema';
    wb.created = new Date();

    const ws = wb.addWorksheet('Reporte de Pagos', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // Title block
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

    // Row 5 = spacer; data starts at row 6
    ws.getRow(5).height = 4;
    const DATA_START = 6;

    payments.forEach((p, idx) => {
      const row = ws.addRow({
        num: idx + 1,
        client: (p.client as any)?.fullName ?? '-',
        amount: p.amountPaid ?? 0,
        date: formatDate(p.paymentDate?.toString()),
        time: p.paymentTime ?? '-',
        registeredBy: (p.registeredBy as any)?.fullName ?? '-',
      });

      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        });
      }

      const amountCell = row.getCell('amount');
      amountCell.numFmt = '"S/ "#,##0.00';
      amountCell.font = { bold: true, color: { argb: 'FF1B5E20' } };
      amountCell.alignment = { horizontal: 'right' };
      row.getCell('num').alignment = { horizontal: 'center' };
      row.getCell('date').alignment = { horizontal: 'center' };
      row.getCell('time').alignment = { horizontal: 'center' };
      row.height = 22;
    });

    // ── Summary with formulas ─────────────────────────────────────────────────
    const DATA_END = DATA_START + payments.length - 1;
    const hasData = payments.length > 0;

    ws.addRow([]); // spacer

    // TOTAL COBRADO → SUM(C6:Cn)
    const totalRow = ws.addRow([]);
    totalRow.getCell('client').value = 'TOTAL COBRADO';
    totalRow.getCell('client').font = { bold: true, size: 12 };
    totalRow.getCell('client').alignment = { horizontal: 'right' };
    const totalCell = totalRow.getCell('amount');
    totalCell.value = hasData ? { formula: `SUM(C${DATA_START}:C${DATA_END})` } : 0;
    totalCell.numFmt = '"S/ "#,##0.00';
    totalCell.font = { bold: true, size: 13, color: { argb: 'FF1B5E20' } };
    totalCell.alignment = { horizontal: 'right' };
    totalRow.eachCell((cell) => { cell.fill = SUMMARY_FILL; });
    totalRow.height = 28;

    // TOTAL DE PAGOS → COUNTA(B6:Bn)
    const countRow = ws.addRow([]);
    countRow.getCell('client').value = 'TOTAL DE PAGOS';
    countRow.getCell('client').font = { bold: true, color: { argb: 'FF546E7A' } };
    countRow.getCell('client').alignment = { horizontal: 'right' };
    const countCell = countRow.getCell('amount');
    countCell.value = hasData ? { formula: `COUNTA(B${DATA_START}:B${DATA_END})` } : 0;
    countCell.font = { bold: true, color: { argb: 'FF546E7A' } };
    countCell.alignment = { horizontal: 'right' };
    countRow.height = 22;

    return await wb.xlsx.writeBuffer() as ExcelJS.Buffer;
  }

  /**
   * Reporte de Entregas — resumen con fórmulas Excel (SUM, COUNTA, COUNTIF)
   */
  async generateDeliveriesReport(filters: {
    deliveryDate?: string;
    startDate?: string;
    endDate?: string;
    paymentStatus?: string;
    status?: string;
  }): Promise<ExcelJS.Buffer> {

    const query: any = {};
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.status)        query.status = filters.status;

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

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Teo Vale Sistema';
    wb.created = new Date();

    const ws = wb.addWorksheet('Reporte de Entregas', {
      views: [{ state: 'frozen', ySplit: 5 }],
      pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true },
    });

    // Title block
    ws.mergeCells('A1:G1');
    const titleCell = ws.getCell('A1');
    titleCell.value = 'REPORTE DE ENTREGAS';
    titleCell.font = { bold: true, size: 16, color: { argb: 'FF1E3A5F' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(1).height = 36;

    ws.mergeCells('A2:G2');
    const subtitleCell = ws.getCell('A2');
    const dateParts: string[] = [];
    if (filters.deliveryDate)
      dateParts.push(`Fecha: ${formatDate(filters.deliveryDate)}`);
    else if (filters.startDate || filters.endDate)
      dateParts.push(`Período: ${filters.startDate ? formatDate(filters.startDate) : '—'} al ${filters.endDate ? formatDate(filters.endDate) : '—'}`);
    if (filters.paymentStatus) {
      const labels: Record<string, string> = { COMPLETED: 'Pagado', INCOMPLETE: 'Parcial', UNPAID: 'Sin pagar' };
      dateParts.push(`Estado de pago: ${labels[filters.paymentStatus] ?? filters.paymentStatus}`);
    }
    if (filters.status) dateParts.push(`Estado entrega: ${filters.status}`);
    subtitleCell.value = dateParts.length ? dateParts.join(' • ') : 'Todos los registros';
    subtitleCell.font = { size: 11, color: { argb: 'FF546E7A' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    ws.getRow(2).height = 24;

    ws.mergeCells('A3:G3');
    ws.getCell('A3').value = `Generado el: ${new Date().toLocaleString('es-PE')}`;
    ws.getCell('A3').font = { size: 9, italic: true, color: { argb: 'FF888888' } };
    ws.getCell('A3').alignment = { horizontal: 'right' };
    ws.getRow(3).height = 18;

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

    ws.getRow(5).height = 4; // spacer — data row 6 onwards

    const DATA_START = 6;

    const paymentStatusLabel = (s: string) =>
      s === 'COMPLETED' ? 'Pagado' : s === 'INCOMPLETE' ? 'Pago Parcial' : 'Sin Pagar';

    const deliveryStatusLabel = (s: string) =>
      s === 'DELIVERED' ? 'Entregado' : s === 'CANCELLED' ? 'Cancelado' : s;

    shipments.forEach((sh, idx) => {
      const pStatus = sh.paymentStatus ?? 'UNPAID';
      const dStatus = sh.status ?? '-';

      const row = ws.addRow({
        num: idx + 1,
        client: (sh.client as any)?.fullName ?? '-',
        deliveryDate: formatDate(sh.deliveryDate?.toString()),
        amount: sh.amount ?? 0,
        amountPaid: sh.amountPaid ?? 0,
        paymentStatus: paymentStatusLabel(pStatus),
        status: deliveryStatusLabel(dStatus),
      });

      if (idx % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        });
      }

      const amountCell = row.getCell('amount');
      amountCell.numFmt = '"S/ "#,##0.00';
      amountCell.font = { bold: true };
      amountCell.alignment = { horizontal: 'right' };

      const paidCell = row.getCell('amountPaid');
      paidCell.numFmt = '"S/ "#,##0.00';
      paidCell.font = { color: { argb: 'FF1B5E20' } };
      paidCell.alignment = { horizontal: 'right' };

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

    // ── Summary with Excel formulas ───────────────────────────────────────────
    // Column map: A=num B=client C=deliveryDate D=amount E=amountPaid F=paymentStatus G=status
    const DATA_END = DATA_START + shipments.length - 1;
    const hasData = shipments.length > 0;

    ws.addRow([]); // spacer

    // Section header
    const sumTitleRow = ws.addRow(['', 'RESUMEN DEL REPORTE']);
    ws.mergeCells(`B${sumTitleRow.number}:G${sumTitleRow.number}`);
    sumTitleRow.getCell('client').font = { bold: true, size: 13, color: { argb: 'FF1E3A5F' } };
    sumTitleRow.getCell('client').alignment = { horizontal: 'left' };
    sumTitleRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
    });
    sumTitleRow.height = 26;

    /** Generic helper to add a formula summary row */
    const addFormulaRow = (
      label: string,
      valueKey: string,
      formula: string,
      isAmount: boolean,
      fill?: ExcelJS.Fill,
    ) => {
      const r = ws.addRow([]);
      r.getCell('client').value = label;
      r.getCell('client').font = { bold: true, color: { argb: 'FF37474F' } };
      r.getCell('client').alignment = { horizontal: 'right' };

      const c = r.getCell(valueKey);
      c.value = hasData ? { formula } : 0;
      if (isAmount) {
        c.numFmt = '"S/ "#,##0.00';
      }
      c.font = { bold: true };
      c.alignment = { horizontal: isAmount ? 'right' : 'center' };

      if (fill) r.eachCell((cell) => { cell.fill = fill!; });
      r.height = 22;
      return r;
    };

    // Total entregas → COUNTA(B6:Bn)
    addFormulaRow(
      'Total entregas:',
      'amountPaid',
      `COUNTA(B${DATA_START}:B${DATA_END})`,
      false,
    );

    // Total monto facturado → SUM(D6:Dn)
    const totalFactRow = addFormulaRow(
      'Total monto facturado:',
      'amount',
      `SUM(D${DATA_START}:D${DATA_END})`,
      true,
      SUMMARY_FILL,
    );

    // Total cobrado → SUM(E6:En)
    const totalCobRow = addFormulaRow(
      'Total cobrado:',
      'amount',
      `SUM(E${DATA_START}:E${DATA_END})`,
      true,
      SUMMARY_FILL,
    );

    // Total pendiente → factRow.amount - cobRow.amount  (cross-row formula)
    const pendRow = ws.addRow([]);
    pendRow.getCell('client').value = 'Total pendiente (deuda):';
    pendRow.getCell('client').font = { bold: true, color: { argb: 'FF37474F' } };
    pendRow.getCell('client').alignment = { horizontal: 'right' };
    const pendCell = pendRow.getCell('amount');
    pendCell.value = hasData
      ? { formula: `D${totalFactRow.number}-D${totalCobRow.number}` }
      : 0;
    pendCell.numFmt = '"S/ "#,##0.00';
    pendCell.font = { bold: true };
    pendCell.alignment = { horizontal: 'right' };
    pendRow.eachCell((cell) => { cell.fill = DANGER_FILL; });
    pendRow.height = 22;

    ws.addRow([]); // spacer

    // Estado de pago counts → COUNTIF(F6:Fn, "texto")
    addFormulaRow(
      '✅ Pagado completo:',
      'amountPaid',
      `COUNTIF(F${DATA_START}:F${DATA_END},"Pagado")`,
      false,
    );
    addFormulaRow(
      '⚠️  Pago parcial:',
      'amountPaid',
      `COUNTIF(F${DATA_START}:F${DATA_END},"Pago Parcial")`,
      false,
      WARNING_FILL,
    );
    addFormulaRow(
      '❌ Sin pagar:',
      'amountPaid',
      `COUNTIF(F${DATA_START}:F${DATA_END},"Sin Pagar")`,
      false,
      DANGER_FILL,
    );
    addFormulaRow(
      '📦 Entregas realizadas:',
      'amountPaid',
      `COUNTIF(G${DATA_START}:G${DATA_END},"Entregado")`,
      false,
    );
    addFormulaRow(
      '🚫 Entregas canceladas:',
      'amountPaid',
      `COUNTIF(G${DATA_START}:G${DATA_END},"Cancelado")`,
      false,
      DANGER_FILL,
    );

    return await wb.xlsx.writeBuffer() as ExcelJS.Buffer;
  }
}
