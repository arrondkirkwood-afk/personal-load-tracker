(function () {
  'use strict';

  const DEFAULT_NAME = 'Arrond Kirkwood';
  const DEFAULT_NUMBER = '0135';
  const COLUMNS = ['date', 'ticket', 'job', 'loads', 'rejects', 'perDiem', 'timeIn', 'timeOut', 'hours'];
  const COLUMN_LABELS = ['Date', 'Ticket #', 'Work Description', 'Loads', 'Rejects', 'Per Diem', 'Time In', 'Time Out', 'Hours'];
  const COLUMN_WIDTHS = [48, 68, 180, 38, 38, 48, 48, 48, 50];
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
  function halfHour(value) { return Math.floor((value + 1e-9) * 2) / 2; }
  function formatHours(value) { return String(value); }
  function hours(minutes) { return minutes > 0 ? formatHours(halfHour(minutes / 60)) : ''; }
  function correctedHours(value) {
    const entered = clean(value).replace('½', '.5');
    if (!entered) return '';
    const mixed = entered.match(/^(\d+)\s+1\/2$/);
    const parsed = mixed ? Number(mixed[1]) + .5 : Number(entered);
    return Number.isFinite(parsed) && parsed >= 0 ? formatHours(halfHour(parsed)) : null;
  }
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
    const row = { ticket: '', loads: '', rejects: '', perDiem: '', timeIn: '', timeOut: '', hours: '', ...values };
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
          ticket: clean(load.ticketNumber), job: 'Paid Wait Time', hours: hours(paidWait)
        }));
        if (number(load.deadheadMiles) > 0 || number(load.deadheadTravelMinutes) > 0) rows.push(makeRow({
          kind: 'deadhead', hourly: number(load.deadheadTravelMinutes) > 0, workDate: date, sourceId: load.id, date: shortDate(date),
          ticket: clean(load.ticketNumber),
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
          kind: 'activity', ticket: clean(item.ticketNumber), hourly: isHourly, workDate: item.workDate, sourceId: item.id, date: shortDate(item.workDate),
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
      footer.innerHTML = '<th colspan="3">Totals</th><th id="timesheet-loads-total">0</th><th id="timesheet-rejects-total">0</th><th colspan="3">Hourly time total</th><th id="timesheet-hours-total">0</th>';
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
      ? previewRows.map((row, rowIndex) => `<tr class="${row.warnings.length ? 'has-warning' : ''}">${COLUMNS.map((key, columnIndex) => `<td contenteditable="true" ${key === 'hours' ? 'inputmode="decimal" ' : ''}data-label="${escapeHtml(COLUMN_LABELS[columnIndex])}" data-row="${rowIndex}" data-field="${key}">${escapeHtml(row[key] || '')}</td>`).join('')}</tr>`).join('')
      : '<tr><td colspan="9">No saved records in this pay period.</td></tr>';
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
    if (hoursCell) hoursCell.textContent = formatHours(totals.hourlyHours);

    const summary = document.getElementById('timesheet-preview-summary');
    if (summary) {
      const period = previewRange?.start && previewRange?.end
        ? `${shortDate(previewRange.start)} – ${shortDate(previewRange.end)}`
        : 'Selected pay period';
      summary.innerHTML = [
        ['Pay period', period],
        ['Payroll rows', String(previewRows.length)],
        ['Loads', String(totals.loads)],
        ['Rejects', String(totals.rejects)],
        ['Per diem days', String(totals.perDiemDays)],
        ['Hourly time', formatHours(totals.hourlyHours)]
      ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
    }

    document.getElementById('timesheet-preview').hidden = false;
    globalThis.OfficialLoadTracker?.renderTimesheetCards?.(previewRows, previewRange);
  }
  function buildPreview() {
    refreshPeriod();
    previewRange = { start: document.getElementById('timesheet-period-start').value, end: document.getElementById('timesheet-period-end').value };
    previewRows = buildTimesheetRows(savedLoads || [], paidTimeRecords || [], dailyAddOns || {}, previewRange);
    renderPreview();
    const totals = pageTotals(previewRows);
    document.getElementById('timesheet-status').textContent =
      `Timesheet ready for ${shortDate(previewRange.start)} – ${shortDate(previewRange.end)}. Review the summary, then scan only the rows that need correction. Ticket numbers on paid-time rows are saved to their entries; other table corrections apply to this preview.`;
  }

  function pdfEscape(text) { return clean(text).replace(/[^\x20-\x7e]/g, '-').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)'); }
  function wrap(text, width, size = 6.5) {
    const max = Math.max(1, Math.floor(width / size));
    return clean(text).split(/\r?\n/).flatMap((paragraph) => {
      const lines = [];
      let remaining = paragraph;
      while (remaining.length > max) {
        const space = remaining.lastIndexOf(' ', max);
        const end = space > 0 ? space : max;
        lines.push(remaining.slice(0, end));
        remaining = remaining.slice(end).trimStart();
      }
      lines.push(remaining);
      return lines;
    });
  }
  function layoutRows(rows) {
    const pages = [[]];
    let used = 0;
    rows.forEach((row) => {
      const cells = COLUMNS.map((key, i) => wrap(row[key], COLUMN_WIDTHS[i] - 6));
      const count = Math.max(...cells.map((lines) => lines.length));
      for (let offset = 0; offset < count; offset += 54) {
        const part = cells.map((lines) => lines.slice(offset, offset + 54));
        const height = Math.max(23, Math.max(...part.map((lines) => lines.length)) * 9 + 10);
        if (used + height > 550) { pages.push([]); used = 0; }
        pages[pages.length - 1].push({ row: offset ? {} : row, cells: part, height });
        used += height;
      }
    });
    return pages;
  }
  function pdfText(x, y, text, size = 7, bold = false) { return `BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)} Tm (${pdfEscape(text)}) Tj ET\n`; }
  function pdfLine(x1, y1, x2, y2, width = .5) { return `${width} w ${x1} ${y1} m ${x2} ${y2} l S\n`; }
  function buildPage(rows, pageNumber, pageCount, id, range, grandTotals) {
    const left = 28; const right = 594; const tableTop = 690; const tableBottom = tableTop - 23 - rows.reduce((sum, entry) => sum + entry.height, 0);
    let out = '0 G 0 g\n';
    out += pdfText(306, 757, 'EMPLOYEE WORK SCHEDULE', 14, true);
    out += pdfText(left, 738, `Employee Name: ${id.name}`, 9, true) + pdfText(405, 738, `Employee #: ${id.number}`, 9, true);
    out += pdfText(left, 722, `Beginning Date: ${shortDate(range.start)}`, 9) + pdfText(405, 722, `Ending Date: ${shortDate(range.end)}`, 9);
    let x = left; COLUMN_WIDTHS.forEach((w) => { out += pdfLine(x, tableTop, x, tableBottom); x += w; }); out += pdfLine(x, tableTop, x, tableBottom);
    out += pdfLine(left, tableTop, right, tableTop);
    out += pdfLine(left, tableTop - 23, right, tableTop - 23);
    x = left; COLUMN_LABELS.forEach((label, i) => {
      wrap(label, COLUMN_WIDTHS[i] - 6, 6).forEach((line, n) => { out += pdfText(x + 3, tableTop - 9 - n * 8, line, 6, true); });
      x += COLUMN_WIDTHS[i];
    });
    let top = tableTop - 23;
    rows.forEach((entry) => {
      let cellX = left;
      entry.cells.forEach((lines, i) => {
        lines.forEach((line, n) => { out += pdfText(cellX + 3, top - 13 - n * 9, line, 6.5); });
        cellX += COLUMN_WIDTHS[i];
      });
      top -= entry.height;
      out += pdfLine(left, top, right, top);
    });
    const page = pageTotals(rows.map((entry) => entry.row));
    out += pdfText(left, tableBottom - 18, `Hourly entries on this page: ${formatHours(page.hourlyHours)}`, 8, true);
    if (pageNumber === pageCount) {
      out += pdfText(left, tableBottom - 36, `Total Loads: ${grandTotals.loads}`, 8, true);
      out += pdfText(150, tableBottom - 36, `Total Rejects: ${grandTotals.rejects}`, 8, true);
      out += pdfText(290, tableBottom - 36, `Per Diem Days: ${grandTotals.perDiemDays}`, 8, true);
      out += pdfText(left, tableBottom - 54, `Hourly Hours: ${formatHours(grandTotals.hourlyHours)}`, 8, true);
      out += pdfText(150, tableBottom - 54, `Vacation Days: ${grandTotals.vacationDays}`, 8, true);
    }
    out += pdfText(502, 22, `Page ${pageNumber} of ${pageCount}`, 7);
    return out;
  }
  function buildPdf(rows, id, range) {
    const chunks = layoutRows(rows);
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
    document.getElementById('timesheet-preview-body')?.addEventListener('blur', (event) => {
      const cell = event.target.closest?.('[data-row][data-field]'); if (!cell) return;
      const row = previewRows[Number(cell.dataset.row)]; if (!row) return;
      const field = cell.dataset.field;
      const value = field === 'hours' ? correctedHours(cell.textContent) : cell.textContent.trim();
      if (value === null) {
        cell.textContent = row.hours;
        document.getElementById('timesheet-status').textContent = 'Enter hours as a nonnegative number, such as 2 or 2.5.';
        return;
      }
      const savedTicket = field === 'ticket' && row.kind === 'activity';
      if (savedTicket && (typeof savePaidTimeTicketNumber !== 'function' || !savePaidTimeTicketNumber(row.sourceId, value))) {
        cell.textContent = row.ticket;
        document.getElementById('timesheet-status').textContent = 'Could not save the ticket number. Open the paid-time entry and try again.';
        return;
      }
      row[field] = value;
      if (field === 'hours' && value && !row.hourly) { row.hourly = true; row.requiresClockTimes = false; }
      row.warnings = rowWarnings(row);
      renderPreview();
      document.getElementById('timesheet-status').textContent = savedTicket ? 'Ticket number saved to the paid-time entry. It will remain when you rebuild the timesheet.' : 'Timesheet correction applied to this preview and its PDF. Reset Preview restores the saved records.';
    }, true);
  }
  globalThis.TimesheetGenerator = { payPeriodFor, buildTimesheetRows, buildPdf, rowWarnings, pageTotals, correctedHours, buildPreview, getPreview: () => ({ rows: previewRows, range: previewRange }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
}());


