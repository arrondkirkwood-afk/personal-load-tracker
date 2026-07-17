const APP_VERSION = "1.3.2";
const DATA_SCHEMA_VERSION = 2;
const APP_CACHE_PREFIX = 'personal-oilfield-load-tracker-';
const APP_CACHE_NAME = `${APP_CACHE_PREFIX}v${APP_VERSION}`;
const APP_RUNTIME = detectAppRuntime();
const STORAGE_KEY = 'personalOilfieldLoadTracker.loads';
const ADD_ON_STORAGE_KEY = 'personalOilfieldLoadTracker.dailyAddOns';
const EARNINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.dailySummaries';
const PROFILE_STORAGE_KEY = 'personalOilfieldLoadTracker.profile';
const META_STORAGE_KEY = 'personalOilfieldLoadTracker.meta';
const SETTINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.settings';
const FAVORITE_ROUTES_STORAGE_KEY = 'personalOilfieldLoadTracker.favoriteRoutes';
const DRAFT_STORAGE_KEY = 'personalOilfieldLoadTracker.currentDraft';
const MIGRATION_BACKUP_STORAGE_KEY = 'personalOilfieldLoadTracker.preMigrationBackup.v2';
const FIREBASE_MIGRATION_BACKUP_STORAGE_KEY = 'personalOilfieldLoadTracker.firebaseMigrationSafetyBackup.v3';
const LEGACY_STORAGE_KEY = 'personalOilfieldLoadTrackerLog';
const LEGACY_ADD_ON_STORAGE_KEY = 'personalOilfieldDailyEarningsAddOns';
const LEGACY_EARNINGS_STORAGE_KEY = 'personalOilfieldDailyEarningsRecords';
const BACKUP_FORMAT = 'personal-oilfield-load-tracker-backup';
const CLOUD_MIGRATION_VERSION = 1;
const FIREBASE_SDK_VERSION = '10.12.5';
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC68MPQAa0nsAX-Wq2WSfO09H1kI6P4kaA",
  authDomain: "arrond-oilfield-load-tracker.firebaseapp.com",
  projectId: "arrond-oilfield-load-tracker",
  storageBucket: "arrond-oilfield-load-tracker.firebasestorage.app",
  messagingSenderId: "82334123608",
  appId: "1:82334123608:web:6c6f208d3411eef9cc6c2d"
};

function detectAppRuntime() {
  const protocol = globalThis.location?.protocol || '';
  const capacitor = globalThis.Capacitor;
  const capacitorPlatform = typeof capacitor?.getPlatform === 'function' ? capacitor.getPlatform() : '';
  const capacitorNative = typeof capacitor?.isNativePlatform === 'function' ? capacitor.isNativePlatform() : false;
  const isCapacitor = capacitorNative
    || capacitorPlatform === 'ios'
    || capacitorPlatform === 'android'
    || protocol === 'capacitor:'
    || protocol === 'ionic:';
  const isFileProtocol = protocol === 'file:';

  return {
    name: isCapacitor ? 'capacitor-ios' : (isFileProtocol ? 'local-file' : 'web'),
    isCapacitor,
    isFileProtocol,
    serviceWorkerEnabled: !isCapacitor && !isFileProtocol
  };
}

function canUseServiceWorkerRuntime() {
  return APP_RUNTIME.serviceWorkerEnabled;
}

function getNativeUpdateMessage() {
  return APP_RUNTIME.isCapacitor
    ? 'Native app updates come through the installed iOS app build.'
    : 'If update does not appear, close and reopen the app.';
}

const COMPLETED_STATUS = 'Completed Load';
const REJECT_STATUS = 'Reject';
const DEFAULT_PAY_SETTINGS = {
  rejectPay: 20,
  perDiemPay: 50,
  sleeperBerthPay: 60,
  trainerPay: 50,
  waitPayRate: 24
};
const WAIT_GRACE_MINUTES = 60;
const NO_RATE_FOUND_LABEL = 'No rate found — enter manually';

const DEFAULT_LOADED_MILES_PAY_SCALE = [
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
  're-routed-miles',
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
  're-routed-miles',
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
  reRoutedMiles: document.getElementById('re-routed-miles-error'),
  startMeterReading: document.getElementById('start-meter-reading-error'),
  endMeterReading: document.getElementById('end-meter-reading-error')
};

const daily = {
  date: document.getElementById('daily-date'),
  payPeriodStart: document.getElementById('pay-period-start'),
  payPeriodEnd: document.getElementById('pay-period-end'),
  completedLoads: document.getElementById('daily-completed-loads'),
  rejects: document.getElementById('daily-rejects'),
  grossBarrels: document.getElementById('daily-gross-barrels'),
  loadedMiles: document.getElementById('daily-loaded-miles'),
  reRoutedMiles: document.getElementById('daily-re-routed-miles'),
  totalMilesIncludingReRoute: document.getElementById('daily-total-miles-including-re-route'),
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
  trainerPay: document.getElementById('daily-trainer-pay'),
  totalEarnings: document.getElementById('daily-total-earnings')
};

const dashboard = {
  totalLoadsHauled: document.getElementById('total-loads-hauled'),
  currentWorkDate: document.getElementById('current-work-date'),
  loadsHauledPayPeriod: document.getElementById('loads-hauled-pay-period'),
  loadsHauledMonth: document.getElementById('loads-hauled-month'),
  loadsHauledSelectedDate: document.getElementById('loads-hauled-selected-date')
};

const payPeriodSummary = {
  totalEarnings: document.getElementById('pay-period-total-earnings'),
  trainerPay: document.getElementById('pay-period-trainer-pay'),
  perDiemPay: document.getElementById('pay-period-per-diem-pay'),
  sleeperPay: document.getElementById('pay-period-sleeper-pay'),
  rejectPay: document.getElementById('pay-period-reject-pay'),
  waitPay: document.getElementById('pay-period-wait-pay')
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
  regularMiles: document.getElementById('summary-regular-miles'),
  reRoutedMiles: document.getElementById('summary-re-routed-miles'),
  totalMilesIncludingReRoute: document.getElementById('summary-total-miles-including-re-route'),
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
  trainerPay: document.getElementById('trainer-pay-checkbox'),
  notes: document.getElementById('daily-earnings-notes')
};

const review = {
  dateLabel: document.getElementById('earnings-date-label'),
  date: document.getElementById('review-date'),
  completedLoads: document.getElementById('review-completed-loads'),
  rejects: document.getElementById('review-rejects'),
  loadedMiles: document.getElementById('review-loaded-miles'),
  reRoutedMiles: document.getElementById('review-re-routed-miles'),
  totalMilesIncludingReRoute: document.getElementById('review-total-miles-including-re-route'),
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
  trainerApplied: document.getElementById('review-trainer-applied'),
  trainerPay: document.getElementById('review-trainer-pay'),
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
const savedFilters = {
  search: document.getElementById('saved-search'),
  scope: document.getElementById('saved-filter-scope'),
  date: document.getElementById('saved-filter-date')
};
const profileControls = {
  driverName: document.getElementById('profile-driver-name'),
  truckNumber: document.getElementById('profile-truck-number'),
  trailerNumber: document.getElementById('profile-trailer-number'),
  saveButton: document.getElementById('save-profile-button'),
  status: document.getElementById('profile-status'),
  summary: document.getElementById('profile-summary')
};
const downloadLogButton = document.getElementById('download-log-button');
const downloadEarningsButton = document.getElementById('download-earnings-button');
const printDailyReportButton = document.getElementById('print-daily-report-button');
const exportBackupButton = document.getElementById('export-backup-button');
const importBackupFile = document.getElementById('import-backup-file');
const importMode = document.getElementById('import-mode');
const importBackupButton = document.getElementById('import-backup-button');
const backupStatus = document.getElementById('backup-status');
const checkUpdatesButton = document.getElementById('check-updates-button');
const updateNowButton = document.getElementById('update-now-button');
const updateBanner = document.getElementById('update-banner');
const updateStatus = document.getElementById('update-status');
const appVersion = document.getElementById('app-version');
const settingsAppVersion = document.getElementById('settings-app-version');
const settingsDataVersion = document.getElementById('settings-data-version');
const settingsUpdateState = document.getElementById('settings-update-state');
const settingsSyncState = document.getElementById('settings-sync-state');
const settingsMigrationState = document.getElementById('settings-migration-state');
const settingsServiceWorkerState = document.getElementById('settings-service-worker-state');
const settingsLastSync = document.getElementById('settings-last-sync');
const settingsPendingWrites = document.getElementById('settings-pending-writes');
const storageWarning = document.getElementById('storage-warning');
const saveStatus = document.getElementById('save-status');
const draftStatus = document.getElementById('draft-status');
const headerRecordCount = document.getElementById('header-record-count');
const recentLoadList = document.getElementById('recent-load-list');
const continueDraftButton = document.getElementById('continue-draft-button');
const saveNextButton = document.getElementById('save-next-button');
const saveDraftButton = document.getElementById('save-draft-button');
const entryEquipmentSummary = document.getElementById('entry-equipment-summary');
const reviewRoutePreview = document.getElementById('review-route-preview');
const appViews = typeof document.querySelectorAll === 'function'
  ? [...document.querySelectorAll('.app-view')]
  : [];
const navButtons = typeof document.querySelectorAll === 'function'
  ? [...document.querySelectorAll('[data-view-target]')]
  : [];
const extraSavedFilters = {
  pickup: document.getElementById('saved-pickup-filter'),
  dropoff: document.getElementById('saved-dropoff-filter'),
  ticket: document.getElementById('saved-ticket-filter'),
  sort: document.getElementById('saved-sort-order')
};
const reportControls = {
  mode: document.getElementById('report-range-mode'),
  start: document.getElementById('report-start-date'),
  end: document.getElementById('report-end-date'),
  summaryGrid: document.getElementById('report-summary-grid')
};
const paySettingsControls = {
  waitRate: document.getElementById('settings-wait-rate'),
  perDiemRate: document.getElementById('settings-per-diem-rate'),
  sleeperRate: document.getElementById('settings-sleeper-rate'),
  rejectRate: document.getElementById('settings-reject-rate'),
  trainerRate: document.getElementById('settings-trainer-rate'),
  loadedMilesEditor: document.getElementById('loaded-mile-pay-editor'),
  saveButton: document.getElementById('save-pay-settings-button'),
  status: document.getElementById('pay-settings-status'),
  labels: {
    perDiem: document.getElementById('per-diem-rate-label'),
    sleeper: document.getElementById('sleeper-rate-label'),
    trainer: document.getElementById('trainer-rate-label'),
    reject: document.getElementById('reject-rate-label')
  }
};
const favoriteRouteControls = {
  select: document.getElementById('route-preset-select'),
  name: document.getElementById('favorite-route-name'),
  pickup: document.getElementById('favorite-pickup-location'),
  dropoff: document.getElementById('favorite-dropoff-location'),
  mileage: document.getElementById('favorite-route-mileage'),
  product: document.getElementById('favorite-product-type'),
  saveButton: document.getElementById('save-favorite-route-button'),
  list: document.getElementById('favorite-route-list'),
  status: document.getElementById('favorite-route-status')
};
const manualSyncButton = document.getElementById('manual-sync-button');
const authControls = {
  form: document.getElementById('auth-form'),
  email: document.getElementById('auth-email'),
  password: document.getElementById('auth-password'),
  signInButton: document.getElementById('sign-in-button'),
  signOutButton: document.getElementById('sign-out-button'),
  authStatus: document.getElementById('auth-status'),
  authError: document.getElementById('auth-error'),
  signedInEmail: document.getElementById('signed-in-email'),
  syncStatus: document.getElementById('sync-status'),
  cloudLoadCount: document.getElementById('cloud-load-count'),
  localLoadCount: document.getElementById('local-load-count'),
  migrationPanel: document.getElementById('migration-panel'),
  migrationSummary: document.getElementById('migration-summary'),
  migrationStatus: document.getElementById('migration-status'),
  downloadBeforeMigrationButton: document.getElementById('download-before-migration-button'),
  startMigrationButton: document.getElementById('start-migration-button')
};

const storageWarnings = [];
const storageAudit = {
  recordsBeforeMigration: 0,
  recordsAfterMigration: 0,
  missingIdsAdded: 0,
  duplicateIdsRepaired: 0,
  migrationBackupCreated: false
};
let savedLoads = loadSavedLoads();
let dailyAddOns = loadDailyAddOns();
let dailyEarningsRecords = loadDailySummaries();
let driverProfile = loadDriverProfile();
let appMeta = loadAppMeta();
let appSettings = loadAppSettings();
let favoriteRoutes = loadFavoriteRoutes();
let localStartupSnapshot = cloneTrackerState({
  loads: savedLoads,
  dailyAddOns,
  dailySummaries: dailyEarningsRecords,
  profile: driverProfile,
  metadata: appMeta,
  settings: appSettings,
  favoriteRoutes
});
let editingLoadId = null;
let pendingDuplicateRecord = null;
let pendingCommitMode = 'save';
let isSaving = false;
let draftSaveTimer = null;
let waitingServiceWorker = null;
let firebaseStartupInProgress = false;
const cloudSync = {
  enabled: false,
  app: null,
  auth: null,
  db: null,
  sdk: null,
  user: null,
  authReady: false,
  unsubscribe: [],
  pendingWrites: 0,
  lastError: '',
  applyingCloudState: false,
  source: 'local',
  state: createEmptyCloudState()
};

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

  if (settingsUpdateState && message) {
    settingsUpdateState.textContent = message;
  }
}

function setBackupStatus(message, isError = false) {
  if (!backupStatus) {
    return;
  }

  backupStatus.textContent = message;
  backupStatus.classList.toggle('error', Boolean(isError));
}

function setProfileStatus(message, isError = false) {
  if (!profileControls.status) {
    return;
  }

  profileControls.status.textContent = message;
  profileControls.status.className = `save-status show${isError ? ' error' : ''}`;
}

function clearProfileStatus() {
  if (!profileControls.status) {
    return;
  }

  profileControls.status.textContent = '';
  profileControls.status.className = 'save-status';
}

function deepClone(value) {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return null;
  }
}

function cloneTrackerState(state) {
  return {
    loads: deepClone(state.loads || []) || [],
    dailyAddOns: deepClone(state.dailyAddOns || {}) || {},
    dailySummaries: deepClone(state.dailySummaries || {}) || {},
    profile: deepClone(state.profile || {}) || {},
    metadata: deepClone(state.metadata || {}) || {},
    settings: deepClone(state.settings || {}) || {},
    favoriteRoutes: deepClone(state.favoriteRoutes || []) || []
  };
}

function createEmptyCloudState() {
  return {
    loads: [],
    dailyAddOns: {},
    dailySummaries: {},
    profile: null,
    settings: null,
    migration: null,
    loaded: {
      loads: false,
      dailyAddOns: false,
      dailySummaries: false,
      profile: false,
      settings: false,
      migration: false
    },
    hasPendingWrites: false,
    fromCache: false,
    lastSnapshotAt: null
  };
}

function setElementText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function setAuthError(message, isError = false) {
  if (!authControls.authError) {
    return;
  }

  authControls.authError.textContent = message;
  authControls.authError.classList.toggle('error', Boolean(isError));
}

function setMigrationStatus(message, isError = false) {
  if (!authControls.migrationStatus) {
    return;
  }

  authControls.migrationStatus.textContent = message;
  authControls.migrationStatus.classList.toggle('error', Boolean(isError));
}

function setSyncStatus(message, state = '') {
  setElementText(authControls.syncStatus, message);

  if (authControls.syncStatus) {
    authControls.syncStatus.className = `status-pill sync-pill${state ? ` ${state}` : ''}`;
  }

  if (settingsSyncState) {
    settingsSyncState.textContent = message;
  }
}

function isBrowserOnline() {
  return !globalThis.navigator || globalThis.navigator.onLine !== false;
}

function isCloudSignedIn() {
  return Boolean(cloudSync.enabled && cloudSync.user && cloudSync.db && cloudSync.sdk);
}

function isCloudReady() {
  if (!isCloudSignedIn()) {
    return false;
  }

  return Object.values(cloudSync.state.loaded).every(Boolean);
}

function isCloudMigrationComplete() {
  const migrationVersion = Number(cloudSync.state.migration?.migrationVersion || 0);
  return migrationVersion >= CLOUD_MIGRATION_VERSION || cloudSync.state.settings?.cloudAuthoritative === true;
}

function getLocalSafetyLoadCount() {
  return countUniqueLoads(localStartupSnapshot.loads || []);
}

function updateSyncStatusFromState() {
  if (!cloudSync.enabled) {
    setSyncStatus('Local only');
    return;
  }

  if (!cloudSync.authReady) {
    setSyncStatus('Connecting');
    return;
  }

  if (!cloudSync.user) {
    setSyncStatus('Local only');
    return;
  }

  if (cloudSync.lastError) {
    setSyncStatus('Sync error', 'error');
    return;
  }

  if (!isBrowserOnline()) {
    setSyncStatus('Offline', 'offline');
    return;
  }

  if (cloudSync.pendingWrites > 0 || cloudSync.state.hasPendingWrites) {
    setSyncStatus('Syncing', 'pending');
    return;
  }

  if (!isCloudReady()) {
    setSyncStatus('Connecting');
    return;
  }

  if (cloudSync.state.fromCache) {
    setSyncStatus('Offline', 'offline');
    return;
  }

  setSyncStatus('Synced');
}

function updateAuthUi() {
  const signedIn = Boolean(cloudSync.user);
  setElementText(authControls.authStatus, signedIn ? 'Signed in' : (cloudSync.authReady ? 'Not signed in' : 'Checking sign-in...'));
  setElementText(authControls.signedInEmail, signedIn ? (cloudSync.user.email || 'Signed in') : 'Not signed in');
  setElementText(authControls.cloudLoadCount, String(cloudSync.state.loads.length));
  setElementText(authControls.localLoadCount, String(getLocalSafetyLoadCount()));
  setElementText(settingsPendingWrites, String(cloudSync.pendingWrites));
  setElementText(settingsLastSync, appMeta.cloudSync?.lastSyncedAt || cloudSync.state.lastSnapshotAt || 'Not yet synced');
  setElementText(settingsMigrationState, isCloudMigrationComplete() ? 'Complete' : 'Ready');

  if (authControls.email) {
    authControls.email.disabled = signedIn;
  }

  if (authControls.password) {
    authControls.password.disabled = signedIn;
  }

  if (authControls.signInButton) {
    authControls.signInButton.hidden = signedIn;
    authControls.signInButton.disabled = !isBrowserOnline() || (!cloudSync.enabled && !cloudSync.authReady);
    authControls.signInButton.textContent = cloudSync.enabled ? 'Sign In' : (cloudSync.authReady ? 'Reconnect and Sign In' : 'Connecting...');
  }

  if (authControls.signOutButton) {
    authControls.signOutButton.hidden = !signedIn;
  }

  updateMigrationPanel();
  updateSyncStatusFromState();
}

