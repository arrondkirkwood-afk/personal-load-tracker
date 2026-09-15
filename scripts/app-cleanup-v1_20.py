from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, found {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1))


def replace_all(path, old, new, minimum=1):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count < minimum:
        raise SystemExit(f'{path}: expected at least {minimum} matches, found {count}: {old!r}')
    p.write_text(text.replace(old, new))


# Application version and explicit asset loading.
replace_once('script.js', 'const APP_VERSION = "1.19.1";', 'const APP_VERSION = "1.20.0";')
replace_all('index.html', '1.19.1', '1.20.0', minimum=8)
replace_all('manifest.json', '1.19.1', '1.20.0', minimum=1)
replace_all('README.md', '1.19.1', '1.20.0', minimum=1)
replace_all('repair.html', '1.19.0', '1.20.0', minimum=2)

replace_once(
    'index.html',
    '''  <link rel="stylesheet" href="style.css?v=1.20.0">\n  <link rel="stylesheet" href="timesheet.css?v=1.20.0">''',
    '''  <link rel="stylesheet" href="style.css?v=1.20.0">\n  <link rel="stylesheet" href="redesign.css?v=1.20.0">\n  <link rel="stylesheet" href="records-reports-redesign.css?v=1.20.0">\n  <link rel="stylesheet" href="settings-redesign.css?v=1.20.0">\n  <link rel="stylesheet" href="workbook-builder.css?v=1.20.0">\n  <link rel="stylesheet" href="timesheet.css?v=1.20.0">\n  <link rel="stylesheet" href="app-enhancements.css?v=1.20.0">'''
)

# Five-item navigation with reporting tools grouped under Reports.
replace_once(
    'index.html',
    '''        <button class="nav-item" type="button" data-view-target="reports">Earnings</button>\n        <button class="nav-item" type="button" data-view-target="workbook">Workbook</button>\n        <button class="nav-item" type="button" data-view-target="settings">More</button>''',
    '''        <button class="nav-item" type="button" data-view-target="reports">Reports</button>\n        <button class="nav-item" type="button" data-view-target="settings">More</button>'''
)
replace_all('index.html', '<span>Total loads</span><strong id="pay-period-assignment-count">', '<span>Total records</span><strong id="pay-period-assignment-count">', minimum=1)
replace_all('index.html', '<span>Total loads</span><strong id="month-assignment-count">', '<span>Total records</span><strong id="month-assignment-count">', minimum=1)

# Daily closeout check.
replace_once(
    'index.html',
    '''            <p class="helper-text">Times are manually entered and remain editable. This tracker is not an ELD or official HOS record.</p>\n          </section>\n          <section class="panel summary-card" aria-labelledby="daily-summary-title">''',
    '''            <p class="helper-text">Times are manually entered and remain editable. This tracker is not an ELD or official HOS record.</p>\n          </section>\n          <section class="panel summary-card daily-closeout-card" id="daily-closeout-panel" aria-labelledby="daily-closeout-title">\n            <div class="section-heading compact">\n              <div><p class="section-kicker">Daily Closeout</p><h2 id="daily-closeout-title">Check the day before the timesheet</h2></div>\n              <span class="status-pill" id="daily-closeout-status" data-state="neutral">No activity</span>\n            </div>\n            <div class="metric-strip tight">\n              <article><span>Completed loads</span><strong id="daily-closeout-completed">0</strong></article>\n              <article><span>Rejects</span><strong id="daily-closeout-rejects">0</strong></article>\n              <article><span>Per diem</span><strong id="daily-closeout-per-diem">No</strong></article>\n              <article><span>Hourly work</span><strong id="daily-closeout-hourly">0.00 hr</strong></article>\n              <article><span>Paid wait</span><strong id="daily-closeout-wait">0.00 hr</strong></article>\n              <article><span>Shift</span><strong id="daily-closeout-shift">Incomplete</strong></article>\n            </div>\n            <p class="daily-closeout-summary" id="daily-closeout-summary">No saved activity for this date.</p>\n            <div class="button-row compact"><button class="button secondary" id="daily-closeout-review-button" type="button">Review Workday</button></div>\n          </section>\n          <section class="panel summary-card" aria-labelledby="daily-summary-title">'''
)

