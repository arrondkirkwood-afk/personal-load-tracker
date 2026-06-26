const APP_VERSION = "1.0.1";
const APP_CACHE_PREFIX = 'personal-oilfield-load-tracker-';
const APP_CACHE_NAME = `${APP_CACHE_PREFIX}v${APP_VERSION}`;
const STORAGE_KEY = 'personalOilfieldLoadTracker.loads';
const ADD_ON_STORAGE_KEY = 'personalOilfieldLoadTracker.dailyAddOns';
const EARNINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.dailySummaries';
const LEGACY_STORAGE_KEY = 'personalOilfieldLoadTrackerLog';
const LEGACY_ADD_ON_STORAGE_KEY = 'personalOilfieldDailyEarningsAddOns';
const LEGACY_EARNINGS_STORAGE_KEY = 'personalOilfieldDailyEarningsRecords';
const COMPLETED_STATUS = 'Completed Load';
const REJECT_STATUS = 'Reject';
const REJECT_PAY = 20;
const PER_DIEM_PAY = 50;
const SLEEPER_BERTH_PAY = 60;
const WAIT_PAY_RATE = 24;
const WAIT_GRACE_MINUTES = 60;
const NO_RATE_FOUND_LABEL = 'No rate found — enter manually';

const loadedMilesPayScale = [
  { min: 1, max: 5, rate: 49.93 },
  { min: 6, max: 10, rate: 51.41 },
  { min: 11, max: 15, rate: 52.97 },
  { min: 16, max: 20, rate: 58.18 },
  { min: 21, max: 25, rate: 63.94 },
  { min: 26, max: 30, rate: 65.97 },
  { min: 31, max: 35, rate: 72.47 },
  { min: 36, max: 40, rate: 78.53 },
  { min: 41, max: 45, rate: 87.15 },
  { min: 46, max: 50, rate: 89.68 },
  { min: 51, max: 55, rate: 92.87 },
  { min: 56, max: 60, rate: 95.18 },
  { min: 61, max: 65, rate: 108.44 },
  { min: 66, max: 70, rate: 111.21 },
  { min: 71, max: 75, rate: 115.68 },
  { min: 76, max: 80, rate: 119.21 },
  { min: 81, max: 85, rate: 122.29 },
  { min: 86, max: 90, rate: 139.46 },
  { min: 91, max: 95, rate: 141.50 },
  { min: 96, max: 100, rate: 144.46 },
  { min: 101, max: 105, rate: 151.09 },
  { min: 106, max: 110, rate: 157.71 },
  { min: 111, max: 115, rate: 161.78 },
  { min: 116, max: 120, rate: 165.95 },
  { min: 121, max: 125, rate: 170.07 },
  { min: 126, max: 130, rate: 174.20 },
  { min: 131, max: 135, rate: 178.32 },
  { min: 136, max: 140, rate: 182.42 },
  { min: 141, max: 145, rate: 186.55 },
  { min: 146, max: 150, rate: 190.68 },
  { min: 151, max: 155, rate: 194.80 },
  { min: 156, max: 160, rate: 198.91 },
  { min: 161, max: 165, rate: 203.02 },
  { min: 166, max: 170, rate: 207.12 },
  { min: 171, max: 175, rate: 215.60 },
  { min: 176, max: 180, rate: 222.10 },
  { min: 181, max: 185, rate: 228.67 },
  { min: 186, max: 190, rate: 234.71 },
  { min: 191, max: 195, rate: 240.76 },
  { min: 196, max: 200, rate: 246.80 },
  { min: 201, max: 205, rate: 264.94 },
  { min: 206, max: 210, rate: 270.98 },
  { min: 211, max: 215, rate: 277.03 },
  { min: 216, max: 220, rate: 283.07 },
  { min: 221, max: 225, rate: 289.12 },
  { min: 226, max: 230, rate: 295.16 },
  { min: 231, max: 235, rate: 301.25 },
  { min: 236, max: 240, rate: 307.25 }
];

const fieldIds = [
  'driver-name',
  'truck-number',
  'trailer-number',
  'empty-truck-weight',
  'load-date',
  'load-number',
  'ticket-number',
  'bol-number',
  'load-status',
  'product-type',
  'pickup-location',
  'dropoff-location',
  'gross-barrels',
  'api-gravity',
  'bsw-percentage',
  'loaded-miles',
  'notes',
  'arrived-pickup-time',
  'loaded-time',
  'arrived-dropoff-time',
  'completed-time',
  'start-meter-reading',
  'end-meter-reading',
  'jotform-confirmation-number'
];

const numberFieldIds = new Set([
  'empty-truck-weight',
  'gross-barrels',
  'api-gravity',
  'bsw-percentage',
  'loaded-miles',
  'start-meter-reading',
  'end-meter-reading'
]);

const fields = Object.fromEntries(
  fieldIds.map((id) => [toKey(id), document.getElementById(id)])
);

const errors = {
  emptyTruckWeight: document.getElementById('empty-truck-weight-error'),
  loadDate: document.getElementById('load-date-error'),
  loadStatus: document.getElementById('load-status-error'),
  grossBarrels: document.getElementById('gross-barrels-error'),
  apiGravity: document.getElementById('api-gravity-error'),
  bswPercentage: document.getElementById('bsw-percentage-error'),
  loadedMiles: document.getElementById('loaded-miles-error'),
  startMeterReading: document.getElementById('start-meter-reading-error'),
  endMeterReading: document.getElementById('end-meter-reading-error')
};

const daily = {
  date: document.getElementById('daily-date'),
  completedLoads: document.getElementById('daily-completed-loads'),
  rejects: document.getElementById('daily-rejects'),
  grossBarrels: document.getElementById('daily-gross-barrels'),
  loadedMiles: document.getElementById('daily-loaded-miles'),
  barrelsOffloaded: document.getElementById('daily-barrels-offloaded'),
  differenceGross: document.getElementById('daily-difference-gross'),
  completedPay: document.getElementById('daily-completed-pay'),
  rejectPay: document.getElementById('daily-reject-pay'),
  paidPickupWait: document.getElementById('daily-paid-pickup-wait'),
  paidDropoffWait: document.getElementById('daily-paid-dropoff-wait'),
  totalPaidWait: document.getElementById('daily-paid-wait'),
  waitPay: document.getElementById('daily-wait-pay'),
  perDiemPay: document.getElementById('daily-per-diem-pay'),
  sleeperPay: document.getElementById('daily-sleeper-pay'),
  totalEarnings: document.getElementById('daily-total-earnings')
};

const summary = {
  waterBarrels: document.getElementById('summary-water-barrels'),
  oilBarrels: document.getElementById('summary-oil-barrels'),
  crudeWeight: document.getElementById('summary-crude-weight'),
  oilWeight: document.getElementById('summary-oil-weight'),
  waterWeight: document.getElementById('summary-water-weight'),
  totalWeight: document.getElementById('summary-total-weight'),
  grossTruckWeight: document.getElementById('summary-gross-truck-weight'),
  startMeterReading: document.getElementById('summary-start-meter-reading'),
  endMeterReading: document.getElementById('summary-end-meter-reading'),
  barrelsOffloaded: document.getElementById('meter-barrels-offloaded'),
  grossBarrelsHauled: document.getElementById('summary-gross-barrels-hauled'),
  differenceGross: document.getElementById('meter-difference-gross'),
  offloadStatus: document.getElementById('meter-offload-status'),
  payRange: document.getElementById('pay-range'),
  estimatedPay: document.getElementById('pay-estimated'),
  pickupTime: document.getElementById('summary-pickup-time'),
  paidPickupWait: document.getElementById('summary-paid-pickup-wait'),
  dropoffTime: document.getElementById('summary-dropoff-time'),
  paidDropoffWait: document.getElementById('summary-paid-dropoff-wait'),
  totalPaidWait: document.getElementById('summary-paid-wait'),
  waitPay: document.getElementById('summary-wait-pay'),
  entryTotal: document.getElementById('pay-entry-total'),
  cycleTime: document.getElementById('summary-cycle-time')
};

