(function () {
  'use strict';

  const DEFAULT_NAME = 'Arrond Kirkwood';
  const DEFAULT_NUMBER = '0135';
  const COLUMNS = ['date', 'job', 'loads', 'rejects', 'perDiem', 'timeIn', 'timeOut', 'hours'];
  const COLUMN_LABELS = ['Date', 'Work Description', 'Loads', 'Rejects', 'Per Diem', 'Time In', 'Time Out', 'Hours'];
  const COLUMN_WIDTHS = [52, 220, 45, 45, 52, 48, 48, 56];
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
  function loadStatus(load) { return clean(load?.loadStatus || load?.status || load?.load_status).toLowerCase(); }
  function isCompleted(load) { const status = loadStatus(load); return status === 'completed load' || status === 'completed'; }
  function isReject(load) { const status = loadStatus(load); return status === 'reject' || status === 'rejected'; }
  function rowWarnings(row) {
    const warnings = [];
    if (!row.date) warnings.push('date');
    if (row.hourly && row.requiresClockTimes !== false && (!row.timeIn || !row.timeOut)) warnings.push('time in/out');
    if (number(row.needsReview) > 0) warnings.push('load status');
    return warnings;
  }
  function makeRow(values) {
    const row = { loads: '', rejects: '', perDiem: '', timeIn: '', timeOut: '', hours: '', ...values };
    row.warnings = rowWarnings(row);
    return row;
  }
  function activityDescription(item) {
    const category = clean(item.category) || 'Other Hourly Work';
    if (category === 'Vacation Time') return 'Vacation Day';
    const detail = clean(item.customCategoryName) || clean(item.customCategory) || clean(item.notes);
    if (!detail || detail.toLowerCase() === category.toLowerCase()) return category;
    return `${category} - ${detail}`;
  }
  function haulingDescription(completedCount, rejectCount, needsReviewCount, perDiem) {
    const parts = [];
    if (completedCount > 0) parts.push(`${completedCount} ${completedCount === 1 ? 'Load' : 'Loads'}`);
    if (rejectCount > 0) parts.push(`${rejectCount} ${rejectCount === 1 ? 'Reject' : 'Rejects'}`);
    if (needsReviewCount > 0) parts.push(`${needsReviewCount} Needs Review`);
    if (perDiem) parts.push('Per Diem');
    return parts.join(' / ') || 'Workday';
  }
  function rowRank(row) {
    if (row.kind === 'load') return 0;
    if (row.kind === 'wait' || row.kind === 'deadhead') return 1;
    if (row.kind === 'activity' && row.job === 'Vacation Day') return 3;
    return 2;
  }

  function buildTimesheetRows(loads, paid, addOns, range) {
    const rows = [];
    const byDate = new Map();
    loads.filter((load) => inRange(load.loadDate, range)).forEach((load) => {
      if (!byDate.has(load.loadDate)) byDate.set(load.loadDate, []);
      byDate.get(load.loadDate).push(load);
    });

    [...byDate.keys()].sort().forEach((date) => {
      const dayRecords = byDate.get(date);
      const completedLoads = dayRecords.filter((load) => isCompleted(load));
      const rejectedLoads = dayRecords.filter((load) => isReject(load));
      const reviewLoads = dayRecords.filter((load) => !isCompleted(load) && !isReject(load));
      const completedCount = completedLoads.length;
      const rejectCount = rejectedLoads.length;
      const needsReviewCount = reviewLoads.length;
      const perDiem = dayRecords.length > 0 || paid.some((item) => item.workDate === date && item.category === 'Office Time');

      rows.push(makeRow({
        kind: 'load', hourly: false, workDate: date,
        sourceId: dayRecords.map((load) => load.id).filter(Boolean).join(','),
        date: shortDate(date), job: haulingDescription(completedCount, rejectCount, needsReviewCount, perDiem),
        loads: completedCount ? String(completedCount) : '',
        rejects: rejectCount ? String(rejectCount) : '',
        needsReview: needsReviewCount,
        perDiem: perDiem ? 'Yes' : ''
      }));

      dayRecords.forEach((load) => {
        const paidWait = number(load.paidPickupWaitMinutes) + number(load.paidDropoffWaitMinutes);
        if (paidWait > 0) rows.push(makeRow({
          kind: 'wait', hourly: true, requiresClockTimes: false, workDate: date, sourceId: load.id, date: shortDate(date),
          job: 'Paid Wait Time', hours: hours(paidWait)
        }));
        if (number(load.deadheadMiles) > 0 || number(load.deadheadTravelMinutes) > 0) rows.push(makeRow({
          kind: 'deadhead', hourly: number(load.deadheadTravelMinutes) > 0, workDate: date, sourceId: load.id, date: shortDate(date),
          job: `Deadhead${number(load.deadheadMiles) ? ` - ${number(load.deadheadMiles).toFixed(1)} mi` : ''}`,
          timeIn: clean(load.deadheadStartTime), timeOut: clean(load.deadheadEndTime), hours: hours(number(load.deadheadTravelMinutes))
        }));
      });
    });

    paid.filter((item) => inRange(item.workDate, range))
      .sort((a, b) => String(a.workDate).localeCompare(String(b.workDate)))
      .forEach((item) => {
        const category = clean(item.category) || 'Other Hourly Work';
        const isVacation = category === 'Vacation Time';
        const isHourly = !isVacation && number(item.durationMinutes) > 0;
        const perDiemAlreadyShown = rows.some((row) => row.workDate === item.workDate && row.perDiem === 'Yes');
        const officePerDiem = category === 'Office Time' && !perDiemAlreadyShown;
        rows.push(makeRow({
          kind: 'activity', hourly: isHourly, workDate: item.workDate, sourceId: item.id, date: shortDate(item.workDate),
          job: activityDescription(item), loads: '', rejects: '', perDiem: officePerDiem ? 'Yes' : '',
          timeIn: isHourly ? clean(item.startTime) : '', timeOut: isHourly ? clean(item.endTime) : '',
          hours: isHourly ? hours(number(item.durationMinutes)) : ''
        }));
      });

    return rows.sort((a, b) => {
      const dateCompare = String(a.workDate || '').localeCompare(String(b.workDate || ''));
      if (dateCompare) return dateCompare;
      return rowRank(a) - rowRank(b);
    });
  }

  function refreshPeriod() {
    const anchor = document.getElementById('timesheet-anchor-date');
    if (!anchor) return;
    if (!anchor.value) anchor.value = selectedDate();
    const range = payPeriodFor(anchor.value);
    document.getElementById('timesheet-period-start').value = range.start;
    document.getElementById('timesheet-period-end').value = range.end;
  }
  function updatePreviewHeadings(body) {
    const table = body?.closest?.('table');
    if (!table) return;
    const header = table.querySelector?.('thead tr');
    if (header) header.innerHTML = COLUMN_LABELS.map((label) => `<th>${escapeHtml(label)}</th>`).join('');
    const footer = table.querySelector?.('tfoot tr');
    if (footer) {
      footer.innerHTML = '<th colspan="2">Totals</th><th id="timesheet-loads-total">0</th><th id="timesheet-rejects-total">0</th><th colspan="3">Hourly time total</th><th id="timesheet-hours-total">0.00</th>';
    }
  }
  function pageTotals(rows) {
    return {
      loads: rows.reduce((sum, row) => sum + number(row.loads), 0),
      rejects: rows.reduce((sum, row) => sum + number(row.rejects), 0),
      perDiemDays: rows.filter((row) => row.perDiem === 'Yes').length,
      hourlyHours: rows.reduce((sum, row) => sum + (row.hourly ? number(row.hours) : 0), 0),
      vacationDays: rows.filter((row) => row.job === 'Vacation Day').length
    };
  }
  function renderPreview() {
    const body = document.getElementById('timesheet-preview-body');
    if (!body) return;
    updatePreviewHeadings(body);
    body.innerHTML = previewRows.length
      ? previewRows.map((row, rowIndex) => `<tr class="${row.warnings.length ? 'has-warning' : ''}">${COLUMNS.map((key, columnIndex) => `<td contenteditable="true" data-label="${escapeHtml(COLUMN_LABELS[columnIndex])}" data-row="${rowIndex}" data-field="${key}">${escapeHtml(row[key] || '')}</td>`).join('')}</tr>`).join('')
      : '<tr><td colspan="8">No saved records in this pay period.</td></tr>';
    const warningRows = previewRows.filter((row) => row.warnings.length);
    document.getElementById('timesheet-warning-summary').textContent = warningRows.length
      ? `${warningRows.length} row${warningRows.length === 1 ? '' : 's'} need review: ${warningRows.map((row) => `${row.date || 'undated'} missing ${row.warnings.join(', ')}`).join('; ')}.`
      : '';
    const totals = pageTotals(previewRows);
    const loadsCell = document.getElementById('timesheet-loads-total');
    const rejectsCell = document.getElementById('timesheet-rejects-total');
    const hoursCell = document.getElementById('timesheet-hours-total');
    if (loadsCell) loadsCell.textContent = String(totals.loads);
    if (rejectsCell) rejectsCell.textContent = String(totals.rejects);
    if (hoursCell) hoursCell.textContent = totals.hourlyHours.toFixed(2);
    document.getElementById('timesheet-preview').hidden = false;
  }
  function buildPreview() {
    refreshPeriod();
    previewRange = { start: document.getElementById('timesheet-period-start').value, end: document.getElementById('timesheet-period-end').value };
    previewRows = buildTimesheetRows(savedLoads || [], paidTimeRecords || [], dailyAddOns || {}, previewRange);
    renderPreview();
    const totals = pageTotals(previewRows);
    document.getElementById('timesheet-status').textContent =
      `${previewRows.length} row${previewRows.length === 1 ? '' : 's'} prepared: ${totals.loads} load${totals.loads === 1 ? '' : 's'}, ${totals.rejects} reject${totals.rejects === 1 ? '' : 's'}, ${totals.hourlyHours.toFixed(2)} hourly hour${totals.hourlyHours === 1 ? '' : 's'}. Source records were not changed.`;
  }

  function pdfEscape(text) { return clean(text).replace(/[^\x20-\x7e]/g, '-').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function fit(text, width, size) { const max = Math.max(1, Math.floor(width / (size * .54))); const value = clean(text); return value.length > max ? `${value.slice(0, Math.max(1, max - 1))}.` : value; }
  function pdfText(x, y, text, size = 7, bold = false) { return `BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${pdfEscape(text)}) Tj ET\n`; }
  function pdfLine(x1, y1, x2, y2, width = .5) { return `${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`; }
  function buildPage(rows, pageNumber, pageCount, id, range, grandTotals) {
    const left = 28; const right = 594; const rowHeight = 23; const tableTop = 690; const tableBottom = tableTop - rowHeight * (rows.length + 1);
    let out = '0 G 0 g\n';
    out += pdfText(306, 757, 'EMPLOYEE WORK SCHEDULE', 14, true);
    out += pdfText(left, 738, `Employee Name: ${id.name}`, 9, true) + pdfText(405, 738, `Employee #: ${id.number}`, 9, true);
    out += pdfText(left, 722, `Beginning Date: ${shortDate(range.start)}`, 9) + pdfText(405, 722, `Ending Date: ${shortDate(range.end)}`, 9);
    let x = left; COLUMN_WIDTHS.forEach((w) => { out += pdfLine(x, tableTop, x, tableBottom); x += w; }); out += pdfLine(x, tableTop, x, tableBottom);
    for (let i = 0; i <= rows.length + 1; i += 1) out += pdfLine(left, tableTop - i * rowHeight, right, tableTop - i * rowHeight);
    x = left; COLUMN_LABELS.forEach((label, i) => { out += pdfText(x + 3, tableTop - 15, fit(label, COLUMN_WIDTHS[i] - 6, 6.7), 6.7, true); x += COLUMN_WIDTHS[i]; });
    rows.forEach((row, index) => {
      let cellX = left; const y = tableTop - rowHeight * (index + 1) - 15;
      COLUMNS.forEach((key, i) => { out += pdfText(cellX + 3, y, fit(row[key], COLUMN_WIDTHS[i] - 6, 6.5), 6.5); cellX += COLUMN_WIDTHS[i]; });
    });
    const page = pageTotals(rows);
    out += pdfText(left, tableBottom - 18, `Hourly entries on this page: ${page.hourlyHours.toFixed(2)}`, 8, true);
    if (pageNumber === pageCount) {
      out += pdfText(left, tableBottom - 36, `Total Loads: ${grandTotals.loads}`, 8, true);
      out += pdfText(150, tableBottom - 36, `Total Rejects: ${grandTotals.rejects}`, 8, true);
      out += pdfText(290, tableBottom - 36, `Per Diem Days: ${grandTotals.perDiemDays}`, 8, true);
      out += pdfText(left, tableBottom - 54, `Hourly Hours: ${grandTotals.hourlyHours.toFixed(2)}`, 8, true);
      out += pdfText(150, tableBottom - 54, `Vacation Days: ${grandTotals.vacationDays}`, 8, true);
    }
    out += pdfText(502, 22, `Page ${pageNumber} of ${pageCount}`, 7);
    return out;
  }
  function buildPdf(rows, id, range) {
    const perPage = 24; const chunks = [];
    for (let i = 0; i < Math.max(rows.length, 1); i += perPage) chunks.push(rows.slice(i, i + perPage));
    const objects = []; const add = (body) => { objects.push(body); return objects.length; };
    const catalog = add(''); const pages = add(''); const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'); const bold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
    const grandTotals = pageTotals(rows);
    const pageIds = chunks.map((chunk, index) => {
      const stream = buildPage(chunk, index + 1, chunks.length, id, range, grandTotals);
      const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      return add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font} 0 R /F2 ${bold} 0 R >> >> /Contents ${content} 0 R >>`);
    });
    objects[catalog - 1] = `<< /Type /Catalog /Pages ${pages} 0 R >>`;
    objects[pages - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    let pdf = '%PDF-1.4\n'; const offsets = [0];
    objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = pdf.length;
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
    appSettings = normalizeAppSettings({
      ...appSettings,
      timesheetEmployeeName: clean(document.getElementById('settings-timesheet-name').value) || DEFAULT_NAME,
      timesheetEmployeeNumber: clean(document.getElementById('settings-timesheet-number').value) || DEFAULT_NUMBER
    });
    saveAppSettingsToStorage(); syncSettingsToCloud(); document.getElementById('timesheet-settings-status').textContent = 'Timesheet identity saved.';
  }
  function init() {
    refreshPeriod(); loadSettings();
    document.getElementById('timesheet-anchor-date')?.addEventListener('change', refreshPeriod);
    document.getElementById('preview-timesheet-button')?.addEventListener('click', buildPreview);
    document.getElementById('reset-timesheet-preview-button')?.addEventListener('click', buildPreview);
    document.getElementById('download-timesheet-button')?.addEventListener('click', downloadPdf);
    document.getElementById('save-timesheet-settings-button')?.addEventListener('click', saveIdentity);
    document.getElementById('timesheet-preview-body')?.addEventListener('change', (event) => {
      const cell = event.target.closest?.('[data-row][data-field]'); if (!cell) return;
      const row = previewRows[number(cell.dataset.row)]; row[cell.dataset.field] = cell.textContent.trim(); row.warnings = rowWarnings(row); renderPreview();
    });
  }
  globalThis.TimesheetGenerator = { payPeriodFor, buildTimesheetRows, buildPdf, rowWarnings, pageTotals };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());