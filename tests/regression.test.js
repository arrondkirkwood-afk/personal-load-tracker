const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(appDir, 'script.js'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(appDir, 'service-worker.js'), 'utf8');
const manifest = fs.readFileSync(path.join(appDir, 'manifest.json'), 'utf8');
const repairHtml = fs.readFileSync(path.join(appDir, 'repair.html'), 'utf8');
const readme = fs.readFileSync(path.join(appDir, 'README.md'), 'utf8');
const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);

class Element {
  constructor(id) {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.className = '';
    this.hidden = false;
    this.checked = false;
    this.innerHTML = '';
    this.href = '';
    this.download = '';
    this.dataset = {};
    this.children = [];
    this.classList = {
      toggle: (name, enabled) => {
        const parts = new Set(String(this.className || '').split(/\s+/).filter(Boolean));
        if (enabled) {
          parts.add(name);
        } else {
          parts.delete(name);
        }
        this.className = [...parts].join(' ');
      }
    };
  }

  addEventListener() {}
  appendChild(child) { this.children.push(child); }
  click() {}
  remove() {}
  scrollIntoView() {}
  closest() { return null; }
  querySelector() { return null; }
  querySelectorAll() { return []; }

  reset() {
    elements.forEach((element) => {
      element.value = '';
      element.checked = false;
    });
  }
}

const elements = new Map(ids.map((id) => [id, new Element(id)]));
const storage = new Map();

function createStartupSmokeContext(initialStorage) {
  const smokeElements = new Map(ids.map((id) => [id, new Element(id)]));
  const smokeStorage = new Map(Object.entries(initialStorage));

  function getSmokeElement(id) {
    if (!smokeElements.has(id)) {
      smokeElements.set(id, new Element(id));
    }

    return smokeElements.get(id);
  }

  const smokeContext = {
    console,
    setTimeout,
    clearTimeout,
    localStorage: {
      getItem: (key) => (smokeStorage.has(key) ? smokeStorage.get(key) : null),
      setItem: (key, value) => smokeStorage.set(key, String(value)),
      removeItem: (key) => smokeStorage.delete(key)
    },
    confirm: () => true,
    navigator: {},
    document: {
      getElementById: getSmokeElement,
      querySelectorAll: () => [],
      createElement: (tagName) => new Element(tagName),
      body: new Element('body')
    },
    URL: {
      createObjectURL: () => 'blob:test',
      revokeObjectURL: () => {}
    },
    Blob: function Blob() {},
    globalThis: null
  };

  smokeContext.globalThis = smokeContext;
  vm.createContext(smokeContext);
  assert.doesNotThrow(() => vm.runInContext(script, smokeContext, { filename: 'script.js' }), 'loading saved records at startup does not throw');
  return { context: smokeContext, storage: smokeStorage };
}

const startupSmoke = createStartupSmokeContext({
  'personalOilfieldLoadTracker.settings': JSON.stringify({
    loadedMilesPayScale: [{ min: 1, max: 999, rate: 123.45 }]
  }),
  'personalOilfieldLoadTracker.loads': JSON.stringify([{
    id: 'existing-startup-load',
    loadDate: '2026-07-12',
    loadNumber: '7',
    loadStatus: 'Completed Load',
    grossBarrels: 100,
    loadedMiles: 42
  }]),
  'personalOilfieldLoadTracker.favoriteRoutes': JSON.stringify([{ id: 'legacy-route', name: 'Legacy Route', pickupLocation: 'Lease Current', dropoffLocation: 'Station Current' }])
});
const startupSnapshot = startupSmoke.context.getTrackerSnapshot();
assert.strictEqual(startupSnapshot.recordCount, 1, 'existing saved load remains available after startup');
assert.strictEqual(startupSnapshot.data.loads[0].estimatedPay, 123.45, 'app settings initialize before saved-load calculations');

function getSmokeElement(id) {
  return startupSmoke.context.document.getElementById(id);
}

function setSmokeField(id, value) {
  getSmokeElement(id).value = value;
}

function setSmokeChecked(id, value) {
  getSmokeElement(id).checked = value;
}

Object.entries({
  'driver-name': 'Startup Driver',
  'truck-number': 'T-99',
  'trailer-number': 'TR-99',
  'load-date': '2026-07-13',
  'load-number': '8',
  'ticket-number': 'STARTUP-TK-2',
  'bol-number': 'STARTUP-BOL-2',
  'load-status': 'Completed Load',
  'gross-barrels': '120',
  'loaded-miles': '24'
}).forEach(([id, value]) => setSmokeField(id, value));
startupSmoke.context.saveLoad({ preventDefault() {} });

setSmokeField('profile-driver-name', 'Current Driver');
setSmokeField('profile-truck-number', 'Current Truck');
setSmokeField('profile-trailer-number', 'Current Trailer');
startupSmoke.context.saveDriverProfile();

setSmokeField('settings-trainer-rate', '57');
setSmokeField('settings-per-diem-rate', '53');
setSmokeField('settings-sleeper-rate', '66');
setSmokeField('settings-reject-rate', '26');
setSmokeField('settings-wait-rate', '31');
startupSmoke.context.savePaySettingsFromControls();

setSmokeField('daily-date', '2026-07-13');
startupSmoke.context.applyDailyAddOnsToControls();
setSmokeChecked('per-diem-checkbox', true);
setSmokeField('daily-earnings-notes', 'Current add-on note');
startupSmoke.context.saveDailyAddOnFromControls();

const beforeSignOutSnapshot = startupSmoke.context.getTrackerSnapshot();
startupSmoke.context.handleFirebaseUser(null);
const afterSignOutSnapshot = startupSmoke.context.getTrackerSnapshot();
assert.strictEqual(afterSignOutSnapshot.recordCount, beforeSignOutSnapshot.recordCount, 'signing out does not revert loads to startup state');
assert.strictEqual(afterSignOutSnapshot.data.settings.payRates.waitPayRate, 31, 'signing out does not revert app settings');
assert.strictEqual(afterSignOutSnapshot.data.profile.driverName, 'Current Driver', 'signing out does not revert driver profile');
assert.strictEqual(afterSignOutSnapshot.data.favoriteRoutes.length, 1, 'legacy favorite-route backup data remains compatible after its UI is removed');
assert.ok(afterSignOutSnapshot.data.dailyAddOns['2026-07-13'], 'signing out does not revert daily add-ons');

function getElement(id) {
  if (!elements.has(id)) {
    elements.set(id, new Element(id));
  }

  return elements.get(id);
}

const context = {
  console,
  setTimeout,
  clearTimeout,
  localStorage: {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key)
  },
  confirm: () => true,
  navigator: {},
  document: {
    getElementById: getElement,
    querySelectorAll: () => [],
    createElement: (tagName) => new Element(tagName),
    body: new Element('body')
  },
  URL: {
    createObjectURL: () => 'blob:test',
    revokeObjectURL: () => {}
  },
  Blob: function Blob() {},
  globalThis: null
};

context.globalThis = context;
vm.createContext(context);
vm.runInContext(script, context, { filename: 'script.js' });

function setField(id, value) {
  getElement(id).value = value;
}

function setChecked(id, value) {
  getElement(id).checked = value;
}

function loadValues(overrides) {
  return {
    loadStatus: 'Completed Load',
    grossBarrels: 100,
    bswPercentage: null,
    apiGravity: null,
    emptyTruckWeight: null,
    startMeterReading: null,
    endMeterReading: null,
    loadedMiles: null,
    reRoutedMiles: 0,
    arrivedPickupTime: '',
    loadedTime: '',
    arrivedDropoffTime: '',
    completedTime: '',
    ...overrides
  };
}

function derived(overrides) {
  return context.calculateDerived(loadValues(overrides));
}

function assertWaitMinutes(name, overrides, expected) {
  const result = derived(overrides);
  assert.strictEqual(result.totalPaidWaitMinutes, expected.total, `${name}: total wait`);
  assert.strictEqual(result.paidPickupWaitMinutes, expected.pickup, `${name}: pickup wait`);
  assert.strictEqual(result.paidDropoffWaitMinutes, expected.dropoff, `${name}: unload wait`);
}

assertWaitMinutes(
  'stop timestamps never create paid wait',
  {
    arrivedPickupTime: '10:00',
    loadedTime: '11:30',
    arrivedDropoffTime: '14:00',
    completedTime: '14:45'
  },
  { pickup: 0, dropoff: 0, total: 0 }
);

assertWaitMinutes(
  'manual wait values are used exactly',
  {
    arrivedPickupTime: '12:00',
    loadedTime: '12:30',
    arrivedDropoffTime: '15:00',
    completedTime: '17:15',
    paidPickupWaitMinutes: 15,
    paidDropoffWaitMinutes: 75
  },
  { pickup: 15, dropoff: 75, total: 90 }
);

assertWaitMinutes(
  'separate stops do not combine under one hour',
  {
    arrivedPickupTime: '08:00',
    loadedTime: '08:45',
    arrivedDropoffTime: '09:30',
    completedTime: '10:15'
  },
  { pickup: 0, dropoff: 0, total: 0 }
);

assert.strictEqual(derived({
  arrivedPickupTime: '06:00',
  loadedTime: '06:30',
  arrivedDropoffTime: '20:30',
  completedTime: '21:00'
}).totalPaidWaitMinutes, 0, 'driving time is not counted as wait time');
assert.strictEqual(derived({ paidPickupWaitMinutes: null, paidDropoffWaitMinutes: null }).waitPay, 0, 'blank manual wait fields add zero wait pay');

const weightCheck = derived({
  grossBarrels: 100,
  bswPercentage: 1,
  apiGravity: 40,
  emptyTruckWeight: 28000
});
assert.ok(weightCheck.estimatedTotalLoadWeight > 28000, 'estimated load weight is calculated');
assert.ok(weightCheck.estimatedGrossTruckWeight > weightCheck.estimatedTotalLoadWeight, 'gross truck weight includes empty truck weight');

function assertPayPeriod(date, start, end, message) {
  const range = context.getCompanyPayPeriodRange(date);
  assert.strictEqual(range.start, start, `${message}: start`);
  assert.strictEqual(range.end, end, `${message}: end`);
}

assertPayPeriod('2026-07-10', '2026-07-01', '2026-07-15', 'first half pay period');
assertPayPeriod('2026-07-16', '2026-07-16', '2026-07-31', 'second half pay period');
assertPayPeriod('2028-02-20', '2028-02-16', '2028-02-29', 'leap-year February pay period');

