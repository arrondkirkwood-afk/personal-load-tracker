(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.LoadTrackerExportCleanup = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LOAD_HEADERS = [
    'Date',
    'Pay period',
    'Load #',
    'Status',
    'Ticket #',
    'BOL #',
    'Jotform #',
    'Dispatcher',
    'Truck',
    'Trailer',
    'Pickup',
    'Drop-off',
    'Oil company',
    'Gross barrels',
    'Offloaded barrels',
    'Difference barrels',
    'Loaded miles',
    'Rerouted miles',
    'Deadhead miles',
    'Loading start',
    'Loading end',
    'Unload start',
    'Unload end',
    'Paid wait hours',
    'Base / reject pay',
    'Wait pay',
    'Total load pay',
    'Notes'
  ];

  const DAILY_HEADERS = [
    'Date',
    'Pay period',
    'Completed loads',
    'Rejects',
    'Gross barrels',
    'Loaded miles',
    'Rerouted miles',
    'Deadhead miles',
    'Completed-load pay',
    'Reject pay',
    'Wait pay',
    'Per diem',
    'Sleeper',
    'Trainer',
    'Other hourly pay',
    'Vacation pay',
    'Total estimated earnings',
    'Shift start',
    'Shift end',
    'Duty hours',
    'Effective hourly earnings',
    'Default dispatcher',
    'Notes'
  ];

  function text(value) {
    return value == null ? '' : String(value);
  }

  function normalizedText(value) {
    return text(value).trim().toLowerCase();
  }

  function numeric(value, decimals = 2) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return '';
    return Number(parsed.toFixed(decimals));
  }

  function integer(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }

  function spreadsheetSafeText(value) {
    const valueText = text(value);
    return /^[=+\-@]/.test(valueText) ? `'${valueText}` : valueText;
  }

  function csvValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    const valueText = spreadsheetSafeText(value);
    if (/[",\r\n]/.test(valueText)) {
      return `"${valueText.replaceAll('"', '""')}"`;
    }
    return valueText;
  }

  function buildCsv(headers, rows) {
    return `\ufeff${[headers, ...rows]
      .map((row) => row.map(csvValue).join(','))
      .join('\r\n')}`;
  }

  function parseDate(dateValue) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text(dateValue));
    if (!match) return null;
    return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  }

  function daysInMonth(year, month) {
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function payPeriodLabel(dateValue) {
    const date = parseDate(dateValue);
    if (!date) return '';
    const startDay = date.day <= 15 ? 1 : 16;
    const endDay = date.day <= 15 ? 15 : daysInMonth(date.year, date.month);
    const pad = (value) => String(value).padStart(2, '0');
    return `${date.year}-${pad(date.month)}-${pad(startDay)} to ${date.year}-${pad(date.month)}-${pad(endDay)}`;
  }

  function locationLabel(location, state) {
    const locationText = text(location).trim();
    const stateText = text(state).trim().toUpperCase();
    if (!locationText) return stateText;
    if (!stateText || locationText.toUpperCase().endsWith(`, ${stateText}`)) return locationText;
    return `${locationText}, ${stateText}`;
  }

  function recordTimestamp(record) {
    for (const candidate of [record?.updatedAt, record?.savedAt, record?.createdAt]) {
      const timestamp = Date.parse(candidate || '');
      if (Number.isFinite(timestamp)) return timestamp;
    }
    return 0;
  }

  function completenessScore(record) {
    return Object.values(record || {}).reduce((score, value) => {
      if (value == null || value === '') return score;
      if (Array.isArray(value)) return score + (value.length ? 1 : 0);
      if (typeof value === 'object') return score + (Object.keys(value).length ? 1 : 0);
      return score + 1;
    }, 0);
  }

  function choosePreferredRecord(current, candidate) {
    if (!current) return candidate;
    const currentTime = recordTimestamp(current);
    const candidateTime = recordTimestamp(candidate);
    if (candidateTime !== currentTime) return candidateTime > currentTime ? candidate : current;
    return completenessScore(candidate) > completenessScore(current) ? candidate : current;
  }

  function loadIdentity(load) {
    const date = normalizedText(load?.loadDate);
    const ticket = normalizedText(load?.ticketNumber);
    const bol = normalizedText(load?.bolNumber);
    const jotform = normalizedText(load?.jotformConfirmationNumber);
    const loadNumber = normalizedText(load?.loadNumber);

    if (ticket) return `ticket|${date}|${ticket}`;
    if (bol) return `bol|${date}|${bol}`;
    if (jotform) return `jotform|${date}|${jotform}`;
    if (loadNumber) {
      return [
        'load',
        date,
        loadNumber,
        normalizedText(load?.pickupLocation),
        normalizedText(load?.dropoffLocation)
      ].join('|');
    }
    if (load?.id) return `id|${normalizedText(load.id)}`;

    return [
      'fallback',
      date,
      normalizedText(load?.pickupLocation),
      normalizedText(load?.dropoffLocation),
      text(load?.grossBarrels),
      text(load?.loadedMiles),
      text(load?.arrivedPickupTime)
    ].join('|');
  }

  function dedupeLoads(loads) {
    const byIdentity = new Map();
    (Array.isArray(loads) ? loads : []).forEach((load) => {
      if (!load || !text(load.loadDate).trim()) return;
      const key = loadIdentity(load);
      byIdentity.set(key, choosePreferredRecord(byIdentity.get(key), load));
    });
    return [...byIdentity.values()];
  }

  function uniqueRows(rows) {
    const seen = new Set();
    return rows.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function loadRows(snapshot) {
    const sourceLoads = Array.isArray(snapshot?.data?.loads) ? snapshot.data.loads : [];
    const loads = dedupeLoads(sourceLoads).sort((left, right) => {
      const dateCompare = text(left.loadDate).localeCompare(text(right.loadDate));
      if (dateCompare) return dateCompare;
      return text(left.loadNumber).localeCompare(text(right.loadNumber), undefined, { numeric: true });
    });

    const rows = loads.map((load) => [
      text(load.loadDate),
      payPeriodLabel(load.loadDate),
      text(load.loadNumber),
      text(load.loadStatus),
      text(load.ticketNumber),
      text(load.bolNumber),
      text(load.jotformConfirmationNumber),
      text(load.dispatcher || 'Unknown'),
      text(load.truckNumber),
      text(load.trailerNumber),
      locationLabel(load.pickupLocation, load.pickupState),
      locationLabel(load.dropoffLocation, load.dropoffState),
      text(load.customer),
      numeric(load.grossBarrels),
      numeric(load.barrelsOffloaded),
      numeric(load.differenceVsGrossBarrels),
      numeric(load.loadedMiles, 1),
      numeric(load.reRoutedMiles, 1),
      numeric(load.deadheadMiles, 1),
      text(load.arrivedPickupTime),
      text(load.loadedTime),
      text(load.arrivedDropoffTime),
      text(load.completedTime),
      Number.isFinite(Number(load.totalPaidWaitMinutes)) ? numeric(Number(load.totalPaidWaitMinutes) / 60, 2) : '',
      numeric(load.estimatedPay),
      numeric(load.waitPay),
      numeric(load.estimatedEntryPay),
      text(load.notes)
    ]);

    return {
      rows: uniqueRows(rows),
      sourceCount: sourceLoads.length,
      deduplicatedCount: sourceLoads.length - loads.length
    };
  }

  function getDailySummaryRecords(snapshot) {
    const summaries = snapshot?.data?.dailySummaries;
    if (Array.isArray(summaries)) return summaries.slice();
    if (summaries && typeof summaries === 'object') return Object.values(summaries);
    return [];
  }

  function hasDailyActivity(record) {
    const numericFields = [
      'completedLoadCount', 'rejectCount', 'totalGrossBarrels', 'totalLoadedMiles',
      'totalReRoutedMiles', 'totalDeadheadMiles', 'completedLoadPay', 'rejectPay',
      'totalWaitPay', 'perDiemPay', 'sleeperBerthPay', 'trainerPay',
      'hourlyAdditionalPay', 'vacationPay', 'totalEstimatedDailyEarnings', 'exactDutyMinutes'
    ];
    if (numericFields.some((field) => Number(record?.[field]) !== 0 && Number.isFinite(Number(record?.[field])))) return true;
    return Boolean(text(record?.shiftStartTime).trim() || text(record?.shiftEndTime).trim() || text(record?.notes).trim());
  }

  function dedupeDailySummaries(records) {
    const byDate = new Map();
    records.forEach((record) => {
      const date = text(record?.date || record?.workDate).trim();
      if (!date || !hasDailyActivity(record)) return;
      byDate.set(date, choosePreferredRecord(byDate.get(date), { ...record, date }));
    });
    return [...byDate.values()];
  }

  function dailyRows(snapshot) {
    const sourceRecords = getDailySummaryRecords(snapshot);
    const summaries = dedupeDailySummaries(sourceRecords)
      .sort((left, right) => text(left.date).localeCompare(text(right.date)));

    const rows = summaries.map((record) => [
      text(record.date),
      payPeriodLabel(record.date),
      integer(record.completedLoadCount),
      integer(record.rejectCount),
      numeric(record.totalGrossBarrels),
      numeric(record.totalLoadedMiles, 1),
      numeric(record.totalReRoutedMiles, 1),
      numeric(record.totalDeadheadMiles, 1),
      numeric(record.completedLoadPay),
      numeric(record.rejectPay),
      numeric(record.totalWaitPay),
      numeric(record.perDiemPay),
      numeric(record.sleeperBerthPay),
      numeric(record.trainerPay),
      numeric(record.hourlyAdditionalPay),
      numeric(record.vacationPay),
      numeric(record.totalEstimatedDailyEarnings),
      text(record.shiftStartTime),
      text(record.shiftEndTime),
      Number.isFinite(Number(record.exactDutyMinutes)) ? numeric(Number(record.exactDutyMinutes) / 60, 2) : '',
      numeric(record.effectiveHourlyEarnings),
      text(record.defaultDispatcher || 'Unknown'),
      text(record.notes)
    ]);

    return {
      rows: uniqueRows(rows),
      sourceCount: sourceRecords.length,
      deduplicatedCount: sourceRecords.length - summaries.length
    };
  }

  function buildCleanLoadExport(snapshot) {
    const built = loadRows(snapshot);
    return {
      headers: LOAD_HEADERS.slice(),
      rows: built.rows,
      sourceCount: built.sourceCount,
      duplicateRowsRemoved: built.deduplicatedCount,
      csv: buildCsv(LOAD_HEADERS, built.rows)
    };
  }

  function buildCleanDailyEarningsExport(snapshot) {
    const built = dailyRows(snapshot);
    return {
      headers: DAILY_HEADERS.slice(),
      rows: built.rows,
      sourceCount: built.sourceCount,
      duplicateRowsRemoved: built.deduplicatedCount,
      csv: buildCsv(DAILY_HEADERS, built.rows)
    };
  }

  return {
    LOAD_HEADERS,
    DAILY_HEADERS,
    buildCsv,
    payPeriodLabel,
    dedupeLoads,
    buildCleanLoadExport,
    buildCleanDailyEarningsExport
  };
}));
