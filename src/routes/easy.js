import { users, repos, commits, getStats } from '../data/index.js';

/**
 * Easy tier routes - Static data, no parameters required
 */
export default async function easyRoutes(fastify, options) {
  /**
   * GET /api/easy/users
   * Returns all 20 users
   */
  fastify.get('/users', async (request, reply) => {
    return {
      data: users,
      count: users.length,
    };
  });

  /**
   * GET /api/easy/repos
   * Returns all 50 repos
   */
  fastify.get('/repos', async (request, reply) => {
    return {
      data: repos,
      count: repos.length,
    };
  });

  /**
   * GET /api/easy/commits
   * Returns all 200 commits
   */
  fastify.get('/commits', async (request, reply) => {
    return {
      data: commits,
      count: commits.length,
    };
  });

  /**
   * GET /api/easy/stats
   * Returns summary statistics
   */
  fastify.get('/stats', async (request, reply) => {
    return getStats();
  });
}
