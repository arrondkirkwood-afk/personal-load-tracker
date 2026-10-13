const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const nodes = new Map();
let writes = 0;
function node(id) {
  if (!nodes.has(id)) nodes.set(id, {
    id, value: id === 'daily-date' ? '2026-10-12' : '', dataset: {}, textContent: '',
    addEventListener() {}, closest() { return null; },
    set innerHTML(value) { writes += 1; this.markup = value; },
    get innerHTML() { return this.markup || ''; }
  });
  return nodes.get(id);
}
const staleShift = { shiftStartTime: '07:45', shiftEndTime: '20:00', perDiem: true };
const office = { workDate: '2026-10-12', category: 'Office Time', startTime: '07:00', endTime: '13:00', durationMinutes: 360 };
let day = { isOfficeOnlyDay: true, completedLoadCount: 0, totalEstimatedDailyEarnings: 194, exactDutyMinutes: 360 };
const context = {
  document: { getElementById: node, querySelectorAll: () => [], querySelector: () => null, addEventListener() {} },
  paidTimeRecords: [office], getDailyEarningsSummary: () => day,
  getDailyAddOn: () => staleShift, getDailyEarningsDates: () => [],
  getCompanyPayPeriodRange: () => ({ start: '2026-10-01', end: '2026-10-15' }),
  summarizeReportRange: () => ({ totalEstimatedEarnings: 194, loadRecordCount: 0, workdayCount: 1 }),
  getLoadsForDate: () => [], getActiveViewName: () => 'dashboard',
  parseLocalDate: value => new Date(value + 'T12:00:00'), todayLocal: () => '2026-10-12',
  escapeHtml: value => value, formatMoney: value => '$' + Number(value).toFixed(2),
  formatMaybeDuration: () => '6 hr 0 min', setElementText: (element, value) => { element.textContent = value; },
  setTimeout: () => 1, clearTimeout() {}, addEventListener() {}
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'official-redesign.js'), 'utf8'), context);
const clock = node('official-clock-content');
assert.match(clock.innerHTML, /7:00 AM/);
assert.match(clock.innerHTML, /1:00 PM/);
assert.match(clock.innerHTML, /Edit office day/);
assert.doesNotMatch(clock.innerHTML, /7:45 AM|8:00 PM/);
assert.deepEqual(staleShift, { shiftStartTime: '07:45', shiftEndTime: '20:00', perDiem: true }, 'displaying office time does not mutate hauling records');
const firstWrites = writes;
context.OfficialLoadTracker.refresh();
assert.equal(writes, firstWrites, 'identical refresh preserves dashboard controls');
day = { ...day, totalEstimatedDailyEarnings: 218 };
context.OfficialLoadTracker.refresh();
assert.equal(writes, firstWrites + 1, 'only the changed dashboard region is replaced');
assert.match(node('official-today-stats').innerHTML, /218.00/);

context.getTrackerSnapshot = options => {
  assert.equal(options.refresh, false, 'closeout observation does not rebuild or save history');
  return { data: { loads: [], paidTime: [office], dailyAddOns: { '2026-10-12': staleShift }, dailySummaries: {} } };
};
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'daily-closeout.js'), 'utf8'), context);
assert.equal(node('daily-closeout-shift').textContent, '07:00–13:00');
assert.equal(node('daily-closeout-hourly').textContent, '6.00 hr');
assert.equal(node('daily-closeout-status').textContent, 'Ready');
console.log('Dashboard sync and office-clock regressions passed');
