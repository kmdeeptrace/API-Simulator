import Fastify from 'fastify';
import easyRoutes from './routes/easy.js';
import mediumRoutes from './routes/medium.js';
import hardRoutes from './routes/hard.js';
import docsRoutes from './routes/docs.js';

// Create Fastify instance
const fastify = Fastify({
  logger: false, // We'll use custom logging
});

// Custom request logging
fastify.addHook('onResponse', async (request, reply) => {
  const responseTime = reply.elapsedTime.toFixed(2);
  const method = request.method;
  const url = request.url;
  const status = reply.statusCode;

  // Color code status
  let statusColor;
  if (status >= 500) statusColor = '\x1b[31m'; // Red
  else if (status >= 400) statusColor = '\x1b[33m'; // Yellow
  else if (status >= 300) statusColor = '\x1b[36m'; // Cyan
  else statusColor = '\x1b[32m'; // Green

  console.log(`${method.padEnd(6)} ${url.padEnd(50)} ${statusColor}${status}\x1b[0m ${responseTime}ms`);
});

// Bearer token authentication middleware
fastify.addHook('preHandler', async (request, reply) => {
  // Skip auth for docs endpoints, root, and health check
  if (request.url.startsWith('/api/docs') || request.url === '/' || request.url === '/health') {
    return;
  }

  const auth = request.headers.authorization;

  // Check for Bearer token
  if (!auth || !auth.startsWith('Bearer ')) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Use: Authorization: Bearer <token>'
    });
  }

  // Extract token (we don't validate it, just check it exists)
  const token = auth.substring(7); // Remove "Bearer "

  if (!token || token.trim().length === 0) {
    return reply.code(401).send({
      error: 'Unauthorized',
      message: 'Bearer token is empty'
    });
  }

  // Token exists, allow request through
  // For testing we accept any token
  request.token = token;
});

// Register routes with prefixes
fastify.register(easyRoutes, { prefix: '/api/easy' });
fastify.register(mediumRoutes, { prefix: '/api/medium' });
fastify.register(hardRoutes, { prefix: '/api/hard' });
fastify.register(docsRoutes, { prefix: '/api/docs' });

// Root endpoint
fastify.get('/', async (request, reply) => {
  return {
    name: 'Mock SaaS API',
    version: '1.0.0',
    description: 'A mock API server for testing DeepTrace dynamic crawling',
    tiers: {
      easy: '/api/easy/*',
      medium: '/api/medium/*',
      hard: '/api/hard/*',
    },
    documentation: {
      openapi: '/api/docs',
      ui: '/api/docs/ui',
    },
  };
});

// Health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// 404 handler
fastify.setNotFoundHandler(async (request, reply) => {
  reply.code(404);
  return {
    statusCode: 404,
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} not found`,
  };
});

// Error handler
fastify.setErrorHandler(async (error, request, reply) => {
  console.error(`Error: ${error.message}`);
  reply.code(error.statusCode || 500);
  return {
    statusCode: error.statusCode || 500,
    error: error.name || 'Internal Server Error',
    message: error.message,
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 8000;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log('\n┌─────────────────────────────────────────────────────────────┐');
    console.log('│                    Mock SaaS API Server                     │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log(`│  Server running at: http://localhost:${port}                   │`);
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│  Endpoints:                                                 │');
    console.log('│    Easy tier:   /api/easy/*   (static data)                 │');
    console.log('│    Medium tier: /api/medium/* (dynamic params)              │');
    console.log('│    Hard tier:   /api/hard/*   (error simulation)            │');
    console.log('│    Docs:        /api/docs     (OpenAPI spec)                │');
    console.log('│    Docs UI:     /api/docs/ui  (HTML documentation)          │');
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│  Press Ctrl+C to stop                                       │');
    console.log('└─────────────────────────────────────────────────────────────┘\n');
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();