# Reports shortcuts.
replace_once(
    'index.html',
    '''          </div>\n          <div class="report-controls">\n            <label for="report-range-mode">''',
    '''          </div>\n          <div class="report-shortcuts" aria-label="Report tools">\n            <a class="button secondary" href="#timesheet-title">Timesheet</a>\n            <button class="button secondary" type="button" data-view-target="workbook">Complete Workbook</button>\n            <a class="button secondary" href="#paycheck-reconciliation-title">Paycheck Check</a>\n          </div>\n          <div class="report-controls">\n            <label for="report-range-mode">'''
)

# Paycheck reconciliation panel.
replace_once(
    'index.html',
    '''        </section>\n\n        <section class="panel earnings-review" aria-labelledby="earnings-review-title">''',
    '''        </section>\n\n        <section class="panel paycheck-reconciliation" aria-labelledby="paycheck-reconciliation-title">\n          <div class="section-heading">\n            <div><p class="section-kicker">Payroll Verification</p><h2 id="paycheck-reconciliation-title">Paycheck reconciliation</h2></div>\n            <span class="status-pill">Personal check</span>\n          </div>\n          <p class="helper-text">Compares the gross earnings estimated from your saved tracker records with the gross pay shown on your paycheck. It does not change source records.</p>\n          <div class="report-controls">\n            <label for="reconcile-anchor-date"><span>Pay period containing</span><input id="reconcile-anchor-date" type="date"></label>\n            <label for="reconcile-period-start"><span>Beginning date</span><input id="reconcile-period-start" type="date" readonly></label>\n            <label for="reconcile-period-end"><span>Ending date</span><input id="reconcile-period-end" type="date" readonly></label>\n            <label for="reconcile-paycheck-gross"><span>Paycheck gross pay</span><input id="reconcile-paycheck-gross" type="number" inputmode="decimal" min="0" step="0.01" placeholder="0.00"></label>\n          </div>\n          <div class="reconciliation-grid">\n            <article><span>Tracker expected gross</span><strong id="reconcile-expected">$0.00</strong></article>\n            <article><span>Difference</span><strong id="reconcile-difference">Enter paycheck gross</strong></article>\n            <article><span>Completed-load pay</span><strong id="reconcile-completed-pay">$0.00</strong></article>\n            <article><span>Reject pay</span><strong id="reconcile-reject-pay">$0.00</strong></article>\n            <article><span>Wait pay</span><strong id="reconcile-wait-pay">$0.00</strong></article>\n            <article><span>Hourly/office/additional pay</span><strong id="reconcile-hourly-pay">$0.00</strong></article>\n            <article><span>Vacation pay</span><strong id="reconcile-vacation-pay">$0.00</strong></article>\n            <article><span>Per diem</span><strong id="reconcile-per-diem-pay">$0.00</strong></article>\n            <article><span>Sleeper + trainer</span><strong id="reconcile-other-addons">$0.00</strong></article>\n          </div>\n          <p class="reconciliation-status" id="reconcile-status" data-state="neutral">Enter paycheck gross to compare.</p>\n        </section>\n\n        <section class="panel earnings-review" aria-labelledby="earnings-review-title">'''
)

# Back button from the workbook, which is now reached through Reports.
replace_once(
    'index.html',
    '''          <p class="workbook-intro">Choose the period you want to study. The tracker will create one presentation-ready Excel workbook from the records already saved in this app.</p>''',
    '''          <div class="button-row compact"><button class="button ghost" type="button" data-view-target="reports">Back to Reports</button></div>\n          <p class="workbook-intro">Choose the period you want to study. The tracker will create one presentation-ready Excel workbook from the records already saved in this app.</p>'''
)

# Load all CSS/JS normally instead of service-worker concatenation.
replace_once(
    'index.html',
    '''  <script src="vendor/exceljs.min.js?v=1.20.0"></script>\n  <script src="script.js?v=1.20.0"></script>\n  <script src="timesheet.js?v=1.20.0"></script>''',
    '''  <script src="vendor/exceljs.min.js?v=1.20.0"></script>\n  <script src="script.js?v=1.20.0"></script>\n  <script src="export-cleanup.js?v=1.20.0"></script>\n  <script src="professional-export.js?v=1.20.0"></script>\n  <script src="complete-workbook-export.js?v=1.20.0"></script>\n  <script src="export-integration.js?v=1.20.0"></script>\n  <script src="timesheet.js?v=1.20.0"></script>\n  <script src="daily-closeout.js?v=1.20.0"></script>\n  <script src="paycheck-reconciliation.js?v=1.20.0"></script>'''
)

