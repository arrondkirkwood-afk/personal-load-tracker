(function (root) {
  'use strict';

  const STORAGE_KEY = 'personalOilfieldLoadTracker.paycheckReconciliation';

  function byId(id) { return root.document?.getElementById?.(id) || null; }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function parseDate(value) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '')); return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12) : new Date(); }
  function payPeriodFor(value) {
    const date = parseDate(value);
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() <= 15 ? 1 : 16, 12);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() <= 15 ? 15 : new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate(), 12);
    return { start: dateKey(start), end: dateKey(end) };
  }
  function money(value) { return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
  function signedMoney(value) { const amount = number(value); return `${amount > 0 ? '+' : ''}${money(amount)}`; }
  function inRange(date, range) { return date >= range.start && date <= range.end; }
  function loadSaved() { try { return JSON.parse(root.localStorage?.getItem(STORAGE_KEY) || '{}') || {}; } catch { return {}; } }
  function saveValue(key, value) { try { const data = loadSaved(); data[key] = value; root.localStorage?.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }

  function getPeriodData() {
    const anchor = byId('reconcile-anchor-date')?.value || byId('daily-date')?.value || dateKey(new Date());
    const range = payPeriodFor(anchor);
    const snapshot = root.getTrackerSnapshot?.();
    const daily = snapshot?.data?.dailySummaries || {};
    const days = Object.values(daily).filter((record) => inRange(String(record.date || record.workDate || ''), range));
    const sum = (key) => days.reduce((total, record) => total + number(record[key]), 0);
    const breakdown = {
      completed: sum('completedLoadPay'),
      rejects: sum('rejectPay'),
      wait: sum('totalWaitPay'),
      hourly: sum('hourlyAdditionalPay'),
      vacation: sum('vacationPay'),
      perDiem: sum('perDiemPay'),
      sleeper: sum('sleeperBerthPay'),
      trainer: sum('trainerPay')
    };
    const expected = days.reduce((total, record) => total + number(record.totalEstimatedDailyEarnings), 0);
    return { anchor, range, days, breakdown, expected };
  }

  function render() {
    const anchor = byId('reconcile-anchor-date');
    if (!anchor) return;
    if (!anchor.value) anchor.value = byId('daily-date')?.value || dateKey(new Date());
    const data = getPeriodData();
    byId('reconcile-period-start').value = data.range.start;
    byId('reconcile-period-end').value = data.range.end;
    byId('reconcile-expected').textContent = money(data.expected);
    byId('reconcile-completed-pay').textContent = money(data.breakdown.completed);
    byId('reconcile-reject-pay').textContent = money(data.breakdown.rejects);
    byId('reconcile-wait-pay').textContent = money(data.breakdown.wait);
    byId('reconcile-hourly-pay').textContent = money(data.breakdown.hourly);
    byId('reconcile-vacation-pay').textContent = money(data.breakdown.vacation);
    byId('reconcile-per-diem-pay').textContent = money(data.breakdown.perDiem);
    byId('reconcile-other-addons').textContent = money(data.breakdown.sleeper + data.breakdown.trainer);

    const key = `${data.range.start}:${data.range.end}`;
    const saved = loadSaved()[key];
    const paycheck = byId('reconcile-paycheck-gross');
    if (paycheck && paycheck.dataset.loadedKey !== key) {
      paycheck.value = saved == null ? '' : String(saved);
      paycheck.dataset.loadedKey = key;
    }
    const entered = paycheck?.value === '' ? null : number(paycheck?.value);
    const difference = entered == null ? null : entered - data.expected;
    byId('reconcile-difference').textContent = difference == null ? 'Enter paycheck gross' : signedMoney(difference);
    const status = byId('reconcile-status');
    if (!status) return;
    if (!data.days.length) {
      status.textContent = 'No tracker records in this pay period.';
      status.dataset.state = 'review';
    } else if (difference == null) {
      status.textContent = 'Enter the gross pay from the paycheck to compare it with the tracker.';
      status.dataset.state = 'neutral';
    } else if (Math.abs(difference) < 0.01) {
      status.textContent = 'Tracker and paycheck gross match.';
      status.dataset.state = 'ready';
    } else if (difference < 0) {
      status.textContent = `${money(Math.abs(difference))} less than the tracker estimate. Review the pay categories below.`;
      status.dataset.state = 'review';
    } else {
      status.textContent = `${money(difference)} more than the tracker estimate. Check for company adjustments or pay not entered in the tracker.`;
      status.dataset.state = 'neutral';
    }
  }

  function wire() {
    const anchor = byId('reconcile-anchor-date');
    const paycheck = byId('reconcile-paycheck-gross');
    anchor?.addEventListener('change', render);
    paycheck?.addEventListener('input', () => {
      const data = getPeriodData();
      const key = `${data.range.start}:${data.range.end}`;
      if (paycheck.value === '') {
        const saved = loadSaved(); delete saved[key];
        try { root.localStorage?.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch {}
      } else saveValue(key, number(paycheck.value));
      render();
    });
    byId('daily-date')?.addEventListener('change', () => { if (anchor) anchor.value = byId('daily-date')?.value || anchor.value; render(); });
    render();
  }

  if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', wire);
  else wire();
  root.PaycheckReconciliation = { getPeriodData, payPeriodFor, render };
}(typeof globalThis !== 'undefined' ? globalThis : this));