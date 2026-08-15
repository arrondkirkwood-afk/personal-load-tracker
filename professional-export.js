(function (root, factory) {
  const api = factory(root);

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.LoadTrackerProfessionalExport = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const COLORS = {
    navy: '17324D',
    teal: '137C8B',
    paleTeal: 'E8F3F4',
    paleBlue: 'EDF3F8',
    gold: 'D6A84B',
    white: 'FFFFFF',
    ink: '23313D',
    muted: '5F6F7B',
    border: 'CFD9E2'
  };

  const LOAD_SHEET = 'Load Log';
  const EARNINGS_SHEET = 'Daily Earnings';

  const COLUMN_TYPES = {
    loads: {
      dates: ['Date'],
      currency: ['Base / reject pay', 'Wait pay', 'Total load pay'],
      decimals: ['Gross barrels', 'Offloaded barrels', 'Difference barrels', 'Paid wait hours'],
      oneDecimal: ['Loaded miles', 'Rerouted miles', 'Deadhead miles'],
      text: ['Load #', 'Ticket #', 'BOL #', 'Jotform #', 'Truck', 'Trailer']
    },
    earnings: {
      dates: ['Date'],
      currency: [
        'Completed-load pay', 'Reject pay', 'Wait pay', 'Per diem', 'Sleeper', 'Trainer',
        'Other hourly pay', 'Vacation pay', 'Total estimated earnings', 'Effective hourly earnings'
      ],
      decimals: ['Gross barrels', 'Duty hours'],
      oneDecimal: ['Loaded miles', 'Rerouted miles', 'Deadhead miles'],
      integers: ['Completed loads', 'Rejects']
    }
  };

  function excelLibrary() {
    if (!root?.ExcelJS?.Workbook) {
      throw new Error('Excel workbook support is unavailable. Refresh the app and try again.');
    }
    return root.ExcelJS;
  }

  function safeText(value) {
    const valueText = value == null ? '' : String(value);
    return /^[=+\-@]/.test(valueText) ? `'${valueText}` : valueText;
  }

  function excelDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return safeText(value);
    return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12));
  }

  function typedValue(kind, header, value) {
    const types = COLUMN_TYPES[kind];
    if (types.dates?.includes(header)) return excelDate(value);
    if (types.text?.includes(header)) return safeText(value);
    if (types.currency?.includes(header) || types.decimals?.includes(header)
      || types.oneDecimal?.includes(header) || types.integers?.includes(header)) {
      const numericValue = Number(value);
      return value === '' || !Number.isFinite(numericValue) ? null : numericValue;
    }
    return typeof value === 'string' ? safeText(value) : value;
  }

  function total(rows, headers, header) {
    const index = headers.indexOf(header);
    if (index < 0) return 0;
    return rows.reduce((sum, row) => {
      const value = Number(row[index]);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }

  function count(rows, headers, header, expected) {
    const index = headers.indexOf(header);
    if (index < 0) return 0;
    return rows.filter((row) => String(row[index] || '').toLowerCase() === expected.toLowerCase()).length;
  }

  function lastDataRow(result) {
    return Math.max(6, result.rows.length + 5);
  }

  function summaryMetrics(kind, result) {
    const dataSheet = kind === 'loads' ? LOAD_SHEET : EARNINGS_SHEET;
    const headers = result.headers;
    const rows = result.rows;
    const finalRow = lastDataRow(result);
    const rangeFor = (header) => {
      const column = headers.indexOf(header) + 1;
      const letters = columnLetters(column);
      return `'${dataSheet}'!$${letters}$6:$${letters}$${finalRow}`;
    };

    if (kind === 'loads') {
      return [
        ['Exported load rows', rows.length, 'integer'],
        ['Duplicate-looking rows omitted', result.duplicateRowsRemoved || 0, 'integer'],
        ['Completed loads', { formula: `COUNTIF(${rangeFor('Status')},"Completed Load")`, result: count(rows, headers, 'Status', 'Completed Load') }, 'integer'],
        ['Rejected loads', { formula: `COUNTIF(${rangeFor('Status')},"Rejected Load")`, result: count(rows, headers, 'Status', 'Rejected Load') }, 'integer'],
        ['Gross barrels', { formula: `SUM(${rangeFor('Gross barrels')})`, result: total(rows, headers, 'Gross barrels') }, 'decimal'],
        ['Loaded miles', { formula: `SUM(${rangeFor('Loaded miles')})`, result: total(rows, headers, 'Loaded miles') }, 'decimal'],
        ['Paid wait hours', { formula: `SUM(${rangeFor('Paid wait hours')})`, result: total(rows, headers, 'Paid wait hours') }, 'decimal'],
        ['Total estimated load pay', { formula: `SUM(${rangeFor('Total load pay')})`, result: total(rows, headers, 'Total load pay') }, 'currency']
      ];
    }

    return [
      ['Exported workdays', rows.length, 'integer'],
      ['Duplicate/empty rows omitted', result.duplicateRowsRemoved || 0, 'integer'],
      ['Completed loads', { formula: `SUM(${rangeFor('Completed loads')})`, result: total(rows, headers, 'Completed loads') }, 'integer'],
      ['Rejected loads', { formula: `SUM(${rangeFor('Rejects')})`, result: total(rows, headers, 'Rejects') }, 'integer'],
      ['Gross barrels', { formula: `SUM(${rangeFor('Gross barrels')})`, result: total(rows, headers, 'Gross barrels') }, 'decimal'],
      ['Loaded miles', { formula: `SUM(${rangeFor('Loaded miles')})`, result: total(rows, headers, 'Loaded miles') }, 'decimal'],
      ['Duty hours', { formula: `SUM(${rangeFor('Duty hours')})`, result: total(rows, headers, 'Duty hours') }, 'decimal'],
      ['Total estimated earnings', { formula: `SUM(${rangeFor('Total estimated earnings')})`, result: total(rows, headers, 'Total estimated earnings') }, 'currency']
    ];
  }

  function columnLetters(columnNumber) {
    let value = columnNumber;
    let result = '';
    while (value > 0) {
      value -= 1;
      result = String.fromCharCode(65 + (value % 26)) + result;
      value = Math.floor(value / 26);
    }
    return result;
  }

  function addSummarySheet(workbook, kind, result, generatedAt) {
    const sheet = workbook.addWorksheet('Summary', {
      views: [{ showGridLines: false }],
      pageSetup: { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1 }
    });
    const title = kind === 'loads' ? 'Personal Oilfield Load Log' : 'Personal Oilfield Daily Earnings';
    const subtitle = kind === 'loads'
      ? 'Professional export summary — detailed records are on the Load Log sheet.'
      : 'Professional export summary — detailed records are on the Daily Earnings sheet.';

    sheet.mergeCells('A1:F1');
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: COLORS.white } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    sheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'left' };
    sheet.getRow(1).height = 36;

    sheet.mergeCells('A2:F2');
    sheet.getCell('A2').value = subtitle;
    sheet.getCell('A2').font = { name: 'Aptos', size: 10, color: { argb: COLORS.muted } };
    sheet.getCell('A2').alignment = { vertical: 'middle', wrapText: true };
    sheet.getRow(2).height = 28;

    sheet.getCell('A4').value = 'At a glance';
    sheet.getCell('A4').font = { name: 'Aptos Display', size: 13, bold: true, color: { argb: COLORS.navy } };

    const metrics = summaryMetrics(kind, result);
    metrics.forEach(([label, value, format], index) => {
      const row = index + 5;
      sheet.getCell(row, 1).value = label;
      sheet.getCell(row, 2).value = value;
      sheet.getCell(row, 1).font = { name: 'Aptos', bold: true, color: { argb: COLORS.ink } };
      sheet.getCell(row, 2).font = { name: 'Aptos', bold: true, color: { argb: COLORS.navy } };
      sheet.getCell(row, 1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? COLORS.white : COLORS.paleBlue } };
      sheet.getCell(row, 2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 ? COLORS.white : COLORS.paleBlue } };
      const summaryFormats = {
        currency: '$#,##0.00;[Red]-$#,##0.00',
        integer: '#,##0',
        decimal: '#,##0.00;[Red]-#,##0.00'
      };
      sheet.getCell(row, 2).numFmt = summaryFormats[format] || '#,##0.00';
      [sheet.getCell(row, 1), sheet.getCell(row, 2)].forEach((cell) => {
        cell.border = { bottom: { style: 'thin', color: { argb: COLORS.border } } };
      });
    });

    const noteRow = metrics.length + 7;
    sheet.mergeCells(`A${noteRow}:F${noteRow}`);
    sheet.getCell(`A${noteRow}`).value = 'This workbook is a presentation copy. It does not change tracker records. Duplicate-looking records are omitted only from the exported output.';
    sheet.getCell(`A${noteRow}`).alignment = { wrapText: true, vertical: 'middle' };
    sheet.getCell(`A${noteRow}`).font = { name: 'Aptos', size: 10, italic: true, color: { argb: COLORS.muted } };
    sheet.getCell(`A${noteRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } };
    sheet.getRow(noteRow).height = 34;

    sheet.getCell(`A${noteRow + 2}`).value = 'Generated';
    sheet.getCell(`B${noteRow + 2}`).value = generatedAt;
    sheet.getCell(`B${noteRow + 2}`).numFmt = 'mmm d, yyyy h:mm AM/PM';
    sheet.getCell(`A${noteRow + 3}`).value = 'Application version';
    sheet.getCell(`B${noteRow + 3}`).value = root.document?.getElementById?.('app-version')?.textContent || '';

    sheet.getColumn('A').width = 34;
    sheet.getColumn('B').width = 20;
    ['C', 'D', 'E', 'F'].forEach((column) => { sheet.getColumn(column).width = 12; });
    sheet.views = [{ state: 'frozen', ySplit: 4, showGridLines: false }];
    sheet.properties.pageSetUpPr = { fitToPage: true, autoPageBreaks: false };
    sheet.headerFooter.oddFooter = '&LOilfield Load & Workday Tracker&CPage &P of &N&RProfessional Export';
    return sheet;
  }

  function dataColumnWidth(header) {
    if (header === 'Notes') return 42;
    if (header === 'Pay period') return 26;
    if (['Pickup', 'Drop-off', 'Default dispatcher', 'Dispatcher'].includes(header)) return 24;
    if (header === 'Status') return 19;
    if (header === 'Date') return 13;
    if (header.includes('time') || header.includes('start') || header.includes('end')) return 14;
    if (header.includes('pay') || header.includes('earnings')) return 19;
    if (header.includes('barrels') || header.includes('miles') || header.includes('hours')) return 16;
    return Math.min(18, Math.max(11, header.length + 2));
  }

  function applyColumnFormat(sheet, columnNumber, format, firstRow, finalRow) {
    for (let row = firstRow; row <= finalRow; row += 1) {
      sheet.getCell(row, columnNumber).numFmt = format;
    }
  }

  function addDataSheet(workbook, kind, result, generatedAt) {
    const sheetName = kind === 'loads' ? LOAD_SHEET : EARNINGS_SHEET;
    const sheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', xSplit: 2, ySplit: 5, showGridLines: false }],
      pageSetup: {
        orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0,
        margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 }
      }
    });
    const title = kind === 'loads' ? 'Load Log Detail' : 'Daily Earnings Detail';
    const lastColumn = columnLetters(result.headers.length);

    sheet.mergeCells(`A1:${lastColumn}1`);
    sheet.getCell('A1').value = title;
    sheet.getCell('A1').font = { name: 'Aptos Display', size: 18, bold: true, color: { argb: COLORS.white } };
    sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.navy } };
    sheet.getCell('A1').alignment = { vertical: 'middle' };
    sheet.getRow(1).height = 34;

    sheet.mergeCells(`A2:${lastColumn}2`);
    sheet.getCell('A2').value = `Generated ${generatedAt.toLocaleString()} · ${result.rows.length} exported rows · ${result.duplicateRowsRemoved || 0} duplicate/empty rows omitted from this export only`;
    sheet.getCell('A2').font = { name: 'Aptos', size: 10, color: { argb: COLORS.muted } };
    sheet.getCell('A2').alignment = { wrapText: true, vertical: 'middle' };
    sheet.getRow(2).height = 26;

    sheet.mergeCells(`A3:${lastColumn}3`);
    sheet.getCell('A3').value = 'Use the filter arrows in the header row to sort or narrow the report. Identifier columns are stored as text so leading zeroes remain intact.';
    sheet.getCell('A3').font = { name: 'Aptos', size: 10, italic: true, color: { argb: COLORS.ink } };
    sheet.getCell('A3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleTeal } };
    sheet.getCell('A3').alignment = { wrapText: true, vertical: 'middle' };
    sheet.getRow(3).height = 26;

    const typedRows = result.rows.map((row) => row.map((value, index) => typedValue(kind, result.headers[index], value)));
    const tableRows = typedRows.length ? typedRows : [result.headers.map(() => null)];
    sheet.addTable({
      name: kind === 'loads' ? 'LoadLogTable' : 'DailyEarningsTable',
      ref: 'A5',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium2', showRowStripes: true, showColumnStripes: false },
      columns: result.headers.map((name) => ({ name })),
      rows: tableRows
    });

    sheet.getRow(5).height = 34;
    sheet.getRow(5).eachCell((cell) => {
      cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    });

    const finalRow = result.rows.length + 5;
    result.headers.forEach((header, index) => {
      const columnNumber = index + 1;
      const column = sheet.getColumn(columnNumber);
      column.width = dataColumnWidth(header);
      const types = COLUMN_TYPES[kind];
      if (types.dates?.includes(header)) applyColumnFormat(sheet, columnNumber, 'yyyy-mm-dd', 6, finalRow);
      if (types.currency?.includes(header)) applyColumnFormat(sheet, columnNumber, '$#,##0.00;[Red]-$#,##0.00', 6, finalRow);
      if (types.decimals?.includes(header)) applyColumnFormat(sheet, columnNumber, '#,##0.00;[Red]-#,##0.00', 6, finalRow);
      if (types.oneDecimal?.includes(header)) applyColumnFormat(sheet, columnNumber, '#,##0.0;[Red]-#,##0.0', 6, finalRow);
      if (types.integers?.includes(header)) applyColumnFormat(sheet, columnNumber, '#,##0', 6, finalRow);
      if (types.text?.includes(header)) applyColumnFormat(sheet, columnNumber, '@', 6, finalRow);
    });

    for (let row = 6; row <= finalRow; row += 1) {
      const notesColumn = result.headers.indexOf('Notes') + 1;
      const hasNotes = notesColumn > 0 && String(sheet.getCell(row, notesColumn).value || '').trim();
      sheet.getRow(row).height = hasNotes ? 36 : 20;
      sheet.getRow(row).eachCell((cell, columnNumber) => {
        const header = result.headers[columnNumber - 1];
        cell.font = { name: 'Aptos', size: 10, color: { argb: COLORS.ink } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: typeof cell.value === 'number' || cell.value instanceof Date ? 'right' : 'left',
          wrapText: header === 'Notes'
        };
      });
    }

    sheet.autoFilter = { from: 'A5', to: `${lastColumn}${Math.max(5, finalRow)}` };
    sheet.properties.pageSetUpPr = { fitToPage: true, autoPageBreaks: false };
    sheet.pageSetup.printTitlesRow = '1:5';
    sheet.headerFooter.oddFooter = '&LOilfield Load & Workday Tracker&CPage &P of &N&RProfessional Export';
    return sheet;
  }

  function createProfessionalWorkbook(kind, result, options = {}) {
    const ExcelJS = excelLibrary();
    const workbook = new ExcelJS.Workbook();
    const generatedAt = options.generatedAt instanceof Date ? options.generatedAt : new Date();
    workbook.creator = 'Oilfield Load & Workday Tracker';
    workbook.lastModifiedBy = 'Oilfield Load & Workday Tracker';
    workbook.created = generatedAt;
    workbook.modified = generatedAt;
    workbook.calcProperties.fullCalcOnLoad = true;
    workbook.calcProperties.forceFullCalc = true;
    workbook.calcProperties.calcMode = 'auto';
    workbook.properties.date1904 = false;

    addSummarySheet(workbook, kind, result, generatedAt);
    addDataSheet(workbook, kind, result, generatedAt);
    return workbook;
  }

  function downloadBlob(filename, data) {
    const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function downloadProfessionalWorkbook(kind, result, dateStamp) {
    const workbook = createProfessionalWorkbook(kind, result);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = kind === 'loads'
      ? `personal-oilfield-load-log-${dateStamp}.xlsx`
      : `personal-oilfield-daily-earnings-${dateStamp}.xlsx`;
    downloadBlob(filename, buffer);
    return filename;
  }

  return {
    COLUMN_TYPES,
    createProfessionalWorkbook,
    downloadProfessionalWorkbook,
    safeText,
    typedValue
  };
}));
