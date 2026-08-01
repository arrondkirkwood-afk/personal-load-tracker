# Oilfield Load & Workday Tracker

Oilfield Load Tracker is a separate phone-friendly app for keeping your own crude oil load records, daily totals, backups, and estimated daily earnings. It does not modify or depend on the Oilfield Load Calculator project.

## What The App Does

- Saves personal load entries in browser storage.
- Syncs signed-in records through Firebase Authentication and Cloud Firestore after a confirmed local-data migration.
- Shows a dashboard with selected-date, company pay-period, month, and all-time load counts.
- Saves a driver/equipment profile for future new loads.
- Calculates water barrels, oil barrels, crude weight per barrel, load weight, and estimated gross truck weight.
- Calculates completed-load pay from the loaded miles pay table only.
- Tracks rejects with estimated reject pay.
- Tracks Vacation Time under Paid Time at a fixed `$270.00` per day.
- Calculates estimated wait pay per load after the first unpaid hour on pickup and drop off.
- Stores per diem, sleeper berth, and trainer pay as once-per-day add-ons.
- Compares drop off meter barrels against gross barrels hauled.
- Shows searchable and filterable saved-load cards.
- Lets you open, edit, duplicate, print, export, or delete individual saved loads.
- Downloads CSV exports and a full JSON backup.
- Imports JSON backups by merge or confirmed replace.

## Workflow

1. Pick the selected date in Today's Daily Summary.
2. Fill out Add / Edit Load Entry in order:
   - Load Details
   - Loading/Unloading Time
   - Paid Time
   - Notes
3. Review the Summary Load Calculation below the form.
4. Tap Save Load, or Save Load & Start Next Load to clear load-specific fields and automatically prepare the next load number.
5. Review Saved Loads for Selected Date and Daily Earnings Review.
6. Use Settings and Backup at the bottom for CSV exports, JSON backup, import, updates, and printable reports.

## Pay And Earnings

Completed loads use only the loaded miles pay table. If loaded miles are blank or `0`, estimated load pay is `$0.00`. If loaded miles are above `240`, the matched range shows `No rate found — enter manually`.

Rejects use estimated reject pay of `$20.00`.

Wait pay is estimated at `$24.00` per paid hour. The first hour at pickup and the first hour at drop off are unpaid. Paid wait time is saved with each load and included in estimated entry pay.

Per diem is `$50.00`, sleeper berth is `$60.00`, and trainer pay is `$50.00`. These are saved once per selected date, not once per load.

Trainer pay appears as a separate line item in the dashboard, daily review, CSV exports, and printable reports. Five saved loads on one training date still produce one `$50.00` trainer-pay entry for that date.

Company pay periods are calculated from the selected work date: the 1st through the 15th, or the 16th through the final calendar day of that month. February 29 is included during leap years.

Wait pay and estimated earnings are for personal verification only and may not match official payroll. This app is not an official payroll system.

## Drop Off Meter Readings

The drop off meter comparison uses gross barrels only:

- Barrels offloaded = end meter reading minus start meter reading
- Difference vs gross barrels = barrels offloaded minus gross barrels hauled

Net barrels are not used for the offload comparison. The status shows `Over by ___ barrels`, `Short by ___ barrels`, or `Matches gross barrels exactly`.

## Editing And Deleting

Each saved load card has Open, Edit, Duplicate, Print, Export, and Delete buttons.

- Edit loads that entry back into the form and changes Save Load to Update Load.
- Update Load replaces the original entry instead of creating a duplicate.
- Duplicate loads the saved record into a new unsaved form. The total-load count increases only after saving the duplicated record as a separate load.
- Delete asks for confirmation before removing that one saved entry.
- If a new saved load matches another entry by date, ticket number, BOL number, and load number, the app warns you and lets you choose Save Anyway or Cancel.

## What It Does Not Do

This app is for personal recordkeeping and field-estimate use only. It is not an official company accounting system, payroll record, certified scale ticket, custody-transfer measurement, or legal compliance guarantee.

It does not replace the company ticket system, payroll records, official dispatch records, scale tickets, custody-transfer paperwork, or legal compliance checks.

## How To Test It

