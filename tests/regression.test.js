const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const appDir = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(appDir, 'script.js'), 'utf8');
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

storedLoads = JSON.parse(storage.get('personalOilfieldLoadTracker.loads'));
const secondLoadId = storedLoads.find((load) => load.id !== firstLoadId).id;
context.deleteLoadEntry(secondLoadId);
assert.strictEqual(context.countUniqueLoads(), 1, 'deleting one saved load decreases total load count');

const backup = context.getTrackerSnapshot();
assert.strictEqual(backup.recordCount, 1, 'backup reports current record count');
assert.ok(backup.data.settings, 'backup includes app settings');
assert.ok(Array.isArray(backup.data.favoriteRoutes), 'backup includes favorite routes');
assert.ok(!script.includes('localStorage.clear'), 'app code does not clear localStorage');
assert.ok(!script.includes('indexedDB.deleteDatabase'), 'app code does not delete IndexedDB');

console.log('Personal Load Tracker regression tests passed');