const addOns = {
  perDiem: document.getElementById('per-diem-checkbox'),
  sleeperBerth: document.getElementById('sleeper-berth-checkbox'),
  notes: document.getElementById('daily-earnings-notes')
};

const review = {
  dateLabel: document.getElementById('earnings-date-label'),
  date: document.getElementById('review-date'),
  completedLoads: document.getElementById('review-completed-loads'),
  rejects: document.getElementById('review-rejects'),
  loadedMiles: document.getElementById('review-loaded-miles'),
  grossBarrels: document.getElementById('review-gross-barrels'),
  barrelsOffloaded: document.getElementById('review-barrels-offloaded'),
  differenceGross: document.getElementById('review-difference-gross'),
  completedPay: document.getElementById('review-completed-pay'),
  rejectPay: document.getElementById('review-reject-pay'),
  paidPickupWait: document.getElementById('review-paid-pickup-wait'),
  paidDropoffWait: document.getElementById('review-paid-dropoff-wait'),
  totalPaidWait: document.getElementById('review-paid-wait'),
  waitPay: document.getElementById('review-wait-pay'),
  perDiemApplied: document.getElementById('review-per-diem-applied'),
  perDiemPay: document.getElementById('review-per-diem-pay'),
  sleeperApplied: document.getElementById('review-sleeper-applied'),
  sleeperPay: document.getElementById('review-sleeper-pay'),
  totalEarnings: document.getElementById('review-total-earnings')
};

const form = document.getElementById('load-form');
const validationSummary = document.getElementById('validation-summary');
const duplicateWarning = document.getElementById('duplicate-warning');
const saveLoadButton = document.getElementById('save-load-button');
const saveAnywayButton = document.getElementById('save-anyway-button');
const cancelDuplicateButton = document.getElementById('cancel-duplicate-button');
const clearFormButton = document.getElementById('clear-form-button');
const editStatus = document.getElementById('edit-status');
const savedLoadCards = document.getElementById('saved-load-cards');
const logCount = document.getElementById('log-count');
const downloadLogButton = document.getElementById('download-log-button');
const downloadEarningsButton = document.getElementById('download-earnings-button');
const clearLogButton = document.getElementById('clear-log-button');
const checkUpdatesButton = document.getElementById('check-updates-button');
const updateStatus = document.getElementById('update-status');
const appVersion = document.getElementById('app-version');
const storageWarning = document.getElementById('storage-warning');
const saveStatus = document.getElementById('save-status');

const storageWarnings = [];
let savedLoads = loadSavedLoads();
let dailyAddOns = loadDailyAddOns();
let dailyEarningsRecords = loadDailySummaries();
let editingLoadId = null;
let pendingDuplicateRecord = null;

function toKey(id) {
  return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function addStorageWarning(message) {
  if (!storageWarnings.includes(message)) {
    storageWarnings.push(message);
  }
}

function renderStorageWarning() {
  if (!storageWarning || storageWarnings.length === 0) {
    return;
  }

  storageWarning.hidden = false;
  storageWarning.textContent = storageWarnings.join(' ');
}

function showSaveMessage(message) {
  if (!saveStatus) {
    return;
  }

  saveStatus.textContent = message;
  saveStatus.className = 'save-status show';
}

function clearSaveMessage() {
  if (!saveStatus) {
    return;
  }

  saveStatus.textContent = '';
  saveStatus.className = 'save-status';
}

function setUpdateStatus(message) {
  if (!updateStatus) {
    return;
  }

  updateStatus.textContent = message;
}

async function clearOldAppCaches() {
  if (!('caches' in globalThis)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith(APP_CACHE_PREFIX) && cacheName !== APP_CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName))
  );
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');

    if (registration.active) {
      registration.active.postMessage({ type: 'CLEAR_OLD_CACHES' });
    }

    return registration;
  } catch {
    return null;
  }
}

function waitForInstallingWorker(registration) {
  const worker = registration?.installing;

  if (!worker) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let isResolved = false;

    const finish = (value) => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      worker.removeEventListener('statechange', handleStateChange);
      resolve(value);
    };

    const handleStateChange = () => {
      if (worker.state === 'installed' || worker.state === 'activated') {
        finish(worker);
      }

      if (worker.state === 'redundant') {
        finish(null);
      }
    };

    worker.addEventListener('statechange', handleStateChange);
    handleStateChange();
    setTimeout(() => finish(worker.state === 'installed' ? worker : null), 5000);
  });
}

function waitForControllerChange(timeout = 2500) {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let isResolved = false;

    const finish = () => {
      if (isResolved) {
        return;
      }

      isResolved = true;
      navigator.serviceWorker.removeEventListener('controllerchange', finish);
      resolve();
    };

    navigator.serviceWorker.addEventListener('controllerchange', finish);
    setTimeout(finish, timeout);
  });
}

async function reloadAfterServiceWorkerUpdate(registration) {
  setUpdateStatus('Update complete. Reloading...');

  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    await waitForControllerChange();
  }

  globalThis.location.reload();
}

async function checkForUpdates() {
  if (checkUpdatesButton) {
    checkUpdatesButton.disabled = true;
  }

  setUpdateStatus('Checking for updates...');

  try {
    await clearOldAppCaches();

    if (!('serviceWorker' in navigator)) {
      setUpdateStatus('If update does not appear, close and reopen the app.');
      return;
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration();
    const registration = existingRegistration || await registerServiceWorker();

    if (!registration) {
      setUpdateStatus('If update does not appear, close and reopen the app.');
      return;
    }

    const updatedRegistration = await registration.update().catch(() => registration);
    const installedWorker = await waitForInstallingWorker(updatedRegistration);

    await clearOldAppCaches();

    if (updatedRegistration.active) {
      updatedRegistration.active.postMessage({ type: 'CLEAR_OLD_CACHES' });
    }

    if (updatedRegistration.waiting || installedWorker) {
      await reloadAfterServiceWorkerUpdate(updatedRegistration);
      return;
    }

    setUpdateStatus('You are using the latest version. If update does not appear, close and reopen the app.');

    setTimeout(() => {
      setUpdateStatus('Update complete. Reloading...');
      globalThis.location.reload();
    }, 1400);
  } catch {
    setUpdateStatus('If update does not appear, close and reopen the app.');
  } finally {
    setTimeout(() => {
      if (checkUpdatesButton) {
        checkUpdatesButton.disabled = false;
      }
    }, 1600);
  }
}

function readJsonFromStorage(key, label) {
  try {
    const storedValue = localStorage.getItem(key);

    if (storedValue === null || storedValue === '') {
      return { found: false, value: null };
    }

    return { found: true, value: JSON.parse(storedValue) };
  } catch {
    addStorageWarning(`Warning: saved ${label} could not be read from browser storage. The app recovered with any other available saved data and did not crash.`);
    return { found: false, value: null };
  }
}

function loadJson(key, fallback, label, legacyKey = null) {
  const stored = readJsonFromStorage(key, label);

  if (stored.found) {
    return stored.value ?? fallback;
  }

  if (legacyKey) {
    const legacy = readJsonFromStorage(legacyKey, label);

    if (legacy.found) {
      return legacy.value ?? fallback;
    }
  }

  return fallback;
}

function storeJson(key, value, label) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    addStorageWarning(`Warning: saved ${label} could not be written to browser storage. Download a CSV backup before closing the browser.`);
    renderStorageWarning();
    return false;
  }
}

