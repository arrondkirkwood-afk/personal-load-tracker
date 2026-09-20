(function (root) {
  'use strict';
  const STORAGE_KEY = 'personalOilfieldLoadTracker.paycheckReconciliation';
  const byId = (id) => root.document?.getElementById?.(id) || null;
  const number = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };
  const dateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const parseDate = (value) => { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '')); return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : new Date(); };
  const money = (value) => number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const signedMoney = (value) => `${number(value) > 0 ? '+' : ''}${money(value)}`;
  const inRange = (date, range) => date >= range.start && date <= range.end;

  function payPeriodFor(value) {
    const date = parseDate(value);
    const firstHalf = date.getDate() <= 15;
    const start = new Date(date.getFullYear(), date.getMonth(), firstHalf ? 1 : 16, 12);
    const end = new Date(date.getFullYear(), date.getMonth(), firstHalf ? 15 : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(), 12);
    return { start: dateKey(start), end: dateKey(end) };
  }

  function loadSaved() { try { return JSON.parse(root.localStorage?.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; } }
  function saveEntry(key, value) { try { const data = loadSaved(); data[key] = value; root.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

  function getPeriodData() {
    const anchor = byId('reconcile-anchor-date')?.value || byId('daily-date')?.value || dateKey(new Date());
    const range = payPeriodFor(anchor);
    const daily = root.getTrackerSnapshot?.()?.data?.dailySummaries || {};
    const days = Object.values(daily).filter((record) => inRange(String(record.date || record.workDate || ''), range));
    const sum = (key) => days.reduce((total, record) => total + number(record[key]), 0);
    const breakdown = { completed: sum('completedLoadPay'), rejects: sum('rejectPay'), wait: sum('totalWaitPay'), hourly: sum('hourlyAdditionalPay'), vacation: sum('vacationPay'), perDiem: sum('perDiemPay'), sleeper: sum('sleeperBerthPay'), trainer: sum('trainerPay') };
    const total = sum('totalEstimatedDailyEarnings');
    const nonTaxable = breakdown.perDiem;
    const taxable = days.reduce((amount, record) => amount + (Number.isFinite(Number(record.taxableEstimatedEarnings)) ? number(record.taxableEstimatedEarnings) : number(record.totalEstimatedDailyEarnings) - number(record.perDiemPay)), 0);
    return { anchor, range, days, breakdown, taxable, nonTaxable, total };
  }

  function inputValue(id) { const input = byId(id); return !input || input.value === '' ? null : number(input.value); }
  function currentEntry() {
    return { paycheckDate: byId('reconcile-paycheck-date')?.value || '', grossTaxable: inputValue('reconcile-paycheck-gross'), nonTaxablePerDiem: inputValue('reconcile-paycheck-per-diem'), adjustments: inputValue('reconcile-adjustments') ?? 0, tolerance: inputValue('reconcile-tolerance') ?? 1, notes: byId('reconcile-notes')?.value || '' };
  }
  function loadEntry(key) {
    const saved = loadSaved()[key];
    if (typeof saved === 'number') return { grossTaxable: saved, nonTaxablePerDiem: null, adjustments: 0, tolerance: 1, paycheckDate: '', notes: '' };
    return saved && typeof saved === 'object' ? saved : { grossTaxable: null, nonTaxablePerDiem: null, adjustments: 0, tolerance: 1, paycheckDate: '', notes: '' };
  }
  function populateEntry(key) {
    const gross = byId('reconcile-paycheck-gross');
    if (!gross || gross.dataset.loadedKey === key) return;
    const entry = loadEntry(key);
    const values = { 'reconcile-paycheck-date': entry.paycheckDate, 'reconcile-paycheck-gross': entry.grossTaxable, 'reconcile-paycheck-per-diem': entry.nonTaxablePerDiem, 'reconcile-adjustments': entry.adjustments ?? 0, 'reconcile-tolerance': entry.tolerance ?? 1, 'reconcile-notes': entry.notes };
    Object.entries(values).forEach(([id, value]) => { const field = byId(id); if (field) field.value = value == null ? '' : String(value); });
    gross.dataset.loadedKey = key;
  }

  function render() {
    const anchor = byId('reconcile-anchor-date');
    if (!anchor) return;
    if (!anchor.value) anchor.value = byId('daily-date')?.value || dateKey(new Date());
    const data = getPeriodData();
    byId('reconcile-period-start').value = data.range.start;
    byId('reconcile-period-end').value = data.range.end;
    const key = `${data.range.start}:${data.range.end}`;
    populateEntry(key);
    const entry = currentEntry();
    const taxableDifference = entry.grossTaxable == null ? null : entry.grossTaxable - data.taxable;
    const perDiemDifference = entry.nonTaxablePerDiem == null ? null : entry.nonTaxablePerDiem - data.nonTaxable;
    const enteredTotal = entry.grossTaxable == null && entry.nonTaxablePerDiem == null ? null : number(entry.grossTaxable) + number(entry.nonTaxablePerDiem);
    const totalDifference = enteredTotal == null ? null : enteredTotal - (data.total + entry.adjustments);
    byId('reconcile-expected').textContent = money(data.taxable);
    byId('reconcile-expected-per-diem').textContent = money(data.nonTaxable);
    byId('reconcile-expected-total').textContent = money(data.total);
    byId('reconcile-difference').textContent = taxableDifference == null ? 'Enter official gross' : signedMoney(taxableDifference);
    byId('reconcile-per-diem-difference').textContent = perDiemDifference == null ? 'Enter official per diem' : signedMoney(perDiemDifference);
    byId('reconcile-total-difference').textContent = totalDifference == null ? 'Enter paystub amounts' : signedMoney(totalDifference);
    byId('reconcile-completed-pay').textContent = money(data.breakdown.completed);
    byId('reconcile-reject-pay').textContent = money(data.breakdown.rejects);
    byId('reconcile-wait-pay').textContent = money(data.breakdown.wait);
    byId('reconcile-hourly-pay').textContent = money(data.breakdown.hourly);
    byId('reconcile-vacation-pay').textContent = money(data.breakdown.vacation);
    byId('reconcile-per-diem-pay').textContent = money(data.breakdown.perDiem);
    byId('reconcile-other-addons').textContent = money(data.breakdown.sleeper + data.breakdown.trainer);
    const status = byId('reconcile-status');
    if (!status) return;
    if (!data.days.length) { status.textContent = 'No tracker records are available for this work period.'; status.dataset.state = 'review'; }
    else if (totalDifference == null) { status.textContent = 'Enter the official paystub amounts. Adjustments change the expected total, not saved work records.'; status.dataset.state = 'neutral'; }
    else if (Math.abs(totalDifference) <= Math.max(0, entry.tolerance)) { status.textContent = `Matched within the ${money(entry.tolerance)} tolerance.`; status.dataset.state = 'ready'; }
    else if (totalDifference < 0) { status.textContent = `${money(Math.abs(totalDifference))} below the adjusted tracker estimate. Review missing pay, classifications, and payroll cutoffs.`; status.dataset.state = 'review'; }
    else { status.textContent = `${money(totalDifference)} above the adjusted tracker estimate. Check bonuses, retro pay, or work from another period.`; status.dataset.state = 'neutral'; }
  }

  function wire() {
    const anchor = byId('reconcile-anchor-date');
    anchor?.addEventListener('change', render);
    ['reconcile-paycheck-date', 'reconcile-paycheck-gross', 'reconcile-paycheck-per-diem', 'reconcile-adjustments', 'reconcile-tolerance', 'reconcile-notes'].forEach((id) => byId(id)?.addEventListener('input', () => { const data = getPeriodData(); saveEntry(`${data.range.start}:${data.range.end}`, currentEntry()); render(); }));
    byId('daily-date')?.addEventListener('change', () => { if (anchor) anchor.value = byId('daily-date')?.value || anchor.value; render(); });
    render();
  }

  if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', wire); else wire();
  root.PaycheckReconciliation = { getPeriodData, payPeriodFor, render };
}(typeof globalThis !== 'undefined' ? globalThis : this));