function saveLoadRecord(overrides = {}) {
  const values = {
    'driver-name': 'Alex Driver',
    'truck-number': 'T-12',
    'trailer-number': 'TR-8',
    'load-date': '2026-07-12',
    'load-number': '1',
    'ticket-number': 'TK-1',
    'bol-number': 'BOL-1',
    'load-status': 'Completed Load',
    'gross-barrels': '100',
    'loaded-miles': '10',
    ...overrides
  };

  Object.entries(values).forEach(([id, value]) => setField(id, value));
  context.saveLoad({ preventDefault() {} });
  return JSON.parse(storage.get('personalOilfieldLoadTracker.loads'));
}

let storedLoads = saveLoadRecord();
assert.strictEqual(storedLoads.length, 1, 'saving one load creates one stored record');
assert.strictEqual(context.countUniqueLoads(), 1, 'total loads counts one saved record');
assert.strictEqual(storedLoads[0].estimatedPay, 51.41, 'loaded-mile pay table default is preserved');
assert.strictEqual(getElement('save-load-button').disabled, false, 'Firebase availability does not leave Save Load disabled');
assert.strictEqual(getElement('sync-status').textContent, 'Local changes pending', 'local save without cloud is marked pending instead of blocked');
assert.ok(JSON.parse(storage.get('personalOilfieldLoadTracker.meta')).cloudSync.localChangesPending, 'local pending sync marker is saved in metadata');

const firstLoadId = storedLoads[0].id;
context.loadEntryForEdit(firstLoadId);
setField('notes', 'Edited without duplicating');
context.saveLoad({ preventDefault() {} });
storedLoads = JSON.parse(storage.get('personalOilfieldLoadTracker.loads'));
assert.strictEqual(storedLoads.length, 1, 'editing existing load does not create duplicate storage row');
assert.strictEqual(storedLoads[0].id, firstLoadId, 'editing keeps the same record ID');

saveLoadRecord({
  'load-number': '2',
  'ticket-number': 'TK-2',
  'bol-number': 'BOL-2',
  'gross-barrels': '110',
  'loaded-miles': '12'
});
assert.strictEqual(context.countUniqueLoads(), 2, 'new saved load increases total load count');
assert.strictEqual(context.getLocalSafetyLoadCount(), 2, 'local safety copy count reflects the current local records');

setField('daily-date', '2026-07-12');
context.applyDailyAddOnsToControls();
setChecked('trainer-pay-checkbox', true);
setChecked('per-diem-checkbox', true);
setChecked('sleeper-berth-checkbox', true);
context.saveDailyAddOnFromControls();
let dailySummary = context.getDailyEarningsSummary('2026-07-12');
assert.strictEqual(dailySummary.trainerPay, 50, 'trainer pay default is $50');
assert.strictEqual(dailySummary.perDiemPay, 50, 'per diem default is $50');
assert.strictEqual(dailySummary.sleeperBerthPay, 60, 'sleeper default is $60');

setChecked('trainer-pay-checkbox', false);
setChecked('per-diem-checkbox', false);
setChecked('sleeper-berth-checkbox', false);
setField('daily-earnings-notes', '');
context.saveDailyAddOnFromControls();
let pendingDeleteMeta = JSON.parse(storage.get('personalOilfieldLoadTracker.meta'));
assert.ok(pendingDeleteMeta.cloudSync.pendingDeletes.dailyAddOns['2026-07-12'], 'clearing a daily add-on creates a pending-delete tombstone');
assert.ok(!JSON.parse(storage.get('personalOilfieldLoadTracker.dailyAddOns'))['2026-07-12'], 'clearing a daily add-on removes it locally');
assert.ok(!context.filterTombstonedDailyAddOns({ '2026-07-12': { date: '2026-07-12', perDiem: true } })['2026-07-12'], 'tombstoned daily add-on is excluded from cloud merge data');

setChecked('per-diem-checkbox', true);
setChecked('trainer-pay-checkbox', true);
setChecked('sleeper-berth-checkbox', true);
context.saveDailyAddOnFromControls();
pendingDeleteMeta = JSON.parse(storage.get('personalOilfieldLoadTracker.meta'));
assert.ok(!pendingDeleteMeta.cloudSync.pendingDeletes.dailyAddOns['2026-07-12'], 're-enabling a daily add-on cancels its tombstone');

setField('settings-trainer-rate', '55');
setField('settings-per-diem-rate', '52');
setField('settings-sleeper-rate', '65');
setField('settings-reject-rate', '25');
setField('settings-wait-rate', '30');
context.savePaySettingsFromControls();
dailySummary = context.getDailyEarningsSummary('2026-07-12');
assert.strictEqual(dailySummary.trainerPay, 55, 'trainer pay can be edited through settings');
assert.strictEqual(dailySummary.perDiemPay, 52, 'per diem can be edited through settings');
assert.strictEqual(dailySummary.sleeperBerthPay, 65, 'sleeper pay can be edited through settings');

const nextWorkflow = createStartupSmokeContext({});
Object.entries({
  'driver-name': 'Next Driver',
  'truck-number': 'NEXT-TRUCK',
  'trailer-number': 'NEXT-TRAILER',
  'load-date': '2026-07-14',
  'load-number': '1',
  'ticket-number': 'NEXT-TK-1',
  'bol-number': 'NEXT-BOL-1',
  'load-status': 'Completed Load',
  'gross-barrels': '115',
  'loaded-miles': '15',
  'notes': 'Clear this note'
}).forEach(([id, value]) => { nextWorkflow.context.document.getElementById(id).value = value; });
nextWorkflow.context.saveAndStartNextLoad();
assert.strictEqual(nextWorkflow.context.document.getElementById('load-date').value, '2026-07-14', 'Save Load & Start Next Load preserves the work date');
assert.strictEqual(nextWorkflow.context.document.getElementById('load-number').value, '2', 'Save Load & Start Next Load increments the load number');
assert.strictEqual(nextWorkflow.context.document.getElementById('ticket-number').value, '', 'Save Load & Start Next Load clears the prior ticket');
assert.strictEqual(nextWorkflow.context.document.getElementById('gross-barrels').value, '', 'Save Load & Start Next Load clears prior load measurements');
assert.strictEqual(nextWorkflow.context.document.getElementById('notes').value, '', 'Save Load & Start Next Load clears prior notes');

context.clearForm();
setField('load-date', '2026-07-12');
setField('pickup-location', 'Lease A');
setField('dropoff-location', 'Station B');
setField('ticket-number', 'DRAFT-TK');
context.saveDraftNow('Draft saved.');
assert.ok(storage.has('personalOilfieldLoadTracker.currentDraft'), 'draft is stored separately');
context.clearDraft();
assert.ok(!storage.has('personalOilfieldLoadTracker.currentDraft'), 'draft can be cleared without deleting loads');

storedLoads = JSON.parse(storage.get('personalOilfieldLoadTracker.loads'));
const secondLoadId = storedLoads.find((load) => load.id !== firstLoadId).id;
context.deleteLoadEntry(secondLoadId);
assert.strictEqual(context.countUniqueLoads(), 1, 'deleting one saved load decreases total load count');
pendingDeleteMeta = JSON.parse(storage.get('personalOilfieldLoadTracker.meta'));
assert.ok(pendingDeleteMeta.cloudSync.pendingDeletes.loads[secondLoadId], 'deleting a signed-out load creates a pending-delete tombstone');
assert.strictEqual(context.filterTombstonedLoads([{ id: secondLoadId }, { id: 'kept-load' }]).length, 1, 'tombstoned load is excluded from cloud merge data');
assert.ok(context.hasLocalChangesPending(), 'local changes pending remains active while tombstones exist');

context.queuePendingDelete('loads', 'failed-cloud-delete', { loadNumber: 'FAIL' });
context.processPendingDeletes();
pendingDeleteMeta = JSON.parse(storage.get('personalOilfieldLoadTracker.meta'));
assert.ok(pendingDeleteMeta.cloudSync.pendingDeletes.loads['failed-cloud-delete'], 'failed or unavailable cloud delete keeps its tombstone');
context.queuePendingDelete('loads', 'delete-one', {});
context.queuePendingDelete('loads', 'delete-two', {});
context.clearPendingDelete('loads', 'delete-one');
pendingDeleteMeta = JSON.parse(storage.get('personalOilfieldLoadTracker.meta'));
assert.ok(!pendingDeleteMeta.cloudSync.pendingDeletes.loads['delete-one'], 'successful delete clearing removes only its own tombstone');
assert.ok(pendingDeleteMeta.cloudSync.pendingDeletes.loads['delete-two'], 'clearing one tombstone does not clear unrelated deletes');

const backup = context.getTrackerSnapshot();
assert.strictEqual(backup.recordCount, 1, 'backup reports current record count');
assert.ok(backup.data.settings, 'backup includes app settings');
assert.ok(Array.isArray(backup.data.favoriteRoutes), 'backup safely preserves legacy favorite-route data');

const legacyLoad = context.normalizeSavedLoad({ id: 'legacy', loadDate: '2026-07-01', pickupLocation: 'Old Lease', dropoffLocation: 'Old Station' });
assert.strictEqual(legacyLoad.dispatcher, '', 'existing records without dispatcher remain valid');
assert.strictEqual(legacyLoad.pickupState, '', 'existing records without pickup state remain valid');
assert.strictEqual(context.normalizeSavedLoad({ id: 'weeks', pickupLocation: 'Weeks Island Central 1-6, LA' }).customer, 'Plains', 'historical Weeks Island loads are assigned to Plains');
assert.strictEqual(context.normalizeSavedLoad({ id: 'existing-company', pickupLocation: 'Weeks Island', customer: 'Shell' }).customer, 'Shell', 'migration does not overwrite an existing oil company');
assert.strictEqual(legacyLoad.cycleTimeMinutes, null, 'missing times are not treated as zero');
assert.doesNotThrow(() => context.parseBackupText(JSON.stringify({ loads: [{ id: 'old-backup', loadDate: '2026-06-01' }] })), 'older backups import without new fields');

const timed = context.calculateDerived(loadValues({ arrivedPickupTime: '23:30', loadedTime: '00:15', arrivedDropoffTime: '01:45', completedTime: '02:30' }));
assert.strictEqual(timed.pickupTimeMinutes, 45, 'pickup-site duration crosses midnight');
assert.strictEqual(timed.travelTimeMinutes, 90, 'travel duration calculates');
assert.strictEqual(timed.dropoffTimeMinutes, 45, 'drop-off duration calculates');
assert.strictEqual(timed.cycleTimeMinutes, 180, 'total cycle duration crosses midnight');

setField('daily-date', '2026-07-12');
setField('shift-start-time', '20:00');
setField('shift-end-time', '06:00');
context.saveDailyAddOnFromControls();
assert.strictEqual(context.getDailyEarningsSummary('2026-07-12').exactDutyMinutes, 600, 'exact duty time uses daily shift times and crosses midnight');

