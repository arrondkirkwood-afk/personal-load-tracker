const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(appDir, 'script.js'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(appDir, 'service-worker.js'), 'utf8');
const html = fs.readFileSync(path.join(appDir, 'index.html'), 'utf8');
const baseStyles = fs.readFileSync(path.join(appDir, 'style.css'), 'utf8');
const redesignStyles = fs.readFileSync(path.join(appDir, 'redesign.css'), 'utf8');
const recordsReportsStyles = fs.readFileSync(path.join(appDir, 'records-reports-redesign.css'), 'utf8');
const settingsStyles = fs.readFileSync(path.join(appDir, 'settings-redesign.css'), 'utf8');

function expectSource(fragment, message) {
  assert.ok(script.includes(fragment), message || `Expected script.js to preserve: ${fragment}`);
}

function gitBlobSha(content) {
  const bytes = Buffer.from(content, 'utf8');
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(Buffer.concat([header, bytes])).digest('hex');
}

// Storage contract: redesign work must not rename or remove existing persistence keys.
[
  "personalOilfieldLoadTracker.loads",
  "personalOilfieldLoadTracker.dailyAddOns",
  "personalOilfieldLoadTracker.dailySummaries",
  "personalOilfieldLoadTracker.profile",
  "personalOilfieldLoadTracker.meta",
  "personalOilfieldLoadTracker.settings",
  "personalOilfieldLoadTracker.favoriteRoutes",
  "personalOilfieldLoadTracker.currentDraft",
  "personalOilfieldLoadTracker.paidTime",
  "personalOilfieldLoadTracker.paidTimeDraft",
  "personalOilfieldLoadTracker.preMigrationBackup.v2",
  "personalOilfieldLoadTracker.firebaseMigrationSafetyBackup.v3",
  "personalOilfieldLoadTracker.preCloudMergeRecovery.v1",
  "personalOilfieldLoadTracker.preFirestoreCacheReset.v1",
  "personalOilfieldLoadTracker.preDeadheadMappingBackup.v1",
  "personalOilfieldLoadTrackerLog",
  "personalOilfieldDailyEarningsAddOns",
  "personalOilfieldDailyEarningsRecords"
].forEach((key) => expectSource(key, `Persistence key changed or disappeared: ${key}`));

// Core pay/business rules: visual redesign work must not silently alter these values.
expectSource('const VACATION_DAILY_RATE = 270;', 'Vacation rate changed');
expectSource('rejectPay: 20', 'Default reject pay changed');
expectSource('perDiemPay: 50', 'Default per diem changed');
expectSource('sleeperBerthPay: 60', 'Default sleeper pay changed');
expectSource('trainerPay: 50', 'Default trainer pay changed');
expectSource('waitPayRate: 24', 'Default wait pay changed');
expectSource('const WAIT_GRACE_MINUTES = 60;', 'Wait-time grace period changed');

// Loaded-mile pay scale endpoints provide a quick integrity check for the existing table.
expectSource('{ min: 1, max: 5, rate: 49.93 }', 'Loaded-mile pay table start changed');
expectSource('{ min: 236, max: 240, rate: 307.25 }', 'Loaded-mile pay table end changed');

// Firebase project and per-user collection structure must remain stable during UI work.
expectSource('projectId: "arrond-oilfield-load-tracker"', 'Firebase project changed');
[
  "users/${uid}/loads/",
  "users/${uid}/dailyAddOns/",
  "users/${uid}/dailySummaries/",
  "users/${uid}/profile/",
  "users/${uid}/settings/",
  "users/${uid}/metadata/"
].forEach((fragment) => {
  const collectionName = fragment.split('/')[2];
  assert.ok(
    script.includes(collectionName),
    `Expected Firestore collection name to remain present: ${collectionName}`
  );
});

// Critical DOM IDs are part of the current script/UI contract.
[
  'daily-date',
  'load-date',
  'load-number',
  'load-status',
  'gross-barrels',
  'loaded-miles',
  'arrived-pickup-time',
  'loaded-time',
  'arrived-dropoff-time',
  'completed-time',
  'daily-total-earnings',
  'today-duty-time',
  'sync-status'
].forEach((id) => {
  assert.ok(html.includes(`id="${id}"`), `Critical UI/data binding ID changed or disappeared: ${id}`);
});

// Keep the known-good base stylesheet byte-for-byte intact while the redesign is evaluated.
assert.strictEqual(
  gitBlobSha(baseStyles),
  '5c0fef0fac495931813a446baed3967acecac779',
  'Base style.css changed during isolated redesign work'
);
assert.ok(redesignStyles.includes('#dashboard-view'), 'redesign.css no longer contains dashboard overrides');
assert.ok(redesignStyles.includes('#new-load-view'), 'redesign.css no longer contains Add Load overrides');
assert.ok(recordsReportsStyles.includes('#records-view'), 'records-reports-redesign.css no longer contains History overrides');
assert.ok(recordsReportsStyles.includes('#reports-view'), 'records-reports-redesign.css no longer contains Earnings overrides');
assert.ok(settingsStyles.includes('#settings-view'), 'settings-redesign.css no longer contains Settings overrides');
assert.ok(serviceWorker.includes("'./redesign.css'"), 'service worker no longer caches the primary redesign stylesheet');
assert.ok(serviceWorker.includes("'./records-reports-redesign.css'"), 'service worker no longer caches the History/Earnings redesign stylesheet');
assert.ok(serviceWorker.includes("'./settings-redesign.css'"), 'service worker no longer caches the Settings redesign stylesheet');
assert.ok(serviceWorker.includes('buildRedesignedStylesheet'), 'service worker no longer layers redesign styles over style.css');

// The PWA update contract requires script.js and service-worker.js to agree on version.
const scriptVersion = script.match(/const APP_VERSION = ["']([^"']+)["'];/);
const workerVersion = serviceWorker.match(/const APP_VERSION = ["']([^"']+)["'];/);
assert.ok(scriptVersion, 'script.js APP_VERSION missing');
assert.ok(workerVersion, 'service-worker.js APP_VERSION missing');
assert.strictEqual(scriptVersion[1], workerVersion[1], 'App and service-worker versions are out of sync');

console.log(`Redesign contract guardrails passed for app version ${scriptVersion[1]}.`);
