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
  { id: 'l1', loadDate: '2026-09-09', ticketNumber: 'T1', leaseNumber: 'Lease A', pickupLocation: 'Pickup A', dropoffLocation: 'Station A', paidPickupWaitMinutes: 30, paidDropoffWaitMinutes: 60, deadheadMiles: 12, deadheadTravelMinutes: 30, deadheadStartTime: '06:00', deadheadEndTime: '06:30' },
  { id: 'l2', loadDate: '2026-09-09', bolNumber: 'B2', pickupLocation: 'Lease B', dropoffLocation: 'Station B' },
  { id: 'l3', loadDate: '2026-09-10', ticketNumber: '', pickupLocation: '', dropoffLocation: '' }
];
const paid = [
  { id: 'o1', workDate: '2026-09-08', category: 'Office Time', startTime: '08:00', endTime: '16:00', durationMinutes: 480 },
  { id: 'w1', workDate: '2026-09-09', category: 'Truck Wash', startTime: '18:00', endTime: '19:15', durationMinutes: 75, notes: 'Wash bay' }
];
const rows = api.buildTimesheetRows(loads, paid, { '2026-09-09': { shiftStartTime: '05:30', shiftEndTime: '17:30' } }, range);
assert.ok(rows.some((row) => row.job === '2 Loads / Per Diem'), 'load days group records and apply per diem once');
assert.strictEqual(rows.filter((row) => row.date === '9/9/26' && row.job.includes('Per Diem')).length, 1, 'per diem appears once on each qualifying load day');
assert.ok(rows.some((row) => row.job === 'Office Time' && row.hours === '8.00'), 'office-only activity is included');
assert.ok(rows.some((row) => row.job === 'Truck Wash' && row.hours === '1.25'), 'truck wash time is included');
assert.ok(rows.some((row) => row.job === 'Paid Wait Time' && row.hours === '1.50'), 'already-calculated paid wait is reused');
assert.ok(rows.some((row) => row.job === 'Deadhead - 12.0 mi' && row.hours === '0.50'), 'deadhead miles and recorded time remain distinct');
assert.ok(rows.some((row) => row.warnings.includes('ticket/BOL') && row.warnings.includes('lease') && row.warnings.includes('station')), 'missing load information is flagged');
assert.strictEqual(rows.filter((row) => row.hourly).reduce((sum, row) => sum + Number(row.hours || 0), 0), 11.25, 'Hours total counts hourly rows only');

const manyRows = Array.from({ length: 55 }, (_, index) => ({ date: '9/9/26', ticket: `T${index}`, lease: 'Lease', job: '1 Load / Per Diem', station: 'Station', timeIn: '', timeOut: '', hours: '', total: '', hourly: false }));
const pdf = api.buildPdf(manyRows, { name: 'Arrond Kirkwood', number: '0135' }, range);
assert.strictEqual(pdf.type, 'application/pdf');
assert.ok(pdf.size > 1000, 'multi-page PDF is generated');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'service-worker.js'), 'utf8');
assert.ok(html.includes('id="timesheet-preview"') && fs.readFileSync(path.join(__dirname, '..', 'timesheet.js'), 'utf8').includes('contenteditable="true"'), 'preview supports report-only correction cells');
assert.ok(html.includes('id="settings-timesheet-name"') && html.includes('id="settings-timesheet-number"'), 'timesheet identity is editable in settings');
assert.ok(sw.includes("'./timesheet.js'") && sw.includes("'./timesheet.css'"), 'timesheet assets are available offline');
console.log('Timesheet Generator tests passed');