1. For full PWA testing, serve the folder locally with a simple static server.
2. Open the local URL in a browser.
3. Select a date.
4. Enter a completed load with gross barrels, API gravity, BS&W percentage, loaded miles, and meter readings.
5. Confirm the Summary Load Calculation updates before saving, including pickup wait, drop-off wait, wait pay, and estimated total pay.
6. Tap Save Load and confirm the dashboard and saved load card update.
7. Tap Edit on the saved card, change a value, then tap Update Load.
8. Tap Delete on the saved card and confirm only that entry is removed.
9. Use Export JSON Backup to back up all tracker data.
10. Use Import Backup with Merge for normal restores, or Replace only after confirming the current records should be replaced.
11. Sign in with the existing Firebase email/password account, review the migration counts, download a pre-migration backup, then migrate local records when ready.
12. After migration, confirm the same signed-in account shows the same records on the MacBook and iPhone.

Times can cross midnight. For example, an arrival at `23:30` and completed drop off at `02:30` counts as a 3 hour cycle.

## Data Storage

Saved loads, date-linked paid time, daily add-ons, daily earnings records, the driver/equipment profile, app settings, and app metadata are stored in the browser on the device you use. Records combines these separate data types into one date-based daily earnings view. After signing in and completing the migration, Firestore becomes the synchronized source while local browser storage remains as a safety fallback.

Current localStorage keys:

- `personalOilfieldLoadTracker.loads`
- `personalOilfieldLoadTracker.dailyAddOns`
- `personalOilfieldLoadTracker.dailySummaries`
- `personalOilfieldLoadTracker.profile`
- `personalOilfieldLoadTracker.meta`
- `personalOilfieldLoadTracker.settings`
- `personalOilfieldLoadTracker.paidTime`
- `personalOilfieldLoadTracker.favoriteRoutes`, retained only so older backups and synchronized data remain compatible; Favorite Route controls have been removed
- `personalOilfieldLoadTracker.currentDraft`, used only for the autosaved unfinished load draft
- `personalOilfieldLoadTracker.preMigrationBackup.v2`, only when an ID repair migration is needed
- `personalOilfieldLoadTracker.firebaseMigrationSafetyBackup.v3`, only when the Firebase migration safety backup is created

Legacy read-only fallback keys are still recognized:

- `personalOilfieldLoadTrackerLog`
- `personalOilfieldDailyEarningsAddOns`
- `personalOilfieldDailyEarningsRecords`

Firestore stores signed-in user data under the Firebase Authentication UID:

- `users/{uid}/loads/{loadId}`
- `users/{uid}/dailyAddOns/{date}`
- `users/{uid}/dailySummaries/{date}`
- `users/{uid}/profile/current`
- `users/{uid}/settings/app`
- `users/{uid}/metadata/migration`

The app never stores a Firebase password in source code and does not use Firebase Admin SDK keys.

Download a JSON backup before clearing browser data, switching browsers, replacing your device, or moving the app to another web address.

## Updating The Home Screen App

The app includes a versioned service worker so updated GitHub Pages files can replace older app-file caches without clearing saved load records. The update system only manages cached app files; it does not delete localStorage.

Current app version and cache version on the feature branch: `1.11.2`, cache name `personal-oilfield-load-tracker-v1.11.2`.

To update the app:

1. Make changes with Codex.
2. Increase the version number in `script.js` and `service-worker.js`.
3. Upload updated files to GitHub.
4. Wait for GitHub Pages green check.
5. Open the iPhone app.
6. Tap Check for Updates.
7. Close and reopen the app if needed.

GitHub is only needed when changing the app files, not for daily use.

## Files

- `index.html`
- `style.css`
- `script.js`
- `service-worker.js`
- `manifest.json`
- `icons/icon.svg`
- `icons/icon-192.png`
- `icons/icon-512.png`
- `README.md`


## Daily Form and Load Numbering

- The Add Load form starts clean when a saved unfinished draft belongs to a previous date. Saved load records are not deleted.
- New load numbers continue across the selected company pay period. The calculation uses both the number of saved pay-period records and the highest saved numeric load number so older daily-reset records do not restart the sequence.
- The header shows completed-load totals for the selected month and selected-date pay period.
- Dispatch and Earnings Analysis keeps the dispatcher filter while removing the pickup-state, drop-off-state, state-route, and exact-route filters from the screen. The underlying saved fields remain compatible with existing records and backups.
- Daily dispatch outcomes use completed-load base pay, the configured daily goal, and exact Start/End Workday times. Wait pay, paid time, and daily add-ons remain separate from completed-load productivity.
- The analysis begins with goal, exact-workday, and dispatcher-result cards, followed by expandable daily results, dispatcher comparisons, and automatically normalized pickup-to-drop-off route performance.
