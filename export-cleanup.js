(function (root, factory) {
  const api = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }

  if (root) {
    root.LoadTrackerExportCleanup = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const LOAD_HEADERS = [
    'Date',
    'Pay period',
    'Load #',
    'Status',
    'Ticket #',
    'BOL #',
    'Jotform #',
    'Dispatcher',
    'Driver',
    'Truck',
    'Trailer',
    'Pickup',
    'Pickup state',
    'Drop-off',
    'Drop-off state',
    'Gross barrels',
    'Offloaded barrels',
    'Difference barrels',
    'Loaded miles',
    'Rerouted miles',
    'Total loaded miles',
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
    'Hourly additional pay',
    'Vacation pay',
    'Total estimated earnings',
    'Shift start',
    'Shift end',
    'Duty hours',
    'Effective hourly earnings',
    'Default dispatcher',
    'Notes'
  ];

  function number(value, decimals = 2) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toFixed(decimals) : '';
  }

  function integer(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(Math.round(parsed)) : '0';
  }

  function text(value) {
    return value == null ? '' : String(value);
  }

  function csvValue(value) {
    const valueText = text(value);
    return `"${valueText.replaceAll('"', '""')}"`;
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

  function loadRows(snapshot) {
    const loads = Array.isArray(snapshot?.data?.loads) ? snapshot.data.loads.slice() : [];
    loads.sort((left, right) => {
      const dateCompare = text(left.loadDate).localeCompare(text(right.loadDate));
      if (dateCompare) return dateCompare;
      return text(left.loadNumber).localeCompare(text(right.loadNumber), undefined, { numeric: true });
    });

    return loads.map((load) => [
      text(load.loadDate),
      payPeriodLabel(load.loadDate),
      text(load.loadNumber),
      text(load.loadStatus),
      text(load.ticketNumber),
      text(load.bolNumber),
      text(load.jotformConfirmationNumber),
      text(load.dispatcher || 'Unknown'),
      text(load.driverName),
      text(load.truckNumber),
      text(load.trailerNumber),
      text(load.pickupLocation),
      text(load.pickupState),
      text(load.dropoffLocation),
      text(load.dropoffState),
      number(load.grossBarrels),
      number(load.barrelsOffloaded),
      number(load.differenceVsGrossBarrels),
      number(load.loadedMiles, 1),
      number(load.reRoutedMiles, 1),
      number(load.totalMilesIncludingReRoute, 1),
      number(load.deadheadMiles, 1),
      text(load.arrivedPickupTime),
      text(load.loadedTime),
      text(load.arrivedDropoffTime),
      text(load.completedTime),
      Number.isFinite(Number(load.totalPaidWaitMinutes)) ? number(Number(load.totalPaidWaitMinutes) / 60, 2) : '',
      number(load.estimatedPay),
      number(load.waitPay),
      number(load.estimatedEntryPay),
      text(load.notes)
    ]);
  }

  function dailyRows(snapshot) {
    const summaries = snapshot?.data?.dailySummaries && typeof snapshot.data.dailySummaries === 'object'
      ? Object.values(snapshot.data.dailySummaries)
      : [];

    return summaries
      .slice()
      .sort((left, right) => text(left.date).localeCompare(text(right.date)))
      .map((record) => [
        text(record.date),
        payPeriodLabel(record.date),
        integer(record.completedLoadCount),
        integer(record.rejectCount),
        number(record.totalGrossBarrels),
        number(record.totalLoadedMiles, 1),
        number(record.totalReRoutedMiles, 1),
        number(record.totalDeadheadMiles, 1),
        number(record.completedLoadPay),
        number(record.rejectPay),
        number(record.totalWaitPay),
        number(record.perDiemPay),
        number(record.sleeperBerthPay),
        number(record.trainerPay),
        number(record.hourlyAdditionalPay),
        number(record.vacationPay),
        number(record.totalEstimatedDailyEarnings),
        text(record.shiftStartTime),
        text(record.shiftEndTime),
        Number.isFinite(Number(record.exactDutyMinutes)) ? number(Number(record.exactDutyMinutes) / 60, 2) : '',
        number(record.effectiveHourlyEarnings),
        text(record.defaultDispatcher || 'Unknown'),
        text(record.notes)
      ]);
  }

  function buildCleanLoadExport(snapshot) {
    const rows = loadRows(snapshot);
    return {
      headers: LOAD_HEADERS.slice(),
      rows,
      csv: buildCsv(LOAD_HEADERS, rows)
    };
  }

  function buildCleanDailyEarningsExport(snapshot) {
    const rows = dailyRows(snapshot);
    return {
      headers: DAILY_HEADERS.slice(),
      rows,
      csv: buildCsv(DAILY_HEADERS, rows)
    };
  }

  return {
    LOAD_HEADERS,
    DAILY_HEADERS,
    buildCsv,
    payPeriodLabel,
    buildCleanLoadExport,
    buildCleanDailyEarningsExport
  };
}));