const simulatedCloudLoad = context.buildSynchronizedLoadPayload(context.normalizeSavedLoad({
  id: 'cross-device-load', loadDate: '2026-07-20', loadNumber: '1', ticketNumber: 'CLOUD-1', loadStatus: 'Completed Load',
  dispatcher: 'Morgan', pickupLocation: 'Hulin Lease', pickupState: 'LA', dropoffLocation: 'Burns Point', dropoffState: 'LA',
  loadedMiles: 10, arrivedPickupTime: '22:00', loadedTime: '23:00', arrivedDropoffTime: '00:30', completedTime: '01:30'
}));
const deviceB = createStartupSmokeContext({ 'personalOilfieldLoadTracker.loads': JSON.stringify([simulatedCloudLoad]) });
const received = deviceB.context.getTrackerSnapshot().data.loads[0];
assert.strictEqual(received.dispatcher, simulatedCloudLoad.dispatcher, 'device B normalizes the synchronized dispatcher');
assert.strictEqual(received.pickupState, simulatedCloudLoad.pickupState, 'device B normalizes synchronized states');
assert.strictEqual(received.cycleTimeMinutes, simulatedCloudLoad.cycleTimeMinutes, 'device B calculates the same cycle time');
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(deviceB.context.getDailyEarningsSummary('2026-07-20'))),
  JSON.parse(JSON.stringify(context.summarizeAnalysisRecords([simulatedCloudLoad]) && deviceB.context.getDailyEarningsSummary('2026-07-20'))),
  'simulated devices calculate the same daily totals from the same cloud load'
);
const editedCloudLoad = deviceB.context.buildSynchronizedLoadPayload({ ...received, dispatcher: 'Taylor', updatedAt: '2026-07-21T00:00:00.000Z' });
const deviceAAfterEdit = createStartupSmokeContext({ 'personalOilfieldLoadTracker.loads': JSON.stringify([editedCloudLoad]) });
assert.strictEqual(deviceAAfterEdit.context.countUniqueLoads(), 1, 'receiving an edited cloud record does not duplicate it');
assert.strictEqual(deviceAAfterEdit.context.getTrackerSnapshot().data.loads[0].dispatcher, 'Taylor', 'device A receives the device B edit');
deviceB.context.queuePendingDelete('loads', 'cross-device-load', {});
assert.strictEqual(deviceB.context.filterTombstonedLoads([editedCloudLoad]).length, 0, 'durable tombstone prevents a deleted cloud load from returning');

const paidTimeConflict = context.mergeRecordsByUpdatedAt(
  [{ id: 'paid-conflict', notes: 'new cloud edit', updatedAt: '2026-07-21T12:00:00.000Z' }],
  [{ id: 'paid-conflict', notes: 'old local copy', updatedAt: '2026-07-20T12:00:00.000Z' }]
);
assert.strictEqual(paidTimeConflict.length, 1, 'paid-time merge does not create duplicate records');
assert.strictEqual(paidTimeConflict[0].notes, 'new cloud edit', 'newer cloud paid-time edit wins over older local data');
const addOnConflict = context.mergeDateRecordsByUpdatedAt(
  { '2026-07-21': { notes: 'new cloud add-on', updatedAt: '2026-07-21T12:00:00.000Z' } },
  { '2026-07-21': { notes: 'old local add-on', updatedAt: '2026-07-20T12:00:00.000Z' } }
);
assert.strictEqual(addOnConflict['2026-07-21'].notes, 'new cloud add-on', 'newer cloud daily add-on wins over older local data');

deviceAAfterEdit.context.navigator.onLine = false;
deviceAAfterEdit.context.markLocalChangesPending('offline test');
vm.runInContext("cloudSync.enabled = true; cloudSync.authReady = true; cloudSync.user = { uid: 'offline-user' }; cloudSync.db = {}; cloudSync.sdk = {};", deviceAAfterEdit.context);
deviceAAfterEdit.context.updateSyncStatusFromState();
assert.strictEqual(deviceAAfterEdit.context.document.getElementById('sync-status').textContent, 'Offline—changes pending', 'offline changes use the accurate pending status');

const completedAndReject = [
  context.normalizeSavedLoad({ id: 'completed-analysis', loadDate: '2026-07-12', loadStatus: 'Completed Load', estimatedPay: 100 }),
  context.normalizeSavedLoad({ id: 'reject-analysis', loadDate: '2026-07-12', loadStatus: 'Reject', loadedMiles: 10 })
];
const analysis = context.summarizeAnalysisRecords(completedAndReject);
assert.strictEqual(analysis.completedLoads, 1, 'rejects are excluded from completed-load counts');
assert.strictEqual(analysis.rejects, 1, 'rejects are counted separately');
assert.strictEqual(analysis.totalLoads, 2, 'rejects remain included in total assignments');
assert.ok(analysis.rejectPay > 0, 'reject pay remains included');
assert.strictEqual(context.groupAnalysis([simulatedCloudLoad], (load) => load.dispatcher)[0].name, 'Morgan', 'dispatcher grouping is correct');
assert.strictEqual(context.groupAnalysis([simulatedCloudLoad], context.getStateRoute)[0].name, 'LA → LA', 'state-route grouping is correct');

function analysisLoad(overrides = {}) {
  return context.normalizeSavedLoad({
    id: overrides.id || `analysis-${Math.random()}`,
    loadDate: '2026-08-01', loadStatus: 'Completed Load', loadedMiles: 10,
    arrivedPickupTime: '08:00', loadedTime: '09:00', arrivedDropoffTime: '10:00', completedTime: '11:00',
    ...overrides
  });
}

const midnightTwo = [
  analysisLoad({ id: 'midnight-1', loadNumber: '1', arrivedPickupTime: '22:00', completedTime: '23:30' }),
  analysisLoad({ id: 'midnight-2', loadNumber: '2', arrivedPickupTime: '00:30', completedTime: '02:00' })
];
assert.strictEqual(context.normalizeDailyTimeline(midnightTwo).spanMinutes, 240, 'two loads crossing midnight produce a four-hour span');
assert.strictEqual(context.normalizeDailyTimeline(midnightTwo.slice().reverse()).spanMinutes, 240, 'out-of-order storage uses numeric load order');
const midnightThree = [...midnightTwo, analysisLoad({ id: 'midnight-3', loadNumber: '3', arrivedPickupTime: '02:30', completedTime: '04:00' })];
assert.strictEqual(context.normalizeDailyTimeline(midnightThree).spanMinutes, 360, 'three loads crossing midnight normalize continuously');
assert.strictEqual(context.normalizeDailyTimeline([analysisLoad({ id: 'single-cross', arrivedPickupTime: '23:00', completedTime: '01:00' })]).spanMinutes, 120, 'one load crossing midnight remains correct');
assert.strictEqual(context.normalizeDailyTimeline([analysisLoad({ id: 'missing-pickup', arrivedPickupTime: '', completedTime: '01:00' })]).spanMinutes, null, 'missing pickup does not become zero');
assert.strictEqual(context.normalizeDailyTimeline([analysisLoad({ id: 'missing-completion', arrivedPickupTime: '23:00', completedTime: '' })]).spanMinutes, null, 'missing completion does not become zero');
const overlapping = [
  analysisLoad({ id: 'overlap-1', loadNumber: '1', arrivedPickupTime: '10:00', completedTime: '12:00' }),
  analysisLoad({ id: 'overlap-2', loadNumber: '2', arrivedPickupTime: '11:00', completedTime: '13:00' })
];
assert.strictEqual(context.normalizeDailyTimeline(overlapping).status, 'review', 'overlapping sequence produces Timeline needs review');
const fallbackOrder = [
  analysisLoad({ id: 'fallback-2', loadNumber: '', savedAt: '2026-08-01T12:00:00Z', arrivedPickupTime: '12:00', completedTime: '13:00' }),
  analysisLoad({ id: 'fallback-1', loadNumber: '', savedAt: '2026-08-01T08:00:00Z', arrivedPickupTime: '08:00', completedTime: '09:00' })
];
assert.strictEqual(context.normalizeDailyTimeline(fallbackOrder).spanMinutes, 300, 'savedAt ordering is the fallback');

setField('daily-date', '2026-08-01');
context.applyDailyAddOnsToControls();
setChecked('per-diem-checkbox', true);
setChecked('trainer-pay-checkbox', true);
setChecked('sleeper-berth-checkbox', true);
setField('shift-start-time', '08:00');
setField('shift-end-time', '20:00');
context.saveDailyAddOnFromControls();
const oneDispatcherDay = [analysisLoad({ id: 'day-a-1', dispatcher: 'Brandon', loadNumber: '1' }), analysisLoad({ id: 'day-a-2', dispatcher: 'brandon', loadNumber: '2', arrivedPickupTime: '12:00', completedTime: '15:00' })];
const oneDispatcherRows = context.buildDispatcherDayComparison(oneDispatcherDay);
assert.strictEqual(oneDispatcherRows.length, 1, 'one dispatcher creates one dispatcher-day group');
assert.strictEqual(oneDispatcherRows[0].name, 'Brandon', 'dispatcher spelling is reused case-insensitively');
assert.strictEqual(oneDispatcherRows[0].workdays, 1, 'a date is attributed once');
assert.strictEqual(oneDispatcherRows[0].perDiemPay, 52, 'per diem is attributed once per dispatcher day');
assert.strictEqual(oneDispatcherRows[0].trainerPay, 55, 'trainer pay is attributed once per dispatcher day');
assert.strictEqual(oneDispatcherRows[0].sleeperPay, 65, 'sleeper pay is attributed once per dispatcher day');
const namedWithBlank = context.buildDispatcherDayComparison([oneDispatcherDay[0], analysisLoad({ id: 'day-blank', dispatcher: '', loadNumber: '3' })]);
assert.strictEqual(namedWithBlank[0].name, 'Brandon', 'a named dispatcher plus a blank load remains a named-dispatcher day');
assert.strictEqual(namedWithBlank[0].missingDispatcherLoads, 1, 'named-dispatcher day reports blank dispatcher loads separately');
const mixedDay = [oneDispatcherDay[0], analysisLoad({ id: 'day-b-1', dispatcher: 'Taylor', loadNumber: '2', arrivedPickupTime: '12:00', completedTime: '15:00' })];
const mixedRows = context.buildDispatcherDayComparison(mixedDay);
assert.strictEqual(mixedRows.length, 1, 'two dispatchers on one date create one day group');
assert.strictEqual(mixedRows[0].name, 'Mixed Dispatchers', 'mixed dispatcher day is labeled correctly');
assert.strictEqual(mixedRows[0].exactDutyMinutes, 720, 'mixed dispatcher day does not duplicate duty time');
assert.strictEqual(mixedRows[0].perDiemPay, 52, 'mixed dispatcher day does not duplicate per diem');
assert.strictEqual(context.buildDispatcherDayComparison([analysisLoad({ id: 'unknown-day', dispatcher: '' })])[0].name, 'Unknown', 'unknown dispatcher remains separate');

