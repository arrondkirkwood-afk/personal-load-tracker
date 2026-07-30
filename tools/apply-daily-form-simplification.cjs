const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function write(file, content) {
  fs.writeFileSync(path.join(root, file), content);
}

function replaceRequired(content, before, after, label) {
  if (!content.includes(before)) {
    throw new Error(`Patch target not found: ${label}`);
  }
  return content.replace(before, after);
}

const versionFiles = [
  'README.md',
  'index.html',
  'manifest.json',
  'repair.html',
  'script.js',
  'service-worker.js',
  'tests/regression.test.js'
];

for (const file of versionFiles) {
  const current = read(file);
  write(file, current.replaceAll('1.7.0', '1.8.0'));
}

let html = read('index.html');
html = replaceRequired(
  html,
  '          <span id="header-record-count">0 loads</span>',
  '          <span id="header-month-load-count">Month: 0 completed</span>\n          <span id="header-pay-period-load-count">Pay period: 0 completed</span>',
  'header load counters'
);

html = replaceRequired(
  html,
  '            <summary><strong>Dispatch and Earnings Analysis</strong></summary>\n            <div class="report-controls analysis-filters">',
  `            <summary><strong>Dispatch and Earnings Analysis</strong></summary>\n            <div class="analysis-guide">\n              <strong>How to use this analysis</strong>\n              <p>First choose the date range above. Leave Dispatcher set to All for the full picture, or choose one dispatcher for a direct comparison.</p>\n              <div class="analysis-guide-grid">\n                <span><b>Completed loads</b> tells you how much work was finished.</span>\n                <span><b>Total estimated earnings</b> combines load pay, wait pay, paid time, and daily add-ons.</span>\n                <span><b>Average completed-load pay per workday</b> shows whether dispatch produced enough load pay each day.</span>\n                <span><b>Effective hourly earnings</b> is most reliable when Start and End Workday are entered.</span>\n              </div>\n              <p class="helper-text">For useful results, enter the correct dispatcher, load status, locations, load times, miles, pay information, and workday start/end times. Missing information is excluded rather than guessed.</p>\n            </div>\n            <div class="report-controls analysis-filters">`,
  'analysis explanation'
);

for (const field of [
  '              <label for="analysis-pickup-state-filter"><span>Pickup state</span><select id="analysis-pickup-state-filter"><option value="">All</option></select></label>\n',
  '              <label for="analysis-dropoff-state-filter"><span>Drop-off state</span><select id="analysis-dropoff-state-filter"><option value="">All</option></select></label>\n',
  '              <label for="analysis-state-route-filter"><span>State route</span><select id="analysis-state-route-filter"><option value="">All</option></select></label>\n',
  '              <label for="analysis-exact-route-filter"><span>Exact route</span><select id="analysis-exact-route-filter"><option value="">All</option></select></label>\n'
]) {
  html = replaceRequired(html, field, '', `remove analysis filter ${field.match(/for="([^"]+)/)?.[1] || field}`);
}
write('index.html', html);

let script = read('script.js');
script = replaceRequired(
  script,
  `function getNextLoadNumber(date = daily.date?.value || todayLocal()) {\n  const numbers = getLoadsForDate(date)\n    .map((load) => String(load.loadNumber || '').match(/\\d+/g)?.pop())\n    .map((value) => Number(value))\n    .filter((value) => Number.isFinite(value));\n  const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;\n  return String(nextNumber);\n}\n\nfunction ensureLoadNumber() {\n  if (!fields.loadNumber?.value && !editingLoadId) {\n    fields.loadNumber.value = getNextLoadNumber(fields.loadDate?.value || daily.date?.value || todayLocal());\n  }\n}`,
  `function getNextLoadNumber(date = daily.date?.value || todayLocal()) {\n  const payPeriodRange = getCompanyPayPeriodRange(date);\n  const periodLoads = getLoadsForRange(payPeriodRange.start, payPeriodRange.end);\n  const savedNumbers = periodLoads\n    .map((load) => String(load.loadNumber || '').match(/\\d+/g)?.pop())\n    .map((value) => Number(value))\n    .filter((value) => Number.isFinite(value));\n  const nextFromCount = periodLoads.length + 1;\n  const nextFromSavedNumbers = savedNumbers.length > 0 ? Math.max(...savedNumbers) + 1 : 1;\n  return String(Math.max(nextFromCount, nextFromSavedNumbers));\n}\n\nfunction ensureLoadNumber() {\n  if (fields.loadNumber && !editingLoadId) {\n    fields.loadNumber.value = getNextLoadNumber(fields.loadDate?.value || daily.date?.value || todayLocal());\n  }\n}`,
  'pay-period load numbering'
);