# Timesheet: only explicit completed statuses count as hauled, unknown statuses are flagged,
# and paid-wait rows do not require clock-in/out values when only saved paid minutes exist.
replace_once(
    'timesheet.js',
    '''  function isReject(load) {\n    const status = clean(load?.loadStatus || load?.status || load?.load_status).toLowerCase();\n    return status === 'reject' || status === 'rejected';\n  }\n  function rowWarnings(row) {\n    const warnings = [];\n    if (!row.date) warnings.push('date');\n    if (row.hourly && (!row.timeIn || !row.timeOut)) warnings.push('time in/out');\n    return warnings;\n  }''',
    '''  function loadStatus(load) { return clean(load?.loadStatus || load?.status || load?.load_status).toLowerCase(); }\n  function isCompleted(load) { const status = loadStatus(load); return status === 'completed load' || status === 'completed'; }\n  function isReject(load) { const status = loadStatus(load); return status === 'reject' || status === 'rejected'; }\n  function rowWarnings(row) {\n    const warnings = [];\n    if (!row.date) warnings.push('date');\n    if (row.hourly && row.requiresClockTimes !== false && (!row.timeIn || !row.timeOut)) warnings.push('time in/out');\n    if (number(row.needsReview) > 0) warnings.push('load status');\n    return warnings;\n  }'''
)
replace_once(
    'timesheet.js',
    '''  function haulingDescription(completedCount, rejectCount, perDiem) {\n    const parts = [];\n    if (completedCount > 0) parts.push(`${completedCount} ${completedCount === 1 ? 'Load' : 'Loads'}`);\n    if (rejectCount > 0) parts.push(`${rejectCount} ${rejectCount === 1 ? 'Reject' : 'Rejects'}`);\n    if (perDiem) parts.push('Per Diem');\n    return parts.join(' / ') || 'Workday';\n  }''',
    '''  function haulingDescription(completedCount, rejectCount, needsReviewCount, perDiem) {\n    const parts = [];\n    if (completedCount > 0) parts.push(`${completedCount} ${completedCount === 1 ? 'Load' : 'Loads'}`);\n    if (rejectCount > 0) parts.push(`${rejectCount} ${rejectCount === 1 ? 'Reject' : 'Rejects'}`);\n    if (needsReviewCount > 0) parts.push(`${needsReviewCount} Needs Review`);\n    if (perDiem) parts.push('Per Diem');\n    return parts.join(' / ') || 'Workday';\n  }'''
)
replace_once(
    'timesheet.js',
    '''      const completedLoads = dayRecords.filter((load) => !isReject(load));\n      const rejectedLoads = dayRecords.filter((load) => isReject(load));\n      const completedCount = completedLoads.length;\n      const rejectCount = rejectedLoads.length;''',
    '''      const completedLoads = dayRecords.filter((load) => isCompleted(load));\n      const rejectedLoads = dayRecords.filter((load) => isReject(load));\n      const reviewLoads = dayRecords.filter((load) => !isCompleted(load) && !isReject(load));\n      const completedCount = completedLoads.length;\n      const rejectCount = rejectedLoads.length;\n      const needsReviewCount = reviewLoads.length;'''
)
replace_once(
    'timesheet.js',
    '''        date: shortDate(date), job: haulingDescription(completedCount, rejectCount, perDiem),\n        loads: completedCount ? String(completedCount) : '',\n        rejects: rejectCount ? String(rejectCount) : '',\n        perDiem: perDiem ? 'Yes' : ''\n      }));''',
    '''        date: shortDate(date), job: haulingDescription(completedCount, rejectCount, needsReviewCount, perDiem),\n        loads: completedCount ? String(completedCount) : '',\n        rejects: rejectCount ? String(rejectCount) : '',\n        needsReview: needsReviewCount,\n        perDiem: perDiem ? 'Yes' : ''\n      }));'''
)
replace_once(
    'timesheet.js',
    '''          kind: 'wait', hourly: true, workDate: date, sourceId: load.id, date: shortDate(date),\n          job: 'Paid Wait Time', hours: hours(paidWait)''',
    '''          kind: 'wait', hourly: true, requiresClockTimes: false, workDate: date, sourceId: load.id, date: shortDate(date),\n          job: 'Paid Wait Time', hours: hours(paidWait)'''
)
replace_once(
    'timesheet.js',
    '''      ? previewRows.map((row, rowIndex) => `<tr class="${row.warnings.length ? 'has-warning' : ''}">${COLUMNS.map((key) => `<td contenteditable="true" data-row="${rowIndex}" data-field="${key}">${escapeHtml(row[key] || '')}</td>`).join('')}</tr>`).join('')''',
    '''      ? previewRows.map((row, rowIndex) => `<tr class="${row.warnings.length ? 'has-warning' : ''}">${COLUMNS.map((key, columnIndex) => `<td contenteditable="true" data-label="${escapeHtml(COLUMN_LABELS[columnIndex])}" data-row="${rowIndex}" data-field="${key}">${escapeHtml(row[key] || '')}</td>`).join('')}</tr>`).join('')'''
)

