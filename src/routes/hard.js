import {
  users,
  repos,
  getUserById,
  getReposByOwner,
  getCommitsByRepo,
  paginate,
} from '../data/index.js';
import {
  getRequestCount,
  maybeServerError,
  maybeMalformedJson,
  maybeEmptyResponse,
  isRateLimited,
  htmlErrorPage,
} from '../utils/errors.js';

/**
 * Hard tier routes - Deliberate edge cases and errors
 */
export default async function hardRoutes(fastify, options) {
  /**
   * GET /api/hard/users
   * - Randomly returns 500 error 10% of the time
   * - Sometimes returns malformed JSON
   * - Sometimes returns empty response body with 200 status
   */
  fastify.get('/users', async (request, reply) => {
    // Check for empty response (3% chance)
    if (maybeEmptyResponse()) {
      console.log('[HARD] Returning empty response');
      reply.code(200);
      return '';
    }

    // Check for malformed JSON (5% chance)
    const malformed = maybeMalformedJson();
    if (malformed) {
      console.log('[HARD] Returning malformed JSON');
      reply.header('Content-Type', 'application/json');
      return reply.send(malformed);
    }

    // Check for server error (10% chance)
    const error = maybeServerError();
    if (error) {
      console.log('[HARD] Returning 500 error');
      reply.code(500);
      return error;
    }

    // Normal response
    return {
      data: users,
      count: users.length,
    };
  });

  /**
   * GET /api/hard/users/:user_id/repos
   * - Returns 404 for deleted users (user 18)
   * - Returns 403 for user_id > 15
   * - Returns 429 every 5th request
   */
  fastify.get('/users/:user_id/repos', async (request, reply) => {
    const userId = parseInt(request.params.user_id);
    const reqCount = getRequestCount();

    // Check rate limit (every 5th request)
    if (isRateLimited()) {
      console.log(`[HARD] Rate limit triggered (request ${reqCount})`);
      reply
        .code(429)
        .header('Retry-After', '2')
        .header('X-RateLimit-Limit', '100')
        .header('X-RateLimit-Remaining', '0')
        .header('X-RateLimit-Reset', Math.floor(Date.now() / 1000) + 2);
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please retry after the specified time.',
        retry_after: 2,
      };
    }

    // Check for deleted user (user 18)
    const user = getUserById(userId);
    if (user && user.deleted) {
      console.log(`[HARD] Returning 404 for deleted user ${userId}`);
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `User ${userId} has been deleted`,
      };
    }

    // Check for permission denied (user_id > 15)
    if (userId > 15) {
      console.log(`[HARD] Returning 403 for user ${userId}`);
      reply.code(403);
      return {
        statusCode: 403,
        error: 'Forbidden',
        message: `You don't have permission to access repos for user ${userId}`,
      };
    }

    // Check for user not found
    if (!user) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `User with id ${userId} not found`,
      };
    }

    // Normal response
    const userRepos = getReposByOwner(userId);
    return {
      data: userRepos,
      count: userRepos.length,
    };
  });

  /**
   * GET /api/hard/repos/:repo_id/commits
   * - Returns 503 for repo_id % 7 == 0
   * - Pagination token points to same page (infinite loop) for repo_id == 5
   * - Returns HTML error page instead of JSON for repo_id == 13
   */
  fastify.get('/repos/:repo_id/commits', async (request, reply) => {
    const repoId = parseInt(request.params.repo_id);
    const page = parseInt(request.query.page) || 1;

    // Service unavailable for repo_id divisible by 7
    if (repoId % 7 === 0) {
      console.log(`[HARD] Returning 503 for repo ${repoId}`);
      reply.code(503);
      return {
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'The commit service is temporarily unavailable',
      };
    }

    // HTML error page for repo_id == 13
    if (repoId === 13) {
      console.log(`[HARD] Returning HTML error for repo ${repoId}`);
      reply
        .code(500)
        .header('Content-Type', 'text/html');
      return htmlErrorPage(500, 'An unexpected error occurred while fetching commits');
    }

    const repoCommits = getCommitsByRepo(repoId);

    // Infinite loop pagination for repo_id == 5
    if (repoId === 5) {
      console.log(`[HARD] Returning infinite loop pagination for repo ${repoId}`);
      const paginated = paginate(repoCommits, page, 5);
      return {
        ...paginated,
        // Always point next_page to current page (infinite loop)
        next_page: page,
        has_more: true,
        _warning: 'This endpoint intentionally creates an infinite loop for testing',
      };
    }

    // Normal response
    const paginated = paginate(repoCommits, page, 10);
    return {
      ...paginated,
      next_page: paginated.page < paginated.total_pages ? paginated.page + 1 : null,
      has_more: paginated.page < paginated.total_pages,
    };
  });

  /**
   * GET /api/hard/deadlink
   * Always returns 404
   */
  fastify.get('/deadlink', async (request, reply) => {
    console.log('[HARD] Returning 404 for deadlink');
    reply.code(404);
    return {
      statusCode: 404,
      error: 'Not Found',
      message: 'This resource does not exist and never will',
    };
  });

  /**
   * GET /api/hard/timeout
   * Delays 30 seconds before responding (timeout test)
   */
  fastify.get('/timeout', async (request, reply) => {
    console.log('[HARD] Starting 30 second delay...');

    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log('[HARD] Delay complete, returning response');
    return {
      message: 'Response after 30 second delay',
      delayed_by: 30000,
    };
  });

  /**
   * GET /api/hard/redirect
   * Returns 301 redirect to /api/hard/users
   */
  fastify.get('/redirect', async (request, reply) => {
    console.log('[HARD] Redirecting to /api/hard/users');
    reply.code(301).redirect('/api/hard/users');
  });

  /**
   * GET /api/hard/flaky
   * Returns success 50% of the time, various errors otherwise
   */
  fastify.get('/flaky', async (request, reply) => {
    const roll = Math.random();

    if (roll < 0.5) {
      return { success: true, message: 'Lucky you!' };
    } else if (roll < 0.65) {
      reply.code(500);
      return { statusCode: 500, error: 'Internal Server Error', message: 'Random failure' };
    } else if (roll < 0.80) {
      reply.code(502);
      return { statusCode: 502, error: 'Bad Gateway', message: 'Upstream error' };
    } else if (roll < 0.90) {
      reply.code(503);
      return { statusCode: 503, error: 'Service Unavailable', message: 'Try again later' };
    } else {
      // Connection reset simulation - just close without response
      console.log('[HARD] Simulating connection reset');
      reply.raw.destroy();
    }
  });

  /**
   * GET /api/hard/slow
   * Random delay between 1-10 seconds
   */
  fastify.get('/slow', async (request, reply) => {
    const delay = Math.floor(Math.random() * 9000) + 1000;
    console.log(`[HARD] Delaying response by ${delay}ms`);

    await new Promise(resolve => setTimeout(resolve, delay));

    return {
      message: 'Slow response',
      delayed_by: delay,
    };
  });

  /**
   * GET /api/hard/cycle/a
   * Creates a redirect cycle: a -> b -> c -> a
   */
  fastify.get('/cycle/a', async (request, reply) => {
    console.log('[HARD] Cycle redirect: a -> b');
    reply.code(302).redirect('/api/hard/cycle/b');
  });

  fastify.get('/cycle/b', async (request, reply) => {
    console.log('[HARD] Cycle redirect: b -> c');
    reply.code(302).redirect('/api/hard/cycle/c');
  });

  fastify.get('/cycle/c', async (request, reply) => {
    console.log('[HARD] Cycle redirect: c -> a (completing cycle)');
    reply.code(302).redirect('/api/hard/cycle/a');
  });
}