const loadOnly = context.summarizeLoadLevelRecords(mixedDay);
assert.strictEqual(loadOnly.loadEntryEarnings, mixedDay.reduce((total, load) => total + load.estimatedEntryPay, 0), 'load comparison uses load-entry earnings only');
assert.ok(!Object.hasOwn(loadOnly, 'perDiemPay'), 'load comparison excludes per diem');
assert.ok(!Object.hasOwn(loadOnly, 'exactDutyMinutes'), 'load comparison excludes full-day duty time');
assert.strictEqual(loadOnly.averageBasePayPerCompletedLoad, loadOnly.completedBasePay / loadOnly.completedLoads, 'average base pay excludes wait pay');
assert.strictEqual(loadOnly.averageAllInCompletedEarnings, loadOnly.loadEntryEarnings / loadOnly.completedLoads, 'average all-in completed earnings includes wait pay');
assert.ok(isFinite(loadOnly.cycleHourEarnings), 'cycle-hour earnings use valid load cycles');
assert.strictEqual(context.groupLoadAnalysis(mixedDay, context.getStateRoute).reduce((total, row) => total + row.totalLoads, 0), mixedDay.length, 'each load appears once in route grouping');

const filterRecords = [
  analysisLoad({ id: 'filter-brandon', loadDate: '2026-08-02', dispatcher: 'Brandon', pickupState: 'LA', dropoffState: 'TX' }),
  analysisLoad({ id: 'filter-taylor', loadDate: '2026-08-02', dispatcher: 'Taylor', pickupState: 'TX', dropoffState: 'TX' }),
  analysisLoad({ id: 'filter-brandon-only', loadDate: '2026-08-03', dispatcher: 'Brandon', pickupState: 'LA', dropoffState: 'LA' })
];
const filterBaseline = context.summarizeAnalysisRecords(filterRecords, '2026-08-02', '2026-08-03');
const noFilterRecords = context.filterAnalysisRecords(filterRecords, { dispatcher: '', pickupState: '', dropoffState: '', stateRoute: '', exactRoute: '' });
assert.strictEqual(context.summarizeLoadLevelRecords(noFilterRecords).totalLoads, filterBaseline.totalLoads, 'no active filter produces matching baseline and load totals');
const brandonFiltered = context.filterAnalysisRecords(filterRecords, { dispatcher: 'Brandon', pickupState: '', dropoffState: '', stateRoute: '', exactRoute: '' });
const filterSummary = context.summarizeLoadLevelRecords(brandonFiltered);
assert.strictEqual(filterBaseline.totalLoads, 3, 'baseline contains all date-range records');
assert.strictEqual(filterSummary.totalLoads, 2, 'dispatcher filter creates a separate filtered load scope');
assert.strictEqual(filterBaseline.totalLoads, 3, 'baseline remains unchanged after filtering');
assert.ok(brandonFiltered.every((load) => load.dispatcher === 'Brandon'), 'underlying filtered records contain only matching loads');
const filterGroups = [
  context.groupLoadAnalysis(brandonFiltered, (load) => load.dispatcher), context.groupLoadAnalysis(brandonFiltered, (load) => context.displayState(load.pickupState)),
  context.groupLoadAnalysis(brandonFiltered, (load) => context.displayState(load.dropoffState)), context.groupLoadAnalysis(brandonFiltered, context.getStateRoute),
  context.groupLoadAnalysis(brandonFiltered, context.formatRoute)
];
assert.ok(filterGroups.every((rows) => rows.reduce((total, row) => total + row.totalLoads, 0) === 2), 'all load comparisons use the filtered records');
assert.strictEqual(context.filterDispatcherDays(filterRecords, 'Brandon').length, 1, 'dispatcher day filtering selects whole-day groups only');
assert.strictEqual(context.filterDispatcherDays(filterRecords, 'Mixed Dispatchers').length, 1, 'Mixed Dispatchers remains a separate whole-day group');
assert.strictEqual(context.filterDispatcherDays(filterRecords, '').length, 2, 'state and route filters do not alter dispatcher-day records');
assert.ok(context.reconcileBaselineAnalysis(filterBaseline, context.buildDispatcherDayComparison(filterRecords)).ok, 'baseline reconciliation passes independently');
assert.ok(context.reconcileFilteredLoadAnalysis(filterSummary, ...filterGroups).ok, 'filtered load reconciliation passes independently');

const weightedIndicators = context.getWorkdayIndicators([
  { date: '2026-09-01', dutyTimeSource: 'exact', exactDutyMinutes: 60, completedLoadCount: 1, totalEstimatedDailyEarnings: 100 },
  { date: '2026-09-02', dutyTimeSource: 'exact', exactDutyMinutes: 600, completedLoadCount: 1, totalEstimatedDailyEarnings: 200 },
  { date: '2026-09-03', dutyTimeSource: 'estimated', exactDutyMinutes: null, completedLoadCount: 1, totalEstimatedDailyEarnings: 1000 },
  { date: '2026-09-04', dutyTimeSource: 'exact', exactDutyMinutes: 0, completedLoadCount: 1, totalEstimatedDailyEarnings: 1000 }
]);
assert.strictEqual(weightedIndicators['Weighted exact-duty range hourly earnings'], '$27.27', 'weighted exact hourly rate uses total earnings divided by total hours');
assert.strictEqual(weightedIndicators['Exact-duty days below weighted range rate'], 1, 'long lower-rate day falls below the weighted rate');
assert.strictEqual(weightedIndicators['Exact-duty days at or above weighted range rate'], 1, 'short higher-rate day falls above the weighted rate');

const exactDaySummary = context.getDailyEarningsSummary('2026-08-01', oneDispatcherDay);
assert.strictEqual(exactDaySummary.dutyTimeSource, 'exact', 'exact shift time takes priority over estimated time');
assert.ok(context.isFiniteNumber(exactDaySummary.activeLoadCycleMinutes), 'active cycle time is available for exact-shift days');
assert.strictEqual(exactDaySummary.nonLoadDutyMinutes, exactDaySummary.exactDutyMinutes - exactDaySummary.activeLoadCycleMinutes, 'non-load duty time subtracts unique active cycles');
assert.ok(exactDaySummary.activeLoadUtilization > 0, 'active-load utilization is calculated without dividing by zero');
const validUtilization = context.summarizeAnalysisRecords(oneDispatcherDay);
assert.strictEqual(validUtilization.utilizationExactDutyMinutes, 720, 'valid utilization uses exact duty from the same valid day set');
assert.strictEqual(validUtilization.activeLoadUtilization, validUtilization.activeLoadCycleMinutes / 720 * 100, 'utilization numerator and denominator use matching days');

setField('daily-date', '2026-08-04');
context.applyDailyAddOnsToControls();
setField('shift-start-time', '08:00');
setField('shift-end-time', '20:00');
context.saveDailyAddOnFromControls();
const invalidExactLoads = [
  analysisLoad({ id: 'invalid-exact-1', loadDate: '2026-08-04', loadNumber: '1', arrivedPickupTime: '10:00', completedTime: '12:00' }),
  analysisLoad({ id: 'invalid-exact-2', loadDate: '2026-08-04', loadNumber: '2', arrivedPickupTime: '11:00', completedTime: '13:00' })
];
const validAndInvalidUtilization = context.summarizeAnalysisRecords([...oneDispatcherDay, ...invalidExactLoads]);
assert.strictEqual(validAndInvalidUtilization.exactDays, 2, 'both dates remain exact-duty days');
assert.strictEqual(validAndInvalidUtilization.exactUtilizationDays, 1, 'timeline-error exact day is excluded from utilization');
assert.strictEqual(validAndInvalidUtilization.excludedExactUtilizationDays, 1, 'excluded exact-duty day is disclosed');
assert.strictEqual(validAndInvalidUtilization.utilizationExactDutyMinutes, 720, 'excluded exact-duty minutes do not reduce utilization percentage');

setField('daily-date', '2026-08-05');
context.applyDailyAddOnsToControls();
setField('shift-start-time', '08:00');
setField('shift-end-time', '20:00');
context.saveDailyAddOnFromControls();
const missingCycleExact = [analysisLoad({ id: 'missing-cycle-exact', loadDate: '2026-08-05', arrivedPickupTime: '', completedTime: '' })];
const noValidUtilization = context.summarizeAnalysisRecords(missingCycleExact);
assert.strictEqual(noValidUtilization.exactUtilizationDays, 0, 'exact day missing cycle data is excluded from utilization');
assert.strictEqual(noValidUtilization.activeLoadUtilization, null, 'no valid utilization data remains unavailable rather than zero percent');
setField('daily-date', '2026-08-01');
context.applyDailyAddOnsToControls();
setField('shift-start-time', '');
setField('shift-end-time', '');
context.saveDailyAddOnFromControls();
const estimatedDaySummary = context.getDailyEarningsSummary('2026-08-01', midnightTwo);
assert.strictEqual(estimatedDaySummary.estimatedTrackedSpanMinutes, 240, 'daily estimated span uses normalized midnight timeline');
assert.strictEqual(estimatedDaySummary.nonLoadDutyMinutes, null, 'non-load duty time is not calculated from estimated spans');
assert.strictEqual(context.getDailyEarningsSummary('2026-08-01', overlapping).timelineStatus, 'review', 'timeline-error day is marked for review');

const counts = context.summarizeLoadLevelRecords([
  analysisLoad({ id: 'count-1' }), analysisLoad({ id: 'count-2' }), analysisLoad({ id: 'count-r', loadStatus: 'Reject' })
]);
assert.deepStrictEqual([counts.completedLoads, counts.rejects, counts.totalLoads], [2, 1, 3], 'completed, reject, and assignment counts reconcile');

const operationalLoad = context.normalizeSavedLoad({
  id: 'operational-load',
  loadDate: '2026-08-12',
  loadStatus: 'Completed Load',
  grossBarrels: 180,
  startMeterReading: 1000,
  endMeterReading: 1178.5,
  emptyTruckWeight: 31000,
  loadWeight: 72000,
  deadheadStartTime: '23:40',
  deadheadEndTime: '00:25',
  deadheadMiles: 31.5
});
assert.strictEqual(operationalLoad.barrelsOffloaded, 178.5, 'total barrels offloaded equals end meter minus start meter');
assert.strictEqual(operationalLoad.differenceVsGrossBarrels, 1.5, 'metered difference equals gross barrels minus offloaded barrels');
assert.strictEqual(operationalLoad.offloadStatus, 'Short by 1.50 barrels', 'positive metered difference is labeled as shortage');
assert.strictEqual(operationalLoad.estimatedGrossTruckWeight, 103000, 'gross truck weight uses empty weight plus corrected load weight');
assert.strictEqual(operationalLoad.deadheadTravelMinutes, 45, 'deadhead duration handles crossing midnight');
assert.strictEqual(operationalLoad.deadheadMiles, 31.5, 'load-specific deadhead miles persist');
const syncedOperationalLoad = context.buildSynchronizedLoadPayload(operationalLoad);
assert.strictEqual(syncedOperationalLoad.deadheadTravelMinutes, 45, 'deadhead duration is included in synchronized load payload');
assert.strictEqual(syncedOperationalLoad.deadheadMiles, 31.5, 'deadhead miles are included in synchronized load payload');
assert.strictEqual(syncedOperationalLoad.loadWeight, 72000, 'manual load weight is included in synchronized load payload');