# Tests: unknown load status cannot silently count as hauled.
replace_once(
    'tests/timesheet.test.js',
    '''  { id: 'l3', loadDate: '2026-09-10', loadStatus: 'Completed Load', ticketNumber: '', pickupLocation: '', dropoffLocation: '' }\n];''',
    '''  { id: 'l3', loadDate: '2026-09-10', loadStatus: 'Completed Load', ticketNumber: '', pickupLocation: '', dropoffLocation: '' },\n  { id: 'u1', loadDate: '2026-09-10', loadStatus: '', ticketNumber: 'UNKNOWN' }\n];'''
)
replace_once(
    'tests/timesheet.test.js',
    '''assert.ok(rows.some((row) => row.job === '2 Loads / Per Diem' && row.loads === '2' && row.rejects === '' && row.perDiem === 'Yes'), 'ordinary hauling day is summarized into one load/per-diem row');''',
    '''assert.ok(rows.some((row) => row.job === '2 Loads / Per Diem' && row.loads === '2' && row.rejects === '' && row.perDiem === 'Yes'), 'ordinary hauling day is summarized into one load/per-diem row');\nconst sept10 = rows.find((row) => row.kind === 'load' && row.workDate === '2026-09-10');\nassert.strictEqual(sept10.loads, '1', 'unknown load status does not count as hauled');\nassert.ok(sept10.job.includes('1 Needs Review'), 'unknown load status is visibly flagged for review');\nassert.ok(sept10.warnings.includes('load status'), 'unknown load status creates a timesheet warning');'''
)
replace_once(
    'tests/timesheet.test.js',
    '''assert.ok(rows.some((row) => row.job === 'Paid Wait Time' && row.hours === '1.50'), 'already-calculated paid wait is reused');''',
    '''assert.ok(rows.some((row) => row.job === 'Paid Wait Time' && row.hours === '1.50'), 'already-calculated paid wait is reused');\nassert.ok(!rows.find((row) => row.job === 'Paid Wait Time').warnings.includes('time in/out'), 'paid wait minutes do not create a false missing clock-time warning');'''
)
replace_once(
    'tests/timesheet.test.js',
    '''assert.ok(timesheetSource.includes("['date', 'job', 'loads', 'rejects', 'perDiem', 'timeIn', 'timeOut', 'hours']"), 'preview/PDF use organized load and reject timesheet columns');''',
    '''assert.ok(timesheetSource.includes("['date', 'job', 'loads', 'rejects', 'perDiem', 'timeIn', 'timeOut', 'hours']"), 'preview/PDF use organized load and reject timesheet columns');\nassert.ok(timesheetSource.includes('data-label='), 'mobile timesheet preview includes field labels for card layout');'''
)