function getLoadComparableTime(load) {
  const value = load?.updatedAt || load?.savedAt || load?.createdAt || '';
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function normalizeFingerprintValue(value) {
  return String(value ?? '').trim().toLowerCase();
}

function buildLoadFingerprint(load) {
  const source = {
    id: normalizeFingerprintValue(load.id),
    loadDate: normalizeFingerprintValue(load.loadDate),
    ticketNumber: normalizeFingerprintValue(load.ticketNumber),
    bolNumber: normalizeFingerprintValue(load.bolNumber),
    loadNumber: normalizeFingerprintValue(load.loadNumber),
    pickupLocation: normalizeFingerprintValue(load.pickupLocation),
    dropoffLocation: normalizeFingerprintValue(load.dropoffLocation),
    driverName: normalizeFingerprintValue(load.driverName),
    truckNumber: normalizeFingerprintValue(load.truckNumber),
    trailerNumber: normalizeFingerprintValue(load.trailerNumber),
    savedAt: normalizeFingerprintValue(load.savedAt),
    grossBarrels: normalizeFingerprintValue(load.grossBarrels),
    loadedMiles: normalizeFingerprintValue(load.loadedMiles)
  };

  return `load-${hashString(JSON.stringify(source))}`;
}

function toCloudDocumentId(value) {
  const text = String(value || '').trim();
  const safeText = text ? encodeURIComponent(text).replaceAll('.', '%2E') : `missing-${Date.now()}`;
  return safeText.length <= 1200 ? safeText : `long-${hashString(safeText)}`;
}

function timestampToIso(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  return value;
}

function normalizeCloudData(value) {
  const converted = timestampToIso(value);

  if (Array.isArray(converted)) {
    return converted.map(normalizeCloudData);
  }

  if (converted && typeof converted === 'object' && typeof converted.toDate !== 'function') {
    return Object.fromEntries(
      Object.entries(converted)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, normalizeCloudData(entryValue)])
    );
  }

  return converted;
}

function sanitizeForFirestore(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeForFirestore).filter((entry) => entry !== undefined);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined && typeof entryValue !== 'function')
        .map(([key, entryValue]) => [key, sanitizeForFirestore(entryValue)])
        .filter(([, entryValue]) => entryValue !== undefined)
    );
  }

  return value === undefined ? null : value;
}

function getCloudDuplicateMaps() {
  const byId = new Map();
  const byFingerprint = new Map();

  cloudSync.state.loads.forEach((load) => {
    if (load.id) {
      byId.set(String(load.id), load);
    }

    byFingerprint.set(load.migrationFingerprint || buildLoadFingerprint(load), load);
  });

  return { byId, byFingerprint };
}

function getMigrationPreview(localLoads = localStartupSnapshot.loads || []) {
  const { byId, byFingerprint } = getCloudDuplicateMaps();
  let uploadCount = 0;
  let skippedCount = 0;
  let newerCloudCount = 0;

  getUniqueSavedLoads(localLoads).forEach((load) => {
    const cloudById = byId.get(String(load.id));
    const cloudByFingerprint = byFingerprint.get(buildLoadFingerprint(load));

    if (cloudById) {
      if (getLoadComparableTime(load) > getLoadComparableTime(cloudById)) {
        uploadCount += 1;
      } else {
        skippedCount += 1;
        newerCloudCount += getLoadComparableTime(cloudById) > getLoadComparableTime(load) ? 1 : 0;
      }
      return;
    }

    if (cloudByFingerprint) {
      skippedCount += 1;
      return;
    }

    uploadCount += 1;
  });

  return {
    examinedCount: countUniqueLoads(localLoads),
    cloudCount: cloudSync.state.loads.length,
    uploadCount,
    skippedCount,
    newerCloudCount
  };
}

function updateMigrationPanel() {
  if (!authControls.migrationPanel) {
    return;
  }

  const localCount = getLocalSafetyLoadCount();
  const ready = isCloudReady();
  const shouldShow = Boolean(cloudSync.user && ready && localCount > 0 && !isCloudMigrationComplete());

  authControls.migrationPanel.hidden = !shouldShow;

  if (!shouldShow) {
    return;
  }

  const preview = getMigrationPreview();
  setElementText(
    authControls.migrationSummary,
    `Found ${preview.examinedCount} local load ${preview.examinedCount === 1 ? 'record' : 'records'} and ${preview.cloudCount} cloud load ${preview.cloudCount === 1 ? 'record' : 'records'}. Migration will upload ${preview.uploadCount} not already in Firebase and skip ${preview.skippedCount} duplicate or newer cloud ${preview.skippedCount === 1 ? 'record' : 'records'}. Local browser records stay in place.`
  );

  if (authControls.startMigrationButton) {
    authControls.startMigrationButton.disabled = preview.examinedCount === 0;
  }
}

function canStartFirebase() {
  return Boolean(globalThis.location && authControls.form);
}

function withTimeout(promise, timeoutMs, timeoutMessage) {
  if (typeof globalThis.setTimeout !== 'function') {
    return promise;
  }

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = globalThis.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId && typeof globalThis.clearTimeout === 'function') {
      globalThis.clearTimeout(timeoutId);
    }
  });
}

async function loadFirebaseModules() {
  const baseUrl = `https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}`;
  const [appModule, authModule, firestoreModule] = await Promise.all([
    import(`${baseUrl}/firebase-app.js`),
    import(`${baseUrl}/firebase-auth.js`),
    import(`${baseUrl}/firebase-firestore.js`)
  ]);

  return {
    initializeApp: appModule.initializeApp,
    getApp: appModule.getApp,
    getApps: appModule.getApps,
    initializeAuth: authModule.initializeAuth,
    getAuth: authModule.getAuth,
    signInWithEmailAndPassword: authModule.signInWithEmailAndPassword,
    signOut: authModule.signOut,
    onAuthStateChanged: authModule.onAuthStateChanged,
    setPersistence: authModule.setPersistence,
    browserLocalPersistence: authModule.browserLocalPersistence,
    indexedDBLocalPersistence: authModule.indexedDBLocalPersistence,
    inMemoryPersistence: authModule.inMemoryPersistence,
    getFirestore: firestoreModule.getFirestore,
    enableIndexedDbPersistence: firestoreModule.enableIndexedDbPersistence,
    collection: firestoreModule.collection,
    doc: firestoreModule.doc,
    setDoc: firestoreModule.setDoc,
    deleteDoc: firestoreModule.deleteDoc,
    getDocs: firestoreModule.getDocs,
    writeBatch: firestoreModule.writeBatch,
    onSnapshot: firestoreModule.onSnapshot,
    serverTimestamp: firestoreModule.serverTimestamp
  };
}

function getCapacitorAuthPersistence() {
  return [
    cloudSync.sdk.indexedDBLocalPersistence,
    cloudSync.sdk.browserLocalPersistence,
    cloudSync.sdk.inMemoryPersistence
  ].filter(Boolean);
}

async function initializeFirebaseSync() {
  if (firebaseStartupInProgress) {
    return;
  }

  firebaseStartupInProgress = true;

  if (!canStartFirebase()) {
    cloudSync.authReady = true;
    updateAuthUi();
    firebaseStartupInProgress = false;
    return;
  }

  setSyncStatus('Connecting');

  try {
    cloudSync.sdk = await withTimeout(
      loadFirebaseModules(),
      APP_RUNTIME.isCapacitor ? 20000 : 45000,
      'Firebase SDK load timed out.'
    );
    cloudSync.app = cloudSync.sdk.getApps?.().length
      ? cloudSync.sdk.getApp()
      : cloudSync.sdk.initializeApp(FIREBASE_CONFIG);
    cloudSync.auth = APP_RUNTIME.isCapacitor && cloudSync.sdk.initializeAuth
      ? cloudSync.sdk.initializeAuth(cloudSync.app, { persistence: getCapacitorAuthPersistence() })
      : cloudSync.sdk.getAuth(cloudSync.app);
    cloudSync.db = cloudSync.sdk.getFirestore(cloudSync.app);
    cloudSync.enabled = true;

    if (!APP_RUNTIME.isCapacitor) {
      await cloudSync.sdk.setPersistence(cloudSync.auth, cloudSync.sdk.browserLocalPersistence).catch(() => {
        setAuthError('Sign-in can still work, but this browser may not remember the session as reliably.', true);
      });
    }

    await cloudSync.sdk.enableIndexedDbPersistence(cloudSync.db).catch(() => {
      setAuthError('Offline cloud caching is limited in this browser. Local records are still protected.');
    });

    const authReadyFallbackTimer = startAuthReadyFallbackTimer();

    cloudSync.sdk.onAuthStateChanged(
      cloudSync.auth,
      (user) => {
        clearAuthReadyFallbackTimer(authReadyFallbackTimer);
        handleFirebaseUser(user);
      },
      () => {
        clearAuthReadyFallbackTimer(authReadyFallbackTimer);
        handleFirebaseAuthError();
      }
    );

    globalThis.addEventListener?.('online', updateSyncStatusFromState);
    globalThis.addEventListener?.('offline', updateSyncStatusFromState);
  } catch (error) {
    cloudSync.enabled = false;
    cloudSync.authReady = true;
    cloudSync.lastError = 'Firebase sync could not start.';
    const startupMessage = String(error?.message || '').includes('timed out')
      ? 'Firebase files did not load in time. Check the device internet connection, then run the app again.'
      : 'Cloud login could not start. Local records are still available. Check your connection, then tap Reconnect and Sign In.';
    setAuthError(startupMessage, true);
    updateAuthUi();
  } finally {
    firebaseStartupInProgress = false;
  }
}

function stopCloudListeners() {
  cloudSync.unsubscribe.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch {
      // Listener cleanup is best effort.
    }
  });

  cloudSync.unsubscribe = [];
}

function cloudUserPath(...segments) {
  return ['users', cloudSync.user.uid, ...segments];
}

function cloudCollection(...segments) {
  return cloudSync.sdk.collection(cloudSync.db, ...cloudUserPath(...segments));
}

function cloudDocument(...segments) {
  return cloudSync.sdk.doc(cloudSync.db, ...cloudUserPath(...segments));
}

function normalizeCloudLoadDocument(documentSnapshot) {
  const data = normalizeCloudData(documentSnapshot.data() || {});
  return normalizeSavedLoad({
    ...data,
    id: data.id || data.loadId || decodeURIComponent(String(documentSnapshot.id || ''))
  });
}

function normalizeCloudDateMap(snapshot, normalizer) {
  const records = {};

  snapshot.docs.forEach((documentSnapshot) => {
    const data = normalizeCloudData(documentSnapshot.data() || {});
    const key = data.date || decodeURIComponent(String(documentSnapshot.id || ''));

    if (key) {
      records[key] = normalizer({ ...data, date: key });
    }
  });

  return records;
}

function updateCloudSnapshotMetadata(snapshot) {
  cloudSync.state.hasPendingWrites = Boolean(snapshot.metadata?.hasPendingWrites);
  cloudSync.state.fromCache = Boolean(snapshot.metadata?.fromCache);
  cloudSync.state.lastSnapshotAt = new Date().toISOString();
}

function handleCloudSnapshotChange(snapshot) {
  updateCloudSnapshotMetadata(snapshot);
  cloudSync.lastError = '';
  handleCloudStateChanged();
}

function handleCloudListenerError() {
  cloudSync.lastError = 'Cloud sync error.';
  setAuthError('Cloud sync had a problem. Local records were not changed.', true);
  updateAuthUi();
}

function listenToCloudCollection(name, collectionName, mapper) {
  const unsubscribe = cloudSync.sdk.onSnapshot(
    cloudCollection(collectionName),
    { includeMetadataChanges: true },
    (snapshot) => {
      cloudSync.state[name] = mapper(snapshot);
      cloudSync.state.loaded[name] = true;
      handleCloudSnapshotChange(snapshot);
    },
    handleCloudListenerError
  );

  cloudSync.unsubscribe.push(unsubscribe);
}

function listenToCloudDocument(name, collectionName, documentName) {
  const unsubscribe = cloudSync.sdk.onSnapshot(
    cloudDocument(collectionName, documentName),
    { includeMetadataChanges: true },
    (snapshot) => {
      cloudSync.state[name] = snapshot.exists() ? normalizeCloudData(snapshot.data()) : null;
      cloudSync.state.loaded[name] = true;
      handleCloudSnapshotChange(snapshot);
    },
    handleCloudListenerError
  );

  cloudSync.unsubscribe.push(unsubscribe);
}

function startCloudListeners() {
  stopCloudListeners();
  cloudSync.state = createEmptyCloudState();
  setAuthError('');
  setMigrationStatus('');
  updateAuthUi();

  listenToCloudCollection('loads', 'loads', (snapshot) => (
    snapshot.docs.map(normalizeCloudLoadDocument).sort((left, right) => (
      String(right.loadDate || '').localeCompare(String(left.loadDate || ''))
      || String(right.savedAt || '').localeCompare(String(left.savedAt || ''))
    ))
  ));
  listenToCloudCollection('dailyAddOns', 'dailyAddOns', (snapshot) => normalizeCloudDateMap(snapshot, (item) => normalizeDailyAddOns({ [item.date]: item })[item.date]));
  listenToCloudCollection('dailySummaries', 'dailySummaries', (snapshot) => normalizeCloudDateMap(snapshot, (item) => item));
  listenToCloudDocument('profile', 'profile', 'current');
  listenToCloudDocument('settings', 'settings', 'app');
  listenToCloudDocument('migration', 'metadata', 'migration');
}

function handleFirebaseUser(user) {
  cloudSync.authReady = true;
  cloudSync.user = user || null;
  cloudSync.lastError = '';
  setAuthError('');

  if (!user) {
    stopCloudListeners();
    cloudSync.state = createEmptyCloudState();
    cloudSync.source = 'local';
    restoreLocalSafetySnapshot();
    updateAuthUi();
    return;
  }

  startCloudListeners();
  updateAuthUi();
}

function handleFirebaseAuthError() {
  cloudSync.authReady = true;
  cloudSync.lastError = 'Authentication error.';
  setAuthError('Sign-in could not be checked. Local records are still available.', true);
  updateAuthUi();
}

function shouldApplyCloudState() {
  if (!isCloudReady()) {
    return false;
  }

  if (isCloudMigrationComplete()) {
    return true;
  }

  if (getLocalSafetyLoadCount() === 0) {
    return true;
  }

  return appMeta.cloudSync?.authoritative === true && appMeta.cloudSync?.uid === cloudSync.user.uid;
}

function persistCurrentStateToLocalFallback() {
  storeJson(STORAGE_KEY, savedLoads, 'load log');
  storeJson(ADD_ON_STORAGE_KEY, dailyAddOns, 'daily add-ons');
  storeJson(EARNINGS_STORAGE_KEY, dailyEarningsRecords, 'daily summaries');
  storeJson(PROFILE_STORAGE_KEY, driverProfile, 'driver profile');
  storeJson(SETTINGS_STORAGE_KEY, appSettings, 'application settings');
  storeJson(FAVORITE_ROUTES_STORAGE_KEY, favoriteRoutes, 'favorite routes');
  saveAppMeta();
}

function applyCloudStateToApp() {
  if (cloudSync.applyingCloudState) {
    return;
  }

  cloudSync.applyingCloudState = true;

  savedLoads = cloudSync.state.loads.map(normalizeSavedLoad);
  dailyAddOns = normalizeDailyAddOns(cloudSync.state.dailyAddOns);
  dailyEarningsRecords = isPlainObject(cloudSync.state.dailySummaries) ? cloudSync.state.dailySummaries : {};
  driverProfile = normalizeDriverProfile(cloudSync.state.profile || {});
  const cloudSettings = isPlainObject(cloudSync.state.settings) ? cloudSync.state.settings : {};
  appSettings = normalizeAppSettings(cloudSettings.appSettings || cloudSettings);
  favoriteRoutes = normalizeFavoriteRoutes(cloudSettings.favoriteRoutes || favoriteRoutes);
  appMeta = {
    ...appMeta,
    ...cloudSettings,
    cloudSync: {
      authoritative: true,
      uid: cloudSync.user.uid,
      email: cloudSync.user.email || '',
      lastSyncedAt: new Date().toISOString()
    }
  };

  refreshAllDailyEarningsRecords();
  applyProfileToControls();
  applyDailyAddOnsToControls();
  renderFavoriteRoutes();
  applyPaySettingsToControls();
  renderSummary();
  updateDailySummary();
  persistCurrentStateToLocalFallback();
  cloudSync.source = 'cloud';
  cloudSync.applyingCloudState = false;
}

function restoreLocalSafetySnapshot() {
  savedLoads = (localStartupSnapshot.loads || []).map(normalizeSavedLoad);
  dailyAddOns = normalizeDailyAddOns(localStartupSnapshot.dailyAddOns || {});
  dailyEarningsRecords = isPlainObject(localStartupSnapshot.dailySummaries) ? localStartupSnapshot.dailySummaries : {};
  driverProfile = normalizeDriverProfile(localStartupSnapshot.profile || {});
  appMeta = isPlainObject(localStartupSnapshot.metadata) ? localStartupSnapshot.metadata : {};
  appSettings = normalizeAppSettings(localStartupSnapshot.settings || {});
  favoriteRoutes = normalizeFavoriteRoutes(localStartupSnapshot.favoriteRoutes || []);

  refreshAllDailyEarningsRecords();
  applyProfileToControls();
  applyDailyAddOnsToControls();
  renderFavoriteRoutes();
  applyPaySettingsToControls();
  renderSummary();
  updateDailySummary();
}

function handleCloudStateChanged() {
  if (shouldApplyCloudState()) {
    applyCloudStateToApp();
  }

  updateAuthUi();
}

