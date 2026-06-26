# Personal Oilfield Load Tracker

Personal Oilfield Load Tracker is a separate phone-friendly app for keeping your own crude oil load records, daily totals, and estimated daily earnings. It does not modify or depend on the Oilfield Load Calculator project.

## What The App Does

- Saves personal load entries in browser storage.
- Shows a selected-date daily summary at the top.
- Calculates water barrels, oil barrels, crude weight per barrel, load weight, and estimated gross truck weight.
- Calculates completed-load pay from the loaded miles pay table only.
- Tracks rejects with estimated reject pay.
- Calculates estimated wait pay per load after the first unpaid hour on pickup and drop off.
- Stores per diem and sleeper berth as once-per-day add-ons.
- Compares drop off meter barrels against gross barrels hauled.
- Shows saved loads for the selected date as compact cards.
- Lets you edit or delete individual saved loads.
- Downloads a load log CSV and a daily earnings CSV.

## Workflow

1. Pick the selected date in Today's Daily Summary.
2. Fill out Add / Edit Load Entry in order:
   - Driver / Equipment
   - Load Details
   - Time Tracking
   - Drop Off Meter Readings
   - Daily Add-Ons
3. Review the Summary Load Calculation below the form.
4. Tap Save Load.
5. Review Saved Loads for Selected Date and Daily Earnings Review.
6. Use Download / Backup at the bottom for CSV exports or clearing the saved load log.

## Pay And Earnings

Completed loads use only the loaded miles pay table. If loaded miles are blank or `0`, estimated load pay is `$0.00`. If loaded miles are above `240`, the matched range shows `No rate found — enter manually`.

Rejects use estimated reject pay of `$20.00`.

Wait pay is estimated at `$24.00` per paid hour. The first hour at pickup and the first hour at drop off are unpaid. Paid wait time is saved with each load and included in estimated entry pay.

Per diem is `$50.00` and sleeper berth is `$60.00`. These are saved once per selected date, not once per load.

Wait pay and estimated earnings are for personal verification only and may not match official payroll. This app is not an official payroll system.

## Drop Off Meter Readings

The drop off meter comparison uses gross barrels only:

- Barrels offloaded = end meter reading minus start meter reading
- Difference vs gross barrels = barrels offloaded minus gross barrels hauled

Net barrels are not used for the offload comparison. The status shows `Over by ___ barrels`, `Short by ___ barrels`, or `Matches gross barrels exactly`.

## Editing And Deleting

Each saved load card has Edit and Delete buttons.

- Edit loads that entry back into the form and changes Save Load to Update Load.
- Update Load replaces the original entry instead of creating a duplicate.
- Delete asks for confirmation before removing that one saved entry.
- If a new saved load matches another entry by date, ticket number, BOL number, and load number, the app warns you and lets you choose Save Anyway or Cancel.

## What It Does Not Do

This app is for personal recordkeeping and field-estimate use only. It is not an official company accounting system, payroll record, certified scale ticket, custody-transfer measurement, or legal compliance guarantee.

It does not replace the company ticket system, payroll records, official dispatch records, scale tickets, custody-transfer paperwork, or legal compliance checks.

## How To Test It

1. Open `index.html` in a browser.
2. Select a date.
3. Enter a completed load with gross barrels, API gravity, BS&W percentage, loaded miles, and meter readings.
4. Confirm the Summary Load Calculation updates before saving, including pickup wait, drop-off wait, wait pay, and estimated total pay.
5. Tap Save Load and confirm the daily summary and saved load card update.
6. Tap Edit on the saved card, change a value, then tap Update Load.
7. Tap Delete on the saved card and confirm only that entry is removed.
8. Use Download Load Log CSV and Download Daily Earnings CSV to back up records.

Times can cross midnight. For example, an arrival at `23:30` and completed drop off at `02:30` counts as a 3 hour cycle.

## Data Storage

Saved loads, daily add-ons, and daily earnings records are stored in the browser on the device you use. The app uses `personalOilfieldLoadTracker.loads`, `personalOilfieldLoadTracker.dailyAddOns`, and `personalOilfieldLoadTracker.dailySummaries` in localStorage.

Download your CSV files before clearing browser data, switching browsers, replacing your device, or moving the app to another web address.

## Files

- `index.html`
- `style.css`
- `script.js`
- `README.md`
