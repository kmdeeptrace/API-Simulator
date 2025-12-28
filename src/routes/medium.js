import {
  users,
  repos,
  commits,
  files,
  getUserById,
  getReposByOwner,
  getRepoById,
  getCommitsByRepo,
  getFilesByRepo,
  getFileById,
  paginate,
} from '../data/index.js';
import { generateFileContent } from '../utils/generate.js';

/**
 * Medium tier routes - Dynamic parameters with extraction
 */
export default async function mediumRoutes(fastify, options) {
  /**
   * GET /api/medium/users
   * Returns paginated users (10 per page)
   */
  fastify.get('/users', async (request, reply) => {
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.per_page) || 10;

    return paginate(users, page, perPage);
  });

  /**
   * GET /api/medium/users/:user_id
   * Returns single user with additional metadata
   */
  fastify.get('/users/:user_id', async (request, reply) => {
    const userId = parseInt(request.params.user_id);
    const user = getUserById(userId);

    if (!user) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `User with id ${userId} not found`,
      };
    }

    if (user.deleted) {
      reply.code(410);
      return {
        statusCode: 410,
        error: 'Gone',
        message: `User with id ${userId} has been deleted`,
      };
    }

    // Add computed metadata
    const userRepos = getReposByOwner(userId);
    const userCommits = commits.filter(c => c.author_id === userId);

    return {
      ...user,
      repo_count: userRepos.length,
      commit_count: userCommits.length,
      repos: userRepos.map(r => ({ id: r.id, name: r.name })),
    };
  });

  /**
   * GET /api/medium/users/:user_id/repos
   * Returns all repos for user
   * EXTRACTION TARGET: extract repo IDs
   */
  fastify.get('/users/:user_id/repos', async (request, reply) => {
    const userId = parseInt(request.params.user_id);
    const user = getUserById(userId);

    if (!user) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `User with id ${userId} not found`,
      };
    }

    if (user.deleted) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `User with id ${userId} has been deleted`,
      };
    }

    const userRepos = getReposByOwner(userId);

    // Log extraction target
    console.log(`[EXTRACTION] User ${userId} repos: ${userRepos.map(r => r.id).join(', ')}`);

    return {
      data: userRepos,
      count: userRepos.length,
      user_id: userId,
      // Include extractable IDs at top level for easy parsing
      _extraction_hint: {
        field: 'data[].id',
        values: userRepos.map(r => r.id),
      },
    };
  });

  /**
   * GET /api/medium/repos/:repo_id
   * Returns single repo with stats
   */
  fastify.get('/repos/:repo_id', async (request, reply) => {
    const repoId = parseInt(request.params.repo_id);
    const repo = getRepoById(repoId);

    if (!repo) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `Repo with id ${repoId} not found`,
      };
    }

    const repoCommits = getCommitsByRepo(repoId);
    const contributors = [...new Set(repoCommits.map(c => c.author_id))];

    return {
      ...repo,
      commit_count: repoCommits.length,
      contributor_count: contributors.length,
      contributors: contributors,
      latest_commit: repoCommits.length > 0 ? repoCommits[0] : null,
    };
  });

  /**
   * GET /api/medium/repos/:repo_id/commits
   * Returns commits for repo (paginated)
   * EXTRACTION TARGET: extract commit SHAs
   */
  fastify.get('/repos/:repo_id/commits', async (request, reply) => {
    const repoId = parseInt(request.params.repo_id);
    const page = parseInt(request.query.page) || 1;
    const perPage = parseInt(request.query.per_page) || 20;

    const repo = getRepoById(repoId);

    if (!repo) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `Repo with id ${repoId} not found`,
      };
    }

    const repoCommits = getCommitsByRepo(repoId);

    // Log extraction target
    if (repoCommits.length > 0) {
      console.log(`[EXTRACTION] Repo ${repoId} commit SHAs: ${repoCommits.slice(0, 5).map(c => c.sha.substring(0, 7)).join(', ')}...`);
    }

    const paginated = paginate(repoCommits, page, perPage);

    return {
      ...paginated,
      repo_id: repoId,
      // Include extractable SHAs
      _extraction_hint: {
        field: 'data[].sha',
        values: paginated.data.map(c => c.sha),
      },
    };
  });

  /**
   * GET /api/medium/repos/:repo_id/files
   * Returns file metadata for repo
   * EXTRACTION TARGET: extract file IDs and download_urls
   */
  fastify.get('/repos/:repo_id/files', async (request, reply) => {
    const repoId = parseInt(request.params.repo_id);
    const repo = getRepoById(repoId);

    if (!repo) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `Repo with id ${repoId} not found`,
      };
    }

    const repoFiles = getFilesByRepo(repoId);

    // Log extraction targets
    if (repoFiles.length > 0) {
      console.log(`[EXTRACTION] Repo ${repoId} file IDs: ${repoFiles.map(f => f.id).join(', ')}`);
    }

    return {
      data: repoFiles,
      count: repoFiles.length,
      repo_id: repoId,
      // Include extractable values
      _extraction_hint: {
        fields: ['data[].id', 'data[].download_url'],
        file_ids: repoFiles.map(f => f.id),
        download_urls: repoFiles.map(f => f.download_url),
      },
    };
  });

  /**
   * GET /api/medium/files/:file_id/download
   * Returns actual file content (text/plain)
   */
  fastify.get('/files/:file_id/download', async (request, reply) => {
    const fileId = parseInt(request.params.file_id);
    const file = getFileById(fileId);

    if (!file) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `File with id ${fileId} not found`,
      };
    }

    const content = generateFileContent(fileId);

    reply
      .header('Content-Type', 'text/plain')
      .header('Content-Disposition', `attachment; filename="${file.filename.split('/').pop()}"`)
      .header('Content-Length', Buffer.byteLength(content));

    return content;
  });

  /**
   * GET /api/medium/commits/:commit_sha
   * Returns commit by SHA
   */
  fastify.get('/commits/:commit_sha', async (request, reply) => {
    const sha = request.params.commit_sha;
    const commit = commits.find(c => c.sha === sha || c.sha.startsWith(sha));

    if (!commit) {
      reply.code(404);
      return {
        statusCode: 404,
        error: 'Not Found',
        message: `Commit with sha ${sha} not found`,
      };
    }

    const author = getUserById(commit.author_id);
    const repo = getRepoById(commit.repo_id);

    return {
      ...commit,
      author: author ? { id: author.id, name: author.name, username: author.username } : null,
      repo: repo ? { id: repo.id, name: repo.name } : null,
    };
  });
}
