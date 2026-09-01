const fs = require('fs');
const path = require('path');
const vm = require('vm');
const context = { console, Blob, setTimeout, clearTimeout, appSettings: {}, savedLoads: [], paidTimeRecords: [], dailyAddOns: {}, normalizeAppSettings: (v) => v, saveAppSettingsToStorage() {}, syncSettingsToCloud() {}, escapeHtml: (v) => String(v), document: { readyState: 'loading', getElementById: () => null, addEventListener() {}, createElement: () => ({}), body: { appendChild() {} } }, URL: { createObjectURL() {}, revokeObjectURL() {} } };
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'timesheet.js'), 'utf8'), context);
const rows = Array.from({ length: 31 }, (_, index) => ({
  date: index < 5 ? '9/1/26' : `9/${Math.min(15, index + 1)}/26`, ticket: `TK-${1000 + index}`, lease: `Lease ${String.fromCharCode(65 + index % 5)}`,
  job: index % 5 === 0 ? '3 Loads / Per Diem' : (index % 7 === 0 ? 'Truck Wash' : 'Paid Wait Time'), station: `Station ${1 + index % 4}`,
  timeIn: index % 3 ? '06:30' : '', timeOut: index % 3 ? '07:45' : '', hours: index % 3 ? '1.25' : '', total: index % 3 ? '1.25' : '', hourly: index % 3 !== 0
}));
(async () => {
  const blob = context.TimesheetGenerator.buildPdf(rows, { name: 'Arrond Kirkwood', number: '0135' }, { start: '2026-09-01', end: '2026-09-15' });
  fs.writeFileSync(process.argv[2], Buffer.from(await blob.arrayBuffer()));
})();
