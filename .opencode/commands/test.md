---
description: Run tests and fix failures
---
Run the test suite: `pytest $ARGUMENTS -v`

If tests fail:
1. Analyze the failures
2. Fix them one at a time
3. Re-run until all pass

If no arguments given, run all tests. Common patterns:
- `pytest tests/test_specific.py` for a single file
- `pytest -k "test_name"` for a specific test
- `pytest --tb=short` for shorter tracebacks
