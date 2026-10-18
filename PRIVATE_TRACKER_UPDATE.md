# Private tracker entry point

The GitHub Pages address now opens a small handoff to the owner-private tracker at https://oilfield-redesign-preview.arrondkirkwood.chatgpt.site. The private tracker supplies sign-in, device storage, queued cloud saves, off days, pay-period review, timesheets, and earnings exports. New tracking should happen there.

The first visit asks the driver to open the private tracker. The selected automatic-open preference is saved only after that explicit click. Subsequent visits open the private tracker automatically while online if the original device records have not changed and there is no unfinished original-app draft. Changed records, drafts, offline mode, blocked storage, or `?recovery=1` keep the handoff visible. This is a launcher preference; no load, day, paid-work, draft, Firebase, or IndexedDB record is written or removed by it.

The recovery controls can download an original-device JSON backup. It includes the usual backup data and raw app storage for recovery, excluding Firebase authentication storage. Original-app data is not automatically transferred or merged. Import a newer backup under More in the private tracker if needed. Entries created only in the original Firebase account must be exported from the original app while signed in.

`legacy.html` is the exact original index from commit `a93dc073b43b76e6def9e89674aa5da8c235b3a8`; its original scripts, forms, storage keys, Firebase integration, and exports remain available. The pre-update commit remains in Git history. The handoff does not expose the private tracker's records; Sites still enforces private access.

The updated service worker uses a distinct cache prefix, precaches the handoff and original recovery page, and prefers its own cache during offline fallback. It keeps earlier original-app caches and never clears browser records or IndexedDB.

`node tests/private-tracker-entry.test.js` verifies first visit, remembered entry, changed records, drafts, offline/blocked storage, recovery links, backup preservation, and worker cache behavior. The existing form and export tests read `legacy.html` so the preserved original app remains covered. The core regression entry also runs the handoff tests. The stale release assertion was aligned with the existing 1.24.7 source; the original app code was not changed.