function loadSavedLoads() {
  const rawLoads = loadJson(STORAGE_KEY, [], 'load log', LEGACY_STORAGE_KEY);

  if (!Array.isArray(rawLoads)) {
    addStorageWarning('Warning: saved load log was not in the expected format. The app started with an empty load log.');
    return [];
  }

  return rawLoads.map(normalizeSavedLoad);
}

function saveLoadsToStorage() {
  return storeJson(STORAGE_KEY, savedLoads, 'load log');
}

function normalizeDailyAddOns(rawAddOns) {
  const normalized = {};
  const entries = Array.isArray(rawAddOns)
    ? rawAddOns.map((item) => [item?.date || item?.loadDate, item])
    : Object.entries(rawAddOns || {});

  entries.forEach(([date, addOn]) => {
    if (!date || !addOn || typeof addOn !== 'object') {
      return;
    }

    normalized[date] = {
      date,
      perDiem: Boolean(addOn.perDiem ?? addOn.perDiemApplied),
      sleeperBerth: Boolean(addOn.sleeperBerth ?? addOn.sleeperBerthApplied),
      notes: addOn.notes || addOn.dailyEarningsNotes || ''
    };
  });

  return normalized;
}

function loadDailyAddOns() {
  const rawAddOns = loadJson(ADD_ON_STORAGE_KEY, {}, 'daily add-ons', LEGACY_ADD_ON_STORAGE_KEY);

  if (!rawAddOns || typeof rawAddOns !== 'object') {
    addStorageWarning('Warning: saved daily add-ons were not in the expected format. The app started with no daily add-ons selected.');
    return {};
  }

  return normalizeDailyAddOns(rawAddOns);
}

function saveDailyAddOnsToStorage() {
  return storeJson(ADD_ON_STORAGE_KEY, dailyAddOns, 'daily add-ons');
}

function loadDailySummaries() {
  const rawSummaries = loadJson(EARNINGS_STORAGE_KEY, {}, 'daily summaries', LEGACY_EARNINGS_STORAGE_KEY);

  if (!rawSummaries || typeof rawSummaries !== 'object' || Array.isArray(rawSummaries)) {
    addStorageWarning('Warning: saved daily summaries were not in the expected format. The app rebuilt summaries from saved loads and daily add-ons.');
    return {};
  }

  return rawSummaries;
}

function saveDailySummariesToStorage() {
  return storeJson(EARNINGS_STORAGE_KEY, dailyEarningsRecords, 'daily summaries');
}

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readValue(id) {
  const value = String(document.getElementById(id).value).trim();
  return numberFieldIds.has(id) ? (value === '' ? null : Number(value)) : value;
}

function getFormValues() {
  return Object.fromEntries(fieldIds.map((id) => [toKey(id), readValue(id)]));
}

function isFiniteNumber(value) {
  return Number.isFinite(value);
}

function valueOrZero(value) {
  return isFiniteNumber(value) ? value : 0;
}

function isCompleted(load) {
  return load.loadStatus === COMPLETED_STATUS;
}

function isReject(load) {
  return load.loadStatus === REJECT_STATUS;
}

function formatBarrels(value) {
  return isFiniteNumber(value) ? `${value.toFixed(2)} bbl` : '-';
}

function formatMiles(value) {
  return isFiniteNumber(value) ? `${value.toFixed(1)} mi` : '-';
}

function formatMoney(value) {
  return isFiniteNumber(value) ? `$${value.toFixed(2)}` : '$0.00';
}

function formatWeight(value) {
  return isFiniteNumber(value) ? `${Math.round(value).toLocaleString()} lb` : '-';
}

function formatCrudeWeight(value) {
  return isFiniteNumber(value) ? `${value.toFixed(1)} lb/bbl` : '-';
}

function formatNumber(value, decimals = 2) {
  return isFiniteNumber(value) ? value.toFixed(decimals) : '-';
}

function formatPercent(value) {
  return isFiniteNumber(value) ? `${value.toFixed(2)}%` : '-';
}

function formatDuration(minutes) {
  if (!isFiniteNumber(minutes)) {
    return '-';
  }

  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return `${hours} hr ${mins} min`;
}

function parseTimeToMinutes(timeValue) {
  if (!timeValue) {
    return null;
  }

  const [hours, minutes] = timeValue.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
}

function durationBetween(startTime, endTime) {
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);

  if (start === null || end === null) {
    return null;
  }

  if (end < start) {
    end += 1440;
  }

  return end - start;
}

function calculatePaidWaitMinutes(timeOnLocationMinutes) {
  return isFiniteNumber(timeOnLocationMinutes)
    ? Math.max(0, timeOnLocationMinutes - WAIT_GRACE_MINUTES)
    : 0;
}

function calculateWaitPay(totalPaidWaitMinutes) {
  return isFiniteNumber(totalPaidWaitMinutes)
    ? totalPaidWaitMinutes / 60 * WAIT_PAY_RATE
    : 0;
}

function timelineEndMinutes(startTime, endTime) {
  const start = parseTimeToMinutes(startTime);
  let end = parseTimeToMinutes(endTime);

  if (end === null) {
    return null;
  }

  if (start !== null && end < start) {
    end += 1440;
  }

  return end;
}

function getLoadedMilesPay(loadedMiles) {
  if (!isFiniteNumber(loadedMiles) || loadedMiles <= 0) {
    return { rate: 0, rangeLabel: '0 miles' };
  }

  const milesForRate = Math.ceil(loadedMiles);
  const match = loadedMilesPayScale.find((range) => (
    milesForRate >= range.min && milesForRate <= range.max
  ));

  if (!match) {
    return { rate: 0, rangeLabel: NO_RATE_FOUND_LABEL };
  }

  return { rate: match.rate, rangeLabel: `${match.min}-${match.max} miles` };
}

function getOffloadStatus(difference) {
  if (!isFiniteNumber(difference)) {
    return '-';
  }

  const rounded = Number(difference.toFixed(2));

  if (rounded > 0) {
    return `Over by ${rounded.toFixed(2)} barrels`;
  }

  if (rounded < 0) {
    return `Short by ${Math.abs(rounded).toFixed(2)} barrels`;
  }

  return 'Matches gross barrels exactly';
}

