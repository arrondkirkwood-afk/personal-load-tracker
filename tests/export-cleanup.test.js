const assert = require('assert');
const {
  LOAD_HEADERS,
  DAILY_HEADERS,
  buildCleanLoadExport,
  buildCleanDailyEarningsExport,
  payPeriodLabel
} = require('../export-cleanup.js');

assert.ok(LOAD_HEADERS.length <= 32, 'clean load CSV stays reasonably narrow');
assert.ok(DAILY_HEADERS.length <= 24, 'clean daily earnings CSV stays reasonably narrow');
assert.ok(!LOAD_HEADERS.includes('Crude weight per barrel'), 'derived engineering detail is not in the clean load CSV');
assert.ok(!DAILY_HEADERS.includes('Paid-time overlap minutes'), 'diagnostic detail is not in the clean daily CSV');

assert.strictEqual(payPeriodLabel('2026-08-12'), '2026-08-01 to 2026-08-15', 'first-half pay period label');
assert.strictEqual(payPeriodLabel('2026-08-20'), '2026-08-16 to 2026-08-31', 'second-half pay period label');
assert.strictEqual(payPeriodLabel('2028-02-20'), '2028-02-16 to 2028-02-29', 'leap-year pay period label');

const snapshot = {
  data: {
    loads: [
      {
        loadDate: '2026-08-12',
        loadNumber: '2',
        loadStatus: 'Completed Load',
        ticketNumber: 'TK-2',
        bolNumber: 'BOL-2',
        jotformConfirmationNumber: 'JF-2',
        dispatcher: 'Dispatcher A',
        driverName: 'Arrond Driver',
        truckNumber: '74',
        trailerNumber: 'H-1',
        pickupLocation: 'Lease, North',
        pickupState: 'LA',
        dropoffLocation: 'Station South',
        dropoffState: 'TX',
        grossBarrels: 188.44,
        barrelsOffloaded: 188.11,
        differenceVsGrossBarrels: -0.33,
        loadedMiles: 84.5,
        reRoutedMiles: 2,
        totalMilesIncludingReRoute: 86.5,
        deadheadMiles: 18.2,
        arrivedPickupTime: '06:10',
        loadedTime: '07:35',
        arrivedDropoffTime: '10:20',
        completedTime: '11:50',
        totalPaidWaitMinutes: 55,
        estimatedPay: 122.29,
        waitPay: 22,
        estimatedEntryPay: 144.29,
        notes: 'Driver said "check meter", then cleared.'
      },
      {
        loadDate: '2026-08-11',
        loadNumber: '10',
        loadStatus: 'Reject',
        estimatedPay: 20,
        estimatedEntryPay: 20
      }
    ],
    dailySummaries: {
      '2026-08-12': {
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
        notes: 'Long day, good loads'
      }
    }
  }
};

const original = JSON.stringify(snapshot);
const loadExport = buildCleanLoadExport(snapshot);
const earningsExport = buildCleanDailyEarningsExport(snapshot);

assert.strictEqual(JSON.stringify(snapshot), original, 'export builders do not mutate tracker data');
assert.strictEqual(loadExport.headers.length, LOAD_HEADERS.length, 'load header count is stable');
assert.strictEqual(loadExport.rows.length, 2, 'all load records are exported');
assert.strictEqual(loadExport.rows[0][0], '2026-08-11', 'loads sort by date');
assert.strictEqual(loadExport.rows[1][LOAD_HEADERS.indexOf('Total load pay')], '144.29', 'money exports as a numeric value without a dollar sign');
assert.strictEqual(loadExport.rows[1][LOAD_HEADERS.indexOf('Paid wait hours')], '0.92', 'wait minutes convert to decimal hours');
assert.ok(loadExport.csv.startsWith('\ufeff'), 'CSV begins with UTF-8 BOM for spreadsheet compatibility');
assert.ok(loadExport.csv.includes('"Lease, North"'), 'commas remain safely quoted');
assert.ok(loadExport.csv.includes('"Driver said ""check meter"", then cleared."'), 'embedded quotes are escaped');
assert.ok(loadExport.csv.includes('\r\n'), 'CSV uses Windows/Excel-friendly line endings');

assert.strictEqual(earningsExport.rows.length, 1, 'daily earnings row is exported');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Duty hours')], '14.00', 'duty minutes convert to decimal hours');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Total estimated earnings')], '690.25', 'daily total is numeric');
assert.strictEqual(earningsExport.rows[0][DAILY_HEADERS.indexOf('Pay period')], '2026-08-01 to 2026-08-15', 'daily CSV includes pay-period context');

console.log(`Clean export tests passed: ${LOAD_HEADERS.length} load columns, ${DAILY_HEADERS.length} daily columns.`);
