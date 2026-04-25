# VentureScope Academic Sync (Chrome Extension)

Sync ASTU e-Student transcript data to the VentureScope backend using a Chrome Extension (Manifest V3).

This extension uses:
- **React (Vite)** for the popup UI
- **MV3 Service Worker** (`background.js`) for notifications/settings bootstrap
- **Content script** (`content.js`) for transcript scraping

---

## Requirements

- Node.js + npm
- Google Chrome (or any Chromium-based browser that supports MV3)

---

## How to run (development)

### 1) Install dependencies

Run from the repo root:

```bash
cd chrome-extension
npm install
```

### 2) Build the extension

```bash
cd chrome-extension
npm run build
```

This produces a loadable build at:

- `chrome-extension/dist/`

### 3) Load unpacked in Chrome

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select: `chrome-extension/dist`

### 4) Use it

1. Click the extension icon (opens the popup)
2. Sign in with your VentureScope credentials
3. Navigate to the ASTU e-Student portal transcript page
4. Click **Sync Academic Data**
5. Review the payload, accept consent, and continue

---

## Scripts

Run from `chrome-extension/`:

- **Dev server (popup UI only)**: `npm run dev`
- **Build extension**: `npm run build`
- **Preview built UI**: `npm run preview`

Note: MV3 extensions must be loaded from a folder. The dev server is useful for fast UI iteration, but Chrome must load the unpacked extension from `chrome-extension/dist/` after a build.

---

## Project layout

Source:

- `chrome-extension/popup.html`: Vite entry HTML (React mounts into `#root`)
- `chrome-extension/src/popup/main.tsx`: React bootstrap + legacy init
- `chrome-extension/src/popup/popup-shell.tsx`: React popup markup (IDs preserved)
- `chrome-extension/src/popup/popup-legacy.js`: existing popup logic (session, sync, API calls)
- `chrome-extension/public/manifest.json`: MV3 manifest copied into build output
- `chrome-extension/public/background.js`: MV3 service worker copied into build output
- `chrome-extension/public/content.js`: content script copied into build output
- `chrome-extension/public/icons/*`: extension icons

Build output (load this in Chrome):

- `chrome-extension/dist/`

---

## How “current functionality” is preserved

The original popup logic relied on querying elements by ID and attaching DOM listeners.

In the refactor:
- React renders the same DOM structure (same IDs/classes).
- The existing logic is executed afterwards via `initPopup()` from `popup-legacy.js`.

This keeps behavior intact while making the popup UI a React project.

---

## Troubleshooting

### “Load unpacked” fails / extension looks blank

- Confirm you selected `chrome-extension/dist` (not `chrome-extension/`).
- Rebuild:

```bash
cd chrome-extension
npm run build
```

### Sync button errors like “Open ASTU e-Student Academic History page”

- Make sure the active tab is on `estudent.astu.edu.et` and the transcript/history page is open.

### Content script messaging issues

- In `chrome://extensions/` → your extension → **Inspect views**
  - Check the **Service Worker** console for background errors
  - Check the **active tab** console for content script errors

### Backend/API issues

- Login and transcript APIs are defined in `chrome-extension/src/popup/popup-legacy.js`.
- Verify the backend is reachable and CORS/authorization are correct.

---

## Production notes (release checklist)

- Bump version in `chrome-extension/public/manifest.json`
- Run:

```bash
cd chrome-extension
npm run build
```

- Zip the contents of `chrome-extension/dist/` for distribution
- Validate in Chrome:
  - Install from `dist/`
  - Login works
  - Sync flow works (scrape → review → consent → upload → notification)

