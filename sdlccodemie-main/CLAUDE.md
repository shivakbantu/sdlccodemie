# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

Two independent projects live side by side; they share nothing at runtime.

- `hotel-app/` — "StayFinder", a frontend-only hotel browsing and simulated-booking demo (vanilla JS, no bundler, no backend). This is where the real code and the only test suite are.
- `deploy/` — a minimal Flask scaffold (`deploy/app/app.py`) with Docker and local run scripts. Treat it as a stub, not a working service (see "Known issues").
- `plan.md` — a sprint-based delivery roadmap (Jira/Confluence/CI planning), not technical documentation. `.wflow/execution_status.json` is SDLC-workflow checkpoint state; don't hand-edit it.
- `.venv/`, `.idea/` are local tooling and should be ignored.

## hotel-app

Run everything from `hotel-app/`. Node >= 18.

```bash
npm install
npm start                 # python -m http.server 8080 (or just open index.html via file://)
npm run typecheck         # tsc --noEmit; type-checks the tests and the .d.ts files, NOT the .js sources
npm test                  # all Playwright projects
npm run test:unit         # unit project only (no browser)
npm run test:e2e          # e2e-desktop + e2e-mobile
npm run test:headed       # e2e-desktop in a visible browser
npm run report            # open the last HTML report
```

Run a single test file or test by name:

```bash
npx playwright test --project=unit tests/unit/logic.spec.ts
npx playwright test --project=unit -g "formatCurrency"
npx playwright test --project=e2e-desktop tests/e2e/browse.spec.ts
```

E2E tests default to the locally installed Microsoft Edge (`channel: 'msedge'`) so no browser download is needed. Override with `PW_CHANNEL=chrome` or `PW_CHANNEL=chromium` (after `npx playwright install chromium`). There is no linter configured.

### Architecture

There is no build step: `index.html` loads five plain scripts in a fixed order, and **order matters** because each depends on the previous globals:

`data.js` → `logic.js` → `views.js` → `confetti.js` → `app.js`

- `data.js` (`window.HotelData`) — hotel/room fixtures and constants like `PRICE_RANGE`.
- `logic.js` (`window.HotelLogic`) — pure functions: filtering/sorting, date and price math, validation, booking-state transitions, `escapeHtml`/`formatCurrency`.
- `views.js` (`window.HotelViews`) — pure functions that take data and return HTML strings (no DOM access).
- `confetti.js` — success-screen animation.
- `app.js` — the only file that touches the DOM. A single IIFE owning one `state` object, hash-based routing (`#/`, `#/hotel/:id`, `#/book`, driven by `hashchange` in `route()`), event delegation, toasts, and the modal. It re-renders by assigning `innerHTML` from `HotelViews`. Payment is simulated (`PROCESSING_MS` delay); nothing is persisted or sent anywhere.

Each module except `app.js` is a UMD wrapper (`module.exports` under Node, `root.HotelX` in the browser). That dual shape is what lets the unit tests `import` the same files the browser loads. Keep new modules in this style, and keep logic/views free of DOM and global-state access so they stay unit-testable.

Because the sources are plain `.js`, TypeScript sees them through hand-written declaration files (`js/data.d.ts`, `logic.d.ts`, `views.d.ts`, `confetti.d.ts`). When you add or change an exported function or data shape, update the matching `.d.ts` or `npm run typecheck` (and the tests) will fail.

All user-supplied text interpolated into HTML must go through `L.escapeHtml` (views and modals build HTML by string concatenation).

### Tests

- `tests/unit/*.spec.ts` — run in Node against the UMD modules directly (`logic`, `data`, `views`, plus `confetti`). No browser involved.
- `tests/e2e/*.spec.ts` — load `index.html` over `file://` (`INDEX_URL` in `tests/e2e/helpers.ts`), so no server is needed. `helpers.ts` holds the shared booking-flow steps (`startBooking`, `fillGuest`, `fillPayment`, `goToPaymentStep`) and sample guest/card data. The mobile project (Pixel 7) only runs `booking-flow.spec.ts`; the desktop project runs everything under `e2e/`.
- Specs use accessible-name locators (`getByRole`, `getByLabel`), so changing button labels, headings (`Step 1/2/3`), or form labels in `views.js` will break e2e tests.

## deploy (Flask scaffold)

```bash
./deploy/run.local.sh     # creates deploy/.venv, installs flask+gunicorn, runs app.py on :5000 (POSIX paths: bin/pip)
./deploy/run.docker.sh    # builds deploy/Dockerfile from repo root, runs on :5000 with --env-file deploy/.env.template
```

Config comes from `HOST`/`PORT` env vars (see `deploy/.env.template`). There is no `requirements.txt`; dependencies are pinned inline in the Dockerfile and `run.local.sh` (flask 3.0.3, gunicorn 22.0.0). The scripts are bash — on Windows run them under Git Bash/WSL.

### Known issues

These make the scaffold non-functional as committed; fix them before relying on it:

- `deploy/app/app.py:17` has a stray `@` (`@if __name__ == "__main__":`), a syntax error, so the app cannot start.
- The README documents a `/health` endpoint, but `app.py` only defines `/`.
- The root `README.md` run step is a literal `c` (garbled) and the `curl` line is typed `url`; the Dockerfile has garbled env names (`PYTHONDONTDWRITE`, `PYLINCTHONBOUFFERED`) and `useradd -uid` (should be `-u`/`--uid`); `run.docker.sh` defaults the image name to the misspelled `sdlccododemie-local`.
- The repo has no Python tests or CI despite what `plan.md` describes.
