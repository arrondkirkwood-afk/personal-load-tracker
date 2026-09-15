from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly 1 match, found {count}: {old[:100]!r}')
    p.write_text(text.replace(old, new, 1))


def replace_all(path, old, new, minimum=1):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f'{path}: expected at least {minimum} matches, found {count}: {old!r}')
    p.write_text(text.replace(old, new))


# Core calculation: positive = overage, negative = shortage.
replace_once('script.js', 'const APP_VERSION = "1.19.0";', 'const APP_VERSION = "1.19.1";')
replace_once(
    'script.js',
    """  if (rounded > 0) {
    return `Shortage: ${rounded.toFixed(2)} bbl`;
  }
  if (rounded < 0) {
    return `Overage: ${Math.abs(rounded).toFixed(2)} bbl`;
  }""",
    """  if (rounded > 0) {
    return `Overage: +${rounded.toFixed(2)} bbl`;
  }
  if (rounded < 0) {
    return `Shortage: -${Math.abs(rounded).toFixed(2)} bbl`;
  }""",
)
replace_once(
    'script.js',
    """  if (rounded > 0) {
    return `Short by ${rounded.toFixed(2)} barrels`;
  }

  if (rounded < 0) {
    return `Over by ${Math.abs(rounded).toFixed(2)} barrels`;
  }""",
    """  if (rounded > 0) {
    return `Over by ${rounded.toFixed(2)} barrels`;
  }

  if (rounded < 0) {
    return `Short by ${Math.abs(rounded).toFixed(2)} barrels`;
  }""",
)
replace_once(
    'script.js',
    '? values.grossBarrels - barrelsOffloaded\n    : null;',
    '? barrelsOffloaded - values.grossBarrels\n    : null;',
)
replace_once(
    'script.js',
    """function formatCsvNumber(value, decimals = 2) {
  return isFiniteNumber(value) ? value.toFixed(decimals) : '';
}
""",
    """function formatCsvNumber(value, decimals = 2) {
  return isFiniteNumber(value) ? value.toFixed(decimals) : '';
}

function formatSignedCsvNumber(value, decimals = 2) {
  if (!isFiniteNumber(value)) {
    return '';
  }

  const rounded = Number(value.toFixed(decimals));
  if (rounded > 0) {
    return `+${rounded.toFixed(decimals)}`;
  }
  return rounded.toFixed(decimals);
}
""",
)
replace_once('script.js', '      formatCsvNumber(load.differenceVsGrossBarrels),', '      formatSignedCsvNumber(load.differenceVsGrossBarrels),')
replace_once('script.js', '      formatCsvNumber(record.totalDifferenceVsGrossBarrels),', '      formatSignedCsvNumber(record.totalDifferenceVsGrossBarrels),')

# Professional XLSX: explicitly show plus signs for overages.
replace_once(
    'professional-export.js',
    """      if (types.decimals?.includes(header)) applyColumnFormat(sheet, columnNumber, '#,##0.00;[Red]-#,##0.00', 6, finalRow);""",
    """      if (header === 'Difference barrels') applyColumnFormat(sheet, columnNumber, '+#,##0.00;[Red]-#,##0.00;0.00', 6, finalRow);
      else if (types.decimals?.includes(header)) applyColumnFormat(sheet, columnNumber, '#,##0.00;[Red]-#,##0.00', 6, finalRow);""",
)

# Complete workbook Load Source: same signed display convention.
replace_once(
    'complete-workbook-export.js',
    """    const formats = { currency: '$#,##0.00;[Red]-$#,##0.00', number: '#,##0.00', integer: '#,##0', percent: '0.0%', hours: '0.00', date: 'yyyy-mm-dd' };""",
    """    const formats = { currency: '$#,##0.00;[Red]-$#,##0.00', number: '#,##0.00', signed: '+#,##0.00;[Red]-#,##0.00;0.00', integer: '#,##0', percent: '0.0%', hours: '0.00', date: 'yyyy-mm-dd' };""",
)
replace_once(
    'complete-workbook-export.js',
    """    for(let row=6;row<=Math.max(6,typed.length+5);row+=1) formatCell(sheet.getCell(row,1),'date');
    return sheet;""",
    """    const finalRow = Math.max(6,typed.length+5);
    for(let row=6;row<=finalRow;row+=1) formatCell(sheet.getCell(row,1),'date');
    const differenceColumn = result.headers.indexOf('Difference barrels') + 1;
    if (differenceColumn > 0) {
      for(let row=6;row<=finalRow;row+=1) formatCell(sheet.getCell(row,differenceColumn),'signed');
    }
    return sheet;""",
)

# Regression expectations now follow: offloaded - gross.
replace_once(
    'tests/regression.test.js',
    """assert.strictEqual(operationalLoad.differenceVsGrossBarrels, 1.5, 'metered difference equals gross barrels minus offloaded barrels');
assert.strictEqual(operationalLoad.offloadStatus, 'Short by 1.50 barrels', 'positive metered difference is labeled as shortage');""",
    """assert.strictEqual(operationalLoad.differenceVsGrossBarrels, -1.5, 'metered difference equals offloaded barrels minus gross barrels');
assert.strictEqual(operationalLoad.offloadStatus, 'Short by 1.50 barrels', 'negative metered difference is labeled as shortage');
assert.strictEqual(context.formatMeteredDifference(operationalLoad.differenceVsGrossBarrels), 'Shortage: -1.50 bbl', 'shortage display includes an explicit minus sign');
const overageLoad = context.calculateDerived({ ...loadValues({ grossBarrels: 180, startMeterReading: 1000, endMeterReading: 1181.5 }) });
assert.strictEqual(overageLoad.differenceVsGrossBarrels, 1.5, 'overage is stored as a positive difference');
assert.strictEqual(overageLoad.offloadStatus, 'Over by 1.50 barrels', 'positive metered difference is labeled as overage');
assert.strictEqual(context.formatMeteredDifference(overageLoad.differenceVsGrossBarrels), 'Overage: +1.50 bbl', 'overage display includes an explicit plus sign');""",
)

# Bump the PWA shell so installed copies receive this correction.
replace_once('service-worker.js', "const APP_VERSION = '1.19.0';", "const APP_VERSION = '1.19.1';")
replace_all('service-worker.js', 'v=1.19.0', 'v=1.19.1', minimum=4)
replace_all('index.html', '1.19.0', '1.19.1', minimum=4)
replace_all('manifest.json', '1.19.0', '1.19.1', minimum=1)
replace_all('README.md', '1.19.0', '1.19.1', minimum=1)
