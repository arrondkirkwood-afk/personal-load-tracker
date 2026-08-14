const assert = require('assert');
const path = require('path');

global.ExcelJS = require(path.resolve(__dirname, '..', 'vendor', 'exceljs.min.js'));
const { createProfessionalWorkbook, safeText, typedValue } = require('../professional-export.js');

async function verifyWorkbook(kind, result, expectedSheetName, expectedTableName) {
  const workbook = createProfessionalWorkbook(kind, result, { generatedAt: new Date('2026-08-13T18:00:00Z') });
  assert.deepStrictEqual(workbook.worksheets.map((sheet) => sheet.name), ['Summary', expectedSheetName]);

  const summary = workbook.getWorksheet('Summary');
  const detail = workbook.getWorksheet(expectedSheetName);
  assert.strictEqual(summary.views[0].showGridLines, false, 'summary sheet hides default gridlines');
  assert.strictEqual(detail.views[0].state, 'frozen', 'detail sheet freezes its title and filter rows');
  assert.strictEqual(detail.views[0].ySplit, 5, 'detail sheet freezes through the table header');
  assert.strictEqual(detail.views[0].xSplit, 2, 'detail sheet keeps key columns visible while scrolling');
  assert.ok(detail.getTable(expectedTableName), 'detail records are stored in an Excel table with filters');
  assert.strictEqual(detail.getCell('A6').value instanceof Date, true, 'dates are typed Excel date values');
  assert.strictEqual(detail.getCell('A6').numFmt, 'yyyy-mm-dd', 'dates have an explicit readable number format');
  assert.ok(detail.getRow(5).height >= 30, 'wrapped table headers have enough height');
  assert.strictEqual(detail.pageSetup.orientation, 'landscape', 'wide detail report prints in landscape');
  assert.strictEqual(detail.pageSetup.fitToWidth, 1, 'wide detail report fits to one printed page width');
  assert.strictEqual(detail.headerFooter.oddFooter.includes('Page &P of &N'), true, 'printed report includes page numbering');

  const bytes = await workbook.xlsx.writeBuffer();
  assert.ok(bytes.byteLength > 5000, 'workbook serializes as a real XLSX file');
  const reopened = new global.ExcelJS.Workbook();
  await reopened.xlsx.load(bytes);
  assert.deepStrictEqual(reopened.worksheets.map((sheet) => sheet.name), ['Summary', expectedSheetName]);
  assert.ok(reopened.getWorksheet(expectedSheetName).getTable(expectedTableName), 'Excel table survives XLSX serialization');
}

(async function run() {
  assert.strictEqual(safeText('=HYPERLINK("bad")'), "'=HYPERLINK(\"bad\")", 'Excel formula injection is neutralized');
  assert.strictEqual(typedValue('loads', 'Ticket #', '0070041'), '0070041', 'identifier leading zeroes are preserved');
  assert.strictEqual(typedValue('loads', 'Total load pay', '92.75'), 92.75, 'money is stored as a number');

  await verifyWorkbook('loads', {
    headers: ['Date', 'Load #', 'Status', 'Ticket #', 'Gross barrels', 'Loaded miles', 'Paid wait hours', 'Total load pay', 'Notes'],
    rows: [['2026-08-13', '1', 'Completed Load', '0070041', 191, 41, 0.25, 92.75, '=HYPERLINK("bad")']],
    duplicateRowsRemoved: 2
  }, 'Load Log', 'LoadLogTable');

  await verifyWorkbook('earnings', {
    headers: ['Date', 'Completed loads', 'Rejects', 'Gross barrels', 'Loaded miles', 'Duty hours', 'Total estimated earnings', 'Effective hourly earnings', 'Notes'],
    rows: [['2026-08-13', 5, 0, 955, 205, 12.5, 510.25, 40.82, 'Professional daily note']],
    duplicateRowsRemoved: 1
  }, 'Daily Earnings', 'DailyEarningsTable');

  console.log('Professional Excel workbook tests passed.');
}()).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