function getFriendlyAuthError(error) {
  const code = error?.code || '';

  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Email or password did not match.';
  }

  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Wait a bit and try again.';
  }

  if (code.includes('network')) {
    return 'Could not reach Firebase. Check the connection and try again.';
  }

  return 'Sign-in failed. Check the email and password, then try again.';
}

function startAuthReadyFallbackTimer() {
  if (!APP_RUNTIME.isCapacitor || typeof globalThis.setTimeout !== 'function') {
    return null;
  }

  return globalThis.setTimeout(() => {
    if (cloudSync.authReady) {
      return;
    }

    cloudSync.authReady = true;
    cloudSync.lastError = '';
    setAuthError('Firebase is taking longer than expected. You can still try signing in.');
    updateAuthUi();
  }, 12000);
}

function clearAuthReadyFallbackTimer(timerId) {
  if (timerId && typeof globalThis.clearTimeout === 'function') {
    globalThis.clearTimeout(timerId);
  }
}

async function handleSignIn(event) {
  event.preventDefault();

  if (!cloudSync.enabled || !cloudSync.auth) {
    setAuthError('Reconnecting to cloud login...');
    await initializeFirebaseSync();

    if (!cloudSync.enabled || !cloudSync.auth) {
      setAuthError('Cloud login is still not ready. Local records are safe on this device. Check your connection, then try again.', true);
      return;
    }
  }

  const email = authControls.email?.value.trim() || '';
  const password = authControls.password?.value || '';

  if (!email || !password) {
    setAuthError('Enter the Firebase email and password.', true);
    return;
  }

  setAuthError('Signing in...');

  if (authControls.signInButton) {
    authControls.signInButton.disabled = true;
  }

  try {
    const credential = await withTimeout(
      cloudSync.sdk.signInWithEmailAndPassword(cloudSync.auth, email, password),
      APP_RUNTIME.isCapacitor ? 20000 : 30000,
      'Firebase sign-in timed out.'
    );

    if (authControls.password) {
      authControls.password.value = '';
    }

    if (credential?.user && !cloudSync.user) {
      handleFirebaseUser(credential.user);
    }

    setAuthError('Signed in. Checking cloud records...');
  } catch (error) {
    const message = String(error?.message || '').includes('timed out')
      ? 'Firebase sign-in did not answer. Check the simulator internet connection, then try again.'
      : getFriendlyAuthError(error);
    setAuthError(message, true);
  } finally {
    if (authControls.signInButton) {
      authControls.signInButton.disabled = false;
    }
  }
}

async function handleSignOut() {
  if (!cloudSync.enabled || !cloudSync.auth) {
    return;
  }

  setAuthError('Signing out...');

  try {
    await cloudSync.sdk.signOut(cloudSync.auth);
    setAuthError('Signed out. Cloud records are hidden on this device.');
  } catch {
    setAuthError('Sign out failed. Try again when the connection is available.', true);
  }
}