function calculateDerived(values) {
  const grossBarrels = valueOrZero(values.grossBarrels);
  const bswPercentage = valueOrZero(values.bswPercentage);
  const shouldCalculateLoad = isCompleted(values) || grossBarrels > 0;
  const barrelsOk = shouldCalculateLoad && grossBarrels >= 0 && bswPercentage >= 0 && bswPercentage <= 100;
  const apiOk = shouldCalculateLoad && isFiniteNumber(values.apiGravity) && values.apiGravity > 0;
  const waterBarrels = barrelsOk ? grossBarrels * bswPercentage / 100 : null;
  const oilBarrels = barrelsOk ? grossBarrels - waterBarrels : null;
  const crudeWeightPerBarrel = apiOk ? (141.5 / (values.apiGravity + 131.5)) * 350 : null;
  const estimatedOilWeight = isFiniteNumber(oilBarrels) && isFiniteNumber(crudeWeightPerBarrel)
    ? oilBarrels * crudeWeightPerBarrel
    : null;
  const estimatedWaterWeight = isFiniteNumber(waterBarrels) ? waterBarrels * 350 : null;
  const estimatedTotalLoadWeight = isFiniteNumber(estimatedOilWeight) && isFiniteNumber(estimatedWaterWeight)
    ? estimatedOilWeight + estimatedWaterWeight
    : null;
  const estimatedGrossTruckWeight = isFiniteNumber(values.emptyTruckWeight) && isFiniteNumber(estimatedTotalLoadWeight)
    ? values.emptyTruckWeight + estimatedTotalLoadWeight
    : null;
  const barrelsOffloaded = isFiniteNumber(values.startMeterReading) && isFiniteNumber(values.endMeterReading)
    ? values.endMeterReading - values.startMeterReading
    : null;
  const differenceVsGrossBarrels = isFiniteNumber(barrelsOffloaded) && isFiniteNumber(values.grossBarrels)
    ? barrelsOffloaded - values.grossBarrels
    : null;
  const payMatch = getLoadedMilesPay(values.loadedMiles);
  const estimatedPay = isReject(values) ? REJECT_PAY : payMatch.rate;
  const pickupTimeMinutes = durationBetween(values.arrivedPickupTime, values.loadedTime);
  const dropoffTimeMinutes = durationBetween(values.arrivedDropoffTime, values.completedTime);
  const paidPickupWaitMinutes = calculatePaidWaitMinutes(pickupTimeMinutes);
  const paidDropoffWaitMinutes = calculatePaidWaitMinutes(dropoffTimeMinutes);
  const totalPaidWaitMinutes = paidPickupWaitMinutes + paidDropoffWaitMinutes;
  const waitPay = calculateWaitPay(totalPaidWaitMinutes);
  const estimatedEntryPay = estimatedPay + waitPay;

  return {
    waterBarrels,
    oilBarrels,
    crudeWeightPerBarrel,
    estimatedOilWeight,
    estimatedWaterWeight,
    estimatedTotalLoadWeight,
    estimatedGrossTruckWeight,
    barrelsOffloaded,
    differenceVsGrossBarrels,
    offloadStatus: getOffloadStatus(differenceVsGrossBarrels),
    matchedPayRange: isReject(values) ? 'Reject pay' : payMatch.rangeLabel,
    loadedMilesPayRate: isReject(values) ? 0 : payMatch.rate,
    estimatedPay,
    estimatedEntryPay,
    paySource: isReject(values) ? 'Reject' : 'Automatic',
    pickupTimeMinutes,
    travelTimeMinutes: durationBetween(values.loadedTime, values.arrivedDropoffTime),
    dropoffTimeMinutes,
    paidPickupWaitMinutes,
    paidDropoffWaitMinutes,
    totalPaidWaitMinutes,
    waitPay,
    cycleTimeMinutes: durationBetween(values.arrivedPickupTime, values.completedTime),
    firstPickupMinutes: parseTimeToMinutes(values.arrivedPickupTime),
    completedTimelineMinutes: timelineEndMinutes(values.arrivedPickupTime, values.completedTime)
  };
}

