(function (root) {
  'use strict';

  function localDateStamp() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  }

  function downloadText(filename, text) {
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function runExport(kind) {
    const cleanup = root.LoadTrackerExportCleanup;
    const snapshotBuilder = root.getTrackerSnapshot;
    if (!cleanup || typeof snapshotBuilder !== 'function') return false;

    const snapshot = snapshotBuilder();
    const date = localDateStamp();
    const result = kind === 'loads'
      ? cleanup.buildCleanLoadExport(snapshot)
      : cleanup.buildCleanDailyEarningsExport(snapshot);
    const filename = kind === 'loads'
      ? `personal-oilfield-load-log-${date}.csv`
      : `personal-oilfield-daily-earnings-${date}.csv`;

    downloadText(filename, result.csv);
    return true;
  }

  function replaceExportButton(id, kind) {
    const button = document.getElementById(id);
    if (!button || button.dataset.cleanExportWired === 'true') return;

    const replacement = button.cloneNode(true);
    replacement.dataset.cleanExportWired = 'true';
    replacement.addEventListener('click', function () {
      runExport(kind);
    });
    button.replaceWith(replacement);
  }

  replaceExportButton('download-log-button', 'loads');
  replaceExportButton('download-earnings-button', 'earnings');

  root.LoadTrackerExportIntegration = { runExport };
}(typeof globalThis !== 'undefined' ? globalThis : this));
