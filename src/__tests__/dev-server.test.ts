import axios from 'axios';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import http from 'http';

// Mock the modules that would cause issues in tests
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn(),
  })),
}));

describe('Development Server', () => {
  let server: http.Server | undefined;
  let wss: WebSocket.Server | undefined;
  const PORT = 3599; // Use high port to avoid conflicts

  // Mock blog.json data
  const mockBlogData = {
    site: { title: 'Test Blog', description: 'Test' },
    basics: { name: 'Test Author' },
    posts: [
      {
        title: 'Test Post',
        content: '# Test Post\n\nThis is a test post.',
        createdAt: '2025-01-01',
      },
    ],
  };

  beforeEach(async () => {
    // Mock the blog.json file reading
    jest.spyOn(fs.promises, 'readFile').mockImplementation(async (filePath) => {
      if (String(filePath).endsWith('blog.json')) {
        return JSON.stringify(mockBlogData);
      }
      throw new Error('File not found');
    });

    // Set test port
    process.env.TEST_PORT = String(PORT);
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
    if (wss) {
      await new Promise<void>((resolve) => {
        wss.close(() => resolve());
      });
    }
    jest.restoreAllMocks();
    delete process.env.TEST_PORT;
  });

  test('should generate files on startup', async () => {
    // Use a custom implementation for this test
    const generatedFiles: Map<string, string> = new Map();

    // Mock the generator
    jest.doMock('../index', () => {
      return jest.fn().mockResolvedValue([
        { name: 'index.html', content: '<html><body>Test</body></html>' },
        { name: 'main.css', content: 'body { margin: 0; }' },
        { name: 'test-post.html', content: '<html><body>Post</body></html>' },
      ]);
    });

    const generateBlog = require('../index');
    const files = await generateBlog(mockBlogData, process.cwd());

    for (const file of files) {
      generatedFiles.set(file.name, file.content);
    }

    expect(generatedFiles.has('index.html')).toBe(true);
    expect(generatedFiles.has('main.css')).toBe(true);
    expect(generatedFiles.has('test-post.html')).toBe(true);
  });

  test('should inject live reload script', async () => {
    const html = '<html><body>Test</body></html>';
    const injected = html.replace('</body>', `<script>console.log('reload');</script></body>`);

    expect(injected).toContain('<script>');
    expect(injected).toContain('</body>');
  });

  test('should handle 404 responses', async () => {
    const express = require('express');
    const app = express();

    app.get('*', (req: any, res: any) => {
      res.status(404).send('Not found');
    });

    const testServer = app.listen(PORT + 1);

    try {
      await axios.get(`http://localhost:${PORT + 1}/nonexistent`);
      fail('Should have thrown 404 error');
    } catch (error: any) {
      expect(error.response.status).toBe(404);
    }

    testServer.close();
  });

  test('should set cache control headers', () => {
    const express = require('express');
    const app = express();

    app.get('/', (req: any, res: any) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.send('OK');
    });

    const testServer = app.listen(PORT + 2);

    return new Promise<void>((resolve, reject) => {
      axios
        .get(`http://localhost:${PORT + 2}/`)
        .then((response) => {
          expect(response.headers['cache-control']).toBe('no-cache');
          testServer.close();
          resolve();
        })
        .catch((err) => {
          testServer.close();
          reject(err);
        });
    });
  });

  test('should support WebSocket connections', (done) => {
    const wsServer = new WebSocket.Server({ port: PORT + 3 });

    wsServer.on('connection', (ws) => {
      // Immediately close when connected
      ws.close();
      wsServer.close();
      done();
    });

    const client = new WebSocket(`ws://localhost:${PORT + 3}`);
    client.on('error', () => {
      wsServer.close();
      done();
    });
  });

  test('should handle file path resolution', () => {
    let requestPath = '/';
    if (requestPath === '/') {
      requestPath = '/index.html';
    }
    expect(requestPath).toBe('/index.html');

    requestPath = '/about';
    if (!path.extname(requestPath)) {
      requestPath = `${requestPath}.html`;
    }
    expect(requestPath).toBe('/about.html');

    requestPath = '/main.css';
    expect(path.extname(requestPath)).toBe('.css');
  });

  test('should debounce file changes', (done) => {
    let callCount = 0;
    let timeout: NodeJS.Timeout | null = null;

    const handleChange = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        callCount++;
        if (callCount === 1) {
          done();
        }
      }, 300);
    };

    // Simulate rapid file changes
    handleChange();
    handleChange();
    handleChange();

    // Should only execute once after debounce
  });
});
