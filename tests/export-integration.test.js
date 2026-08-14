const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const integrationSource = fs.readFileSync(path.resolve(__dirname, '..', 'export-integration.js'), 'utf8');

function createButton(id) {
  return {
    id,
    dataset: {},
    listeners: {},
    cloneNode() {
      return createButton(this.id);
    },
    addEventListener(type, handler) {
      this.listeners[type] = handler;
    },
    replaceWith(replacement) {
      buttons.set(this.id, replacement);
    }
  };
}

const buttons = new Map([
  ['download-log-button', createButton('download-log-button')],
  ['download-earnings-button', createButton('download-earnings-button')],
  ['download-log-excel-button', createButton('download-log-excel-button')],
  ['download-earnings-excel-button', createButton('download-earnings-excel-button')]
]);
const links = [];
const revoked = [];
const snapshot = Object.freeze({ data: Object.freeze({ loads: Object.freeze([]), dailySummaries: Object.freeze({}) }) });
let loadBuildCount = 0;
let earningsBuildCount = 0;
const professionalDownloads = [];

const context = {
  console,
  setTimeout: (fn) => fn(),
  Date,
  Blob: function Blob(parts, options) {
    this.parts = parts;
    this.options = options;
  },
  URL: {
    createObjectURL(blob) {
      context.lastBlob = blob;
      return 'blob:clean-export';
    },
    revokeObjectURL(url) {
      revoked.push(url);
    }
  },
  document: {
    getElementById(id) {
      return buttons.get(id) || null;
    },
    createElement(tag) {
      assert.strictEqual(tag, 'a');
      const link = {
        href: '',
        download: '',
        clicked: false,
        click() { this.clicked = true; },
        remove() {}
      };
      links.push(link);
      return link;
    },
    body: { appendChild() {} }
  },
  getTrackerSnapshot() {
    return snapshot;
  },
  LoadTrackerExportCleanup: {
    buildCleanLoadExport(received) {
      assert.strictEqual(received, snapshot);
      loadBuildCount += 1;
      return { csv: '\ufeff"Date"\r\n"2026-08-13"' };
    },
    buildCleanDailyEarningsExport(received) {
      assert.strictEqual(received, snapshot);
      earningsBuildCount += 1;
      return { csv: '\ufeff"Date"\r\n"2026-08-13"' };
    }
  },
  LoadTrackerProfessionalExport: {
    downloadProfessionalWorkbook(kind, result, date) {
      professionalDownloads.push({ kind, result, date });
      return Promise.resolve(`${kind}-${date}.xlsx`);
    }
  },
  globalThis: null
};
context.globalThis = context;

vm.createContext(context);
vm.runInContext(integrationSource, context, { filename: 'export-integration.js' });

const wiredLoadButton = buttons.get('download-log-button');
const wiredEarningsButton = buttons.get('download-earnings-button');
const wiredLoadExcelButton = buttons.get('download-log-excel-button');
const wiredEarningsExcelButton = buttons.get('download-earnings-excel-button');
assert.strictEqual(wiredLoadButton.dataset.cleanExportWired, 'true', 'load CSV button is replaced with clean-export button');
assert.strictEqual(wiredEarningsButton.dataset.cleanExportWired, 'true', 'earnings CSV button is replaced with clean-export button');
assert.strictEqual(wiredLoadExcelButton.dataset.professionalExportWired, 'true', 'load Excel button is wired permanently');
assert.strictEqual(wiredEarningsExcelButton.dataset.professionalExportWired, 'true', 'earnings Excel button is wired permanently');

wiredLoadButton.listeners.click();
assert.strictEqual(loadBuildCount, 1, 'load export uses clean export engine');
assert.strictEqual(links.at(-1).clicked, true, 'load export triggers a browser download');
assert.match(links.at(-1).download, /^personal-oilfield-load-log-\d{4}-\d{2}-\d{2}\.csv$/);
assert.strictEqual(context.lastBlob.options.type, 'text/csv;charset=utf-8');

wiredEarningsButton.listeners.click();
assert.strictEqual(earningsBuildCount, 1, 'daily earnings export uses clean export engine');
assert.strictEqual(links.at(-1).clicked, true, 'earnings export triggers a browser download');
assert.match(links.at(-1).download, /^personal-oilfield-daily-earnings-\d{4}-\d{2}-\d{2}\.csv$/);
assert.deepStrictEqual(revoked, ['blob:clean-export', 'blob:clean-export'], 'temporary download URLs are revoked');

wiredLoadExcelButton.listeners.click();
wiredEarningsExcelButton.listeners.click();
assert.deepStrictEqual(professionalDownloads.map((download) => download.kind), ['loads', 'earnings'], 'both professional Excel exports use the clean export rows');
assert.ok(professionalDownloads.every((download) => /^\d{4}-\d{2}-\d{2}$/.test(download.date)), 'professional workbook filenames receive the local date');

const missingButtonContext = {
  console,
  setTimeout,
  Date,
  Blob: context.Blob,
  URL: context.URL,
  document: {
    getElementById() { return null; },
    createElement: context.document.createElement,
    body: context.document.body
  },
  globalThis: null
};
missingButtonContext.globalThis = missingButtonContext;
vm.createContext(missingButtonContext);
assert.doesNotThrow(
  () => vm.runInContext(integrationSource, missingButtonContext, { filename: 'export-integration.js' }),
  'integration layer is harmless when export buttons are absent'
);

console.log('Clean export integration tests passed.');