script = replaceRequired(
  script,
  `function restoreDraftIfAvailable() {\n  const draft = readDraft();\n\n  updateDraftButtonState(Boolean(draft));\n\n  if (!draft) {\n    return;\n  }\n\n  applyDraft(draft);\n}`,
  `function restoreDraftIfAvailable() {\n  const draft = readDraft();\n\n  updateDraftButtonState(Boolean(draft));\n\n  if (!draft) {\n    return;\n  }\n\n  const draftDate = normalizeDateKey(draft.formValues?.loadDate || draft.selectedDate || String(draft.savedAt || '').slice(0, 10));\n  if (!draft.editingLoadId && draftDate && draftDate !== todayLocal()) {\n    clearDraft();\n    daily.date.value = todayLocal();\n    clearForm();\n    setStatusMessage(draftStatus, 'Started a clean load form for today. The previous-day draft was cleared.');\n    return;\n  }\n\n  applyDraft(draft);\n}`,
  'daily stale-draft reset'
);

script = replaceRequired(
  script,
  `  setElementText(headerRecordCount, \`${'${countUniqueLoads()}'} ${'${countUniqueLoads() === 1 ? \'load\' : \'loads\'}'}\`);`,
  `  setElementText(headerRecordCount, '');\n  setElementText(document.getElementById('header-month-load-count'), \`Month: ${'${monthCompleted.length}'} completed\`);\n  setElementText(document.getElementById('header-pay-period-load-count'), \`Pay period: ${'${payPeriodRecords.filter(isCompleted).length}'} completed\`);`,
  'header monthly and pay-period totals'
);

for (const line of [
  '  setFilterOptions(reportControls.pickupState, rangeRecords.map((load) => displayState(load.pickupState)));\n',
  '  setFilterOptions(reportControls.dropoffState, rangeRecords.map((load) => displayState(load.dropoffState)));\n',
  '  setFilterOptions(reportControls.stateRoute, rangeRecords.map(getStateRoute));\n',
  '  setFilterOptions(reportControls.exactRoute, rangeRecords.map(formatRoute));\n'
]) {
  script = replaceRequired(script, line, '', 'remove unused analysis filter setup');
}

for (const line of [
  "    ${loadAnalysisTable('Pickup State Comparison', pickupRows)}\n",
  "    ${loadAnalysisTable('Drop-off State Comparison', dropoffRows)}\n",
  "    ${loadAnalysisTable('State Route Comparison', stateRouteRows)}\n",
  "    ${loadAnalysisTable('Exact Route Comparison', exactRouteRows)}\n"
]) {
  script = replaceRequired(script, line, '', 'remove confusing state and route comparison table');
}

script = replaceRequired(
  script,
  `      ['Total loads in range', result.totalLoads], ['Completed loads', result.completedLoads], ['Rejects', result.rejects],\n      ['Loads with dispatcher', result.dispatcherCount], ['Loads with pickup state', result.pickupStateCount], ['Loads with drop-off state', result.dropoffStateCount],\n      ['Loads with both states', result.completeStateCount], ['Loads with complete cycle times', result.completeCycleCount], ['Loads missing cycle times', result.totalLoads - result.completeCycleCount],`,
  `      ['Total loads in range', result.totalLoads], ['Completed loads', result.completedLoads], ['Rejects', result.rejects],\n      ['Loads with dispatcher', result.dispatcherCount], ['Loads with complete cycle times', result.completeCycleCount], ['Loads missing cycle times', result.totalLoads - result.completeCycleCount],`,
  'simplify completeness details'
);

