# tests

This directory contains Playwright END-TO-END automated tests.

To run locally:
```bash
npm i
px playwright install
npx playwright test
```

The tests expect the demo Flask app running on http://localhost:5000 (see deploy/run.local.sh).
