import { faker } from '@faker-js/faker';
import { generateUser, generateRepo, generateCommit, generateFile } from '../utils/generate.js';

// Seed faker for deterministic data
faker.seed(42);

/**
 * Generate all mock data with proper relationships
 */
function generateAllData() {
  console.log('Generating mock data...');

  // Generate 20 users
  // - 15 users have repos, 5 have no repos
  // - 1 user marked as deleted (user 18)
  const users = [];
  for (let i = 1; i <= 20; i++) {
    users.push(generateUser(i, { deleted: i === 18 }));
  }

  // Track which users have repos (1-15 have repos, 16-20 have no repos)
  const usersWithRepos = users.slice(0, 15).map(u => u.id);

  // Generate 50 repos
  // - 45 repos have valid owner_id
  // - 5 repos reference invalid/deleted owners (owner_id 18, 21, 22, 23, 24)
  // - 10 repos have no commits (repos 41-50)
  const repos = [];
  for (let i = 1; i <= 50; i++) {
    let ownerId;
    if (i <= 45) {
      // Valid owner - pick from users with repos
      ownerId = usersWithRepos[i % usersWithRepos.length];
    } else if (i <= 47) {
      // Reference deleted user
      ownerId = 18;
    } else {
      // Reference non-existent user
      ownerId = 20 + (i - 47);
    }
    repos.push(generateRepo(i, ownerId));
  }

  // Generate 200 commits
  // - Distributed across repos 1-40 (repos 41-50 have no commits)
  // - Some commits reference deleted users
  const commits = [];
  let commitId = 1;

  // Distribute commits across repos 1-40
  for (let repoId = 1; repoId <= 40; repoId++) {
    // Variable number of commits per repo (3-8)
    const numCommits = 3 + (repoId % 6);

    for (let j = 0; j < numCommits && commitId <= 200; j++) {
      // Most commits from valid users, some from deleted user
      let authorId;
      if (commitId % 20 === 0) {
        // Every 20th commit is from deleted user
        authorId = 18;
      } else {
        // Pick a random valid user
        authorId = (commitId % 17) + 1;
      }

      commits.push(generateCommit(commitId, repoId, authorId));
      commitId++;
    }
  }

  // Generate 30 files distributed across repos
  const files = [];
  for (let i = 1; i <= 30; i++) {
    const repoId = ((i - 1) % 25) + 1; // Distribute across first 25 repos
    files.push(generateFile(i, repoId));
  }

  console.log(`Generated: ${users.length} users, ${repos.length} repos, ${commits.length} commits, ${files.length} files`);

  return { users, repos, commits, files };
}

// Generate data on module load
const data = generateAllData();

export const users = data.users;
export const repos = data.repos;
export const commits = data.commits;
export const files = data.files;

// Helper functions for data queries

/**
 * Get user by ID
 */
export function getUserById(id) {
  return users.find(u => u.id === parseInt(id));
}

/**
 * Get repos by owner ID
 */
export function getReposByOwner(ownerId) {
  return repos.filter(r => r.owner_id === parseInt(ownerId));
}

/**
 * Get repo by ID
 */
export function getRepoById(id) {
  return repos.find(r => r.id === parseInt(id));
}

/**
 * Get commits by repo ID
 */
export function getCommitsByRepo(repoId) {
  return commits.filter(c => c.repo_id === parseInt(repoId));
}

/**
 * Get commit by ID
 */
export function getCommitById(id) {
  return commits.find(c => c.id === parseInt(id));
}

/**
 * Get files by repo ID
 */
export function getFilesByRepo(repoId) {
  return files.filter(f => f.repo_id === parseInt(repoId));
}

/**
 * Get file by ID
 */
export function getFileById(id) {
  return files.find(f => f.id === parseInt(id));
}

/**
 * Paginate an array
 */
export function paginate(array, page = 1, perPage = 10) {
  const start = (page - 1) * perPage;
  const end = start + perPage;
  return {
    data: array.slice(start, end),
    total: array.length,
    page: parseInt(page),
    per_page: perPage,
    total_pages: Math.ceil(array.length / perPage),
  };
}

/**
 * Get summary statistics
 */
export function getStats() {
  const activeUsers = users.filter(u => !u.deleted).length;
  const reposWithCommits = new Set(commits.map(c => c.repo_id)).size;

  return {
    total_users: users.length,
    active_users: activeUsers,
    deleted_users: users.length - activeUsers,
    total_repos: repos.length,
    repos_with_commits: reposWithCommits,
    repos_without_commits: repos.length - reposWithCommits,
    total_commits: commits.length,
    total_files: files.length,
    languages: [...new Set(repos.map(r => r.language))],
  };
}