const goalLoad = (id, pay, status = 'Completed Load') => ({ id, loadDate: '2026-09-01', loadStatus: status, estimatedPay: pay });
const belowGoal = context.calculateDailyCompletedLoadPayGoal([goalLoad('goal-249', 249)], 300);
assert.strictEqual(belowGoal.goalStatus, 'Below goal', '$249 completed-load pay against $300 is below goal');
assert.strictEqual(belowGoal.amountBelowGoal, 51, 'below-goal difference is $51');
assert.strictEqual(context.calculateDailyCompletedLoadPayGoal([goalLoad('goal-300', 300)], 300).goalStatus, 'Goal met', 'exactly $300 meets goal');
const aboveGoal = context.calculateDailyCompletedLoadPayGoal([goalLoad('goal-325', 325)], 300);
assert.strictEqual(aboveGoal.goalStatus, 'Goal met', '$325 meets goal');
assert.strictEqual(aboveGoal.amountAboveGoal, 25, 'above-goal difference is $25');
assert.strictEqual(context.calculateDailyCompletedLoadPayGoal([goalLoad('goal-reject', 500, 'Reject')], 300).goalStatus, 'Below goal', 'reject-only dispatched day remains eligible but has zero completed-load pay');
assert.strictEqual(context.calculateDailyCompletedLoadPayGoal([], 300).goalStatus, 'Not eligible', 'day without dispatched load records is not a failed goal day');
assert.strictEqual(context.normalizeAppSettings({}).dailyCompletedLoadPayGoal, 300, 'daily completed-load-pay goal defaults to $300');
assert.strictEqual(context.normalizeAppSettings({}).fairDayGoal, 280, 'Fair Day Goal defaults to $280');
assert.strictEqual(context.normalizeAppSettings({}).excellentDayGoal, 300, 'Excellent Day Goal defaults to $300');
assert.strictEqual(context.normalizeAppSettings({ dailyCompletedLoadPayGoal: 312.75 }).dailyCompletedLoadPayGoal, 312.75, 'goal supports dollars and cents in existing settings object');
assert.strictEqual(context.normalizeAppSettings({ dailyCompletedLoadPayGoal: 312.75 }).excellentDayGoal, 312.75, 'legacy single goal maps to Excellent Day Goal');

const historicalRecords = [goalLoad('historical-a', 249)];
const historicalBefore = JSON.stringify(historicalRecords);
assert.strictEqual(context.getDailyEarningsSummary('2026-09-01', historicalRecords).goalStatus, 'Below goal', 'historical records receive goal status without editing');
historicalRecords[0] = goalLoad('historical-a', 325);
assert.strictEqual(context.getDailyEarningsSummary('2026-09-01', historicalRecords).goalStatus, 'Goal met', 'editing historical pay recalculates the date');
assert.strictEqual(context.getDailyEarningsSummary('2026-09-01', []).goalStatus, 'Not eligible', 'deleting historical load makes the date not eligible instead of failed');
assert.notStrictEqual(JSON.stringify(historicalRecords), historicalBefore, 'test fixture edit is explicit');
const immutableRecords = [goalLoad('immutable-report', 249)];
const immutableSnapshot = JSON.stringify(immutableRecords);
context.getDailyEarningsSummary('2026-09-01', immutableRecords);
assert.strictEqual(JSON.stringify(immutableRecords), immutableSnapshot, 'viewing goal reports does not modify saved load records');

const addOnIndependence = context.calculateDailyCompletedLoadPayGoal([goalLoad('base-249', 249)], 300);
['Per diem', 'Wait pay', 'Reject pay', 'Sleeper pay', 'Trainer pay'].forEach((label) => {
  assert.strictEqual(addOnIndependence.goalStatus, 'Below goal', `${label} does not count toward goal`);
});
const unchangedEarningsFormula = context.getDailyEarningsSummary('2026-09-01', [goalLoad('earnings-formula', 249)]);
assert.strictEqual(unchangedEarningsFormula.totalEstimatedDailyEarnings, unchangedEarningsFormula.totalEstimatedEntryPay + unchangedEarningsFormula.perDiemPay + unchangedEarningsFormula.sleeperBerthPay + unchangedEarningsFormula.trainerPay, 'total estimated daily earnings formula remains unchanged');

const goalRange = context.summarizeDailyGoalResults([
  { eligibleDispatchedDay: true, goalStatus: 'Goal met', fairGoalStatus: 'Goal met', excellentGoalStatus: 'Goal met', completedLoadPay: 300, amountAboveGoal: 0, amountBelowGoal: 0, goalDifference: 0 },
  { eligibleDispatchedDay: true, goalStatus: 'Goal met', fairGoalStatus: 'Goal met', excellentGoalStatus: 'Goal met', completedLoadPay: 325, amountAboveGoal: 25, amountBelowGoal: 0, goalDifference: 25 },
  { eligibleDispatchedDay: true, goalStatus: 'Below goal', fairGoalStatus: 'Below goal', excellentGoalStatus: 'Below goal', completedLoadPay: 249, amountAboveGoal: 0, amountBelowGoal: 51, goalDifference: -51 },
  { eligibleDispatchedDay: false, goalStatus: 'Not eligible', fairGoalStatus: 'Not eligible', excellentGoalStatus: 'Not eligible', completedLoadPay: 0, amountAboveGoal: null, amountBelowGoal: null, goalDifference: null }
]);
assert.deepStrictEqual([goalRange.daysGoalMet, goalRange.daysBelowGoal, goalRange.daysInsufficientData], [2, 1, 1], 'pay-period and monthly goal counts aggregate correctly');
assert.deepStrictEqual([goalRange.fairGoalDays, goalRange.excellentGoalDays, goalRange.belowFairGoalDays], [2, 2, 1], 'Fair and Excellent goal counts aggregate independently');
assert.ok(html.includes('Fair Day Goal') && html.includes('Excellent Day Goal'), 'editable Fair and Excellent goal settings are displayed');
assert.ok(script.includes("'Fair Day Goal'") && script.includes("'Excellent Goal status'") && script.includes("'Excellent Goal difference'"), 'daily and analysis CSV output contains goal information');

assert.strictEqual(context.getDutyTimeStatus({ exactDutyMinutes: 719 }), 'Normal Range', 'shift shorter than 12 hours is normal range');
assert.strictEqual(context.getDutyTimeStatus({ exactDutyMinutes: 720 }), 'Extended Duty Day', 'exactly 12 hours is extended duty');
assert.strictEqual(context.getDutyTimeStatus({ exactDutyMinutes: 839 }), 'Extended Duty Day', '13 hours 59 minutes is extended duty');
assert.strictEqual(context.getDutyTimeStatus({ exactDutyMinutes: 840 }), 'Potential HOS Concern — Review ELD', 'exactly 14 hours reaches review threshold');
assert.strictEqual(context.getDutyTimeStatus({ exactDutyMinutes: 900 }), 'Potential HOS Concern — Review ELD', 'longer than 14 hours reaches review threshold');
assert.strictEqual(context.getDutyTimeStatus({ exactDutyMinutes: null }), 'Estimated or Incomplete', 'missing exact shift time is estimated or incomplete');

const mergedCycles = [
  analysisLoad({ id: 'merged-cycle-1', loadNumber: '1', arrivedPickupTime: '08:00', completedTime: '11:00' }),
  analysisLoad({ id: 'merged-cycle-2', loadNumber: '2', arrivedPickupTime: '10:00', completedTime: '13:00' })
];
assert.strictEqual(context.getMergedActiveCycleMinutes(mergedCycles), 300, 'overlapping load cycles are merged without double counting');
const separateCycles = [
  analysisLoad({ id: 'separate-cycle-1', loadNumber: '1', arrivedPickupTime: '08:00', completedTime: '10:00' }),
  analysisLoad({ id: 'separate-cycle-2', loadNumber: '2', arrivedPickupTime: '11:00', completedTime: '13:00' })
];
assert.strictEqual(context.getMergedActiveCycleMinutes(separateCycles), 240, 'non-overlapping load cycles are totaled');

const normalizedWorkday = context.normalizeDailyAddOns({ '2026-09-02': {
  workDate: '2026-09-02', defaultDispatcher: 'Morgan', shiftStartTime: '20:00', shiftEndTime: '06:00',
  dailyNotes: 'Cross-midnight shift', perDiem: true, sleeperBerth: true, trainerPay: false
} })['2026-09-02'];
assert.strictEqual(normalizedWorkday.defaultDispatcher, 'Morgan', 'daily workday default dispatcher normalizes');
assert.strictEqual(normalizedWorkday.dailyNotes, 'Cross-midnight shift', 'daily workday notes normalize');
assert.strictEqual(context.getWorkdayStatus(normalizedWorkday), 'Completed', 'workday with start and end is completed');
assert.strictEqual(context.durationBetween(normalizedWorkday.shiftStartTime, normalizedWorkday.shiftEndTime), 600, 'workday shift crossing midnight calculates correctly');

const readinessLoads = [analysisLoad({ id: 'ready-load', dispatcher: 'Morgan', pickupLocation: 'A', dropoffLocation: 'B' })];
const readinessResult = context.summarizeAnalysisRecords(readinessLoads);
assert.ok(['Analysis Ready', 'Partially Ready', 'Limited Analysis'].includes(context.getAnalysisReadiness(readinessResult).label), 'analysis readiness returns an approved status');
assert.ok(html.includes('Start Workday') && html.includes('End Workday'), 'dashboard provides start and end workday actions');
assert.ok(html.includes('Duty-Time Review'), 'reports include Duty-Time Review');
assert.ok(html.includes('Official ELD and company records control'), 'Duty-Time Review includes permanent ELD limitation');
assert.ok(script.includes("'Daily Dispatch Results'") && script.includes("'Duty-time category'"), 'analysis CSV includes dispatch outcome and duty-time data');
assert.ok(script.includes("['Workload observation', getWorkloadObservation(record)]"), 'printed daily report includes workload observation');
assert.ok(script.includes("defaultDispatcher: String(addOn.defaultDispatcher"), 'daily default dispatcher participates in normalization');

