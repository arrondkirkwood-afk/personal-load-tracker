(function (root) {
  'use strict';

  function byId(id) { return root.document?.getElementById?.(id) || null; }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
  function clean(value) { return String(value ?? '').trim(); }
  function formatHours(minutes) { return `${(Math.max(0, number(minutes)) / 60).toFixed(2)} hr`; }
  function selectedDate() { return byId('daily-date')?.value || ''; }
  function loadStatus(load) { return clean(load?.loadStatus || load?.status || load?.load_status).toLowerCase(); }
  function isCompleted(load) { return loadStatus(load) === 'completed load' || loadStatus(load) === 'completed'; }
  function isReject(load) { return loadStatus(load) === 'reject' || loadStatus(load) === 'rejected'; }

  function getDayData() {
    const snapshot = root.getTrackerSnapshot?.();
    if (!snapshot?.data) return null;
    const date = selectedDate();
    const data = snapshot.data;
    const loads = (data.loads || []).filter((load) => load.loadDate === date);
    const paid = (data.paidTime || []).filter((item) => (item.workDate || item.date) === date);
    const addOn = data.dailyAddOns?.[date] || {};
    const summary = data.dailySummaries?.[date] || {};
    const completed = loads.filter(isCompleted).length;
    const rejects = loads.filter(isReject).length;
    const needsReview = loads.length - completed - rejects;
    const hourlyMinutes = paid
      .filter((item) => clean(item.category) !== 'Vacation Time')
      .reduce((sum, item) => sum + number(item.durationMinutes), 0);
    const paidWaitMinutes = loads.reduce((sum, load) => sum + number(load.paidPickupWaitMinutes) + number(load.paidDropoffWaitMinutes), 0);
    const hasActivity = loads.length > 0 || paid.length > 0 || Boolean(addOn.shiftStartTime || addOn.shiftEndTime);
    const perDiem = Boolean(summary.perDiemApplied ?? addOn.perDiem ?? hasActivity);
    const warnings = [];
    if (needsReview > 0) warnings.push(`${needsReview} load record${needsReview === 1 ? '' : 's'} need an explicit Completed Load or Reject status`);
    if (hasActivity && !addOn.shiftStartTime) warnings.push('shift start is missing');
    if (hasActivity && !addOn.shiftEndTime) warnings.push('shift end is missing');
    return { date, addOn, completed, rejects, needsReview, hourlyMinutes, paidWaitMinutes, perDiem, hasActivity, warnings };
  }

  function render() {
    const panel = byId('daily-closeout-panel');
    if (!panel) return;
    const day = getDayData();
    if (!day) {
      byId('daily-closeout-status').textContent = 'Unavailable';
      byId('daily-closeout-summary').textContent = 'Tracker data is still loading.';
      return;
    }

    byId('daily-closeout-completed').textContent = String(day.completed);
    byId('daily-closeout-rejects').textContent = String(day.rejects);
    byId('daily-closeout-per-diem').textContent = day.perDiem ? 'Yes' : 'No';
    byId('daily-closeout-hourly').textContent = formatHours(day.hourlyMinutes);
    byId('daily-closeout-wait').textContent = formatHours(day.paidWaitMinutes);
    byId('daily-closeout-shift').textContent = day.addOn.shiftStartTime && day.addOn.shiftEndTime
      ? `${day.addOn.shiftStartTime}–${day.addOn.shiftEndTime}`
      : 'Incomplete';

    const status = byId('daily-closeout-status');
    const summary = byId('daily-closeout-summary');
    if (!day.hasActivity) {
      status.textContent = 'No activity';
      status.dataset.state = 'neutral';
      summary.textContent = 'No loads, rejects, paid time, or workday times are saved for this date.';
    } else if (day.warnings.length) {
      status.textContent = 'Review';
      status.dataset.state = 'review';
      summary.textContent = day.warnings.join(' · ');
    } else {
      status.textContent = 'Ready';
      status.dataset.state = 'ready';
      summary.textContent = `${day.completed} completed load${day.completed === 1 ? '' : 's'} · ${day.rejects} reject${day.rejects === 1 ? '' : 's'} · Per diem ${day.perDiem ? 'Yes' : 'No'} · ${formatHours(day.hourlyMinutes)} hourly work.`;
    }
  }

  function reviewWorkday() {
    const details = byId('end-workday-details');
    if (details) details.open = true;
    const end = byId('workday-shift-end');
    if (end && !end.value) end.focus();
    details?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }

  function wire() {
    byId('daily-date')?.addEventListener('change', render);
    byId('daily-closeout-review-button')?.addEventListener('click', reviewWorkday);
    if (root.MutationObserver) {
      const observer = new root.MutationObserver(() => root.setTimeout?.(render, 0));
      ['today-completed-loads', 'today-rejects', 'daily-total-earnings', 'workday-status'].forEach((id) => {
        const element = byId(id);
        if (element) observer.observe(element, { childList: true, characterData: true, subtree: true });
      });
    }
    root.addEventListener?.('pageshow', render);
    render();
  }

  if (root.document?.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', wire);
  else wire();

  root.DailyCloseoutReview = { getDayData, render };
}(typeof globalThis !== 'undefined' ? globalThis : this));