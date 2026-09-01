(function () {
  'use strict';

  const DEFAULT_NAME = 'Arrond Kirkwood';
  const DEFAULT_NUMBER = '0135';
  const COLUMNS = ['date', 'ticket', 'lease', 'job', 'station', 'timeIn', 'timeOut', 'hours', 'total'];
  const COLUMN_LABELS = ['Date', 'Ticket #', 'Lease', 'Job Performed', 'Station', 'Time In', 'Time Out', 'Hours', 'Total'];
  const COLUMN_WIDTHS = [42, 52, 78, 120, 78, 48, 48, 42, 48];
  let previewRows = [];
  let previewRange = null;

  function dateParts(date) { return String(date || '').split('-').map(Number); }
  function localDate(date) { const [y, m, d] = dateParts(date); return y && m && d ? new Date(y, m - 1, d) : null; }
  function dateKey(date) { return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : ''; }
  function payPeriodFor(dateString) {
    const date = localDate(dateString) || new Date();
    const y = date.getFullYear(); const m = date.getMonth(); const day = date.getDate();
    return day <= 15
      ? { start: dateKey(new Date(y, m, 1)), end: dateKey(new Date(y, m, 15)) }
      : { start: dateKey(new Date(y, m, 16)), end: dateKey(new Date(y, m + 1, 0)) };
  }
  function inRange(date, range) { return date && date >= range.start && date <= range.end; }
  function clean(value) { return String(value ?? '').trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function hours(minutes) { return minutes > 0 ? (minutes / 60).toFixed(2) : ''; }
  function shortDate(value) { const [y, m, d] = dateParts(value); return y && m && d ? `${m}/${d}/${String(y).slice(-2)}` : clean(value); }
  function selectedDate() { return document.getElementById('daily-date')?.value || dateKey(new Date()); }
  function identity() {
    return {
      name: clean(appSettings?.timesheetEmployeeName) || DEFAULT_NAME,
      number: clean(appSettings?.timesheetEmployeeNumber) || DEFAULT_NUMBER
    };
  }
  function ticket(load) { return clean(load.ticketNumber) || clean(load.bolNumber); }
  function rowWarnings(row) {
    const warnings = [];
    if (!row.date) warnings.push('date');
    if (row.kind === 'load' && !row.ticket) warnings.push('ticket/BOL');
    if (row.kind === 'load' && !row.lease) warnings.push('lease');
    if (row.kind === 'load' && !row.station) warnings.push('station');
    if (row.hourly && (!row.timeIn || !row.timeOut)) warnings.push('time in/out');
    return warnings;
  }
  function makeRow(values) { const row = { ...values }; row.warnings = rowWarnings(row); return row; }

  function buildTimesheetRows(loads, paid, addOns, range) {
    const rows = [];
    const byDate = new Map();
    loads.filter((load) => inRange(load.loadDate, range)).forEach((load) => {
      if (!byDate.has(load.loadDate)) byDate.set(load.loadDate, []);
      byDate.get(load.loadDate).push(load);
    });
    [...byDate.keys()].sort().forEach((date) => {
      const dayLoads = byDate.get(date);
      const addOn = addOns?.[date] || {};
      const perDiem = dayLoads.length > 0 || paid.some((item) => item.workDate === date && item.category === 'Office Time');
      dayLoads.forEach((load, index) => rows.push(makeRow({
        kind: 'load', hourly: false, sourceId: load.id, date: shortDate(date),
        ticket: ticket(load), lease: clean(load.leaseNumber) || clean(load.pickupLocation),
        job: index === 0 ? `${dayLoads.length} ${dayLoads.length === 1 ? 'Load' : 'Loads'}${perDiem ? ' / Per Diem' : ''}` : '',
        station: clean(load.dropoffLocation), timeIn: index === 0 ? clean(addOn.shiftStartTime) : '',
        timeOut: index === dayLoads.length - 1 ? clean(addOn.shiftEndTime) : '', hours: '', total: ''
      })));
      dayLoads.forEach((load) => {
        const paidWait = number(load.paidPickupWaitMinutes) + number(load.paidDropoffWaitMinutes);
        if (paidWait > 0) rows.push(makeRow({ kind: 'wait', hourly: true, sourceId: load.id, date: shortDate(date), ticket: ticket(load), lease: clean(load.pickupLocation), job: 'Paid Wait Time', station: clean(load.dropoffLocation), timeIn: '', timeOut: '', hours: hours(paidWait), total: hours(paidWait) }));
        if (number(load.deadheadMiles) > 0 || number(load.deadheadTravelMinutes) > 0) rows.push(makeRow({ kind: 'deadhead', hourly: number(load.deadheadTravelMinutes) > 0, sourceId: load.id, date: shortDate(date), ticket: ticket(load), lease: clean(load.pickupLocation), job: `Deadhead${number(load.deadheadMiles) ? ` - ${number(load.deadheadMiles).toFixed(1)} mi` : ''}`, station: clean(load.dropoffLocation), timeIn: clean(load.deadheadStartTime), timeOut: clean(load.deadheadEndTime), hours: hours(number(load.deadheadTravelMinutes)), total: hours(number(load.deadheadTravelMinutes)) }));
      });
    });
    paid.filter((item) => inRange(item.workDate, range)).sort((a, b) => String(a.workDate).localeCompare(String(b.workDate))).forEach((item) => {
      const category = clean(item.category) || 'Other Hourly Work';
      const isHourly = category !== 'Vacation Time' && number(item.durationMinutes) > 0;
      rows.push(makeRow({ kind: 'activity', hourly: isHourly, sourceId: item.id, date: shortDate(item.workDate), ticket: '', lease: clean(item.location), job: clean(item.customCategory) || category, station: '', timeIn: clean(item.startTime), timeOut: clean(item.endTime), hours: isHourly ? hours(number(item.durationMinutes)) : '', total: isHourly ? hours(number(item.durationMinutes)) : '' }));
    });
    return rows.sort((a, b) => a.date.localeCompare(b.date) || (a.kind === 'load' ? -1 : 1));
  }

  function refreshPeriod() {
    const anchor = document.getElementById('timesheet-anchor-date');
    if (!anchor) return;
    if (!anchor.value) anchor.value = selectedDate();
    const range = payPeriodFor(anchor.value);
    document.getElementById('timesheet-period-start').value = range.start;
    document.getElementById('timesheet-period-end').value = range.end;
  }
  function renderPreview() {
    const body = document.getElementById('timesheet-preview-body');
    if (!body) return;
    body.innerHTML = previewRows.length ? previewRows.map((row, rowIndex) => `<tr class="${row.warnings.length ? 'has-warning' : ''}">${COLUMNS.map((key) => `<td contenteditable="true" data-row="${rowIndex}" data-field="${key}">${escapeHtml(row[key] || '')}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="9">No saved records in this pay period.</td></tr>';
    const warningRows = previewRows.filter((row) => row.warnings.length);
    document.getElementById('timesheet-warning-summary').textContent = warningRows.length ? `${warningRows.length} row${warningRows.length === 1 ? '' : 's'} need review: ${warningRows.map((row) => `${row.date || 'undated'} missing ${row.warnings.join(', ')}`).join('; ')}.` : '';
    document.getElementById('timesheet-hours-total').textContent = previewRows.reduce((sum, row) => sum + (row.hourly ? number(row.hours) : 0), 0).toFixed(2);
    document.getElementById('timesheet-preview').hidden = false;
  }
  function buildPreview() {
    refreshPeriod();
    previewRange = { start: document.getElementById('timesheet-period-start').value, end: document.getElementById('timesheet-period-end').value };
    previewRows = buildTimesheetRows(savedLoads || [], paidTimeRecords || [], dailyAddOns || {}, previewRange);
    renderPreview();
    document.getElementById('timesheet-status').textContent = `${previewRows.length} row${previewRows.length === 1 ? '' : 's'} prepared. Source records were not changed.`;
  }

  function pdfEscape(text) { return clean(text).replace(/[^\x20-\x7e]/g, '-').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function fit(text, width, size) { const max = Math.max(1, Math.floor(width / (size * .54))); const value = clean(text); return value.length > max ? `${value.slice(0, Math.max(1, max - 1))}.` : value; }
  function pdfText(x, y, text, size = 7, bold = false) { return `BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${pdfEscape(text)}) Tj ET\n`; }
  function pdfLine(x1, y1, x2, y2, width = .5) { return `${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`; }
  function buildPage(rows, pageNumber, pageCount, id, range, grandHours) {
    const left = 28; const right = 584; const rowHeight = 23; const tableTop = 690; const tableBottom = tableTop - rowHeight * (rows.length + 1);
    let out = '0 G 0 g\n';
    out += pdfText(306, 757, 'EMPLOYEE HOURLY WORK SCHEDULE', 14, true);
    out += pdfText(left, 738, `Employee Name: ${id.name}`, 9, true) + pdfText(395, 738, `Employee #: ${id.number}`, 9, true);
    out += pdfText(left, 722, `Beginning Date: ${shortDate(range.start)}`, 9) + pdfText(395, 722, `Ending Date: ${shortDate(range.end)}`, 9);
    let x = left; COLUMN_WIDTHS.forEach((w) => { out += pdfLine(x, tableTop, x, tableBottom); x += w; }); out += pdfLine(x, tableTop, x, tableBottom);
    for (let i = 0; i <= rows.length + 1; i += 1) out += pdfLine(left, tableTop - i * rowHeight, right, tableTop - i * rowHeight);
    x = left; COLUMN_LABELS.forEach((label, i) => { out += pdfText(x + 3, tableTop - 15, fit(label, COLUMN_WIDTHS[i] - 6, 6.7), 6.7, true); x += COLUMN_WIDTHS[i]; });
    rows.forEach((row, index) => { let cellX = left; const y = tableTop - rowHeight * (index + 1) - 15; COLUMNS.forEach((key, i) => { out += pdfText(cellX + 3, y, fit(row[key], COLUMN_WIDTHS[i] - 6, 6.5), 6.5); cellX += COLUMN_WIDTHS[i]; }); });
    const pageHours = rows.reduce((sum, row) => sum + (row.hourly ? number(row.hours) : 0), 0);
    out += pdfText(left, tableBottom - 18, `Hourly entries on this page: ${pageHours.toFixed(2)}`, 8, true);
    if (pageNumber === pageCount) out += pdfText(355, tableBottom - 18, `TOTAL HOURS: ${grandHours.toFixed(2)}`, 10, true);
    out += pdfText(492, 22, `Page ${pageNumber} of ${pageCount}`, 7);
    return out;
  }
  function buildPdf(rows, id, range) {
    const perPage = 24; const chunks = []; for (let i = 0; i < Math.max(rows.length, 1); i += perPage) chunks.push(rows.slice(i, i + perPage));
    const objects = []; const add = (body) => { objects.push(body); return objects.length; };
    const catalog = add(''); const pages = add(''); const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'); const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const grandHours = rows.reduce((sum, row) => sum + (row.hourly ? number(row.hours) : 0), 0);
    const pageIds = chunks.map((chunk, index) => { const stream = buildPage(chunk, index + 1, chunks.length, id, range, grandHours); const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`); return add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`); });
    objects[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R >>`; objects[pages - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    let pdf = '%PDF-1.4\n'; const offsets = [0]; objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; }); const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([pdf], { type: 'application/pdf' });
  }
  function downloadPdf() {
    if (!previewRange) buildPreview();
    const blob = buildPdf(previewRows, identity(), previewRange);
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `timesheet-${previewRange.start}-to-${previewRange.end}.pdf`; link.rel = 'noopener'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    document.getElementById('timesheet-status').textContent = 'PDF prepared. On iPhone, use the browser download or Share sheet to save it to Files.';
    return blob;
  }
  function loadSettings() {
    const id = identity(); const name = document.getElementById('settings-timesheet-name'); const numberField = document.getElementById('settings-timesheet-number');
    if (name) name.value = id.name; if (numberField) numberField.value = id.number;
  }
  function saveIdentity() {
    appSettings = normalizeAppSettings({ ...appSettings, timesheetEmployeeName: clean(document.getElementById('settings-timesheet-name').value) || DEFAULT_NAME, timesheetEmployeeNumber: clean(document.getElementById('settings-timesheet-number').value) || DEFAULT_NUMBER });
    saveAppSettingsToStorage(); syncSettingsToCloud(); document.getElementById('timesheet-settings-status').textContent = 'Timesheet identity saved.';
  }
  function init() {
    refreshPeriod(); loadSettings();
    document.getElementById('timesheet-anchor-date')?.addEventListener('change', refreshPeriod);
    document.getElementById('preview-timesheet-button')?.addEventListener('click', buildPreview);
    document.getElementById('reset-timesheet-preview-button')?.addEventListener('click', buildPreview);
    document.getElementById('download-timesheet-button')?.addEventListener('click', downloadPdf);
    document.getElementById('save-timesheet-settings-button')?.addEventListener('click', saveIdentity);
    document.getElementById('timesheet-preview-body')?.addEventListener('change', (event) => { const cell = event.target.closest?.('[data-row][data-field]'); if (!cell) return; const row = previewRows[number(cell.dataset.row)]; row[cell.dataset.field] = cell.textContent.trim(); row.warnings = rowWarnings(row); renderPreview(); });
  }
  globalThis.TimesheetGenerator = { payPeriodFor, buildTimesheetRows, buildPdf, rowWarnings };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());
