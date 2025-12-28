# Mock SaaS API Server

A comprehensive mock API server designed for testing dynamic parameter extraction and iteration logic in API crawlers. Features three tiers of complexity with realistic data relationships and deliberate error conditions.

## About

This server was built to simulate a complex SaaS API for testing dynamic crawling capabilities. It provides:

- **Realistic data relationships**: Users own repos, repos contain commits and files, with proper foreign key references
- **Three tiers of complexity**: Easy (static), Medium (dynamic/paginated), Hard (error simulation)
- **Extraction targets**: Endpoints that return IDs and values meant to be extracted and used in subsequent requests
- **Deliberate edge cases**: Deleted resources, invalid references, empty collections, and various HTTP errors
- **Error simulation**: Rate limiting, timeouts, malformed responses, redirect cycles, and random failures

### Original Purpose

> Create a Fastify server that simulates a complex SaaS API with three tiers of complexity (easy, medium, hard) for testing dynamic parameter extraction and iteration logic. The server generates fake but realistic data with cross-correlations between users, repos, commits, and files. It includes deliberate edge cases like deleted users, invalid references, rate limiting, timeouts, and malformed responses to test error handling and resilience.

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Server runs at http://localhost:8000
```

## Endpoints Overview

| Tier | Prefix | Description |
|------|--------|-------------|
| Easy | `/api/easy/*` | Static data, no parameters |
| Medium | `/api/medium/*` | Dynamic params, pagination, extraction targets |
| Hard | `/api/hard/*` | Deliberate errors and edge cases |
| Docs | `/api/docs` | OpenAPI 3.0 specification |

## Data Model

The server generates deterministic fake data with cross-references:

```
Users (20 total)
  │
  └─> Repos (50 total, owner_id → user.id)
        │
        ├─> Commits (200 total, repo_id → repo.id, author_id → user.id)
        │
        └─> Files (30 total, repo_id → repo.id)
```

### Edge Cases in Data

- **User 18**: Marked as `deleted: true`
- **Users 16-20**: Have no repos
- **Repos 46-50**: Reference invalid/deleted owner IDs
- **Repos 41-50**: Have no commits
- **Some commits**: Reference deleted user 18

---

## Easy Tier Endpoints

Static data, no parameters required. Perfect for initial connectivity testing.

### GET /api/easy/users
Returns all 20 users.

```bash
curl http://localhost:8000/api/easy/users
```

### GET /api/easy/repos
Returns all 50 repos.

```bash
curl http://localhost:8000/api/easy/repos
```

### GET /api/easy/commits
Returns all 200 commits.

```bash
curl http://localhost:8000/api/easy/commits
```

### GET /api/easy/stats
Returns aggregate statistics.

```bash
curl http://localhost:8000/api/easy/stats
```

---

## Medium Tier Endpoints

Dynamic parameters with pagination and **extraction targets** for testing dynamic crawling.

### GET /api/medium/users
Paginated user list.

```bash
curl "http://localhost:8000/api/medium/users?page=1&per_page=10"
```

### GET /api/medium/users/:user_id
Single user with metadata.

```bash
curl http://localhost:8000/api/medium/users/1
```

Response includes `repo_count` and `commit_count`.

### GET /api/medium/users/:user_id/repos ⭐ EXTRACTION TARGET
Returns repos for a user. **Extract `data[].id` for repo IDs.**

```bash
curl http://localhost:8000/api/medium/users/1/repos
```

Response includes `_extraction_hint` with extractable values.

### GET /api/medium/repos/:repo_id
Single repo with statistics.

```bash
curl http://localhost:8000/api/medium/repos/1
```

### GET /api/medium/repos/:repo_id/commits ⭐ EXTRACTION TARGET
Paginated commits for a repo. **Extract `data[].sha` for commit SHAs.**

```bash
curl "http://localhost:8000/api/medium/repos/1/commits?page=1"
```

### GET /api/medium/repos/:repo_id/files ⭐ EXTRACTION TARGET
File metadata for a repo. **Extract `data[].id` and `data[].download_url`.**

```bash
curl http://localhost:8000/api/medium/repos/1/files
```

### GET /api/medium/files/:file_id/download
Download actual file content (text/plain, ~5KB).

```bash
curl http://localhost:8000/api/medium/files/1/download
```

### GET /api/medium/commits/:commit_sha
Get commit by SHA (supports partial SHA matching).

```bash
curl http://localhost:8000/api/medium/commits/abc1234
```

---

## Hard Tier Endpoints

Deliberate error conditions for testing error handling and resilience.

### GET /api/hard/users
**Unreliable endpoint** with random failures:
- 10% chance: Returns 500 Internal Server Error
- 5% chance: Returns malformed JSON
- 3% chance: Returns empty body with 200 status

```bash
curl http://localhost:8000/api/hard/users
```

### GET /api/hard/users/:user_id/repos
**Permission and rate limit errors:**
- `user_id == 18`: Returns 404 (deleted user)
- `user_id > 15`: Returns 403 Forbidden
- Every 5th request: Returns 429 with `Retry-After: 2` header

```bash
# 403 Forbidden
curl http://localhost:8000/api/hard/users/16/repos

# 404 Not Found (deleted)
curl http://localhost:8000/api/hard/users/18/repos

# 429 Rate Limited (every 5th request)
curl http://localhost:8000/api/hard/users/1/repos
```

### GET /api/hard/repos/:repo_id/commits
**Special error cases:**
- `repo_id % 7 == 0`: Returns 503 Service Unavailable
- `repo_id == 5`: Infinite pagination loop (next_page always equals current page)
- `repo_id == 13`: Returns HTML error page instead of JSON

```bash
# 503 Service Unavailable
curl http://localhost:8000/api/hard/repos/7/commits

# Infinite pagination loop
curl "http://localhost:8000/api/hard/repos/5/commits?page=1"

# HTML error page
curl http://localhost:8000/api/hard/repos/13/commits
```

### GET /api/hard/deadlink
Always returns 404.

```bash
curl http://localhost:8000/api/hard/deadlink
```

### GET /api/hard/timeout
Delays 30 seconds before responding. Use for timeout testing.

```bash
curl --max-time 35 http://localhost:8000/api/hard/timeout
```

### GET /api/hard/redirect
Returns 301 redirect to `/api/hard/users`.

```bash
curl -L http://localhost:8000/api/hard/redirect
```

### GET /api/hard/flaky
50% success rate. Possible responses:
- 200 Success (50%)
- 500 Internal Server Error (15%)
- 502 Bad Gateway (15%)
- 503 Service Unavailable (10%)
- Connection reset (10%)

```bash
curl http://localhost:8000/api/hard/flaky
```

### GET /api/hard/slow
Random delay between 1-10 seconds.

```bash
curl http://localhost:8000/api/hard/slow
```

### GET /api/hard/cycle/a
Creates redirect cycle: `a → b → c → a`

```bash
curl --max-redirs 5 http://localhost:8000/api/hard/cycle/a
```

---

## Documentation Endpoints

### GET /api/docs
Returns OpenAPI 3.0 specification as JSON.

```bash
curl http://localhost:8000/api/docs
```

### GET /api/docs/ui
Returns HTML documentation page with all endpoints, curl examples, and descriptions.

Open in browser: http://localhost:8000/api/docs/ui

---

## Request Logging

All requests are logged to console:

```
GET    /api/easy/users                                    200 12.34ms
GET    /api/medium/users/1                                200 5.67ms
GET    /api/hard/users/16/repos                           403 2.11ms
```

Extraction events are also logged:
```
[EXTRACTION] User 1 repos: 1, 15, 22, 38
[EXTRACTION] Repo 1 commit SHAs: abc1234, def5678...
```

---

## Extending the Server

### Adding New Endpoints

1. Create or modify a route file in `src/routes/`
2. Add your endpoint handler
3. Update the OpenAPI spec in `src/routes/docs.js`

Example:
```javascript
// In src/routes/medium.js
fastify.get('/custom/:id', async (request, reply) => {
  const { id } = request.params;
  return { id, custom: true };
});
```

### Adding New Data Types

1. Update `src/utils/generate.js` with new generator function
2. Update `src/data/index.js` to generate and export the data
3. Add query helpers as needed

### Modifying Error Behavior

Edit `src/utils/errors.js` to adjust:
- Random failure rates
- Rate limit intervals
- Error response formats

---

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `PORT` | `8000` | Server port |

---

## Testing Scenarios

### Basic Connectivity
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/easy/stats
```

### Pagination Traversal
```bash
for page in 1 2 3; do
  curl "http://localhost:8000/api/medium/users?page=$page"
done
```

### Parameter Extraction Chain
```bash
# Get user repos
REPOS=$(curl -s http://localhost:8000/api/medium/users/1/repos | jq '.data[].id')

# For each repo, get commits
for repo in $REPOS; do
  curl "http://localhost:8000/api/medium/repos/$repo/commits"
done
```

### Error Handling
```bash
# Test 404
curl http://localhost:8000/api/hard/deadlink

# Test timeout (with client timeout)
curl --max-time 5 http://localhost:8000/api/hard/timeout

# Test redirect cycle (with redirect limit)
curl --max-redirs 3 -L http://localhost:8000/api/hard/cycle/a
```

---

## License

MIT