function buildCloudLoadPayload(record) {
  const normalized = normalizeSavedLoad(record);
  const now = new Date().toISOString();

  return sanitizeForFirestore({
    ...normalized,
    id: normalized.id,
    createdAt: normalized.createdAt || normalized.savedAt || now,
    updatedAt: normalized.updatedAt || now,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    migrationFingerprint: buildLoadFingerprint(normalized),
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

function buildCloudAddOnPayload(date) {
  return sanitizeForFirestore({
    ...getDailyAddOn(date),
    date,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

function buildCloudSummaryPayload(date) {
  return sanitizeForFirestore({
    ...getDailyEarningsSummary(date),
    date,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

function buildCloudProfilePayload() {
  return sanitizeForFirestore({
    ...driverProfile,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: driverProfile.updatedAt || new Date().toISOString(),
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

function buildCloudSettingsPayload(extra = {}) {
  return sanitizeForFirestore({
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    storageKeys: {
      loads: STORAGE_KEY,
      dailyAddOns: ADD_ON_STORAGE_KEY,
      dailySummaries: EARNINGS_STORAGE_KEY,
      profile: PROFILE_STORAGE_KEY,
      metadata: META_STORAGE_KEY,
      settings: SETTINGS_STORAGE_KEY,
      favoriteRoutes: FAVORITE_ROUTES_STORAGE_KEY
    },
    appSettings,
    payRates: appSettings.payRates,
    loadedMilesPayScale: appSettings.loadedMilesPayScale,
    favoriteRoutes,
    cloudAuthoritative: isCloudMigrationComplete() || appMeta.cloudSync?.authoritative === true,
    updatedAt: new Date().toISOString(),
    ...extra,
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

function queueCloudWrite(writeOperation, failureMessage = 'Cloud sync is pending.') {
  if (!isCloudSignedIn() || cloudSync.applyingCloudState) {
    return;
  }

  cloudSync.pendingWrites += 1;
  updateSyncStatusFromState();

  Promise.resolve()
    .then(writeOperation)
    .then(() => {
      cloudSync.lastError = '';
    })
    .catch(() => {
      cloudSync.lastError = failureMessage;
      setAuthError(`${failureMessage} Local records were still saved on this device.`, true);
    })
    .finally(() => {
      cloudSync.pendingWrites = Math.max(0, cloudSync.pendingWrites - 1);
      updateAuthUi();
    });
}

function syncLoadToCloud(record) {
  if (!isCloudSignedIn()) {
    return;
  }

  queueCloudWrite(() => cloudSync.sdk.setDoc(
    cloudDocument('loads', toCloudDocumentId(record.id)),
    buildCloudLoadPayload(record),
    { merge: true }
  ), 'Load could not be synced to Firebase yet.');
}

function deleteCloudLoad(loadId) {
  if (!isCloudSignedIn()) {
    return;
  }

  queueCloudWrite(() => cloudSync.sdk.deleteDoc(
    cloudDocument('loads', toCloudDocumentId(loadId))
  ), 'Deleted load could not be synced to Firebase yet.');
}

function syncDailyAddOnToCloud(date) {
  if (!isCloudSignedIn() || !date) {
    return;
  }

  queueCloudWrite(() => {
    const addOn = dailyAddOns[date];
    const ref = cloudDocument('dailyAddOns', toCloudDocumentId(date));

    if (!addOn || (!addOn.perDiem && !addOn.sleeperBerth && !addOn.trainerPay && !addOn.notes)) {
      return cloudSync.sdk.deleteDoc(ref);
    }

    return cloudSync.sdk.setDoc(ref, buildCloudAddOnPayload(date), { merge: true });
  }, 'Daily add-ons could not be synced to Firebase yet.');
}

function syncDailySummaryToCloud(date) {
  if (!isCloudSignedIn() || !date) {
    return;
  }

  queueCloudWrite(() => cloudSync.sdk.setDoc(
    cloudDocument('dailySummaries', toCloudDocumentId(date)),
    buildCloudSummaryPayload(date),
    { merge: true }
  ), 'Daily totals could not be synced to Firebase yet.');
}

function syncProfileToCloud() {
  if (!isCloudSignedIn()) {
    return;
  }

  queueCloudWrite(() => cloudSync.sdk.setDoc(
    cloudDocument('profile', 'current'),
    buildCloudProfilePayload(),
    { merge: true }
  ), 'Profile could not be synced to Firebase yet.');
}

function syncSettingsToCloud(extra = {}) {
  if (!isCloudSignedIn()) {
    return;
  }

  queueCloudWrite(() => cloudSync.sdk.setDoc(
    cloudDocument('settings', 'app'),
    buildCloudSettingsPayload(extra),
    { merge: true }
  ), 'Settings could not be synced to Firebase yet.');
}

function syncCurrentDateToCloud(date) {
  if (!isCloudSignedIn() || !date) {
    return;
  }

  syncDailyAddOnToCloud(date);
  syncDailySummaryToCloud(date);
}

function syncImportedStateToCloud(nextState, mode) {
  if (!isCloudSignedIn()) {
    return;
  }

  queueCloudWrite(async () => {
    const batch = cloudSync.sdk.writeBatch(cloudSync.db);
    const nextLoadIds = new Set(nextState.loads.map((load) => String(load.id)));
    const nextAddOnDates = new Set(Object.keys(nextState.dailyAddOns || {}));
    const nextSummaryDates = new Set(Object.keys(nextState.dailySummaries || {}));

    nextState.loads.forEach((load) => {
      batch.set(cloudDocument('loads', toCloudDocumentId(load.id)), buildCloudLoadPayload(load), { merge: true });
    });

    Object.keys(nextState.dailyAddOns || {}).forEach((date) => {
      batch.set(cloudDocument('dailyAddOns', toCloudDocumentId(date)), sanitizeForFirestore({
        ...nextState.dailyAddOns[date],
        date,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    });

    Object.keys(nextState.dailySummaries || {}).forEach((date) => {
      batch.set(cloudDocument('dailySummaries', toCloudDocumentId(date)), sanitizeForFirestore({
        ...nextState.dailySummaries[date],
        date,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    });

    batch.set(cloudDocument('profile', 'current'), sanitizeForFirestore({
      ...nextState.profile,
      cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
    }), { merge: true });
    batch.set(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
      lastImport: nextState.metadata?.lastImport || { importedAt: new Date().toISOString(), importMode: mode }
    }), { merge: true });

    if (mode === 'replace') {
      cloudSync.state.loads.forEach((load) => {
        if (!nextLoadIds.has(String(load.id))) {
          batch.delete(cloudDocument('loads', toCloudDocumentId(load.id)));
        }
      });

      Object.keys(cloudSync.state.dailyAddOns || {}).forEach((date) => {
        if (!nextAddOnDates.has(date)) {
          batch.delete(cloudDocument('dailyAddOns', toCloudDocumentId(date)));
        }
      });

      Object.keys(cloudSync.state.dailySummaries || {}).forEach((date) => {
        if (!nextSummaryDates.has(date)) {
          batch.delete(cloudDocument('dailySummaries', toCloudDocumentId(date)));
        }
      });
    }

    await batch.commit();
  }, 'Imported data could not be synced to Firebase yet.');
}

function syncAllCurrentDataToCloud() {
  if (!isCloudSignedIn()) {
    setAuthError('Sign in before syncing to Firebase.', true);
    return;
  }

  queueCloudWrite(async () => {
    refreshAllDailyEarningsRecords();
    const batch = cloudSync.sdk.writeBatch(cloudSync.db);

    getUniqueSavedLoads(savedLoads).forEach((load) => {
      batch.set(cloudDocument('loads', toCloudDocumentId(load.id)), buildCloudLoadPayload(load), { merge: true });
    });

    Object.keys(dailyAddOns || {}).forEach((date) => {
      batch.set(cloudDocument('dailyAddOns', toCloudDocumentId(date)), buildCloudAddOnPayload(date), { merge: true });
    });

    Object.keys(dailyEarningsRecords || {}).forEach((date) => {
      batch.set(cloudDocument('dailySummaries', toCloudDocumentId(date)), buildCloudSummaryPayload(date), { merge: true });
    });

    batch.set(cloudDocument('profile', 'current'), buildCloudProfilePayload(), { merge: true });
    batch.set(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
      manualSyncAt: new Date().toISOString()
    }), { merge: true });

    await batch.commit();
    appMeta = {
      ...appMeta,
      cloudSync: {
        ...(appMeta.cloudSync || {}),
        authoritative: true,
        uid: cloudSync.user.uid,
        email: cloudSync.user.email || '',
        lastSyncedAt: new Date().toISOString()
      }
    };
    saveAppMeta();
    setAuthError('Sync complete.');
  }, 'Manual sync could not finish yet.');
}

function getLocalMigrationState() {
  const startupHasLoads = countUniqueLoads(localStartupSnapshot.loads || []) > 0;

  return cloneTrackerState({
    loads: getUniqueSavedLoads(startupHasLoads ? localStartupSnapshot.loads : savedLoads),
    dailyAddOns: startupHasLoads ? localStartupSnapshot.dailyAddOns : dailyAddOns,
    dailySummaries: startupHasLoads ? localStartupSnapshot.dailySummaries : dailyEarningsRecords,
    profile: startupHasLoads ? localStartupSnapshot.profile : driverProfile,
    metadata: startupHasLoads ? localStartupSnapshot.metadata : appMeta,
    settings: startupHasLoads ? localStartupSnapshot.settings : appSettings,
    favoriteRoutes: startupHasLoads ? localStartupSnapshot.favoriteRoutes : favoriteRoutes
  });
}

function saveFirebaseMigrationSafetyBackup(localState) {
  return storeJson(FIREBASE_MIGRATION_BACKUP_STORAGE_KEY, {
    format: BACKUP_FORMAT,
    backupType: 'pre-firebase-cloud-migration',
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    recordCount: countUniqueLoads(localState.loads),
    data: localState
  }, 'Firebase migration safety backup');
}

function buildMigrationMetadata(stats, localState, verifiedCloudCount) {
  return sanitizeForFirestore({
    migrationVersion: CLOUD_MIGRATION_VERSION,
    migrationDate: new Date().toISOString(),
    source: 'localStorage',
    sourceDataVersion: localState.metadata?.dataSchemaVersion || DATA_SCHEMA_VERSION,
    sourceAppVersion: localState.metadata?.appVersion || APP_VERSION,
    recordsExamined: stats.examinedCount,
    recordsUploaded: stats.uploadedCount,
    recordsSkippedAsDuplicates: stats.skippedCount,
    recordsSkippedForNewerCloudVersion: stats.newerCloudCount,
    verifiedCloudCount,
    localRecordsPreserved: true,
    storageKeys: {
      loads: STORAGE_KEY,
      dailyAddOns: ADD_ON_STORAGE_KEY,
      dailySummaries: EARNINGS_STORAGE_KEY,
      profile: PROFILE_STORAGE_KEY,
      metadata: META_STORAGE_KEY,
      settings: SETTINGS_STORAGE_KEY,
      favoriteRoutes: FAVORITE_ROUTES_STORAGE_KEY
    },
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

async function migrateLocalDataToFirebase() {
  if (!isCloudReady()) {
    setMigrationStatus('Cloud records are still loading. Try again in a moment.', true);
    return;
  }

  const localState = getLocalMigrationState();
  const localLoads = getUniqueSavedLoads(localState.loads).map(normalizeSavedLoad);
  const preview = getMigrationPreview(localLoads);

  if (localLoads.length === 0) {
    setMigrationStatus('No local load records were found to migrate.', true);
    return;
  }

  const confirmed = typeof globalThis.confirm === 'function'
    ? globalThis.confirm(`Migrate ${localLoads.length} local load records to Firebase? Local browser records will remain as a safety copy.`)
    : false;

  if (!confirmed) {
    setMigrationStatus('Migration canceled. Local records were not changed.');
    return;
  }

  if (!saveFirebaseMigrationSafetyBackup(localState)) {
    setMigrationStatus('Migration stopped because the local safety backup could not be saved.', true);
    return;
  }

  setMigrationStatus(`Migration started. Examining ${preview.examinedCount} local records...`);

  if (authControls.startMigrationButton) {
    authControls.startMigrationButton.disabled = true;
  }

  const { byId, byFingerprint } = getCloudDuplicateMaps();
  const batch = cloudSync.sdk.writeBatch(cloudSync.db);
  const stats = {
    examinedCount: localLoads.length,
    uploadedCount: 0,
    skippedCount: 0,
    newerCloudCount: 0
  };

  try {
    localLoads.forEach((load) => {
      const fingerprint = buildLoadFingerprint(load);
      const cloudById = byId.get(String(load.id));
      const cloudByFingerprint = byFingerprint.get(fingerprint);

      if (cloudById && getLoadComparableTime(cloudById) >= getLoadComparableTime(load)) {
        stats.skippedCount += 1;
        stats.newerCloudCount += getLoadComparableTime(cloudById) > getLoadComparableTime(load) ? 1 : 0;
        return;
      }

      if (!cloudById && cloudByFingerprint) {
        stats.skippedCount += 1;
        return;
      }

      batch.set(cloudDocument('loads', toCloudDocumentId(load.id)), buildCloudLoadPayload({
        ...load,
        migrationFingerprint: fingerprint
      }), { merge: true });
      stats.uploadedCount += 1;
    });

    const addOns = normalizeDailyAddOns(localState.dailyAddOns || {});
    Object.keys(addOns).forEach((date) => {
      batch.set(cloudDocument('dailyAddOns', toCloudDocumentId(date)), sanitizeForFirestore({
        ...addOns[date],
        date,
        appVersion: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    });

    const summaries = isPlainObject(localState.dailySummaries) ? localState.dailySummaries : {};
    Object.keys(summaries).forEach((date) => {
      batch.set(cloudDocument('dailySummaries', toCloudDocumentId(date)), sanitizeForFirestore({
        ...summaries[date],
        date,
        appVersion: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    });

    batch.set(cloudDocument('profile', 'current'), sanitizeForFirestore({
      ...normalizeDriverProfile(localState.profile || {}),
      appVersion: APP_VERSION,
      dataSchemaVersion: DATA_SCHEMA_VERSION,
      cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
    }), { merge: true });
    batch.set(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
      cloudAuthoritative: true,
      migrationVersion: CLOUD_MIGRATION_VERSION
    }), { merge: true });

    await batch.commit();

    const verifiedSnapshot = await cloudSync.sdk.getDocs(cloudCollection('loads'));
    const verifiedCloudCount = verifiedSnapshot.docs.length;
    const migrationMetadata = buildMigrationMetadata(stats, localState, verifiedCloudCount);

    await cloudSync.sdk.setDoc(cloudDocument('metadata', 'migration'), migrationMetadata, { merge: true });
    await cloudSync.sdk.setDoc(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
      cloudAuthoritative: true,
      migrationCompletedAt: migrationMetadata.migrationDate,
      migrationVersion: CLOUD_MIGRATION_VERSION
    }), { merge: true });

    cloudSync.state.migration = normalizeCloudData(migrationMetadata);
    appMeta = {
      ...appMeta,
      cloudSync: {
        authoritative: true,
        uid: cloudSync.user.uid,
        email: cloudSync.user.email || '',
        migrationCompletedAt: migrationMetadata.migrationDate
      }
    };
    saveAppMeta();
    setMigrationStatus(`Migration complete. Uploaded ${stats.uploadedCount}, skipped ${stats.skippedCount}, verified ${verifiedCloudCount} cloud load records. Local records remain on this device.`);
    updateAuthUi();
  } catch {
    setMigrationStatus('Migration failed before completion. Local records were not deleted or changed. You can try again safely.', true);
  } finally {
    if (authControls.startMigrationButton) {
      authControls.startMigrationButton.disabled = false;
    }
  }
}

function downloadBackupBeforeMigration() {
  const localState = getLocalMigrationState();
  const backup = {
    format: BACKUP_FORMAT,
    backupType: 'pre-firebase-cloud-migration-download',
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    recordCount: countUniqueLoads(localState.loads),
    data: localState
  };

  downloadJson(`personal-oilfield-pre-firebase-migration-${todayLocal()}.json`, backup);
  setMigrationStatus(`Downloaded backup with ${backup.recordCount} ${backup.recordCount === 1 ? 'record' : 'records'}.`);
}

async function clearOldAppCaches() {
  if (!canUseServiceWorkerRuntime() || !('caches' in globalThis)) {
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
  if (!canUseServiceWorkerRuntime()) {
    setUpdateStatus(getNativeUpdateMessage());
    setElementText(settingsServiceWorkerState, 'Not used in this runtime');
    return null;
  }

  if (!('serviceWorker' in navigator)) {
    setElementText(settingsServiceWorkerState, 'Not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('./service-worker.js');
    setElementText(settingsServiceWorkerState, 'Registered');

    if (registration.active) {
      registration.active.postMessage({ type: 'CLEAR_OLD_CACHES' });
    }

    if (registration.waiting) {
      showUpdateAvailable(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;

      if (!worker) {
        return;
      }

      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateAvailable(worker);
        }
      });
    });

    return registration;
  } catch {
    setElementText(settingsServiceWorkerState, 'Registration failed');
    return null;
  }
}

function showUpdateAvailable(worker) {
  waitingServiceWorker = worker;

  if (updateBanner) {
    updateBanner.hidden = false;
  }

  setUpdateStatus('Update available. Tap Update Now when ready.');
  setElementText(settingsServiceWorkerState, 'Update available');
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
  if (!canUseServiceWorkerRuntime() || !('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
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
  if (!canUseServiceWorkerRuntime()) {
    setUpdateStatus(getNativeUpdateMessage());
    return;
  }

  setUpdateStatus('Update complete. Reloading...');

  const worker = registration?.waiting || waitingServiceWorker;

  if (worker) {
    worker.postMessage({ type: 'SKIP_WAITING' });
    await waitForControllerChange();
  }

  globalThis.location.reload();
}

async function activateWaitingUpdate() {
  if (updateNowButton) {
    updateNowButton.disabled = true;
  }

  try {
    if (waitingServiceWorker) {
      await reloadAfterServiceWorkerUpdate(null);
      return;
    }

    await checkForUpdates();
  } finally {
    if (updateNowButton) {
      setTimeout(() => {
        updateNowButton.disabled = false;
      }, 1600);
    }
  }
}

async function checkForUpdates() {
  if (checkUpdatesButton) {
    checkUpdatesButton.disabled = true;
  }

  setUpdateStatus('Checking for updates...');

  try {
    if (!canUseServiceWorkerRuntime()) {
      setUpdateStatus(getNativeUpdateMessage());
      return;
    }

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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hashString(value) {
  let hash = 0;
  const text = String(value);

  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }

  return Math.abs(hash).toString(36);
}

function buildStableFallbackId(load, index, reason = 'legacy') {
  const identityText = JSON.stringify({
    reason,
    index,
    savedAt: load?.savedAt || '',
    loadDate: load?.loadDate || '',
    loadNumber: load?.loadNumber || '',
    ticketNumber: load?.ticketNumber || '',
    bolNumber: load?.bolNumber || '',
    driverName: load?.driverName || '',
    grossBarrels: load?.grossBarrels ?? '',
    loadedMiles: load?.loadedMiles ?? ''
  });

  return `${reason}-${hashString(identityText)}`;
}

function createMigrationBackup(rawLoads, reason) {
  if (storageAudit.migrationBackupCreated) {
    return true;
  }

  const backup = {
    format: BACKUP_FORMAT,
    backupType: 'pre-migration-load-identity-backup',
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    reason,
    storageKey: STORAGE_KEY,
    recordCount: Array.isArray(rawLoads) ? rawLoads.length : 0,
    loads: rawLoads
  };

  const saved = storeJson(MIGRATION_BACKUP_STORAGE_KEY, backup, 'pre-migration backup');
  storageAudit.migrationBackupCreated = saved;
  return saved;
}

function repairLoadIdentities(rawLoads) {
  const seenIds = new Set();
  let missingIdsAdded = 0;
  let duplicateIdsRepaired = 0;
  let needsWrite = false;

  const repairedLoads = rawLoads.map((rawLoad, index) => {
    const load = isPlainObject(rawLoad) ? { ...rawLoad } : {};
    let id = load.id === undefined || load.id === null || String(load.id).trim() === ''
      ? ''
      : String(load.id);

    if (!id) {
      id = buildStableFallbackId(load, index, 'legacy-missing-id');
      missingIdsAdded += 1;
      needsWrite = true;
    }

    if (seenIds.has(id)) {
      id = buildStableFallbackId(load, index, 'legacy-duplicate-id');
      duplicateIdsRepaired += 1;
      needsWrite = true;
    }

    while (seenIds.has(id)) {
      id = `${id}-${hashString(`${index}-${Date.now()}-${Math.random()}`)}`;
      duplicateIdsRepaired += 1;
      needsWrite = true;
    }

    seenIds.add(id);
    load.id = id;
    return load;
  });

  storageAudit.missingIdsAdded = missingIdsAdded;
  storageAudit.duplicateIdsRepaired = duplicateIdsRepaired;

  if (needsWrite && createMigrationBackup(rawLoads, 'Missing or duplicate record IDs were repaired before saving the normalized load log.')) {
    storeJson(STORAGE_KEY, repairedLoads.map(normalizeSavedLoad), 'load log');
  }

  return repairedLoads;
}

function loadSavedLoads() {
  const rawLoads = loadJson(STORAGE_KEY, [], 'load log', LEGACY_STORAGE_KEY);

  if (!Array.isArray(rawLoads)) {
    addStorageWarning('Warning: saved load log was not in the expected format. The app started with an empty load log.');
    storageAudit.recordsBeforeMigration = 0;
    storageAudit.recordsAfterMigration = 0;
    return [];
  }

  storageAudit.recordsBeforeMigration = rawLoads.length;
  const repairedLoads = repairLoadIdentities(rawLoads);
  const normalizedLoads = repairedLoads.map(normalizeSavedLoad);
  storageAudit.recordsAfterMigration = countUniqueLoads(normalizedLoads);
  return normalizedLoads;
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
      ...addOn,
      date,
      perDiem: Boolean(addOn.perDiem ?? addOn.perDiemApplied),
      sleeperBerth: Boolean(addOn.sleeperBerth ?? addOn.sleeperBerthApplied),
      trainerPay: Boolean(addOn.trainerPay ?? addOn.trainerPayApplied),
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

function normalizeDriverProfile(profile) {
  const rawProfile = isPlainObject(profile) ? profile : {};

  return {
    ...rawProfile,
    driverName: String(rawProfile.driverName || '').trim(),
    truckNumber: String(rawProfile.truckNumber || '').trim(),
    trailerNumber: String(rawProfile.trailerNumber || '').trim(),
    updatedAt: rawProfile.updatedAt || null
  };
}

function loadDriverProfile() {
  const rawProfile = loadJson(PROFILE_STORAGE_KEY, {}, 'driver profile');
  return normalizeDriverProfile(rawProfile);
}

function saveDriverProfileToStorage() {
  return storeJson(PROFILE_STORAGE_KEY, driverProfile, 'driver profile');
}

function loadAppMeta() {
  const rawMeta = loadJson(META_STORAGE_KEY, {}, 'application metadata');

  if (!isPlainObject(rawMeta)) {
    return {};
  }

  return rawMeta;
}

function saveAppMeta() {
  appMeta = {
    ...appMeta,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    storageKeys: {
      loads: STORAGE_KEY,
      dailyAddOns: ADD_ON_STORAGE_KEY,
      dailySummaries: EARNINGS_STORAGE_KEY,
      profile: PROFILE_STORAGE_KEY,
      metadata: META_STORAGE_KEY,
      settings: SETTINGS_STORAGE_KEY,
      favoriteRoutes: FAVORITE_ROUTES_STORAGE_KEY,
      currentDraft: DRAFT_STORAGE_KEY
    },
    lastStorageAudit: {
      recordsBeforeMigration: storageAudit.recordsBeforeMigration,
      recordsAfterMigration: storageAudit.recordsAfterMigration,
      missingIdsAdded: storageAudit.missingIdsAdded,
      duplicateIdsRepaired: storageAudit.duplicateIdsRepaired,
      migrationBackupCreated: storageAudit.migrationBackupCreated
    }
  };

  return storeJson(META_STORAGE_KEY, appMeta, 'application metadata');
}

function getDefaultSettings() {
  return {
    payRates: { ...DEFAULT_PAY_SETTINGS },
    loadedMilesPayScale: DEFAULT_LOADED_MILES_PAY_SCALE.map((range) => ({ ...range })),
    keepRouteForNextLoad: true
  };
}

function normalizePayRate(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeLoadedMilesPayScale(rawScale) {
  const fallback = DEFAULT_LOADED_MILES_PAY_SCALE.map((range) => ({ ...range }));

  if (!Array.isArray(rawScale)) {
    return fallback;
  }

  const normalized = rawScale
    .map((range, index) => {
      const fallbackRange = fallback[index] || {};
      const min = Number(range?.min ?? fallbackRange.min);
      const max = Number(range?.max ?? fallbackRange.max);
      const rate = normalizePayRate(range?.rate, fallbackRange.rate ?? 0);

      if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) {
        return fallbackRange;
      }

      return { min, max, rate };
    })
    .filter((range) => Number.isFinite(range.min) && Number.isFinite(range.max));

  return normalized.length > 0 ? normalized : fallback;
}

function normalizeAppSettings(rawSettings) {
  const defaults = getDefaultSettings();
  const raw = isPlainObject(rawSettings) ? rawSettings : {};
  const rawRates = isPlainObject(raw.payRates) ? raw.payRates : raw;

  return {
    ...defaults,
    ...raw,
    payRates: {
      rejectPay: normalizePayRate(rawRates.rejectPay, defaults.payRates.rejectPay),
      perDiemPay: normalizePayRate(rawRates.perDiemPay, defaults.payRates.perDiemPay),
      sleeperBerthPay: normalizePayRate(rawRates.sleeperBerthPay, defaults.payRates.sleeperBerthPay),
      trainerPay: normalizePayRate(rawRates.trainerPay, defaults.payRates.trainerPay),
      waitPayRate: normalizePayRate(rawRates.waitPayRate, defaults.payRates.waitPayRate)
    },
    loadedMilesPayScale: normalizeLoadedMilesPayScale(raw.loadedMilesPayScale),
    keepRouteForNextLoad: raw.keepRouteForNextLoad !== false
  };
}

function loadAppSettings() {
  return normalizeAppSettings(loadJson(SETTINGS_STORAGE_KEY, {}, 'application settings'));
}

function saveAppSettingsToStorage() {
  return storeJson(SETTINGS_STORAGE_KEY, appSettings, 'application settings');
}

function getPayRate(rateName) {
  const defaults = getDefaultSettings().payRates;
  return normalizePayRate(appSettings?.payRates?.[rateName], defaults[rateName]);
}

function getActiveLoadedMilesPayScale() {
  return normalizeLoadedMilesPayScale(appSettings?.loadedMilesPayScale);
}

function normalizeFavoriteRoutes(rawRoutes) {
  if (!Array.isArray(rawRoutes)) {
    return [];
  }

  return rawRoutes
    .map((route) => {
      if (!isPlainObject(route)) {
        return null;
      }

      const pickupLocation = String(route.pickupLocation || '').trim();
      const dropoffLocation = String(route.dropoffLocation || '').trim();

      if (!pickupLocation || !dropoffLocation) {
        return null;
      }

      return {
        id: String(route.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
        name: String(route.name || `${pickupLocation} to ${dropoffLocation}`).trim(),
        pickupLocation,
        dropoffLocation,
        loadedMiles: numberOrNull(route.loadedMiles),
        productType: String(route.productType || '').trim(),
        updatedAt: route.updatedAt || new Date().toISOString()
      };
    })
    .filter(Boolean);
}

function loadFavoriteRoutes() {
  return normalizeFavoriteRoutes(loadJson(FAVORITE_ROUTES_STORAGE_KEY, [], 'favorite routes'));
}

function saveFavoriteRoutesToStorage() {
  return storeJson(FAVORITE_ROUTES_STORAGE_KEY, favoriteRoutes, 'favorite routes');
}

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = String(dateValue).split('-').map(Number);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function formatLocalDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonthRange(dateValue) {
  const date = parseLocalDate(dateValue);

  if (!date) {
    return { start: '', end: '' };
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: formatLocalDate(start),
    end: formatLocalDate(end)
  };
}

function getCompanyPayPeriodRange(dateValue) {
  const date = parseLocalDate(dateValue);

  if (!date) {
    return { start: '', end: '' };
  }

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const startDay = day <= 15 ? 1 : 16;
  const endDay = day <= 15 ? 15 : new Date(year, month + 1, 0).getDate();

  return {
    start: formatLocalDate(new Date(year, month, startDay)),
    end: formatLocalDate(new Date(year, month, endDay))
  };
}

function isDateInRange(dateValue, startDate, endDate) {
  if (!dateValue || !startDate || !endDate) {
    return false;
  }

  return dateValue >= startDate && dateValue <= endDate;
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

function numberOrNull(value) {
  if (isFiniteNumber(value)) {
    return value;
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  const number = Number(value);
  return isFiniteNumber(number) ? number : null;
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

function setStatusMessage(element, message, isError = false) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `save-status show${isError ? ' error' : ''}`;
}

function clearStatusMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = '';
  element.className = 'save-status';
}

function formatRoute(load) {
  const pickup = load?.pickupLocation || 'Pickup';
  const dropoff = load?.dropoffLocation || 'Drop-off';
  return `${pickup} -> ${dropoff}`;
}

function activateView(viewName) {
  const nextView = viewName || 'dashboard';

  appViews.forEach((view) => {
    view.classList.toggle('active', view.dataset.view === nextView);
  });

  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.viewTarget === nextView);
  });

  if (nextView === 'records') {
    renderSavedLoads();
  }

  if (nextView === 'reports') {
    renderReportSummary();
  }

  if (nextView === 'settings') {
    renderSettingsUi();
  }
}

function handleNavigationClick(event) {
  const button = event.target.closest ? event.target.closest('[data-view-target]') : null;

  if (!button) {
    return;
  }

  activateView(button.dataset.viewTarget);
}

function getNextLoadNumber(date = daily.date?.value || todayLocal()) {
  const numbers = getLoadsForDate(date)
    .map((load) => String(load.loadNumber || '').match(/\d+/g)?.pop())
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return String(nextNumber);
}

function ensureLoadNumber() {
  if (!fields.loadNumber?.value && !editingLoadId) {
    fields.loadNumber.value = getNextLoadNumber(fields.loadDate?.value || daily.date?.value || todayLocal());
  }
}

function updateEquipmentSummary() {
  const driver = fields.driverName?.value || driverProfile.driverName || 'Driver';
  const truck = fields.truckNumber?.value || driverProfile.truckNumber || '-';
  const trailer = fields.trailerNumber?.value || driverProfile.trailerNumber || '-';
  const text = `${driver} · Truck ${truck} · Trailer ${trailer}`;

  if (entryEquipmentSummary) {
    entryEquipmentSummary.textContent = text;
  }
}

function updateRateLabels() {
  if (paySettingsControls.labels.perDiem) {
    paySettingsControls.labels.perDiem.textContent = formatMoney(getPayRate('perDiemPay'));
  }

  if (paySettingsControls.labels.sleeper) {
    paySettingsControls.labels.sleeper.textContent = formatMoney(getPayRate('sleeperBerthPay'));
  }

  if (paySettingsControls.labels.trainer) {
    paySettingsControls.labels.trainer.textContent = formatMoney(getPayRate('trainerPay'));
  }

  if (paySettingsControls.labels.reject) {
    paySettingsControls.labels.reject.textContent = formatMoney(getPayRate('rejectPay'));
  }
}

function renderLoadedMilesPayEditor() {
  if (!paySettingsControls.loadedMilesEditor) {
    return;
  }

  paySettingsControls.loadedMilesEditor.innerHTML = getActiveLoadedMilesPayScale().map((range, index) => `
    <label class="pay-scale-row" for="pay-scale-rate-${index}">
      <span>${range.min}-${range.max} miles</span>
      <input id="pay-scale-rate-${index}" data-pay-scale-index="${index}" type="number" inputmode="decimal" min="0" step="0.01" value="${String(range.rate)}">
    </label>
  `).join('');
}

function applyPaySettingsToControls() {
  if (paySettingsControls.waitRate) {
    paySettingsControls.waitRate.value = String(getPayRate('waitPayRate'));
  }

  if (paySettingsControls.perDiemRate) {
    paySettingsControls.perDiemRate.value = String(getPayRate('perDiemPay'));
  }

  if (paySettingsControls.sleeperRate) {
    paySettingsControls.sleeperRate.value = String(getPayRate('sleeperBerthPay'));
  }

  if (paySettingsControls.rejectRate) {
    paySettingsControls.rejectRate.value = String(getPayRate('rejectPay'));
  }

  if (paySettingsControls.trainerRate) {
    paySettingsControls.trainerRate.value = String(getPayRate('trainerPay'));
  }

  updateRateLabels();
  renderLoadedMilesPayEditor();
}

function readLoadedMilesPayEditor() {
  const currentScale = getActiveLoadedMilesPayScale();

  if (!paySettingsControls.loadedMilesEditor || typeof paySettingsControls.loadedMilesEditor.querySelectorAll !== 'function') {
    return currentScale;
  }

  const nextScale = currentScale.map((range) => ({ ...range }));
  paySettingsControls.loadedMilesEditor.querySelectorAll('[data-pay-scale-index]').forEach((input) => {
    const index = Number(input.dataset.payScaleIndex);

    if (nextScale[index]) {
      nextScale[index].rate = normalizePayRate(input.value, nextScale[index].rate);
    }
  });

  return nextScale;
}

function savePaySettingsFromControls() {
  const nextSettings = normalizeAppSettings({
    ...appSettings,
    payRates: {
      waitPayRate: paySettingsControls.waitRate?.value,
      perDiemPay: paySettingsControls.perDiemRate?.value,
      sleeperBerthPay: paySettingsControls.sleeperRate?.value,
      rejectPay: paySettingsControls.rejectRate?.value,
      trainerPay: paySettingsControls.trainerRate?.value
    },
    loadedMilesPayScale: readLoadedMilesPayEditor()
  });
  const previousSettings = appSettings;

  appSettings = nextSettings;

  if (!saveAppSettingsToStorage()) {
    appSettings = previousSettings;
    setStatusMessage(paySettingsControls.status, 'Pay rates could not be saved. Existing records were not changed.', true);
    return;
  }

  refreshAllDailyEarningsRecords();
  renderSummary();
  updateDailySummary();
  syncSettingsToCloud();
  setStatusMessage(paySettingsControls.status, 'Pay rates saved.');
}

function renderFavoriteRoutes() {
  if (favoriteRouteControls.select) {
    favoriteRouteControls.select.innerHTML = [
      '<option value="">Manual entry</option>',
      ...favoriteRoutes.map((route) => `<option value="${escapeHtml(route.id)}">${escapeHtml(route.name)}</option>`)
    ].join('');
  }

  if (!favoriteRouteControls.list) {
    return;
  }

  if (favoriteRoutes.length === 0) {
    favoriteRouteControls.list.innerHTML = '<article class="empty-card">No favorite routes saved yet.</article>';
    return;
  }

  favoriteRouteControls.list.innerHTML = favoriteRoutes.map((route) => `
    <article class="favorite-route-item">
      <div>
        <strong>${escapeHtml(route.name)}</strong>
        <span>${escapeHtml(route.pickupLocation)} -> ${escapeHtml(route.dropoffLocation)} · ${formatMiles(route.loadedMiles)}${route.productType ? ` · ${escapeHtml(route.productType)}` : ''}</span>
      </div>
      <button class="small-button danger" type="button" data-delete-route-id="${escapeHtml(route.id)}">Delete</button>
    </article>
  `).join('');
}

function saveFavoriteRouteFromControls() {
  const pickupLocation = favoriteRouteControls.pickup?.value.trim() || '';
  const dropoffLocation = favoriteRouteControls.dropoff?.value.trim() || '';

  if (!pickupLocation || !dropoffLocation) {
    setStatusMessage(favoriteRouteControls.status, 'Enter pickup and drop-off locations before saving a favorite route.', true);
    return;
  }

  const route = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: favoriteRouteControls.name?.value.trim() || `${pickupLocation} to ${dropoffLocation}`,
    pickupLocation,
    dropoffLocation,
    loadedMiles: numberOrNull(favoriteRouteControls.mileage?.value),
    productType: favoriteRouteControls.product?.value.trim() || '',
    updatedAt: new Date().toISOString()
  };
  const previousRoutes = favoriteRoutes;
  favoriteRoutes = normalizeFavoriteRoutes([route, ...favoriteRoutes]);

  if (!saveFavoriteRoutesToStorage()) {
    favoriteRoutes = previousRoutes;
    setStatusMessage(favoriteRouteControls.status, 'Favorite route could not be saved.', true);
    return;
  }

  [favoriteRouteControls.name, favoriteRouteControls.pickup, favoriteRouteControls.dropoff, favoriteRouteControls.mileage, favoriteRouteControls.product].forEach((field) => {
    if (field) {
      field.value = '';
    }
  });
  renderFavoriteRoutes();
  syncSettingsToCloud();
  setStatusMessage(favoriteRouteControls.status, 'Favorite route saved.');
}

function deleteFavoriteRoute(routeId) {
  const confirmed = typeof globalThis.confirm === 'function'
    ? globalThis.confirm('Delete this favorite route? Saved load records will not be changed.')
    : true;

  if (!confirmed) {
    return;
  }

  favoriteRoutes = favoriteRoutes.filter((route) => route.id !== routeId);
  saveFavoriteRoutesToStorage();
  renderFavoriteRoutes();
  syncSettingsToCloud();
  setStatusMessage(favoriteRouteControls.status, 'Favorite route deleted.');
}

function applyFavoriteRoute(routeId) {
  const route = favoriteRoutes.find((item) => item.id === routeId);

  if (!route) {
    return;
  }

  fields.pickupLocation.value = route.pickupLocation;
  fields.dropoffLocation.value = route.dropoffLocation;

  if (isFiniteNumber(route.loadedMiles)) {
    fields.loadedMiles.value = route.loadedMiles;
  }

  if (route.productType) {
    fields.productType.value = route.productType;
  }

  renderSummary();
  saveDraftNow('Draft updated from favorite route.');
}

function renderSettingsUi() {
  applyPaySettingsToControls();
  renderFavoriteRoutes();
  updateEquipmentSummary();
}

function getDraftPayload() {
  return {
    savedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    editingLoadId,
    selectedDate: daily.date?.value || todayLocal(),
    formValues: getFormValues()
  };
}

function hasMeaningfulFormData(values = getFormValues()) {
  return fieldIds.some((id) => {
    const key = toKey(id);
    const value = values[key];

    if (['loadDate', 'loadStatus', 'driverName', 'truckNumber', 'trailerNumber', 'loadNumber'].includes(key)) {
      return false;
    }

    return value !== null && value !== undefined && String(value).trim() !== '';
  });
}

function saveDraftNow(message = 'Draft saved.') {
  const values = getFormValues();

  if (!hasMeaningfulFormData(values) && !editingLoadId) {
    clearDraft();
    return;
  }

  if (storeJson(DRAFT_STORAGE_KEY, getDraftPayload(), 'current load draft')) {
    setStatusMessage(draftStatus, message);
    updateDraftButtonState(true);
  }
}

function scheduleDraftSave() {
  if (draftSaveTimer && typeof globalThis.clearTimeout === 'function') {
    globalThis.clearTimeout(draftSaveTimer);
  }

  if (typeof globalThis.setTimeout !== 'function') {
    saveDraftNow('Draft saved.');
    return;
  }

  draftSaveTimer = globalThis.setTimeout(() => {
    saveDraftNow('Draft saved.');
  }, 550);
}

function readDraft() {
  const stored = readJsonFromStorage(DRAFT_STORAGE_KEY, 'current load draft');
  return stored.found && isPlainObject(stored.value) ? stored.value : null;
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Draft cleanup should never interrupt saved records.
  }

  clearStatusMessage(draftStatus);
  updateDraftButtonState(false);
}

function updateDraftButtonState(hasDraft = Boolean(readDraft())) {
  if (continueDraftButton) {
    continueDraftButton.hidden = !hasDraft;
  }
}

function applyDraft(draft) {
  if (!draft?.formValues) {
    return false;
  }

  fieldIds.forEach((id) => {
    const key = toKey(id);
    const field = fields[key];

    if (field && draft.formValues[key] !== undefined) {
      field.value = draft.formValues[key] === null ? '' : draft.formValues[key];
    }
  });

  editingLoadId = draft.editingLoadId || null;
  daily.date.value = draft.selectedDate || draft.formValues.loadDate || daily.date.value || todayLocal();

  if (editingLoadId) {
    saveLoadButton.textContent = 'Update Load';
    editStatus.textContent = 'Editing saved draft';
  } else {
    saveLoadButton.textContent = 'Save Load';
    editStatus.textContent = 'Draft restored';
  }

  updateEquipmentSummary();
  applyDailyAddOnsToControls();
  renderSummary();
  updateDailySummary();
  setStatusMessage(draftStatus, `Draft restored from ${new Date(draft.savedAt || Date.now()).toLocaleString()}.`);
  return true;
}

function restoreDraftIfAvailable() {
  const draft = readDraft();

  updateDraftButtonState(Boolean(draft));

  if (!draft) {
    return;
  }

  applyDraft(draft);
}

function warnBeforeLeavingUnsaved(event) {
  if (!hasMeaningfulFormData() || readDraft()) {
    return;
  }

  event.preventDefault();
  event.returnValue = '';
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

function calculateStopWaitBreakdown(values) {
  // Wait pay only uses the time spent at each stop after arrival, with the first hour free at each stop.
  const pickupStopDurationMinutes = durationBetween(values.arrivedPickupTime, values.loadedTime);
  const unloadStopDurationMinutes = durationBetween(values.arrivedDropoffTime, values.completedTime);
  const paidPickupWaitMinutes = calculatePaidWaitMinutes(pickupStopDurationMinutes);
  const paidDropoffWaitMinutes = calculatePaidWaitMinutes(unloadStopDurationMinutes);
  const totalPaidWaitMinutes = paidPickupWaitMinutes + paidDropoffWaitMinutes;

  return {
    pickupTimeMinutes: pickupStopDurationMinutes,
    dropoffTimeMinutes: unloadStopDurationMinutes,
    paidPickupWaitMinutes,
    paidDropoffWaitMinutes,
    totalPaidWaitMinutes,
    waitPay: calculateWaitPay(totalPaidWaitMinutes)
  };
}

function calculateWaitPay(totalPaidWaitMinutes) {
  return isFiniteNumber(totalPaidWaitMinutes)
    ? totalPaidWaitMinutes / 60 * getPayRate('waitPayRate')
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
  const match = getActiveLoadedMilesPayScale().find((range) => (
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
  const regularMiles = valueOrZero(values.loadedMiles);
  const reRoutedMiles = valueOrZero(values.reRoutedMiles);
  const totalMilesIncludingReRoute = regularMiles + reRoutedMiles;
  const payMatch = getLoadedMilesPay(values.loadedMiles);
  const estimatedPay = isReject(values) ? getPayRate('rejectPay') : payMatch.rate;
  const stopWait = calculateStopWaitBreakdown(values);
  const estimatedEntryPay = estimatedPay + stopWait.waitPay;

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
    regularMiles,
    reRoutedMiles,
    totalMilesIncludingReRoute,
    matchedPayRange: isReject(values) ? 'Reject pay' : payMatch.rangeLabel,
    loadedMilesPayRate: isReject(values) ? 0 : payMatch.rate,
    estimatedPay,
    estimatedEntryPay,
    paySource: isReject(values) ? 'Reject' : 'Automatic',
    pickupTimeMinutes: stopWait.pickupTimeMinutes,
    travelTimeMinutes: durationBetween(values.loadedTime, values.arrivedDropoffTime),
    dropoffTimeMinutes: stopWait.dropoffTimeMinutes,
    paidPickupWaitMinutes: stopWait.paidPickupWaitMinutes,
    paidDropoffWaitMinutes: stopWait.paidDropoffWaitMinutes,
    totalPaidWaitMinutes: stopWait.totalPaidWaitMinutes,
    waitPay: stopWait.waitPay,
    cycleTimeMinutes: durationBetween(values.arrivedPickupTime, values.completedTime),
    firstPickupMinutes: parseTimeToMinutes(values.arrivedPickupTime),
    completedTimelineMinutes: timelineEndMinutes(values.arrivedPickupTime, values.completedTime)
  };
}

function normalizeSavedLoad(load) {
  const rawLoad = isPlainObject(load) ? load : {};
  const normalized = {
    ...rawLoad,
    id: rawLoad.id || `${rawLoad.savedAt || Date.now()}-${Math.random().toString(16).slice(2)}`,
    savedAt: rawLoad.savedAt || new Date().toISOString(),
    updatedAt: rawLoad.updatedAt || null,
    dataSchemaVersion: rawLoad.dataSchemaVersion || DATA_SCHEMA_VERSION,
    driverName: rawLoad.driverName || '',
    truckNumber: rawLoad.truckNumber || '',
    trailerNumber: rawLoad.trailerNumber || '',
    emptyTruckWeight: numberOrNull(rawLoad.emptyTruckWeight),
    loadDate: rawLoad.loadDate || '',
    loadNumber: rawLoad.loadNumber || '',
    ticketNumber: rawLoad.ticketNumber || '',
    bolNumber: rawLoad.bolNumber || '',
    loadStatus: rawLoad.loadStatus || COMPLETED_STATUS,
    productType: rawLoad.productType || '',
    pickupLocation: rawLoad.pickupLocation || '',
    dropoffLocation: rawLoad.dropoffLocation || '',
    grossBarrels: numberOrNull(rawLoad.grossBarrels) ?? 0,
    netBarrels: numberOrNull(rawLoad.netBarrels),
    apiGravity: numberOrNull(rawLoad.apiGravity),
    bswPercentage: numberOrNull(rawLoad.bswPercentage),
    loadedMiles: numberOrNull(rawLoad.loadedMiles),
    reRoutedMiles: numberOrNull(rawLoad.reRoutedMiles ?? rawLoad.reroutedMiles) ?? 0,
    notes: rawLoad.notes || '',
    rejectReason: rawLoad.rejectReason || '',
    arrivedPickupTime: rawLoad.arrivedPickupTime || '',
    loadedTime: rawLoad.loadedTime || '',
    arrivedDropoffTime: rawLoad.arrivedDropoffTime || '',
    completedTime: rawLoad.completedTime || '',
    startMeterReading: numberOrNull(rawLoad.startMeterReading),
    endMeterReading: numberOrNull(rawLoad.endMeterReading),
    jotformConfirmationNumber: rawLoad.jotformConfirmationNumber || ''
  };

  return { ...normalized, ...calculateDerived(normalized), dataSchemaVersion: DATA_SCHEMA_VERSION };
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
    trainerPay: Boolean(addOn.trainerPay),
    notes: addOn.notes || ''
  };
}

function saveDailyAddOnFromControls() {
  const date = daily.date.value;

  if (!date) {
    return;
  }

  const addOn = {
    ...getDailyAddOn(date),
    date,
    perDiem: addOns.perDiem.checked,
    sleeperBerth: addOns.sleeperBerth.checked,
    trainerPay: addOns.trainerPay.checked,
    notes: addOns.notes.value.trim()
  };

  if (!addOn.perDiem && !addOn.sleeperBerth && !addOn.trainerPay && !addOn.notes) {
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
  addOns.trainerPay.checked = addOn.trainerPay;
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

function getUniqueSavedLoads(records = savedLoads) {
  const seenIds = new Set();

  return records.filter((load) => {
    if (!isPlainObject(load) || !load.id) {
      return false;
    }

    const id = String(load.id);

    if (seenIds.has(id)) {
      return false;
    }

    seenIds.add(id);
    return true;
  });
}

function countUniqueLoads(records = savedLoads) {
  return getUniqueSavedLoads(records).length;
}

function getLoadsForDate(date) {
  return getUniqueSavedLoads().filter((load) => load.loadDate === date);
}

function getLoadsForRange(startDate, endDate) {
  return getUniqueSavedLoads().filter((load) => isDateInRange(load.loadDate, startDate, endDate));
}

function getCompanyPayPeriodLoads(dateValue) {
  const range = getCompanyPayPeriodRange(dateValue);
  return getLoadsForRange(range.start, range.end);
}

function getPayPeriodEarningsSummary(dateValue) {
  const records = getCompanyPayPeriodLoads(dateValue);
  const dates = new Set(records.map((load) => load.loadDate).filter(Boolean));
  const dailySummaries = [...dates].map((date) => getDailyEarningsSummary(date));
  const completedRecords = records.filter(isCompleted);
  const rejectRecords = records.filter(isReject);

  return {
    ...getCompanyPayPeriodRange(dateValue),
    loadRecordCount: records.length,
    completedLoadCount: completedRecords.length,
    rejectCount: rejectRecords.length,
    totalLoadedMiles: sum(records, 'loadedMiles'),
    totalReRoutedMiles: sum(records, 'reRoutedMiles'),
    totalMilesIncludingReRoute: sum(records, 'totalMilesIncludingReRoute'),
    totalGrossBarrels: sum(completedRecords, 'grossBarrels'),
    totalBarrelsOffloaded: sum(records, 'barrelsOffloaded'),
    totalDifferenceVsGrossBarrels: sum(records, 'differenceVsGrossBarrels'),
    completedLoadPay: sum(completedRecords, 'estimatedPay'),
    rejectPay: sum(rejectRecords, 'estimatedPay'),
    totalPaidPickupWaitMinutes: sum(records, 'paidPickupWaitMinutes'),
    totalPaidDropoffWaitMinutes: sum(records, 'paidDropoffWaitMinutes'),
    totalPaidWaitMinutes: sum(records, 'totalPaidWaitMinutes'),
    totalWaitPay: sum(records, 'waitPay'),
    perDiemPay: sum(dailySummaries, 'perDiemPay'),
    sleeperBerthPay: sum(dailySummaries, 'sleeperBerthPay'),
    trainerPay: sum(dailySummaries, 'trainerPay'),
    totalEstimatedEarnings: sum(dailySummaries, 'totalEstimatedDailyEarnings')
  };
}

function getDailyEarningsSummary(date) {
  const records = getLoadsForDate(date);
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
  const totalLoadedMiles = sum(records, 'loadedMiles');
  const totalReRoutedMiles = sum(records, 'reRoutedMiles');
  const perDiemPay = addOn.perDiem ? getPayRate('perDiemPay') : 0;
  const sleeperBerthPay = addOn.sleeperBerth ? getPayRate('sleeperBerthPay') : 0;
  const trainerPay = addOn.trainerPay ? getPayRate('trainerPay') : 0;

  return {
    date,
    loadRecordCount: records.length,
    completedLoadCount: completedRecords.length,
    rejectCount: rejectRecords.length,
    totalLoadedMiles,
    totalReRoutedMiles,
    totalMilesIncludingReRoute: totalLoadedMiles + totalReRoutedMiles,
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
    trainerPayApplied: addOn.trainerPay,
    trainerPay,
    totalEstimatedDailyEarnings: totalEstimatedEntryPay + perDiemPay + sleeperBerthPay + trainerPay,
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

  const summary = {
    ...(isPlainObject(dailyEarningsRecords[date]) ? dailyEarningsRecords[date] : {}),
    ...getDailyEarningsSummary(date)
  };

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
  summary.regularMiles.textContent = formatMiles(derived.regularMiles);
  summary.reRoutedMiles.textContent = formatMiles(derived.reRoutedMiles);
  summary.totalMilesIncludingReRoute.textContent = formatMiles(derived.totalMilesIncludingReRoute);
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
  setElementText(reviewRoutePreview, formatRoute(values));
  updateEquipmentSummary();
  updateRateLabels();
}

function summarizeLoadsForDates(records) {
  const uniqueRecords = getUniqueSavedLoads(records);
  const dates = new Set(uniqueRecords.map((load) => load.loadDate).filter(Boolean));
  const summaries = [...dates].map((date) => getDailyEarningsSummary(date));

  return {
    loadCount: uniqueRecords.length,
    totalGrossBarrels: sum(uniqueRecords.filter(isCompleted), 'grossBarrels'),
    totalMileage: sum(uniqueRecords, 'totalMilesIncludingReRoute'),
    totalPaidWaitMinutes: sum(uniqueRecords, 'totalPaidWaitMinutes'),
    loadEarnings: sum(uniqueRecords, 'estimatedPay'),
    waitEarnings: sum(uniqueRecords, 'waitPay'),
    trainerPay: sum(summaries, 'trainerPay'),
    totalEarnings: sum(summaries, 'totalEstimatedDailyEarnings')
  };
}

function updateDashboardStats(summaryRecord) {
  const selectedDate = daily.date.value || todayLocal();
  const monthRange = getMonthRange(selectedDate);
  const payPeriodRange = getCompanyPayPeriodRange(selectedDate);
  daily.payPeriodStart.value = payPeriodRange.start;
  daily.payPeriodEnd.value = payPeriodRange.end;

  const payPeriodRecords = getLoadsForRange(payPeriodRange.start, payPeriodRange.end);
  const selectedDateRecords = getLoadsForDate(selectedDate);
  const payPeriodRecord = getPayPeriodEarningsSummary(selectedDate);

  dashboard.totalLoadsHauled.textContent = String(countUniqueLoads());
  dashboard.currentWorkDate.textContent = selectedDate || '-';
  dashboard.loadsHauledPayPeriod.textContent = String(payPeriodRecords.length);
  dashboard.loadsHauledMonth.textContent = String(getLoadsForRange(monthRange.start, monthRange.end).length);
  dashboard.loadsHauledSelectedDate.textContent = String(selectedDateRecords.length);
  setElementText(headerRecordCount, `${countUniqueLoads()} ${countUniqueLoads() === 1 ? 'load' : 'loads'}`);
  setElementText(payPeriodSummary.totalEarnings, formatMoney(payPeriodRecord.totalEstimatedEarnings));
  setElementText(payPeriodSummary.trainerPay, formatMoney(payPeriodRecord.trainerPay));
  setElementText(payPeriodSummary.perDiemPay, formatMoney(payPeriodRecord.perDiemPay));
  setElementText(payPeriodSummary.sleeperPay, formatMoney(payPeriodRecord.sleeperBerthPay));
  setElementText(payPeriodSummary.rejectPay, formatMoney(payPeriodRecord.rejectPay));
  setElementText(payPeriodSummary.waitPay, formatMoney(payPeriodRecord.totalWaitPay));

  const selectedDateSummary = summarizeLoadsForDates(selectedDateRecords);
  daily.grossBarrels.textContent = formatBarrels(summaryRecord.totalGrossBarrels);
  daily.loadedMiles.textContent = formatMiles(summaryRecord.totalLoadedMiles);
  daily.reRoutedMiles.textContent = formatMiles(summaryRecord.totalReRoutedMiles);
  daily.totalMilesIncludingReRoute.textContent = formatMiles(summaryRecord.totalMilesIncludingReRoute);
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
  daily.trainerPay.textContent = formatMoney(summaryRecord.trainerPay);
  daily.totalEarnings.textContent = formatMoney(summaryRecord.totalEstimatedDailyEarnings);

  return selectedDateSummary;
}

function updateDailySummary() {
  const selectedDate = daily.date.value || fields.loadDate.value || todayLocal();
  daily.date.value = selectedDate;
  const summaryRecord = updateDailyEarningsRecord(selectedDate) || getDailyEarningsSummary(selectedDate);

  daily.completedLoads.textContent = String(summaryRecord.completedLoadCount);
  daily.rejects.textContent = String(summaryRecord.rejectCount);
  updateDashboardStats(summaryRecord);

  review.dateLabel.textContent = selectedDate || '-';
  review.date.textContent = selectedDate || '-';
  review.completedLoads.textContent = String(summaryRecord.completedLoadCount);
  review.rejects.textContent = String(summaryRecord.rejectCount);
  review.loadedMiles.textContent = formatMiles(summaryRecord.totalLoadedMiles);
  review.reRoutedMiles.textContent = formatMiles(summaryRecord.totalReRoutedMiles);
  review.totalMilesIncludingReRoute.textContent = formatMiles(summaryRecord.totalMilesIncludingReRoute);
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
  review.trainerApplied.textContent = summaryRecord.trainerPayApplied ? 'Yes' : 'No';
  review.trainerPay.textContent = formatMoney(summaryRecord.trainerPay);
  review.totalEarnings.textContent = formatMoney(summaryRecord.totalEstimatedDailyEarnings);

  renderSavedLoads();
  renderRecentLoads();
  renderReportSummary();
}

function renderDailyPanels() {
  updateDailySummary();
}

function getSavedFilterRecords() {
  const scope = savedFilters.scope?.value || 'selected-date';
  const query = String(savedFilters.search?.value || '').trim().toLowerCase();
  const pickupQuery = String(extraSavedFilters.pickup?.value || '').trim().toLowerCase();
  const dropoffQuery = String(extraSavedFilters.dropoff?.value || '').trim().toLowerCase();
  const ticketQuery = String(extraSavedFilters.ticket?.value || '').trim().toLowerCase();
  let records = getUniqueSavedLoads();

  if (scope === 'selected-date') {
    records = records.filter((load) => load.loadDate === daily.date.value);
  }

  if (scope === 'date') {
    records = records.filter((load) => load.loadDate === savedFilters.date.value);
  }

  if (scope === 'pay-period') {
    const range = getCompanyPayPeriodRange(daily.date.value);
    records = records.filter((load) => isDateInRange(load.loadDate, range.start, range.end));
  }

  if (scope === 'month') {
    const range = getMonthRange(daily.date.value);
    records = records.filter((load) => isDateInRange(load.loadDate, range.start, range.end));
  }

  if (scope === 'pickup') {
    records = records.filter((load) => String(load.pickupLocation || '').toLowerCase().includes(pickupQuery || query));
  }

  if (scope === 'dropoff') {
    records = records.filter((load) => String(load.dropoffLocation || '').toLowerCase().includes(dropoffQuery || query));
  }

  if (scope === 'ticket') {
    records = records.filter((load) => [
      load.ticketNumber,
      load.bolNumber,
      load.jotformConfirmationNumber
    ].some((value) => String(value || '').toLowerCase().includes(ticketQuery || query)));
  }

  if (scope === 'completed') {
    records = records.filter(isCompleted);
  }

  if (scope === 'incomplete') {
    records = records.filter((load) => !isCompleted(load));
  }

  if (query) {
    records = records.filter((load) => [
      load.loadDate,
      load.loadNumber,
      load.ticketNumber,
      load.bolNumber,
      load.jotformConfirmationNumber,
      load.driverName,
      load.truckNumber,
      load.trailerNumber,
      load.pickupLocation,
      load.dropoffLocation,
      load.productType,
      load.notes
    ].some((value) => String(value || '').toLowerCase().includes(query)));
  }

  if (pickupQuery && scope !== 'pickup') {
    records = records.filter((load) => String(load.pickupLocation || '').toLowerCase().includes(pickupQuery));
  }

  if (dropoffQuery && scope !== 'dropoff') {
    records = records.filter((load) => String(load.dropoffLocation || '').toLowerCase().includes(dropoffQuery));
  }

  if (ticketQuery && scope !== 'ticket') {
    records = records.filter((load) => [
      load.ticketNumber,
      load.bolNumber,
      load.jotformConfirmationNumber
    ].some((value) => String(value || '').toLowerCase().includes(ticketQuery)));
  }

  const sortOrder = extraSavedFilters.sort?.value || 'newest';

  return records.sort((left, right) => {
    if (sortOrder === 'oldest') {
      return String(left.loadDate || '').localeCompare(String(right.loadDate || ''))
        || String(left.savedAt || '').localeCompare(String(right.savedAt || ''));
    }

    if (sortOrder === 'load-number') {
      return String(left.loadNumber || '').localeCompare(String(right.loadNumber || ''), undefined, { numeric: true })
        || String(right.loadDate || '').localeCompare(String(left.loadDate || ''));
    }

    if (sortOrder === 'earnings') {
      return valueOrZero(right.estimatedEntryPay) - valueOrZero(left.estimatedEntryPay);
    }

    return String(right.loadDate || '').localeCompare(String(left.loadDate || ''))
      || String(right.savedAt || '').localeCompare(String(left.savedAt || ''));
  });
}

function renderSavedLoads(records = getSavedFilterRecords()) {
  renderSavedLoadCards(records);
}

function getRecentLoads(limit = 5) {
  return getUniqueSavedLoads()
    .slice()
    .sort((left, right) => (
      String(right.loadDate || '').localeCompare(String(left.loadDate || ''))
      || String(right.savedAt || '').localeCompare(String(left.savedAt || ''))
    ))
    .slice(0, limit);
}

function renderRecentLoads() {
  if (!recentLoadList) {
    return;
  }

  const records = getRecentLoads(5);

  if (records.length === 0) {
    recentLoadList.innerHTML = '<article class="empty-card">No recent loads yet.</article>';
    return;
  }

  recentLoadList.innerHTML = records.map((load) => `
    <article class="recent-row" data-load-id="${escapeHtml(load.id)}">
      <div class="load-cell"><span>Load</span><strong>${escapeHtml(load.loadNumber || '-')}</strong></div>
      <div class="load-cell route-cell"><span>Route</span><strong>${escapeHtml(formatRoute(load))}</strong></div>
      <div class="load-cell"><span>Barrels</span><strong>${escapeHtml(formatBarrels(load.grossBarrels))}</strong></div>
      <div class="load-cell"><span>Earnings</span><strong>${escapeHtml(formatMoney(load.estimatedEntryPay))}</strong></div>
      <div class="load-cell"><span>Status</span><strong class="status-badge ${isCompleted(load) ? 'completed' : ''}">${escapeHtml(load.loadStatus || 'Incomplete')}</strong></div>
    </article>
  `).join('');
}

function renderSavedLoadCards(records) {
  logCount.textContent = `${records.length} ${records.length === 1 ? 'load' : 'loads'}`;

  if (records.length === 0) {
    savedLoadCards.innerHTML = '<article class="empty-card">No saved loads match the current filter.</article>';
    return;
  }

  savedLoadCards.innerHTML = records.map((load) => `
    <article class="load-card" data-load-id="${escapeHtml(load.id)}">
      <div class="load-row">
        <div class="load-cell"><span>Load</span><strong>${escapeHtml(load.loadNumber || '-')}</strong></div>
        <div class="load-cell"><span>Date</span><strong>${escapeHtml(load.loadDate || '-')}</strong></div>
        <div class="load-cell route-cell"><span>Route</span><strong>${escapeHtml(formatRoute(load))}</strong></div>
        <div class="load-cell"><span>Gross</span><strong>${escapeHtml(formatBarrels(load.grossBarrels))}</strong></div>
        <div class="load-cell"><span>Offloaded</span><strong>${escapeHtml(formatBarrels(load.barrelsOffloaded))}</strong></div>
        <div class="load-cell"><span>Earnings</span><strong>${escapeHtml(formatMoney(load.estimatedEntryPay))}</strong></div>
        <div class="load-cell"><span>Status</span><strong class="status-badge ${isCompleted(load) ? 'completed' : ''}">${escapeHtml(load.loadStatus || 'Incomplete')}</strong></div>
        <div class="load-actions">
          <button class="small-button" type="button" data-action="open" data-id="${escapeHtml(load.id)}">Open</button>
          <button class="small-button" type="button" data-action="edit" data-id="${escapeHtml(load.id)}">Edit</button>
          <button class="small-button" type="button" data-action="duplicate" data-id="${escapeHtml(load.id)}">Duplicate</button>
          <button class="small-button" type="button" data-action="print" data-id="${escapeHtml(load.id)}">Print</button>
          <button class="small-button" type="button" data-action="export" data-id="${escapeHtml(load.id)}">Export</button>
          <button class="small-button danger" type="button" data-action="delete" data-id="${escapeHtml(load.id)}">Delete</button>
        </div>
      </div>
      <details class="load-details">
        <summary>Full saved record</summary>
        <div class="detail-grid">
          ${detailItem('Driver name', load.driverName)}
          ${detailItem('Truck number', load.truckNumber)}
          ${detailItem('Trailer number', load.trailerNumber)}
          ${detailItem('Ticket number', load.ticketNumber || '-')}
          ${detailItem('BOL number', load.bolNumber || '-')}
          ${detailItem('Jotform number', load.jotformConfirmationNumber || '-')}
          ${detailItem('Product type', load.productType)}
          ${detailItem('Regular miles', formatMiles(load.regularMiles))}
          ${detailItem('Rerouted miles', formatMiles(load.reRoutedMiles))}
          ${detailItem('Total miles', formatMiles(load.totalMilesIncludingReRoute))}
          ${detailItem('API gravity', formatNumber(load.apiGravity, 1))}
          ${detailItem('BS&W percentage', formatPercent(load.bswPercentage))}
          ${detailItem('Estimated load weight', formatWeight(load.estimatedTotalLoadWeight))}
          ${detailItem('Estimated gross truck weight', formatWeight(load.estimatedGrossTruckWeight))}
          ${detailItem('Start meter reading', formatNumber(load.startMeterReading))}
          ${detailItem('End meter reading', formatNumber(load.endMeterReading))}
          ${detailItem('Barrels offloaded', formatBarrels(load.barrelsOffloaded))}
          ${detailItem('Difference vs gross barrels', formatBarrels(load.differenceVsGrossBarrels))}
          ${detailItem('Offload status', load.offloadStatus)}
          ${detailItem('Arrived at pickup', load.arrivedPickupTime || '-')}
          ${detailItem('Loaded / picked up', load.loadedTime || '-')}
          ${detailItem('Arrived at drop off', load.arrivedDropoffTime || '-')}
          ${detailItem('Dropped off / completed', load.completedTime || '-')}
          ${detailItem('Loading site duration', formatDuration(load.pickupTimeMinutes))}
          ${detailItem('Loading wait time', formatDuration(load.paidPickupWaitMinutes))}
          ${detailItem('Offloading site duration', formatDuration(load.dropoffTimeMinutes))}
          ${detailItem('Offloading wait time', formatDuration(load.paidDropoffWaitMinutes))}
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

function applyProfileToControls() {
  profileControls.driverName.value = driverProfile.driverName || '';
  profileControls.truckNumber.value = driverProfile.truckNumber || '';
  profileControls.trailerNumber.value = driverProfile.trailerNumber || '';
  renderProfileSummary();
}

function renderProfileSummary() {
  const hasProfile = driverProfile.driverName && driverProfile.truckNumber && driverProfile.trailerNumber;

  if (!profileControls.summary) {
    return;
  }

  profileControls.summary.textContent = hasProfile
    ? `${driverProfile.driverName} · Truck ${driverProfile.truckNumber} · Trailer ${driverProfile.trailerNumber}`
    : 'No saved profile';
  updateEquipmentSummary();
}

function applyProfileToNewLoad() {
  if (editingLoadId) {
    return;
  }

  fields.driverName.value = driverProfile.driverName || '';
  fields.truckNumber.value = driverProfile.truckNumber || '';
  fields.trailerNumber.value = driverProfile.trailerNumber || '';
  updateEquipmentSummary();
}

function readProfileValues() {
  return {
    driverName: profileControls.driverName.value.trim(),
    truckNumber: profileControls.truckNumber.value.trim(),
    trailerNumber: profileControls.trailerNumber.value.trim()
  };
}

function validateProfile(profile) {
  const missingFields = [];

  if (!profile.driverName) {
    missingFields.push('driver name');
  }

  if (!profile.truckNumber) {
    missingFields.push('truck number');
  }

  if (!profile.trailerNumber) {
    missingFields.push('trailer number');
  }

  if (missingFields.length > 0) {
    return `Enter ${missingFields.join(', ')} before saving the profile.`;
  }

  const tooLong = Object.entries(profile).find(([, value]) => value.length > 60);

  if (tooLong) {
    return 'Profile fields must be 60 characters or fewer.';
  }

  return '';
}

function saveDriverProfile() {
  clearProfileStatus();
  const nextProfile = {
    ...driverProfile,
    ...readProfileValues(),
    updatedAt: new Date().toISOString()
  };
  const profileError = validateProfile(nextProfile);

  if (profileError) {
    setProfileStatus(profileError, true);
    return;
  }

  const previousProfile = driverProfile;
  driverProfile = normalizeDriverProfile(nextProfile);

  if (!saveDriverProfileToStorage()) {
    driverProfile = previousProfile;
    setProfileStatus('Profile could not be saved. Current load records were not changed.', true);
    return;
  }

  renderProfileSummary();
  saveAppMeta();
  syncProfileToCloud();
  syncSettingsToCloud();
  setProfileStatus('Profile saved. New loads will use this driver and equipment.');
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

function collectSoftWarnings(values) {
  const warnings = [];
  const pickupDuration = durationBetween(values.arrivedPickupTime, values.loadedTime);
  const dropoffDuration = durationBetween(values.arrivedDropoffTime, values.completedTime);

  if (values.arrivedPickupTime && values.loadedTime && parseTimeToMinutes(values.loadedTime) < parseTimeToMinutes(values.arrivedPickupTime)) {
    warnings.push('Loading completion is earlier than arrival, so it will be treated as crossing midnight.');
  }

  if (values.arrivedDropoffTime && values.completedTime && parseTimeToMinutes(values.completedTime) < parseTimeToMinutes(values.arrivedDropoffTime)) {
    warnings.push('Offloading completion is earlier than arrival, so it will be treated as crossing midnight.');
  }

  if (pickupDuration > 720 || dropoffDuration > 720) {
    warnings.push('One stop has more than 12 hours on location. Review the times before saving.');
  }

  const payRange = getCompanyPayPeriodRange(daily.date.value || todayLocal());

  if (values.loadDate && payRange.start && payRange.end && !isDateInRange(values.loadDate, payRange.start, payRange.end)) {
    warnings.push('This work date is outside the pay period currently shown on the dashboard.');
  }

  return warnings;
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

  if (values.reRoutedMiles !== null && (!isFiniteNumber(values.reRoutedMiles) || values.reRoutedMiles < 0)) {
    messages.push('Re-routed Miles must be 0 or greater.');
    setFieldError('reRoutedMiles', 'Enter re-routed miles of 0 or greater, or leave it blank.');
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

  const warnings = collectSoftWarnings(values);

  if (warnings.length > 0) {
    validationSummary.className = 'validation-summary show warning';
    validationSummary.textContent = warnings[0];
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

  return savedLoads.find((load) => {
    if (load.id === excludedId || load.loadDate !== values.loadDate) {
      return false;
    }

    const ticketMatches = normalizeDuplicateValue(values.ticketNumber)
      && normalizeDuplicateValue(load.ticketNumber) === normalizeDuplicateValue(values.ticketNumber);
    const bolMatches = normalizeDuplicateValue(values.bolNumber)
      && normalizeDuplicateValue(load.bolNumber) === normalizeDuplicateValue(values.bolNumber);
    const jotformMatches = normalizeDuplicateValue(values.jotformConfirmationNumber)
      && normalizeDuplicateValue(load.jotformConfirmationNumber) === normalizeDuplicateValue(values.jotformConfirmationNumber);
    const loadNumberMatches = normalizeDuplicateValue(values.loadNumber)
      && normalizeDuplicateValue(load.loadNumber) === normalizeDuplicateValue(values.loadNumber);

    return ticketMatches || bolMatches || jotformMatches || loadNumberMatches;
  }) || null;
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
    updatedAt: new Date().toISOString(),
    ...values
  });
}

function setSaveButtonsBusy(isBusy) {
  [saveLoadButton, saveNextButton, saveDraftButton].forEach((button) => {
    if (button) {
      button.disabled = isBusy;
    }
  });
}

function queueLoadCommit(mode = 'save') {
  const values = getFormValues();

  if (!validate(values)) {
    renderSummary();
    return;
  }

  const record = buildLoadRecord(values);
  const duplicate = findLikelyDuplicate(values, editingLoadId);
  pendingCommitMode = mode;

  if (duplicate) {
    showDuplicateWarning(record);
    return;
  }

  commitLoadRecord(record, { startNext: mode === 'next' });
}

function saveLoad(event) {
  event.preventDefault();

  if (isSaving) {
    return;
  }

  queueLoadCommit('save');
}

function saveAndStartNextLoad() {
  if (isSaving) {
    return;
  }

  queueLoadCommit('next');
}

function commitLoadRecord(record, options = {}) {
  hideDuplicateWarning();
  isSaving = true;
  setSaveButtonsBusy(true);

  if (editingLoadId) {
    savedLoads = savedLoads.map((load) => (load.id === editingLoadId ? record : load));
    exitEditMode();
  } else {
    savedLoads.unshift(record);
  }

  daily.date.value = record.loadDate || daily.date.value;
  storeLoads();
  refreshAllDailyEarningsRecords();
  syncLoadToCloud(record);
  syncCurrentDateToCloud(record.loadDate);
  applyDailyAddOnsToControls();
  renderSummary();
  updateDailySummary();
  clearDraft();

  if (options.startNext) {
    startNextLoadFrom(record);
    showSaveMessage('Load saved. Next load is ready.');
  } else {
    showSaveMessage('Load saved successfully.');
    activateView('dashboard');
  }

  isSaving = false;
  setSaveButtonsBusy(false);
}

function exitEditMode() {
  editingLoadId = null;
  saveLoadButton.textContent = 'Save Load';
  editStatus.textContent = 'New entry';
}

function startNextLoadFrom(previousRecord) {
  const workDate = previousRecord.loadDate || daily.date.value || todayLocal();
  form.reset();
  clearValidation();
  hideDuplicateWarning();
  exitEditMode();
  daily.date.value = workDate;
  fields.loadDate.value = workDate;
  fields.loadStatus.value = COMPLETED_STATUS;
  applyProfileToNewLoad();

  if (appSettings.keepRouteForNextLoad) {
    fields.pickupLocation.value = previousRecord.pickupLocation || '';
    fields.dropoffLocation.value = previousRecord.dropoffLocation || '';
    fields.productType.value = previousRecord.productType || '';
    fields.loadedMiles.value = isFiniteNumber(previousRecord.loadedMiles) ? previousRecord.loadedMiles : '';
  }

  fields.loadNumber.value = getNextLoadNumber(workDate);
  fields.ticketNumber.value = '';
  fields.bolNumber.value = '';
  fields.jotformConfirmationNumber.value = '';
  fields.grossBarrels.value = '';
  fields.startMeterReading.value = '';
  fields.endMeterReading.value = '';
  fields.arrivedPickupTime.value = '';
  fields.loadedTime.value = '';
  fields.arrivedDropoffTime.value = '';
  fields.completedTime.value = '';
  fields.notes.value = '';
  applyDailyAddOnsToControls();
  renderSummary();
  activateView('new-load');
}

function clearForm() {
  form.reset();
  clearValidation();
  clearSaveMessage();
  hideDuplicateWarning();
  exitEditMode();
  fields.loadDate.value = daily.date.value || todayLocal();
  fields.loadStatus.value = COMPLETED_STATUS;
  applyProfileToNewLoad();
  ensureLoadNumber();
  applyDailyAddOnsToControls();
  renderSummary();
  clearDraft();
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
  activateView('new-load');

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
  deleteCloudLoad(loadId);
  syncCurrentDateToCloud(load.loadDate);
  hideDuplicateWarning();
  clearSaveMessage();

  if (editingLoadId === loadId) {
    clearForm();
  } else {
    renderSummary();
    updateDailySummary();
  }
}

function getLoadById(loadId) {
  return savedLoads.find((item) => item.id === loadId) || null;
}

function openLoadDetails(loadId, button) {
  const card = button?.closest ? button.closest('.load-card') : null;
  const details = card?.querySelector ? card.querySelector('.load-details') : null;

  if (details) {
    details.open = true;
    details.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  loadEntryForEdit(loadId);
}

function duplicateLoadEntry(loadId) {
  const load = getLoadById(loadId);

  if (!load) {
    return;
  }

  hideDuplicateWarning();
  clearValidation();
  clearSaveMessage();
  editingLoadId = null;
  saveLoadButton.textContent = 'Save Load';
  editStatus.textContent = `Duplicating ${load.loadNumber || load.ticketNumber || 'saved load'}`;

  fieldIds.forEach((id) => {
    const key = toKey(id);
    const field = fields[key];

    if (field) {
      field.value = load[key] === null || load[key] === undefined ? '' : load[key];
    }
  });

  daily.date.value = load.loadDate || daily.date.value;
  fields.loadNumber.value = getNextLoadNumber(load.loadDate || daily.date.value);
  fields.ticketNumber.value = '';
  fields.bolNumber.value = '';
  fields.jotformConfirmationNumber.value = '';
  fields.startMeterReading.value = '';
  fields.endMeterReading.value = '';
  fields.grossBarrels.value = '';
  fields.arrivedPickupTime.value = '';
  fields.loadedTime.value = '';
  fields.arrivedDropoffTime.value = '';
  fields.completedTime.value = '';
  fields.notes.value = '';
  applyDailyAddOnsToControls();
  renderSummary();
  updateDailySummary();
  activateView('new-load');
  showSaveMessage('Duplicated load loaded into the form. Review it, then tap Save Load to create a new record.');

  if (form.scrollIntoView) {
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function buildLoadReportMarkup(load, dailySummary = null) {
  const summaryRecord = dailySummary || getDailyEarningsSummary(load.loadDate);
  const rows = [
    ['Driver name', load.driverName],
    ['Truck number', load.truckNumber],
    ['Trailer number', load.trailerNumber],
    ['Work date', load.loadDate],
    ['Load number', load.loadNumber],
    ['Ticket number', load.ticketNumber],
    ['BOL number', load.bolNumber],
    ['Pickup location', load.pickupLocation],
    ['Delivery location', load.dropoffLocation],
    ['Gross barrels', formatBarrels(load.grossBarrels)],
    ['Regular miles', formatMiles(load.regularMiles)],
    ['Re-routed miles', formatMiles(load.reRoutedMiles)],
    ['Total miles', formatMiles(load.totalMilesIncludingReRoute)],
    ['Load earnings', formatMoney(load.estimatedPay)],
    ['Wait-time earnings', formatMoney(load.waitPay)],
    ['Total load pay', formatMoney(load.estimatedEntryPay)],
    ['Daily trainer pay', formatMoney(summaryRecord.trainerPay)],
    ['Daily total earnings', formatMoney(summaryRecord.totalEstimatedDailyEarnings)],
    ['Notes', load.notes || '-']
  ];

  return rows.map(([label, value]) => `
    <div class="print-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || '-')}</strong>
    </div>
  `).join('');
}

function openPrintWindow(title, bodyMarkup) {
  const printWindow = globalThis.open ? globalThis.open('', '_blank', 'noopener,noreferrer') : null;

  if (!printWindow || !printWindow.document) {
    globalThis.print?.();
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${escapeHtml(title)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 24px; color: #17202a; }
          h1 { margin: 0 0 6px; font-size: 24px; }
          .muted { color: #5f6c7b; margin: 0 0 18px; }
          .print-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .print-row { border: 1px solid #d8e1e8; border-radius: 8px; padding: 10px; display: grid; gap: 5px; }
          .print-row span { color: #5f6c7b; font-size: 12px; font-weight: 700; }
          .print-row strong { font-size: 15px; overflow-wrap: anywhere; }
          @media print { body { margin: 16px; } }
        </style>
      </head>
      <body>
        ${bodyMarkup}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function printLoadEntry(loadId) {
  const load = getLoadById(loadId);

  if (!load) {
    return;
  }

  openPrintWindow(
    `Oilfield Load ${load.loadNumber || load.ticketNumber || ''}`.trim(),
    `
      <h1>Oilfield Load Report</h1>
      <p class="muted">Generated ${new Date().toLocaleString()}</p>
      <div class="print-grid">${buildLoadReportMarkup(load)}</div>
    `
  );
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportLoadEntry(loadId) {
  const load = getLoadById(loadId);

  if (!load) {
    return;
  }

  downloadJson(`oilfield-load-${load.loadDate || 'undated'}-${load.loadNumber || load.id}.json`, {
    format: `${BACKUP_FORMAT}-single-load`,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    load
  });
}

function handleSavedCardAction(event) {
  const button = event.target.closest ? event.target.closest('button[data-action]') : null;

  if (!button) {
    return;
  }

  if (button.dataset.action === 'open') {
    openLoadDetails(button.dataset.id, button);
  }

  if (button.dataset.action === 'edit') {
    loadEntryForEdit(button.dataset.id);
  }

  if (button.dataset.action === 'duplicate') {
    duplicateLoadEntry(button.dataset.id);
  }

  if (button.dataset.action === 'print') {
    printLoadEntry(button.dataset.id);
  }

  if (button.dataset.action === 'export') {
    exportLoadEntry(button.dataset.id);
  }

  if (button.dataset.action === 'delete') {
    deleteLoadEntry(button.dataset.id);
  }
}

function handleSelectedDateChange() {
  applyDailyAddOnsToControls();

  if (!editingLoadId) {
    fields.loadDate.value = daily.date.value;
    ensureLoadNumber();
  }

  if (savedFilters.date && (!savedFilters.date.value || savedFilters.scope?.value === 'selected-date')) {
    savedFilters.date.value = daily.date.value;
  }

  renderSummary();
  updateDailySummary();
}

function handleLoadDateChange() {
  if (fields.loadDate.value) {
    daily.date.value = fields.loadDate.value;
    ensureLoadNumber();
    applyDailyAddOnsToControls();
    updateDailySummary();
  }
}

function handleAddOnChange() {
  clearSaveMessage();
  saveDailyAddOnFromControls();
  refreshAllDailyEarningsRecords();
  syncCurrentDateToCloud(daily.date.value);
  updateDailySummary();
}

function handlePayPeriodChange() {
  const range = getCompanyPayPeriodRange(daily.date.value || todayLocal());
  daily.payPeriodStart.value = range.start;
  daily.payPeriodEnd.value = range.end;
  updateDailySummary();
}

function handleSavedFiltersChange() {
  renderSavedLoads();
}

function handleFormInput(event) {
  clearValidation();
  clearSaveMessage();
  hideDuplicateWarning();

  if (event.target === fields.loadDate) {
    handleLoadDateChange();
  }

  renderSummary();
  scheduleDraftSave();
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
    'Regular miles',
    'Re-routed miles',
    'Total miles including re-route',
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
    'Load site duration',
    'Load wait time',
    'Unload site duration',
    'Unload wait time',
    'Total paid wait time',
    'Wait pay',
    'Daily trainer pay',
    'Estimated total pay',
    'Total cycle time',
    'Notes'
  ];

  const rows = getUniqueSavedLoads(savedLoads).map((load) => {
    const dailyRecord = getDailyEarningsSummary(load.loadDate);

    return [
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
      formatCsvNumber(load.regularMiles, 1),
      formatCsvNumber(load.reRoutedMiles, 1),
      formatCsvNumber(load.totalMilesIncludingReRoute, 1),
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
      formatCsvNumber(dailyRecord.trainerPay),
      formatCsvNumber(load.estimatedEntryPay),
      formatDuration(load.cycleTimeMinutes),
      load.notes
    ];
  });

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
    'Total loads hauled',
    'Completed load count',
    'Reject count',
    'Regular miles',
    'Total re-routed miles',
    'Total miles including re-route',
    'Total gross barrels',
    'Total barrels offloaded',
    'Total difference vs gross barrels',
    'Total completed load pay',
    'Total reject pay',
    'Total load wait time',
    'Total unload wait time',
    'Total paid wait time',
    'Total wait pay',
    'Per diem applied',
    'Per diem amount',
    'Sleeper berth applied',
    'Sleeper berth amount',
    'Trainer pay applied',
    'Trainer pay amount',
    'Total estimated daily earnings',
    'Daily earnings notes'
  ];

  const rows = getDailyEarningsDates().map((date) => {
    const record = dailyEarningsRecords[date] || getDailyEarningsSummary(date);

    return [
      record.date,
      record.loadRecordCount,
      record.completedLoadCount,
      record.rejectCount,
      formatCsvNumber(record.totalLoadedMiles, 1),
      formatCsvNumber(record.totalReRoutedMiles, 1),
      formatCsvNumber(record.totalMilesIncludingReRoute, 1),
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
      record.trainerPayApplied ? 'Yes' : 'No',
      formatCsvNumber(record.trainerPay),
      formatCsvNumber(record.totalEstimatedDailyEarnings),
      record.notes
    ];
  });

  downloadCsv(`personal-oilfield-daily-earnings-${todayLocal()}.csv`, headers, rows);
}

function getTrackerSnapshot() {
  refreshAllDailyEarningsRecords();
  saveAppMeta();

  return {
    format: BACKUP_FORMAT,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    recordCount: countUniqueLoads(),
    source: isCloudSignedIn() && cloudSync.source === 'cloud' ? 'firestore' : 'localStorage',
    firebase: {
      projectId: FIREBASE_CONFIG.projectId,
      signedIn: Boolean(cloudSync.user),
      signedInEmail: cloudSync.user?.email || '',
      cloudAuthoritative: isCloudMigrationComplete() || appMeta.cloudSync?.authoritative === true
    },
    storageKeys: {
      loads: STORAGE_KEY,
      dailyAddOns: ADD_ON_STORAGE_KEY,
      dailySummaries: EARNINGS_STORAGE_KEY,
      profile: PROFILE_STORAGE_KEY,
      metadata: META_STORAGE_KEY,
      settings: SETTINGS_STORAGE_KEY,
      favoriteRoutes: FAVORITE_ROUTES_STORAGE_KEY
    },
    data: {
      loads: getUniqueSavedLoads(savedLoads),
      dailyAddOns,
      dailySummaries: dailyEarningsRecords,
      profile: driverProfile,
      metadata: appMeta,
      settings: appSettings,
      favoriteRoutes
    }
  };
}

function exportJsonBackup() {
  const snapshot = getTrackerSnapshot();
  downloadJson(`personal-oilfield-load-tracker-backup-${todayLocal()}.json`, snapshot);
  setBackupStatus(`Exported JSON backup with ${snapshot.recordCount} ${snapshot.recordCount === 1 ? 'record' : 'records'}.`);
}

function normalizeImportedLoadList(rawLoads) {
  if (!Array.isArray(rawLoads)) {
    throw new Error('Backup file does not contain a load record list.');
  }

  const seenIds = new Set();
  const duplicateIds = [];
  const loads = [];

  rawLoads.forEach((rawLoad, index) => {
    if (!isPlainObject(rawLoad)) {
      throw new Error('Backup file contains a load record that is not an object.');
    }

    const normalized = normalizeSavedLoad({
      ...rawLoad,
      id: rawLoad.id || buildStableFallbackId(rawLoad, index, 'import-missing-id')
    });

    if (seenIds.has(normalized.id)) {
      duplicateIds.push(normalized.id);
      return;
    }

    seenIds.add(normalized.id);
    loads.push(normalized);
  });

  return { loads, duplicateIds };
}

function normalizeImportedAddOns(rawAddOns) {
  if (rawAddOns === undefined || rawAddOns === null) {
    return {};
  }

  if (!isPlainObject(rawAddOns) && !Array.isArray(rawAddOns)) {
    throw new Error('Backup daily add-ons are not in a usable format.');
  }

  return normalizeDailyAddOns(rawAddOns);
}

function normalizeImportedSummaries(rawSummaries) {
  if (rawSummaries === undefined || rawSummaries === null) {
    return {};
  }

  if (!isPlainObject(rawSummaries)) {
    throw new Error('Backup daily summaries are not in a usable format.');
  }

  return rawSummaries;
}

function parseBackupText(text) {
  let parsed;

  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Choose a valid JSON backup file.');
  }

  const data = parsed?.data || parsed;
  const rawLoads = Array.isArray(parsed) ? parsed : (data.loads || (data.load ? [data.load] : undefined));
  const normalizedLoads = normalizeImportedLoadList(rawLoads);

  return {
    format: parsed.format || 'legacy-json',
    appVersion: parsed.appVersion || '',
    dataSchemaVersion: parsed.dataSchemaVersion || 1,
    loads: normalizedLoads.loads,
    skippedDuplicateIds: normalizedLoads.duplicateIds,
    dailyAddOns: normalizeImportedAddOns(data.dailyAddOns || data.addOns || {}),
    dailySummaries: normalizeImportedSummaries(data.dailySummaries || data.earnings || {}),
    profile: normalizeDriverProfile(data.profile || {}),
    metadata: isPlainObject(data.metadata) ? data.metadata : {},
    settings: normalizeAppSettings(data.settings || {}),
    favoriteRoutes: normalizeFavoriteRoutes(data.favoriteRoutes || [])
  };
}

function mergeImportedAddOns(currentAddOns, importedAddOns) {
  const merged = { ...currentAddOns };

  Object.entries(importedAddOns).forEach(([date, addOn]) => {
    if (!merged[date]) {
      merged[date] = addOn;
    }
  });

  return merged;
}

function mergeImportedProfile(currentProfile, importedProfile) {
  return normalizeDriverProfile({
    ...importedProfile,
    ...currentProfile,
    driverName: currentProfile.driverName || importedProfile.driverName || '',
    truckNumber: currentProfile.truckNumber || importedProfile.truckNumber || '',
    trailerNumber: currentProfile.trailerNumber || importedProfile.trailerNumber || ''
  });
}

function buildImportedState(imported, mode) {
  if (mode === 'replace') {
    return {
      loads: imported.loads,
      dailyAddOns: imported.dailyAddOns,
      dailySummaries: imported.dailySummaries,
      profile: imported.profile,
      settings: imported.settings,
      favoriteRoutes: imported.favoriteRoutes,
      metadata: {
        ...imported.metadata,
        importedAt: new Date().toISOString(),
        importMode: mode
      },
      stats: {
        importedCount: imported.loads.length,
        skippedCount: imported.skippedDuplicateIds.length,
        replacedCount: countUniqueLoads()
      }
    };
  }

  const currentById = new Map(getUniqueSavedLoads().map((load) => [load.id, load]));
  const newLoads = [];
  let skippedCount = imported.skippedDuplicateIds.length;

  imported.loads.forEach((load) => {
    if (currentById.has(load.id)) {
      skippedCount += 1;
      return;
    }

    newLoads.push(load);
  });

  return {
    loads: [...newLoads, ...getUniqueSavedLoads()],
    dailyAddOns: mergeImportedAddOns(dailyAddOns, imported.dailyAddOns),
    dailySummaries: {
      ...imported.dailySummaries,
      ...dailyEarningsRecords
    },
    profile: mergeImportedProfile(driverProfile, imported.profile),
    settings: normalizeAppSettings({
      ...imported.settings,
      ...appSettings,
      payRates: {
        ...(imported.settings?.payRates || {}),
        ...(appSettings?.payRates || {})
      }
    }),
    favoriteRoutes: normalizeFavoriteRoutes([...favoriteRoutes, ...imported.favoriteRoutes]),
    metadata: {
      ...appMeta,
      lastImport: {
        importedAt: new Date().toISOString(),
        importMode: mode,
        importedCount: newLoads.length,
        skippedDuplicateCount: skippedCount
      }
    },
    stats: {
      importedCount: newLoads.length,
      skippedCount,
      replacedCount: 0
    }
  };
}

function commitImportedState(nextState) {
  const previousState = {
    loads: savedLoads,
    dailyAddOns,
    dailyEarningsRecords,
    driverProfile,
    appMeta,
    appSettings,
    favoriteRoutes
  };
  const previousStorage = {
    [STORAGE_KEY]: localStorage.getItem(STORAGE_KEY),
    [ADD_ON_STORAGE_KEY]: localStorage.getItem(ADD_ON_STORAGE_KEY),
    [EARNINGS_STORAGE_KEY]: localStorage.getItem(EARNINGS_STORAGE_KEY),
    [PROFILE_STORAGE_KEY]: localStorage.getItem(PROFILE_STORAGE_KEY),
    [META_STORAGE_KEY]: localStorage.getItem(META_STORAGE_KEY),
    [SETTINGS_STORAGE_KEY]: localStorage.getItem(SETTINGS_STORAGE_KEY),
    [FAVORITE_ROUTES_STORAGE_KEY]: localStorage.getItem(FAVORITE_ROUTES_STORAGE_KEY)
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState.loads));
    localStorage.setItem(ADD_ON_STORAGE_KEY, JSON.stringify(nextState.dailyAddOns));
    localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(nextState.dailySummaries));
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextState.profile));
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(nextState.metadata));
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextState.settings));
    localStorage.setItem(FAVORITE_ROUTES_STORAGE_KEY, JSON.stringify(nextState.favoriteRoutes));
  } catch {
    Object.entries(previousStorage).forEach(([key, value]) => {
      try {
        if (value !== null) {
          localStorage.setItem(key, value);
        }
      } catch {
        addStorageWarning(`Warning: ${key} could not be restored after a failed import. Check the latest JSON backup before closing the app.`);
      }
    });

    savedLoads = previousState.loads;
    dailyAddOns = previousState.dailyAddOns;
    dailyEarningsRecords = previousState.dailyEarningsRecords;
    driverProfile = previousState.driverProfile;
    appMeta = previousState.appMeta;
    appSettings = previousState.appSettings;
    favoriteRoutes = previousState.favoriteRoutes;
    return false;
  }

  savedLoads = nextState.loads.map(normalizeSavedLoad);
  dailyAddOns = normalizeDailyAddOns(nextState.dailyAddOns);
  dailyEarningsRecords = nextState.dailySummaries;
  driverProfile = normalizeDriverProfile(nextState.profile);
  appMeta = isPlainObject(nextState.metadata) ? nextState.metadata : {};
  appSettings = normalizeAppSettings(nextState.settings);
  favoriteRoutes = normalizeFavoriteRoutes(nextState.favoriteRoutes);
  refreshAllDailyEarningsRecords();
  applyProfileToControls();
  applyDailyAddOnsToControls();
  applyPaySettingsToControls();
  renderFavoriteRoutes();
  renderSummary();
  updateDailySummary();
  saveAppMeta();
  syncImportedStateToCloud(nextState, nextState.metadata?.importMode || nextState.stats?.importMode || importMode?.value || 'merge');
  return true;
}

function importJsonBackup() {
  const file = importBackupFile?.files?.[0];

  if (!file) {
    setBackupStatus('Choose a JSON backup file before importing.', true);
    return;
  }

  const mode = importMode?.value || 'merge';

  if (mode === 'replace') {
    const confirmed = typeof globalThis.confirm === 'function'
      ? globalThis.confirm(`Replace current tracker data? This will replace ${countUniqueLoads()} current saved load records only after the backup file is validated.`)
      : false;

    if (!confirmed) {
      setBackupStatus('Import canceled. Current records were not changed.');
      return;
    }
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = parseBackupText(String(reader.result || ''));
      const nextState = buildImportedState(imported, mode);

      if (mode === 'replace') {
        downloadJson(`personal-oilfield-before-replace-import-${todayLocal()}.json`, getTrackerSnapshot());
      }

      const committed = commitImportedState(nextState);

      if (!committed) {
        setBackupStatus('Import failed while saving. Current records were restored.', true);
        return;
      }

      const action = mode === 'replace' ? 'Replaced' : 'Imported';
      setBackupStatus(`${action} ${nextState.stats.importedCount} ${nextState.stats.importedCount === 1 ? 'record' : 'records'}. Skipped ${nextState.stats.skippedCount} duplicate ${nextState.stats.skippedCount === 1 ? 'record' : 'records'}. Current total: ${countUniqueLoads()}.`);
    } catch (error) {
      setBackupStatus(`${error.message} Current records were not changed.`, true);
    }
  };

  reader.onerror = () => {
    setBackupStatus('Backup file could not be read. Current records were not changed.', true);
  };

  reader.readAsText(file);
}

function printDailyReport() {
  const date = daily.date.value;
  const record = getDailyEarningsSummary(date);
  const firstLoad = getLoadsForDate(date)[0] || {};
  const rows = [
    ['Driver name', firstLoad.driverName || driverProfile.driverName || ''],
    ['Truck number', firstLoad.truckNumber || driverProfile.truckNumber || ''],
    ['Trailer number', firstLoad.trailerNumber || driverProfile.trailerNumber || ''],
    ['Work date', date],
    ['Total loads hauled', record.loadRecordCount],
    ['Load earnings', formatMoney(record.completedLoadPay + record.rejectPay)],
    ['Wait-time earnings', formatMoney(record.totalWaitPay)],
    ['Trainer pay', formatMoney(record.trainerPay)],
    ['Total earnings', formatMoney(record.totalEstimatedDailyEarnings)],
    ['Total gross barrels', formatBarrels(record.totalGrossBarrels)],
    ['Total mileage', formatMiles(record.totalMilesIncludingReRoute)],
    ['Total wait time', formatDuration(record.totalPaidWaitMinutes)],
    ['Notes', record.notes || '-']
  ];
  const markup = rows.map(([label, value]) => `
    <div class="print-row">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value || '-')}</strong>
    </div>
  `).join('');

  openPrintWindow(
    `Oilfield Daily Report ${date || ''}`.trim(),
    `
      <h1>Oilfield Daily Earnings Report</h1>
      <p class="muted">Generated ${new Date().toLocaleString()}</p>
      <div class="print-grid">${markup}</div>
    `
  );
}

function getPreviousPayPeriodRange(dateValue) {
  const current = getCompanyPayPeriodRange(dateValue);
  const start = parseLocalDate(current.start);

  if (!start) {
    return { start: '', end: '' };
  }

  const previousDate = new Date(start);
  previousDate.setDate(previousDate.getDate() - 1);
  return getCompanyPayPeriodRange(formatLocalDate(previousDate));
}

function getReportRange() {
  const mode = reportControls.mode?.value || 'selected-date';
  const selectedDate = daily.date.value || todayLocal();

  if (mode === 'current-pay-period') {
    return getCompanyPayPeriodRange(selectedDate);
  }

  if (mode === 'previous-pay-period') {
    return getPreviousPayPeriodRange(selectedDate);
  }

  if (mode === 'selected-month') {
    return getMonthRange(selectedDate);
  }

  if (mode === 'custom') {
    return {
      start: reportControls.start?.value || selectedDate,
      end: reportControls.end?.value || selectedDate
    };
  }

  return { start: selectedDate, end: selectedDate };
}

function summarizeReportRange(startDate, endDate) {
  const records = startDate === endDate ? getLoadsForDate(startDate) : getLoadsForRange(startDate, endDate);
  const dates = new Set(records.map((load) => load.loadDate).filter(Boolean));
  const summaries = [...dates].map((date) => getDailyEarningsSummary(date));
  const completedRecords = records.filter(isCompleted);
  const rejectRecords = records.filter(isReject);

  return {
    start: startDate,
    end: endDate,
    loadRecordCount: records.length,
    completedLoadCount: completedRecords.length,
    rejectCount: rejectRecords.length,
    totalGrossBarrels: sum(completedRecords, 'grossBarrels'),
    totalBarrelsOffloaded: sum(records, 'barrelsOffloaded'),
    totalLoadedMiles: sum(records, 'loadedMiles'),
    totalReRoutedMiles: sum(records, 'reRoutedMiles'),
    totalPaidPickupWaitMinutes: sum(records, 'paidPickupWaitMinutes'),
    totalPaidDropoffWaitMinutes: sum(records, 'paidDropoffWaitMinutes'),
    totalPaidWaitMinutes: sum(records, 'totalPaidWaitMinutes'),
    totalWaitPay: sum(records, 'waitPay'),
    trainerPay: sum(summaries, 'trainerPay'),
    perDiemPay: sum(summaries, 'perDiemPay'),
    sleeperBerthPay: sum(summaries, 'sleeperBerthPay'),
    rejectPay: sum(rejectRecords, 'estimatedPay'),
    totalEstimatedEarnings: sum(summaries, 'totalEstimatedDailyEarnings')
  };
}

function reportMetric(label, value, isTotal = false) {
  return `<div class="result-row${isTotal ? ' total-row' : ''}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderReportSummary() {
  if (!reportControls.summaryGrid) {
    return;
  }

  const range = getReportRange();

  if (reportControls.mode?.value !== 'custom') {
    if (reportControls.start) {
      reportControls.start.value = range.start;
    }

    if (reportControls.end) {
      reportControls.end.value = range.end;
    }
  }

  const report = summarizeReportRange(range.start, range.end);
  reportControls.summaryGrid.innerHTML = [
    reportMetric('Report start', report.start || '-'),
    reportMetric('Report end', report.end || '-'),
    reportMetric('Loads hauled', String(report.loadRecordCount)),
    reportMetric('Completed loads', String(report.completedLoadCount)),
    reportMetric('Rejects', String(report.rejectCount)),
    reportMetric('Gross barrels', formatBarrels(report.totalGrossBarrels)),
    reportMetric('Offloaded barrels', formatBarrels(report.totalBarrelsOffloaded)),
    reportMetric('Loaded miles', formatMiles(report.totalLoadedMiles)),
    reportMetric('Rerouted miles', formatMiles(report.totalReRoutedMiles)),
    reportMetric('Loading wait time', formatDuration(report.totalPaidPickupWaitMinutes)),
    reportMetric('Offloading wait time', formatDuration(report.totalPaidDropoffWaitMinutes)),
    reportMetric('Total paid wait', formatDuration(report.totalPaidWaitMinutes)),
    reportMetric('Wait-time earnings', formatMoney(report.totalWaitPay)),
    reportMetric('Trainer pay', formatMoney(report.trainerPay)),
    reportMetric('Per diem', formatMoney(report.perDiemPay)),
    reportMetric('Sleeper pay', formatMoney(report.sleeperBerthPay)),
    reportMetric('Reject pay', formatMoney(report.rejectPay)),
    reportMetric('Estimated total earnings', formatMoney(report.totalEstimatedEarnings), true)
  ].join('');
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

  if (settingsAppVersion) {
    settingsAppVersion.textContent = APP_VERSION;
  }

  if (settingsDataVersion) {
    settingsDataVersion.textContent = String(DATA_SCHEMA_VERSION);
  }

  daily.date.value = daily.date.value || today;
  const initialPayPeriod = getCompanyPayPeriodRange(daily.date.value);
  daily.payPeriodStart.value = initialPayPeriod.start;
  daily.payPeriodEnd.value = initialPayPeriod.end;
  savedFilters.date.value = savedFilters.date.value || daily.date.value;
  fields.loadDate.value = fields.loadDate.value || daily.date.value;
  fields.loadStatus.value = fields.loadStatus.value || COMPLETED_STATUS;
  ensureLoadNumber();
  applyProfileToControls();
  applyProfileToNewLoad();
  applyPaySettingsToControls();
  renderFavoriteRoutes();
  applyDailyAddOnsToControls();
  refreshAllDailyEarningsRecords();
  saveAppMeta();
  renderStorageWarning();
  renderSummary();
  updateDailySummary();
  restoreDraftIfAvailable();
  activateView('dashboard');
  registerServiceWorker();
  initializeFirebaseSync();
}

form.addEventListener('submit', saveLoad);
form.addEventListener('input', handleFormInput);
form.addEventListener('change', handleFormInput);
navButtons.forEach((button) => button.addEventListener('click', handleNavigationClick));
daily.date.addEventListener('input', handleSelectedDateChange);
daily.date.addEventListener('change', handleSelectedDateChange);
daily.payPeriodStart.addEventListener('input', handlePayPeriodChange);
daily.payPeriodStart.addEventListener('change', handlePayPeriodChange);
daily.payPeriodEnd.addEventListener('input', handlePayPeriodChange);
daily.payPeriodEnd.addEventListener('change', handlePayPeriodChange);
Object.values(savedFilters).forEach((field) => {
  field.addEventListener('input', handleSavedFiltersChange);
  field.addEventListener('change', handleSavedFiltersChange);
});
Object.values(extraSavedFilters).forEach((field) => {
  field?.addEventListener('input', handleSavedFiltersChange);
  field?.addEventListener('change', handleSavedFiltersChange);
});
Object.values(reportControls).forEach((field) => {
  if (field && field !== reportControls.summaryGrid) {
    field.addEventListener('input', renderReportSummary);
    field.addEventListener('change', renderReportSummary);
  }
});
Object.values(addOns).forEach((field) => {
  field.addEventListener('input', handleAddOnChange);
  field.addEventListener('change', handleAddOnChange);
});
saveAnywayButton.addEventListener('click', () => {
  if (pendingDuplicateRecord) {
    commitLoadRecord(pendingDuplicateRecord, { startNext: pendingCommitMode === 'next' });
  }
});
cancelDuplicateButton.addEventListener('click', hideDuplicateWarning);
clearFormButton.addEventListener('click', clearForm);
saveNextButton?.addEventListener('click', saveAndStartNextLoad);
saveDraftButton?.addEventListener('click', () => saveDraftNow('Draft saved.'));
continueDraftButton?.addEventListener('click', () => {
  const draft = readDraft();

  if (draft && applyDraft(draft)) {
    activateView('new-load');
  }
});
savedLoadCards.addEventListener('click', handleSavedCardAction);
profileControls.saveButton.addEventListener('click', saveDriverProfile);
paySettingsControls.saveButton?.addEventListener('click', savePaySettingsFromControls);
favoriteRouteControls.saveButton?.addEventListener('click', saveFavoriteRouteFromControls);
favoriteRouteControls.select?.addEventListener('change', () => applyFavoriteRoute(favoriteRouteControls.select.value));
favoriteRouteControls.list?.addEventListener('click', (event) => {
  const button = event.target.closest ? event.target.closest('[data-delete-route-id]') : null;

  if (button) {
    deleteFavoriteRoute(button.dataset.deleteRouteId);
  }
});
manualSyncButton?.addEventListener('click', syncAllCurrentDataToCloud);
downloadLogButton.addEventListener('click', downloadLoadLog);
downloadEarningsButton.addEventListener('click', downloadDailyEarningsSummary);
printDailyReportButton.addEventListener('click', printDailyReport);
exportBackupButton.addEventListener('click', exportJsonBackup);
importBackupButton.addEventListener('click', importJsonBackup);
checkUpdatesButton.addEventListener('click', checkForUpdates);
updateNowButton.addEventListener('click', activateWaitingUpdate);
authControls.form?.addEventListener('submit', handleSignIn);
authControls.signOutButton?.addEventListener('click', handleSignOut);
authControls.downloadBeforeMigrationButton?.addEventListener('click', downloadBackupBeforeMigration);
authControls.startMigrationButton?.addEventListener('click', migrateLocalDataToFirebase);
globalThis.addEventListener?.('beforeunload', warnBeforeLeavingUnsaved);

initialize();
