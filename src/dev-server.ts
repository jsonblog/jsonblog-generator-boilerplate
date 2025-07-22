import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import chokidar from 'chokidar';
import WebSocket from 'ws';
import generateBlog = require('./index');
import { Blog } from './types';

const app = express();
const PORT = process.env.TEST_PORT
  ? parseInt(process.env.TEST_PORT, 10)
  : process.env.PORT
    ? parseInt(process.env.PORT, 10)
    : 3500;

let wss: WebSocket.Server;
let blogData: Blog;
let generatedFiles: Map<string, string> = new Map();

const injectLiveReloadScript = (html: string): string => {
  const script = `
    <script>
      (function() {
        const ws = new WebSocket('ws://localhost:${PORT}');
        ws.onmessage = (event) => {
          if (event.data === 'reload') {
            location.reload();
          }
        };
        ws.onclose = () => {
          setTimeout(() => location.reload(), 1000);
        };
      })();
    </script>
  `;
  return html.replace('</body>', `${script}</body>`);
};

async function loadBlogData(): Promise<void> {
  try {
    const blogJsonPath = path.join(process.cwd(), 'blog.json');
    const data = await fs.readFile(blogJsonPath, 'utf-8');
    blogData = JSON.parse(data);
  } catch (error) {
    console.error('Error loading blog.json:', error);
    throw error;
  }
}

async function generateAndCacheFiles(): Promise<void> {
  if (!blogData) return;

  try {
    const files = await generateBlog(blogData, process.cwd());
    generatedFiles.clear();

    for (const file of files) {
      let content = file.content;
      if (file.name.endsWith('.html')) {
        content = injectLiveReloadScript(content);
      }
      generatedFiles.set(file.name, content);
    }

    console.log(`Generated ${files.length} files`);
  } catch (error) {
    console.error('Error generating blog:', error);
  }
}

function notifyClients(): void {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send('reload');
      }
    });
  }
}

let changeTimeout: NodeJS.Timeout | null = null;

async function handleFileChange(filePath: string): Promise<void> {
  console.log(`File changed: ${filePath}`);

  // Debounce file changes
  if (changeTimeout) {
    clearTimeout(changeTimeout);
  }

  changeTimeout = setTimeout(async () => {
    if (filePath.endsWith('blog.json')) {
      await loadBlogData();
    }

    await generateAndCacheFiles();
    notifyClients();
  }, 300);
}

app.get('*', (req, res) => {
  let requestPath = req.path === '/' ? '/index.html' : req.path;

  if (!path.extname(requestPath)) {
    requestPath = `${requestPath}.html`;
  }

  const fileName = requestPath.substring(1);

  // Set cache control headers
  res.setHeader('Cache-Control', 'no-cache');

  if (generatedFiles.has(fileName)) {
    const content = generatedFiles.get(fileName)!;
    const contentType = fileName.endsWith('.css') ? 'text/css' : 'text/html';
    res.contentType(contentType).send(content);
  } else {
    res.status(404).send(`
      <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 Not Found</h1>
          <p>The requested file "${fileName}" was not found.</p>
          <p><a href="/">Go to homepage</a></p>
        </body>
      </html>
    `);
  }
});

export async function startDevServer(): Promise<void> {
  await loadBlogData();
  await generateAndCacheFiles();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Development server running at http://localhost:${PORT}`);
    console.log('👀 Watching for changes...\n');
  });

  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('pong', () => {
      // Handle pong for keepalive
    });
  });

  const watcher = chokidar.watch(['blog.json', 'src/**/*.ts', 'templates/**/*', 'assets/**/*'], {
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on('change', handleFileChange);
  watcher.on('add', handleFileChange);
  watcher.on('unlink', handleFileChange);

  process.on('SIGINT', () => {
    console.log('\n✨ Shutting down development server...');
    watcher.close();
    wss.close();
    server.close();
    process.exit(0);
  });
}

if (require.main === module) {
  startDevServer().catch(console.error);
}