script = replaceRequired(
  script,
  `      ['Report reliability', \`${'${reliability.label}'} — dispatcher ${'${reliability.dispatcherPercent.toFixed(1)}'}%, states ${'${reliability.statePercent.toFixed(1)}'}%, cycle time ${'${reliability.cyclePercent.toFixed(1)}'}%, exact shifts ${'${reliability.exactPercent.toFixed(1)}'}%\`]`,
  `      ['Report reliability', \`${'${reliability.label}'} — dispatcher ${'${reliability.dispatcherPercent.toFixed(1)}'}%, cycle time ${'${reliability.cyclePercent.toFixed(1)}'}%, exact shifts ${'${reliability.exactPercent.toFixed(1)}'}%\`]`,
  'remove state reliability wording'
);

script = replaceRequired(
  script,
  `  const label = dispatcherPercent >= 90 && statePercent >= 90 && cyclePercent >= 90 && exactPercent >= 90 ? 'High completeness'\n    : (dispatcherPercent >= 70 && statePercent >= 70 && cyclePercent >= 70 && exactPercent >= 50 ? 'Moderate completeness' : 'Limited completeness');`,
  `  const label = dispatcherPercent >= 90 && cyclePercent >= 90 && exactPercent >= 90 ? 'High completeness'\n    : (dispatcherPercent >= 70 && cyclePercent >= 70 && exactPercent >= 50 ? 'Moderate completeness' : 'Limited completeness');`,
  'reliability calculation without state requirement'
);
write('script.js', script);

let style = read('style.css');
if (!style.includes('/* Daily form and analysis simplification v1.8.0 */')) {
  style += `\n\n/* Daily form and analysis simplification v1.8.0 */\n.header-meta { flex-wrap: wrap; justify-content: flex-end; }\n.analysis-guide { margin: 1rem 0; padding: 1rem; border: 1px solid var(--border-color, #cbd5db); border-radius: 12px; background: rgba(255, 255, 255, 0.7); }\n.analysis-guide > strong { display: block; margin-bottom: 0.4rem; }\n.analysis-guide p { margin: 0.45rem 0; }\n.analysis-guide-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.6rem; margin: 0.75rem 0; }\n.analysis-guide-grid span { display: block; padding: 0.7rem; border-radius: 10px; background: rgba(18, 52, 59, 0.06); }\n@media (max-width: 720px) {\n  .header-meta { justify-content: flex-start; }\n  .analysis-guide-grid { grid-template-columns: 1fr; }\n}\n`;
}
write('style.css', style);

let tests = read('tests/regression.test.js');
const marker = "assert.ok(html.includes('header-month-load-count')";
if (!tests.includes(marker)) {
  tests = tests.replace(
    "console.log('Personal Load Tracker regression tests passed');",
    `assert.ok(html.includes('header-month-load-count') && html.includes('header-pay-period-load-count'), 'header shows month and pay-period completed-load totals');\nassert.ok(!html.includes('analysis-pickup-state-filter') && !html.includes('analysis-dropoff-state-filter') && !html.includes('analysis-state-route-filter') && !html.includes('analysis-exact-route-filter'), 'confusing state and route analysis filters are removed');\nassert.ok(html.includes('How to use this analysis'), 'dispatch and earnings analysis includes plain-language instructions');\nassert.ok(script.includes('const payPeriodRange = getCompanyPayPeriodRange(date)') && script.includes('const nextFromCount = periodLoads.length + 1'), 'new load numbering follows pay-period progression');\nassert.ok(script.includes('Started a clean load form for today. The previous-day draft was cleared.'), 'previous-day load drafts do not reopen automatically');\n\nconsole.log('Personal Load Tracker regression tests passed');`
  );
}
write('tests/regression.test.js', tests);

let readme = read('README.md');
if (!readme.includes('## Daily Form and Load Numbering')) {
  readme += `\n\n## Daily Form and Load Numbering\n\n- The Add Load form starts clean when a saved unfinished draft belongs to a previous date. Saved load records are not deleted.\n- New load numbers continue across the selected company pay period. The calculation uses both the number of saved pay-period records and the highest saved numeric load number so older daily-reset records do not restart the sequence.\n- The header shows completed-load totals for the selected month and selected-date pay period.\n- Dispatch and Earnings Analysis keeps the dispatcher filter while removing the pickup-state, drop-off-state, state-route, and exact-route filters from the screen. The underlying saved fields remain compatible with existing records and backups.\n`;
}
write('README.md', readme);

console.log('Applied daily form and analysis simplification patch.');