const deadheadHour = context.normalizePaidTimeRecord({ id: 'pt-1', workDate: '2026-09-03', category: 'Deadhead', startTime: '13:30', endTime: '14:30', hourlyRate: 24, deadheadMiles: 35 });
assert.strictEqual(deadheadHour.durationMinutes, 60, 'one-hour deadhead duration calculates');
assert.strictEqual(deadheadHour.estimatedPay, 24, 'deadhead pay uses hours at $24');
assert.strictEqual(deadheadHour.deadheadMiles, 35, 'deadhead miles remain separate from pay');
const fractionalPaid = context.normalizePaidTimeRecord({ id: 'pt-2', workDate: '2026-09-03', category: 'Truck Wash', startTime: '13:30', endTime: '15:45', hourlyRate: 24 });
assert.strictEqual(fractionalPaid.durationMinutes, 135, 'fractional paid time calculates');
assert.strictEqual(fractionalPaid.estimatedPay, 54, 'fractional paid time pay calculates');
assert.strictEqual(context.normalizePaidTimeRecord({ id: 'pt-midnight', category: 'Breakdown', startTime: '23:00', endTime: '01:00', hourlyRate: 24 }).durationMinutes, 120, 'paid time crosses midnight');
assert.strictEqual(context.normalizePaidTimeRecord({ id: 'pt-custom', category: 'Other Hourly Work', startTime: '08:00', endTime: '09:30', hourlyRate: 30 }).estimatedPay, 45, 'other hourly work supports custom rate');
const vacationPaid = context.normalizePaidTimeRecord({ id: 'pt-vacation', workDate: '2026-09-04', category: 'Vacation Time' });
assert.strictEqual(vacationPaid.estimatedPay, 270, 'vacation time pays the fixed $270 daily rate');
assert.strictEqual(vacationPaid.quantity, 1, 'vacation time is one date-specific day');
assert.strictEqual(vacationPaid.quantityUnit, 'day', 'vacation quantity is stored as days');
assert.strictEqual(vacationPaid.rate, 270, 'vacation stores its applicable daily rate');
assert.strictEqual(vacationPaid.calculatedAmount, 270, 'vacation stores its calculated amount');
assert.strictEqual(vacationPaid.durationMinutes, null, 'vacation time does not require artificial hourly duration');
assert.strictEqual(context.normalizeDateKey('2026-03-08'), '2026-03-08', 'spring daylight-saving date remains a date-only key');
assert.strictEqual(context.normalizeDateKey('2026-11-01'), '2026-11-01', 'fall daylight-saving date remains a date-only key');
assert.strictEqual(context.normalizeDateKey('2026-02-30'), '', 'invalid date-only keys are rejected instead of shifted');
setField('paid-time-date', '2026-09-04');
setField('paid-time-category', 'Vacation Time');
context.savePaidTime({ preventDefault() {} });
assert.strictEqual(context.getDailyEarningsSummary('2026-09-04').vacationPay, 270, 'saved vacation time flows into the daily summary');
assert.strictEqual(context.getDailyEarningsSummary('2026-09-04').totalEstimatedDailyEarnings, 270, 'vacation pay flows into total daily earnings');
assert.strictEqual(context.getDailyEarningsSummary('2026-09-03').vacationPay, 0, 'vacation does not shift to the previous date');
assert.strictEqual(context.getDailyEarningsSummary('2026-09-05').vacationPay, 0, 'vacation does not shift to the next date');
const vacationId = JSON.parse(storage.get('personalOilfieldLoadTracker.paidTime'))[0].id;
setField('paid-time-date', '2026-09-04');
setField('paid-time-category', 'Vacation Time');
context.savePaidTime({ preventDefault() {} });
const vacationRows = JSON.parse(storage.get('personalOilfieldLoadTracker.paidTime')).filter((item) => item.workDate === '2026-09-04' && item.category === 'Vacation Time');
assert.strictEqual(vacationRows.length, 1, 'a second vacation entry on the same date updates instead of duplicates');
assert.strictEqual(vacationRows[0].id, vacationId, 'vacation update retains the original record ID');

setField('office-day-date', '2026-09-08');
setField('office-day-arrived', '08:00');
setField('office-day-left', '16:00');
setField('office-day-notes', 'Office support');
context.saveOfficeDay({ preventDefault() {} });
let officeRows = JSON.parse(storage.get('personalOilfieldLoadTracker.paidTime')).filter((item) => item.workDate === '2026-09-08' && item.category === 'Office Time');
assert.strictEqual(officeRows.length, 1, 'Office Day saves through existing paid-time storage');
assert.strictEqual(officeRows[0].durationMinutes, 480, 'Office Day calculates eight office hours');
assert.strictEqual(officeRows[0].estimatedPay, 192, 'Office Day pays $24 per hour');
const officeId = officeRows[0].id;
let officeSummary = context.getDailyEarningsSummary('2026-09-08');
assert.strictEqual(officeSummary.perDiemPay, context.getPayRate('perDiemPay'), 'Office Day receives automatic per diem once');
assert.strictEqual(officeSummary.totalEstimatedDailyEarnings, 192 + context.getPayRate('perDiemPay'), 'Office pay and per diem are combined once');
assert.strictEqual(officeSummary.exactDutyMinutes, 480, 'office-only duty time uses arrival and departure');
assert.strictEqual(officeSummary.effectiveHourlyEarnings, (192 + context.getPayRate('perDiemPay')) / 8, 'office-only effective hourly earnings use office duty hours');
assert.strictEqual(officeSummary.workdayStatus, 'Office Day', 'office-only workday status is Office Day');
assert.strictEqual(officeSummary.excellentGoalStatus, 'Not applicable — Office Day', 'office-only day is excluded from completed-load goals');
assert.strictEqual(context.getDailyDispatchOutcome(officeSummary).dispatchOutcome, 'Office Day', 'office-only dispatch outcome is Office Day');
setField('office-day-arrived', '09:00');
setField('office-day-left', '17:00');
context.saveOfficeDay({ preventDefault() {} });
officeRows = JSON.parse(storage.get('personalOilfieldLoadTracker.paidTime')).filter((item) => item.workDate === '2026-09-08' && item.category === 'Office Time');
assert.strictEqual(officeRows.length, 1, 'saving Office Day again updates rather than duplicates');
assert.strictEqual(officeRows[0].id, officeId, 'Office Day update preserves its record ID');

saveLoadRecord({ 'load-date': '2026-09-09', 'load-number': '1', 'ticket-number': 'AUTO-PER-DIEM', 'bol-number': 'AUTO-PER-DIEM', 'loaded-miles': '10' });
const loadDaySummary = context.getDailyEarningsSummary('2026-09-09');
assert.strictEqual(loadDaySummary.perDiemPay, context.getPayRate('perDiemPay'), 'load days receive automatic per diem');
assert.strictEqual(loadDaySummary.perDiemPay, context.getPayRate('perDiemPay'), 'per diem is counted only once per work date');

