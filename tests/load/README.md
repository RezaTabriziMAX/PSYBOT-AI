# Load Tests

This folder contains k6 scripts for exercising Nuttoo components.

## Running

Install k6, then run:

- API load:
  k6 run tests/load/k6/api-load.js

- Indexer load:
  k6 run tests/load/k6/indexer-load.js

Set env vars:
- NUTTOO_API_BASE_URL
