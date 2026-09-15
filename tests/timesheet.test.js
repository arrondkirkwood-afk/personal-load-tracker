const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class Element {
  constructor() { this.value = ''; this.textContent = ''; this.hidden = false; this.innerHTML = ''; this.dataset = {}; }
  addEventListener() {}
  appendChild() {}
  click() {}
  remove() {}
  closest() { return null; }
}
const elements = new Map();
const get = (id) => { if (!elements.has(id)) elements.set(id, new Element()); return elements.get(id); };
get('daily-date').value = '2026-09-30';
const context = {
  console, Blob, setTimeout, clearTimeout,
  appSettings: {}, savedLoads: [], paidTimeRecords: [], dailyAddOns: {},
  normalizeAppSettings: (value) => value, saveAppSettingsToStorage: () => true, syncSettingsToCloud: () => {}, escapeHtml: (value) => String(value),
  document: { readyState: 'loading', getElementById: get, addEventListener() {}, createElement: () => new Element(), body: new Element() },
  URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} }
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'timesheet.js'), 'utf8'), context);
const api = context.TimesheetGenerator;

assert.deepStrictEqual(JSON.parse(JSON.stringify(api.payPeriodFor('2026-09-15'))), { start: '2026-09-01', end: '2026-09-15' });
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.payPeriodFor('2026-02-16'))), { start: '2026-02-16', end: '2026-02-28' });
assert.deepStrictEqual(JSON.parse(JSON.stringify(api.payPeriodFor('2028-02-16'))), { start: '2028-02-16', end: '2028-02-29' });

const range = { start: '2026-09-01', end: '2026-09-15' };
const loads = [
  { id: 's1', loadDate: '2026-09-01', loadStatus: 'Completed Load' },
  { id: 's2', loadDate: '2026-09-01', loadStatus: 'Completed Load' },
  { id: 's3', loadDate: '2026-09-01', loadStatus: 'Completed Load' },
  { id: 's4', loadDate: '2026-09-01', loadStatus: 'Reject' },
  { id: 'l1', loadDate: '2026-09-09', loadStatus: 'Completed Load', ticketNumber: 'T1', leaseNumber: 'Lease A', pickupLocation: 'Pickup A', dropoffLocation: 'Station A', paidPickupWaitMinutes: 30, paidDropoffWaitMinutes: 60, deadheadMiles: 12, deadheadTravelMinutes: 30, deadheadStartTime: '06:00', deadheadEndTime: '06:30' },
  { id: 'l2', loadDate: '2026-09-09', loadStatus: 'Completed Load', bolNumber: 'B2', pickupLocation: 'Lease B', dropoffLocation: 'Station B' },
  { id: 'l3', loadDate: '2026-09-10', loadStatus: 'Completed Load', ticketNumber: '', pickupLocation: '', dropoffLocation: '' }
];
const paid = [
  { id: 'o1', workDate: '2026-09-08', category: 'Office Time', startTime: '08:00', endTime: '16:00', durationMinutes: 480 },
  { id: 'w1', workDate: '2026-09-09', category: 'Truck Wash', startTime: '18:00', endTime: '19:15', durationMinutes: 75, notes: 'Wash bay' },
  { id: 'b1', workDate: '2026-09-09', category: 'Breakdown', startTime: '06:30', endTime: '10:00', durationMinutes: 210, notes: 'Getting truck/trailer lights repaired' },
  { id: 'v1', workDate: '2026-09-11', category: 'Vacation Time', durationMinutes: 0 }
];
const rows = api.buildTimesheetRows(loads, paid, { '2026-09-09': { shiftStartTime: '05:30', shiftEndTime: '17:30' } }, range);

