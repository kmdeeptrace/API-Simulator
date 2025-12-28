/**
 * OpenAPI documentation routes
 */

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Mock SaaS API',
    description: 'A mock API server for testing DeepTrace dynamic crawling with three tiers of complexity.',
    version: '1.0.0',
    contact: {
      name: 'DeepTrace Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Local development server',
    },
  ],
  tags: [
    { name: 'Easy', description: 'Static endpoints with no parameters required' },
    { name: 'Medium', description: 'Dynamic endpoints with pagination and parameter extraction' },
    { name: 'Hard', description: 'Endpoints with deliberate errors and edge cases' },
  ],
  paths: {
    // Easy Tier
    '/api/easy/users': {
      get: {
        tags: ['Easy'],
        summary: 'Get all users',
        description: 'Returns all 20 users in a single response (~10-15KB)',
        responses: {
          200: {
            description: 'List of all users',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UsersResponse' },
                example: {
                  data: [
                    { id: 1, username: 'johndoe', email: 'john@example.com', name: 'John Doe', role: 'admin' },
                  ],
                  count: 20,
                },
              },
            },
          },
        },
      },
    },
    '/api/easy/repos': {
      get: {
        tags: ['Easy'],
        summary: 'Get all repos',
        description: 'Returns all 50 repos in a single response (~15-20KB)',
        responses: {
          200: {
            description: 'List of all repos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ReposResponse' },
              },
            },
          },
        },
      },
    },
    '/api/easy/commits': {
      get: {
        tags: ['Easy'],
        summary: 'Get all commits',
        description: 'Returns all 200 commits in a single response (~20KB)',
        responses: {
          200: {
            description: 'List of all commits',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CommitsResponse' },
              },
            },
          },
        },
      },
    },
    '/api/easy/stats': {
      get: {
        tags: ['Easy'],
        summary: 'Get summary statistics',
        description: 'Returns aggregate statistics about all data',
        responses: {
          200: {
            description: 'Summary statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Stats' },
              },
            },
          },
        },
      },
    },

    // Medium Tier
    '/api/medium/users': {
      get: {
        tags: ['Medium'],
        summary: 'Get paginated users',
        description: 'Returns users with pagination (10 per page by default)',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Page number (starts at 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'per_page',
            in: 'query',
            description: 'Items per page',
            schema: { type: 'integer', default: 10 },
          },
        ],
        responses: {
          200: {
            description: 'Paginated list of users',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PaginatedResponse' },
              },
            },
          },
        },
      },
    },
    '/api/medium/users/{user_id}': {
      get: {
        tags: ['Medium'],
        summary: 'Get user by ID',
        description: 'Returns a single user with additional metadata (repo_count, commit_count)',
        parameters: [
          {
            name: 'user_id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'User details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserDetail' },
              },
            },
          },
          404: { description: 'User not found' },
          410: { description: 'User has been deleted' },
        },
      },
    },
    '/api/medium/users/{user_id}/repos': {
      get: {
        tags: ['Medium'],
        summary: 'Get repos by user',
        description: 'Returns all repos owned by the specified user. EXTRACTION TARGET: repo IDs',
        parameters: [
          {
            name: 'user_id',
            in: 'path',
            required: true,
            description: 'User ID',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'List of repos',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserReposResponse' },
              },
            },
          },
          404: { description: 'User not found or deleted' },
        },
      },
    },
    '/api/medium/repos/{repo_id}': {
      get: {
        tags: ['Medium'],
        summary: 'Get repo by ID',
        description: 'Returns a single repo with stats (commit_count, contributor_count)',
        parameters: [
          {
            name: 'repo_id',
            in: 'path',
            required: true,
            description: 'Repo ID',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Repo details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RepoDetail' },
              },
            },
          },
          404: { description: 'Repo not found' },
        },
      },
    },
    '/api/medium/repos/{repo_id}/commits': {
      get: {
        tags: ['Medium'],
        summary: 'Get commits by repo',
        description: 'Returns paginated commits for a repo. EXTRACTION TARGET: commit SHAs',
        parameters: [
          {
            name: 'repo_id',
            in: 'path',
            required: true,
            description: 'Repo ID',
            schema: { type: 'integer' },
          },
          {
            name: 'page',
            in: 'query',
            description: 'Page number',
            schema: { type: 'integer', default: 1 },
          },
        ],
        responses: {
          200: {
            description: 'List of commits',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RepoCommitsResponse' },
              },
            },
          },
          404: { description: 'Repo not found' },
        },
      },
    },
    '/api/medium/repos/{repo_id}/files': {
      get: {
        tags: ['Medium'],
        summary: 'Get files by repo',
        description: 'Returns file metadata for a repo. EXTRACTION TARGET: file IDs and download_urls',
        parameters: [
          {
            name: 'repo_id',
            in: 'path',
            required: true,
            description: 'Repo ID',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'List of files',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RepoFilesResponse' },
              },
            },
          },
          404: { description: 'Repo not found' },
        },
      },
    },
    '/api/medium/files/{file_id}/download': {
      get: {
        tags: ['Medium'],
        summary: 'Download file content',
        description: 'Returns actual file content (~5KB Lorem ipsum text)',
        parameters: [
          {
            name: 'file_id',
            in: 'path',
            required: true,
            description: 'File ID',
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'File content',
            content: {
              'text/plain': {
                schema: { type: 'string' },
              },
            },
            headers: {
              'Content-Disposition': {
                description: 'Attachment filename',
                schema: { type: 'string' },
              },
            },
          },
          404: { description: 'File not found' },
        },
      },
    },

    // Hard Tier
    '/api/hard/users': {
      get: {
        tags: ['Hard'],
        summary: 'Get users (unreliable)',
        description: 'Returns users but randomly fails: 500 error (10%), malformed JSON (5%), empty response (3%)',
        responses: {
          200: { description: 'Users (when successful)' },
          500: { description: 'Random server error (10% chance)' },
        },
      },
    },
    '/api/hard/users/{user_id}/repos': {
      get: {
        tags: ['Hard'],
        summary: 'Get user repos (with errors)',
        description: '404 for deleted users, 403 for user_id > 15, 429 every 5th request',
        parameters: [
          {
            name: 'user_id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: { description: 'User repos' },
          403: { description: 'Permission denied (user_id > 15)' },
          404: { description: 'User deleted or not found' },
          429: {
            description: 'Rate limited (every 5th request)',
            headers: {
              'Retry-After': { schema: { type: 'integer' }, description: 'Seconds to wait' },
            },
          },
        },
      },
    },
    '/api/hard/repos/{repo_id}/commits': {
      get: {
        tags: ['Hard'],
        summary: 'Get repo commits (with errors)',
        description: '503 for repo_id % 7 == 0, infinite loop pagination for repo_id == 5, HTML error for repo_id == 13',
        parameters: [
          {
            name: 'repo_id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', default: 1 },
          },
        ],
        responses: {
          200: { description: 'Commits' },
          500: { description: 'HTML error page (repo_id == 13)' },
          503: { description: 'Service unavailable (repo_id % 7 == 0)' },
        },
      },
    },
    '/api/hard/deadlink': {
      get: {
        tags: ['Hard'],
        summary: 'Dead link',
        description: 'Always returns 404',
        responses: {
          404: { description: 'Always not found' },
        },
      },
    },
    '/api/hard/timeout': {
      get: {
        tags: ['Hard'],
        summary: 'Timeout endpoint',
        description: 'Delays 30 seconds before responding',
        responses: {
          200: { description: 'Response after 30 second delay' },
        },
      },
    },
    '/api/hard/redirect': {
      get: {
        tags: ['Hard'],
        summary: 'Redirect',
        description: 'Returns 301 redirect to /api/hard/users',
        responses: {
          301: { description: 'Redirect to /api/hard/users' },
        },
      },
    },
    '/api/hard/flaky': {
      get: {
        tags: ['Hard'],
        summary: 'Flaky endpoint',
        description: 'Returns success 50% of the time, various errors otherwise',
        responses: {
          200: { description: 'Success (50% chance)' },
          500: { description: 'Internal error (15% chance)' },
          502: { description: 'Bad gateway (15% chance)' },
          503: { description: 'Service unavailable (10% chance)' },
        },
      },
    },
    '/api/hard/slow': {
      get: {
        tags: ['Hard'],
        summary: 'Slow endpoint',
        description: 'Random delay between 1-10 seconds',
        responses: {
          200: { description: 'Delayed response' },
        },
      },
    },
    '/api/hard/cycle/a': {
      get: {
        tags: ['Hard'],
        summary: 'Redirect cycle (start)',
        description: 'Creates a redirect cycle: a -> b -> c -> a',
        responses: {
          302: { description: 'Redirect to /api/hard/cycle/b' },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          role: { type: 'string', enum: ['admin', 'member', 'viewer', 'contributor'] },
          deleted: { type: 'boolean' },
          avatar_url: { type: 'string', format: 'uri' },
        },
      },
      Repo: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          owner_id: { type: 'integer' },
          description: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          stars: { type: 'integer' },
          language: { type: 'string' },
          is_private: { type: 'boolean' },
          default_branch: { type: 'string' },
        },
      },
      Commit: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          repo_id: { type: 'integer' },
          author_id: { type: 'integer' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
          sha: { type: 'string' },
          additions: { type: 'integer' },
          deletions: { type: 'integer' },
        },
      },
      File: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          repo_id: { type: 'integer' },
          filename: { type: 'string' },
          size: { type: 'integer' },
          download_url: { type: 'string' },
          content_type: { type: 'string' },
          last_modified: { type: 'string', format: 'date-time' },
        },
      },
      UsersResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
          count: { type: 'integer' },
        },
      },
      ReposResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Repo' } },
          count: { type: 'integer' },
        },
      },
      CommitsResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Commit' } },
          count: { type: 'integer' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          total: { type: 'integer' },
          page: { type: 'integer' },
          per_page: { type: 'integer' },
          total_pages: { type: 'integer' },
        },
      },
      UserDetail: {
        allOf: [
          { $ref: '#/components/schemas/User' },
          {
            type: 'object',
            properties: {
              repo_count: { type: 'integer' },
              commit_count: { type: 'integer' },
              repos: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'integer' },
                    name: { type: 'string' },
                  },
                },
              },
            },
          },
        ],
      },
      RepoDetail: {
        allOf: [
          { $ref: '#/components/schemas/Repo' },
          {
            type: 'object',
            properties: {
              commit_count: { type: 'integer' },
              contributor_count: { type: 'integer' },
              contributors: { type: 'array', items: { type: 'integer' } },
              latest_commit: { $ref: '#/components/schemas/Commit' },
            },
          },
        ],
      },
      UserReposResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/Repo' } },
          count: { type: 'integer' },
          user_id: { type: 'integer' },
          _extraction_hint: {
            type: 'object',
            properties: {
              field: { type: 'string' },
              values: { type: 'array', items: { type: 'integer' } },
            },
          },
        },
      },
      RepoCommitsResponse: {
        allOf: [
          { $ref: '#/components/schemas/PaginatedResponse' },
          {
            type: 'object',
            properties: {
              repo_id: { type: 'integer' },
              _extraction_hint: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  values: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        ],
      },
      RepoFilesResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: '#/components/schemas/File' } },
          count: { type: 'integer' },
          repo_id: { type: 'integer' },
          _extraction_hint: {
            type: 'object',
            properties: {
              fields: { type: 'array', items: { type: 'string' } },
              file_ids: { type: 'array', items: { type: 'integer' } },
              download_urls: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          total_users: { type: 'integer' },
          active_users: { type: 'integer' },
          deleted_users: { type: 'integer' },
          total_repos: { type: 'integer' },
          repos_with_commits: { type: 'integer' },
          repos_without_commits: { type: 'integer' },
          total_commits: { type: 'integer' },
          total_files: { type: 'integer' },
          languages: { type: 'array', items: { type: 'string' } },
        },
      },
      Error: {
        type: 'object',
        properties: {
          statusCode: { type: 'integer' },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};

export default async function docsRoutes(fastify, options) {
  /**
   * GET /api/docs
   * Returns OpenAPI 3.0 spec as JSON
   */
  fastify.get('/', async (request, reply) => {
    return openApiSpec;
  });

  /**
   * GET /api/docs/ui
   * Returns simple HTML page with endpoint list
   */
  fastify.get('/ui', async (request, reply) => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mock API Documentation</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; }
    .tier { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .tier-easy { border-left: 4px solid #28a745; }
    .tier-medium { border-left: 4px solid #ffc107; }
    .tier-hard { border-left: 4px solid #dc3545; }
    .endpoint { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; }
    .method { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; margin-right: 10px; }
    .get { background: #28a745; color: white; }
    .path { font-family: monospace; font-size: 14px; }
    .description { color: #666; margin-top: 5px; }
    code { background: #e9ecef; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
    pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; }
    .tag-extraction { background: #17a2b8; color: white; }
    .tag-error { background: #dc3545; color: white; }
    a { color: #007bff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Mock SaaS API Documentation</h1>
  <p>A mock API server for testing dynamic crawling with three tiers of complexity.</p>
  <p><a href="/api/docs">View OpenAPI JSON Spec</a></p>

  <div class="tier tier-easy">
    <h2>Easy Tier</h2>
    <p>Static data, no parameters required. All endpoints return complete datasets.</p>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/easy/users</span>
      <div class="description">Returns all 20 users (~10-15KB)</div>
      <pre>curl http://localhost:8000/api/easy/users</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/easy/repos</span>
      <div class="description">Returns all 50 repos (~15-20KB)</div>
      <pre>curl http://localhost:8000/api/easy/repos</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/easy/commits</span>
      <div class="description">Returns all 200 commits (~20KB)</div>
      <pre>curl http://localhost:8000/api/easy/commits</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/easy/stats</span>
      <div class="description">Returns summary statistics</div>
      <pre>curl http://localhost:8000/api/easy/stats</pre>
    </div>
  </div>

  <div class="tier tier-medium">
    <h2>Medium Tier</h2>
    <p>Dynamic parameters with pagination and extraction targets.</p>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/users</span>
      <div class="description">Paginated users (10 per page). Query: <code>?page=1&per_page=10</code></div>
      <pre>curl "http://localhost:8000/api/medium/users?page=2"</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/users/:user_id</span>
      <div class="description">Single user with repo_count and commit_count metadata</div>
      <pre>curl http://localhost:8000/api/medium/users/1</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/users/:user_id/repos</span>
      <span class="tag tag-extraction">EXTRACTION TARGET</span>
      <div class="description">Repos for user. Extract repo IDs from response.</div>
      <pre>curl http://localhost:8000/api/medium/users/1/repos</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/repos/:repo_id</span>
      <div class="description">Single repo with commit_count and contributor stats</div>
      <pre>curl http://localhost:8000/api/medium/repos/1</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/repos/:repo_id/commits</span>
      <span class="tag tag-extraction">EXTRACTION TARGET</span>
      <div class="description">Paginated commits for repo. Extract commit SHAs.</div>
      <pre>curl "http://localhost:8000/api/medium/repos/1/commits?page=1"</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/repos/:repo_id/files</span>
      <span class="tag tag-extraction">EXTRACTION TARGET</span>
      <div class="description">File metadata for repo. Extract file IDs and download_urls.</div>
      <pre>curl http://localhost:8000/api/medium/repos/1/files</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/files/:file_id/download</span>
      <div class="description">Download file content (text/plain, ~5KB)</div>
      <pre>curl http://localhost:8000/api/medium/files/1/download</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/medium/commits/:commit_sha</span>
      <div class="description">Get commit by SHA (supports partial SHA)</div>
      <pre>curl http://localhost:8000/api/medium/commits/abc1234</pre>
    </div>
  </div>

  <div class="tier tier-hard">
    <h2>Hard Tier</h2>
    <p>Deliberate edge cases, errors, and failure modes for testing error handling.</p>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/users</span>
      <span class="tag tag-error">UNRELIABLE</span>
      <div class="description">Random failures: 500 (10%), malformed JSON (5%), empty response (3%)</div>
      <pre>curl http://localhost:8000/api/hard/users</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/users/:user_id/repos</span>
      <span class="tag tag-error">PERMISSION ERRORS</span>
      <div class="description">
        <ul>
          <li>404 for deleted users (user 18)</li>
          <li>403 for user_id > 15</li>
          <li>429 rate limit every 5th request (Retry-After: 2)</li>
        </ul>
      </div>
      <pre>curl http://localhost:8000/api/hard/users/16/repos  # 403
curl http://localhost:8000/api/hard/users/18/repos  # 404</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/repos/:repo_id/commits</span>
      <span class="tag tag-error">SPECIAL CASES</span>
      <div class="description">
        <ul>
          <li>503 when repo_id % 7 == 0 (repos 7, 14, 21...)</li>
          <li>Infinite pagination loop for repo_id == 5</li>
          <li>HTML error page instead of JSON for repo_id == 13</li>
        </ul>
      </div>
      <pre>curl http://localhost:8000/api/hard/repos/7/commits   # 503
curl http://localhost:8000/api/hard/repos/5/commits   # infinite loop
curl http://localhost:8000/api/hard/repos/13/commits  # HTML error</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/deadlink</span>
      <span class="tag tag-error">ALWAYS 404</span>
      <div class="description">Always returns 404 Not Found</div>
      <pre>curl http://localhost:8000/api/hard/deadlink</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/timeout</span>
      <span class="tag tag-error">30s DELAY</span>
      <div class="description">Delays 30 seconds before responding</div>
      <pre>curl --max-time 35 http://localhost:8000/api/hard/timeout</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/redirect</span>
      <div class="description">301 redirect to /api/hard/users</div>
      <pre>curl -L http://localhost:8000/api/hard/redirect</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/flaky</span>
      <span class="tag tag-error">50% FAIL</span>
      <div class="description">Success 50%, various errors 50%</div>
      <pre>curl http://localhost:8000/api/hard/flaky</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/slow</span>
      <div class="description">Random delay 1-10 seconds</div>
      <pre>curl http://localhost:8000/api/hard/slow</pre>
    </div>

    <div class="endpoint">
      <span class="method get">GET</span>
      <span class="path">/api/hard/cycle/a</span>
      <span class="tag tag-error">REDIRECT CYCLE</span>
      <div class="description">Creates redirect cycle: a -> b -> c -> a</div>
      <pre>curl --max-redirs 5 http://localhost:8000/api/hard/cycle/a</pre>
    </div>
  </div>

  <h2>Data Relationships</h2>
  <pre>
Users (20 total)
  └─> Repos (owner_id references user.id)
        └─> Commits (repo_id references repo.id, author_id references user.id)
        └─> Files (repo_id references repo.id)

Edge Cases:
- User 18 is deleted (deleted: true)
- Users 16-20 have no repos
- Repos 46-50 reference invalid/deleted owners
- Repos 41-50 have no commits
- Some commits reference deleted user 18
  </pre>
</body>
</html>`;

    reply.header('Content-Type', 'text/html');
    return html;
  });
}
