---
description: Run type checking and fix errors
---
Run type checker: `python -m mypy src/ $ARGUMENTS`

If mypy is not installed, try `pyright` or `python -m pyright`.

If errors found:
1. Fix type errors one at a time
2. Add proper type annotations where missing
3. Re-run until clean
