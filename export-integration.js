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

  function buildExport(kind) {
    const cleanup = root.LoadTrackerExportCleanup;
    const snapshotBuilder = root.getTrackerSnapshot;
    if (!cleanup || typeof snapshotBuilder !== 'function') return null;

    const snapshot = snapshotBuilder();
    return kind === 'loads'
      ? cleanup.buildCleanLoadExport(snapshot)
      : cleanup.buildCleanDailyEarningsExport(snapshot);
  }

  function runExport(kind) {
    const result = buildExport(kind);
    if (!result) return false;
    const date = localDateStamp();
    const filename = kind === 'loads'
      ? `personal-oilfield-load-log-${date}.csv`
      : `personal-oilfield-daily-earnings-${date}.csv`;

    downloadText(filename, result.csv);
    return true;
  }

  async function runProfessionalExport(kind) {
    const professional = root.LoadTrackerProfessionalExport;
    const result = buildExport(kind);
    if (!professional || !result) return false;
    await professional.downloadProfessionalWorkbook(kind, result, localDateStamp());
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

  function wireProfessionalButton(id, kind) {
    const button = document.getElementById(id);
    if (!button || button.dataset.professionalExportWired === 'true') return;
    button.dataset.professionalExportWired = 'true';
    button.addEventListener('click', async function () {
      button.disabled = true;
      try {
        await runProfessionalExport(kind);
      } finally {
        button.disabled = false;
      }
    });
  }

  wireProfessionalButton('download-log-excel-button', 'loads');
  wireProfessionalButton('download-earnings-excel-button', 'earnings');

  root.LoadTrackerExportIntegration = { runExport, runProfessionalExport };
}(typeof globalThis !== 'undefined' ? globalThis : this));
