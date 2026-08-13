const assert = require('assert');
const {
  LOAD_HEADERS,
  DAILY_HEADERS,
  buildCleanLoadExport,
  buildCleanDailyEarningsExport,
  payPeriodLabel
} = require('../export-cleanup.js');

assert.strictEqual(LOAD_HEADERS.length, 27, 'load log stays intentionally narrow');
assert.strictEqual(DAILY_HEADERS.length, 23, 'daily earnings log stays intentionally narrow');
assert.ok(!LOAD_HEADERS.includes('Driver'), 'repeated driver field is removed from personal load log');
assert.ok(!LOAD_HEADERS.includes('Total loaded miles'), 'redundant total-loaded-miles field is removed');
assert.ok(!LOAD_HEADERS.includes('Crude weight per barrel'), 'engineering detail is not in the clean load log');
assert.ok(!DAILY_HEADERS.includes('Paid-time overlap minutes'), 'diagnostic detail is not in the daily earnings log');

assert.strictEqual(payPeriodLabel('2026-08-12'), '2026-08-01 to 2026-08-15', 'first-half pay period label');
assert.strictEqual(payPeriodLabel('2026-08-20'), '2026-08-16 to 2026-08-31', 'second-half pay period label');
assert.strictEqual(payPeriodLabel('2028-02-20'), '2028-02-16 to 2028-02-29', 'leap-year pay period label');

const duplicateOlder = {
  id: 'old-copy',
  loadDate: '2026-08-12',
  loadNumber: '2',
  loadStatus: 'Completed Load',
  ticketNumber: 'TK-2',
  dispatcher: 'Dispatcher A',
  truckNumber: '74',
  trailerNumber: 'H-1',
  pickupLocation: 'Lease North',
  pickupState: 'LA',
  dropoffLocation: 'Station South',
  dropoffState: 'TX',
  grossBarrels: 188.44,
  loadedMiles: 84.5,
  estimatedPay: 122.29,
  savedAt: '2026-08-12T12:00:00Z'
};

const duplicateNewer = {
  ...duplicateOlder,
  id: 'new-copy',
  bolNumber: 'BOL-2',
  jotformConfirmationNumber: 'JF-2',
  barrelsOffloaded: 188.11,
  differenceVsGrossBarrels: -0.33,
  reRoutedMiles: 2,
  deadheadMiles: 18.2,
  arrivedPickupTime: '06:10',
  loadedTime: '07:35',
  arrivedDropoffTime: '10:20',
  completedTime: '11:50',
  totalPaidWaitMinutes: 55,
  waitPay: 22,
  estimatedEntryPay: 144.29,
  notes: '=SUM(1,1)',
  savedAt: '2026-08-12T13:00:00Z'
};

const snapshot = {
  data: {
    loads: [
      duplicateOlder,
      duplicateNewer,
      {
        id: 'reject-1',
        loadDate: '2026-08-11',
        loadNumber: '10',
        loadStatus: 'Reject',
        ticketNumber: 'TK-R',
        pickupLocation: 'Lease West',
        pickupState: 'LA',
        dropoffLocation: 'Station East',
        dropoffState: 'LA',
        estimatedPay: 20,
        estimatedEntryPay: 20
      }
    ],
    dailySummaries: [
      {
        date: '2026-08-12',
        completedLoadCount: 4,
        rejectCount: 1,
        totalGrossBarrels: 752.5,
        totalLoadedMiles: 338.2,
        totalReRoutedMiles: 2,
        totalDeadheadMiles: 66.5,
        completedLoadPay: 488.25,
        rejectPay: 20,
        totalWaitPay: 48,
        perDiemPay: 50,
        sleeperBerthPay: 60,
        trainerPay: 0,
        hourlyAdditionalPay: 24,
        vacationPay: 0,
        totalEstimatedDailyEarnings: 690.25,
        shiftStartTime: '05:45',
        shiftEndTime: '19:45',
        exactDutyMinutes: 840,
        effectiveHourlyEarnings: 49.30,
        defaultDispatcher: 'Dispatcher A',
        notes: 'First copy',
        updatedAt: '2026-08-12T20:00:00Z'
      },
      {
        date: '2026-08-12',
        completedLoadCount: 4,
        rejectCount: 1,
        totalGrossBarrels: 752.5,
        totalLoadedMiles: 338.2,
        totalReRoutedMiles: 2,
        totalDeadheadMiles: 66.5,
        completedLoadPay: 488.25,
        rejectPay: 20,
        totalWaitPay: 48,
        perDiemPay: 50,
        sleeperBerthPay: 60,
        trainerPay: 0,
        hourlyAdditionalPay: 24,
        vacationPay: 0,
        totalEstimatedDailyEarnings: 690.25,
        shiftStartTime: '05:45',
        shiftEndTime: '19:45',
        exactDutyMinutes: 840,
        effectiveHourlyEarnings: 49.30,
        defaultDispatcher: 'Dispatcher A',
        notes: 'Final daily note',
        updatedAt: '2026-08-12T21:00:00Z'
      },
      { date: '2026-08-13', completedLoadCount: 0, rejectCount: 0 }
    ]
  }
};

const original = JSON.stringify(snapshot);
const loadExport = buildCleanLoadExport(snapshot);
const earningsExport = buildCleanDailyEarningsExport(snapshot);

assert.strictEqual(JSON.stringify(snapshot), original, 'export builders do not mutate tracker data');
assert.strictEqual(loadExport.rows.length, 2, 'duplicate load records collapse to one exported row');
assert.strictEqual(loadExport.duplicateRowsRemoved, 1, 'duplicate removal is reported');
assert.strictEqual(loadExport.rows[0][0], '2026-08-11', 'loads sort by date');
assert.strictEqual(loadExport.rows[1][LOAD_HEADERS.indexOf('Total load pay')], 144.29, 'money remains numeric for spreadsheet calculations');
assert.strictEqual(loadExport.rows[1][LOAD_HEADERS.indexOf('Paid wait hours')], 0.92, 'wait minutes convert to decimal hours');
assert.strictEqual(loadExport.rows[1][LOAD_HEADERS.indexOf('Pickup')], 'Lease North, LA', 'pickup state is folded into one useful route field');
assert.strictEqual(loadExport.rows[1][LOAD_HEADERS.indexOf('Drop-off')], 'Station South, TX', 'drop-off state is folded into one useful route field');
assert.ok(loadExport.csv.startsWith('\ufeff'), 'CSV begins with UTF-8 BOM for spreadsheet compatibility');
assert.ok(loadExport.csv.includes("'=SUM(1,1)"), 'spreadsheet formula injection is neutralized');
assert.ok(loadExport.csv.includes('\r\n'), 'CSV uses Excel-friendly line endings');
assert.ok(loadExport.csv.includes('144.29'), 'numeric pay is written without a dollar sign');

assert.strictEqual(earningsExport.rows.length, 1, 'duplicate and empty daily rows are removed');
assert.strictEqual(earningsExport.duplicateRowsRemoved, 2, 'daily duplicate and empty rows are excluded');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Duty hours')], 14, 'duty minutes convert to decimal hours');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Total estimated earnings')], 690.25, 'daily total remains numeric');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Pay period')], '2026-08-01 to 2026-08-15', 'daily log includes pay-period context');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Notes')], 'Final daily note', 'newer duplicate daily record wins');

console.log(`Clean export tests passed: ${LOAD_HEADERS.length} load columns, ${DAILY_HEADERS.length} daily columns.`);
