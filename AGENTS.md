# Project Rules

## General
- Python project. Use Python 3.11+ features.
- Write clean, readable code. Prefer simplicity over cleverness.
- Use type hints on all function signatures.
- Follow PEP 8. Use snake_case for functions/variables, PascalCase for classes.
- Prefer f-strings over .format() or % formatting.
- Use pathlib over os.path for file operations.

## Code Style
- Keep functions short and single-purpose.
- Use dataclasses or Pydantic models for structured data.
- Prefer list/dict/set comprehensions when readable.
- Use `from __future__ import annotations` for forward references.
- Handle errors explicitly. No bare `except:` blocks.
- Use `logging` module, not print statements for debugging.

## Testing
- Use pytest for all tests.
- Test files go in `tests/` directory, mirroring `src/` structure.
- Name test files `test_*.py` and test functions `test_*`.
- Use fixtures for shared setup. Prefer factory fixtures over complex setup.
- Mock external dependencies (APIs, databases, file system).

## Project Structure
- Source code in `src/` directory.
- Configuration in project root (pyproject.toml, .env).
- Keep imports organized: stdlib, third-party, local (isort default sections).

## Dependencies
- Use pyproject.toml for dependency management.
- Pin major versions of dependencies.
- Prefer well-maintained, popular libraries.
