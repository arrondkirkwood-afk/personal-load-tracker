const APP_VERSION = "1.13.0";
const DATA_SCHEMA_VERSION = 2;
const VACATION_DAILY_RATE = 270;
const APP_CACHE_PREFIX = 'personal-oilfield-load-tracker-';
const APP_CACHE_NAME = `${APP_CACHE_PREFIX}v${APP_VERSION}`;
const APP_RUNTIME = detectAppRuntime();
const STORAGE_KEY = 'personalOilfieldLoadTracker.loads';
const ADD_ON_STORAGE_KEY = 'personalOilfieldLoadTracker.dailyAddOns';
const DEFAULT_FAIR_DAY_GOAL = 280;
const DEFAULT_EXCELLENT_DAY_GOAL = 300;
const DEFAULT_DAILY_COMPLETED_LOAD_PAY_GOAL = DEFAULT_EXCELLENT_DAY_GOAL;
const EARNINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.dailySummaries';
const PROFILE_STORAGE_KEY = 'personalOilfieldLoadTracker.profile';
const META_STORAGE_KEY = 'personalOilfieldLoadTracker.meta';
const SETTINGS_STORAGE_KEY = 'personalOilfieldLoadTracker.settings';
const FAVORITE_ROUTES_STORAGE_KEY = 'personalOilfieldLoadTracker.favoriteRoutes';
const DRAFT_STORAGE_KEY = 'personalOilfieldLoadTracker.currentDraft';
const PAID_TIME_STORAGE_KEY = 'personalOilfieldLoadTracker.paidTime';
const PAID_TIME_DRAFT_STORAGE_KEY = 'personalOilfieldLoadTracker.paidTimeDraft';
const MIGRATION_BACKUP_STORAGE_KEY = 'personalOilfieldLoadTracker.preMigrationBackup.v2';
const FIREBASE_MIGRATION_BACKUP_STORAGE_KEY = 'personalOilfieldLoadTracker.firebaseMigrationSafetyBackup.v3';
const CLOUD_MERGE_RECOVERY_STORAGE_KEY = 'personalOilfieldLoadTracker.preCloudMergeRecovery.v1';
const FIRESTORE_CACHE_RECOVERY_STORAGE_KEY = 'personalOilfieldLoadTracker.preFirestoreCacheReset.v1';
const DEADHEAD_MAPPING_BACKUP_STORAGE_KEY = 'personalOilfieldLoadTracker.preDeadheadMappingBackup.v1';
const FIRESTORE_CACHE_GENERATION = 2;
const LEGACY_STORAGE_KEY = 'personalOilfieldLoadTrackerLog';
const LEGACY_ADD_ON_STORAGE_KEY = 'personalOilfieldDailyEarningsAddOns';
const LEGACY_EARNINGS_STORAGE_KEY = 'personalOilfieldDailyEarningsRecords';
const BACKUP_FORMAT = 'personal-oilfield-load-tracker-backup';
const CLOUD_MIGRATION_VERSION = 1;
const FIREBASE_SDK_VERSION = '12.16.0';
const CLOUD_LISTENER_TIMEOUT_MS = 18000;
const CLOUD_RESUME_STALE_MS = 10000;
const CLOUD_WRITE_STALL_MS = 10000;
const FIRESTORE_BATCH_WRITE_LIMIT = 450;
const PENDING_DELETE_GROUPS = ['loads', 'dailyAddOns', 'favoriteRoutes', 'paidTime'];
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
const US_STATE_ABBREVIATIONS = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];
const DEFAULT_PAY_SETTINGS = {
  rejectPay: 20,
  perDiemPay: 50,
  sleeperBerthPay: 60,
  trainerPay: 50,
  waitPayRate: 24,
  deadheadHourlyRate: 24,
  truckWashHourlyRate: 24,
  breakdownHourlyRate: 24,
  otherHourlyRate: 24
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
  'lease-number',
  'load-status',
  'dispatcher',
  'product-type',
  'pickup-location',
  'pickup-state',
  'dropoff-location',
  'dropoff-state',
  'gross-barrels',
  'api-gravity',
  'load-temperature',
  'bsw-percentage',
  'load-weight',
  'loaded-miles',
  're-routed-miles',
  'deadhead-start-time',
  'deadhead-end-time',
  'deadhead-miles',
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
  'load-temperature',
  'bsw-percentage',
  'load-weight',
  'loaded-miles',
  're-routed-miles',
  'deadhead-miles',
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
  loadWeight: document.getElementById('load-weight-error'),
  loadedMiles: document.getElementById('loaded-miles-error'),
  reRoutedMiles: document.getElementById('re-routed-miles-error'),
  deadheadMiles: document.getElementById('deadhead-miles-error'),
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
  totalEarnings: document.getElementById('daily-total-earnings'),
  todayCompleted: document.getElementById('today-completed-loads'),
  todayRejects: document.getElementById('today-rejects'),
  todayCompletedPay: document.getElementById('today-completed-pay'),
  todayHourlyPay: document.getElementById('today-hourly-pay'),
  todayVacationPay: document.getElementById('today-vacation-pay'),
  todayOtherPaidTime: document.getElementById('today-other-paid-time'),
  todayWaitPay: document.getElementById('today-wait-pay'),
  todayAddOns: document.getElementById('today-add-ons'),
  todayDutyTime: document.getElementById('today-duty-time'),
  todayEffectiveHourly: document.getElementById('today-effective-hourly')
};
const dailyGoal = {
  card: document.getElementById('daily-goal-card'),
  completedPay: document.getElementById('daily-goal-completed-pay'),
  goal: document.getElementById('daily-goal-amount'),
  status: document.getElementById('daily-goal-status'),
  difference: document.getElementById('daily-goal-difference'),
  fairStatus: document.getElementById('daily-fair-goal-status'),
  fairDifference: document.getElementById('daily-fair-goal-difference')
};

const dashboard = {
  totalLoadsHauled: document.getElementById('total-loads-hauled'),
  currentWorkDate: document.getElementById('current-work-date'),
  loadsHauledPayPeriod: document.getElementById('loads-hauled-pay-period'),
  loadsHauledMonth: document.getElementById('loads-hauled-month'),
  loadsHauledSelectedDate: document.getElementById('loads-hauled-selected-date')
};

