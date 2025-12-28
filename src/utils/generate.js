import { faker } from '@faker-js/faker';

// Seed for deterministic data generation
faker.seed(42);

/**
 * Generate a random user object
 */
export function generateUser(id, options = {}) {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const username = faker.internet.username({ firstName, lastName }).toLowerCase();

  return {
    id,
    username,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    name: `${firstName} ${lastName}`,
    created_at: faker.date.past({ years: 3 }).toISOString(),
    role: faker.helpers.arrayElement(['admin', 'member', 'viewer', 'contributor']),
    deleted: options.deleted || false,
    avatar_url: `https://avatars.example.com/${username}.png`,
  };
}

/**
 * Generate a random repo object
 */
export function generateRepo(id, ownerId, options = {}) {
  const techWords = ['api', 'sdk', 'cli', 'lib', 'core', 'hub', 'flow', 'sync', 'data', 'cloud'];
  const suffixes = ['js', 'go', 'rs', 'py', 'service', 'server', 'client', 'kit', 'tools', 'utils'];

  const name = `${faker.helpers.arrayElement(techWords)}-${faker.helpers.arrayElement(suffixes)}`;

  return {
    id,
    name: `${name}-${id}`,
    owner_id: ownerId,
    description: faker.lorem.sentence(),
    created_at: faker.date.past({ years: 2 }).toISOString(),
    stars: faker.number.int({ min: 0, max: 5000 }),
    language: faker.helpers.arrayElement(['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'Ruby']),
    is_private: faker.datatype.boolean({ probability: 0.2 }),
    default_branch: 'main',
  };
}

/**
 * Generate a random commit object
 */
export function generateCommit(id, repoId, authorId) {
  const commitTypes = ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf'];
  const scopes = ['api', 'ui', 'core', 'auth', 'db', 'config', 'build', 'deps'];

  const type = faker.helpers.arrayElement(commitTypes);
  const scope = faker.helpers.arrayElement(scopes);
  const subject = faker.git.commitMessage();

  return {
    id,
    repo_id: repoId,
    author_id: authorId,
    message: `${type}(${scope}): ${subject}`,
    timestamp: faker.date.recent({ days: 365 }).toISOString(),
    sha: faker.git.commitSha(),
    additions: faker.number.int({ min: 1, max: 500 }),
    deletions: faker.number.int({ min: 0, max: 200 }),
  };
}

/**
 * Generate a file metadata object
 */
export function generateFile(id, repoId) {
  const extensions = ['.js', '.ts', '.py', '.go', '.rs', '.json', '.md', '.yml'];
  const directories = ['src', 'lib', 'pkg', 'internal', 'cmd', 'api', 'utils', 'config'];

  const ext = faker.helpers.arrayElement(extensions);
  const dir = faker.helpers.arrayElement(directories);
  const filename = `${faker.word.noun()}${ext}`;

  return {
    id,
    repo_id: repoId,
    filename: `${dir}/${filename}`,
    size: faker.number.int({ min: 100, max: 10000 }),
    download_url: `/api/medium/files/${id}/download`,
    content_type: getContentType(ext),
    last_modified: faker.date.recent({ days: 30 }).toISOString(),
  };
}

/**
 * Get content type for file extension
 */
function getContentType(ext) {
  const types = {
    '.js': 'application/javascript',
    '.ts': 'application/typescript',
    '.py': 'text/x-python',
    '.go': 'text/x-go',
    '.rs': 'text/x-rust',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.yml': 'text/yaml',
  };
  return types[ext] || 'text/plain';
}

/**
 * Generate Lorem ipsum content for file downloads
 */
export function generateFileContent(fileId) {
  // Use fileId as seed for consistent content
  faker.seed(fileId * 1000);

  const lines = [];
  lines.push(`// File ID: ${fileId}`);
  lines.push(`// Generated content for testing\n`);

  // Generate ~5KB of content
  for (let i = 0; i < 50; i++) {
    if (i % 10 === 0) {
      lines.push(`\n// Section ${Math.floor(i / 10) + 1}`);
    }
    lines.push(`const value_${i} = "${faker.lorem.sentence()}";`);
  }

  lines.push('\n// End of file');

  // Reset seed to maintain determinism elsewhere
  faker.seed(42);

  return lines.join('\n');
}
