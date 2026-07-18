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
  }])
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

setSmokeField('favorite-route-name', 'Current Route');
setSmokeField('favorite-pickup-location', 'Lease Current');
setSmokeField('favorite-dropoff-location', 'Station Current');
setSmokeField('favorite-route-mileage', '44');
startupSmoke.context.saveFavoriteRouteFromControls();

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
assert.strictEqual(afterSignOutSnapshot.data.favoriteRoutes.length, 1, 'signing out does not revert favorite routes');
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
  'loading 1 hour 30 minutes and offloading under 1 hour',
  {
    arrivedPickupTime: '10:00',
    loadedTime: '11:30',
    arrivedDropoffTime: '14:00',
    completedTime: '14:45'
  },
  { pickup: 30, dropoff: 0, total: 30 }
);

assertWaitMinutes(
  'offloading 2 hours 15 minutes',
  {
    arrivedPickupTime: '12:00',
    loadedTime: '12:30',
    arrivedDropoffTime: '15:00',
    completedTime: '17:15'
  },
  { pickup: 0, dropoff: 75, total: 75 }
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

context.clearForm();
setField('load-date', '2026-07-12');
setField('pickup-location', 'Lease A');
setField('dropoff-location', 'Station B');
setField('ticket-number', 'DRAFT-TK');
context.saveDraftNow('Draft saved.');
assert.ok(storage.has('personalOilfieldLoadTracker.currentDraft'), 'draft is stored separately');
context.clearDraft();
assert.ok(!storage.has('personalOilfieldLoadTracker.currentDraft'), 'draft can be cleared without deleting loads');

setField('favorite-route-name', 'Delete Me Route');
setField('favorite-pickup-location', 'Lease Delete');
setField('favorite-dropoff-location', 'Station Delete');
setField('favorite-route-mileage', '32');
context.saveFavoriteRouteFromControls();
const favoriteRoutesBeforeDelete = JSON.parse(storage.get('personalOilfieldLoadTracker.favoriteRoutes'));
const favoriteRouteToDelete = favoriteRoutesBeforeDelete[0];
context.deleteFavoriteRoute(favoriteRouteToDelete.id);
pendingDeleteMeta = JSON.parse(storage.get('personalOilfieldLoadTracker.meta'));
assert.ok(pendingDeleteMeta.cloudSync.pendingDeletes.favoriteRoutes[favoriteRouteToDelete.id], 'deleting a favorite route creates a pending-delete tombstone');
assert.strictEqual(JSON.parse(storage.get('personalOilfieldLoadTracker.favoriteRoutes')).length, 0, 'favorite route is removed locally immediately');
assert.strictEqual(context.mergeFavoriteRoutes([favoriteRouteToDelete]).length, 0, 'tombstoned favorite route cannot return through mergeFavoriteRoutes');

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
assert.ok(Array.isArray(backup.data.favoriteRoutes), 'backup includes favorite routes');
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
assert.ok(script.includes('pendingDeletes'), 'metadata stores pending cloud deletions');
assert.ok(!script.includes('restoreLocalSafetySnapshot'), 'normal sign-out cannot call the old startup rollback helper');
assert.ok(script.includes('processPendingDeletes({ countAsWrite: false, throwOnFailure: true })'), 'manual sync processes pending deletion tombstones');
assert.ok(html.includes('viewport-fit=cover'), 'viewport includes iPhone safe-area support');
assert.ok(html.includes('Current Data Diagnostics'), 'settings diagnostics are collapsed behind a label');
assert.ok(html.includes('More Calculations'), 'secondary measurement calculations are collapsed behind a label');
assert.ok(script.includes('record-actions-menu'), 'secondary record actions are grouped in an actions menu');
assert.ok(repairHtml.includes('index.html?v=1.4.3'), 'repair page opens the current version');
assert.ok(!repairHtml.includes('localStorage'), 'repair page does not touch saved local records');
assert.ok(!repairHtml.includes('indexedDB'), 'repair page does not touch IndexedDB');
assert.ok(!repairHtml.includes('firebase'), 'repair page does not touch Firebase data');

const appVersionMatch = script.match(/const APP_VERSION = "([^"]+)"/);
const serviceWorkerVersionMatch = serviceWorker.match(/const APP_VERSION = '([^']+)'/);
assert.ok(appVersionMatch, 'script exposes an app version');
assert.ok(serviceWorkerVersionMatch, 'service worker exposes an app version');
assert.strictEqual(appVersionMatch[1], '1.4.3', 'app version is updated');
assert.strictEqual(serviceWorkerVersionMatch[1], appVersionMatch[1], 'service-worker version matches app version');
assert.ok(serviceWorker.includes('personal-oilfield-load-tracker-'), 'service-worker cache prefix is preserved');
assert.ok(html.includes(`script.js?v=${appVersionMatch[1]}`), 'HTML script asset uses the app version');
assert.ok(html.includes(`style.css?v=${appVersionMatch[1]}`), 'HTML stylesheet asset uses the app version');
assert.ok(manifest.includes(`index.html?v=${appVersionMatch[1]}`), 'manifest start URL uses the app version');
assert.ok(readme.includes(appVersionMatch[1]), 'README references the current app version');
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

console.log('Personal Load Tracker regression tests passed');
