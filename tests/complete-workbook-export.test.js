const assert = require('assert');

global.ExcelJS = require('../vendor/exceljs.min.js');
global.LoadTrackerExportCleanup = require('../export-cleanup.js');

const complete = require('../complete-workbook-export.js');

assert.strictEqual(complete.durationMinutes('23:30', '02:30'), 180, 'cycle timing crosses midnight');
assert.strictEqual(complete.durationMinutes('', '02:30'), null, 'missing timestamps stay unavailable');
assert.deepStrictEqual(
  complete.determineRange('custom', '2026-08-16', '2026-08-31', { rows: [] }, { rows: [] }),
  { start: '2026-08-16', end: '2026-08-31' },
  'custom report range is preserved'
);

const snapshot = {
  data: {
    settings: { fairDayGoal: 280, excellentDayGoal: 300 },
    loads: [{
      id: 'load-1', loadDate: '2026-08-18', loadNumber: '1', loadStatus: 'Completed Load',
      pickupLocation: 'Weeks Island', pickupState: 'LA', dropoffLocation: 'Burns Point', dropoffState: 'LA',
      grossBarrels: 186.5, loadedMiles: 24, arrivedPickupTime: '06:00', loadedTime: '07:00',
      arrivedDropoffTime: '08:00', completedTime: '08:45', estimatedPay: 216, waitPay: 0,
      estimatedEntryPay: 216, dispatcher: 'Dispatcher A'
    }],
    dailySummaries: {
      '2026-08-18': {
        date: '2026-08-18', completedLoadCount: 1, rejectCount: 0, totalGrossBarrels: 186.5,
        totalLoadedMiles: 24, completedLoadPay: 216, totalEstimatedDailyEarnings: 266,
        shiftStartTime: '05:30', shiftEndTime: '20:30', exactDutyMinutes: 900,
        effectiveHourlyEarnings: 17.73, defaultDispatcher: 'Dispatcher A'
      }
    }
  }
};

const dataset = complete.createDataset(snapshot, { start: '2026-08-16', end: '2026-08-31' });
assert.strictEqual(dataset.dailyRows.length, 1, 'one daily record is included');
assert.strictEqual(dataset.timingRows.length, 1, 'one load timing record is included');
assert.strictEqual(dataset.dailyRows[0].goalVariance, -64, 'Fair Goal variance is calculated');
assert.strictEqual(dataset.dailyRows[0].fourteenHourReview, true, '15-hour day receives review flag');
assert.strictEqual(dataset.dailyRows[0].longBelowGoal, true, 'long below-goal discrepancy is flagged');
assert.strictEqual(dataset.timingRows[0].cycleMinutes, 165, 'full load cycle is calculated');

const workbook = complete.createWorkbook(dataset);
assert.deepStrictEqual(
  workbook.worksheets.map((sheet) => sheet.name),
  ['Dashboard', 'Daily Analysis', 'Load Timing', 'Daily Source', 'Load Source', 'How to Analyze'],
  'complete workbook contains all required sheets'
);

workbook.xlsx.writeBuffer().then((buffer) => {
  assert.ok(buffer.byteLength > 10000, 'complete workbook serializes to a non-empty XLSX');
  console.log('Complete workbook export tests passed.');
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