function normalizeSavedLoad(load) {
  const normalized = {
    id: load.id || `${load.savedAt || Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: load.savedAt || new Date().toISOString(),
    updatedAt: load.updatedAt || null,
    driverName: load.driverName || '',
    truckNumber: load.truckNumber || '',
    trailerNumber: load.trailerNumber || '',
    emptyTruckWeight: isFiniteNumber(load.emptyTruckWeight) ? load.emptyTruckWeight : null,
    loadDate: load.loadDate || '',
    loadNumber: load.loadNumber || '',
    ticketNumber: load.ticketNumber || '',
    bolNumber: load.bolNumber || '',
    loadStatus: load.loadStatus || COMPLETED_STATUS,
    productType: load.productType || '',
    pickupLocation: load.pickupLocation || '',
    dropoffLocation: load.dropoffLocation || '',
    grossBarrels: isFiniteNumber(load.grossBarrels) ? load.grossBarrels : 0,
    netBarrels: isFiniteNumber(load.netBarrels) ? load.netBarrels : null,
    apiGravity: isFiniteNumber(load.apiGravity) ? load.apiGravity : null,
    bswPercentage: isFiniteNumber(load.bswPercentage) ? load.bswPercentage : null,
    loadedMiles: isFiniteNumber(load.loadedMiles) ? load.loadedMiles : null,
    notes: load.notes || '',
    rejectReason: load.rejectReason || '',
    arrivedPickupTime: load.arrivedPickupTime || '',
    loadedTime: load.loadedTime || '',
    arrivedDropoffTime: load.arrivedDropoffTime || '',
    completedTime: load.completedTime || '',
    startMeterReading: isFiniteNumber(load.startMeterReading) ? load.startMeterReading : null,
    endMeterReading: isFiniteNumber(load.endMeterReading) ? load.endMeterReading : null,
    jotformConfirmationNumber: load.jotformConfirmationNumber || ''
  };

  return { ...normalized, ...calculateDerived(normalized) };
}

function storeLoads() {
  return saveLoadsToStorage();
}

function storeAddOns() {
  return saveDailyAddOnsToStorage();
}

function storeEarningsRecords() {
  return saveDailySummariesToStorage();
}

function getDailyAddOn(date) {
  const addOn = dailyAddOns[date] || {};
  return {
    date,
    perDiem: Boolean(addOn.perDiem),
    sleeperBerth: Boolean(addOn.sleeperBerth),
    notes: addOn.notes || ''
  };
}

function saveDailyAddOnFromControls() {
  const date = daily.date.value;

  if (!date) {
    return;
  }

  const addOn = {
    date,
    perDiem: addOns.perDiem.checked,
    sleeperBerth: addOns.sleeperBerth.checked,
    notes: addOns.notes.value.trim()
  };

  if (!addOn.perDiem && !addOn.sleeperBerth && !addOn.notes) {
    delete dailyAddOns[date];
  } else {
    dailyAddOns[date] = addOn;
  }

  storeAddOns();
  updateDailyEarningsRecord(date);
}

function applyDailyAddOnsToControls() {
  const addOn = getDailyAddOn(daily.date.value);
  addOns.perDiem.checked = addOn.perDiem;
  addOns.sleeperBerth.checked = addOn.sleeperBerth;
  addOns.notes.value = addOn.notes;
}

function sum(records, key) {
  return records.reduce((total, item) => (
    isFiniteNumber(item[key]) ? total + item[key] : total
  ), 0);
}

function average(records, key) {
  const usable = records.filter((item) => isFiniteNumber(item[key]));
  return usable.length > 0 ? sum(usable, key) / usable.length : null;
}

function getDailyEarningsSummary(date) {
  const records = savedLoads.filter((load) => load.loadDate === date);
  const completedRecords = records.filter(isCompleted);
  const rejectRecords = records.filter(isReject);
  const addOn = getDailyAddOn(date);
  const completedLoadPay = sum(completedRecords, 'estimatedPay');
  const rejectPay = sum(rejectRecords, 'estimatedPay');
  const totalPaidPickupWaitMinutes = sum(records, 'paidPickupWaitMinutes');
  const totalPaidDropoffWaitMinutes = sum(records, 'paidDropoffWaitMinutes');
  const totalPaidWaitMinutes = totalPaidPickupWaitMinutes + totalPaidDropoffWaitMinutes;
  const totalWaitPay = sum(records, 'waitPay');
  const totalEstimatedEntryPay = sum(records, 'estimatedEntryPay');
  const perDiemPay = addOn.perDiem ? PER_DIEM_PAY : 0;
  const sleeperBerthPay = addOn.sleeperBerth ? SLEEPER_BERTH_PAY : 0;

  return {
    date,
    completedLoadCount: completedRecords.length,
    rejectCount: rejectRecords.length,
    totalLoadedMiles: sum(records, 'loadedMiles'),
    totalGrossBarrels: sum(completedRecords, 'grossBarrels'),
    totalNetBarrels: sum(completedRecords, 'netBarrels'),
    totalBarrelsOffloaded: sum(records, 'barrelsOffloaded'),
    totalDifferenceVsGrossBarrels: sum(records, 'differenceVsGrossBarrels'),
    completedLoadPay,
    rejectPay,
    totalPaidPickupWaitMinutes,
    totalPaidDropoffWaitMinutes,
    totalPaidWaitMinutes,
    totalWaitPay,
    totalEstimatedEntryPay,
    perDiemApplied: addOn.perDiem,
    perDiemPay,
    sleeperBerthApplied: addOn.sleeperBerth,
    sleeperBerthPay,
    totalEstimatedDailyEarnings: totalEstimatedEntryPay + perDiemPay + sleeperBerthPay,
    averageLoadPayPerCompletedLoad: completedRecords.length > 0 ? completedLoadPay / completedRecords.length : 0,
    averageGrossBarrels: completedRecords.length > 0 ? sum(completedRecords, 'grossBarrels') / completedRecords.length : 0,
    averageNetBarrels: average(completedRecords, 'netBarrels') || 0,
    notes: addOn.notes
  };
}

function updateDailyEarningsRecord(date) {
  if (!date) {
    return null;
  }

  const summary = getDailyEarningsSummary(date);
  dailyEarningsRecords[date] = summary;
  storeEarningsRecords();
  return summary;
}

function refreshAllDailyEarningsRecords() {
  const dates = new Set([
    ...Object.keys(dailyEarningsRecords),
    ...Object.keys(dailyAddOns),
    ...savedLoads.map((load) => load.loadDate).filter(Boolean),
    daily.date.value
  ]);

  dates.forEach((date) => updateDailyEarningsRecord(date));
}

function renderSummary() {
  const values = getFormValues();
  const derived = calculateDerived(values);
  const rejectNoBarrels = isReject(values) && valueOrZero(values.grossBarrels) === 0;
  const noLoadText = rejectNoBarrels ? 'Not applicable' : '-';

  summary.waterBarrels.textContent = isFiniteNumber(derived.waterBarrels) ? formatBarrels(derived.waterBarrels) : noLoadText;
  summary.oilBarrels.textContent = isFiniteNumber(derived.oilBarrels) ? formatBarrels(derived.oilBarrels) : noLoadText;
  summary.crudeWeight.textContent = isFiniteNumber(derived.crudeWeightPerBarrel) ? formatCrudeWeight(derived.crudeWeightPerBarrel) : noLoadText;
  summary.oilWeight.textContent = isFiniteNumber(derived.estimatedOilWeight) ? formatWeight(derived.estimatedOilWeight) : noLoadText;
  summary.waterWeight.textContent = isFiniteNumber(derived.estimatedWaterWeight) ? formatWeight(derived.estimatedWaterWeight) : noLoadText;
  summary.totalWeight.textContent = isFiniteNumber(derived.estimatedTotalLoadWeight) ? formatWeight(derived.estimatedTotalLoadWeight) : noLoadText;
  summary.grossTruckWeight.textContent = isFiniteNumber(derived.estimatedGrossTruckWeight) ? formatWeight(derived.estimatedGrossTruckWeight) : '-';
  summary.startMeterReading.textContent = isFiniteNumber(values.startMeterReading) ? formatNumber(values.startMeterReading) : '-';
  summary.endMeterReading.textContent = isFiniteNumber(values.endMeterReading) ? formatNumber(values.endMeterReading) : '-';
  summary.barrelsOffloaded.textContent = isFiniteNumber(derived.barrelsOffloaded) ? formatBarrels(derived.barrelsOffloaded) : '-';
  summary.grossBarrelsHauled.textContent = isFiniteNumber(values.grossBarrels) ? formatBarrels(values.grossBarrels) : '-';
  summary.differenceGross.textContent = isFiniteNumber(derived.differenceVsGrossBarrels) ? formatBarrels(derived.differenceVsGrossBarrels) : '-';
  summary.offloadStatus.textContent = derived.offloadStatus;
  summary.payRange.textContent = derived.matchedPayRange;
  summary.estimatedPay.textContent = formatMoney(derived.estimatedPay);
  summary.pickupTime.textContent = formatDuration(derived.pickupTimeMinutes);
  summary.paidPickupWait.textContent = formatDuration(derived.paidPickupWaitMinutes);
  summary.dropoffTime.textContent = formatDuration(derived.dropoffTimeMinutes);
  summary.paidDropoffWait.textContent = formatDuration(derived.paidDropoffWaitMinutes);
  summary.totalPaidWait.textContent = formatDuration(derived.totalPaidWaitMinutes);
  summary.waitPay.textContent = formatMoney(derived.waitPay);
  summary.entryTotal.textContent = formatMoney(derived.estimatedEntryPay);
  summary.cycleTime.textContent = formatDuration(derived.cycleTimeMinutes);
}

function updateDailySummary() {
  const selectedDate = daily.date.value;
  const dayRecords = savedLoads.filter((load) => load.loadDate === selectedDate);
  const summaryRecord = updateDailyEarningsRecord(selectedDate);

  daily.completedLoads.textContent = String(summaryRecord.completedLoadCount);
  daily.rejects.textContent = String(summaryRecord.rejectCount);
  daily.grossBarrels.textContent = formatBarrels(summaryRecord.totalGrossBarrels);
  daily.loadedMiles.textContent = formatMiles(summaryRecord.totalLoadedMiles);
  daily.barrelsOffloaded.textContent = formatBarrels(summaryRecord.totalBarrelsOffloaded);
  daily.differenceGross.textContent = formatBarrels(summaryRecord.totalDifferenceVsGrossBarrels);
  daily.completedPay.textContent = formatMoney(summaryRecord.completedLoadPay);
  daily.rejectPay.textContent = formatMoney(summaryRecord.rejectPay);
  daily.paidPickupWait.textContent = formatDuration(summaryRecord.totalPaidPickupWaitMinutes);
  daily.paidDropoffWait.textContent = formatDuration(summaryRecord.totalPaidDropoffWaitMinutes);
  daily.totalPaidWait.textContent = formatDuration(summaryRecord.totalPaidWaitMinutes);
  daily.waitPay.textContent = formatMoney(summaryRecord.totalWaitPay);
  daily.perDiemPay.textContent = formatMoney(summaryRecord.perDiemPay);
  daily.sleeperPay.textContent = formatMoney(summaryRecord.sleeperBerthPay);
  daily.totalEarnings.textContent = formatMoney(summaryRecord.totalEstimatedDailyEarnings);

  review.dateLabel.textContent = selectedDate || '-';
  review.date.textContent = selectedDate || '-';
  review.completedLoads.textContent = String(summaryRecord.completedLoadCount);
  review.rejects.textContent = String(summaryRecord.rejectCount);
  review.loadedMiles.textContent = formatMiles(summaryRecord.totalLoadedMiles);
  review.grossBarrels.textContent = formatBarrels(summaryRecord.totalGrossBarrels);
  review.barrelsOffloaded.textContent = formatBarrels(summaryRecord.totalBarrelsOffloaded);
  review.differenceGross.textContent = formatBarrels(summaryRecord.totalDifferenceVsGrossBarrels);
  review.completedPay.textContent = formatMoney(summaryRecord.completedLoadPay);
  review.rejectPay.textContent = formatMoney(summaryRecord.rejectPay);
  review.paidPickupWait.textContent = formatDuration(summaryRecord.totalPaidPickupWaitMinutes);
  review.paidDropoffWait.textContent = formatDuration(summaryRecord.totalPaidDropoffWaitMinutes);
  review.totalPaidWait.textContent = formatDuration(summaryRecord.totalPaidWaitMinutes);
  review.waitPay.textContent = formatMoney(summaryRecord.totalWaitPay);
  review.perDiemApplied.textContent = summaryRecord.perDiemApplied ? 'Yes' : 'No';
  review.perDiemPay.textContent = formatMoney(summaryRecord.perDiemPay);
  review.sleeperApplied.textContent = summaryRecord.sleeperBerthApplied ? 'Yes' : 'No';
  review.sleeperPay.textContent = formatMoney(summaryRecord.sleeperBerthPay);
  review.totalEarnings.textContent = formatMoney(summaryRecord.totalEstimatedDailyEarnings);

  renderSavedLoads(dayRecords);
}

function renderDailyPanels() {
  updateDailySummary();
}

function renderSavedLoads(records = savedLoads.filter((load) => load.loadDate === daily.date.value)) {
  renderSavedLoadCards(records);
}

function renderSavedLoadCards(records) {
  logCount.textContent = `${records.length} ${records.length === 1 ? 'load' : 'loads'}`;

  if (records.length === 0) {
    savedLoadCards.innerHTML = '<article class="empty-card">No saved loads for this date yet.</article>';
    return;
  }

  savedLoadCards.innerHTML = records.map((load) => `
    <article class="load-card">
      <div class="load-card-header">
        <div class="load-title">
          <strong>${escapeHtml(load.loadNumber || 'No load number')} | ${escapeHtml(load.loadStatus || '-')}</strong>
          <span class="load-route">${escapeHtml(load.pickupLocation || 'Pickup')} &rarr; ${escapeHtml(load.dropoffLocation || 'Drop off')}</span>
          <span class="load-route">Ticket ${escapeHtml(load.ticketNumber || '-')} | BOL ${escapeHtml(load.bolNumber || '-')}</span>
        </div>
        <div class="load-actions">
          <button class="small-button" type="button" data-action="edit" data-id="${escapeHtml(load.id)}">Edit</button>
          <button class="small-button danger" type="button" data-action="delete" data-id="${escapeHtml(load.id)}">Delete</button>
        </div>
      </div>
      <div class="load-chip-grid">
        ${loadChip('Gross barrels', formatBarrels(load.grossBarrels))}
        ${loadChip('Loaded miles', formatMiles(load.loadedMiles))}
        ${loadChip('Offloaded', formatBarrels(load.barrelsOffloaded))}
        ${loadChip('Diff vs gross', formatBarrels(load.differenceVsGrossBarrels))}
        ${loadChip('Offload status', load.offloadStatus)}
        ${loadChip('Base pay', formatMoney(load.estimatedPay))}
        ${loadChip('Pickup time', formatDuration(load.pickupTimeMinutes))}
        ${loadChip('Drop-off time', formatDuration(load.dropoffTimeMinutes))}
        ${loadChip('Paid wait time', formatDuration(load.totalPaidWaitMinutes))}
        ${loadChip('Wait pay', formatMoney(load.waitPay))}
        ${loadChip('Estimated total pay', formatMoney(load.estimatedEntryPay))}
        ${loadChip('Cycle time', formatDuration(load.cycleTimeMinutes))}
      </div>
      <details class="load-details">
        <summary>Full saved record</summary>
        <div class="detail-grid">
          ${detailItem('Driver name', load.driverName)}
          ${detailItem('Truck number', load.truckNumber)}
          ${detailItem('Trailer number', load.trailerNumber)}
          ${detailItem('Product type', load.productType)}
          ${detailItem('API gravity', formatNumber(load.apiGravity, 1))}
          ${detailItem('BS&W percentage', formatPercent(load.bswPercentage))}
          ${detailItem('Estimated load weight', formatWeight(load.estimatedTotalLoadWeight))}
          ${detailItem('Estimated gross truck weight', formatWeight(load.estimatedGrossTruckWeight))}
          ${detailItem('Start meter reading', formatNumber(load.startMeterReading))}
          ${detailItem('End meter reading', formatNumber(load.endMeterReading))}
          ${detailItem('Barrels offloaded', formatBarrels(load.barrelsOffloaded))}
          ${detailItem('Gross barrels hauled', formatBarrels(load.grossBarrels))}
          ${detailItem('Difference vs gross barrels', formatBarrels(load.differenceVsGrossBarrels))}
          ${detailItem('Offload status', load.offloadStatus)}
          ${detailItem('Jotform confirmation number', load.jotformConfirmationNumber || '-')}
          ${detailItem('Arrived at pickup', load.arrivedPickupTime || '-')}
          ${detailItem('Loaded / picked up', load.loadedTime || '-')}
          ${detailItem('Arrived at drop off', load.arrivedDropoffTime || '-')}
          ${detailItem('Dropped off / completed', load.completedTime || '-')}
          ${detailItem('Pickup time', formatDuration(load.pickupTimeMinutes))}
          ${detailItem('Paid pickup wait time', formatDuration(load.paidPickupWaitMinutes))}
          ${detailItem('Drop-off time', formatDuration(load.dropoffTimeMinutes))}
          ${detailItem('Paid drop-off wait time', formatDuration(load.paidDropoffWaitMinutes))}
          ${detailItem('Total paid wait time', formatDuration(load.totalPaidWaitMinutes))}
          ${detailItem('Wait pay', formatMoney(load.waitPay))}
          ${detailItem('Estimated total pay', formatMoney(load.estimatedEntryPay))}
          ${detailItem('Pay range matched', load.matchedPayRange)}
          ${detailItem('Notes', load.notes || '-', true)}
        </div>
      </details>
    </article>
  `).join('');
}

function loadChip(label, value) {
  return `<div class="load-chip"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function detailItem(label, value, isFull = false) {
  return `
    <div class="detail-item${isFull ? ' full' : ''}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || '-')}</strong>
    </div>
  `;
}

function setFieldError(fieldKey, message) {
  const field = fields[fieldKey];
  const error = errors[fieldKey];

  if (!field || !error) {
    return;
  }

  field.classList.toggle('invalid', Boolean(message));
  error.textContent = message;
}

function clearValidation() {
  Object.keys(errors).forEach((key) => setFieldError(key, ''));
  validationSummary.className = 'validation-summary';
  validationSummary.textContent = '';
}

function validate(values) {
  clearValidation();
  const messages = [];

  if (values.emptyTruckWeight !== null && (!isFiniteNumber(values.emptyTruckWeight) || values.emptyTruckWeight < 0)) {
    messages.push('Empty truck/trailer weight must be 0 or greater if entered.');
    setFieldError('emptyTruckWeight', 'Enter 0 or greater, or leave it blank.');
  }

  if (!values.loadDate) {
    messages.push('Date is required.');
    setFieldError('loadDate', 'Enter a date.');
  }

  if (!values.loadStatus) {
    messages.push('Load status is required.');
    setFieldError('loadStatus', 'Choose Completed Load or Reject.');
  }

  if (isCompleted(values) && (!isFiniteNumber(values.grossBarrels) || values.grossBarrels <= 0)) {
    messages.push('If Load Status is Completed Load, gross barrels must be greater than 0.');
    setFieldError('grossBarrels', 'Completed loads need gross barrels greater than 0.');
  }

  if (isReject(values) && (!isFiniteNumber(values.grossBarrels) || values.grossBarrels < 0)) {
    messages.push('If Load Status is Reject, gross barrels can be 0 or greater.');
    setFieldError('grossBarrels', 'Reject gross barrels can be 0 or greater.');
  }

  if (values.apiGravity !== null && (!isFiniteNumber(values.apiGravity) || values.apiGravity <= 0)) {
    messages.push('API gravity must be greater than 0 if entered.');
    setFieldError('apiGravity', 'Enter API gravity greater than 0, or leave it blank.');
  }

  if (values.bswPercentage !== null && (!isFiniteNumber(values.bswPercentage) || values.bswPercentage < 0 || values.bswPercentage > 100)) {
    messages.push('BS&W percentage must be between 0 and 100 if entered.');
    setFieldError('bswPercentage', 'Enter a percentage from 0 to 100, or leave it blank.');
  }

  if (values.loadedMiles !== null && (!isFiniteNumber(values.loadedMiles) || values.loadedMiles < 0)) {
    messages.push('Loaded miles must be 0 or greater.');
    setFieldError('loadedMiles', 'Enter loaded miles of 0 or greater, or leave it blank.');
  }

  if (values.startMeterReading !== null && (!isFiniteNumber(values.startMeterReading) || values.startMeterReading < 0)) {
    messages.push('Start meter reading must be 0 or greater if entered.');
    setFieldError('startMeterReading', 'Enter 0 or greater, or leave it blank.');
  }

  if (values.endMeterReading !== null && (!isFiniteNumber(values.endMeterReading) || values.endMeterReading < 0)) {
    messages.push('End meter reading must be 0 or greater if entered.');
    setFieldError('endMeterReading', 'Enter 0 or greater, or leave it blank.');
  }

  if (values.startMeterReading !== null && values.endMeterReading === null) {
    messages.push('Enter an end meter reading to compare offloaded barrels.');
    setFieldError('endMeterReading', 'Enter the end meter reading.');
  }

  if (values.startMeterReading === null && values.endMeterReading !== null) {
    messages.push('Enter a start meter reading to compare offloaded barrels.');
    setFieldError('startMeterReading', 'Enter the start meter reading.');
  }

  if (
    isFiniteNumber(values.startMeterReading)
    && isFiniteNumber(values.endMeterReading)
    && values.endMeterReading < values.startMeterReading
  ) {
    messages.push('End meter reading must be greater than or equal to start meter reading.');
    setFieldError('endMeterReading', 'End reading must be at least the start reading.');
  }

  if (messages.length > 0) {
    validationSummary.className = 'validation-summary show';
    validationSummary.textContent = messages[0];
    return false;
  }

  return true;
}

function normalizeDuplicateValue(value) {
  return String(value || '').trim().toLowerCase();
}

function findLikelyDuplicate(values, excludedId = null) {
  const hasIdentifier = [values.ticketNumber, values.bolNumber, values.loadNumber]
    .some((value) => normalizeDuplicateValue(value));

  if (!values.loadDate || !hasIdentifier) {
    return null;
  }

  return savedLoads.find((load) => (
    load.id !== excludedId
    && load.loadDate === values.loadDate
    && normalizeDuplicateValue(load.ticketNumber) === normalizeDuplicateValue(values.ticketNumber)
    && normalizeDuplicateValue(load.bolNumber) === normalizeDuplicateValue(values.bolNumber)
    && normalizeDuplicateValue(load.loadNumber) === normalizeDuplicateValue(values.loadNumber)
  )) || null;
}

function hideDuplicateWarning() {
  duplicateWarning.hidden = true;
  pendingDuplicateRecord = null;
}

function showDuplicateWarning(record) {
  pendingDuplicateRecord = record;
  duplicateWarning.hidden = false;

  if (duplicateWarning.scrollIntoView) {
    duplicateWarning.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function buildLoadRecord(values) {
  const existingLoad = editingLoadId
    ? savedLoads.find((load) => load.id === editingLoadId)
    : null;

  return normalizeSavedLoad({
    ...existingLoad,
    id: existingLoad?.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: existingLoad?.savedAt || new Date().toISOString(),
    updatedAt: existingLoad ? new Date().toISOString() : null,
    ...values
  });
}

function saveLoad(event) {
  event.preventDefault();
  const values = getFormValues();

  if (!validate(values)) {
    renderSummary();
    return;
  }

  const record = buildLoadRecord(values);
  const duplicate = findLikelyDuplicate(values, editingLoadId);

  if (duplicate) {
    showDuplicateWarning(record);
    return;
  }

  commitLoadRecord(record);
}

function commitLoadRecord(record) {
  hideDuplicateWarning();

  if (editingLoadId) {
    savedLoads = savedLoads.map((load) => (load.id === editingLoadId ? record : load));
    exitEditMode();
  } else {
    savedLoads.unshift(record);
  }

  daily.date.value = record.loadDate || daily.date.value;
  storeLoads();
  refreshAllDailyEarningsRecords();
  applyDailyAddOnsToControls();
  renderSummary();
  updateDailySummary();
  showSaveMessage('Load saved successfully.');
}

function exitEditMode() {
  editingLoadId = null;
  saveLoadButton.textContent = 'Save Load';
  editStatus.textContent = 'New entry';
}

function clearForm() {
  form.reset();
  clearValidation();
  clearSaveMessage();
  hideDuplicateWarning();
  exitEditMode();
  fields.loadDate.value = daily.date.value || todayLocal();
  fields.loadStatus.value = COMPLETED_STATUS;
  applyDailyAddOnsToControls();
  renderSummary();
}

function loadEntryForEdit(loadId) {
  const load = savedLoads.find((item) => item.id === loadId);

  if (!load) {
    return;
  }

  hideDuplicateWarning();
  clearValidation();
  editingLoadId = loadId;
  saveLoadButton.textContent = 'Update Load';
  editStatus.textContent = `Editing ${load.loadNumber || load.ticketNumber || 'saved load'}`;

  fieldIds.forEach((id) => {
    const key = toKey(id);
    const field = fields[key];

    if (field) {
      field.value = load[key] === null || load[key] === undefined ? '' : load[key];
    }
  });

  daily.date.value = load.loadDate || daily.date.value;
  applyDailyAddOnsToControls();
  renderSummary();
  updateDailySummary();

  if (form.scrollIntoView) {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function deleteLoadEntry(loadId) {
  const load = savedLoads.find((item) => item.id === loadId);

  if (!load) {
    return;
  }

  const confirmDelete = typeof globalThis.confirm === 'function'
    ? globalThis.confirm('Are you sure you want to delete this saved load entry?')
    : true;

  if (!confirmDelete) {
    return;
  }

  savedLoads = savedLoads.filter((item) => item.id !== loadId);
  storeLoads();
  refreshAllDailyEarningsRecords();
  hideDuplicateWarning();
  clearSaveMessage();

  if (editingLoadId === loadId) {
    clearForm();
  } else {
    renderSummary();
    updateDailySummary();
  }
}

function clearSavedLog() {
  savedLoads = [];
  storeLoads();
  refreshAllDailyEarningsRecords();
  hideDuplicateWarning();
  exitEditMode();
  renderSummary();
  updateDailySummary();
}

function handleSavedCardAction(event) {
  const button = event.target.closest ? event.target.closest('button[data-action]') : null;

  if (!button) {
    return;
  }

  if (button.dataset.action === 'edit') {
    loadEntryForEdit(button.dataset.id);
  }

  if (button.dataset.action === 'delete') {
    deleteLoadEntry(button.dataset.id);
  }
}

function handleSelectedDateChange() {
  applyDailyAddOnsToControls();

  if (!editingLoadId) {
    fields.loadDate.value = daily.date.value;
  }

  renderSummary();
  updateDailySummary();
}

function handleLoadDateChange() {
  if (fields.loadDate.value) {
    daily.date.value = fields.loadDate.value;
    applyDailyAddOnsToControls();
    updateDailySummary();
  }
}

function handleAddOnChange() {
  clearSaveMessage();
  saveDailyAddOnFromControls();
  refreshAllDailyEarningsRecords();
  updateDailySummary();
}

function handleFormInput(event) {
  clearValidation();
  clearSaveMessage();
  hideDuplicateWarning();

  if (event.target === fields.loadDate) {
    handleLoadDateChange();
  }

  renderSummary();
}

function toCsvValue(value) {
  const text = String(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function formatCsvNumber(value, decimals = 2) {
  return isFiniteNumber(value) ? value.toFixed(decimals) : '';
}

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(toCsvValue).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadLoadLog() {
  const headers = [
    'Date',
    'Load number',
    'Ticket number',
    'BOL number',
    'Load status',
    'Driver name',
    'Truck number',
    'Trailer number',
    'Pickup location',
    'Drop off location',
    'Product type',
    'Gross barrels',
    'Net barrels',
    'API gravity',
    'BS&W percentage',
    'Loaded miles',
    'Matched pay range',
    'Loaded miles pay rate',
    'Estimated pay',
    'Pay source',
    'Water barrels',
    'Oil barrels',
    'Crude weight per barrel',
    'Estimated oil weight',
    'Estimated water weight',
    'Estimated total load weight',
    'Empty truck/trailer weight',
    'Estimated gross truck weight',
    'Start meter reading',
    'End meter reading',
    'Barrels offloaded',
    'Difference vs gross barrels',
    'Offload status',
    'Jotform confirmation number',
    'Arrived at pickup time',
    'Loaded / picked up time',
    'Arrived at drop off time',
    'Dropped off / completed time',
    'Pickup time',
    'Paid pickup wait time',
    'Drop-off time',
    'Paid drop-off wait time',
    'Total paid wait time',
    'Wait pay',
    'Estimated total pay',
    'Total cycle time',
    'Notes'
  ];

  const rows = savedLoads.map((load) => [
    load.loadDate,
    load.loadNumber,
    load.ticketNumber,
    load.bolNumber,
    load.loadStatus,
    load.driverName,
    load.truckNumber,
    load.trailerNumber,
    load.pickupLocation,
    load.dropoffLocation,
    load.productType,
    formatCsvNumber(load.grossBarrels),
    formatCsvNumber(load.netBarrels),
    formatCsvNumber(load.apiGravity, 1),
    formatCsvNumber(load.bswPercentage),
    formatCsvNumber(load.loadedMiles, 1),
    load.matchedPayRange,
    formatCsvNumber(load.loadedMilesPayRate),
    formatCsvNumber(load.estimatedPay),
    load.paySource,
    formatCsvNumber(load.waterBarrels),
    formatCsvNumber(load.oilBarrels),
    formatCsvNumber(load.crudeWeightPerBarrel, 1),
    isFiniteNumber(load.estimatedOilWeight) ? Math.round(load.estimatedOilWeight) : '',
    isFiniteNumber(load.estimatedWaterWeight) ? Math.round(load.estimatedWaterWeight) : '',
    isFiniteNumber(load.estimatedTotalLoadWeight) ? Math.round(load.estimatedTotalLoadWeight) : '',
    formatCsvNumber(load.emptyTruckWeight, 0),
    isFiniteNumber(load.estimatedGrossTruckWeight) ? Math.round(load.estimatedGrossTruckWeight) : '',
    formatCsvNumber(load.startMeterReading),
    formatCsvNumber(load.endMeterReading),
    formatCsvNumber(load.barrelsOffloaded),
    formatCsvNumber(load.differenceVsGrossBarrels),
    load.offloadStatus,
    load.jotformConfirmationNumber,
    load.arrivedPickupTime,
    load.loadedTime,
    load.arrivedDropoffTime,
    load.completedTime,
    formatDuration(load.pickupTimeMinutes),
    formatDuration(load.paidPickupWaitMinutes),
    formatDuration(load.dropoffTimeMinutes),
    formatDuration(load.paidDropoffWaitMinutes),
    formatDuration(load.totalPaidWaitMinutes),
    formatCsvNumber(load.waitPay),
    formatCsvNumber(load.estimatedEntryPay),
    formatDuration(load.cycleTimeMinutes),
    load.notes
  ]);

  downloadCsv(`personal-oilfield-load-log-${todayLocal()}.csv`, headers, rows);
}

function getDailyEarningsDates() {
  const dates = new Set([
    ...Object.keys(dailyEarningsRecords),
    ...Object.keys(dailyAddOns),
    ...savedLoads.map((load) => load.loadDate).filter(Boolean),
    daily.date.value
  ]);

  return [...dates].filter(Boolean).sort();
}

function downloadDailyEarningsSummary() {
  refreshAllDailyEarningsRecords();
  const headers = [
    'Date',
    'Completed load count',
    'Reject count',
    'Total loaded miles',
    'Total gross barrels',
    'Total barrels offloaded',
    'Total difference vs gross barrels',
    'Total completed load pay',
    'Total reject pay',
    'Total paid pickup wait time',
    'Total paid drop-off wait time',
    'Total paid wait time',
    'Total wait pay',
    'Per diem applied',
    'Per diem amount',
    'Sleeper berth applied',
    'Sleeper berth amount',
    'Total estimated daily earnings',
    'Daily earnings notes'
  ];

  const rows = getDailyEarningsDates().map((date) => {
    const record = dailyEarningsRecords[date] || getDailyEarningsSummary(date);

    return [
      record.date,
      record.completedLoadCount,
      record.rejectCount,
      formatCsvNumber(record.totalLoadedMiles, 1),
      formatCsvNumber(record.totalGrossBarrels),
      formatCsvNumber(record.totalBarrelsOffloaded),
      formatCsvNumber(record.totalDifferenceVsGrossBarrels),
      formatCsvNumber(record.completedLoadPay),
      formatCsvNumber(record.rejectPay),
      formatDuration(record.totalPaidPickupWaitMinutes),
      formatDuration(record.totalPaidDropoffWaitMinutes),
      formatDuration(record.totalPaidWaitMinutes),
      formatCsvNumber(record.totalWaitPay),
      record.perDiemApplied ? 'Yes' : 'No',
      formatCsvNumber(record.perDiemPay),
      record.sleeperBerthApplied ? 'Yes' : 'No',
      formatCsvNumber(record.sleeperBerthPay),
      formatCsvNumber(record.totalEstimatedDailyEarnings),
      record.notes
    ];
  });

  downloadCsv(`personal-oilfield-daily-earnings-${todayLocal()}.csv`, headers, rows);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initialize() {
  const today = todayLocal();
  if (appVersion) {
    appVersion.textContent = APP_VERSION;
  }

  daily.date.value = daily.date.value || today;
  fields.loadDate.value = fields.loadDate.value || daily.date.value;
  fields.loadStatus.value = fields.loadStatus.value || COMPLETED_STATUS;
  saveLoadsToStorage();
  saveDailyAddOnsToStorage();
  applyDailyAddOnsToControls();
  refreshAllDailyEarningsRecords();
  renderStorageWarning();
  renderSummary();
  updateDailySummary();
  registerServiceWorker();
}

form.addEventListener('submit', saveLoad);
form.addEventListener('input', handleFormInput);
form.addEventListener('change', handleFormInput);
daily.date.addEventListener('input', handleSelectedDateChange);
daily.date.addEventListener('change', handleSelectedDateChange);
Object.values(addOns).forEach((field) => {
  field.addEventListener('input', handleAddOnChange);
  field.addEventListener('change', handleAddOnChange);
});
saveAnywayButton.addEventListener('click', () => {
  if (pendingDuplicateRecord) {
    commitLoadRecord(pendingDuplicateRecord);
  }
});
cancelDuplicateButton.addEventListener('click', hideDuplicateWarning);
clearFormButton.addEventListener('click', clearForm);
savedLoadCards.addEventListener('click', handleSavedCardAction);
downloadLogButton.addEventListener('click', downloadLoadLog);
downloadEarningsButton.addEventListener('click', downloadDailyEarningsSummary);
clearLogButton.addEventListener('click', clearSavedLog);
checkUpdatesButton.addEventListener('click', checkForUpdates);

initialize();