# Regression/navigation/version expectations.
replace_once('tests/regression.test.js', "assert.ok(repairHtml.includes('index.html?v=1.19.0'), 'repair page opens the current version');", "assert.ok(repairHtml.includes('index.html?v=1.20.0'), 'repair page opens the current version');")
replace_once('tests/regression.test.js', "assert.strictEqual(appVersionMatch[1], '1.19.1', 'app version is updated');", "assert.strictEqual(appVersionMatch[1], '1.20.0', 'app version is updated');")
replace_once(
    'tests/regression.test.js',
    '''  && html.includes('data-view-target="reports">Earnings</button>')\n  && html.includes('data-view-target="workbook">Workbook</button>')\n  && html.includes('data-view-target="settings">More</button>'), 'navigation uses Today, Load, History, Earnings, Workbook, and More');''',
    '''  && html.includes('data-view-target="reports">Reports</button>')\n  && !html.includes('class="nav-item" type="button" data-view-target="workbook"')\n  && html.includes('data-view-target="settings">More</button>'), 'navigation uses five primary items with workbook grouped under Reports');'''
)
replace_once(
    'tests/regression.test.js',
    '''assert.ok(serviceWorker.includes("'./complete-workbook-export.js'")\n  && serviceWorker.includes("'./workbook-builder.css'"), 'complete workbook files remain available offline');''',
    '''assert.ok(serviceWorker.includes("'./complete-workbook-export.js'")\n  && serviceWorker.includes("'./workbook-builder.css'"), 'complete workbook files remain available offline');\nassert.ok(html.includes('id="daily-closeout-panel"') && html.includes('id="paycheck-reconciliation-title"'), 'daily closeout and paycheck reconciliation are available');\nassert.ok(html.includes(`export-cleanup.js?v=${appVersionMatch[1]}`) && html.includes(`complete-workbook-export.js?v=${appVersionMatch[1]}`), 'export modules load explicitly in the page');'''
)

# Redesign guardrail now verifies normal asset loading rather than service-worker concatenation.
replace_once(
    'tests/redesign-contract.test.js',
    '''assert.ok(serviceWorker.includes("'./redesign.css'"), 'service worker no longer caches the primary redesign stylesheet');\nassert.ok(serviceWorker.includes("'./records-reports-redesign.css'"), 'service worker no longer caches the History/Earnings redesign stylesheet');\nassert.ok(serviceWorker.includes("'./settings-redesign.css'"), 'service worker no longer caches the Settings redesign stylesheet');\nassert.ok(serviceWorker.includes('buildRedesignedStylesheet'), 'service worker no longer layers redesign styles over style.css');''',
    '''assert.ok(serviceWorker.includes("'./redesign.css'"), 'service worker caches the primary redesign stylesheet');\nassert.ok(serviceWorker.includes("'./records-reports-redesign.css'"), 'service worker caches the History/Reports redesign stylesheet');\nassert.ok(serviceWorker.includes("'./settings-redesign.css'"), 'service worker caches the Settings redesign stylesheet');\nassert.ok(html.includes('redesign.css?v=') && html.includes('records-reports-redesign.css?v=') && html.includes('settings-redesign.css?v='), 'redesign styles load directly from HTML');\nassert.ok(!serviceWorker.includes('buildRedesignedStylesheet') && !serviceWorker.includes('buildEnhancedScript'), 'service worker no longer concatenates CSS or JavaScript at runtime');'''
)

# CI now validates the exact report/export surfaces that have caused regressions before.
Path('.github/workflows/ci.yml').write_text('''name: Personal Load Tracker CI\n\non:\n  push:\n    branches:\n      - main\n      - agent/load-tracker-ui-redesign\n  pull_request:\n\njobs:\n  regression:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Check out repository\n        uses: actions/checkout@v4\n\n      - name: Set up Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: '20'\n\n      - name: Check JavaScript syntax\n        run: |\n          node --check script.js\n          node --check timesheet.js\n          node --check daily-closeout.js\n          node --check paycheck-reconciliation.js\n          node --check export-cleanup.js\n          node --check professional-export.js\n          node --check complete-workbook-export.js\n          node --check export-integration.js\n\n      - name: Run core regression tests\n        run: node tests/regression.test.js\n\n      - name: Run redesign contract guardrails\n        run: node tests/redesign-contract.test.js\n\n      - name: Run timesheet tests\n        run: node tests/timesheet.test.js\n\n      - name: Run clean export tests\n        run: node tests/export-cleanup.test.js\n\n      - name: Run export integration tests\n        run: node tests/export-integration.test.js\n\n      - name: Run professional Excel export tests\n        run: node tests/professional-export.test.js\n\n      - name: Run complete workbook tests\n        run: node tests/complete-workbook-export.test.js\n''')