const officePeriod = context.getPayPeriodEarningsSummary('2026-09-08');
assert.ok(officePeriod.officeTimeMinutes >= 480, 'pay-period summary totals office hours');
assert.ok(officePeriod.officeTimePay >= 192, 'pay-period summary totals office pay');
assert.ok(officePeriod.perDiemPay >= context.getPayRate('perDiemPay'), 'pay-period summary totals per diem');
assert.ok(officePeriod.totalEstimatedEarnings >= 192 + context.getPayRate('perDiemPay'), 'pay-period summary totals all earnings');
const paidOverlap = context.getPaidTimeOverlapReview(
  [analysisLoad({ id: 'overlap-load', arrivedPickupTime: '14:00', completedTime: '16:00' })],
  [context.normalizePaidTimeRecord({ id: 'overlap-paid', category: 'Deadhead', startTime: '13:30', endTime: '15:00', hourlyRate: 24 })]
);
assert.strictEqual(paidOverlap.status, 'review', 'paid time overlapping a load is flagged for review');
assert.strictEqual(paidOverlap.overlapMinutes, 60, 'paid-time overlap minutes are calculated without silently changing pay');
assert.strictEqual(context.getPaidTimeOverlapReview([], [deadheadHour]).status, 'clear', 'paid time without a load overlap remains clear');
assert.strictEqual(context.getPaidTimeOverlapReview([], [
  context.normalizePaidTimeRecord({ id: 'paid-a', category: 'Deadhead', startTime: '08:00', endTime: '10:00', hourlyRate: 24 }),
  context.normalizePaidTimeRecord({ id: 'paid-b', category: 'Breakdown', startTime: '09:30', endTime: '11:00', hourlyRate: 24 })
]).overlapMinutes, 30, 'overlapping paid-time records are disclosed');
assert.strictEqual(context.getMergedClassifiedDutyMinutes(
  [analysisLoad({ id: 'classified-load', arrivedPickupTime: '08:00', completedTime: '10:00' })],
  [context.normalizePaidTimeRecord({ id: 'classified-paid', category: 'Deadhead', startTime: '09:00', endTime: '11:00', hourlyRate: 24 })]
), 180, 'classified duty intervals are merged instead of double-counted');
assert.ok(script.includes("const PAID_TIME_STORAGE_KEY = 'personalOilfieldLoadTracker.paidTime'"), 'paid time uses dedicated localStorage key');
assert.ok(script.includes("cloudDocument('paidTime'"), 'paid time uses dedicated Firebase documents');
assert.ok(script.includes("getPendingDeletes().paidTime") && script.includes("clearPendingDelete('paidTime'"), 'paid-time deletion tombstones are retried after reconnection');
assert.ok(script.includes("'Deadhead pay'") && script.includes("'Total hourly additional pay'"), 'daily and analysis exports include paid-time earnings');
assert.ok(html.includes('Oilfield Load &amp; Workday Tracker') && html.includes('Other Paid Time'), 'new app identity and paid-time workflow are visible');
assert.ok(html.includes('<option>Vacation Time</option>'), 'Paid Time includes Vacation Time');
assert.ok(!html.includes('<option>Deadhead</option>') && html.includes('<option>Truck Wash</option>') && html.includes('<option>Breakdown</option>'), 'Deadhead is no longer offered as a new general paid-time category');
assert.ok(script.includes("category === 'Deadhead'"), 'legacy Deadhead paid-time records remain readable');
assert.ok(!html.includes('<option>Office Time</option>') && script.includes("record.category === 'Office Time'"), 'Office Time is removed from new generic entries while legacy records remain editable');
assert.ok(html.includes('id="show-office-day-button"') && html.includes('id="office-day-panel" hidden'), 'Office Day is dedicated and hidden until requested');
assert.ok(html.includes('id="load-add-more"') && html.includes('Were there deadhead miles?') && html.includes('Was there paid wait time?'), 'Add More gates deadhead and paid-wait controls');
assert.ok(html.includes('Total Daily Earnings') && html.includes('Effective hourly earnings'), 'dashboard exposes unified daily earnings and hourly results');
assert.ok(!html.match(/Favorite Route/i), 'Favorite Route controls are removed from the interface');
assert.ok(!html.match(/>[^<]*Assignments?[^<]*</i), 'user-facing interface uses Loads instead of Assignments');
['Load and pickup details', 'Delivery and Offloading Details', 'Weight Details', 'Paid Time', 'Review and Save'].forEach((section) => {
  assert.ok(html.includes(section), `${section} section is visible in the load-entry workflow`);
});
assert.ok(html.includes('Start and End Workday'), 'daily workday controls use the requested name');
assert.ok(html.includes('saved once for the selected work date—not once per load'), 'workday timing explains its once-per-date behavior');
assert.ok(html.includes('Save Load &amp; Start Next Load'), 'next-load action uses the requested wording');
assert.ok(!html.includes('Daily Shift Times'), 'old Daily Shift Times wording is removed');
assert.ok(!html.includes('<h3>Load Basics</h3>') && !html.includes('<h3>Load Measurements</h3>'), 'old load basics and measurements headings are removed');
assert.ok(html.includes('Pay period containing selected date'), 'pay-period label is based on selected date');
assert.ok(html.includes('Month containing selected date'), 'month label is based on selected date');
assert.ok(script.includes("'Dispatcher Day Comparison'"), 'analysis CSV includes dispatcher-day rows');
assert.ok(script.includes("'Dispatcher Load Comparison'"), 'analysis CSV includes dispatcher-load rows');
assert.ok(!script.includes("'Pickup State Comparison'") && !script.includes("'Route Performance'"), 'analysis CSV omits state and route ranking sections');
assert.ok(script.includes("'Underlying Loads'"), 'analysis CSV includes underlying load rows');
assert.ok(script.includes('Overall Date-Range Baseline') && script.includes('Filtered Load Summary') && script.includes('Time Basis Summary'), 'printed analysis contains baseline, filtered, and time summary sections');
assert.ok(script.includes('Baseline calculations reconciled.') && script.includes('Filtered load calculations reconciled.'), 'separate reconciliation statuses are displayed');
assert.ok(script.includes("['Section','Group','Metric','Value','Unit'") && script.includes("'Pickup-site minutes'") && script.includes("'Cycle minutes'"), 'analysis CSV separates metric rows from detailed underlying-load columns');
assert.ok(!script.includes('localStorage.clear'), 'app code does not clear localStorage');
assert.ok(!script.includes('indexedDB.deleteDatabase'), 'app code does not delete IndexedDB');
assert.ok(script.includes("const STORAGE_KEY = 'personalOilfieldLoadTracker.loads'"), 'load storage key is preserved');
assert.ok(script.includes("const ADD_ON_STORAGE_KEY = 'personalOilfieldLoadTracker.dailyAddOns'"), 'daily add-on storage key is preserved');
assert.ok(script.includes("const EARNINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.dailySummaries'"), 'daily summary storage key is preserved');
assert.ok(script.includes("const PROFILE_STORAGE_KEY = 'personalOilfieldLoadTracker.profile'"), 'profile storage key is preserved');
assert.ok(script.includes("const META_STORAGE_KEY = 'personalOilfieldLoadTracker.meta'"), 'metadata storage key is preserved');
assert.ok(script.includes("const SETTINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.settings'"), 'settings storage key is preserved');
assert.ok(script.includes("const FAVORITE_ROUTES_STORAGE_KEY = 'personalOilfieldLoadTracker.favoriteRoutes'"), 'favorite routes storage key is preserved');
assert.ok(script.includes("const DRAFT_STORAGE_KEY = 'personalOilfieldLoadTracker.currentDraft'"), 'draft storage key is preserved');
assert.ok(script.includes('const DATA_SCHEMA_VERSION = 2'), 'data schema version remains 2');
assert.ok(script.includes("cloudDocument('paidTime'"), 'Office Day continues to use the existing Firebase paid-time path');
assert.ok(script.includes('pendingDeletes'), 'metadata stores pending cloud deletions');
assert.ok(!script.includes('restoreLocalSafetySnapshot'), 'normal sign-out cannot call the old startup rollback helper');
assert.ok(script.includes('processPendingDeletes({ countAsWrite: false, throwOnFailure: true })'), 'manual sync processes pending deletion tombstones');
assert.ok(html.includes('viewport-fit=cover'), 'viewport includes iPhone safe-area support');
assert.ok(html.includes('Current Data Diagnostics'), 'settings diagnostics are collapsed behind a label');
assert.ok(html.includes('More Calculations'), 'secondary measurement calculations are collapsed behind a label');
assert.ok(script.includes('record-actions-menu'), 'secondary record actions are grouped in an actions menu');
assert.ok(repairHtml.includes('index.html?v=1.17.0'), 'repair page opens the current version');
assert.ok(!repairHtml.includes('localStorage'), 'repair page does not touch saved local records');
assert.ok(!repairHtml.includes('indexedDB'), 'repair page does not touch IndexedDB');
assert.ok(!repairHtml.includes('firebase'), 'repair page does not touch Firebase data');

const appVersionMatch = script.match(/const APP_VERSION = "([^"]+)"/);
const serviceWorkerVersionMatch = serviceWorker.match(/const APP_VERSION = '([^']+)'/);
assert.ok(appVersionMatch, 'script exposes an app version');
assert.ok(serviceWorkerVersionMatch, 'service worker exposes an app version');
assert.strictEqual(appVersionMatch[1], '1.17.0', 'app version is updated');
assert.strictEqual(serviceWorkerVersionMatch[1], appVersionMatch[1], 'service-worker version matches app version');
assert.ok(serviceWorker.includes('personal-oilfield-load-tracker-'), 'service-worker cache prefix is preserved');
assert.ok(html.includes(`script.js?v=${appVersionMatch[1]}`), 'HTML script asset uses the app version');
assert.ok(html.includes(`style.css?v=${appVersionMatch[1]}`), 'HTML stylesheet asset uses the app version');
assert.ok(manifest.includes(`index.html?v=${appVersionMatch[1]}`), 'manifest start URL uses the app version');
assert.ok(readme.includes(appVersionMatch[1]), 'README references the current app version');
assert.ok(serviceWorker.includes("const CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}`"), 'service worker uses a genuinely new versioned cache');
assert.ok(serviceWorker.includes("cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME"), 'service worker deletes only obsolete Load Tracker caches');
assert.ok(serviceWorker.includes("'./export-cleanup.js'") && serviceWorker.includes("'./export-integration.js'"), 'clean export scripts remain available offline');
assert.ok(serviceWorker.includes("'./professional-export.js'") && serviceWorker.includes("'./vendor/exceljs.min.js'"), 'professional Excel export engine remains available offline');
assert.ok(html.includes('id="download-log-excel-button"') && html.includes('id="download-earnings-excel-button"'), 'professional Excel export buttons remain available');
assert.ok(html.includes('vendor/exceljs.min.js?v=1.17.0'), 'versioned Excel workbook library loads before the app');
assert.ok(script.includes("setUpdateStatus('You are using the latest version.')"), 'no-update check reports the latest-version result');
assert.ok(!script.includes("setUpdateStatus('You are using the latest version. If update does not appear, close and reopen the app.')"), 'no-update check no longer uses the old reload path');
assert.ok(script.includes('preserveActiveViewForReload();'), 'a real service-worker update preserves the active view before reload');
assert.ok(html.includes('data-view-target="dashboard">Today</button>')
  && html.includes('data-view-target="new-load">Load</button>')
  && html.includes('data-view-target="records">History</button>')
  && html.includes('data-view-target="reports">Earnings</button>')
  && html.includes('data-view-target="settings">More</button>'), 'navigation uses Today, Load, History, Earnings, and More');
