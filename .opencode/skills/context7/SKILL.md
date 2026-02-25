---
name: context7
description: Retrieve up-to-date documentation for software libraries, frameworks, and components via the Context7 API. This skill should be used when looking up documentation for any programming library or framework, finding code examples for specific APIs or features, verifying correct usage of library functions, or obtaining current information about library APIs that may have changed since training.
---

# Context7

Fetches current, version-specific documentation for libraries via the Context7 API.
Use this instead of relying on potentially outdated training data.

## Workflow

### Step 1: Search for the Library

```bash
curl -s "https://context7.com/api/v2/libs/search?libraryName=LIBRARY_NAME&query=TOPIC" | jq '.results[0]'
```

**Parameters:**
- `libraryName` (required): Library name (e.g., "fastapi", "sqlalchemy", "pydantic")
- `query` (required): Topic description for relevance ranking

**Response:** Returns `id`, `title`, `description`, `totalSnippets`

### Step 2: Fetch Documentation

```bash
curl -s "https://context7.com/api/v2/context?libraryId=LIBRARY_ID&query=TOPIC&type=txt"
```

**Parameters:**
- `libraryId` (required): Library ID from search results
- `query` (required): Specific topic to retrieve docs for
- `type` (optional): `json` (default) or `txt` (plain text, more readable)

## Examples

```bash
# FastAPI dependency injection
curl -s "https://context7.com/api/v2/libs/search?libraryName=fastapi&query=dependencies" | jq '.results[0].id'
curl -s "https://context7.com/api/v2/context?libraryId=/fastapi/fastapi&query=dependency+injection&type=txt"

# SQLAlchemy async sessions
curl -s "https://context7.com/api/v2/libs/search?libraryName=sqlalchemy&query=async+session" | jq '.results[0].id'
curl -s "https://context7.com/api/v2/context?libraryId=/sqlalchemy/sqlalchemy&query=async+session+usage&type=txt"

# Pydantic v2 models
curl -s "https://context7.com/api/v2/libs/search?libraryName=pydantic&query=model+validation" | jq '.results[0].id'
curl -s "https://context7.com/api/v2/context?libraryId=/pydantic/pydantic&query=BaseModel+field+validators&type=txt"
```

## Tips

- Use `type=txt` for more readable output
- Be specific with the `query` parameter to improve relevance
- URL-encode query parameters containing spaces (use `+` or `%20`)
- If the first search result is wrong, check additional results in the array
- No API key required for basic usage (rate-limited)
- See `library-registry.md` for supported Python libraries and aliases