const sept1 = rows.find((row) => row.kind === 'load' && row.workDate === '2026-09-01');
assert.ok(sept1, '9/1 hauling summary exists');
assert.strictEqual(sept1.loads, '3', '9/1 counts only completed loads as hauled loads');
assert.strictEqual(sept1.rejects, '1', '9/1 counts the reject separately');
assert.strictEqual(sept1.job, '3 Loads / 1 Reject / Per Diem', '9/1 description reflects saved app statuses');
assert.ok(rows.some((row) => row.job === '2 Loads / Per Diem' && row.loads === '2' && row.rejects === '' && row.perDiem === 'Yes'), 'ordinary hauling day is summarized into one load/per-diem row');
assert.strictEqual(rows.filter((row) => row.date === '9/9/26' && row.perDiem === 'Yes').length, 1, 'per diem appears only once on a qualifying day');
assert.strictEqual(rows.filter((row) => row.kind === 'load').length, 3, 'load tickets are consolidated to one row per work date');
assert.ok(rows.every((row) => !Object.prototype.hasOwnProperty.call(row, 'ticket')), 'timesheet rows do not expose ticket numbers');
assert.ok(rows.some((row) => row.job === 'Office Time' && row.hours === '8.00'), 'office-only activity is included');
assert.ok(rows.some((row) => row.job === 'Truck Wash - Wash bay' && row.hours === '1.25'), 'hourly activity descriptions are retained');
assert.ok(rows.some((row) => row.job === 'Breakdown - Getting truck/trailer lights repaired' && row.timeIn === '06:30' && row.timeOut === '10:00' && row.hours === '3.50'), 'breakdown time includes its description and hourly detail');
assert.ok(rows.some((row) => row.job === 'Vacation Day'), 'vacation is shown as a vacation day');
assert.ok(rows.some((row) => row.job === 'Paid Wait Time' && row.hours === '1.50'), 'already-calculated paid wait is reused');
assert.ok(rows.some((row) => row.job === 'Deadhead - 12.0 mi' && row.hours === '0.50'), 'deadhead miles and recorded time remain distinct');

const dateOrder = rows.map((row) => row.workDate);
assert.strictEqual(JSON.stringify(dateOrder), JSON.stringify([...dateOrder].sort()), 'rows are sorted by the real ISO work date, not formatted date text');
assert.strictEqual(rows.filter((row) => row.hourly).reduce((sum, row) => sum + Number(row.hours || 0), 0), 14.75, 'Hours total counts hourly rows only');

const totals = api.pageTotals(rows);
assert.strictEqual(totals.loads, 6, 'period total counts completed loads only');
assert.strictEqual(totals.rejects, 1, 'period total counts rejects separately');
assert.strictEqual(totals.hourlyHours, 14.75, 'period total adds hourly time');
assert.strictEqual(totals.vacationDays, 1, 'vacation day total is retained');

const manyRows = Array.from({ length: 55 }, () => ({ workDate: '2026-09-09', date: '9/9/26', job: '1 Load / Per Diem', loads: '1', rejects: '', perDiem: 'Yes', timeIn: '', timeOut: '', hours: '', hourly: false }));
const pdf = api.buildPdf(manyRows, { name: 'Arrond Kirkwood', number: '0135' }, range);
assert.strictEqual(pdf.type, 'application/pdf');
assert.ok(pdf.size > 1000, 'multi-page PDF is generated');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');
const timesheetSource = fs.readFileSync(path.join(__dirname, '..', 'timesheet.js'), 'utf8');
assert.ok(html.includes('id="timesheet-preview"') && timesheetSource.includes('contenteditable="true"'), 'preview supports report-only correction cells');
assert.ok(timesheetSource.includes("['date', 'job', 'loads', 'rejects', 'perDiem', 'timeIn', 'timeOut', 'hours']"), 'preview/PDF use organized load and reject timesheet columns');
assert.ok(html.includes('id="settings-timesheet-name"') && html.includes('id="settings-timesheet-number"'), 'timesheet identity is editable in settings');
assert.ok(sw.includes("'./timesheet.js'") && sw.includes("'./timesheet.css'"), 'timesheet assets are available offline');
console.log('Timesheet Generator tests passed');