const payPeriodSummary = {
  completedCount: document.getElementById('pay-period-completed-count'),
  rejectCount: document.getElementById('pay-period-reject-count'),
  assignmentCount: document.getElementById('pay-period-assignment-count'),
  totalEarnings: document.getElementById('pay-period-total-earnings'),
  trainerPay: document.getElementById('pay-period-trainer-pay'),
  perDiemPay: document.getElementById('pay-period-per-diem-pay'),
  sleeperPay: document.getElementById('pay-period-sleeper-pay'),
  rejectPay: document.getElementById('pay-period-reject-pay'),
  waitPay: document.getElementById('pay-period-wait-pay'),
  fairGoalMet: document.getElementById('pay-period-fair-goal-met'),
  goalMet: document.getElementById('pay-period-goal-met'),
  goalBelow: document.getElementById('pay-period-goal-below'),
  goalAverage: document.getElementById('pay-period-goal-average'),
  extendedDays: document.getElementById('pay-period-extended-days'),
  fourteenDays: document.getElementById('pay-period-fourteen-days')
};
const monthSummary = {
  completedCount: document.getElementById('month-completed-count'), rejectCount: document.getElementById('month-reject-count'),
  assignmentCount: document.getElementById('month-assignment-count'), totalEarnings: document.getElementById('month-total-earnings'),
  fairGoalMet: document.getElementById('month-fair-goal-met'), goalMet: document.getElementById('month-goal-met'), goalBelow: document.getElementById('month-goal-below'),
  goalAverage: document.getElementById('month-goal-average')
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
  deadheadTime: document.getElementById('summary-deadhead-time'),
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
  notes: document.getElementById('daily-earnings-notes'),
  shiftStartTime: document.getElementById('shift-start-time'),
  shiftEndTime: document.getElementById('shift-end-time')
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
  totalEarnings: document.getElementById('review-total-earnings'),
  goalAmount: document.getElementById('review-goal-amount'),
  goalStatus: document.getElementById('review-goal-status'),
  goalDifference: document.getElementById('review-goal-difference'),
  goalResult: document.getElementById('review-goal-result'),
  exactDutyTime: document.getElementById('review-exact-duty-time'),
  completedPayHour: document.getElementById('review-completed-pay-hour')
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
const settingsFirebaseUid = document.getElementById('settings-firebase-uid');
const settingsListenerState = document.getElementById('settings-listener-state');
const settingsFirebaseUpdate = document.getElementById('settings-firebase-update');
const settingsCacheVersion = document.getElementById('settings-cache-version');
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
const reviewTotalWeight = document.getElementById('review-total-weight');
const reviewGrossTruckWeight = document.getElementById('review-gross-truck-weight');
const loadReviewSummary = document.getElementById('load-review-summary');
const loadReviewWarnings = document.getElementById('load-review-warnings');
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
  summaryGrid: document.getElementById('report-summary-grid'),
  dispatcher: document.getElementById('analysis-dispatcher-filter'),
  pickupState: document.getElementById('analysis-pickup-state-filter'),
  dropoffState: document.getElementById('analysis-dropoff-state-filter'),
  stateRoute: document.getElementById('analysis-state-route-filter'),
  exactRoute: document.getElementById('analysis-exact-route-filter'),
  analysisContent: document.getElementById('dispatch-analysis-content'),
  dutyTimeContent: document.getElementById('duty-time-review-content')
};
const workdayControls = {
  status: document.getElementById('workday-status'), date: document.getElementById('workday-date'),
  dispatcher: document.getElementById('workday-dispatcher'), completedLoads: document.getElementById('workday-completed-loads'),
  completedPay: document.getElementById('workday-completed-pay'), totalEarnings: document.getElementById('workday-total-earnings'),
  dutyTime: document.getElementById('workday-duty-time'), goalStatus: document.getElementById('workday-goal-status'),
  defaultDispatcher: document.getElementById('workday-default-dispatcher'), shiftStart: document.getElementById('workday-shift-start'),
  shiftEnd: document.getElementById('workday-shift-end'), notes: document.getElementById('workday-notes'),
  perDiem: document.getElementById('workday-per-diem'), sleeper: document.getElementById('workday-sleeper'),
  trainer: document.getElementById('workday-trainer'), startButton: document.getElementById('start-workday-button'),
  endButton: document.getElementById('end-workday-button')
};
const paidTimeControls = {
  panel: document.getElementById('paid-time-entry-panel'), form: document.getElementById('paid-time-form'),
  date: document.getElementById('paid-time-date'), category: document.getElementById('paid-time-category'),
  custom: document.getElementById('paid-time-custom-category'), quantity: document.getElementById('paid-time-quantity'), start: document.getElementById('paid-time-start'),
  end: document.getElementById('paid-time-end'), rate: document.getElementById('paid-time-rate'),
  dispatcher: document.getElementById('paid-time-dispatcher'), truck: document.getElementById('paid-time-truck'),
  trailer: document.getElementById('paid-time-trailer'), relatedLoad: document.getElementById('paid-time-related-load'),
  miles: document.getElementById('paid-time-miles'), location: document.getElementById('paid-time-location'),
  notes: document.getElementById('paid-time-notes'), duration: document.getElementById('paid-time-duration'),
  pay: document.getElementById('paid-time-pay'), error: document.getElementById('paid-time-error')
};
const paySettingsControls = {
  dailyCompletedLoadGoal: document.getElementById('settings-daily-completed-load-goal'),
  fairDayGoal: document.getElementById('settings-fair-day-goal'),
  excellentDayGoal: document.getElementById('settings-excellent-day-goal'),
  deadheadRate: document.getElementById('settings-deadhead-rate'),
  truckWashRate: document.getElementById('settings-truck-wash-rate'),
  breakdownRate: document.getElementById('settings-breakdown-rate'),
  otherHourlyRate: document.getElementById('settings-other-hourly-rate'),
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

function normalizePaidTimeRecord(raw = {}) {
  const category = ['Deadhead','Truck Wash','Breakdown','Office Time','Training Time','Other Hourly Work','Vacation Time'].includes(raw.category) ? raw.category : 'Other Hourly Work';
  const isVacation = category === 'Vacation Time';
  const startTime = String(raw.startTime || '');
  const endTime = String(raw.endTime || '');
  const durationMinutes = isVacation ? null : durationBetween(startTime, endTime);
  const hourlyRate = isVacation ? VACATION_DAILY_RATE : normalizePayRate(raw.hourlyRate, 0);
  const quantity = isVacation ? 1 : (isFiniteNumber(durationMinutes) ? durationMinutes / 60 : normalizePayRate(raw.quantity, 0));
  return {
    ...raw,
    id: String(raw.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`),
    workDate: normalizeDateKey(raw.workDate || raw.date),
    category,
    paidTimeType: category,
    customCategoryName: String(raw.customCategoryName || ''),
    startTime, endTime,
    durationMinutes,
    quantity,
    quantityUnit: isVacation ? 'day' : 'hour',
    hourlyRate,
    rate: hourlyRate,
    calculatedAmount: quantity * hourlyRate,
    estimatedPay: quantity * hourlyRate,
    dispatcher: String(raw.dispatcher || '').trim(),
    truckNumber: String(raw.truckNumber || ''),
    trailerNumber: String(raw.trailerNumber || ''),
    relatedLoadId: String(raw.relatedLoadId || ''),
    deadheadMiles: numberOrNull(raw.deadheadMiles),
    location: String(raw.location || ''),
    notes: String(raw.notes || ''),
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || new Date().toISOString()
  };
}

function normalizePaidTimeRecords(raw) {
  return (Array.isArray(raw) ? raw : []).filter(isPlainObject).map(normalizePaidTimeRecord);
}

function loadPaidTimeRecords() {
  return normalizePaidTimeRecords(loadJson(PAID_TIME_STORAGE_KEY, [], 'paid-time records'));
}

function applyLegacyDeadheadPaidTimeToLoads(loads, paidRecords) {
  const byLoadId = new Map(getUniqueSavedLoads(loads).map((load) => [String(load.id), load]));
  let changed = false;

  (Array.isArray(paidRecords) ? paidRecords : [])
    .filter((record) => record.category === 'Deadhead' && record.relatedLoadId && byLoadId.has(String(record.relatedLoadId)))
    .forEach((record) => {
      const load = byLoadId.get(String(record.relatedLoadId));
      const nextDeadheadStart = load.deadheadStartTime || record.startTime || '';
      const nextDeadheadEnd = load.deadheadEndTime || record.endTime || '';
      const nextDeadheadMiles = isFiniteNumber(load.deadheadMiles) && load.deadheadMiles > 0
        ? load.deadheadMiles
        : numberOrNull(record.deadheadMiles) ?? load.deadheadMiles ?? 0;

      if (nextDeadheadStart !== load.deadheadStartTime || nextDeadheadEnd !== load.deadheadEndTime || nextDeadheadMiles !== load.deadheadMiles) {
        changed = true;
        byLoadId.set(String(load.id), normalizeSavedLoad({
          ...load,
          deadheadStartTime: nextDeadheadStart,
          deadheadEndTime: nextDeadheadEnd,
          deadheadMiles: nextDeadheadMiles,
          legacyDeadheadPaidTimeId: load.legacyDeadheadPaidTimeId || record.id,
          updatedAt: new Date().toISOString()
        }));
      }
    });

  if (!changed) {
    return { loads, changed: false };
  }

  const normalized = loads.map((load) => byLoadId.get(String(load.id)) || load);
  return { loads: normalized, changed: true };
}

let appSettings = loadAppSettings();
let savedLoads = loadSavedLoads();
let paidTimeRecords = loadPaidTimeRecords();
const legacyDeadheadMapping = applyLegacyDeadheadPaidTimeToLoads(savedLoads, paidTimeRecords);
if (legacyDeadheadMapping.changed) {
  storeJson(DEADHEAD_MAPPING_BACKUP_STORAGE_KEY, {
    format: BACKUP_FORMAT,
    backupType: 'pre-deadhead-paid-time-mapping',
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    loads: savedLoads
  }, 'pre-deadhead mapping backup');
  savedLoads = legacyDeadheadMapping.loads;
  storeJson(STORAGE_KEY, savedLoads, 'load log');
}
let dailyAddOns = loadDailyAddOns();
let dailyEarningsRecords = loadDailySummaries();
let driverProfile = loadDriverProfile();
let appMeta = loadAppMeta();
let favoriteRoutes = loadFavoriteRoutes();
let startupSafetySnapshot = cloneTrackerState({
  loads: savedLoads,
  dailyAddOns,
  dailySummaries: dailyEarningsRecords,
  profile: driverProfile,
  metadata: appMeta,
  settings: appSettings,
  favoriteRoutes,
  paidTime: paidTimeRecords
});
let editingLoadId = null;
let editingPaidTimeId = null;
let pendingDuplicateRecord = null;
let pendingCommitMode = 'save';
let isSaving = false;
let draftSaveTimer = null;
let waitingServiceWorker = null;
let firebaseStartupPromise = null;
let signInInProgress = false;
const cloudSync = {
  enabled: false,
  app: null,
  auth: null,
  db: null,
  sdk: null,
  user: null,
  authReady: false,
  unsubscribe: [],
  listenerTimers: [],
  pendingWrites: 0,
  lastError: '',
  applyingCloudState: false,
  backfillQueued: false,
  runtimeListenersInstalled: false,
  writeAcknowledgedSincePending: false,
  stalledWrites: 0,
  networkRestartPromise: null,
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
    favoriteRoutes: deepClone(state.favoriteRoutes || []) || [],
    paidTime: deepClone(state.paidTime || []) || []
  };
}

function createEmptyPendingDeletes() {
  return {
    loads: {},
    dailyAddOns: {},
    favoriteRoutes: {},
    paidTime: {}
  };
}

function normalizePendingDeleteEntry(group, key, entry) {
  const rawEntry = isPlainObject(entry) ? entry : {};
  const normalizedKey = String(
    rawEntry.id
      || rawEntry.loadId
      || rawEntry.date
      || rawEntry.routeId
      || rawEntry.paidTimeId
      || key
      || ''
  ).trim();

  if (!normalizedKey) {
    return null;
  }

  const normalized = {
    ...rawEntry,
    id: normalizedKey,
    deletedAt: rawEntry.deletedAt || new Date().toISOString(),
    appVersion: rawEntry.appVersion || APP_VERSION
  };

  if (group === 'loads') {
    normalized.loadId = normalizedKey;
  }

  if (group === 'dailyAddOns') {
    normalized.date = normalizedKey;
  }

  if (group === 'favoriteRoutes') {
    normalized.routeId = normalizedKey;
  }
  if (group === 'paidTime') normalized.paidTimeId = normalizedKey;

  return normalized;
}

function normalizePendingDeletes(rawDeletes = {}) {
  const normalized = createEmptyPendingDeletes();

  if (!isPlainObject(rawDeletes)) {
    return normalized;
  }

  PENDING_DELETE_GROUPS.forEach((group) => {
    const groupDeletes = isPlainObject(rawDeletes[group]) ? rawDeletes[group] : {};

    Object.entries(groupDeletes).forEach(([key, entry]) => {
      const normalizedEntry = normalizePendingDeleteEntry(group, key, entry);

      if (normalizedEntry) {
        normalized[group][normalizedEntry.id] = normalizedEntry;
      }
    });
  });

  return normalized;
}

function normalizeAppMeta(rawMeta) {
  const meta = isPlainObject(rawMeta) ? rawMeta : {};

  return {
    ...meta,
    cloudSync: {
      ...(isPlainObject(meta.cloudSync) ? meta.cloudSync : {}),
      pendingDeletes: normalizePendingDeletes(meta.cloudSync?.pendingDeletes)
    }
  };
}

function getPendingDeletes() {
  return normalizePendingDeletes(appMeta.cloudSync?.pendingDeletes);
}

function countPendingDeletes(pendingDeletes = getPendingDeletes()) {
  return PENDING_DELETE_GROUPS.reduce((total, group) => (
    total + Object.keys(pendingDeletes[group] || {}).length
  ), 0);
}

function hasPendingDeletes() {
  return countPendingDeletes() > 0;
}

function persistPendingDeletes(pendingDeletes) {
  const normalized = normalizePendingDeletes(pendingDeletes);
  appMeta = normalizeAppMeta({
    ...appMeta,
    cloudSync: {
      ...(appMeta.cloudSync || {}),
      pendingDeletes: normalized
    }
  });
  saveAppMeta();
  updateAuthUi();
  return normalized;
}

function queuePendingDelete(group, key, details = {}) {
  if (!PENDING_DELETE_GROUPS.includes(group) || !key) {
    return false;
  }

  const pendingDeletes = getPendingDeletes();
  const now = new Date().toISOString();
  const entry = normalizePendingDeleteEntry(group, key, {
    ...(isPlainObject(details) ? details : {}),
    id: key,
    deletedAt: now,
    appVersion: APP_VERSION
  });

  if (!entry) {
    return false;
  }

  pendingDeletes[group][entry.id] = entry;
  appMeta = normalizeAppMeta({
    ...appMeta,
    cloudSync: {
      ...(appMeta.cloudSync || {}),
      pendingSince: appMeta.cloudSync?.pendingSince || now,
      pendingDeletes
    }
  });
  saveAppMeta();
  updateAuthUi();
  return true;
}

function cancelPendingDelete(group, key) {
  if (!PENDING_DELETE_GROUPS.includes(group) || !key) {
    return false;
  }

  const pendingDeletes = getPendingDeletes();

  if (!pendingDeletes[group][key]) {
    return false;
  }

  delete pendingDeletes[group][key];
  persistPendingDeletes(pendingDeletes);
  return true;
}

function clearPendingDelete(group, key) {
  return cancelPendingDelete(group, key);
}

function isLoadTombstoned(loadOrId) {
  const id = typeof loadOrId === 'object' ? loadOrId?.id : loadOrId;
  return Boolean(id && getPendingDeletes().loads[String(id)]);
}

function isDailyAddOnTombstoned(date) {
  return Boolean(date && getPendingDeletes().dailyAddOns[String(date)]);
}

function isFavoriteRouteTombstoned(routeOrId) {
  const id = typeof routeOrId === 'object' ? routeOrId?.id : routeOrId;
  return Boolean(id && getPendingDeletes().favoriteRoutes[String(id)]);
}

function filterTombstonedLoads(loads) {
  return (Array.isArray(loads) ? loads : []).filter((load) => !isLoadTombstoned(load));
}

function filterTombstonedDailyAddOns(addOnsMap) {
  if (!isPlainObject(addOnsMap)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(addOnsMap).filter(([date]) => !isDailyAddOnTombstoned(date))
  );
}

function filterTombstonedFavoriteRoutes(routes) {
  return (Array.isArray(routes) ? routes : []).filter((route) => !isFavoriteRouteTombstoned(route));
}

function createEmptyCloudState() {
  return {
    loads: [],
    paidTime: [],
    dailyAddOns: {},
    dailySummaries: {},
    profile: null,
    settings: null,
    migration: null,
    loaded: {
      loads: false,
      paidTime: false,
      dailyAddOns: false,
      dailySummaries: false,
      profile: false,
      settings: false,
      migration: false
    },
    pendingWritesByListener: {},
    fromCacheByListener: {},
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

  return Boolean(cloudSync.state.loaded.loads);
}

function hasLocalChangesPending() {
  return Boolean(appMeta.cloudSync?.localChangesPending || hasPendingDeletes());
}

function getPendingSyncCount() {
  return Math.max(cloudSync.pendingWrites, appMeta.cloudSync?.localChangesPending ? 1 : 0)
    + countPendingDeletes();
}

function isCloudMigrationComplete() {
  const migrationVersion = Number(cloudSync.state.migration?.migrationVersion || 0);
  return migrationVersion >= CLOUD_MIGRATION_VERSION || cloudSync.state.settings?.cloudAuthoritative === true;
}

function getLocalSafetyLoadCount() {
  return countUniqueLoads(savedLoads);
}

function updateSyncStatusFromState() {
  if (!cloudSync.enabled) {
    if (hasLocalChangesPending()) {
      setSyncStatus('Local changes pending', 'pending');
      return;
    }

    setSyncStatus(cloudSync.lastError ? 'Sync error' : 'Local only', cloudSync.lastError ? 'error' : '');
    return;
  }

  if (!cloudSync.authReady) {
    setSyncStatus('Connecting');
    return;
  }

  if (!cloudSync.user) {
    if (hasLocalChangesPending()) {
      setSyncStatus('Local changes pending', 'pending');
      return;
    }

    setSyncStatus('Sign in required', 'pending');
    return;
  }

  if (cloudSync.lastError) {
    setSyncStatus('Sync error', 'error');
    return;
  }

  if (!isBrowserOnline()) {
    setSyncStatus(hasLocalChangesPending() || cloudSync.pendingWrites > 0 || cloudSync.state.hasPendingWrites
      ? 'Offline—changes pending'
      : 'Offline', 'offline');
    return;
  }

  if (cloudSync.stalledWrites > 0) {
    setSyncStatus('Offline—changes pending', 'offline');
    return;
  }

  if (cloudSync.pendingWrites > 0 || cloudSync.state.hasPendingWrites) {
    setSyncStatus('Saving', 'pending');
    return;
  }

  if (hasLocalChangesPending()) {
    setSyncStatus('Local changes pending', 'pending');
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
  setElementText(authControls.authStatus, signedIn ? 'Signed in' : (cloudSync.authReady ? 'Sign in required' : 'Checking sign-in...'));
  setElementText(authControls.signedInEmail, signedIn ? (cloudSync.user.email || 'Signed in') : 'Not signed in');
  setElementText(authControls.cloudLoadCount, String(filterTombstonedLoads(cloudSync.state.loads).length));
  setElementText(authControls.localLoadCount, String(getLocalSafetyLoadCount()));
  setElementText(settingsPendingWrites, String(getPendingSyncCount()));
  setElementText(settingsLastSync, appMeta.cloudSync?.lastSyncedAt || cloudSync.state.lastSnapshotAt || 'Not yet synced');
  setElementText(settingsFirebaseUid, cloudSync.user?.uid || 'Not authenticated');
  setElementText(settingsListenerState, Object.entries(cloudSync.state.loaded)
    .map(([name, loaded]) => {
      if (!loaded) return `${name}: waiting`;
      if (cloudSync.state.pendingWritesByListener[name]) return `${name}: pending`;
      if (cloudSync.state.fromCacheByListener[name]) return `${name}: cached`;
      return `${name}: ready`;
    })
    .join(' · '));
  setElementText(settingsFirebaseUpdate, cloudSync.state.lastSnapshotAt || 'No Firebase update received');
  setElementText(settingsCacheVersion, APP_CACHE_NAME);
  setElementText(settingsMigrationState, isCloudMigrationComplete() ? 'Complete' : 'Ready');

  if (authControls.email) {
    authControls.email.disabled = signedIn;
  }

  if (authControls.password) {
    authControls.password.disabled = signedIn;
  }

  if (authControls.signInButton) {
    authControls.signInButton.hidden = signedIn;
    authControls.signInButton.disabled = !cloudSync.enabled && !cloudSync.authReady;
    authControls.signInButton.textContent = cloudSync.enabled ? 'Sign In' : (cloudSync.authReady ? 'Reconnect and Sign In' : 'Connecting...');
  }

  if (authControls.signOutButton) {
    authControls.signOutButton.hidden = !signedIn;
  }

  if (manualSyncButton) {
    manualSyncButton.disabled = !signedIn || cloudSync.pendingWrites > 0 || cloudSync.stalledWrites > 0;
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

  filterTombstonedLoads(cloudSync.state.loads).forEach((load) => {
    if (load.id) {
      byId.set(String(load.id), load);
    }

    byFingerprint.set(load.migrationFingerprint || buildLoadFingerprint(load), load);
  });

  return { byId, byFingerprint };
}

function getMigrationPreview(localLoads = startupSafetySnapshot.loads || []) {
  const { byId, byFingerprint } = getCloudDuplicateMaps();
  let uploadCount = 0;
  let skippedCount = 0;
  let newerCloudCount = 0;

  getUniqueSavedLoads(filterTombstonedLoads(localLoads)).forEach((load) => {
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
    cloudCount: filterTombstonedLoads(cloudSync.state.loads).length,
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
    getFirestore: firestoreModule.getFirestore,
    initializeFirestore: firestoreModule.initializeFirestore,
    clearIndexedDbPersistence: firestoreModule.clearIndexedDbPersistence,
    persistentLocalCache: firestoreModule.persistentLocalCache,
    persistentMultipleTabManager: firestoreModule.persistentMultipleTabManager,
    enableIndexedDbPersistence: firestoreModule.enableIndexedDbPersistence,
    collection: firestoreModule.collection,
    doc: firestoreModule.doc,
    setDoc: firestoreModule.setDoc,
    deleteDoc: firestoreModule.deleteDoc,
    getDocs: firestoreModule.getDocs,
    writeBatch: firestoreModule.writeBatch,
    onSnapshot: firestoreModule.onSnapshot,
    enableNetwork: firestoreModule.enableNetwork,
    disableNetwork: firestoreModule.disableNetwork,
    serverTimestamp: firestoreModule.serverTimestamp
  };
}

function isIOSWebKit() {
  const navigatorObject = globalThis.navigator || {};
  const userAgent = String(navigatorObject.userAgent || '');
  return /iPad|iPhone|iPod/i.test(userAgent)
    || (/Macintosh/i.test(userAgent) && Number(navigatorObject.maxTouchPoints || 0) > 1);
}

function isSafariWebKit() {
  const userAgent = String(globalThis.navigator?.userAgent || '');
  return isIOSWebKit() || (/AppleWebKit/i.test(userAgent)
    && !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/i.test(userAgent));
}

function initializeFirestoreInstance() {
  if (cloudSync.sdk.initializeFirestore) {
    try {
      const transportSettings = isSafariWebKit()
        ? {
          experimentalForceLongPolling: true,
          experimentalLongPollingOptions: { timeoutSeconds: 30 }
        }
        : { experimentalAutoDetectLongPolling: true };
      return cloudSync.sdk.initializeFirestore(cloudSync.app, {
        ...transportSettings,
        localCache: cloudSync.sdk.persistentLocalCache({
          tabManager: cloudSync.sdk.persistentMultipleTabManager()
        })
      });
    } catch {
      // An older cached page may already have created the default instance.
    }
  }
  return cloudSync.sdk.getFirestore(cloudSync.app);
}

function getAuthPersistenceCandidates() {
  return [
    cloudSync.sdk.indexedDBLocalPersistence,
    cloudSync.sdk.browserLocalPersistence
  ].filter(Boolean);
}

async function prepareFirestoreCacheGeneration() {
  const currentGeneration = Number(appMeta.cloudSync?.firestoreCacheGeneration || 0);
  if (currentGeneration >= FIRESTORE_CACHE_GENERATION || !cloudSync.sdk.clearIndexedDbPersistence) return;

  const recoveryState = cloneTrackerState(startupSafetySnapshot);
  const backupSaved = storeJson(FIRESTORE_CACHE_RECOVERY_STORAGE_KEY, {
    format: BACKUP_FORMAT,
    backupType: 'pre-firestore-cache-reset',
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    recordCount: countUniqueLoads(recoveryState.loads),
    data: recoveryState
  }, 'pre-Firestore-cache-reset backup');

  if (!backupSaved) throw new Error('Could not create the local recovery copy.');
  const verifiedBackup = loadJson(FIRESTORE_CACHE_RECOVERY_STORAGE_KEY, null, 'pre-Firestore-cache-reset backup');
  if (!verifiedBackup || countUniqueLoads(verifiedBackup.data?.loads || []) !== countUniqueLoads(recoveryState.loads)) {
    throw new Error('The local recovery copy could not be verified.');
  }

  await cloudSync.sdk.clearIndexedDbPersistence(cloudSync.db);
  appMeta = normalizeAppMeta({
    ...appMeta,
    cloudSync: {
      ...(appMeta.cloudSync || {}),
      firestoreCacheGeneration: FIRESTORE_CACHE_GENERATION,
      localChangesPending: true,
      pendingSince: appMeta.cloudSync?.pendingSince || new Date().toISOString()
    }
  });
  saveAppMeta();
}

function initializeFirebaseAuthInstance() {
  if (cloudSync.sdk.initializeAuth) {
    try {
      return cloudSync.sdk.initializeAuth(cloudSync.app, {
        persistence: getAuthPersistenceCandidates()
      });
    } catch {
      // Firebase Auth may already be initialized if an older cached shell ran first.
    }
  }

  return cloudSync.sdk.getAuth(cloudSync.app);
}

async function applyBestAuthPersistence() {
  if (!cloudSync.sdk.setPersistence || !cloudSync.auth) {
    return;
  }

  for (const persistence of getAuthPersistenceCandidates()) {
    try {
      await cloudSync.sdk.setPersistence(cloudSync.auth, persistence);
      return;
    } catch {
      // Try the next persistence option. iOS can reject one storage layer while another works.
    }
  }

  setAuthError('Cloud login storage is not available in this browser. Local records are still protected, but sign-in may not stay active after closing.', true);
}

async function initializeFirebaseSync() {
  if (firebaseStartupPromise) {
    return firebaseStartupPromise;
  }

  firebaseStartupPromise = startFirebaseSync();

  try {
    return await firebaseStartupPromise;
  } finally {
    firebaseStartupPromise = null;
  }
}

async function startFirebaseSync() {
  if (cloudSync.enabled && cloudSync.auth && cloudSync.db) {
    updateAuthUi();
    return;
  }

  if (!canStartFirebase()) {
    cloudSync.authReady = true;
    updateAuthUi();
    return;
  }

  setSyncStatus('Connecting');
  setAuthError('Checking sign-in...');

  try {
    cloudSync.sdk = await withTimeout(
      loadFirebaseModules(),
      APP_RUNTIME.isCapacitor ? 20000 : 45000,
      'Firebase SDK load timed out.'
    );
    cloudSync.app = cloudSync.sdk.getApps?.().length
      ? cloudSync.sdk.getApp()
      : cloudSync.sdk.initializeApp(FIREBASE_CONFIG);
    cloudSync.auth = initializeFirebaseAuthInstance();
    cloudSync.db = initializeFirestoreInstance();
    await prepareFirestoreCacheGeneration();
    cloudSync.enabled = true;
    cloudSync.lastError = '';

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

    updateAuthUi();

    withTimeout(applyBestAuthPersistence(), 1500, 'Auth persistence setup timed out.').catch(() => {
      // Authentication must not wait on iOS storage. The existing local safety copy remains authoritative offline.
    });

    installCloudRuntimeListeners();
  } catch (error) {
    cloudSync.enabled = false;
    cloudSync.authReady = true;
    cloudSync.lastError = 'Firebase sync could not start.';
    const startupMessage = String(error?.message || '').includes('timed out')
      ? 'Firebase files did not load in time. Check the device internet connection, then run the app again.'
      : 'Cloud login could not start. Local records are still available. Check your connection, then tap Reconnect and Sign In.';
    setAuthError(startupMessage, true);
    updateAuthUi();
  }
}

function getLastCloudSnapshotAge() {
  const timestamp = Date.parse(cloudSync.state.lastSnapshotAt || '');
  return Number.isFinite(timestamp) ? Date.now() - timestamp : Number.POSITIVE_INFINITY;
}

async function resumeCloudSync() {
  updateSyncStatusFromState();
  if (!isCloudSignedIn() || !isBrowserOnline()) return;

  try {
    await cloudSync.sdk.enableNetwork?.(cloudSync.db);
  } catch {
    // Restarting listeners below is the fallback for iOS WebKit network suspension.
  }

  if (getLastCloudSnapshotAge() > CLOUD_RESUME_STALE_MS) {
    startCloudListeners();
  }

  processPendingDeletes();
}

async function restartFirestoreNetwork() {
  if (!isCloudSignedIn() || !isBrowserOnline()) return;
  if (cloudSync.networkRestartPromise) return cloudSync.networkRestartPromise;

  cloudSync.networkRestartPromise = (async () => {
    try {
      await cloudSync.sdk.disableNetwork?.(cloudSync.db);
    } catch {
      // Enabling the network can still recover a half-open iOS connection.
    }

    try {
      await cloudSync.sdk.enableNetwork?.(cloudSync.db);
    } finally {
      startCloudListeners();
    }
  })();

  try {
    await cloudSync.networkRestartPromise;
  } finally {
    cloudSync.networkRestartPromise = null;
  }
}

function installCloudRuntimeListeners() {
  if (cloudSync.runtimeListenersInstalled) return;
  cloudSync.runtimeListenersInstalled = true;
  globalThis.addEventListener?.('online', resumeCloudSync);
  globalThis.addEventListener?.('offline', updateSyncStatusFromState);
  globalThis.addEventListener?.('pageshow', resumeCloudSync);
  globalThis.document?.addEventListener?.('visibilitychange', () => {
    if (globalThis.document.visibilityState === 'visible') resumeCloudSync();
  });
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
  cloudSync.listenerTimers.forEach((timerId) => {
    if (timerId && typeof globalThis.clearTimeout === 'function') {
      globalThis.clearTimeout(timerId);
    }
  });
  cloudSync.listenerTimers = [];
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

function updateCloudSnapshotMetadata(name, snapshot) {
  cloudSync.state.pendingWritesByListener[name] = Boolean(snapshot.metadata?.hasPendingWrites);
  cloudSync.state.fromCacheByListener[name] = Boolean(snapshot.metadata?.fromCache);
  cloudSync.state.hasPendingWrites = Object.values(cloudSync.state.pendingWritesByListener).some(Boolean);
  cloudSync.state.fromCache = Object.values(cloudSync.state.fromCacheByListener).some(Boolean);
  cloudSync.state.lastSnapshotAt = new Date().toISOString();
}

function reconcileServerAcknowledgement() {
  const listenerNames = Object.keys(cloudSync.state.loaded);
  const allListenersReady = listenerNames.every((name) => cloudSync.state.loaded[name]);
  const allListenersOnServer = allListenersReady
    && listenerNames.every((name) => cloudSync.state.fromCacheByListener[name] === false);

  if (!allListenersOnServer || cloudSync.state.hasPendingWrites) return;

  cloudSync.pendingWrites = 0;
  cloudSync.stalledWrites = 0;
  cloudSync.writeAcknowledgedSincePending = false;
  clearLocalChangesPending();
  setAuthError('');
}

function handleCloudSnapshotChange(name, snapshot) {
  updateCloudSnapshotMetadata(name, snapshot);
  cloudSync.lastError = '';
  reconcileServerAcknowledgement();
  handleCloudStateChanged();
}

function getFriendlyErrorDetail(error, fallback = 'Unknown error') {
  const code = error?.code ? `${error.code}: ` : '';
  const message = error?.message || fallback;
  return `${code}${message}`;
}

function handleCloudListenerError(name, error) {
  cloudSync.state.loaded[name] = true;
  cloudSync.lastError = getFriendlyErrorDetail(error, 'Cloud sync error.');
  setAuthError(`Cloud sync had a problem: ${cloudSync.lastError}. Local records were not changed.`, true);
  updateAuthUi();
}

function startCloudListenerTimeout(name) {
  if (typeof globalThis.setTimeout !== 'function') {
    return null;
  }

  const timerId = globalThis.setTimeout(() => {
    if (cloudSync.state.loaded[name]) {
      return;
    }

    cloudSync.state.loaded[name] = true;
    cloudSync.lastError = `Timed out waiting for ${name} from Firebase.`;
    setAuthError(`${cloudSync.lastError} Local records are still available.`, true);
    handleCloudStateChanged();
  }, CLOUD_LISTENER_TIMEOUT_MS);

  cloudSync.listenerTimers.push(timerId);
  return timerId;
}

function clearCloudListenerTimeout(timerId) {
  if (timerId && typeof globalThis.clearTimeout === 'function') {
    globalThis.clearTimeout(timerId);
  }
}

function listenToCloudCollection(name, collectionName, mapper) {
  const timeoutId = startCloudListenerTimeout(name);
  const unsubscribe = cloudSync.sdk.onSnapshot(
    cloudCollection(collectionName),
    { includeMetadataChanges: true },
    (snapshot) => {
      clearCloudListenerTimeout(timeoutId);
      cloudSync.state[name] = mapper(snapshot);
      cloudSync.state.loaded[name] = true;
      handleCloudSnapshotChange(name, snapshot);
    },
    (error) => handleCloudListenerError(name, error)
  );

  cloudSync.unsubscribe.push(unsubscribe);
}

function listenToCloudDocument(name, collectionName, documentName) {
  const timeoutId = startCloudListenerTimeout(name);
  const unsubscribe = cloudSync.sdk.onSnapshot(
    cloudDocument(collectionName, documentName),
    { includeMetadataChanges: true },
    (snapshot) => {
      clearCloudListenerTimeout(timeoutId);
      cloudSync.state[name] = snapshot.exists() ? normalizeCloudData(snapshot.data()) : null;
      cloudSync.state.loaded[name] = true;
      handleCloudSnapshotChange(name, snapshot);
    },
    (error) => handleCloudListenerError(name, error)
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
  listenToCloudCollection('paidTime', 'paidTime', (snapshot) => snapshot.docs.map((doc) => normalizePaidTimeRecord({ id: doc.id, ...normalizeCloudData(doc.data()) })));
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
    updateAuthUi();
    return;
  }

  startCloudListeners();
  processPendingDeletes();
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

  return true;
}

function persistCurrentStateToLocalFallback() {
  storeJson(STORAGE_KEY, savedLoads, 'load log');
  storeJson(PAID_TIME_STORAGE_KEY, paidTimeRecords, 'paid-time records');
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

  const localBeforeApply = cloneTrackerState({
    loads: savedLoads,
    dailyAddOns,
    dailySummaries: dailyEarningsRecords,
    profile: driverProfile,
    metadata: appMeta,
    settings: appSettings,
    favoriteRoutes,
    paidTime: paidTimeRecords
  });
  const cloudPaidTime = normalizePaidTimeRecords(cloudSync.state.paidTime || []);
  const pendingDeletes = getPendingDeletes();
  const cloudLoads = filterTombstonedLoads(cloudSync.state.loads.map(normalizeSavedLoad));
  const localLoads = filterTombstonedLoads(localBeforeApply.loads);
  const localOnlyLoads = getLoadsMissingFromCloud(localLoads, cloudLoads);

  if (localOnlyLoads.length > 0) {
    storeJson(CLOUD_MERGE_RECOVERY_STORAGE_KEY, {
      format: BACKUP_FORMAT,
      backupType: 'pre-cloud-merge-recovery',
      appVersion: APP_VERSION,
      dataSchemaVersion: DATA_SCHEMA_VERSION,
      createdAt: new Date().toISOString(),
      recordCount: countUniqueLoads(localBeforeApply.loads),
      data: localBeforeApply
    }, 'pre-cloud-merge recovery');
  }

  savedLoads = filterTombstonedLoads(mergeLoadRecords(cloudLoads, localLoads));
  paidTimeRecords = mergeRecordsByUpdatedAt(
    cloudPaidTime,
    normalizePaidTimeRecords(localBeforeApply.paidTime || [])
  ).filter((item) => !pendingDeletes.paidTime[item.id]);
  const cloudDailyAddOns = filterTombstonedDailyAddOns(cloudSync.state.dailyAddOns || {});
  const localDailyAddOns = filterTombstonedDailyAddOns(localBeforeApply.dailyAddOns || {});
  dailyAddOns = normalizeDailyAddOns(mergeDateRecordsByUpdatedAt(cloudDailyAddOns, localDailyAddOns));
  const cloudDailySummaries = isPlainObject(cloudSync.state.dailySummaries) ? cloudSync.state.dailySummaries : {};
  dailyEarningsRecords = mergeDateRecordsByUpdatedAt(cloudDailySummaries, localBeforeApply.dailySummaries);
  driverProfile = normalizeDriverProfile({
    ...(cloudSync.state.profile || {}),
    ...(localBeforeApply.profile || {})
  });
  const cloudSettings = isPlainObject(cloudSync.state.settings) ? cloudSync.state.settings : {};
  appSettings = normalizeAppSettings({
    ...(cloudSettings.appSettings || cloudSettings),
    ...(localBeforeApply.settings || {})
  });
  favoriteRoutes = filterTombstonedFavoriteRoutes(mergeFavoriteRoutes(
    cloudSettings.favoriteRoutes || [],
    localBeforeApply.favoriteRoutes || []
  ));
  appMeta = {
    ...appMeta,
    ...cloudSettings,
    cloudSync: {
      authoritative: true,
      uid: cloudSync.user.uid,
      email: cloudSync.user.email || '',
      lastSyncedAt: new Date().toISOString(),
      pendingDeletes,
      localChangesPending: localOnlyLoads.length > 0 || appMeta.cloudSync?.localChangesPending === true || countPendingDeletes(pendingDeletes) > 0
    }
  };

  refreshAllDailyEarningsRecords();
  applyProfileToControls();
  applyDailyAddOnsToControls();
  applyPaySettingsToControls();
  renderSummary();
  updateDailySummary();
  ensureLoadNumber();
  persistCurrentStateToLocalFallback();
  cloudSync.source = 'cloud';
  cloudSync.applyingCloudState = false;

  if (localOnlyLoads.length > 0 && cloudSync.pendingWrites === 0 && !cloudSync.state.hasPendingWrites) {
    scheduleCloudBackfill(localOnlyLoads);
  }

  if (countPendingDeletes(pendingDeletes) > 0) {
    processPendingDeletes();
  }
}

function restoreStartupSafetySnapshot() {
  savedLoads = filterTombstonedLoads(startupSafetySnapshot.loads || []).map(normalizeSavedLoad);
  dailyAddOns = filterTombstonedDailyAddOns(normalizeDailyAddOns(startupSafetySnapshot.dailyAddOns || {}));
  dailyEarningsRecords = isPlainObject(startupSafetySnapshot.dailySummaries) ? startupSafetySnapshot.dailySummaries : {};
  driverProfile = normalizeDriverProfile(startupSafetySnapshot.profile || {});
  appMeta = normalizeAppMeta(startupSafetySnapshot.metadata || {});
  appSettings = normalizeAppSettings(startupSafetySnapshot.settings || {});
  favoriteRoutes = filterTombstonedFavoriteRoutes(normalizeFavoriteRoutes(startupSafetySnapshot.favoriteRoutes || []));
  paidTimeRecords = normalizePaidTimeRecords(startupSafetySnapshot.paidTime || []);

  refreshAllDailyEarningsRecords();
  applyProfileToControls();
  applyDailyAddOnsToControls();
  applyPaySettingsToControls();
  renderSummary();
  updateDailySummary();
  ensureLoadNumber();
}

function handleCloudStateChanged() {
  if (shouldApplyCloudState()) {
    applyCloudStateToApp();
  }

  updateAuthUi();
}

function getFriendlyAuthError(error) {
  const code = error?.code || '';

  if (code.includes('unauthorized-domain')) {
    return 'Firebase rejected this web address. Add this GitHub Pages domain to Firebase Authentication authorized domains, then try again.';
  }

  if (code.includes('operation-not-allowed')) {
    return 'Firebase email/password sign-in is not enabled for this project.';
  }

  if (code.includes('invalid-api-key') || code.includes('app-deleted')) {
    return 'Firebase project settings could not be used by this app.';
  }

  if (code.includes('user-disabled')) {
    return 'This Firebase user account is disabled.';
  }

  if (code.includes('invalid-email')) {
    return 'Enter a valid email address.';
  }

  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return 'Email or password did not match.';
  }

  if (code.includes('too-many-requests')) {
    return 'Too many attempts. Wait a bit and try again.';
  }

  if (code.includes('network')) {
    return 'Could not reach Firebase. Check the connection and try again.';
  }

  return `Sign-in failed${code ? ` (${code})` : ''}. Check the email and password, then try again.`;
}

function mergeLoadRecords(primaryLoads, secondaryLoads) {
  const byIdentity = new Map();

  [...primaryLoads, ...secondaryLoads].forEach((rawLoad) => {
    const load = normalizeSavedLoad(rawLoad);
    const identity = load.id || load.migrationFingerprint || buildLoadFingerprint(load);
    const existing = byIdentity.get(identity);

    if (!existing || getLoadComparableTime(load) >= getLoadComparableTime(existing)) {
      byIdentity.set(identity, load);
    }
  });

  return [...byIdentity.values()].sort((left, right) => (
    String(right.loadDate || '').localeCompare(String(left.loadDate || ''))
    || String(right.savedAt || '').localeCompare(String(left.savedAt || ''))
  ));
}

function mergeRecordsByUpdatedAt(primaryRecords, secondaryRecords) {
  const byId = new Map();

  [...primaryRecords, ...secondaryRecords].forEach((record) => {
    const id = String(record?.id || '');
    if (!id) return;
    const existing = byId.get(id);
    if (!existing || getLoadComparableTime(record) >= getLoadComparableTime(existing)) {
      byId.set(id, record);
    }
  });

  return [...byId.values()];
}

function mergeDateRecordsByUpdatedAt(primaryRecords, secondaryRecords) {
  const merged = { ...(primaryRecords || {}) };

  Object.entries(secondaryRecords || {}).forEach(([date, record]) => {
    const existing = merged[date];
    if (!existing || getLoadComparableTime(record) >= getLoadComparableTime(existing)) {
      merged[date] = record;
    }
  });

  return merged;
}

function getLoadsMissingFromCloud(localLoads, cloudLoads) {
  const cloudIdentities = new Set();

  cloudLoads.forEach((load) => {
    const normalized = normalizeSavedLoad(load);
    if (normalized.id) {
      cloudIdentities.add(`id:${normalized.id}`);
    }
    cloudIdentities.add(`fingerprint:${normalized.migrationFingerprint || buildLoadFingerprint(normalized)}`);
  });

  return localLoads
    .map(normalizeSavedLoad)
    .filter((load) => !cloudIdentities.has(`id:${load.id}`) && !cloudIdentities.has(`fingerprint:${load.migrationFingerprint || buildLoadFingerprint(load)}`));
}

function markLocalChangesPending(message = 'Local changes are saved on this device and will sync after sign-in.', showMessage = true) {
  appMeta = {
    ...appMeta,
    cloudSync: {
      ...(appMeta.cloudSync || {}),
      localChangesPending: true,
      pendingSince: appMeta.cloudSync?.pendingSince || new Date().toISOString()
    }
  };
  saveAppMeta();
  if (showMessage) setAuthError(message);
  updateAuthUi();
}

function clearLocalChangesPending() {
  const deletesPending = hasPendingDeletes();

  if (!appMeta.cloudSync?.localChangesPending && !deletesPending) {
    return;
  }

  appMeta = {
    ...appMeta,
    cloudSync: {
      ...(appMeta.cloudSync || {}),
      pendingDeletes: getPendingDeletes(),
      localChangesPending: deletesPending,
      pendingSince: deletesPending ? (appMeta.cloudSync?.pendingSince || new Date().toISOString()) : null,
      lastSyncedAt: new Date().toISOString()
    }
  };
  saveAppMeta();
}

function scheduleCloudBackfill(loadsToSync = []) {
  const missingLoads = filterTombstonedLoads(getUniqueSavedLoads(loadsToSync));
  if (!isCloudSignedIn() || cloudSync.backfillQueued || missingLoads.length === 0) {
    return;
  }

  cloudSync.backfillQueued = true;
  setAuthError('Local records are being synced to Firebase...');

  globalThis.setTimeout?.(() => {
    cloudSync.backfillQueued = false;
    missingLoads.forEach((load) => syncLoadToCloud(load));
  }, 0);
}

function startAuthReadyFallbackTimer() {
  if (typeof globalThis.setTimeout !== 'function') {
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
  }, APP_RUNTIME.isCapacitor ? 12000 : 15000);
}

function clearAuthReadyFallbackTimer(timerId) {
  if (timerId && typeof globalThis.clearTimeout === 'function') {
    globalThis.clearTimeout(timerId);
  }
}

async function handleSignIn(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();

  if (signInInProgress) {
    return;
  }

  signInInProgress = true;

  if (!cloudSync.enabled || !cloudSync.auth) {
    setAuthError('Reconnecting to cloud login...');
    await initializeFirebaseSync();

    if (!cloudSync.enabled || !cloudSync.auth) {
      setAuthError('Cloud login is still not ready. Local records are safe on this device. Check your connection, then try again.', true);
      signInInProgress = false;
      return;
    }
  }

  const email = authControls.email?.value.trim() || '';
  const password = authControls.password?.value || '';

  if (!email || !password) {
    setAuthError('Enter the Firebase email and password.', true);
    signInInProgress = false;
    return;
  }

  setAuthError('Signing in...');

  if (authControls.signInButton) {
    authControls.signInButton.disabled = true;
  }

  try {
    await applyBestAuthPersistence();

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
    signInInProgress = false;

    if (authControls.signInButton) {
      authControls.signInButton.disabled = false;
    }
  }
}

globalThis.personalLoadTrackerSubmitLogin = handleSignIn;

async function handleSignOut() {
  if (!cloudSync.enabled || !cloudSync.auth) {
    return;
  }

  setAuthError('Signing out...');

  try {
    await cloudSync.sdk.signOut(cloudSync.auth);
    setAuthError('Signed out. Sign in again to sync cloud records.');
  } catch {
    setAuthError('Sign out failed. Try again when the connection is available.', true);
  }
}

function buildCloudLoadPayload(record) {
  const normalized = buildSynchronizedLoadPayload(record);
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

function buildSynchronizedLoadPayload(record) {
  return sanitizeForFirestore(normalizeSavedLoad(record));
}

function buildCloudAddOnPayload(date) {
  const addOn = getDailyAddOn(date);
  return sanitizeForFirestore({
    ...addOn,
    date,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: addOn.updatedAt || new Date().toISOString(),
    cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
  });
}

function buildCloudSummaryPayload(date) {
  const summary = getDailyEarningsSummary(date);
  return sanitizeForFirestore({
    ...summary,
    date,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: summary.updatedAt || new Date().toISOString(),
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
      ,paidTime: PAID_TIME_STORAGE_KEY
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
  markLocalChangesPending('', false);
  updateSyncStatusFromState();

  let writeStalled = false;
  const stallTimer = globalThis.setTimeout?.(() => {
    writeStalled = true;
    cloudSync.stalledWrites += 1;
    updateAuthUi();
    restartFirestoreNetwork().catch(() => resumeCloudSync());
  }, CLOUD_WRITE_STALL_MS);

  Promise.resolve().then(writeOperation)
    .then(() => {
      cloudSync.lastError = '';
      cloudSync.writeAcknowledgedSincePending = true;
    })
    .catch((error) => {
      const detail = getFriendlyErrorDetail(error, failureMessage);
      cloudSync.lastError = detail;
      markLocalChangesPending(failureMessage);
      setAuthError(`${failureMessage} ${detail}. Local records were still saved on this device.`, true);
    })
    .finally(() => {
      if (stallTimer && typeof globalThis.clearTimeout === 'function') globalThis.clearTimeout(stallTimer);
      if (writeStalled) cloudSync.stalledWrites = Math.max(0, cloudSync.stalledWrites - 1);
      cloudSync.pendingWrites = Math.max(0, cloudSync.pendingWrites - 1);
      if (cloudSync.pendingWrites === 0 && !cloudSync.lastError && !cloudSync.state.hasPendingWrites) {
        cloudSync.writeAcknowledgedSincePending = false;
        clearLocalChangesPending();
        setAuthError('');
      }
      updateAuthUi();
    });
}

function syncLoadToCloud(record) {
  if (!isCloudSignedIn()) {
    return;
  }

  if (isLoadTombstoned(record)) {
    processPendingDeletes();
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

  processPendingDeletes();
}

async function processPendingDeletes(options = {}) {
  if (!isCloudSignedIn()) {
    updateAuthUi();
    return false;
  }

  const pendingDeletes = getPendingDeletes();
  const pendingCount = countPendingDeletes(pendingDeletes);

  if (pendingCount === 0) {
    updateAuthUi();
    return true;
  }

  const countAsWrite = options.countAsWrite !== false;
  const failedDeletes = [];

  if (countAsWrite) {
    cloudSync.pendingWrites += 1;
  }

  updateSyncStatusFromState();

  try {
    for (const loadId of Object.keys(pendingDeletes.loads)) {
      try {
        await cloudSync.sdk.deleteDoc(cloudDocument('loads', toCloudDocumentId(loadId)));
        clearPendingDelete('loads', loadId);
      } catch (error) {
        failedDeletes.push(getFriendlyErrorDetail(error, `load ${loadId}`));
      }
    }

    for (const date of Object.keys(pendingDeletes.dailyAddOns)) {
      try {
        await cloudSync.sdk.deleteDoc(cloudDocument('dailyAddOns', toCloudDocumentId(date)));
        clearPendingDelete('dailyAddOns', date);
      } catch (error) {
        failedDeletes.push(getFriendlyErrorDetail(error, `daily add-on ${date}`));
      }
    }

    for (const paidTimeId of Object.keys(getPendingDeletes().paidTime)) {
      try {
        await cloudSync.sdk.deleteDoc(cloudDocument('paidTime', toCloudDocumentId(paidTimeId)));
        clearPendingDelete('paidTime', paidTimeId);
      } catch (error) {
        failedDeletes.push(getFriendlyErrorDetail(error, `paid-time record ${paidTimeId}`));
      }
    }

    const favoriteRouteDeleteIds = Object.keys(getPendingDeletes().favoriteRoutes);

    if (favoriteRouteDeleteIds.length > 0) {
      try {
        favoriteRoutes = favoriteRoutes.filter((route) => !favoriteRouteDeleteIds.includes(String(route.id)));
        saveFavoriteRoutesToStorage();
        await cloudSync.sdk.setDoc(
          cloudDocument('settings', 'app'),
          buildCloudSettingsPayload({ favoriteRoutes, cloudAuthoritative: true }),
          { merge: true }
        );
        favoriteRouteDeleteIds.forEach((routeId) => clearPendingDelete('favoriteRoutes', routeId));
      } catch (error) {
        failedDeletes.push(getFriendlyErrorDetail(error, 'favorite routes'));
      }
    }

    if (failedDeletes.length > 0) {
      cloudSync.lastError = `Pending deletes could not sync: ${failedDeletes.join('; ')}`;
      setAuthError(`${cloudSync.lastError}. Local records remain protected on this device.`, true);

      if (options.throwOnFailure) {
        throw new Error(cloudSync.lastError);
      }

      return false;
    }

    cloudSync.lastError = '';
    setAuthError('Pending deletes synced.');
    return true;
  } finally {
    if (countAsWrite) {
      cloudSync.pendingWrites = Math.max(0, cloudSync.pendingWrites - 1);
    }

    updateAuthUi();
  }
}

function syncDailyAddOnToCloud(date) {
  if (!isCloudSignedIn() || !date) {
    return;
  }

  if (isDailyAddOnTombstoned(date)) {
    processPendingDeletes();
    return;
  }

  queueCloudWrite(() => {
    const addOn = dailyAddOns[date];
    const ref = cloudDocument('dailyAddOns', toCloudDocumentId(date));

    if (!addOn || (!addOn.perDiem && !addOn.sleeperBerth && !addOn.trainerPay && !addOn.shiftStartTime && !addOn.shiftEndTime && !addOn.notes)) {
      queuePendingDelete('dailyAddOns', date, { reason: 'empty-add-on' });
      return cloudSync.sdk.deleteDoc(ref).then(() => clearPendingDelete('dailyAddOns', date));
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

function createCloudBatchWriter(limit = FIRESTORE_BATCH_WRITE_LIMIT) {
  let batch = cloudSync.sdk.writeBatch(cloudSync.db);
  let operationCount = 0;

  async function commitCurrentBatch() {
    if (operationCount === 0) {
      return;
    }

    await batch.commit();
    batch = cloudSync.sdk.writeBatch(cloudSync.db);
    operationCount = 0;
  }

  async function addOperation(callback) {
    callback(batch);
    operationCount += 1;

    if (operationCount >= limit) {
      await commitCurrentBatch();
    }
  }

  return {
    set: (documentRef, payload, options) => addOperation((currentBatch) => {
      currentBatch.set(documentRef, payload, options);
    }),
    delete: (documentRef) => addOperation((currentBatch) => {
      currentBatch.delete(documentRef);
    }),
    commit: commitCurrentBatch
  };
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
    const batch = createCloudBatchWriter();
    const nextLoadIds = new Set(nextState.loads.map((load) => String(load.id)));
    const nextAddOnDates = new Set(Object.keys(nextState.dailyAddOns || {}));
    const nextSummaryDates = new Set(Object.keys(nextState.dailySummaries || {}));
    const nextPaidTimeIds = new Set((nextState.paidTime || []).map((item) => String(item.id)));

    for (const load of nextState.loads) {
      await batch.set(cloudDocument('loads', toCloudDocumentId(load.id)), buildCloudLoadPayload(load), { merge: true });
    }

    for (const date of Object.keys(nextState.dailyAddOns || {})) {
      await batch.set(cloudDocument('dailyAddOns', toCloudDocumentId(date)), sanitizeForFirestore({
        ...nextState.dailyAddOns[date],
        date,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    }

    for (const date of Object.keys(nextState.dailySummaries || {})) {
      await batch.set(cloudDocument('dailySummaries', toCloudDocumentId(date)), sanitizeForFirestore({
        ...nextState.dailySummaries[date],
        date,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    }

    for (const item of nextState.paidTime || []) {
      await batch.set(cloudDocument('paidTime', toCloudDocumentId(item.id)), sanitizeForFirestore({
        ...normalizePaidTimeRecord(item),
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    }

    await batch.set(cloudDocument('profile', 'current'), sanitizeForFirestore({
      ...nextState.profile,
      cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
    }), { merge: true });
    await batch.set(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
      lastImport: nextState.metadata?.lastImport || { importedAt: new Date().toISOString(), importMode: mode }
    }), { merge: true });

    if (mode === 'replace') {
      for (const load of cloudSync.state.loads) {
        if (!nextLoadIds.has(String(load.id))) {
          await batch.delete(cloudDocument('loads', toCloudDocumentId(load.id)));
        }
      }

      for (const date of Object.keys(cloudSync.state.dailyAddOns || {})) {
        if (!nextAddOnDates.has(date)) {
          await batch.delete(cloudDocument('dailyAddOns', toCloudDocumentId(date)));
        }
      }

      for (const date of Object.keys(cloudSync.state.dailySummaries || {})) {
        if (!nextSummaryDates.has(date)) {
          await batch.delete(cloudDocument('dailySummaries', toCloudDocumentId(date)));
        }
      }

      for (const item of cloudSync.state.paidTime || []) {
        if (!nextPaidTimeIds.has(String(item.id))) {
          await batch.delete(cloudDocument('paidTime', toCloudDocumentId(item.id)));
        }
      }
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
    await processPendingDeletes({ countAsWrite: false, throwOnFailure: true });
    refreshAllDailyEarningsRecords();
    const batch = createCloudBatchWriter();

    for (const load of filterTombstonedLoads(getUniqueSavedLoads(savedLoads))) {
      await batch.set(cloudDocument('loads', toCloudDocumentId(load.id)), buildCloudLoadPayload(load), { merge: true });
    }

    const activeDailyAddOns = filterTombstonedDailyAddOns(dailyAddOns || {});
    for (const date of Object.keys(activeDailyAddOns)) {
      await batch.set(cloudDocument('dailyAddOns', toCloudDocumentId(date)), buildCloudAddOnPayload(date), { merge: true });
    }

    for (const date of Object.keys(dailyEarningsRecords || {})) {
      await batch.set(cloudDocument('dailySummaries', toCloudDocumentId(date)), buildCloudSummaryPayload(date), { merge: true });
    }

    for (const item of paidTimeRecords.filter((record) => !getPendingDeletes().paidTime[record.id])) {
      await batch.set(cloudDocument('paidTime', toCloudDocumentId(item.id)), sanitizeForFirestore({
        ...item,
        appVersion: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    }

    await batch.set(cloudDocument('profile', 'current'), buildCloudProfilePayload(), { merge: true });
    await batch.set(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
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
        lastSyncedAt: new Date().toISOString(),
        pendingDeletes: getPendingDeletes(),
        localChangesPending: hasPendingDeletes(),
        pendingSince: hasPendingDeletes() ? (appMeta.cloudSync?.pendingSince || new Date().toISOString()) : null
      }
    };
    saveAppMeta();
    setAuthError('Sync complete.');
  }, 'Manual sync could not finish yet.');
}

function getLocalMigrationState() {
  const startupHasLoads = countUniqueLoads(startupSafetySnapshot.loads || []) > 0;

  return cloneTrackerState({
    loads: filterTombstonedLoads(getUniqueSavedLoads(startupHasLoads ? startupSafetySnapshot.loads : savedLoads)),
    dailyAddOns: filterTombstonedDailyAddOns(startupHasLoads ? startupSafetySnapshot.dailyAddOns : dailyAddOns),
    dailySummaries: startupHasLoads ? startupSafetySnapshot.dailySummaries : dailyEarningsRecords,
    profile: startupHasLoads ? startupSafetySnapshot.profile : driverProfile,
    metadata: startupHasLoads ? startupSafetySnapshot.metadata : appMeta,
    settings: startupHasLoads ? startupSafetySnapshot.settings : appSettings,
    favoriteRoutes: filterTombstonedFavoriteRoutes(startupHasLoads ? startupSafetySnapshot.favoriteRoutes : favoriteRoutes),
    paidTime: startupHasLoads ? startupSafetySnapshot.paidTime : paidTimeRecords
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
  const batch = createCloudBatchWriter();
  const stats = {
    examinedCount: localLoads.length,
    uploadedCount: 0,
    skippedCount: 0,
    newerCloudCount: 0
  };

  try {
    for (const load of localLoads) {
      const fingerprint = buildLoadFingerprint(load);
      const cloudById = byId.get(String(load.id));
      const cloudByFingerprint = byFingerprint.get(fingerprint);

      if (cloudById && getLoadComparableTime(cloudById) >= getLoadComparableTime(load)) {
        stats.skippedCount += 1;
        stats.newerCloudCount += getLoadComparableTime(cloudById) > getLoadComparableTime(load) ? 1 : 0;
        continue;
      }

      if (!cloudById && cloudByFingerprint) {
        stats.skippedCount += 1;
        continue;
      }

      await batch.set(cloudDocument('loads', toCloudDocumentId(load.id)), buildCloudLoadPayload({
        ...load,
        migrationFingerprint: fingerprint
      }), { merge: true });
      stats.uploadedCount += 1;
    }

    const addOns = normalizeDailyAddOns(localState.dailyAddOns || {});
    for (const date of Object.keys(addOns)) {
      await batch.set(cloudDocument('dailyAddOns', toCloudDocumentId(date)), sanitizeForFirestore({
        ...addOns[date],
        date,
        appVersion: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    }

    const summaries = isPlainObject(localState.dailySummaries) ? localState.dailySummaries : {};
    for (const date of Object.keys(summaries)) {
      await batch.set(cloudDocument('dailySummaries', toCloudDocumentId(date)), sanitizeForFirestore({
        ...summaries[date],
        date,
        appVersion: APP_VERSION,
        dataSchemaVersion: DATA_SCHEMA_VERSION,
        cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
      }), { merge: true });
    }

    await batch.set(cloudDocument('profile', 'current'), sanitizeForFirestore({
      ...normalizeDriverProfile(localState.profile || {}),
      appVersion: APP_VERSION,
      dataSchemaVersion: DATA_SCHEMA_VERSION,
      cloudUpdatedAt: cloudSync.sdk.serverTimestamp()
    }), { merge: true });
    await batch.set(cloudDocument('settings', 'app'), buildCloudSettingsPayload({
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
    const hadController = Boolean(navigator.serviceWorker.controller);
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

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;
      setUpdateStatus('Update installed. It will be used the next time the app opens.');
      registration.active?.postMessage({ type: 'GET_VERSION' });
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type !== 'APP_VERSION') return;
      setElementText(settingsCacheVersion, event.data.cacheName || event.data.version || 'Unknown');
      // An older active worker can answer while its replacement is installing.
      // Reloading at that point traps iOS on the old shell; controllerchange
      // performs the one safe reload after the new worker actually takes over.
      if (event.data.version && event.data.version !== APP_VERSION) {
        setUpdateStatus('Installing the latest app update...');
        registration.update().catch(() => {});
      }
    });
    registration.active?.postMessage({ type: 'GET_VERSION' });

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

  preserveActiveViewForReload();
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

    if (!('serviceWorker' in navigator)) {
      setUpdateStatus('Update checks are not supported in this browser.');
      return;
    }

    const existingRegistration = await navigator.serviceWorker.getRegistration();
    const registration = existingRegistration || await registerServiceWorker();

    if (!registration) {
      setUpdateStatus('Unable to check for updates right now.');
      return;
    }

    const updatedRegistration = await registration.update().catch(() => registration);
    const installedWorker = await waitForInstallingWorker(updatedRegistration);

    if (updatedRegistration.waiting || installedWorker) {
      await reloadAfterServiceWorkerUpdate(updatedRegistration);
      return;
    }

    setUpdateStatus('You are using the latest version.');
  } catch {
    setUpdateStatus('Unable to check for updates right now.');
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

  entries.forEach(([rawDate, addOn]) => {
    const date = normalizeDateKey(addOn?.workDate || rawDate);
    if (!date || !addOn || typeof addOn !== 'object') {
      return;
    }

    normalized[date] = {
      ...addOn,
      date,
      workDate: String(addOn.workDate || date),
      defaultDispatcher: String(addOn.defaultDispatcher || '').trim(),
      perDiem: Boolean(addOn.perDiem ?? addOn.perDiemApplied),
      sleeperBerth: Boolean(addOn.sleeperBerth ?? addOn.sleeperBerthApplied),
      trainerPay: Boolean(addOn.trainerPay ?? addOn.trainerPayApplied),
      shiftStartTime: String(addOn.shiftStartTime || ''),
      shiftEndTime: String(addOn.shiftEndTime || ''),
      notes: addOn.notes || addOn.dailyNotes || addOn.dailyEarningsNotes || '',
      dailyNotes: addOn.dailyNotes || addOn.notes || addOn.dailyEarningsNotes || ''
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
  return normalizeAppMeta(rawMeta);
}

function saveAppMeta() {
  const normalizedMeta = normalizeAppMeta(appMeta);

  appMeta = {
    ...normalizedMeta,
    appVersion: APP_VERSION,
    dataSchemaVersion: DATA_SCHEMA_VERSION,
    updatedAt: new Date().toISOString(),
    cloudSync: normalizedMeta.cloudSync,
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
    dailyCompletedLoadPayGoal: DEFAULT_DAILY_COMPLETED_LOAD_PAY_GOAL,
    fairDayGoal: DEFAULT_FAIR_DAY_GOAL,
    excellentDayGoal: DEFAULT_EXCELLENT_DAY_GOAL,
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

  const excellentGoal = normalizePayRate(
    raw.excellentDayGoal ?? raw.dailyCompletedLoadPayGoal ?? raw.dailyCompletedLoadGoal,
    defaults.excellentDayGoal
  );
  const fairGoal = normalizePayRate(raw.fairDayGoal, defaults.fairDayGoal);

  return {
    ...defaults,
    ...raw,
    payRates: {
      rejectPay: normalizePayRate(rawRates.rejectPay, defaults.payRates.rejectPay),
      perDiemPay: normalizePayRate(rawRates.perDiemPay, defaults.payRates.perDiemPay),
      sleeperBerthPay: normalizePayRate(rawRates.sleeperBerthPay, defaults.payRates.sleeperBerthPay),
      trainerPay: normalizePayRate(rawRates.trainerPay, defaults.payRates.trainerPay),
      waitPayRate: normalizePayRate(rawRates.waitPayRate, defaults.payRates.waitPayRate)
      ,deadheadHourlyRate: normalizePayRate(rawRates.deadheadHourlyRate, defaults.payRates.deadheadHourlyRate)
      ,truckWashHourlyRate: normalizePayRate(rawRates.truckWashHourlyRate, defaults.payRates.truckWashHourlyRate)
      ,breakdownHourlyRate: normalizePayRate(rawRates.breakdownHourlyRate, defaults.payRates.breakdownHourlyRate)
      ,otherHourlyRate: normalizePayRate(rawRates.otherHourlyRate, defaults.payRates.otherHourlyRate)
    },
    loadedMilesPayScale: normalizeLoadedMilesPayScale(raw.loadedMilesPayScale),
    fairDayGoal: fairGoal,
    excellentDayGoal: excellentGoal,
    dailyCompletedLoadPayGoal: excellentGoal,
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

function getDailyCompletedLoadPayGoal() {
  return getExcellentDayGoal();
}

function getFairDayGoal() {
  return normalizePayRate(appSettings?.fairDayGoal, DEFAULT_FAIR_DAY_GOAL);
}

function getExcellentDayGoal() {
  return normalizePayRate(appSettings?.excellentDayGoal ?? appSettings?.dailyCompletedLoadPayGoal, DEFAULT_EXCELLENT_DAY_GOAL);
}

function getGoalStatusForAmount(amount, goal, isEligible) {
  if (!isEligible) {
    return { status: 'Not eligible', difference: null, amountAbove: null, amountBelow: null };
  }

  const difference = amount - goal;
  return {
    status: difference >= 0 ? 'Goal met' : 'Below goal',
    difference,
    amountAbove: difference > 0 ? difference : 0,
    amountBelow: difference < 0 ? Math.abs(difference) : 0
  };
}

function calculateDailyCompletedLoadPayGoal(records, goal = getDailyCompletedLoadPayGoal()) {
  const allRecords = getUniqueSavedLoads(Array.isArray(records) ? records : []);
  const completedRecords = allRecords.filter(isCompleted);
  const eligibleAssignments = allRecords.filter((load) => isCompleted(load) || isReject(load));
  const usableRecords = completedRecords.filter((load) => isFiniteNumber(load.estimatedPay));
  const completedLoadPay = sum(usableRecords, 'estimatedPay');
  const dailyGoal = normalizePayRate(goal, DEFAULT_DAILY_COMPLETED_LOAD_PAY_GOAL);
  const isEligible = eligibleAssignments.length > 0;
  const legacyGoalResult = getGoalStatusForAmount(completedLoadPay, dailyGoal, isEligible);
  const fairGoal = getFairDayGoal();
  const excellentGoal = getExcellentDayGoal();
  const fair = getGoalStatusForAmount(completedLoadPay, fairGoal, isEligible);
  const excellent = getGoalStatusForAmount(completedLoadPay, excellentGoal, isEligible);
  return {
    completedLoadPay,
    dailyGoal,
    eligibleDispatchedDay: isEligible,
    fairDayGoal: fairGoal,
    excellentDayGoal: excellentGoal,
    fairGoalStatus: fair.status,
    fairGoalDifference: fair.difference,
    fairAmountAboveGoal: fair.amountAbove,
    fairAmountBelowGoal: fair.amountBelow,
    excellentGoalStatus: excellent.status,
    excellentGoalDifference: excellent.difference,
    excellentAmountAboveGoal: excellent.amountAbove,
    excellentAmountBelowGoal: excellent.amountBelow,
    goalStatus: legacyGoalResult.status,
    goalDifference: legacyGoalResult.difference,
    amountAboveGoal: legacyGoalResult.amountAbove,
    amountBelowGoal: legacyGoalResult.amountBelow
  };
}

function summarizeDailyGoalResults(days) {
  const eligibleDays = days.filter((day) => day.eligibleDispatchedDay);
  const goalMetDays = eligibleDays.filter((day) => day.goalStatus === 'Goal met');
  const belowGoalDays = eligibleDays.filter((day) => day.goalStatus === 'Below goal');
  const insufficientDataDays = days.filter((day) => !day.eligibleDispatchedDay);
  const fairGoalDays = eligibleDays.filter((day) => day.fairGoalStatus === 'Goal met');
  const excellentGoalDays = eligibleDays.filter((day) => day.excellentGoalStatus === 'Goal met');
  const belowFairGoalDays = eligibleDays.filter((day) => day.fairGoalStatus === 'Below goal');
  return {
    eligibleDispatchedWorkdays: eligibleDays.length,
    daysGoalMet: goalMetDays.length,
    daysBelowGoal: belowGoalDays.length,
    daysInsufficientData: insufficientDataDays.length,
    usableGoalDays: eligibleDays.length,
    fairGoalDays: fairGoalDays.length,
    excellentGoalDays: excellentGoalDays.length,
    belowFairGoalDays: belowFairGoalDays.length,
    fairGoalPercent: eligibleDays.length ? fairGoalDays.length / eligibleDays.length * 100 : null,
    excellentGoalPercent: eligibleDays.length ? excellentGoalDays.length / eligibleDays.length * 100 : null,
    belowFairGoalPercent: eligibleDays.length ? belowFairGoalDays.length / eligibleDays.length * 100 : null,
    percentUsableDaysMeetingGoal: eligibleDays.length ? goalMetDays.length / eligibleDays.length * 100 : null,
    totalAmountAboveGoal: sum(goalMetDays, 'amountAboveGoal'),
    totalAmountBelowGoal: sum(belowGoalDays, 'amountBelowGoal'),
    averageCompletedLoadPayPerWorkday: eligibleDays.length ? sum(eligibleDays, 'completedLoadPay') / eligibleDays.length : null,
    averageGoalDifference: eligibleDays.length ? sum(eligibleDays, 'goalDifference') / eligibleDays.length : null
  };
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
        pickupState: normalizeState(route.pickupState),
        dropoffLocation,
        dropoffState: normalizeState(route.dropoffState),
        loadedMiles: numberOrNull(route.loadedMiles),
        productType: String(route.productType || '').trim(),
        updatedAt: route.updatedAt || new Date().toISOString()
      };
    })
    .filter(Boolean);
}

function mergeFavoriteRoutes(...routeLists) {
  const byIdentity = new Map();

  routeLists.forEach((routes) => {
    (Array.isArray(routes) ? routes : []).forEach((route) => {
      const normalized = normalizeFavoriteRoutes([route])[0];

      if (!normalized) {
        return;
      }

      const identity = normalized.id || [
        normalized.pickupLocation,
        normalized.dropoffLocation,
        normalized.productType || '',
        normalized.loadedMiles ?? ''
      ].join('|').toLowerCase();
      const existing = byIdentity.get(identity);

      if (!existing || String(normalized.updatedAt || '') >= String(existing.updatedAt || '')) {
        byIdentity.set(identity, normalized);
      }
    });
  });

  return filterTombstonedFavoriteRoutes([...byIdentity.values()]);
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

function normalizeDateKey(value) {
  const text = String(value || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  if (local.getFullYear() !== year || local.getMonth() !== month - 1 || local.getDate() !== day) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
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

function formatMeteredDifference(value) {
  if (!isFiniteNumber(value)) {
    return '-';
  }

  const rounded = Number(value.toFixed(2));
  if (rounded > 0) {
    return `Shortage: ${rounded.toFixed(2)} bbl`;
  }
  if (rounded < 0) {
    return `Overage: ${Math.abs(rounded).toFixed(2)} bbl`;
  }
  return 'Exact match: 0.00 bbl';
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
  return `${pickup}, ${displayState(load?.pickupState)} → ${dropoff}, ${displayState(load?.dropoffState)}`;
}

function normalizeState(value) {
  const state = String(value || '').trim().toUpperCase();
  return US_STATE_ABBREVIATIONS.includes(state) ? state : '';
}

function displayState(value) {
  return normalizeState(value) || 'Unknown';
}

function getStateRoute(load) {
  return `${displayState(load?.pickupState)} → ${displayState(load?.dropoffState)}`;
}

function getRecentDispatcherForDate(date, excludingId = null) {
  const workdayDefault = getDailyAddOn(date).defaultDispatcher;
  if (workdayDefault) return workdayDefault;
  return getUniqueSavedLoads().filter((load) => load.loadDate === date && load.id !== excludingId && load.dispatcher)
    .sort((a, b) => String(b.updatedAt || b.savedAt || '').localeCompare(String(a.updatedAt || a.savedAt || '')))[0]?.dispatcher || '';
}

function normalizeDispatcherName(value, records = savedLoads) {
  const entered = String(value || '').trim();
  if (!entered) return '';
  const match = getUniqueSavedLoads(records).map((load) => String(load.dispatcher || '').trim()).find((name) => name && name.toLowerCase() === entered.toLowerCase());
  return match || entered;
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

  if (typeof globalThis.scrollTo === 'function') {
    globalThis.setTimeout?.(() => globalThis.scrollTo(0, 0), 0);
  }
}

function getActiveViewName() {
  return appViews.find((view) => view.classList.contains('active'))?.dataset.view || 'dashboard';
}

function preserveActiveViewForReload() {
  if (!globalThis.location || !globalThis.history?.replaceState) {
    return;
  }

  const activeView = getActiveViewName();
  const hash = `#view=${encodeURIComponent(activeView)}`;
  globalThis.history.replaceState(null, '', `${globalThis.location.pathname || ''}${globalThis.location.search || ''}${hash}`);
}

function getPreservedView() {
  const match = String(globalThis.location?.hash || '').match(/^#view=([^&]+)$/);
  const viewName = match ? decodeURIComponent(match[1]) : '';
  return appViews.some((view) => view.dataset.view === viewName) ? viewName : 'dashboard';
}

function handleNavigationClick(event) {
  const button = event.target.closest ? event.target.closest('[data-view-target]') : null;

  if (!button) {
    return;
  }

  activateView(button.dataset.viewTarget);
}

function getNextLoadNumber(date = daily.date?.value || todayLocal()) {
  const payPeriodRange = getCompanyPayPeriodRange(date);
  const periodLoads = getLoadsForRange(payPeriodRange.start, payPeriodRange.end);
  const savedNumbers = periodLoads
    .map((load) => String(load.loadNumber || '').match(/\d+/g)?.pop())
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  const nextFromCount = periodLoads.length + 1;
  const nextFromSavedNumbers = savedNumbers.length > 0 ? Math.max(...savedNumbers) + 1 : 1;
  return String(Math.max(nextFromCount, nextFromSavedNumbers));
}

function ensureLoadNumber() {
  if (fields.loadNumber && !editingLoadId) {
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
  if (paySettingsControls.dailyCompletedLoadGoal) {
    paySettingsControls.dailyCompletedLoadGoal.value = String(getDailyCompletedLoadPayGoal());
  }
  if (paySettingsControls.fairDayGoal) {
    paySettingsControls.fairDayGoal.value = String(getFairDayGoal());
  }
  if (paySettingsControls.excellentDayGoal) {
    paySettingsControls.excellentDayGoal.value = String(getExcellentDayGoal());
  }
  if (paySettingsControls.deadheadRate) paySettingsControls.deadheadRate.value = String(getPayRate('deadheadHourlyRate'));
  if (paySettingsControls.truckWashRate) paySettingsControls.truckWashRate.value = String(getPayRate('truckWashHourlyRate'));
  if (paySettingsControls.breakdownRate) paySettingsControls.breakdownRate.value = String(getPayRate('breakdownHourlyRate'));
  if (paySettingsControls.otherHourlyRate) paySettingsControls.otherHourlyRate.value = String(getPayRate('otherHourlyRate'));
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
  const fairInput = String(paySettingsControls.fairDayGoal?.value ?? paySettingsControls.dailyCompletedLoadGoal?.value ?? '').trim();
  const excellentInput = String(paySettingsControls.excellentDayGoal?.value ?? paySettingsControls.dailyCompletedLoadGoal?.value ?? '').trim();
  const parsedFairGoal = Number(fairInput);
  const parsedExcellentGoal = Number(excellentInput);
  if (!fairInput || !Number.isFinite(parsedFairGoal) || parsedFairGoal < 0) {
    setStatusMessage(paySettingsControls.status, 'Fair Day Goal must be a number of zero or greater.', true);
    return;
  }
  if (!excellentInput || !Number.isFinite(parsedExcellentGoal) || parsedExcellentGoal < 0) {
    setStatusMessage(paySettingsControls.status, 'Excellent Day Goal must be a number of zero or greater.', true);
    return;
  }
  const nextSettings = normalizeAppSettings({
    ...appSettings,
    fairDayGoal: parsedFairGoal,
    excellentDayGoal: parsedExcellentGoal,
    dailyCompletedLoadPayGoal: parsedExcellentGoal,
    payRates: {
      waitPayRate: paySettingsControls.waitRate?.value,
      perDiemPay: paySettingsControls.perDiemRate?.value,
      sleeperBerthPay: paySettingsControls.sleeperRate?.value,
      rejectPay: paySettingsControls.rejectRate?.value,
      trainerPay: paySettingsControls.trainerRate?.value
      ,deadheadHourlyRate: paySettingsControls.deadheadRate?.value
      ,truckWashHourlyRate: paySettingsControls.truckWashRate?.value
      ,breakdownHourlyRate: paySettingsControls.breakdownRate?.value
      ,otherHourlyRate: paySettingsControls.otherHourlyRate?.value
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
  if (!isCloudSignedIn()) {
    markLocalChangesPending('Pay rates saved locally. Sign in to sync them to Firebase.');
  }
  syncSettingsToCloud();
  setStatusMessage(paySettingsControls.status, 'Pay rates saved.');
}

function renderSettingsUi() {
  applyPaySettingsToControls();
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

    if (key === 'productType' && String(value).trim().toLowerCase() === 'crude oil') {
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

  const draftDate = normalizeDateKey(draft.formValues?.loadDate || draft.selectedDate || String(draft.savedAt || '').slice(0, 10));
  if (!draft.editingLoadId && draftDate && draftDate !== todayLocal()) {
    clearDraft();
    daily.date.value = todayLocal();
    clearForm();
    setStatusMessage(draftStatus, 'Started a clean load form for today. The previous-day draft was cleared.');
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
    return `Short by ${rounded.toFixed(2)} barrels`;
  }

  if (rounded < 0) {
    return `Over by ${Math.abs(rounded).toFixed(2)} barrels`;
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
  const effectiveLoadWeight = isFiniteNumber(values.loadWeight) ? values.loadWeight : estimatedTotalLoadWeight;
  const estimatedGrossTruckWeight = isFiniteNumber(values.emptyTruckWeight) && isFiniteNumber(effectiveLoadWeight)
    ? values.emptyTruckWeight + effectiveLoadWeight
    : null;
  const barrelsOffloaded = isFiniteNumber(values.startMeterReading) && isFiniteNumber(values.endMeterReading)
    ? values.endMeterReading - values.startMeterReading
    : null;
  const differenceVsGrossBarrels = isFiniteNumber(barrelsOffloaded) && isFiniteNumber(values.grossBarrels)
    ? values.grossBarrels - barrelsOffloaded
    : null;
  const regularMiles = valueOrZero(values.loadedMiles);
  const reRoutedMiles = valueOrZero(values.reRoutedMiles);
  const totalMilesIncludingReRoute = regularMiles + reRoutedMiles;
  const payMatch = getLoadedMilesPay(values.loadedMiles);
  const estimatedPay = isReject(values) ? getPayRate('rejectPay') : payMatch.rate;
  const stopWait = calculateStopWaitBreakdown(values);
  const estimatedEntryPay = estimatedPay + stopWait.waitPay;
  const deadheadTravelMinutes = durationBetween(values.deadheadStartTime, values.deadheadEndTime)
    ?? numberOrNull(values.deadheadTravelMinutes);

  return {
    waterBarrels,
    oilBarrels,
    crudeWeightPerBarrel,
    estimatedOilWeight,
    estimatedWaterWeight,
    estimatedTotalLoadWeight,
    effectiveLoadWeight,
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
    deadheadTravelMinutes,
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
    leaseNumber: rawLoad.leaseNumber || rawLoad.lease || rawLoad.leaseId || '',
    loadStatus: rawLoad.loadStatus || COMPLETED_STATUS,
    dispatcher: String(rawLoad.dispatcher || '').trim(),
    productType: rawLoad.productType || '',
    pickupLocation: rawLoad.pickupLocation || '',
    pickupState: normalizeState(rawLoad.pickupState),
    dropoffLocation: rawLoad.dropoffLocation || '',
    dropoffState: normalizeState(rawLoad.dropoffState),
    grossBarrels: numberOrNull(rawLoad.grossBarrels) ?? 0,
    netBarrels: numberOrNull(rawLoad.netBarrels),
    apiGravity: numberOrNull(rawLoad.apiGravity),
    loadTemperature: numberOrNull(rawLoad.loadTemperature ?? rawLoad.temperature ?? rawLoad.temp),
    bswPercentage: numberOrNull(rawLoad.bswPercentage),
    loadWeight: numberOrNull(rawLoad.loadWeight ?? rawLoad.manualLoadWeight),
    loadedMiles: numberOrNull(rawLoad.loadedMiles),
    reRoutedMiles: numberOrNull(rawLoad.reRoutedMiles ?? rawLoad.reroutedMiles) ?? 0,
    deadheadStartTime: rawLoad.deadheadStartTime || rawLoad.deadheadStart || '',
    deadheadEndTime: rawLoad.deadheadEndTime || rawLoad.deadheadEnd || '',
    deadheadMiles: numberOrNull(rawLoad.deadheadMiles) ?? 0,
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
    workDate: addOn.workDate || date,
    defaultDispatcher: String(addOn.defaultDispatcher || '').trim(),
    perDiem: Boolean(addOn.perDiem),
    sleeperBerth: Boolean(addOn.sleeperBerth),
    trainerPay: Boolean(addOn.trainerPay),
    shiftStartTime: addOn.shiftStartTime || '',
    shiftEndTime: addOn.shiftEndTime || '',
    notes: addOn.notes || addOn.dailyNotes || '',
    dailyNotes: addOn.dailyNotes || addOn.notes || ''
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
    workDate: date,
    defaultDispatcher: getDailyAddOn(date).defaultDispatcher,
    perDiem: addOns.perDiem.checked,
    sleeperBerth: addOns.sleeperBerth.checked,
    trainerPay: addOns.trainerPay.checked,
    shiftStartTime: addOns.shiftStartTime?.value || '',
    shiftEndTime: addOns.shiftEndTime?.value || '',
    notes: addOns.notes.value.trim(),
    dailyNotes: addOns.notes.value.trim(),
    updatedAt: new Date().toISOString()
  };

  if (!addOn.defaultDispatcher && !addOn.perDiem && !addOn.sleeperBerth && !addOn.trainerPay && !addOn.shiftStartTime && !addOn.shiftEndTime && !addOn.notes) {
    queuePendingDelete('dailyAddOns', date, { reason: 'daily-add-on-cleared' });
    delete dailyAddOns[date];
  } else {
    cancelPendingDelete('dailyAddOns', date);
    dailyAddOns[date] = addOn;
  }

  storeAddOns();
  updateDailyEarningsRecord(date);
  if (!isCloudSignedIn()) {
    markLocalChangesPending('Daily pay changes saved locally. Sign in to sync them to Firebase.');
  }
  syncCurrentDateToCloud(date);
}

function applyDailyAddOnsToControls() {
  const addOn = getDailyAddOn(daily.date.value);
  addOns.perDiem.checked = addOn.perDiem;
  addOns.sleeperBerth.checked = addOn.sleeperBerth;
  addOns.trainerPay.checked = addOn.trainerPay;
  if (addOns.shiftStartTime) addOns.shiftStartTime.value = addOn.shiftStartTime;
  if (addOns.shiftEndTime) addOns.shiftEndTime.value = addOn.shiftEndTime;
  addOns.notes.value = addOn.notes;
  if (workdayControls.defaultDispatcher) workdayControls.defaultDispatcher.value = addOn.defaultDispatcher;
  if (workdayControls.shiftStart) workdayControls.shiftStart.value = addOn.shiftStartTime;
  if (workdayControls.shiftEnd) workdayControls.shiftEnd.value = addOn.shiftEndTime;
  if (workdayControls.notes) workdayControls.notes.value = addOn.dailyNotes;
  if (workdayControls.perDiem) workdayControls.perDiem.checked = addOn.perDiem;
  if (workdayControls.sleeper) workdayControls.sleeper.checked = addOn.sleeperBerth;
  if (workdayControls.trainer) workdayControls.trainer.checked = addOn.trainerPay;
}

function saveWorkdayControls(mode) {
  const date = daily.date.value || todayLocal();
  const current = getDailyAddOn(date);
  const next = {
    ...current, date, workDate: date,
    defaultDispatcher: String(workdayControls.defaultDispatcher?.value || current.defaultDispatcher || '').trim(),
    shiftStartTime: workdayControls.shiftStart?.value || current.shiftStartTime,
    shiftEndTime: mode === 'end' ? (workdayControls.shiftEnd?.value || '') : current.shiftEndTime,
    dailyNotes: mode === 'end' ? String(workdayControls.notes?.value || '').trim() : current.dailyNotes,
    notes: mode === 'end' ? String(workdayControls.notes?.value || '').trim() : current.notes,
    perDiem: Boolean(workdayControls.perDiem?.checked),
    sleeperBerth: Boolean(workdayControls.sleeper?.checked),
    trainerPay: Boolean(workdayControls.trainer?.checked),
    updatedAt: new Date().toISOString()
  };
  cancelPendingDelete('dailyAddOns', date);
  dailyAddOns[date] = next;
  storeAddOns();
  updateDailyEarningsRecord(date);
  if (!isCloudSignedIn()) markLocalChangesPending('Workday saved locally. Sign in to sync it to Firebase.');
  syncCurrentDateToCloud(date);
  if (fields.loadDate?.value === date && !editingLoadId) fields.dispatcher.value = next.defaultDispatcher;
  applyDailyAddOnsToControls();
  updateDailySummary();
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
  const range = getCompanyPayPeriodRange(dateValue);
  const dates = new Set(records.map((load) => load.loadDate).filter(Boolean));
  Object.values(dailyAddOns)
    .filter((record) => record.workDate >= range.start && record.workDate <= range.end)
    .forEach((record) => dates.add(record.workDate));
  paidTimeRecords
    .filter((record) => record.workDate >= range.start && record.workDate <= range.end)
    .forEach((record) => dates.add(record.workDate));
  const dailySummaries = [...dates].map((date) => getDailyEarningsSummary(date));
  const completedRecords = records.filter(isCompleted);
  const rejectRecords = records.filter(isReject);

  return {
    ...range,
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
    totalEstimatedEarnings: sum(dailySummaries, 'totalEstimatedDailyEarnings'),
    ...summarizeDailyGoalResults(dailySummaries),
    extendedDutyDays: dailySummaries.filter((day) => isFiniteNumber(day.exactDutyMinutes) && day.exactDutyMinutes >= 720).length,
    fourteenHourReviewDays: dailySummaries.filter((day) => isFiniteNumber(day.exactDutyMinutes) && day.exactDutyMinutes >= 840).length
  };
}

function getNumericLoadOrder(load) {
  const match = String(load?.loadNumber || '').match(/\d+/g);
  return match ? Number(match[match.length - 1]) : null;
}

function sortLoadsForTimeline(records) {
  return records.map((load, index) => ({ load, index })).sort((left, right) => {
    const leftNumber = getNumericLoadOrder(left.load);
    const rightNumber = getNumericLoadOrder(right.load);
    if (isFiniteNumber(leftNumber) && isFiniteNumber(rightNumber) && leftNumber !== rightNumber) return leftNumber - rightNumber;
    if (isFiniteNumber(leftNumber) !== isFiniteNumber(rightNumber)) return isFiniteNumber(leftNumber) ? -1 : 1;
    const timeOrder = String(left.load.savedAt || left.load.updatedAt || '').localeCompare(String(right.load.savedAt || right.load.updatedAt || ''));
    return timeOrder || left.index - right.index;
  }).map((entry) => entry.load);
}

function normalizeDailyTimeline(records) {
  const complete = sortLoadsForTimeline(getUniqueSavedLoads(records).filter((load) => load.arrivedPickupTime && load.completedTime));
  if (!complete.length) return { status: 'missing', intervals: [], spanMinutes: null, warning: '' };
  const intervals = [];
  let previousEnd = null;
  for (const load of complete) {
    const pickupClock = parseTimeToMinutes(load.arrivedPickupTime);
    const completionClock = parseTimeToMinutes(load.completedTime);
    if (!isFiniteNumber(pickupClock) || !isFiniteNumber(completionClock)) continue;
    let start = pickupClock;
    if (previousEnd !== null) while (start < previousEnd) start += 1440;
    let end = completionClock + Math.floor(start / 1440) * 1440;
    while (end < start) end += 1440;
    intervals.push({ loadId: load.id, start, end });
    previousEnd = end;
  }
  if (!intervals.length) return { status: 'missing', intervals: [], spanMinutes: null, warning: '' };
  const spanMinutes = intervals[intervals.length - 1].end - intervals[0].start;
  const overlapOrImpossible = intervals.some((interval, index) => index > 0 && interval.start < intervals[index - 1].end) || spanMinutes > 1440;
  if (overlapOrImpossible) return { status: 'review', intervals, spanMinutes: null, warning: 'Timeline needs review' };
  return { status: 'valid', intervals, spanMinutes, warning: '' };
}

function getIntervalUnionMinutes(intervals) {
  const ordered = intervals.filter((item) => isFiniteNumber(item.start) && isFiniteNumber(item.end) && item.end >= item.start)
    .slice().sort((a, b) => a.start - b.start || a.end - b.end);
  if (!ordered.length) return null;
  let total = 0;
  let start = ordered[0].start;
  let end = ordered[0].end;
  ordered.slice(1).forEach((interval) => {
    if (interval.start <= end) end = Math.max(end, interval.end);
    else { total += end - start; start = interval.start; end = interval.end; }
  });
  return total + end - start;
}

function getPaidTimeOverlapReview(records, paidRecords) {
  const loadIntervals = records.map((load) => {
    const start = parseTimeToMinutes(load.arrivedPickupTime);
    let end = parseTimeToMinutes(load.completedTime);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return null;
    if (end < start) end += 1440;
    return { start, end, id: load.id };
  }).filter(Boolean);
  let overlapMinutes = 0;
  const warnings = [];
  paidRecords.forEach((item) => {
    const start = parseTimeToMinutes(item.startTime);
    let end = parseTimeToMinutes(item.endTime);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return;
    if (end < start) end += 1440;
    loadIntervals.forEach((load) => {
      const overlap = Math.max(0, Math.min(end, load.end) - Math.max(start, load.start));
      if (overlap > 0) {
        overlapMinutes += overlap;
        warnings.push(`${item.category} overlaps load ${load.id} by ${formatDuration(overlap)}`);
      }
    });
  });
  const paidIntervals = paidRecords.map((item) => {
    const start = parseTimeToMinutes(item.startTime);
    let end = parseTimeToMinutes(item.endTime);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return null;
    if (end < start) end += 1440;
    return { start, end, id: item.id, category: item.category };
  }).filter(Boolean);
  paidIntervals.forEach((item, index) => {
    paidIntervals.slice(index + 1).forEach((other) => {
      const overlap = Math.max(0, Math.min(item.end, other.end) - Math.max(item.start, other.start));
      if (overlap > 0) {
        overlapMinutes += overlap;
        warnings.push(`${item.category} overlaps ${other.category} by ${formatDuration(overlap)}`);
      }
    });
  });
  return { overlapMinutes, warnings, status: warnings.length ? 'review' : 'clear' };
}

function getMergedClassifiedDutyMinutes(records, paidRecords) {
  const intervals = [];
  records.forEach((load) => {
    const start = parseTimeToMinutes(load.arrivedPickupTime);
    let end = parseTimeToMinutes(load.completedTime);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return;
    if (end < start) end += 1440;
    intervals.push({ start, end });
  });
  paidRecords.forEach((item) => {
    const start = parseTimeToMinutes(item.startTime);
    let end = parseTimeToMinutes(item.endTime);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return;
    if (end < start) end += 1440;
    intervals.push({ start, end });
  });
  return getIntervalUnionMinutes(intervals);
}

function getMergedActiveCycleMinutes(records) {
  const ordered = sortLoadsForTimeline(getUniqueSavedLoads(records).filter((load) => load.arrivedPickupTime && load.completedTime));
  const intervals = [];
  let previousStart = null;
  ordered.forEach((load) => {
    let start = parseTimeToMinutes(load.arrivedPickupTime);
    let end = parseTimeToMinutes(load.completedTime);
    if (!isFiniteNumber(start) || !isFiniteNumber(end)) return;
    if (previousStart !== null) while (start + 720 < previousStart) start += 1440;
    while (end < start) end += 1440;
    intervals.push({ start, end });
    previousStart = start;
  });
  return getIntervalUnionMinutes(intervals);
}

function getDailyEarningsSummary(date, recordsOverride = null) {
  const records = Array.isArray(recordsOverride) ? getUniqueSavedLoads(recordsOverride).filter((load) => load.loadDate === date) : getLoadsForDate(date);
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
  const paidTime = paidTimeRecords.filter((item) => item.workDate === date);
  const paidByCategory = (category) => sum(paidTime.filter((item) => item.category === category), 'estimatedPay');
  const paidMinutesByCategory = (category) => sum(paidTime.filter((item) => item.category === category), 'durationMinutes');
  const deadheadPay = paidByCategory('Deadhead');
  const legacyDeadheadMinutes = paidMinutesByCategory('Deadhead');
  const truckWashPay = paidByCategory('Truck Wash');
  const breakdownPay = paidByCategory('Breakdown');
  const officeTimePay = paidByCategory('Office Time');
  const trainingTimePay = paidByCategory('Training Time');
  const otherHourlyPay = paidByCategory('Other Hourly Work');
  const vacationPay = paidByCategory('Vacation Time');
  const deadheadMinutes = sum(records, 'deadheadTravelMinutes');
  const deadheadMiles = sum(records, 'deadheadMiles');
  const truckWashMinutes = paidMinutesByCategory('Truck Wash');
  const breakdownMinutes = paidMinutesByCategory('Breakdown');
  const officeTimeMinutes = paidMinutesByCategory('Office Time');
  const trainingTimeMinutes = paidMinutesByCategory('Training Time');
  const otherHourlyMinutes = paidMinutesByCategory('Other Hourly Work');
  const totalHourlyAdditionalMinutes = legacyDeadheadMinutes + truckWashMinutes + breakdownMinutes + officeTimeMinutes + trainingTimeMinutes + otherHourlyMinutes;
  const hourlyAdditionalPay = deadheadPay + truckWashPay + breakdownPay + officeTimePay + trainingTimePay + otherHourlyPay;
  const paidTimeOverlap = getPaidTimeOverlapReview(records, paidTime);
  const exactDutyMinutes = durationBetween(addOn.shiftStartTime, addOn.shiftEndTime);
  const timeline = normalizeDailyTimeline(records);
  const estimatedTrackedSpanMinutes = timeline.status === 'valid' ? timeline.spanMinutes : null;
  const usableDutyMinutes = isFiniteNumber(exactDutyMinutes) ? exactDutyMinutes : estimatedTrackedSpanMinutes;
  const activeLoadCycleMinutes = isFiniteNumber(exactDutyMinutes) ? getMergedActiveCycleMinutes(records) : null;
  const classifiedDutyMinutes = isFiniteNumber(exactDutyMinutes) ? getMergedClassifiedDutyMinutes(records, paidTime) : null;
  const utilizationUsable = isFiniteNumber(activeLoadCycleMinutes) && exactDutyMinutes > 0 && activeLoadCycleMinutes <= exactDutyMinutes;
  const classificationUsable = isFiniteNumber(classifiedDutyMinutes) && exactDutyMinutes > 0 && classifiedDutyMinutes <= exactDutyMinutes;
  const goalResult = calculateDailyCompletedLoadPayGoal(records);

  return {
    date,
    workDate: date,
    defaultDispatcher: addOn.defaultDispatcher,
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
    ...goalResult,
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
    paidTimeCount: paidTime.length,
    deadheadMinutes,
    deadheadMiles,
    legacyDeadheadMinutes,
    truckWashMinutes, breakdownMinutes, officeTimeMinutes, trainingTimeMinutes, otherHourlyMinutes, totalHourlyAdditionalMinutes,
    deadheadPay, truckWashPay, breakdownPay, officeTimePay, trainingTimePay, otherHourlyPay, vacationPay, hourlyAdditionalPay,
    otherPaidTimePay: hourlyAdditionalPay,
    paidTimeOverlapMinutes: paidTimeOverlap.overlapMinutes,
    paidTimeOverlapStatus: paidTimeOverlap.status,
    paidTimeOverlapWarnings: paidTimeOverlap.warnings,
    shiftStartTime: addOn.shiftStartTime,
    shiftEndTime: addOn.shiftEndTime,
    exactDutyMinutes,
    estimatedTrackedSpanMinutes,
    usableDutyMinutes,
    dutyTimeSource: isFiniteNumber(exactDutyMinutes) ? 'exact' : (isFiniteNumber(estimatedTrackedSpanMinutes) ? 'estimated' : 'missing'),
    timelineStatus: timeline.status,
    timelineWarning: timeline.warning,
    activeLoadCycleMinutes: utilizationUsable ? activeLoadCycleMinutes : null,
    nonLoadDutyMinutes: utilizationUsable ? exactDutyMinutes - activeLoadCycleMinutes : null,
    classifiedDutyMinutes: classificationUsable ? classifiedDutyMinutes : null,
    unclassifiedNonLoadDutyMinutes: classificationUsable ? exactDutyMinutes - classifiedDutyMinutes : null,
    activeLoadUtilization: utilizationUsable ? activeLoadCycleMinutes / exactDutyMinutes * 100 : null,
    totalEstimatedDailyEarnings: totalEstimatedEntryPay + hourlyAdditionalPay + vacationPay + perDiemPay + sleeperBerthPay + trainerPay,
    effectiveHourlyEarnings: usableDutyMinutes > 0 ? (totalEstimatedEntryPay + hourlyAdditionalPay + vacationPay + perDiemPay + sleeperBerthPay + trainerPay) / (usableDutyMinutes / 60) : null,
    effectiveHourlyBasis: exactDutyMinutes > 0 ? 'exact' : (estimatedTrackedSpanMinutes > 0 ? 'estimated' : 'missing'),
    completedLoadPayPerExactDutyHour: exactDutyMinutes > 0 ? completedLoadPay / (exactDutyMinutes / 60) : null,
    averageLoadPayPerCompletedLoad: completedRecords.length > 0 ? completedLoadPay / completedRecords.length : 0,
    averageGrossBarrels: completedRecords.length > 0 ? sum(completedRecords, 'grossBarrels') / completedRecords.length : 0,
    averageNetBarrels: average(completedRecords, 'netBarrels') || 0,
    notes: addOn.notes
  };
}

function getDutyTimeStatus(day) {
  if (!isFiniteNumber(day?.exactDutyMinutes)) return 'Estimated or Incomplete';
  if (day.exactDutyMinutes >= 840) return 'Potential HOS Concern — Review ELD';
  if (day.exactDutyMinutes >= 720) return 'Extended Duty Day';
  return 'Normal Range';
}

function getWorkloadObservation(day) {
  if (!isFiniteNumber(day?.exactDutyMinutes)) return 'Incomplete Timing Data';
  if (day.exactDutyMinutes >= 840) return 'Fourteen-Hour Threshold Reached';
  if (day.exactDutyMinutes >= 720 && day.fairGoalStatus === 'Below goal') return 'Extended Day — Fair Goal Missed';
  if (day.exactDutyMinutes >= 720) return 'Extended Day';
  if (isFiniteNumber(day.nonLoadDutyMinutes) && day.exactDutyMinutes > 0 && day.nonLoadDutyMinutes / day.exactDutyMinutes >= 0.4) {
    return `High Non-Load Duty Time — ${formatDuration(day.nonLoadDutyMinutes)} (${(day.nonLoadDutyMinutes / day.exactDutyMinutes * 100).toFixed(1)}%)`;
  }
  if (isFiniteNumber(day.completedLoadPayPerExactDutyHour) && day.completedLoadPayPerExactDutyHour < 20) return 'Low Completed-Load Pay Per Duty Hour';
  if (day.fairGoalStatus === 'Goal met') return 'Fair Goal Met';
  return 'Normal Range';
}

function getWorkdayStatus(addOn) {
  if (addOn.shiftStartTime && addOn.shiftEndTime) return 'Completed';
  if (addOn.shiftStartTime) return 'Active';
  return 'Not Started';
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
    ...paidTimeRecords.map((item) => item.workDate).filter(Boolean),
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
  summary.totalWeight.textContent = isFiniteNumber(derived.effectiveLoadWeight) ? formatWeight(derived.effectiveLoadWeight) : noLoadText;
  summary.grossTruckWeight.textContent = isFiniteNumber(derived.estimatedGrossTruckWeight) ? formatWeight(derived.estimatedGrossTruckWeight) : '-';
  setElementText(reviewTotalWeight, isFiniteNumber(derived.effectiveLoadWeight) ? formatWeight(derived.effectiveLoadWeight) : noLoadText);
  setElementText(reviewGrossTruckWeight, isFiniteNumber(derived.estimatedGrossTruckWeight) ? formatWeight(derived.estimatedGrossTruckWeight) : '-');
  summary.startMeterReading.textContent = isFiniteNumber(values.startMeterReading) ? formatNumber(values.startMeterReading) : '-';
  summary.endMeterReading.textContent = isFiniteNumber(values.endMeterReading) ? formatNumber(values.endMeterReading) : '-';
  summary.barrelsOffloaded.textContent = isFiniteNumber(derived.barrelsOffloaded) ? formatBarrels(derived.barrelsOffloaded) : '-';
  summary.grossBarrelsHauled.textContent = isFiniteNumber(values.grossBarrels) ? formatBarrels(values.grossBarrels) : '-';
  summary.differenceGross.textContent = formatMeteredDifference(derived.differenceVsGrossBarrels);
  summary.offloadStatus.textContent = derived.offloadStatus;
  summary.regularMiles.textContent = formatMiles(derived.regularMiles);
  summary.reRoutedMiles.textContent = formatMiles(derived.reRoutedMiles);
  summary.totalMilesIncludingReRoute.textContent = formatMiles(derived.totalMilesIncludingReRoute);
  if (summary.deadheadTime) summary.deadheadTime.textContent = formatMaybeDuration(derived.deadheadTravelMinutes);
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
  renderLoadReviewSummary(values, derived);
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

function formatGoalDifference(record) {
  if (!isFiniteNumber(record?.goalDifference)) return 'Not available';
  if (record.goalDifference > 0) return `Above goal by ${formatMoney(record.goalDifference)}`;
  if (record.goalDifference < 0) return `Below goal by ${formatMoney(Math.abs(record.goalDifference))}`;
  return 'At goal: $0.00 difference';
}

function formatSpecificGoalDifference(status, difference) {
  if (!isFiniteNumber(difference)) return status || 'Not eligible';
  const prefix = difference >= 0 ? '+' : '-';
  return `${status}: ${prefix}${formatMoney(Math.abs(difference))}`;
}

function renderReviewMetric(label, value) {
  return `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '-')}</strong></article>`;
}

function getReviewWarnings(values, derived) {
  const warnings = collectSoftWarnings(values).slice();

  if (!values.loadDate) warnings.push('Work date is missing.');
  if (isCompleted(values) && (!isFiniteNumber(values.grossBarrels) || values.grossBarrels <= 0)) warnings.push('Gross barrels are required for a completed load.');
  if (!values.pickupLocation) warnings.push('Pickup location is blank.');
  if (!values.dropoffLocation) warnings.push('Drop-off location is blank.');
  if (isFiniteNumber(derived.differenceVsGrossBarrels) && Math.abs(derived.differenceVsGrossBarrels) > 10) {
    warnings.push('Metered difference is more than 10 barrels. Review start/end meter readings.');
  }

  return [...new Set(warnings)];
}

function renderLoadReviewSummary(values, derived) {
  if (!loadReviewSummary) {
    return;
  }

  const previewRecord = hasMeaningfulFormData(values) ? buildLoadRecord(values) : null;
  const goalResult = calculateDailyCompletedLoadPayGoal(previewRecord ? [previewRecord] : []);
  const rows = [
    ['Load number', values.loadNumber || 'Auto-generated'],
    ['Product', values.productType || 'Crude Oil'],
    ['Ticket number', values.ticketNumber || '-'],
    ['Lease number', values.leaseNumber || '-'],
    ['Pickup', `${values.pickupLocation || 'Pickup'}${values.pickupState ? `, ${displayState(values.pickupState)}` : ''}`],
    ['Gross barrels', formatBarrels(values.grossBarrels)],
    ['API gravity', isFiniteNumber(values.apiGravity) ? values.apiGravity.toFixed(1) : '-'],
    ['Temperature', isFiniteNumber(values.loadTemperature) ? `${values.loadTemperature.toFixed(1)} deg` : '-'],
    ['BS&W', isFiniteNumber(values.bswPercentage) ? `${values.bswPercentage.toFixed(2)}%` : '-'],
    ['Loading time', `${values.arrivedPickupTime || '-'} to ${values.loadedTime || '-'}`],
    ['Deadhead time', `${values.deadheadStartTime || '-'} to ${values.deadheadEndTime || '-'} (${formatMaybeDuration(derived.deadheadTravelMinutes)})`],
    ['Deadhead miles', formatMiles(values.deadheadMiles)],
    ['Loaded miles', formatMiles(values.loadedMiles)],
    ['Drop-off', `${values.dropoffLocation || 'Drop-off'}${values.dropoffState ? `, ${displayState(values.dropoffState)}` : ''}`],
    ['Meter readings', `${isFiniteNumber(values.startMeterReading) ? formatNumber(values.startMeterReading) : '-'} to ${isFiniteNumber(values.endMeterReading) ? formatNumber(values.endMeterReading) : '-'}`],
    ['Offloaded barrels', formatBarrels(derived.barrelsOffloaded)],
    ['Metered difference', formatMeteredDifference(derived.differenceVsGrossBarrels)],
    ['Unload time', `${values.arrivedDropoffTime || '-'} to ${values.completedTime || '-'}`],
    ['Weight', `${formatWeight(derived.effectiveLoadWeight)} load · ${formatWeight(derived.estimatedGrossTruckWeight)} gross truck`],
    ['Load status', values.loadStatus || '-'],
    ['Load pay', formatMoney(derived.estimatedPay)],
    ['Wait eligibility', `Loading ${formatMaybeDuration(derived.paidPickupWaitMinutes)} · Offloading ${formatMaybeDuration(derived.paidDropoffWaitMinutes)}`],
    ['Wait pay', formatMoney(derived.waitPay)],
    ['Fair Goal', formatSpecificGoalDifference(goalResult.fairGoalStatus, goalResult.fairGoalDifference)],
    ['Excellent Goal', formatSpecificGoalDifference(goalResult.excellentGoalStatus, goalResult.excellentGoalDifference)],
    ['Total estimated load pay', formatMoney(derived.estimatedEntryPay)]
  ];

  loadReviewSummary.innerHTML = rows.map(([label, value]) => renderReviewMetric(label, value)).join('');

  if (loadReviewWarnings) {
    const warnings = getReviewWarnings(values, derived);
    loadReviewWarnings.innerHTML = warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('');
    loadReviewWarnings.hidden = warnings.length === 0;
  }
}

function setGoalResultClass(element, status, baseClass = '') {
  if (!element) return;
  const suffix = status === 'Goal met' ? 'met' : (status === 'Below goal' ? 'below' : 'insufficient');
  element.className = `${baseClass} goal-${suffix}`.trim();
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
  const monthRecords = getLoadsForRange(monthRange.start, monthRange.end);
  const monthCompleted = monthRecords.filter(isCompleted);
  const monthRejects = monthRecords.filter(isReject);
  const monthDates = new Set(monthRecords.map((load) => load.loadDate).filter(Boolean));
  Object.values(dailyAddOns)
    .filter((record) => record.workDate >= monthRange.start && record.workDate <= monthRange.end)
    .forEach((record) => monthDates.add(record.workDate));
  paidTimeRecords
    .filter((record) => record.workDate >= monthRange.start && record.workDate <= monthRange.end)
    .forEach((record) => monthDates.add(record.workDate));
  const monthDays = [...monthDates].map(getDailyEarningsSummary);
  const monthGoalSummary = summarizeDailyGoalResults(monthDays);

  dashboard.totalLoadsHauled.textContent = String(getUniqueSavedLoads().filter(isCompleted).length);
  dashboard.currentWorkDate.textContent = selectedDate || '-';
  dashboard.loadsHauledPayPeriod.textContent = String(payPeriodRecords.filter(isCompleted).length);
  dashboard.loadsHauledMonth.textContent = String(monthCompleted.length);
  dashboard.loadsHauledSelectedDate.textContent = String(selectedDateRecords.filter(isCompleted).length);
  setElementText(headerRecordCount, '');
  setElementText(document.getElementById('header-month-load-count'), `Month: ${monthCompleted.length} completed`);
  setElementText(document.getElementById('header-pay-period-load-count'), `Pay period: ${payPeriodRecords.filter(isCompleted).length} completed`);
  setElementText(payPeriodSummary.totalEarnings, formatMoney(payPeriodRecord.totalEstimatedEarnings));
  setElementText(payPeriodSummary.completedCount, String(payPeriodRecord.completedLoadCount));
  setElementText(payPeriodSummary.rejectCount, String(payPeriodRecord.rejectCount));
  setElementText(payPeriodSummary.assignmentCount, String(payPeriodRecord.completedLoadCount + payPeriodRecord.rejectCount));
  setElementText(payPeriodSummary.trainerPay, formatMoney(payPeriodRecord.trainerPay));
  setElementText(payPeriodSummary.perDiemPay, formatMoney(payPeriodRecord.perDiemPay));
  setElementText(payPeriodSummary.sleeperPay, formatMoney(payPeriodRecord.sleeperBerthPay));
  setElementText(payPeriodSummary.rejectPay, formatMoney(payPeriodRecord.rejectPay));
  setElementText(payPeriodSummary.waitPay, formatMoney(payPeriodRecord.totalWaitPay));
  setElementText(payPeriodSummary.fairGoalMet, String(payPeriodRecord.fairGoalDays || 0));
  setElementText(payPeriodSummary.goalMet, String(payPeriodRecord.excellentGoalDays || 0));
  setElementText(payPeriodSummary.goalBelow, String(payPeriodRecord.belowFairGoalDays || 0));
  setElementText(payPeriodSummary.goalAverage, formatMaybeMoney(payPeriodRecord.averageCompletedLoadEarningsPerEligibleWorkday || payPeriodRecord.averageCompletedLoadPayPerWorkday));
  setElementText(payPeriodSummary.extendedDays, String(payPeriodRecord.extendedDutyDays || 0));
  setElementText(payPeriodSummary.fourteenDays, String(payPeriodRecord.fourteenHourReviewDays || 0));
  setElementText(monthSummary.completedCount, String(monthCompleted.length));
  setElementText(monthSummary.rejectCount, String(monthRejects.length));
  setElementText(monthSummary.assignmentCount, String(monthCompleted.length + monthRejects.length));
  setElementText(monthSummary.totalEarnings, formatMoney(sum(monthDays, 'totalEstimatedDailyEarnings')));
  setElementText(monthSummary.fairGoalMet, String(monthGoalSummary.fairGoalDays));
  setElementText(monthSummary.goalMet, String(monthGoalSummary.excellentGoalDays));
  setElementText(monthSummary.goalBelow, String(monthGoalSummary.belowFairGoalDays));
  setElementText(monthSummary.goalAverage, formatMaybeMoney(monthGoalSummary.averageCompletedLoadPayPerWorkday));

  const selectedDateSummary = summarizeLoadsForDates(selectedDateRecords);
  daily.grossBarrels.textContent = formatBarrels(summaryRecord.totalGrossBarrels);
  daily.loadedMiles.textContent = formatMiles(summaryRecord.totalLoadedMiles);
  daily.reRoutedMiles.textContent = formatMiles(summaryRecord.totalReRoutedMiles);
  daily.totalMilesIncludingReRoute.textContent = formatMiles(summaryRecord.totalMilesIncludingReRoute);
  daily.barrelsOffloaded.textContent = formatBarrels(summaryRecord.totalBarrelsOffloaded);
  daily.differenceGross.textContent = formatMeteredDifference(summaryRecord.totalDifferenceVsGrossBarrels);
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
  setElementText(dailyGoal.completedPay, formatMoney(summaryRecord.completedLoadPay));
  setElementText(dailyGoal.goal, formatMoney(summaryRecord.excellentDayGoal));
  setElementText(dailyGoal.status, summaryRecord.excellentGoalStatus);
  setElementText(dailyGoal.difference, formatSpecificGoalDifference(summaryRecord.excellentGoalStatus, summaryRecord.excellentGoalDifference));
  setElementText(dailyGoal.fairStatus, `${formatMoney(summaryRecord.fairDayGoal)} · ${summaryRecord.fairGoalStatus}`);
  setElementText(dailyGoal.fairDifference, formatSpecificGoalDifference(summaryRecord.fairGoalStatus, summaryRecord.fairGoalDifference));
  setGoalResultClass(dailyGoal.card, summaryRecord.goalStatus, 'daily-goal-card');
  const workday = getDailyAddOn(selectedDate);
  setElementText(workdayControls.status, getWorkdayStatus(workday));
  setElementText(workdayControls.date, selectedDate);
  setElementText(workdayControls.dispatcher, workday.defaultDispatcher || 'Unknown');
  setElementText(workdayControls.completedLoads, String(summaryRecord.completedLoadCount));
  setElementText(workdayControls.completedPay, formatMoney(summaryRecord.completedLoadPay));
  setElementText(workdayControls.totalEarnings, formatMoney(summaryRecord.totalEstimatedDailyEarnings));
  setElementText(workdayControls.dutyTime, formatMaybeDuration(summaryRecord.exactDutyMinutes));
  setElementText(workdayControls.goalStatus, summaryRecord.excellentGoalStatus);

  return selectedDateSummary;
}

function updateDailySummary() {
  const selectedDate = daily.date.value || fields.loadDate.value || todayLocal();
  daily.date.value = selectedDate;
  const summaryRecord = updateDailyEarningsRecord(selectedDate) || getDailyEarningsSummary(selectedDate);

  daily.completedLoads.textContent = String(summaryRecord.completedLoadCount);
  daily.rejects.textContent = String(summaryRecord.rejectCount);
  setElementText(daily.todayCompleted, String(summaryRecord.completedLoadCount));
  setElementText(daily.todayRejects, String(summaryRecord.rejectCount));
  setElementText(daily.todayCompletedPay, formatMoney(summaryRecord.completedLoadPay));
  setElementText(daily.todayHourlyPay, formatMoney(summaryRecord.hourlyAdditionalPay));
  setElementText(daily.todayVacationPay, formatMoney(summaryRecord.vacationPay));
  setElementText(daily.todayOtherPaidTime, formatMoney(summaryRecord.otherPaidTimePay));
  setElementText(daily.todayWaitPay, formatMoney(summaryRecord.totalWaitPay));
  setElementText(daily.todayAddOns, formatMoney(summaryRecord.perDiemPay + summaryRecord.sleeperBerthPay + summaryRecord.trainerPay));
  setElementText(daily.todayDutyTime, formatMaybeDuration(summaryRecord.exactDutyMinutes));
  setElementText(daily.todayEffectiveHourly, isFiniteNumber(summaryRecord.effectiveHourlyEarnings)
    ? `${formatMoney(summaryRecord.effectiveHourlyEarnings)}/hr${summaryRecord.effectiveHourlyBasis === 'estimated' ? ' (estimated)' : ''}`
    : 'Not available');
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
  review.differenceGross.textContent = formatMeteredDifference(summaryRecord.totalDifferenceVsGrossBarrels);
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
  setElementText(review.goalAmount, formatMoney(summaryRecord.excellentDayGoal));
  setElementText(review.goalStatus, summaryRecord.excellentGoalStatus);
  setElementText(review.goalDifference, formatSpecificGoalDifference(summaryRecord.excellentGoalStatus, summaryRecord.excellentGoalDifference));
  setElementText(review.exactDutyTime, formatMaybeDuration(summaryRecord.exactDutyMinutes));
  setElementText(review.completedPayHour, formatMaybeMoney(summaryRecord.completedLoadPayPerExactDutyHour));
  if (review.goalResult) {
    const suffix = summaryRecord.excellentGoalStatus === 'Goal met' ? 'met' : (summaryRecord.excellentGoalStatus === 'Below goal' ? 'below' : 'insufficient');
    review.goalResult.className = `result-row goal-result-${suffix}`;
  }

  renderSavedLoads();
  renderRecentLoads();
  renderReportSummary();
}

function renderDailyPanels() {
  updateDailySummary();
}

function getRecordsSelectedDate() {
  return normalizeDateKey(savedFilters.scope?.value === 'date' ? savedFilters.date?.value : daily.date?.value) || todayLocal();
}

function getUnifiedDailyRecord(dateValue) {
  const date = normalizeDateKey(dateValue);
  const loads = date ? getLoadsForDate(date) : [];
  return {
    date,
    loads,
    paidTime: date ? paidTimeRecords.filter((item) => item.workDate === date) : [],
    addOn: getDailyAddOn(date),
    summary: getDailyEarningsSummary(date, loads)
  };
}

function renderUnifiedDailyRecord() {
  const container = document.getElementById('daily-record-content');
  const total = document.getElementById('daily-record-total');
  if (!container) return;
  const record = getUnifiedDailyRecord(getRecordsSelectedDate());
  const day = record.summary;
  setElementText(total, formatMoney(day.totalEstimatedDailyEarnings));
  const loadRows = record.loads.map((load) => `
    <article class="daily-record-item">
      <div><strong>Load ${escapeHtml(load.loadNumber || '-')}</strong><span>${escapeHtml(load.ticketNumber || 'No ticket')} · ${escapeHtml(formatRoute(load))}</span></div>
      <div><span>${escapeHtml(load.dispatcher || 'No dispatcher')}</span><strong>${escapeHtml(formatMoney(load.estimatedEntryPay))}</strong></div>
      <button class="small-button" type="button" data-daily-edit-load="${escapeHtml(load.id)}">Edit load</button>
    </article>`).join('');
  const paidRows = record.paidTime.map((item) => `
    <article class="daily-record-item">
      <div><strong>${escapeHtml(item.category)}</strong><span>${escapeHtml(formatCsvNumber(item.quantity))} ${escapeHtml(item.quantityUnit)} at ${escapeHtml(formatMoney(item.hourlyRate))}</span></div>
      <strong>${escapeHtml(formatMoney(item.estimatedPay))}</strong>
      <button class="small-button" type="button" data-daily-edit-paid="${escapeHtml(item.id)}">Edit paid time</button>
    </article>`).join('');
  container.innerHTML = `
    <div class="daily-record-overview">
      ${loadChip('Work date', record.date)}
      ${loadChip('Start Workday', record.addOn.shiftStartTime || '-')}
      ${loadChip('End Workday', record.addOn.shiftEndTime || '-')}
      ${loadChip('Workday duration', formatMaybeDuration(day.exactDutyMinutes))}
      ${loadChip('Completed loads', String(day.completedLoadCount))}
      ${loadChip('Rejected loads', String(day.rejectCount))}
      ${loadChip('Completed-load pay', formatMoney(day.completedLoadPay))}
      ${loadChip('Loading wait pay', formatMoney(day.totalPaidPickupWaitMinutes / 60 * getPayRate('waitPayRate')))}
      ${loadChip('Unloading wait pay', formatMoney(day.totalPaidDropoffWaitMinutes / 60 * getPayRate('waitPayRate')))}
      ${loadChip('Total wait pay', formatMoney(day.totalWaitPay))}
      ${loadChip('Vacation pay', formatMoney(day.vacationPay))}
      ${loadChip('Other paid time', formatMoney(day.otherPaidTimePay))}
      ${loadChip('Per diem', formatMoney(day.perDiemPay))}
      ${loadChip('Sleeper pay', formatMoney(day.sleeperBerthPay))}
      ${loadChip('Trainer pay', formatMoney(day.trainerPay))}
      ${loadChip('Reject pay', formatMoney(day.rejectPay))}
      ${loadChip(day.effectiveHourlyBasis === 'exact' ? 'Effective hourly earnings' : 'Effective hourly earnings (estimated)', formatMaybeMoney(day.effectiveHourlyEarnings))}
      ${loadChip('Total Daily Earnings', formatMoney(day.totalEstimatedDailyEarnings))}
    </div>
    <div class="button-row compact"><button class="button secondary" type="button" data-daily-edit-workday="true">Edit Start/End Workday and add-ons</button></div>
    <h4>Load activity</h4>${loadRows || `<article class="empty-card">No loads for ${escapeHtml(record.date)}.</article>`}
    <h4>Paid time</h4>${paidRows || `<article class="empty-card">No paid time for ${escapeHtml(record.date)}.</article>`}
  `;
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
  renderUnifiedDailyRecord();
  renderPaidTimeRecords();
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
        <div class="load-cell"><span>Deadhead</span><strong>${escapeHtml(formatMiles(load.deadheadMiles))}</strong></div>
        <div class="load-cell"><span>Earnings</span><strong>${escapeHtml(formatMoney(load.estimatedEntryPay))}</strong></div>
        <div class="load-cell"><span>Status</span><strong class="status-badge ${isCompleted(load) ? 'completed' : ''}">${escapeHtml(load.loadStatus || 'Incomplete')}</strong></div>
        <div class="load-actions">
          <button class="small-button" type="button" data-action="open" data-id="${escapeHtml(load.id)}">Open</button>
          <button class="small-button" type="button" data-action="edit" data-id="${escapeHtml(load.id)}">Edit</button>
          <details class="record-actions-menu">
            <summary>Actions</summary>
            <div>
              <button class="small-button" type="button" data-action="duplicate" data-id="${escapeHtml(load.id)}">Duplicate</button>
              <button class="small-button" type="button" data-action="print" data-id="${escapeHtml(load.id)}">Print</button>
              <button class="small-button" type="button" data-action="export" data-id="${escapeHtml(load.id)}">Export</button>
              <button class="small-button danger" type="button" data-action="delete" data-id="${escapeHtml(load.id)}">Delete</button>
            </div>
          </details>
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
          ${detailItem('Lease number', load.leaseNumber || '-')}
          ${detailItem('Dispatcher', load.dispatcher || 'Unknown')}
          ${detailItem('Pickup state', displayState(load.pickupState))}
          ${detailItem('Drop-off state', displayState(load.dropoffState))}
          ${detailItem('State route group', getStateRoute(load))}
          ${detailItem('Product type', load.productType)}
          ${detailItem('Regular miles', formatMiles(load.regularMiles))}
          ${detailItem('Rerouted miles', formatMiles(load.reRoutedMiles))}
          ${detailItem('Total miles', formatMiles(load.totalMilesIncludingReRoute))}
          ${detailItem('API gravity', formatNumber(load.apiGravity, 1))}
          ${detailItem('Temperature', isFiniteNumber(load.loadTemperature) ? `${load.loadTemperature.toFixed(1)} deg` : '-')}
          ${detailItem('BS&W percentage', formatPercent(load.bswPercentage))}
          ${detailItem('Load weight', formatWeight(load.effectiveLoadWeight))}
          ${detailItem('Estimated gross truck weight', formatWeight(load.estimatedGrossTruckWeight))}
          ${detailItem('Start meter reading', formatNumber(load.startMeterReading))}
          ${detailItem('End meter reading', formatNumber(load.endMeterReading))}
          ${detailItem('Barrels offloaded', formatBarrels(load.barrelsOffloaded))}
          ${detailItem('Metered difference', formatMeteredDifference(load.differenceVsGrossBarrels))}
          ${detailItem('Offload status', load.offloadStatus)}
          ${detailItem('Loading start', load.arrivedPickupTime || '-')}
          ${detailItem('Loading end', load.loadedTime || '-')}
          ${detailItem('Deadhead start', load.deadheadStartTime || '-')}
          ${detailItem('Deadhead end', load.deadheadEndTime || '-')}
          ${detailItem('Deadhead duration', formatMaybeDuration(load.deadheadTravelMinutes))}
          ${detailItem('Deadhead miles', formatMiles(load.deadheadMiles))}
          ${detailItem('Unload start', load.arrivedDropoffTime || '-')}
          ${detailItem('Unload end', load.completedTime || '-')}
          ${detailItem('Loading site duration', formatDuration(load.pickupTimeMinutes))}
          ${detailItem('Travel duration', formatMaybeDuration(load.travelTimeMinutes))}
          ${detailItem('Loading wait time', formatDuration(load.paidPickupWaitMinutes))}
          ${detailItem('Offloading site duration', formatDuration(load.dropoffTimeMinutes))}
          ${detailItem('Offloading wait time', formatDuration(load.paidDropoffWaitMinutes))}
          ${detailItem('Total paid wait time', formatDuration(load.totalPaidWaitMinutes))}
          ${detailItem('Total load-cycle duration', formatMaybeDuration(load.cycleTimeMinutes))}
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
  if (!isCloudSignedIn()) {
    markLocalChangesPending('Profile saved locally. Sign in to sync it to Firebase.');
  }
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

  if (values.deadheadStartTime && values.deadheadEndTime && parseTimeToMinutes(values.deadheadEndTime) < parseTimeToMinutes(values.deadheadStartTime)) {
    warnings.push('Deadhead end time is earlier than start time, so it will be treated as crossing midnight.');
  }

  if (pickupDuration > 720 || dropoffDuration > 720) {
    warnings.push('One stop has more than 12 hours on location. Review the times before saving.');
  }

  const deadheadDuration = durationBetween(values.deadheadStartTime, values.deadheadEndTime);
  if (deadheadDuration > 720) {
    warnings.push('Deadhead travel time is more than 12 hours. Review the deadhead times before saving.');
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

  if (values.loadWeight !== null && (!isFiniteNumber(values.loadWeight) || values.loadWeight < 0)) {
    messages.push('Load weight must be 0 or greater if entered.');
    setFieldError('loadWeight', 'Enter 0 or greater, or leave it blank.');
  }

  if (values.loadedMiles !== null && (!isFiniteNumber(values.loadedMiles) || values.loadedMiles < 0)) {
    messages.push('Loaded miles must be 0 or greater.');
    setFieldError('loadedMiles', 'Enter loaded miles of 0 or greater, or leave it blank.');
  }

  if (values.deadheadMiles !== null && (!isFiniteNumber(values.deadheadMiles) || values.deadheadMiles < 0)) {
    messages.push('Deadhead miles must be 0 or greater.');
    setFieldError('deadheadMiles', 'Enter deadhead miles of 0 or greater, or leave it blank.');
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
    ...values,
    dispatcher: normalizeDispatcherName(values.dispatcher)
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
  if (!isCloudSignedIn()) {
    markLocalChangesPending('Load saved locally. Sign in to sync it to Firebase.');
  }
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
  fields.dispatcher.value = getDailyAddOn(workDate).defaultDispatcher || previousRecord.dispatcher || getRecentDispatcherForDate(workDate);
  applyProfileToNewLoad();

  if (appSettings.keepRouteForNextLoad) {
    fields.pickupLocation.value = previousRecord.pickupLocation || '';
    fields.pickupState.value = previousRecord.pickupState || '';
    fields.dropoffLocation.value = previousRecord.dropoffLocation || '';
    fields.dropoffState.value = previousRecord.dropoffState || '';
    fields.productType.value = previousRecord.productType || 'Crude Oil';
    fields.loadedMiles.value = isFiniteNumber(previousRecord.loadedMiles) ? previousRecord.loadedMiles : '';
  } else {
    fields.productType.value = 'Crude Oil';
  }

  fields.loadNumber.value = getNextLoadNumber(workDate);
  fields.ticketNumber.value = '';
  fields.bolNumber.value = '';
  fields.jotformConfirmationNumber.value = '';
  if (fields.leaseNumber) fields.leaseNumber.value = '';
  fields.grossBarrels.value = '';
  if (fields.loadTemperature) fields.loadTemperature.value = '';
  if (fields.loadWeight) fields.loadWeight.value = '';
  fields.startMeterReading.value = '';
  fields.endMeterReading.value = '';
  fields.arrivedPickupTime.value = '';
  fields.loadedTime.value = '';
  if (fields.deadheadStartTime) fields.deadheadStartTime.value = '';
  if (fields.deadheadEndTime) fields.deadheadEndTime.value = '';
  if (fields.deadheadMiles) fields.deadheadMiles.value = '';
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
  fields.productType.value = 'Crude Oil';
  fields.dispatcher.value = getRecentDispatcherForDate(fields.loadDate.value);
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

  queuePendingDelete('loads', loadId, {
    loadNumber: load.loadNumber || '',
    ticketNumber: load.ticketNumber || '',
    loadDate: load.loadDate || ''
  });
  savedLoads = savedLoads.filter((item) => item.id !== loadId);
  storeLoads();
  refreshAllDailyEarningsRecords();
  if (!isCloudSignedIn()) {
    markLocalChangesPending('Load deleted locally. Sign in to sync the change to Firebase.');
  }
  deleteCloudLoad(loadId);
  syncCurrentDateToCloud(load.loadDate);
  hideDuplicateWarning();
  clearSaveMessage();

  if (editingLoadId === loadId) {
    clearForm();
  } else {
    ensureLoadNumber();
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
  if (fields.leaseNumber) fields.leaseNumber.value = '';
  fields.startMeterReading.value = '';
  fields.endMeterReading.value = '';
  fields.grossBarrels.value = '';
  if (fields.loadTemperature) fields.loadTemperature.value = '';
  if (fields.loadWeight) fields.loadWeight.value = '';
  fields.arrivedPickupTime.value = '';
  fields.loadedTime.value = '';
  if (fields.deadheadStartTime) fields.deadheadStartTime.value = '';
  if (fields.deadheadEndTime) fields.deadheadEndTime.value = '';
  if (fields.deadheadMiles) fields.deadheadMiles.value = '';
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
    ['Lease number', load.leaseNumber],
    ['Dispatcher', load.dispatcher || 'Unknown'],
    ['Pickup location', load.pickupLocation],
    ['Pickup state', displayState(load.pickupState)],
    ['Delivery location', load.dropoffLocation],
    ['Drop-off state', displayState(load.dropoffState)],
    ['State route group', getStateRoute(load)],
    ['Product', load.productType],
    ['API gravity', formatNumber(load.apiGravity, 1)],
    ['Temperature', isFiniteNumber(load.loadTemperature) ? `${load.loadTemperature.toFixed(1)} deg` : '-'],
    ['BS&W percentage', formatPercent(load.bswPercentage)],
    ['Loading-site time', formatMaybeDuration(load.pickupTimeMinutes)],
    ['Deadhead travel time', formatMaybeDuration(load.deadheadTravelMinutes)],
    ['Deadhead miles', formatMiles(load.deadheadMiles)],
    ['Loaded travel time', formatMaybeDuration(load.travelTimeMinutes)],
    ['Offloading-site time', formatMaybeDuration(load.dropoffTimeMinutes)],
    ['Total load-cycle time', formatMaybeDuration(load.cycleTimeMinutes)],
    ['Gross barrels', formatBarrels(load.grossBarrels)],
    ['Regular miles', formatMiles(load.regularMiles)],
    ['Re-routed miles', formatMiles(load.reRoutedMiles)],
    ['Total miles', formatMiles(load.totalMilesIncludingReRoute)],
    ['Load weight', formatWeight(load.effectiveLoadWeight)],
    ['Gross truck weight', formatWeight(load.estimatedGrossTruckWeight)],
    ['Barrels offloaded', formatBarrels(load.barrelsOffloaded)],
    ['Metered difference', formatMeteredDifference(load.differenceVsGrossBarrels)],
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
    if (!editingLoadId) fields.dispatcher.value = getRecentDispatcherForDate(fields.loadDate.value);
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
    'Dispatcher',
    'Driver name',
    'Truck number',
    'Trailer number',
    'Pickup location',
    'Pickup state',
    'Drop off location',
    'Drop-off state',
    'State route group',
    'Product type',
    'Lease number',
    'Gross barrels',
    'Net barrels',
    'API gravity',
    'Temperature',
    'BS&W percentage',
    'Deadhead start time',
    'Deadhead end time',
    'Deadhead travel minutes',
    'Deadhead miles',
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
    'Load weight used',
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
      load.dispatcher || 'Unknown',
      load.driverName,
      load.truckNumber,
      load.trailerNumber,
      load.pickupLocation,
      displayState(load.pickupState),
      load.dropoffLocation,
      displayState(load.dropoffState),
      getStateRoute(load),
      load.productType,
      load.leaseNumber,
      formatCsvNumber(load.grossBarrels),
      formatCsvNumber(load.netBarrels),
      formatCsvNumber(load.apiGravity, 1),
      formatCsvNumber(load.loadTemperature, 1),
      formatCsvNumber(load.bswPercentage),
      load.deadheadStartTime,
      load.deadheadEndTime,
      formatCsvNumber(load.deadheadTravelMinutes, 0),
      formatCsvNumber(load.deadheadMiles, 1),
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
      isFiniteNumber(load.effectiveLoadWeight) ? Math.round(load.effectiveLoadWeight) : '',
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
    ...paidTimeRecords.map((record) => record.workDate).filter(Boolean),
    daily.date.value
  ]);

  return [...dates].filter(Boolean).sort();
}

function downloadDailyEarningsSummary() {
  refreshAllDailyEarningsRecords();
  const headers = [
    'Date',
    'Total loads',
    'Completed load count',
    'Reject count',
    'Regular miles',
    'Total re-routed miles',
    'Total miles including re-route',
    'Total gross barrels',
    'Total barrels offloaded',
    'Total difference vs gross barrels',
    'Total completed load pay',
    'Eligible dispatched workday',
    'Fair Day Goal',
    'Fair Goal status',
    'Fair Goal difference',
    'Excellent Day Goal',
    'Excellent Goal status',
    'Excellent Goal difference',
    'Default dispatcher',
    'Shift start time',
    'Shift end time',
    'Duty-time basis',
    'Duty minutes',
    'Active load-cycle minutes',
    'Non-load duty minutes',
    'Active utilization percent',
    'Completed-load pay per duty hour',
    'Duty-time status',
    'Workload observation',
    'Total reject pay',
    'Deadhead time minutes',
    'Deadhead miles',
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
    'Deadhead pay',
    'Truck wash pay',
    'Breakdown pay',
    'Office time pay',
    'Training time pay',
    'Other hourly work pay',
    'Vacation pay',
    'Total hourly additional pay',
    'Paid-time overlap status',
    'Paid-time overlap minutes',
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
      record.eligibleDispatchedDay ? 'Yes' : 'No',
      formatCsvNumber(record.fairDayGoal),
      record.fairGoalStatus,
      formatCsvNumber(record.fairGoalDifference),
      formatCsvNumber(record.excellentDayGoal),
      record.excellentGoalStatus,
      formatCsvNumber(record.excellentGoalDifference),
      record.defaultDispatcher || 'Unknown',
      record.shiftStartTime,
      record.shiftEndTime,
      record.dutyTimeSource,
      formatCsvNumber(record.exactDutyMinutes),
      formatCsvNumber(record.activeLoadCycleMinutes),
      formatCsvNumber(record.nonLoadDutyMinutes),
      formatCsvNumber(record.activeLoadUtilization),
      formatCsvNumber(record.completedLoadPayPerExactDutyHour),
      getDutyTimeStatus(record),
      getWorkloadObservation(record),
      formatCsvNumber(record.rejectPay),
      formatCsvNumber(record.deadheadMinutes, 0),
      formatCsvNumber(record.deadheadMiles, 1),
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
      formatCsvNumber(record.deadheadPay),
      formatCsvNumber(record.truckWashPay),
      formatCsvNumber(record.breakdownPay),
      formatCsvNumber(record.officeTimePay),
      formatCsvNumber(record.trainingTimePay),
      formatCsvNumber(record.otherHourlyPay),
      formatCsvNumber(record.vacationPay),
      formatCsvNumber(record.hourlyAdditionalPay),
      record.paidTimeOverlapStatus,
      formatCsvNumber(record.paidTimeOverlapMinutes),
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
      ,paidTime: paidTimeRecords
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
    favoriteRoutes: normalizeFavoriteRoutes(data.favoriteRoutes || []),
    paidTime: normalizePaidTimeRecords(data.paidTime || [])
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
      paidTime: imported.paidTime,
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
    paidTime: [...new Map([...paidTimeRecords, ...imported.paidTime].map((item) => [item.id, item])).values()],
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
    ,paidTimeRecords
  };
  const previousStorage = {
    [STORAGE_KEY]: localStorage.getItem(STORAGE_KEY),
    [ADD_ON_STORAGE_KEY]: localStorage.getItem(ADD_ON_STORAGE_KEY),
    [EARNINGS_STORAGE_KEY]: localStorage.getItem(EARNINGS_STORAGE_KEY),
    [PROFILE_STORAGE_KEY]: localStorage.getItem(PROFILE_STORAGE_KEY),
    [META_STORAGE_KEY]: localStorage.getItem(META_STORAGE_KEY),
    [SETTINGS_STORAGE_KEY]: localStorage.getItem(SETTINGS_STORAGE_KEY),
    [FAVORITE_ROUTES_STORAGE_KEY]: localStorage.getItem(FAVORITE_ROUTES_STORAGE_KEY)
    ,[PAID_TIME_STORAGE_KEY]: localStorage.getItem(PAID_TIME_STORAGE_KEY)
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState.loads));
    localStorage.setItem(ADD_ON_STORAGE_KEY, JSON.stringify(nextState.dailyAddOns));
    localStorage.setItem(EARNINGS_STORAGE_KEY, JSON.stringify(nextState.dailySummaries));
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextState.profile));
    localStorage.setItem(META_STORAGE_KEY, JSON.stringify(nextState.metadata));
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(nextState.settings));
    localStorage.setItem(FAVORITE_ROUTES_STORAGE_KEY, JSON.stringify(nextState.favoriteRoutes));
    localStorage.setItem(PAID_TIME_STORAGE_KEY, JSON.stringify(nextState.paidTime || []));
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
    paidTimeRecords = previousState.paidTimeRecords;
    return false;
  }

  savedLoads = nextState.loads.map(normalizeSavedLoad);
  dailyAddOns = normalizeDailyAddOns(nextState.dailyAddOns);
  dailyEarningsRecords = nextState.dailySummaries;
  driverProfile = normalizeDriverProfile(nextState.profile);
  appMeta = isPlainObject(nextState.metadata) ? nextState.metadata : {};
  appSettings = normalizeAppSettings(nextState.settings);
  favoriteRoutes = normalizeFavoriteRoutes(nextState.favoriteRoutes);
  paidTimeRecords = normalizePaidTimeRecords(nextState.paidTime || []);
  refreshAllDailyEarningsRecords();
  applyProfileToControls();
  applyDailyAddOnsToControls();
  applyPaySettingsToControls();
  renderPaidTimeRecords();
  renderSummary();
  updateDailySummary();
  ensureLoadNumber();
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
  const outcome = getDailyDispatchOutcome(record);
  const firstLoad = getLoadsForDate(date)[0] || {};
  const rows = [
    ['Driver name', firstLoad.driverName || driverProfile.driverName || ''],
    ['Truck number', firstLoad.truckNumber || driverProfile.truckNumber || ''],
    ['Trailer number', firstLoad.trailerNumber || driverProfile.trailerNumber || ''],
    ['Work date', date],
    ['Completed loads', record.completedLoadCount],
    ['Rejects', record.rejectCount],
    ['Total loads', record.completedLoadCount + record.rejectCount],
    ['Completed-load pay', formatMoney(record.completedLoadPay)],
    ['Daily completed-load-pay goal', formatMoney(record.dailyGoal)],
    ['Goal status', record.goalStatus],
    ['Goal difference', formatGoalDifference(record)],
    ['Daily dispatch outcome', outcome.dispatchOutcome],
    ['Dispatch outcome explanation', outcome.dispatchOutcomeExplanation],
    ['Default dispatcher', record.defaultDispatcher || 'Unknown'],
    ['Start Workday', record.shiftStartTime || '-'],
    ['End Workday', record.shiftEndTime || '-'],
    ['Workday duration', formatMaybeDuration(record.exactDutyMinutes)],
    ['Duty-time category', outcome.dutyTimeCategory],
    ['Duty-time status', getDutyTimeStatus(record)],
    ['Active load-cycle time', formatMaybeDuration(record.activeLoadCycleMinutes)],
    ['Non-load duty time', formatMaybeDuration(record.nonLoadDutyMinutes)],
    ['Active utilization', formatPercentValue(record.activeLoadUtilization)],
    ['Workload observation', getWorkloadObservation(record)],
    ['Exact duty time', formatMaybeDuration(record.exactDutyMinutes)],
    ['Completed-load pay per duty hour', formatMaybeMoney(record.completedLoadPayPerExactDutyHour)],
    ['Reject pay', formatMoney(record.rejectPay)],
    ['Wait-time earnings', formatMoney(record.totalWaitPay)],
    ['Trainer pay', formatMoney(record.trainerPay)],
    ['Per diem', formatMoney(record.perDiemPay)],
    ['Sleeper pay', formatMoney(record.sleeperBerthPay)],
    ['Deadhead pay', formatMoney(record.deadheadPay)],
    ['Truck wash pay', formatMoney(record.truckWashPay)],
    ['Breakdown pay', formatMoney(record.breakdownPay)],
    ['Office time pay', formatMoney(record.officeTimePay)],
    ['Training time pay', formatMoney(record.trainingTimePay)],
    ['Other hourly work pay', formatMoney(record.otherHourlyPay)],
    ['Vacation pay', formatMoney(record.vacationPay)],
    ['Total hourly additional pay', formatMoney(record.hourlyAdditionalPay)],
    ['Paid-time overlap review', record.paidTimeOverlapStatus === 'review' ? `Needs review (${formatDuration(record.paidTimeOverlapMinutes)})` : 'No overlap found'],
    [record.effectiveHourlyBasis === 'exact' ? 'Effective hourly earnings' : 'Effective hourly earnings (estimated)', formatMaybeMoney(record.effectiveHourlyEarnings)],
    ['Total Daily Earnings', formatMoney(record.totalEstimatedDailyEarnings)],
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

  if (mode === 'overall') {
    const dates = [
      ...getUniqueSavedLoads().map((load) => load.loadDate),
      ...Object.values(dailyAddOns).map((record) => record.workDate),
      ...paidTimeRecords.map((record) => record.workDate)
    ].filter(Boolean).sort();
    return {
      start: dates[0] || selectedDate,
      end: dates.at(-1) || selectedDate
    };
  }

  if (mode === 'current-pay-period') {
    return getCompanyPayPeriodRange(selectedDate);
  }

  if (mode === 'previous-pay-period') {
    return getPreviousPayPeriodRange(selectedDate);
  }

  if (mode === 'current-month' || mode === 'selected-month') {
    return getMonthRange(selectedDate);
  }

  if (mode === 'previous-month') {
    const date = parseLocalDate(selectedDate);
    date.setMonth(date.getMonth() - 1);
    return getMonthRange(formatLocalDate(date));
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
  Object.values(dailyAddOns)
    .filter((record) => record.workDate >= startDate && record.workDate <= endDate)
    .forEach((record) => dates.add(record.workDate));
  paidTimeRecords
    .filter((record) => record.workDate >= startDate && record.workDate <= endDate)
    .forEach((record) => dates.add(record.workDate));
  const summaries = [...dates].map((date) => getDailyEarningsSummary(date));
  const completedRecords = records.filter(isCompleted);
  const rejectRecords = records.filter(isReject);

  return {
    start: startDate,
    end: endDate,
    loadRecordCount: records.length,
    completedLoadCount: completedRecords.length,
    rejectCount: rejectRecords.length,
    totalAssignmentCount: completedRecords.length + rejectRecords.length,
    totalGrossBarrels: sum(completedRecords, 'grossBarrels'),
    totalBarrelsOffloaded: sum(records, 'barrelsOffloaded'),
    totalLoadedMiles: sum(records, 'loadedMiles'),
    totalReRoutedMiles: sum(records, 'reRoutedMiles'),
    totalDeadheadMinutes: sum(records, 'deadheadTravelMinutes'),
    totalDeadheadMiles: sum(records, 'deadheadMiles'),
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

function median(values) {
  const usable = values.filter(isFiniteNumber).slice().sort((a, b) => a - b);
  if (!usable.length) return null;
  const middle = Math.floor(usable.length / 2);
  return usable.length % 2 ? usable[middle] : (usable[middle - 1] + usable[middle]) / 2;
}

function summarizeLoadLevelRecords(records) {
  const all = getUniqueSavedLoads(records);
  const completed = all.filter(isCompleted);
  const rejects = all.filter(isReject);
  const validCycles = all.filter((load) => isFiniteNumber(load.cycleTimeMinutes) && load.cycleTimeMinutes > 0);
  const completedWithCycles = completed.filter((load) => isFiniteNumber(load.cycleTimeMinutes));
  const completedWithPickupTime = completed.filter((load) => isFiniteNumber(load.pickupTimeMinutes));
  const completedWithUnloadTime = completed.filter((load) => isFiniteNumber(load.dropoffTimeMinutes));
  const completedWithDeadheadTime = completed.filter((load) => isFiniteNumber(load.deadheadTravelMinutes));
  const completedBasePay = sum(completed, 'estimatedPay');
  const rejectPay = sum(rejects, 'estimatedPay');
  const waitPay = sum(all, 'waitPay');
  const loadEntryEarnings = sum(all, 'estimatedEntryPay');
  const validCycleEarnings = sum(validCycles, 'estimatedEntryPay');
  const assignmentCount = completed.length + rejects.length;
  return {
    records: all, completedLoads: completed.length, rejects: rejects.length, totalLoads: assignmentCount,
    completionRate: assignmentCount ? completed.length / assignmentCount * 100 : null,
    rejectRate: assignmentCount ? rejects.length / assignmentCount * 100 : null,
    loadedMiles: sum(all, 'loadedMiles'), reroutedMiles: sum(all, 'reRoutedMiles'), deadheadMiles: sum(all, 'deadheadMiles'), grossBarrels: sum(completed, 'grossBarrels'),
    barrelsOffloaded: sum(all, 'barrelsOffloaded'),
    completedBasePay, rejectPay, waitPay, loadEntryEarnings,
    pickupMinutes: sum(all, 'pickupTimeMinutes'), deadheadMinutes: sum(all, 'deadheadTravelMinutes'), travelMinutes: sum(all, 'travelTimeMinutes'), dropoffMinutes: sum(all, 'dropoffTimeMinutes'),
    cycleMinutes: sum(validCycles, 'cycleTimeMinutes'), paidPickupWaitMinutes: sum(all, 'paidPickupWaitMinutes'), paidDropoffWaitMinutes: sum(all, 'paidDropoffWaitMinutes'),
    averageCycleMinutes: average(completedWithCycles, 'cycleTimeMinutes'), medianCycleMinutes: median(completedWithCycles.map((load) => load.cycleTimeMinutes)),
    averageDeadheadMinutesPerLoad: average(completedWithDeadheadTime, 'deadheadTravelMinutes'),
    averageLoadingMinutes: average(completedWithPickupTime, 'pickupTimeMinutes'),
    averageUnloadingMinutes: average(completedWithUnloadTime, 'dropoffTimeMinutes'),
    averageEarningsPerAssignment: all.length ? loadEntryEarnings / all.length : null,
    averageBasePayPerCompletedLoad: completed.length ? completedBasePay / completed.length : null,
    averageAllInCompletedEarnings: completed.length ? sum(completed, 'estimatedEntryPay') / completed.length : null,
    averageAllInLoadEarnings: all.length ? loadEntryEarnings / all.length : null,
    cycleHourEarnings: sum(validCycles, 'cycleTimeMinutes') > 0 ? validCycleEarnings / (sum(validCycles, 'cycleTimeMinutes') / 60) : null,
    loadsMissingTime: all.length - validCycles.length
  };
}

function groupLoadAnalysis(records, keySelector) {
  const groups = new Map();
  getUniqueSavedLoads(records).forEach((load) => {
    const key = keySelector(load) || 'Unknown';
    groups.set(key, [...(groups.get(key) || []), load]);
  });
  return [...groups.entries()].map(([name, loads]) => ({ name, ...summarizeLoadLevelRecords(loads) })).sort((a, b) => a.name.localeCompare(b.name));
}

function groupAnalysis(records, keySelector) {
  return groupLoadAnalysis(records, keySelector);
}

function buildAnalysisDays(records, startDate = '', endDate = '') {
  const byDate = new Map();
  getUniqueSavedLoads(records).forEach((load) => {
    if (load.loadDate) byDate.set(load.loadDate, [...(byDate.get(load.loadDate) || []), load]);
  });
  const inferredDates = [...byDate.keys()].sort();
  const rangeStart = startDate || inferredDates[0] || '';
  const rangeEnd = endDate || inferredDates.at(-1) || rangeStart;
  if (rangeStart && rangeEnd) {
    Object.values(dailyAddOns)
      .filter((record) => record.workDate >= rangeStart && record.workDate <= rangeEnd)
      .forEach((record) => {
        if (!byDate.has(record.workDate)) byDate.set(record.workDate, []);
      });
    paidTimeRecords
      .filter((record) => record.workDate >= rangeStart && record.workDate <= rangeEnd)
      .forEach((record) => {
        if (!byDate.has(record.workDate)) byDate.set(record.workDate, []);
      });
  }
  return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, loads]) => {
    const summary = getDailyEarningsSummary(date, loads);
    const names = new Map();
    loads.map((load) => normalizeDispatcherName(load.dispatcher, loads)).filter(Boolean).forEach((name) => {
      if (!names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
    });
    const dispatcher = names.size === 0 ? 'Unknown' : (names.size === 1 ? [...names.values()][0] : 'Mixed Dispatchers');
    const day = { ...summary, dispatcher, loads, missingDispatcherLoads: loads.filter((load) => !String(load.dispatcher || '').trim()).length };
    return { ...day, ...getDailyDispatchOutcome(day) };
  });
}

function getDailyDispatchOutcome(day) {
  if (!isFiniteNumber(day?.exactDutyMinutes) || day.exactDutyMinutes <= 0) {
    return {
      dispatchOutcome: 'Insufficient Time Data',
      dutyTimeCategory: 'Missing exact workday times',
      dispatchOutcomeExplanation: 'Start Workday or End Workday is missing or invalid, so the workday length is not classified.'
    };
  }
  const fairGoal = isFiniteNumber(day.fairDayGoal) ? day.fairDayGoal : getFairDayGoal();
  const metGoal = day.fairGoalStatus
    ? day.fairGoalStatus === 'Goal met'
    : (isFiniteNumber(day.completedLoadPay) && day.completedLoadPay >= fairGoal);
  const difference = Math.abs(day.completedLoadPay - fairGoal);
  const comparison = metGoal ? `${formatMoney(difference)} above` : `${formatMoney(difference)} below`;
  const duration = formatDuration(day.exactDutyMinutes);
  let dispatchOutcome = 'Below Earnings Goal';
  if (day.exactDutyMinutes >= 840) dispatchOutcome = metGoal ? '14-Hour Review' : 'Poor Dispatch Outcome — Review';
  else if (metGoal && day.exactDutyMinutes >= 720) dispatchOutcome = 'Productive but Extended';
  else if (metGoal) dispatchOutcome = 'Productive';
  return {
    dispatchOutcome,
    dutyTimeCategory: day.exactDutyMinutes >= 840 ? '14 hours or longer' : (day.exactDutyMinutes >= 720 ? '12 to under 14 hours' : 'Under 12 hours'),
    dispatchOutcomeExplanation: `Completed-load pay was ${comparison} the ${formatMoney(fairGoal)} Fair Goal, and the exact workday lasted ${duration}.`
  };
}

function summarizeDayRows(days, name = '') {
  const completedLoads = sum(days, 'completedLoadCount');
  const rejects = sum(days, 'rejectCount');
  const assignments = completedLoads + rejects;
  const eligibleDispatchedWorkdays = days.filter((day) => day.eligibleDispatchedDay);
  const daysWithPaidWait = eligibleDispatchedWorkdays.filter((day) => day.totalPaidWaitMinutes > 0);
  const daysWithDeadhead = eligibleDispatchedWorkdays.filter((day) => day.deadheadMinutes > 0 || day.deadheadMiles > 0);
  const exactDays = days.filter((day) => day.dutyTimeSource === 'exact');
  const estimatedDays = days.filter((day) => day.dutyTimeSource === 'estimated' && day.timelineStatus !== 'review');
  const missingDays = days.filter((day) => day.dutyTimeSource === 'missing');
  const exactDutyMinutes = sum(exactDays, 'exactDutyMinutes');
  const estimatedSpanMinutes = sum(estimatedDays, 'estimatedTrackedSpanMinutes');
  const usableDutyMinutes = exactDutyMinutes + estimatedSpanMinutes;
  const totalEarnings = sum(days, 'totalEstimatedDailyEarnings');
  const goalSummary = summarizeDailyGoalResults(days);
  return {
    name, days, workdays: days.length, completedLoads, rejects, totalLoads: assignments,
    completionRate: assignments ? completedLoads / assignments * 100 : null,
    rejectRate: assignments ? rejects / assignments * 100 : null,
    eligibleDispatchedWorkdays: eligibleDispatchedWorkdays.length,
    daysWithPaidWait: daysWithPaidWait.length,
    paidWaitDayPercent: eligibleDispatchedWorkdays.length ? daysWithPaidWait.length / eligibleDispatchedWorkdays.length * 100 : null,
    daysWithDeadhead: daysWithDeadhead.length,
    deadheadDayPercent: eligibleDispatchedWorkdays.length ? daysWithDeadhead.length / eligibleDispatchedWorkdays.length * 100 : null,
    exactDays: exactDays.length, estimatedDays: estimatedDays.length, missingTimeDays: missingDays.length,
    exactDutyMinutes, estimatedSpanMinutes, usableDutyMinutes,
    completedBasePay: sum(days, 'completedLoadPay'), rejectPay: sum(days, 'rejectPay'), waitPay: sum(days, 'totalWaitPay'),
    perDiemPay: sum(days, 'perDiemPay'), sleeperPay: sum(days, 'sleeperBerthPay'), trainerPay: sum(days, 'trainerPay'),
    deadheadPay: sum(days, 'deadheadPay'), deadheadMinutes: sum(days, 'deadheadMinutes'), deadheadMiles: sum(days, 'deadheadMiles'),
    truckWashPay: sum(days, 'truckWashPay'), breakdownPay: sum(days, 'breakdownPay'),
    officeTimePay: sum(days, 'officeTimePay'), trainingTimePay: sum(days, 'trainingTimePay'),
    otherHourlyPay: sum(days, 'otherHourlyPay'), vacationPay: sum(days, 'vacationPay'), hourlyAdditionalPay: sum(days, 'hourlyAdditionalPay'), totalEarnings,
    averageEarningsPerWorkday: days.length ? totalEarnings / days.length : null,
    averageTotalEarningsPerWorkday: days.length ? totalEarnings / days.length : null,
    averageCompletedLoadEarningsPerEligibleWorkday: eligibleDispatchedWorkdays.length ? sum(eligibleDispatchedWorkdays, 'completedLoadPay') / eligibleDispatchedWorkdays.length : null,
    effectiveHourlyEarnings: usableDutyMinutes > 0 ? totalEarnings / (usableDutyMinutes / 60) : null,
    completedLoadsPerDutyHour: usableDutyMinutes > 0 ? completedLoads / (usableDutyMinutes / 60) : null,
    averageCompletedLoadsPerWorkday: days.length ? completedLoads / days.length : null,
    averageDutyHoursPerWorkday: days.length && usableDutyMinutes > 0 ? usableDutyMinutes / 60 / days.length : null,
    completedLoadPayPerExactDutyHour: exactDutyMinutes > 0 ? sum(exactDays, 'completedLoadPay') / (exactDutyMinutes / 60) : null,
    averageNonLoadDutyMinutes: exactDays.filter((day) => isFiniteNumber(day.nonLoadDutyMinutes)).length
      ? sum(exactDays.filter((day) => isFiniteNumber(day.nonLoadDutyMinutes)), 'nonLoadDutyMinutes') / exactDays.filter((day) => isFiniteNumber(day.nonLoadDutyMinutes)).length : null,
    daysUnder12Hours: exactDays.filter((day) => day.exactDutyMinutes < 720).length,
    days12ToUnder14Hours: exactDays.filter((day) => day.exactDutyMinutes >= 720 && day.exactDutyMinutes < 840).length,
    daysAtOrAbove14Hours: exactDays.filter((day) => day.exactDutyMinutes >= 840).length,
    percentExactDaysAtOrAbove14Hours: exactDays.length ? exactDays.filter((day) => day.exactDutyMinutes >= 840).length / exactDays.length * 100 : null,
    belowGoalPlus14HourDays: exactDays.filter((day) => day.exactDutyMinutes >= 840 && day.goalStatus === 'Below goal').length,
    extendedGoalMissedDays: exactDays.filter((day) => day.exactDutyMinutes >= 720 && day.goalStatus === 'Below goal').length,
    missingDispatcherLoads: sum(days, 'missingDispatcherLoads'),
    completedLoadEarningsPercent: totalEarnings ? sum(days, 'completedLoadPay') / totalEarnings * 100 : null,
    waitPayPercent: totalEarnings ? sum(days, 'totalWaitPay') / totalEarnings * 100 : null,
    paidTimePercent: totalEarnings ? sum(days, 'hourlyAdditionalPay') / totalEarnings * 100 : null,
    vacationPayPercent: totalEarnings ? sum(days, 'vacationPay') / totalEarnings * 100 : null,
    addOnPayPercent: totalEarnings ? (sum(days, 'perDiemPay') + sum(days, 'sleeperBerthPay') + sum(days, 'trainerPay')) / totalEarnings * 100 : null,
    ...goalSummary
  };
}

function buildDispatcherDayComparison(records, startDate = '', endDate = '') {
  const groups = new Map();
  buildAnalysisDays(records, startDate, endDate).forEach((day) => groups.set(day.dispatcher, [...(groups.get(day.dispatcher) || []), day]));
  return [...groups.entries()].map(([name, days]) => summarizeDayRows(days, name)).sort((a, b) => a.name.localeCompare(b.name));
}

function summarizeAnalysisRecords(records, startDate = '', endDate = '') {
  const all = getUniqueSavedLoads(records);
  const loadLevel = summarizeLoadLevelRecords(all);
  const days = buildAnalysisDays(all, startDate, endDate);
  const dayTotals = summarizeDayRows(days, 'All days');
  const exactDays = days.filter((day) => day.dutyTimeSource === 'exact');
  const estimatedDays = days.filter((day) => day.dutyTimeSource === 'estimated');
  const exactEarnings = sum(exactDays, 'totalEstimatedDailyEarnings');
  const estimatedEarnings = sum(estimatedDays, 'totalEstimatedDailyEarnings');
  const utilizationDays = days.filter((day) => day.dutyTimeSource === 'exact'
    && day.timelineStatus === 'valid'
    && isFiniteNumber(day.activeLoadCycleMinutes)
    && day.exactDutyMinutes > 0
    && day.activeLoadCycleMinutes <= day.exactDutyMinutes);
  const utilizationExactDutyMinutes = sum(utilizationDays, 'exactDutyMinutes');
  const activeLoadCycleMinutes = sum(utilizationDays, 'activeLoadCycleMinutes');
  return {
    ...loadLevel, ...dayTotals, start: startDate, end: endDate, days,
    exactHourlyEarnings: dayTotals.exactDutyMinutes > 0 ? exactEarnings / (dayTotals.exactDutyMinutes / 60) : null,
    estimatedHourlyEarnings: dayTotals.estimatedSpanMinutes > 0 ? estimatedEarnings / (dayTotals.estimatedSpanMinutes / 60) : null,
    mixedBasisHourlyEarnings: dayTotals.usableDutyMinutes > 0 ? (exactEarnings + estimatedEarnings) / (dayTotals.usableDutyMinutes / 60) : null,
    dispatcherCount: all.filter((load) => String(load.dispatcher || '').trim()).length,
    pickupStateCount: all.filter((load) => load.pickupState).length, dropoffStateCount: all.filter((load) => load.dropoffState).length,
    completeStateCount: all.filter((load) => load.pickupState && load.dropoffState).length,
    completeCycleCount: all.filter((load) => isFiniteNumber(load.cycleTimeMinutes)).length,
    noUsableTimeDays: days.filter((day) => !isFiniteNumber(day.usableDutyMinutes)).length,
    mixedDispatcherDays: days.filter((day) => day.dispatcher === 'Mixed Dispatchers').length,
    timelineErrorDays: days.filter((day) => day.timelineStatus === 'review').length,
    exactUtilizationDays: utilizationDays.length,
    excludedExactUtilizationDays: exactDays.length - utilizationDays.length,
    utilizationExactDutyMinutes,
    activeLoadCycleMinutes,
    nonLoadDutyMinutes: utilizationExactDutyMinutes - activeLoadCycleMinutes,
    activeLoadUtilization: utilizationExactDutyMinutes > 0 ? activeLoadCycleMinutes / utilizationExactDutyMinutes * 100 : null
  };
}

function getAnalysisFilters() {
  return {
    dispatcher: reportControls.dispatcher?.value || '', pickupState: reportControls.pickupState?.value || '',
    dropoffState: reportControls.dropoffState?.value || '', stateRoute: reportControls.stateRoute?.value || '', exactRoute: reportControls.exactRoute?.value || ''
  };
}

function hasActiveAnalysisFilters(filters = getAnalysisFilters()) {
  return Object.values(filters).some(Boolean);
}

function describeAnalysisFilters(filters = getAnalysisFilters()) {
  const labels = { dispatcher: 'Dispatcher', pickupState: 'Pickup state', dropoffState: 'Drop-off state', stateRoute: 'State route', exactRoute: 'Exact route' };
  const active = Object.entries(filters).filter(([, value]) => value).map(([key, value]) => `${labels[key]}: ${value}`);
  return active.length ? active.join(' · ') : 'None';
}

function filterAnalysisRecords(records, filters) {
  const all = getUniqueSavedLoads(records);
  return all.filter((load) => (
    (!filters.dispatcher || (normalizeDispatcherName(load.dispatcher, all) || 'Unknown') === filters.dispatcher)
    && (!filters.pickupState || displayState(load.pickupState) === filters.pickupState)
    && (!filters.dropoffState || displayState(load.dropoffState) === filters.dropoffState)
    && (!filters.stateRoute || getStateRoute(load) === filters.stateRoute)
    && (!filters.exactRoute || formatRoute(load) === filters.exactRoute)
  ));
}

function getFilteredAnalysisRecords(startDate, endDate) {
  return filterAnalysisRecords(getLoadsForRange(startDate, endDate), getAnalysisFilters());
}

function filterDispatcherDays(records, dispatcher = '') {
  const days = buildAnalysisDays(records);
  return dispatcher ? days.filter((day) => day.dispatcher === dispatcher) : days;
}

function loadAnalysisTable(title, rows) {
  if (!rows.length) return `<h4>${escapeHtml(title)}</h4><p class="helper-text">No matching records.</p>`;
  return `<h4>${escapeHtml(title)}</h4><div class="table-scroll"><table><thead><tr><th>Group</th><th>Completed</th><th>Rejects</th><th>Loads</th><th>Completion</th><th>Loaded miles</th><th>Rerouted</th><th>Base pay</th><th>Reject pay</th><th>Wait pay</th><th>Load-entry earnings</th><th>Avg cycle</th><th>Median cycle</th><th>Avg base/completed</th><th>Avg all-in/completed</th><th>Avg/load</th><th>Cycle-hour earnings</th><th>Missing time</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${row.completedLoads}</td><td>${row.rejects}</td><td>${row.totalLoads}</td><td>${formatPercentValue(row.completionRate)}</td><td>${formatMiles(row.loadedMiles)}</td><td>${formatMiles(row.reroutedMiles)}</td><td>${formatMoney(row.completedBasePay)}</td><td>${formatMoney(row.rejectPay)}</td><td>${formatMoney(row.waitPay)}</td><td>${formatMoney(row.loadEntryEarnings)}</td><td>${formatMaybeDuration(row.averageCycleMinutes)}</td><td>${formatMaybeDuration(row.medianCycleMinutes)}</td><td>${formatMaybeMoney(row.averageBasePayPerCompletedLoad)}</td><td>${formatMaybeMoney(row.averageAllInCompletedEarnings)}</td><td>${formatMaybeMoney(row.averageEarningsPerAssignment)}</td><td>${formatMaybeMoney(row.cycleHourEarnings)}</td><td>${row.loadsMissingTime}</td></tr>`).join('')}</tbody></table></div>`;
}

function dispatcherDayTable(rows) {
  return `<h4>Dispatcher Comparison</h4><p class="report-disclosure">Completed-load pay measures assigned-load productivity. Other compensation is shown separately and does not change the dispatch outcome.</p><div class="table-scroll priority-table"><table><thead><tr><th>Dispatcher</th><th>Workdays</th><th>Completed</th><th>Rejects</th><th>Avg completed/day</th><th>Avg completed-load pay/day</th><th>Goal-met days</th><th>Goal-met %</th><th>Below-goal days</th><th>Avg exact duty</th><th>Under 12h</th><th>12–&lt;14h</th><th>≥14h</th><th>≥14h %</th><th>Completed pay/exact hour</th><th>Avg non-load duty</th><th>Below goal + 14h</th><th>Avg total earnings/day</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${row.workdays}</td><td>${row.completedLoads}</td><td>${row.rejects}</td><td>${formatMaybeNumber(row.averageCompletedLoadsPerWorkday)}</td><td>${formatMaybeMoney(row.averageCompletedLoadPayPerWorkday)}</td><td>${row.daysGoalMet}</td><td>${formatPercentValue(row.percentUsableDaysMeetingGoal)}</td><td>${row.daysBelowGoal}</td><td>${escapeHtml(formatMaybeDuration(row.exactDays ? row.exactDutyMinutes / row.exactDays : null))}</td><td>${row.daysUnder12Hours}</td><td>${row.days12ToUnder14Hours}</td><td>${row.daysAtOrAbove14Hours}</td><td>${formatPercentValue(row.percentExactDaysAtOrAbove14Hours)}</td><td>${formatMaybeMoney(row.completedLoadPayPerExactDutyHour)}</td><td>${formatMaybeDuration(row.averageNonLoadDutyMinutes)}</td><td>${row.belowGoalPlus14HourDays}</td><td>${formatMaybeMoney(row.averageEarningsPerWorkday)}</td></tr>`).join('')}</tbody></table></div>`;
}

function dailyResultsTable(days) {
  if (!days.length) return '<h4>Daily Results</h4><p class="helper-text">No workdays are available in this range.</p>';
  return `<h4>Daily Results</h4><div class="daily-results-list">${days.map((day) => {
    const paid = paidTimeRecords.filter((item) => item.workDate === day.date);
    const missing = [
      day.missingDispatcherLoads ? `${day.missingDispatcherLoads} load(s) missing dispatcher` : '',
      day.loads.filter((load) => !isFiniteNumber(load.cycleTimeMinutes)).length ? `${day.loads.filter((load) => !isFiniteNumber(load.cycleTimeMinutes)).length} load(s) missing cycle time` : '',
      day.dutyTimeSource !== 'exact' ? 'exact Start or End Workday missing' : ''
    ].filter(Boolean);
    return `<details class="analysis-day-card"><summary><span><strong>${escapeHtml(day.date)}</strong><small>${escapeHtml(day.dispatcher)}</small></span><span><strong>${escapeHtml(day.dispatchOutcome)}</strong><small>${escapeHtml(formatMoney(day.completedLoadPay))} completed-load pay · ${escapeHtml(formatMaybeDuration(day.exactDutyMinutes))}</small></span></summary>
      <p>${escapeHtml(day.dispatchOutcomeExplanation)}</p>
      <div class="review-grid compact-analysis-grid">
        ${reportMetric('Completed loads', day.completedLoadCount)}
        ${reportMetric('Completed-load pay', formatMoney(day.completedLoadPay))}
        ${reportMetric('Fair Goal', formatSpecificGoalDifference(day.fairGoalStatus, day.fairGoalDifference))}
        ${reportMetric('Excellent Goal', formatSpecificGoalDifference(day.excellentGoalStatus, day.excellentGoalDifference))}
        ${reportMetric('Exact duty duration', formatMaybeDuration(day.exactDutyMinutes))}
        ${reportMetric('Paid wait', formatMaybeDuration(day.totalPaidWaitMinutes))}
        ${reportMetric('Wait pay', formatMoney(day.totalWaitPay))}
        ${reportMetric('Deadhead time', formatMaybeDuration(day.deadheadMinutes))}
        ${reportMetric('Deadhead miles', formatMiles(day.deadheadMiles))}
        ${reportMetric('Duty-time category', day.dutyTimeCategory)}
        ${reportMetric('Completed pay per duty hour', formatMaybeMoney(day.completedLoadPayPerExactDutyHour))}
        ${reportMetric('Total estimated earnings', formatMoney(day.totalEstimatedDailyEarnings))}
        ${reportMetric('Data completeness', missing.length ? 'Needs information' : 'Complete')}
      </div>
      ${missing.length ? `<p class="validation-summary show warning">${escapeHtml(missing.join(' · '))}</p>` : ''}
      <h5>Loads</h5>${day.loads.length ? day.loads.map((load) => `<article class="analysis-detail-row"><strong>Load ${escapeHtml(load.loadNumber || '-')}</strong><span>${escapeHtml(load.pickupLocation || 'Unknown')} → ${escapeHtml(load.dropoffLocation || 'Unknown')}</span><span>${escapeHtml(formatMiles(load.loadedMiles))} loaded · ${escapeHtml(formatMiles(load.deadheadMiles))} deadhead · base ${escapeHtml(formatMoney(load.estimatedPay))} · wait ${escapeHtml(formatMoney(load.waitPay))} · ${escapeHtml(formatMaybeDuration(load.cycleTimeMinutes))}</span></article>`).join('') : '<p class="helper-text">No loads.</p>'}
      <h5>Paid time and daily add-ons</h5><p>${paid.length ? paid.map((item) => `${escapeHtml(item.category)} ${escapeHtml(formatMoney(item.estimatedPay))}`).join(' · ') : 'No paid-time entries.'} Per diem ${escapeHtml(formatMoney(day.perDiemPay))} · Sleeper ${escapeHtml(formatMoney(day.sleeperBerthPay))} · Trainer ${escapeHtml(formatMoney(day.trainerPay))}</p>
    </details>`;
  }).join('')}</div>`;
}

function buildDispatcherPerformanceRows(records, days) {
  const completedLoads = getUniqueSavedLoads(records).filter(isCompleted);
  const allCompletedCount = completedLoads.length;
  const allEligibleDates = new Set(days.filter((day) => day.eligibleDispatchedDay).map((day) => day.date));
  const groups = new Map();
  getUniqueSavedLoads(records).filter((load) => isCompleted(load) || isReject(load)).forEach((load) => {
    const dispatcher = normalizeDispatcherName(load.dispatcher, records) || getDailyAddOn(load.loadDate).defaultDispatcher || 'Unknown';
    if (!groups.has(dispatcher)) groups.set(dispatcher, []);
    groups.get(dispatcher).push(load);
  });

  return [...groups.entries()].map(([name, loads]) => {
    const completed = loads.filter(isCompleted);
    const dates = [...new Set(loads.map((load) => load.loadDate).filter(Boolean))];
    const dispatcherDays = dates.map((date) => {
      const dayLoads = loads.filter((load) => load.loadDate === date);
      return calculateDailyCompletedLoadPayGoal(dayLoads);
    });
    const goalSummary = summarizeDailyGoalResults(dispatcherDays);
    const completedPay = sum(completed, 'estimatedPay');
    return {
      name,
      workdays: dates.length,
      workdayShare: allEligibleDates.size ? dates.length / allEligibleDates.size * 100 : null,
      completedLoads: completed.length,
      completedLoadShare: allCompletedCount ? completed.length / allCompletedCount * 100 : null,
      completedLoadEarnings: completedPay,
      averageCompletedLoadEarningsPerDispatchedWorkday: dates.length ? completedPay / dates.length : null,
      averageLoadsPerDispatchedWorkday: dates.length ? completed.length / dates.length : null,
      fairGoalDays: goalSummary.fairGoalDays,
      fairGoalPercent: goalSummary.fairGoalPercent,
      excellentGoalDays: goalSummary.excellentGoalDays,
      excellentGoalPercent: goalSummary.excellentGoalPercent,
      belowFairGoalDays: goalSummary.belowFairGoalDays,
      belowFairGoalPercent: goalSummary.belowFairGoalPercent,
      averageWaitMinutes: average(loads, 'totalPaidWaitMinutes'),
      averageDeadheadMinutes: average(loads.filter((load) => isFiniteNumber(load.deadheadTravelMinutes)), 'deadheadTravelMinutes'),
      totalDeadheadMiles: sum(loads, 'deadheadMiles')
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

function dispatcherPerformanceTable(rows) {
  if (!rows.length) return '<h4>Dispatcher Analysis</h4><p class="helper-text">No dispatcher records are available in this range.</p>';
  return `<h4>Dispatcher Analysis</h4><p class="report-disclosure">Load share is based on the dispatcher attached to each load. When multiple dispatchers appear on one day, each dispatcher receives credit only for their assigned loads; daily default dispatcher is used only when a load has no dispatcher.</p><div class="table-scroll priority-table"><table><thead><tr><th>Dispatcher</th><th>Workdays</th><th>Workday share</th><th>Completed loads</th><th>Load share</th><th>Completed-load earnings</th><th>Avg earnings/workday</th><th>Avg loads/workday</th><th>Fair Goal days</th><th>Fair Goal %</th><th>Excellent Goal days</th><th>Excellent Goal %</th><th>Below Fair days</th><th>Below Fair %</th><th>Avg wait</th><th>Avg deadhead</th><th>Deadhead miles</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${row.workdays}</td><td>${formatPercentValue(row.workdayShare)}</td><td>${row.completedLoads}</td><td>${formatPercentValue(row.completedLoadShare)}</td><td>${formatMoney(row.completedLoadEarnings)}</td><td>${formatMaybeMoney(row.averageCompletedLoadEarningsPerDispatchedWorkday)}</td><td>${formatMaybeNumber(row.averageLoadsPerDispatchedWorkday)}</td><td>${row.fairGoalDays}</td><td>${formatPercentValue(row.fairGoalPercent)}</td><td>${row.excellentGoalDays}</td><td>${formatPercentValue(row.excellentGoalPercent)}</td><td>${row.belowFairGoalDays}</td><td>${formatPercentValue(row.belowFairGoalPercent)}</td><td>${formatMaybeDuration(row.averageWaitMinutes)}</td><td>${formatMaybeDuration(row.averageDeadheadMinutes)}</td><td>${formatMiles(row.totalDeadheadMiles)}</td></tr>`).join('')}</tbody></table></div>`;
}

function getPerformanceInsights(result) {
  const selectedDay = result.days.length === 1 ? result.days[0] : null;
  const insights = [];
  if (isFiniteNumber(result.averageCompletedLoadEarningsPerEligibleWorkday)) {
    insights.push(`You averaged ${formatMoney(result.averageCompletedLoadEarningsPerEligibleWorkday)} in completed-load earnings per eligible workday.`);
  }
  insights.push(`You met the ${formatMoney(getFairDayGoal())} Fair Goal on ${result.fairGoalDays} of ${result.eligibleDispatchedWorkdays} eligible workdays, or ${formatPercentValue(result.fairGoalPercent)}.`);
  insights.push(`You met the ${formatMoney(getExcellentDayGoal())} Excellent Goal on ${result.excellentGoalDays} of ${result.eligibleDispatchedWorkdays} eligible workdays, or ${formatPercentValue(result.excellentGoalPercent)}.`);
  insights.push(`Deadhead occurred on ${result.daysWithDeadhead} of ${result.eligibleDispatchedWorkdays} eligible workdays.`);
  insights.push(`Paid wait occurred on ${result.daysWithPaidWait} of ${result.eligibleDispatchedWorkdays} eligible workdays.`);
  if (isFiniteNumber(result.averageCycleMinutes)) {
    insights.push(`Your average full load cycle was ${formatDuration(result.averageCycleMinutes)}.`);
  }
  if (selectedDay) {
    insights.push(`For ${selectedDay.date}, completed-load earnings were ${formatMoney(selectedDay.completedLoadPay)}.`);
  }
  return insights;
}

function analysisTopCards(result) {
  const selectedDay = result.days.length === 1 ? result.days[0] : null;
  return `<div class="analysis-top-cards">
    <article><h4>Goal Achievement</h4>${reportMetric('Completed-load earnings', formatMoney(result.completedBasePay))}${reportMetric('Fair Goal days', `${result.fairGoalDays} of ${result.eligibleDispatchedWorkdays}`)}${reportMetric('Fair Goal percentage', formatPercentValue(result.fairGoalPercent))}${reportMetric('Excellent Goal days', `${result.excellentGoalDays} of ${result.eligibleDispatchedWorkdays}`)}${reportMetric('Excellent Goal percentage', formatPercentValue(result.excellentGoalPercent))}</article>
    <article><h4>Workload and Time</h4>${reportMetric('Eligible dispatched workdays', result.eligibleDispatchedWorkdays)}${reportMetric('Completed loads', result.completedLoads)}${reportMetric('Rejected loads', result.rejects)}${reportMetric('Paid wait days', `${result.daysWithPaidWait} · ${formatPercentValue(result.paidWaitDayPercent)}`)}${reportMetric('Deadhead days', `${result.daysWithDeadhead} · ${formatPercentValue(result.deadheadDayPercent)}`)}</article>
    <article><h4>Productivity</h4>${reportMetric('Avg completed-load earnings/workday', formatMaybeMoney(result.averageCompletedLoadEarningsPerEligibleWorkday))}${reportMetric('Avg loads/eligible workday', formatMaybeNumber(result.averageCompletedLoadsPerWorkday))}${reportMetric('Effective hourly earnings', formatMaybeMoney(selectedDay ? selectedDay.effectiveHourlyEarnings : result.effectiveHourlyEarnings))}${reportMetric('Average load cycle', formatMaybeDuration(result.averageCycleMinutes))}${reportMetric('Total earnings', formatMoney(result.totalEarnings))}</article>
  </div>`;
}

function formatPercentValue(value) { return isFiniteNumber(value) ? `${value.toFixed(1)}%` : 'Not available'; }
function formatMaybeMoney(value) { return isFiniteNumber(value) ? formatMoney(value) : 'Not available'; }
function formatMaybeDuration(value) { return isFiniteNumber(value) ? formatDuration(value) : 'Not enough time data'; }
function formatMaybeNumber(value) { return isFiniteNumber(value) ? value.toFixed(2) : 'Not available'; }

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
    reportMetric('Total loads', String(report.totalAssignmentCount)),
    reportMetric('Completed loads', String(report.completedLoadCount)),
    reportMetric('Rejects', String(report.rejectCount)),
    reportMetric('Gross barrels', formatBarrels(report.totalGrossBarrels)),
    reportMetric('Offloaded barrels', formatBarrels(report.totalBarrelsOffloaded)),
    reportMetric('Loaded miles', formatMiles(report.totalLoadedMiles)),
    reportMetric('Rerouted miles', formatMiles(report.totalReRoutedMiles)),
    reportMetric('Deadhead time', formatDuration(report.totalDeadheadMinutes)),
    reportMetric('Deadhead miles', formatMiles(report.totalDeadheadMiles)),
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
  renderDispatchAnalysis(range.start, range.end);
}

function setFilterOptions(select, values) {
  if (!select) return;
  const current = select.value;
  const uniqueValues = [...new Set(values)].sort();
  select.innerHTML = ['<option value="">All</option>', ...uniqueValues.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)].join('');
  select.value = uniqueValues.includes(current) ? current : '';
}

function renderDispatchAnalysis(startDate, endDate) {
  if (!reportControls.analysisContent) return;
  const rangeRecords = getLoadsForRange(startDate, endDate);
  setFilterOptions(reportControls.dispatcher, [
    ...rangeRecords.map((load) => normalizeDispatcherName(load.dispatcher, rangeRecords) || 'Unknown'),
    ...buildAnalysisDays(rangeRecords, startDate, endDate).map((day) => day.dispatcher)
  ]);
  const filters = getAnalysisFilters();
  const filtersActive = hasActiveAnalysisFilters(filters);
  const records = filterAnalysisRecords(rangeRecords, filters);
  const result = summarizeAnalysisRecords(rangeRecords, startDate, endDate);
  const loadResult = summarizeLoadLevelRecords(records);
  const allDayRows = buildDispatcherDayComparison(rangeRecords, startDate, endDate);
  const dayRows = filters.dispatcher ? allDayRows.filter((row) => row.name === filters.dispatcher) : allDayRows;
  const dispatcherPerformanceRows = buildDispatcherPerformanceRows(rangeRecords, result.days);
  const dispatcherLoadRows = groupLoadAnalysis(records, (load) => normalizeDispatcherName(load.dispatcher, rangeRecords) || 'Unknown');
  const reliability = getAnalysisReliability(result);
  const readiness = getAnalysisReadiness(result);
  const baselineReconciliation = reconcileBaselineAnalysis(result, allDayRows);
  const filteredReconciliation = reconcileFilteredLoadAnalysis(loadResult, dispatcherLoadRows);
  const indicators = getWorkdayIndicators(result.days);
  const overallMetrics = [
    ['Report start', startDate], ['Report end', endDate],
    ['Eligible dispatched workdays', result.eligibleDispatchedWorkdays],
    ['Completed loads', result.completedLoads], ['Rejects', result.rejects], ['Total loads', result.totalLoads],
    ['Completion rate', formatPercentValue(result.completionRate)], ['Reject rate', formatPercentValue(result.rejectRate)], ['Completed-load earnings', formatMoney(result.completedBasePay)],
    ['Reject pay', formatMoney(result.rejectPay)], ['Wait pay', formatMoney(result.waitPay)], ['Per diem', formatMoney(result.perDiemPay)],
    ['Sleeper pay', formatMoney(result.sleeperPay)], ['Trainer pay', formatMoney(result.trainerPay)],
    ['Deadhead pay', formatMoney(result.deadheadPay)], ['Truck wash pay', formatMoney(result.truckWashPay)],
    ['Breakdown pay', formatMoney(result.breakdownPay)], ['Other hourly work pay', formatMoney(result.otherHourlyPay)],
    ['Total hourly additional pay', formatMoney(result.hourlyAdditionalPay)], ['Total estimated earnings', formatMoney(result.totalEarnings)],
    ['Fair Goal days', `${result.fairGoalDays} — ${formatPercentValue(result.fairGoalPercent)}`],
    ['Excellent Goal days', `${result.excellentGoalDays} — ${formatPercentValue(result.excellentGoalPercent)}`],
    ['Below Fair Goal days', `${result.belowFairGoalDays} — ${formatPercentValue(result.belowFairGoalPercent)}`],
    ['Days with paid wait', `${result.daysWithPaidWait} — ${formatPercentValue(result.paidWaitDayPercent)}`],
    ['Days with deadhead', `${result.daysWithDeadhead} — ${formatPercentValue(result.deadheadDayPercent)}`],
    ['Total deadhead time', formatMaybeDuration(result.deadheadMinutes)],
    ['Total deadhead miles', formatMiles(result.deadheadMiles)],
    ['Total loaded miles', formatMiles(result.loadedMiles)],
    ['Exact-duty days', result.exactDays], ['Estimated-span days', result.estimatedDays], ['Missing-time days', result.missingTimeDays],
    ['Exact duty time', formatMaybeDuration(result.exactDays ? result.exactDutyMinutes : null)], ['Estimated tracked span', formatMaybeDuration(result.estimatedDays ? result.estimatedSpanMinutes : null)],
    ['Combined usable duty time', formatMaybeDuration(result.usableDutyMinutes || null)], ['Exact-duty hourly earnings', formatMaybeMoney(result.exactHourlyEarnings)],
    ['Estimated-span hourly earnings', formatMaybeMoney(result.estimatedHourlyEarnings)], ['Combined mixed-basis hourly earnings', formatMaybeMoney(result.mixedBasisHourlyEarnings)],
    ['Days goal met', result.daysGoalMet], ['Days below goal', result.daysBelowGoal], ['Days with insufficient goal data', result.daysInsufficientData],
    ['Usable days meeting goal', formatPercentValue(result.percentUsableDaysMeetingGoal)], ['Total amount above goal', formatMoney(result.totalAmountAboveGoal)],
    ['Total amount below goal', formatMoney(result.totalAmountBelowGoal)], ['Average completed-load pay per workday', formatMaybeMoney(result.averageCompletedLoadPayPerWorkday)]
  ];
  const timeMetrics = [
    ['Exact-duty days', result.exactDays], ['Estimated-span days', result.estimatedDays], ['Missing-time days', result.missingTimeDays],
    ['Exact duty time', formatMaybeDuration(result.exactDays ? result.exactDutyMinutes : null)], ['Estimated tracked work span', formatMaybeDuration(result.estimatedDays ? result.estimatedSpanMinutes : null)],
    ['Combined usable duty time', formatMaybeDuration(result.usableDutyMinutes || null)],
    ['Effective hourly earnings — exact-duty days', formatMaybeMoney(result.exactHourlyEarnings)],
    ['Effective hourly earnings — estimated-span days', formatMaybeMoney(result.estimatedHourlyEarnings)],
    ['Effective hourly earnings — combined mixed basis', formatMaybeMoney(result.mixedBasisHourlyEarnings)],
    ['Total exact-duty days', result.exactDays], ['Days with valid utilization', result.exactUtilizationDays],
    ['Exact-duty days excluded from utilization', result.excludedExactUtilizationDays],
    ['Exact duty time represented in utilization', formatMaybeDuration(result.exactUtilizationDays ? result.utilizationExactDutyMinutes : null)],
    ['Active load-cycle time', formatMaybeDuration(result.exactUtilizationDays ? result.activeLoadCycleMinutes : null)],
    ['Non-load duty time', formatMaybeDuration(result.exactUtilizationDays ? result.nonLoadDutyMinutes : null)],
    ['Active-load utilization', formatPercentValue(result.activeLoadUtilization).replace('Not available', 'Not enough time data')],
    ['Days missing exact shift time', result.days.length - result.exactDays], ['Days with timeline errors', result.timelineErrorDays]
  ];
  reportControls.analysisContent.innerHTML = `
    <div class="readiness-banner"><strong>${escapeHtml(readiness.label)}</strong><p>${escapeHtml(readiness.detail)}</p></div>
    ${analysisTopCards(result)}
    <details class="analysis-section-card" open><summary><strong>Performance Insights</strong></summary><ul class="insight-list">${getPerformanceInsights(result).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></details>
    <p class="report-disclosure permanent-disclosure">The 14-hour result is a personal review indicator only. This tracker is not an ELD and does not make a legal hours-of-service determination.</p>
    <h4>Overall Date-Range Baseline</h4><div class="review-grid analysis-summary">${overallMetrics.map(([label, value]) => reportMetric(label, String(value))).join('')}</div>
    ${dailyResultsTable(filters.dispatcher ? result.days.filter((day) => day.dispatcher === filters.dispatcher) : result.days)}
    ${filtersActive ? `<h4>Filtered Load Summary</h4><div class="review-grid"><div class="result-row"><span>Active filters</span><strong>${escapeHtml(describeAnalysisFilters(filters))}</strong></div>${[
      ['Completed loads', loadResult.completedLoads], ['Rejects', loadResult.rejects], ['Total loads', loadResult.totalLoads],
      ['Completion rate', formatPercentValue(loadResult.completionRate)], ['Loaded miles', formatMiles(loadResult.loadedMiles)], ['Rerouted miles', formatMiles(loadResult.reroutedMiles)],
      ['Gross barrels from completed loads', formatBarrels(loadResult.grossBarrels)], ['Completed-load base pay', formatMoney(loadResult.completedBasePay)],
      ['Reject pay', formatMoney(loadResult.rejectPay)], ['Load-specific wait pay', formatMoney(loadResult.waitPay)], ['Load-entry earnings', formatMoney(loadResult.loadEntryEarnings)],
      ['Average cycle time', formatMaybeDuration(loadResult.averageCycleMinutes)], ['Median cycle time', formatMaybeDuration(loadResult.medianCycleMinutes)],
      ['Average base pay per completed load', formatMaybeMoney(loadResult.averageBasePayPerCompletedLoad)], ['Average all-in completed-load earnings', formatMaybeMoney(loadResult.averageAllInCompletedEarnings)],
      ['Average earnings per load', formatMaybeMoney(loadResult.averageEarningsPerAssignment)], ['Cycle-hour earnings', formatMaybeMoney(loadResult.cycleHourEarnings)],
      ['Loads missing cycle time', loadResult.loadsMissingTime]
    ].map(([label, value]) => reportMetric(label, String(value))).join('')}</div>` : ''}
    <h4>Time Basis Summary</h4><div class="review-grid">${timeMetrics.map(([label, value]) => reportMetric(label, String(value))).join('')}</div>
    ${result.timelineErrorDays ? `<p class="validation-summary show warning">${escapeHtml(result.days.filter((day) => day.timelineStatus === 'review').map((day) => `${day.date}: Timeline needs review`).join(' · '))}</p>` : ''}
    ${dispatcherPerformanceTable(filters.dispatcher ? dispatcherPerformanceRows.filter((row) => row.name === filters.dispatcher) : dispatcherPerformanceRows)}
    <details class="workday-indicators"><summary><strong>Workday Indicators</strong></summary><div class="review-grid">${Object.entries(indicators).map(([label, value]) => reportMetric(label, String(value))).join('')}</div></details>
    <details><summary><strong>View Detailed Completeness</strong></summary><div class="review-grid">${[
      ['Total loads in range', result.totalLoads], ['Completed loads', result.completedLoads], ['Rejects', result.rejects],
      ['Loads with dispatcher', result.dispatcherCount], ['Loads with complete cycle times', result.completeCycleCount], ['Loads missing cycle times', result.totalLoads - result.completeCycleCount],
      ['Days with exact shift times', result.exactDays], ['Days with estimated tracked spans', result.estimatedDays], ['Days with no usable time', result.noUsableTimeDays],
      ['Days with mixed dispatchers', result.mixedDispatcherDays], ['Days with timeline errors', result.timelineErrorDays],
      ['Report reliability', `${reliability.label} — dispatcher ${reliability.dispatcherPercent.toFixed(1)}%, cycle time ${reliability.cyclePercent.toFixed(1)}%, exact shifts ${reliability.exactPercent.toFixed(1)}%`]
    ].map(([label, value]) => reportMetric(label, String(value))).join('')}</div></details>
    ${filtersActive ? `<h4>Filtered Data Completeness</h4><div class="review-grid">${completenessMetrics(records).map(([label, value]) => reportMetric(label, String(value))).join('')}</div>` : ''}
    <details><summary><strong>Underlying Load References</strong></summary><div class="table-scroll"><table><thead><tr><th>Date</th><th>Load</th><th>Ticket</th><th>BOL</th><th>Jotform</th><th>Dispatcher</th><th>Pickup</th><th>Drop-off</th><th>Status</th><th>Base pay</th><th>Wait pay</th><th>Load-entry earnings</th><th>Cycle time</th></tr></thead><tbody>${records.map((load) => `<tr><td>${escapeHtml(load.loadDate)}</td><td>${escapeHtml(load.loadNumber || '-')}</td><td>${escapeHtml(load.ticketNumber || '-')}</td><td>${escapeHtml(load.bolNumber || '-')}</td><td>${escapeHtml(load.jotformConfirmationNumber || '-')}</td><td>${escapeHtml(normalizeDispatcherName(load.dispatcher, rangeRecords) || 'Unknown')}</td><td>${escapeHtml(load.pickupLocation || 'Pickup')}</td><td>${escapeHtml(load.dropoffLocation || 'Drop-off')}</td><td>${escapeHtml(load.loadStatus)}</td><td>${escapeHtml(formatMoney(load.estimatedPay))}</td><td>${escapeHtml(formatMoney(load.waitPay))}</td><td>${escapeHtml(formatMoney(load.estimatedEntryPay))}</td><td>${escapeHtml(formatMaybeDuration(load.cycleTimeMinutes))}</td></tr>`).join('')}</tbody></table></div></details>
    <p class="${baselineReconciliation.ok ? 'report-disclosure' : 'validation-summary show warning'}">${baselineReconciliation.ok ? 'Baseline calculations reconciled.' : 'Analysis calculation needs review'}</p>
    <p class="${filteredReconciliation.ok ? 'report-disclosure' : 'validation-summary show warning'}">${filteredReconciliation.ok ? 'Filtered load calculations reconciled.' : 'Analysis calculation needs review'}</p>
    <p class="report-disclosure">Completed-load productivity excludes daily add-ons and unrelated compensation. Total estimated earnings includes all entered pay. Results depend on entered data; missing information is excluded rather than guessed. Estimated earnings may not match official payroll. Dispatcher comparisons show measurable outcomes and do not establish intent.</p>`;
  if (reportControls.dutyTimeContent) {
    reportControls.dutyTimeContent.innerHTML = `<div class="readiness-banner"><strong>${escapeHtml(readiness.label)}</strong><p>${escapeHtml(readiness.detail)}</p></div>
      ${dutyTimeReviewTable(result.days)}
      <h4>Dispatcher Workload Comparison</h4><div class="table-scroll"><table><thead><tr><th>Dispatcher</th><th>Workdays</th><th>Completed</th><th>Avg completed/day</th><th>Avg duty</th><th>Avg completed pay/day</th><th>Completed pay/duty hour</th><th>Avg non-load duty</th><th>&lt;12h</th><th>12–&lt;14h</th><th>≥14h</th><th>Goal met</th><th>Extended + goal missed</th></tr></thead><tbody>${allDayRows.map((row) => `<tr><td>${escapeHtml(row.name === 'Mixed Dispatchers' ? 'Mixed Dispatch' : row.name)}</td><td>${row.workdays}</td><td>${row.completedLoads}</td><td>${formatMaybeNumber(row.averageCompletedLoadsPerWorkday)}</td><td>${formatMaybeDuration(row.averageDutyHoursPerWorkday * 60)}</td><td>${formatMaybeMoney(row.averageCompletedLoadPayPerWorkday)}</td><td>${formatMaybeMoney(row.completedLoadPayPerExactDutyHour)}</td><td>${formatMaybeDuration(row.averageNonLoadDutyMinutes)}</td><td>${row.daysUnder12Hours}</td><td>${row.days12ToUnder14Hours}</td><td>${row.daysAtOrAbove14Hours}</td><td>${row.daysGoalMet}</td><td>${row.extendedGoalMissedDays}</td></tr>`).join('')}</tbody></table></div>`;
  }
}

function getAnalysisReliability(result) {
  const assignmentBase = result.totalLoads || 1;
  const dayBase = result.days.length || 1;
  const dispatcherPercent = result.dispatcherCount / assignmentBase * 100;
  const statePercent = result.completeStateCount / assignmentBase * 100;
  const cyclePercent = result.completeCycleCount / assignmentBase * 100;
  const exactPercent = result.exactDays / dayBase * 100;
  const label = dispatcherPercent >= 90 && cyclePercent >= 90 && exactPercent >= 90 ? 'High completeness'
    : (dispatcherPercent >= 70 && cyclePercent >= 70 && exactPercent >= 50 ? 'Moderate completeness' : 'Limited completeness');
  return { label, dispatcherPercent, statePercent, cyclePercent, exactPercent };
}

function getAnalysisReadiness(result) {
  if (!result.days.length) return { label: 'Limited Analysis', detail: 'No workdays are included in this range.' };
  const exactDays = result.days.filter((day) => day.dutyTimeSource === 'exact').length;
  const loads = result.days.flatMap((day) => day.loads);
  const missingDispatcher = loads.filter((load) => !String(load.dispatcher || '').trim()).length;
  const missingStatus = loads.filter((load) => ![COMPLETED_STATUS, REJECT_STATUS].includes(load.loadStatus)).length;
  const missingLocations = loads.filter((load) => !String(load.pickupLocation || '').trim() || !String(load.dropoffLocation || '').trim()).length;
  const missingCycles = loads.filter((load) => !isFiniteNumber(load.cycleTimeMinutes)).length;
  const missingPay = loads.filter((load) => !isFiniteNumber(load.estimatedPay)).length;
  const missingExactDays = result.days.length - exactDays;
  const missing = [
    missingDispatcher ? `${missingDispatcher} load${missingDispatcher === 1 ? '' : 's'} missing a dispatcher` : '',
    missingStatus ? `${missingStatus} load${missingStatus === 1 ? '' : 's'} missing a completed or reject status` : '',
    missingLocations ? `${missingLocations} load${missingLocations === 1 ? '' : 's'} missing pickup or drop-off locations` : '',
    missingCycles ? `${missingCycles} load${missingCycles === 1 ? '' : 's'} missing cycle times` : '',
    missingPay ? `${missingPay} load${missingPay === 1 ? '' : 's'} missing valid pay` : '',
    missingExactDays ? `${missingExactDays} workday${missingExactDays === 1 ? '' : 's'} missing exact start or end time` : ''
  ].filter(Boolean);
  const completeLoads = loads.length - new Set(loads.filter((load) =>
    !String(load.dispatcher || '').trim() || ![COMPLETED_STATUS, REJECT_STATUS].includes(load.loadStatus)
    || !String(load.pickupLocation || '').trim() || !String(load.dropoffLocation || '').trim()
    || !isFiniteNumber(load.cycleTimeMinutes) || !isFiniteNumber(load.estimatedPay))).size;
  if (exactDays === result.days.length && completeLoads === result.totalLoads) {
    return { label: 'Analysis Ready', detail: 'All included workdays have exact shift times and all included loads have dispatcher, locations, and complete cycle times.' };
  }
  if (exactDays > 0 || completeLoads > 0) {
    return { label: 'Partially Ready', detail: missing.join(', ') || 'Some included records have missing analysis fields.' };
  }
  return { label: 'Limited Analysis', detail: missing.join(', ') || 'Exact shift information or complete cycle timing is largely unavailable.' };
}

function dutyTimeReviewTable(days) {
  if (!days.length) return '<p class="helper-text">No workdays are available in this range.</p>';
  return `<div class="table-scroll"><table><thead><tr><th>Date</th><th>Dispatcher</th><th>Completed</th><th>Duty time</th><th>Active cycle</th><th>Non-load duty</th><th>Utilization</th><th>Completed pay</th><th>Total earnings</th><th>Completed pay/duty hour</th><th>Goal</th><th>Duty status</th><th>Observation</th></tr></thead><tbody>${days.map((day) => `<tr><td>${escapeHtml(day.date)}</td><td>${escapeHtml(day.dispatcher === 'Mixed Dispatchers' ? 'Mixed Dispatch' : day.dispatcher)}</td><td>${day.completedLoadCount}</td><td>${escapeHtml(day.dutyTimeSource === 'exact' ? formatDuration(day.exactDutyMinutes) : `Estimated — ${formatMaybeDuration(day.estimatedTrackedSpanMinutes)}`)}</td><td>${escapeHtml(formatMaybeDuration(day.activeLoadCycleMinutes))}</td><td>${escapeHtml(formatMaybeDuration(day.nonLoadDutyMinutes))}</td><td>${escapeHtml(formatPercentValue(day.activeLoadUtilization))}</td><td>${escapeHtml(formatMoney(day.completedLoadPay))}</td><td>${escapeHtml(formatMoney(day.totalEstimatedDailyEarnings))}</td><td>${escapeHtml(formatMaybeMoney(day.completedLoadPayPerExactDutyHour))}</td><td>${escapeHtml(day.goalStatus)}</td><td>${escapeHtml(getDutyTimeStatus(day))}</td><td>${escapeHtml(getWorkloadObservation(day))}</td></tr>`).join('')}</tbody></table></div>`;
}

function completenessMetrics(records) {
  const all = getUniqueSavedLoads(records);
  return [
    ['Total loads', all.length],
    ['Loads with dispatcher', all.filter((load) => String(load.dispatcher || '').trim()).length],
    ['Loads with pickup and drop-off locations', all.filter((load) => String(load.pickupLocation || '').trim() && String(load.dropoffLocation || '').trim()).length],
    ['Loads with complete cycle times', all.filter((load) => isFiniteNumber(load.cycleTimeMinutes)).length],
    ['Loads missing cycle times', all.filter((load) => !isFiniteNumber(load.cycleTimeMinutes)).length]
  ];
}

function getWeightedExactDutyStats(days) {
  const hourlyDays = days.filter((day) => day.dutyTimeSource === 'exact' && day.exactDutyMinutes > 0)
    .map((day) => ({ ...day, hourly: day.totalEstimatedDailyEarnings / (day.exactDutyMinutes / 60) }));
  const totalMinutes = sum(hourlyDays, 'exactDutyMinutes');
  const weightedHourly = totalMinutes > 0 ? sum(hourlyDays, 'totalEstimatedDailyEarnings') / (totalMinutes / 60) : null;
  return {
    hourlyDays, weightedHourly,
    belowCount: isFiniteNumber(weightedHourly) ? hourlyDays.filter((day) => day.hourly < weightedHourly).length : 0,
    atOrAboveCount: isFiniteNumber(weightedHourly) ? hourlyDays.filter((day) => day.hourly >= weightedHourly).length : 0
  };
}

function getWorkdayIndicators(days) {
  const exact = days.filter((day) => day.dutyTimeSource === 'exact' && day.exactDutyMinutes > 0);
  const averageCompleted = days.length ? sum(days, 'completedLoadCount') / days.length : 0;
  const { hourlyDays, weightedHourly, belowCount, atOrAboveCount } = getWeightedExactDutyStats(days);
  const by = (items, selector, direction) => items.slice().sort((a, b) => direction * (selector(a) - selector(b)))[0];
  const label = (day, value) => day ? `${day.date} (${value(day)})` : 'Not enough time data';
  return {
    'Days over 12 duty hours': exact.filter((day) => day.exactDutyMinutes > 720).length,
    'Days over 14 duty hours': exact.filter((day) => day.exactDutyMinutes > 840).length,
    'Days with fewer completed loads than range average': days.filter((day) => day.completedLoadCount < averageCompleted).length,
    'Weighted exact-duty range hourly earnings': isFiniteNumber(weightedHourly) ? formatMoney(weightedHourly) : 'Not enough time data',
    'Exact-duty days below weighted range rate': belowCount,
    'Exact-duty days at or above weighted range rate': atOrAboveCount,
    'Longest exact duty day': label(by(exact, (day) => day.exactDutyMinutes, -1), (day) => formatDuration(day.exactDutyMinutes)),
    'Shortest exact duty day': label(by(exact, (day) => day.exactDutyMinutes, 1), (day) => formatDuration(day.exactDutyMinutes)),
    'Highest completed-load day': label(by(days, (day) => day.completedLoadCount, -1), (day) => `${day.completedLoadCount} completed`),
    'Lowest completed-load day': label(by(days, (day) => day.completedLoadCount, 1), (day) => `${day.completedLoadCount} completed`),
    'Highest exact-duty hourly earnings day': label(by(hourlyDays, (day) => day.hourly, -1), (day) => formatMoney(day.hourly)),
    'Lowest exact-duty hourly earnings day': label(by(hourlyDays, (day) => day.hourly, 1), (day) => formatMoney(day.hourly))
  };
}

function reconcileBaselineAnalysis(result, dayRows) {
  const close = (left, right) => Math.abs(left - right) < 0.01;
  const groupedDays = dayRows.flatMap((row) => row.days);
  const checks = {
    assignments: result.completedLoads + result.rejects === result.totalLoads,
    earnings: close(result.completedBasePay + result.rejectPay + result.waitPay + result.perDiemPay + result.sleeperPay + result.trainerPay + result.hourlyAdditionalPay + result.vacationPay, result.totalEarnings),
    dispatcherDayEarnings: close(sum(dayRows, 'totalEarnings'), result.totalEarnings),
    dispatcherDayDuty: close(sum(dayRows, 'usableDutyMinutes'), result.usableDutyMinutes),
    uniqueWorkDates: groupedDays.length === result.days.length && new Set(groupedDays.map((day) => day.date)).size === result.days.length,
    addOnsNotDuplicated: close(sum(dayRows, 'perDiemPay') + sum(dayRows, 'sleeperPay') + sum(dayRows, 'trainerPay'), result.perDiemPay + result.sleeperPay + result.trainerPay),
    dutyNotDuplicated: close(sum(dayRows, 'exactDutyMinutes') + sum(dayRows, 'estimatedSpanMinutes'), result.usableDutyMinutes)
  };
  const ok = Object.values(checks).every(Boolean);
  if (!ok) console.error('Analysis calculation needs review', { scope: 'baseline', failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) });
  return { ok, checks };
}

function reconcileFilteredLoadAnalysis(result, dispatcherGroups = []) {
  const checks = {
    assignments: result.completedLoads + result.rejects === result.totalLoads,
    dispatcherLoads: dispatcherGroups.reduce((total, group) => total + group.totalLoads, 0) === result.totalLoads,
    noDailyAddOns: dispatcherGroups.every((group) => !Object.hasOwn(group, 'perDiemPay') && !Object.hasOwn(group, 'sleeperPay') && !Object.hasOwn(group, 'trainerPay')),
    noFullDayDuty: dispatcherGroups.every((group) => !Object.hasOwn(group, 'usableDutyMinutes') && !Object.hasOwn(group, 'exactDutyMinutes'))
  };
  const ok = Object.values(checks).every(Boolean);
  if (!ok) console.error('Analysis calculation needs review', { scope: 'filtered-load', failedChecks: Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => name) });
  return { ok, checks };
}

function downloadDispatchAnalysis() {
  const range = getReportRange();
  const rangeRecords = getLoadsForRange(range.start, range.end);
  const filters = getAnalysisFilters();
  const filtersActive = hasActiveAnalysisFilters(filters);
  const filterDescription = describeAnalysisFilters(filters);
  const records = filterAnalysisRecords(rangeRecords, filters);
  const result = summarizeAnalysisRecords(rangeRecords, range.start, range.end);
  const loadResult = summarizeLoadLevelRecords(records);
  const allDayRows = buildDispatcherDayComparison(rangeRecords, range.start, range.end);
  const dayRows = filters.dispatcher ? allDayRows.filter((row) => row.name === filters.dispatcher) : allDayRows;
  const dispatcherRows = groupLoadAnalysis(records, (load) => normalizeDispatcherName(load.dispatcher, rangeRecords) || 'Unknown');
  const baselineCheck = reconcileBaselineAnalysis(result, allDayRows);
  const filteredCheck = reconcileFilteredLoadAnalysis(loadResult, dispatcherRows);
  const generated = new Date().toISOString();
  const headers = ['Section','Group','Metric','Value','Unit','Generated timestamp','Report Start','Report End','Active Filters','Date','Load number','Ticket','BOL','Jotform','Dispatcher','Pickup location','Pickup state','Drop-off location','Drop-off state','State route','Exact route','Status','Base pay','Wait pay','Load-entry earnings','Deadhead minutes','Deadhead miles','Pickup-site minutes','Travel minutes','Drop-off-site minutes','Cycle minutes'];
  const metricRow = (section, group, metric, value, unit = '') => [section,group,metric,value,unit,generated,range.start,range.end,filterDescription];
  const metricRows = (section, values, group = '') => values.map(([metric, value, unit]) => metricRow(section, group, metric, value, unit));
  const loadSummaryMetrics = (row) => [
    ['Completed loads',row.completedLoads,'loads'],['Rejects',row.rejects,'loads'],['Total loads',row.totalLoads,'loads'],['Completion rate',formatCsvNumber(row.completionRate),'percent'],
    ['Loaded miles',formatCsvNumber(row.loadedMiles),'miles'],['Rerouted miles',formatCsvNumber(row.reroutedMiles),'miles'],['Gross barrels from completed loads',formatCsvNumber(row.grossBarrels),'barrels'],
    ['Completed-load base pay',formatCsvNumber(row.completedBasePay),'USD'],['Reject pay',formatCsvNumber(row.rejectPay),'USD'],['Load-specific wait pay',formatCsvNumber(row.waitPay),'USD'],
    ['Load-entry earnings',formatCsvNumber(row.loadEntryEarnings),'USD'],['Average cycle time',formatCsvNumber(row.averageCycleMinutes),'minutes'],['Median cycle time',formatCsvNumber(row.medianCycleMinutes),'minutes'],
    ['Average base pay per completed load',formatCsvNumber(row.averageBasePayPerCompletedLoad),'USD'],['Average all-in completed-load earnings',formatCsvNumber(row.averageAllInCompletedEarnings),'USD'],
    ['Average earnings per load',formatCsvNumber(row.averageEarningsPerAssignment),'USD'],['Cycle-hour earnings',formatCsvNumber(row.cycleHourEarnings),'USD/hour'],['Loads missing cycle time',row.loadsMissingTime,'loads']
  ];
  const loadMetricRows = (section, groups) => groups.flatMap((row) => metricRows(section, [
    ['Completed loads',row.completedLoads,'loads'],['Rejects',row.rejects,'loads'],['Total loads',row.totalLoads,'loads'],['Completion rate',formatCsvNumber(row.completionRate),'percent'],
    ['Loaded miles',formatCsvNumber(row.loadedMiles),'miles'],['Rerouted miles',formatCsvNumber(row.reroutedMiles),'miles'],['Completed-load base pay',formatCsvNumber(row.completedBasePay),'USD'],
    ['Reject pay',formatCsvNumber(row.rejectPay),'USD'],['Wait pay',formatCsvNumber(row.waitPay),'USD'],['Load-entry earnings',formatCsvNumber(row.loadEntryEarnings),'USD'],
    ['Average cycle time',formatCsvNumber(row.averageCycleMinutes),'minutes'],['Median cycle time',formatCsvNumber(row.medianCycleMinutes),'minutes'],['Cycle-hour earnings',formatCsvNumber(row.cycleHourEarnings),'USD/hour'],['Loads missing cycle time',row.loadsMissingTime,'loads']
  ], row.name));
  const baselineMetrics = [
    ['Completed loads',result.completedLoads,'loads'],['Rejects',result.rejects,'loads'],['Total loads',result.totalLoads,'loads'],['Completion rate',formatCsvNumber(result.completionRate),'percent'],
    ['Eligible dispatched workdays',result.eligibleDispatchedWorkdays,'days'],['Fair Goal days',result.fairGoalDays,'days'],['Fair Goal percentage',formatCsvNumber(result.fairGoalPercent),'percent'],
    ['Excellent Goal days',result.excellentGoalDays,'days'],['Excellent Goal percentage',formatCsvNumber(result.excellentGoalPercent),'percent'],['Below Fair Goal days',result.belowFairGoalDays,'days'],['Below Fair Goal percentage',formatCsvNumber(result.belowFairGoalPercent),'percent'],
    ['Days with paid wait',result.daysWithPaidWait,'days'],['Paid wait day percentage',formatCsvNumber(result.paidWaitDayPercent),'percent'],['Days with deadhead',result.daysWithDeadhead,'days'],['Deadhead day percentage',formatCsvNumber(result.deadheadDayPercent),'percent'],
    ['Total deadhead minutes',result.deadheadMinutes,'minutes'],['Total deadhead miles',formatCsvNumber(result.deadheadMiles),'miles'],
    ['Completed-load base pay',formatCsvNumber(result.completedBasePay),'USD'],['Reject pay',formatCsvNumber(result.rejectPay),'USD'],['Wait pay',formatCsvNumber(result.waitPay),'USD'],
    ['Per diem',formatCsvNumber(result.perDiemPay),'USD'],['Sleeper pay',formatCsvNumber(result.sleeperPay),'USD'],['Trainer pay',formatCsvNumber(result.trainerPay),'USD'],
    ['Deadhead pay',formatCsvNumber(result.deadheadPay),'USD'],['Truck wash pay',formatCsvNumber(result.truckWashPay),'USD'],
    ['Breakdown pay',formatCsvNumber(result.breakdownPay),'USD'],['Other hourly work pay',formatCsvNumber(result.otherHourlyPay),'USD'],
    ['Total hourly additional pay',formatCsvNumber(result.hourlyAdditionalPay),'USD'],['Total estimated earnings',formatCsvNumber(result.totalEarnings),'USD'],
    ['Exact-duty days',result.exactDays,'days'],['Estimated-span days',result.estimatedDays,'days'],['Missing-time days',result.missingTimeDays,'days'],['Exact duty time',result.exactDutyMinutes,'minutes'],
    ['Days goal met',result.daysGoalMet,'days'],['Days below goal',result.daysBelowGoal,'days'],['Days with insufficient goal data',result.daysInsufficientData,'days'],
    ['Usable days meeting goal',formatCsvNumber(result.percentUsableDaysMeetingGoal),'percent'],['Total amount above goal',formatCsvNumber(result.totalAmountAboveGoal),'USD'],
    ['Total amount below goal',formatCsvNumber(result.totalAmountBelowGoal),'USD'],['Average completed-load pay per workday',formatCsvNumber(result.averageCompletedLoadPayPerWorkday),'USD'],
    ['Estimated tracked span',result.estimatedSpanMinutes,'minutes'],['Combined usable duty time',result.usableDutyMinutes,'minutes'],['Exact-duty hourly earnings',formatCsvNumber(result.exactHourlyEarnings),'USD/hour'],
    ['Estimated-span hourly earnings',formatCsvNumber(result.estimatedHourlyEarnings),'USD/hour'],['Combined mixed-basis hourly earnings',formatCsvNumber(result.mixedBasisHourlyEarnings),'USD/hour']
  ];
  const weightedStats = getWeightedExactDutyStats(result.days);
  const rows = [
    ...metricRows('Overall Date-Range Baseline', baselineMetrics),
    ...(filtersActive ? metricRows('Filtered Load Summary', [['Active filters',filterDescription,''],...loadSummaryMetrics(loadResult)]) : []),
    ...metricRows('Time Basis Summary', [['Days with valid utilization',result.exactUtilizationDays,'days'],['Exact-duty days excluded from utilization',result.excludedExactUtilizationDays,'days'],['Exact duty time represented in utilization',result.utilizationExactDutyMinutes,'minutes'],['Active load-cycle time',result.activeLoadCycleMinutes,'minutes'],['Non-load duty time',result.nonLoadDutyMinutes,'minutes'],['Active-load utilization',formatCsvNumber(result.activeLoadUtilization),'percent']]),
    ...dayRows.flatMap((row) => metricRows('Dispatcher Day Comparison', [
      ['Workdays',row.workdays,'days'],['Completed loads',row.completedLoads,'loads'],['Rejects',row.rejects,'loads'],['Total loads',row.totalLoads,'loads'],
      ['Days goal met',row.daysGoalMet,'days'],['Days below goal',row.daysBelowGoal,'days'],['Usable days meeting goal',formatCsvNumber(row.percentUsableDaysMeetingGoal),'percent'],
      ['Average completed-load pay per workday',formatCsvNumber(row.averageCompletedLoadPayPerWorkday),'USD'],['Average goal difference',formatCsvNumber(row.averageGoalDifference),'USD'],
      ['Completion rate',formatCsvNumber(row.completionRate),'percent'],['Average completed loads per workday',formatCsvNumber(row.averageCompletedLoadsPerWorkday),'loads/day'],
      ['Average duty hours per workday',formatCsvNumber(row.averageDutyHoursPerWorkday),'hours/day'],['Loads missing dispatcher information',row.missingDispatcherLoads,'loads'],
      ['Days under 12 hours',row.daysUnder12Hours,'days'],['Days 12 to under 14 hours',row.days12ToUnder14Hours,'days'],['Days at or above 14 hours',row.daysAtOrAbove14Hours,'days'],
      ['Percent of exact-time days at or above 14 hours',formatCsvNumber(row.percentExactDaysAtOrAbove14Hours),'percent'],['Below-goal plus 14-hour days',row.belowGoalPlus14HourDays,'days'],
      ['Completed-load pay per exact duty hour',formatCsvNumber(row.completedLoadPayPerExactDutyHour),'USD/hour'],['Average non-load duty time',formatCsvNumber(row.averageNonLoadDutyMinutes),'minutes'],
      ['Exact-duty days',row.exactDays,'days'],['Estimated-span days',row.estimatedDays,'days'],['Missing-time days',row.missingTimeDays,'days'],
      ['Exact duty time',row.exactDutyMinutes,'minutes'],['Estimated tracked span',row.estimatedSpanMinutes,'minutes'],['Usable duty time',row.usableDutyMinutes,'minutes'],
      ['Completed-load base pay',formatCsvNumber(row.completedBasePay),'USD'],['Reject pay',formatCsvNumber(row.rejectPay),'USD'],['Wait pay',formatCsvNumber(row.waitPay),'USD'],
      ['Per diem',formatCsvNumber(row.perDiemPay),'USD'],['Sleeper pay',formatCsvNumber(row.sleeperPay),'USD'],['Trainer pay',formatCsvNumber(row.trainerPay),'USD'],
      ['Total estimated earnings',formatCsvNumber(row.totalEarnings),'USD'],['Average earnings per workday',formatCsvNumber(row.averageEarningsPerWorkday),'USD'],
      ['Effective hourly earnings',formatCsvNumber(row.effectiveHourlyEarnings),'USD/hour'],['Completed loads per duty hour',formatCsvNumber(row.completedLoadsPerDutyHour),'loads/hour']
    ], row.name)),
    ...result.days.flatMap((day) => metricRows('Daily Dispatch Results', [['Dispatcher',day.dispatcher === 'Mixed Dispatchers' ? 'Mixed Dispatch' : day.dispatcher,''],['Dispatch outcome',day.dispatchOutcome,''],['Dispatch outcome explanation',day.dispatchOutcomeExplanation,''],['Data completeness status',getAnalysisReadiness({ ...result, days:[day], totalLoads:day.loads.length }).label,''],['Completed loads',day.completedLoadCount,'loads'],['Completed-load pay',formatCsvNumber(day.completedLoadPay),'USD'],['Daily completed-load-pay goal',formatCsvNumber(day.dailyGoal),'USD'],['Goal status',day.goalStatus,''],['Goal difference',formatCsvNumber(day.goalDifference),'USD'],['Total estimated daily earnings',formatCsvNumber(day.totalEstimatedDailyEarnings),'USD'],['Exact duty duration',day.exactDutyMinutes,'minutes'],['Duty-time category',day.dutyTimeCategory,''],['Completed-load pay per exact duty hour',formatCsvNumber(day.completedLoadPayPerExactDutyHour),'USD/hour'],['Missing-data explanation',getAnalysisReadiness({ ...result, days:[day], totalLoads:day.loads.length }).detail,'']], day.date)),
    ...loadMetricRows('Dispatcher Load Comparison',dispatcherRows),
    ...metricRows('Workday Indicators', [
      ['Weighted exact-duty range hourly earnings',formatCsvNumber(weightedStats.weightedHourly),'USD/hour'],
      ['Exact-duty days below weighted range rate',weightedStats.belowCount,'days'],['Exact-duty days at or above weighted range rate',weightedStats.atOrAboveCount,'days'],
      ...Object.entries(getWorkdayIndicators(result.days)).filter(([metric]) => !metric.startsWith('Weighted exact-duty') && !metric.startsWith('Exact-duty days')).map(([metric,value]) => [metric,value,''])
    ]),
    ...metricRows('Overall Data Completeness', completenessMetrics(rangeRecords).map(([metric,value]) => [metric,value,'loads'])),
    ...(filtersActive ? metricRows('Filtered Data Completeness', completenessMetrics(records).map(([metric,value]) => [metric,value,'loads'])) : []),
    ...metricRows('Baseline Reconciliation', [['Status',baselineCheck.ok ? 'Baseline calculations reconciled.' : 'Analysis calculation needs review','']]),
    ...metricRows('Filtered Load Reconciliation', [['Status',filteredCheck.ok ? 'Filtered load calculations reconciled.' : 'Analysis calculation needs review','']]),
    ...records.map((load) => ['Underlying Loads','','','', '',generated,range.start,range.end,filterDescription,load.loadDate,load.loadNumber,load.ticketNumber,load.bolNumber,load.jotformConfirmationNumber,normalizeDispatcherName(load.dispatcher, rangeRecords) || 'Unknown',load.pickupLocation,displayState(load.pickupState),load.dropoffLocation,displayState(load.dropoffState),getStateRoute(load),formatRoute(load),load.loadStatus,formatCsvNumber(load.estimatedPay),formatCsvNumber(load.waitPay),formatCsvNumber(load.estimatedEntryPay),formatCsvNumber(load.deadheadTravelMinutes),formatCsvNumber(load.deadheadMiles),formatCsvNumber(load.pickupTimeMinutes),formatCsvNumber(load.travelTimeMinutes),formatCsvNumber(load.dropoffTimeMinutes),formatCsvNumber(load.cycleTimeMinutes)])
  ];
  downloadCsv(`dispatch-earnings-analysis-${range.start}-${range.end}.csv`, headers, rows);
}

function printDispatchAnalysis() {
  const range = getReportRange();
  renderDispatchAnalysis(range.start, range.end);
  openPrintWindow(`Dispatch and Earnings Analysis ${range.start} to ${range.end}`, `<h1>Dispatch and Earnings Analysis</h1><p class="muted">Generated ${escapeHtml(new Date().toLocaleString())}<br>Report range: ${escapeHtml(range.start)} through ${escapeHtml(range.end)}<br>Active filters: ${escapeHtml(describeAnalysisFilters())}</p>${reportControls.analysisContent?.innerHTML || ''}`);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getPaidTimeDefaultRate(category) {
  if (category === 'Vacation Time') return VACATION_DAILY_RATE;
  const map = { Deadhead: 'deadheadHourlyRate', 'Truck Wash': 'truckWashHourlyRate', Breakdown: 'breakdownHourlyRate', 'Other Hourly Work': 'otherHourlyRate' };
  return getPayRate(map[category] || 'otherHourlyRate');
}

function updatePaidTimeCategoryControls() {
  const isVacation = paidTimeControls.category?.value === 'Vacation Time';
  [paidTimeControls.start, paidTimeControls.end].forEach((control) => {
    if (!control) return;
    control.required = !isVacation;
    control.disabled = isVacation;
    if (isVacation) control.value = '';
  });
  if (paidTimeControls.rate) {
    paidTimeControls.rate.value = String(getPaidTimeDefaultRate(paidTimeControls.category?.value));
    paidTimeControls.rate.readOnly = isVacation;
  }
  if (paidTimeControls.quantity) {
    const duration = durationBetween(paidTimeControls.start?.value, paidTimeControls.end?.value);
    paidTimeControls.quantity.value = isVacation ? '1' : (isFiniteNumber(duration) ? String(duration / 60) : '');
  }
  setElementText(document.getElementById('paid-time-rate-label'), isVacation ? 'Daily rate' : 'Hourly rate');
  setElementText(document.getElementById('paid-time-quantity-label'), isVacation ? 'Days' : 'Hours');
}

function readPaidTimeForm() {
  return normalizePaidTimeRecord({
    workDate: paidTimeControls.date?.value, category: paidTimeControls.category?.value,
    customCategoryName: paidTimeControls.custom?.value, quantity: paidTimeControls.quantity?.value, startTime: paidTimeControls.start?.value,
    endTime: paidTimeControls.end?.value, hourlyRate: paidTimeControls.rate?.value,
    dispatcher: paidTimeControls.dispatcher?.value, truckNumber: paidTimeControls.truck?.value,
    trailerNumber: paidTimeControls.trailer?.value, relatedLoadId: paidTimeControls.relatedLoad?.value,
    deadheadMiles: paidTimeControls.miles?.value, location: paidTimeControls.location?.value, notes: paidTimeControls.notes?.value
  });
}

function renderPaidTimeCalculation() {
  const record = readPaidTimeForm();
  if (paidTimeControls.quantity) paidTimeControls.quantity.value = String(record.quantity || '');
  setElementText(paidTimeControls.duration, formatMaybeDuration(record.durationMinutes));
  setElementText(paidTimeControls.pay, formatMaybeMoney(record.estimatedPay));
}

function renderPaidTimeRecords() {
  const container = document.getElementById('paid-time-records');
  if (!container) return;
  const selectedDate = getRecordsSelectedDate();
  const selectedRecords = paidTimeRecords.filter((item) => item.workDate === selectedDate);
  container.innerHTML = selectedRecords.length ? selectedRecords.map((item) => {
    const isVacation = item.category === 'Vacation Time';
    const timing = isVacation ? 'Full paid day' : `${item.startTime}–${item.endTime}`;
    const payBasis = isVacation ? `${formatMoney(item.estimatedPay)} per day` : `${formatDuration(item.durationMinutes)} at ${formatMoney(item.hourlyRate)}/hr · ${formatMoney(item.estimatedPay)}`;
    return `<article class="saved-load-card"><strong>${escapeHtml(item.category)}</strong><span>${escapeHtml(item.workDate)} · ${escapeHtml(timing)}</span><span>${escapeHtml(payBasis)}</span><span>${escapeHtml(item.dispatcher || 'No dispatcher')} · Truck ${escapeHtml(item.truckNumber || '-')}</span><div class="button-row compact"><button type="button" class="button secondary" data-edit-paid-time="${escapeHtml(item.id)}">Edit</button><button type="button" class="button ghost" data-duplicate-paid-time="${escapeHtml(item.id)}">Duplicate</button><button type="button" class="button ghost" data-print-paid-time="${escapeHtml(item.id)}">Print</button><button type="button" class="button danger" data-delete-paid-time="${escapeHtml(item.id)}">Delete</button></div></article>`;
  }).join('') : `<article class="empty-card">No paid-time records for ${escapeHtml(selectedDate)}.</article>`;
}

function fillPaidTimeForm(record, duplicate = false) {
  const mapping = { date:'workDate', category:'category', custom:'customCategoryName', quantity:'quantity', start:'startTime', end:'endTime', rate:'hourlyRate', dispatcher:'dispatcher', truck:'truckNumber', trailer:'trailerNumber', relatedLoad:'relatedLoadId', miles:'deadheadMiles', location:'location', notes:'notes' };
  Object.entries(mapping).forEach(([control, key]) => {
    if (paidTimeControls[control]) paidTimeControls[control].value = record[key] ?? '';
  });
  editingPaidTimeId = duplicate ? null : record.id;
  if (paidTimeControls.panel) paidTimeControls.panel.open = true;
  updatePaidTimeCategoryControls();
  renderPaidTimeCalculation();
}

function printPaidTimeRecord(record) {
  const rows = [
    ['Date', record.workDate], ['Category', record.category], ['Custom category', record.customCategoryName || '-'],
    ['Start', record.startTime || '-'], ['End', record.endTime || '-'], ['Duration', record.category === 'Vacation Time' ? 'Full paid day' : formatDuration(record.durationMinutes)],
    [record.category === 'Vacation Time' ? 'Daily rate' : 'Hourly rate', record.category === 'Vacation Time' ? formatMoney(record.hourlyRate) : `${formatMoney(record.hourlyRate)}/hr`], ['Estimated pay', formatMoney(record.estimatedPay)],
    ['Deadhead miles', isFiniteNumber(record.deadheadMiles) ? record.deadheadMiles : '-'], ['Dispatcher', record.dispatcher || '-'],
    ['Truck', record.truckNumber || '-'], ['Trailer', record.trailerNumber || '-'], ['Related load', record.relatedLoadId || '-'],
    ['Location', record.location || '-'], ['Notes', record.notes || '-']
  ];
  openPrintWindow('Paid Time Record', `<h1>Paid Time Record</h1><div class="print-grid">${rows.map(([label, value]) => `<div class="print-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join('')}</div>`);
}

function downloadPaidTimeCsv() {
  const headers = ['ID','Work date','Paid-time type','Quantity','Quantity unit','Rate','Amount','Start','End','Duration minutes','Dispatcher','Truck','Trailer','Related load ID','Deadhead miles','Location','Notes','Created','Updated','Daily total'];
  const rows = paidTimeRecords.map((item) => [item.id,item.workDate,item.category,formatCsvNumber(item.quantity),item.quantityUnit,formatCsvNumber(item.hourlyRate),formatCsvNumber(item.estimatedPay),item.startTime,item.endTime,item.durationMinutes,item.dispatcher,item.truckNumber,item.trailerNumber,item.relatedLoadId,formatCsvNumber(item.deadheadMiles),item.location,item.notes,item.createdAt,item.updatedAt,formatCsvNumber(getDailyEarningsSummary(item.workDate).totalEstimatedDailyEarnings)]);
  downloadCsv(`paid-time-${todayLocal()}.csv`, headers, rows);
}

function syncPaidTimeToCloud(record) {
  if (!isCloudSignedIn()) return;
  queueCloudWrite(() => cloudSync.sdk.setDoc(cloudDocument('paidTime', toCloudDocumentId(record.id)), sanitizeForFirestore({ ...record, appVersion: APP_VERSION, dataSchemaVersion: DATA_SCHEMA_VERSION, cloudUpdatedAt: cloudSync.sdk.serverTimestamp() }), { merge: true }), 'Paid time could not be synced to Firebase yet.');
}

function savePaidTime(event) {
  event?.preventDefault?.();
  const formRecord = readPaidTimeForm();
  const previous = editingPaidTimeId ? paidTimeRecords.find((item) => item.id === editingPaidTimeId) : null;
  const record = normalizePaidTimeRecord({
    ...formRecord,
    id: previous?.id || formRecord.id,
    createdAt: previous?.createdAt || formRecord.createdAt,
    updatedAt: new Date().toISOString()
  });
  const isVacation = record.category === 'Vacation Time';
  if (!record.workDate || !record.category || (!isVacation && (!record.startTime || !record.endTime || !isFiniteNumber(record.durationMinutes) || record.durationMinutes <= 0)) || record.hourlyRate < 0) {
    if (paidTimeControls.error) { paidTimeControls.error.textContent = isVacation ? 'Enter a work date for Vacation Time.' : 'Enter a date, category, valid start and end times, and a nonnegative rate.'; paidTimeControls.error.className = 'validation-summary show'; }
    return;
  }
  const duplicate = paidTimeRecords.find((item) => item.id !== editingPaidTimeId
    && item.workDate === record.workDate && item.category === record.category
    && item.startTime === record.startTime && item.endTime === record.endTime
    && item.truckNumber === record.truckNumber);
  if (duplicate && isVacation) {
    const updateExisting = !globalThis.confirm || globalThis.confirm('Vacation Time already exists for this date. Update the existing daily record?');
    if (!updateExisting) return;
    record.id = duplicate.id;
    record.createdAt = duplicate.createdAt;
    editingPaidTimeId = duplicate.id;
  } else if (duplicate && globalThis.confirm && !globalThis.confirm('A similar paid-time record already exists. Save another entry anyway?')) return;
  paidTimeRecords = editingPaidTimeId
    ? [record, ...paidTimeRecords.filter((item) => item.id !== editingPaidTimeId)]
    : [record, ...paidTimeRecords];
  editingPaidTimeId = null;
  storeJson(PAID_TIME_STORAGE_KEY, paidTimeRecords, 'paid-time records');
  localStorage.removeItem(PAID_TIME_DRAFT_STORAGE_KEY);
  if (!isCloudSignedIn()) {
    markLocalChangesPending('Paid time saved locally. Sign in to sync it to Firebase.');
  }
  syncPaidTimeToCloud(record);
  refreshAllDailyEarningsRecords();
  updateDailySummary();
  renderPaidTimeRecords();
  paidTimeControls.form?.reset();
  if (paidTimeControls.panel) paidTimeControls.panel.open = false;
}

function initialize() {
  const today = todayLocal();
  initializeAnalysisInputs();
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
  if (paidTimeControls.date) paidTimeControls.date.value = daily.date.value;
  if (paidTimeControls.rate) paidTimeControls.rate.value = String(getPaidTimeDefaultRate(paidTimeControls.category?.value || 'Truck Wash'));
  const paidDraft = loadJson(PAID_TIME_DRAFT_STORAGE_KEY, null, 'paid-time draft');
  if (isPlainObject(paidDraft)) {
    const mapping = { date:'workDate', category:'category', custom:'customCategoryName', start:'startTime', end:'endTime', rate:'hourlyRate', dispatcher:'dispatcher', truck:'truckNumber', trailer:'trailerNumber', relatedLoad:'relatedLoadId', miles:'deadheadMiles', location:'location', notes:'notes' };
    Object.entries(mapping).forEach(([control,key]) => { if (paidTimeControls[control] && paidDraft[key] !== null && paidDraft[key] !== undefined) paidTimeControls[control].value = paidDraft[key]; });
  }
  updatePaidTimeCategoryControls();
  renderPaidTimeRecords();
  const initialPayPeriod = getCompanyPayPeriodRange(daily.date.value);
  daily.payPeriodStart.value = initialPayPeriod.start;
  daily.payPeriodEnd.value = initialPayPeriod.end;
  savedFilters.date.value = savedFilters.date.value || daily.date.value;
  fields.loadDate.value = fields.loadDate.value || daily.date.value;
  fields.loadStatus.value = fields.loadStatus.value || COMPLETED_STATUS;
  fields.productType.value = fields.productType.value || 'Crude Oil';
  fields.dispatcher.value = fields.dispatcher.value || getRecentDispatcherForDate(fields.loadDate.value);
  ensureLoadNumber();
  applyProfileToControls();
  applyProfileToNewLoad();
  applyPaySettingsToControls();
  applyDailyAddOnsToControls();
  refreshAllDailyEarningsRecords();
  saveAppMeta();
  renderStorageWarning();
  renderSummary();
  updateDailySummary();
  restoreDraftIfAvailable();
  activateView(getPreservedView());
  registerServiceWorker();
  initializeFirebaseSync();
}

function initializeAnalysisInputs() {
  const stateOptions = ['<option value="">Unknown</option>', ...US_STATE_ABBREVIATIONS.map((state) => `<option value="${state}">${state}</option>`)].join('');
  [fields.pickupState, fields.dropoffState].forEach((select) => {
    if (select) select.innerHTML = stateOptions;
  });
  const dispatcherList = document.getElementById('dispatcher-options');
  if (dispatcherList) {
    const names = new Map();
    getUniqueSavedLoads().map((load) => String(load.dispatcher || '').trim()).filter(Boolean).forEach((name) => {
      if (!names.has(name.toLowerCase())) names.set(name.toLowerCase(), name);
    });
    dispatcherList.innerHTML = [...names.values()].sort().map((name) => `<option value="${escapeHtml(name)}"></option>`).join('');
  }
}

form?.addEventListener('submit', saveLoad);
paidTimeControls.form?.addEventListener('submit', savePaidTime);
paidTimeControls.form?.addEventListener('input', renderPaidTimeCalculation);
paidTimeControls.category?.addEventListener('change', () => { updatePaidTimeCategoryControls(); renderPaidTimeCalculation(); });
document.getElementById('show-paid-time-button')?.addEventListener('click', () => {
  if (paidTimeControls.date && !paidTimeControls.date.value) paidTimeControls.date.value = daily.date.value;
  if (paidTimeControls.rate && !paidTimeControls.rate.value) paidTimeControls.rate.value = String(getPaidTimeDefaultRate(paidTimeControls.category?.value || 'Truck Wash'));
  if (paidTimeControls.panel) paidTimeControls.panel.open = true;
});
document.getElementById('save-paid-time-draft-button')?.addEventListener('click', () => storeJson(PAID_TIME_DRAFT_STORAGE_KEY, readPaidTimeForm(), 'paid-time draft'));
document.getElementById('download-paid-time-button')?.addEventListener('click', downloadPaidTimeCsv);
document.getElementById('cancel-paid-time-button')?.addEventListener('click', () => { editingPaidTimeId = null; paidTimeControls.form?.reset(); if (paidTimeControls.panel) paidTimeControls.panel.open = false; });
document.getElementById('paid-time-records')?.addEventListener('click', (event) => {
  const editButton = event.target.closest?.('[data-edit-paid-time]');
  const duplicateButton = event.target.closest?.('[data-duplicate-paid-time]');
  const printButton = event.target.closest?.('[data-print-paid-time]');
  const actionId = editButton?.dataset.editPaidTime || duplicateButton?.dataset.duplicatePaidTime || printButton?.dataset.printPaidTime;
  const actionRecord = paidTimeRecords.find((item) => item.id === actionId);
  if (editButton && actionRecord) { fillPaidTimeForm(actionRecord); return; }
  if (duplicateButton && actionRecord) { fillPaidTimeForm(actionRecord, true); return; }
  if (printButton && actionRecord) { printPaidTimeRecord(actionRecord); return; }
  const button = event.target.closest?.('[data-delete-paid-time]');
  if (!button || !globalThis.confirm?.('Delete this paid-time record?')) return;
  const id = button.dataset.deletePaidTime;
  paidTimeRecords = paidTimeRecords.filter((item) => item.id !== id);
  storeJson(PAID_TIME_STORAGE_KEY, paidTimeRecords, 'paid-time records');
  queuePendingDelete('paidTime', id);
  if (isCloudSignedIn()) queueCloudWrite(() => cloudSync.sdk.deleteDoc(cloudDocument('paidTime', toCloudDocumentId(id))).then(() => clearPendingDelete('paidTime', id)));
  refreshAllDailyEarningsRecords(); updateDailySummary(); renderPaidTimeRecords();
});
document.getElementById('daily-record-content')?.addEventListener('click', (event) => {
  const loadId = event.target.closest?.('[data-daily-edit-load]')?.dataset.dailyEditLoad;
  const paidId = event.target.closest?.('[data-daily-edit-paid]')?.dataset.dailyEditPaid;
  if (loadId) {
    loadEntryForEdit(loadId);
    return;
  }
  if (paidId) {
    const record = paidTimeRecords.find((item) => item.id === paidId);
    if (record) {
      activateView('dashboard');
      fillPaidTimeForm(record);
    }
    return;
  }
  if (event.target.closest?.('[data-daily-edit-workday]')) {
    activateView('dashboard');
    applyDailyAddOnsToControls();
  }
});
form?.addEventListener('input', handleFormInput);
form?.addEventListener('change', handleFormInput);
navButtons.forEach((button) => button.addEventListener('click', handleNavigationClick));
daily.date?.addEventListener('input', handleSelectedDateChange);
daily.date?.addEventListener('change', handleSelectedDateChange);
daily.payPeriodStart?.addEventListener('input', handlePayPeriodChange);
daily.payPeriodStart?.addEventListener('change', handlePayPeriodChange);
daily.payPeriodEnd?.addEventListener('input', handlePayPeriodChange);
daily.payPeriodEnd?.addEventListener('change', handlePayPeriodChange);
Object.values(savedFilters).forEach((field) => {
  field?.addEventListener('input', handleSavedFiltersChange);
  field?.addEventListener('change', handleSavedFiltersChange);
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
  field?.addEventListener('input', handleAddOnChange);
  field?.addEventListener('change', handleAddOnChange);
});
saveAnywayButton?.addEventListener('click', () => {
  if (pendingDuplicateRecord) {
    commitLoadRecord(pendingDuplicateRecord, { startNext: pendingCommitMode === 'next' });
  }
});
cancelDuplicateButton?.addEventListener('click', hideDuplicateWarning);
clearFormButton?.addEventListener('click', clearForm);
saveNextButton?.addEventListener('click', saveAndStartNextLoad);
workdayControls.startButton?.addEventListener('click', () => saveWorkdayControls('start'));
workdayControls.endButton?.addEventListener('click', () => saveWorkdayControls('end'));
saveDraftButton?.addEventListener('click', () => saveDraftNow('Draft saved.'));
continueDraftButton?.addEventListener('click', () => {
  const draft = readDraft();

  if (draft && applyDraft(draft)) {
    activateView('new-load');
  }
});
savedLoadCards?.addEventListener('click', handleSavedCardAction);
profileControls.saveButton?.addEventListener('click', saveDriverProfile);
paySettingsControls.saveButton?.addEventListener('click', savePaySettingsFromControls);
manualSyncButton?.addEventListener('click', syncAllCurrentDataToCloud);
downloadLogButton?.addEventListener('click', downloadLoadLog);
downloadEarningsButton?.addEventListener('click', downloadDailyEarningsSummary);
printDailyReportButton?.addEventListener('click', printDailyReport);
document.getElementById('download-analysis-button')?.addEventListener('click', downloadDispatchAnalysis);
document.getElementById('print-analysis-button')?.addEventListener('click', printDispatchAnalysis);
exportBackupButton?.addEventListener('click', exportJsonBackup);
importBackupButton?.addEventListener('click', importJsonBackup);
checkUpdatesButton?.addEventListener('click', checkForUpdates);
updateNowButton?.addEventListener('click', activateWaitingUpdate);
authControls.form?.addEventListener('submit', handleSignIn);
authControls.signInButton?.addEventListener('click', handleSignIn);
authControls.signOutButton?.addEventListener('click', handleSignOut);
authControls.downloadBeforeMigrationButton?.addEventListener('click', downloadBackupBeforeMigration);
authControls.startMigrationButton?.addEventListener('click', migrateLocalDataToFirebase);
globalThis.addEventListener?.('beforeunload', warnBeforeLeavingUnsaved);
initialize();