assert.ok(script.includes("globalThis.addEventListener?.('pageshow', resumeCloudSync)"), 'iOS foreground resume restarts stale Firebase listeners');
assert.ok(script.includes("globalThis.document?.addEventListener?.('visibilitychange'"), 'standalone PWA visibility resume is handled');
assert.ok(script.includes('cloudSync.sdk.enableNetwork?.(cloudSync.db)'), 'foreground recovery re-enables the Firestore network');
assert.ok(script.indexOf('cloudSync.sdk.onAuthStateChanged(') < script.indexOf('withTimeout(applyBestAuthPersistence()'), 'Firebase auth observer starts before optional iOS persistence work');
assert.ok(script.includes('return Boolean(cloudSync.state.loaded.loads)'), 'load synchronization does not wait for every secondary listener');
assert.ok(script.includes("markLocalChangesPending('', false)"), 'writes retain a silent durable local pending marker until Firebase acknowledges them');
assert.ok(script.includes('CLOUD_WRITE_STALL_MS'), 'stalled Firebase writes trigger reconnect without cancelling the write');
assert.ok(script.includes("const FIREBASE_SDK_VERSION = '12.16.0'"), 'Firebase uses the current iOS-compatible SDK');
assert.ok(script.includes('experimentalAutoDetectLongPolling: true'), 'Firestore automatically selects the compatible iOS transport');
assert.ok(script.includes('experimentalForceLongPolling: true'), 'Safari uses a reliable bounded long-polling transport');
assert.ok(script.includes('experimentalLongPollingOptions: { timeoutSeconds: 30 }'), 'Safari transport cannot wait indefinitely');
assert.ok(script.includes("return `${name}: pending`"), 'diagnostics identify the exact pending Firebase listener');
assert.ok(script.includes('preFirestoreCacheReset.v1'), 'a separate recovery copy is created before the approved cache reset');
assert.ok(script.includes('clearIndexedDbPersistence'), 'the approved one-time repair removes the blocked Firestore batch');
assert.ok(script.includes('countUniqueLoads(verifiedBackup.data?.loads || [])'), 'the recovery copy is verified before cache reset');
assert.ok(script.includes('scheduleCloudBackfill(localOnlyLoads)'), 'recovery uploads only records missing from Firebase');
assert.ok(script.includes('missingLoads.forEach((load) => syncLoadToCloud(load))'), 'missing records retry independently instead of as one full batch');
assert.ok(script.includes('persistentLocalCache'), 'Firestore pending writes survive an iPhone PWA restart');
assert.ok(script.includes('persistentMultipleTabManager'), 'Firebase persistence coordinates Safari and Home Screen contexts');
assert.ok(!script.includes('shouldMergeLocalState'), 'cloud snapshots never discard local-only records');
assert.ok(script.includes('pre-cloud-merge-recovery'), 'local-only records are backed up before every cloud merge');
assert.ok(script.includes('cloudSync.sdk.disableNetwork?.(cloudSync.db)'), 'a stalled iOS write resets the half-open Firestore transport');
assert.ok(script.includes('networkRestartPromise'), 'simultaneous stalled writes share one network recovery operation');
assert.ok(script.includes('pendingWritesByListener'), 'pending-write metadata is tracked for every Firebase listener');
assert.ok(script.includes('reconcileServerAcknowledgement'), 'server-confirmed listener state clears stale write counters');
assert.ok(script.includes('manualSyncButton.disabled'), 'manual sync cannot enqueue duplicate writes while synchronization is active');
vm.runInContext(`
  cloudSync.pendingWrites = 5;
  cloudSync.stalledWrites = 5;
  appMeta.cloudSync = {
    ...(appMeta.cloudSync || {}),
    localChangesPending: true,
    pendingDeletes: normalizePendingDeletes({})
  };
  Object.keys(cloudSync.state.loaded).forEach((name) => {
    cloudSync.state.loaded[name] = true;
    cloudSync.state.pendingWritesByListener[name] = false;
    cloudSync.state.fromCacheByListener[name] = false;
  });
  cloudSync.state.hasPendingWrites = false;
  reconcileServerAcknowledgement();
  globalThis.serverAckResult = {
    pendingWrites: cloudSync.pendingWrites,
    stalledWrites: cloudSync.stalledWrites,
    localChangesPending: appMeta.cloudSync.localChangesPending
  };
`, context);
assert.deepStrictEqual(
  JSON.parse(JSON.stringify(context.serverAckResult)),
  { pendingWrites: 0, stalledWrites: 0, localChangesPending: false },
  'complete server listener acknowledgement clears duplicated stale counters'
);
context.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15';
assert.strictEqual(context.isIOSWebKit(), true, 'iPhone Home Screen web runtime selects the iOS transport');
assert.strictEqual(context.isSafariWebKit(), true, 'iPhone selects forced Safari long polling');
context.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
assert.strictEqual(context.isSafariWebKit(), true, 'desktop Safari selects forced long polling');
context.navigator.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36';
assert.strictEqual(context.isSafariWebKit(), false, 'Chrome retains automatic transport detection');
context.navigator.userAgent = '';
assert.ok(script.includes("setAuthError('')"), 'successful Firebase acknowledgement clears the stale saving message');
assert.ok(script.includes("navigator.serviceWorker.addEventListener('controllerchange'"), 'service-worker activation is observed');
assert.ok(script.includes('Update installed. It will be used the next time the app opens.'), 'automatic service-worker activation does not blank the iPhone app during sign-in');
assert.ok(serviceWorker.includes("type: 'APP_VERSION'"), 'service worker reports its live cache version to the app');
['settings-firebase-uid', 'settings-listener-state', 'settings-firebase-update', 'settings-cache-version'].forEach((id) => {
  assert.ok(ids.includes(id), `${id} diagnostic remains visible`);
});
assert.ok(!html.includes('runFallbackFirebaseLogin'), 'duplicated inline Firebase fallback was removed');
assert.ok(!html.includes('firebase-auth.js'), 'HTML does not run a second Firebase Auth import');
assert.ok(!html.includes('signed-in='), 'successful sign-in no longer forces an HTML fallback reload');
assert.ok(!html.includes("document.addEventListener('touchend'"), 'HTML does not intercept iPhone touch navigation ahead of the main app');
assert.ok(![html, script, serviceWorker, manifest, repairHtml, readme].some((text) => text.includes('1.4.1')), 'old 1.4.1 app-file references were removed');
assert.ok(![html, script, serviceWorker, manifest, repairHtml, readme].some((text) => text.includes('1.4.2')), 'old 1.4.2 app-file references were removed');

[
  'settings-app-version',
  'settings-data-version',
  'settings-migration-state',
  'settings-service-worker-state',
  'settings-update-state',
  'total-loads-hauled',
  'daily-paid-pickup-wait',
  'daily-paid-dropoff-wait',
  'summary-water-barrels',
  'summary-oil-barrels',
  'summary-crude-weight',
  'summary-oil-weight',
  'summary-water-weight',
  'save-load-button',
  'save-next-button',
  'save-draft-button'
].forEach((id) => {
  assert.ok(ids.includes(id), `${id} DOM ID remains present`);
});

assert.ok(html.includes('header-month-load-count') && html.includes('header-pay-period-load-count'), 'header shows month and pay-period completed-load totals');
assert.ok(!html.includes('analysis-pickup-state-filter') && !html.includes('analysis-dropoff-state-filter') && !html.includes('analysis-state-route-filter') && !html.includes('analysis-exact-route-filter'), 'confusing state and route analysis filters are removed');
assert.ok(html.includes('How to Read This Analysis'), 'dispatch and earnings analysis includes plain-language instructions');
assert.ok(script.includes('const payPeriodRange = getCompanyPayPeriodRange(date)') && script.includes('const nextFromCount = periodLoads.length + 1'), 'new load numbering follows pay-period progression');
assert.ok(script.includes('Started a clean load form for today. The previous-day draft was cleared.'), 'previous-day load drafts do not reopen automatically');
const outcomeBase = { completedLoadPay: 300, dailyGoal: 300 };
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, exactDutyMinutes: 719 }).dispatchOutcome, 'Productive', 'goal met under 12 hours is Productive');
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, exactDutyMinutes: 720 }).dispatchOutcome, 'Productive but Extended', 'exactly 12 hours is Productive but Extended');
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, exactDutyMinutes: 840 }).dispatchOutcome, '14-Hour Review', 'goal met at exactly 14 hours is a 14-Hour Review');
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, completedLoadPay: 260, exactDutyMinutes: 839 }).dispatchOutcome, 'Below Earnings Goal', 'below goal under 14 hours is Below Earnings Goal');
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, completedLoadPay: 260, totalEstimatedDailyEarnings: 1000, exactDutyMinutes: 600 }).dispatchOutcome, 'Below Earnings Goal', 'paid time and add-ons cannot make a below-goal dispatch outcome productive');
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, completedLoadPay: 260, exactDutyMinutes: 840 }).dispatchOutcome, 'Poor Dispatch Outcome — Review', 'below goal at exactly 14 hours is a poor dispatch outcome review');
assert.strictEqual(context.getDailyDispatchOutcome({ ...outcomeBase, exactDutyMinutes: null }).dispatchOutcome, 'Insufficient Time Data', 'missing exact workday times are not estimated for the dispatch outcome');

const dispatcherRows = context.buildDispatcherPerformanceRows([
  analysisLoad({ id: 'dispatcher-row-a', dispatcher: 'Morgan', loadDate: '2026-07-01', estimatedPay: 180, deadheadMiles: 12, deadheadStartTime: '07:00', deadheadEndTime: '07:30' }),
  analysisLoad({ id: 'dispatcher-row-b', dispatcher: 'Lee', loadDate: '2026-07-01', estimatedPay: 120, deadheadMiles: 0 }),
  analysisLoad({ id: 'dispatcher-row-c', dispatcher: 'Morgan', loadDate: '2026-07-02', estimatedPay: 310, deadheadMiles: 8, deadheadStartTime: '06:50', deadheadEndTime: '07:10' })
], context.buildAnalysisDays([
  analysisLoad({ id: 'dispatcher-row-a', dispatcher: 'Morgan', loadDate: '2026-07-01', estimatedPay: 180, deadheadMiles: 12, deadheadStartTime: '07:00', deadheadEndTime: '07:30' }),
  analysisLoad({ id: 'dispatcher-row-b', dispatcher: 'Lee', loadDate: '2026-07-01', estimatedPay: 120, deadheadMiles: 0 }),
  analysisLoad({ id: 'dispatcher-row-c', dispatcher: 'Morgan', loadDate: '2026-07-02', estimatedPay: 310, deadheadMiles: 8, deadheadStartTime: '06:50', deadheadEndTime: '07:10' })
]));
const morganRow = dispatcherRows.find((row) => row.name === 'Morgan');
assert.strictEqual(morganRow.completedLoads, 2, 'dispatcher performance uses the dispatcher attached to each load');
assert.strictEqual(morganRow.workdays, 2, 'dispatcher workdays are distinct eligible load dates');
assert.strictEqual(morganRow.totalDeadheadMiles, 20, 'dispatcher deadhead miles are totaled from load-specific deadhead');
assert.ok(html.includes('How to Read This Analysis'), 'analysis guidance uses the requested plain-language title');
assert.ok(script.includes('Daily Dispatch Results') && script.includes('Dispatcher Analysis') && script.includes('Data completeness status'), 'analysis CSV and print paths include outcome, dispatcher, and readiness metrics');
assert.ok(script.includes('pickupState:') && script.includes('dropoffState:'), 'legacy pickup and drop-off state fields remain normalized for compatibility');
assert.ok(!context.getAnalysisReadiness({
  days: [{ dutyTimeSource: 'exact', loads: [analysisLoad({ id: 'state-free-ready', pickupState: '', dropoffState: '' })] }],
  totalLoads: 1
}).detail.toLowerCase().includes('state'), 'analysis readiness does not depend on state fields');

const numberedLoads = Array.from({ length: 32 }, (_, index) => ({
  id: `period-${index + 1}`, loadDate: '2026-07-16', loadNumber: String(index + 1),
  loadStatus: 'Completed Load', estimatedPay: 50
}));
numberedLoads.push({ id: 'older-high-number', loadDate: '2026-07-20', loadNumber: '40', loadStatus: 'Completed Load', estimatedPay: 50 });
const numberingSmoke = createStartupSmokeContext({
  'personalOilfieldLoadTracker.loads': JSON.stringify(numberedLoads)
});
assert.strictEqual(numberingSmoke.context.getNextLoadNumber('2026-07-30'), '41', 'pay-period numbering uses the higher of record count and highest valid saved number');

const staleDraftSmoke = createStartupSmokeContext({
  'personalOilfieldLoadTracker.loads': JSON.stringify([{ id: 'saved-intact', loadDate: '2026-07-29', loadNumber: '1', loadStatus: 'Completed Load', estimatedPay: 50 }]),
  'personalOilfieldLoadTracker.currentDraft': JSON.stringify({
    savedAt: '2026-07-29T12:00:00.000Z',
    selectedDate: '2026-07-29',
    formValues: { loadDate: '2026-07-29', ticketNumber: 'STALE-TICKET', notes: 'stale notes' }
  })
});
assert.strictEqual(JSON.parse(staleDraftSmoke.storage.get('personalOilfieldLoadTracker.loads')).length, 1, 'clearing a previous-day draft leaves saved loads intact');
assert.ok(!staleDraftSmoke.storage.has('personalOilfieldLoadTracker.currentDraft'), 'previous-day draft is removed from the active form');
assert.strictEqual(staleDraftSmoke.context.document.getElementById('ticket-number').value, '', 'previous-day ticket does not reopen in today’s form');

console.log('Oilfield Load & Workday Tracker regression tests passed');
