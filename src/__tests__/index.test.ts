import generator = require('../index');
import { GeneratedFile } from '../types';

describe('JsonBlog Generator', () => {
  const mockBlog = {
    site: {
      title: 'Test Blog',
      description: 'A test blog',
    },
    basics: {
      name: 'Test Author',
    },
    posts: [
      {
        title: 'Test Post',
        content: '# Test Content',
        publishedDate: '2025-02-25',
      },
    ],
    pages: [
      {
        title: 'About',
        content: '# About Page',
      },
    ],
  };

  it('should generate expected files', async () => {
    const files: GeneratedFile[] = await generator(mockBlog, '/test/path');

    // Should generate index.html, post page, about page, and CSS
    expect(files).toHaveLength(4);

    // Check for required files
    expect(files.find((f: GeneratedFile) => f.name === 'index.html')).toBeTruthy();
    expect(files.find((f: GeneratedFile) => f.name === 'test-post.html')).toBeTruthy();
    expect(files.find((f: GeneratedFile) => f.name === 'about.html')).toBeTruthy();
    expect(files.find((f: GeneratedFile) => f.name === 'main.css')).toBeTruthy();
  });

  it('should handle markdown content', async () => {
    const files: GeneratedFile[] = await generator(mockBlog, '/test/path');
    const post = files.find((f: GeneratedFile) => f.name === 'test-post.html');

    // Check if markdown was rendered to HTML
    expect(post?.content).toContain('<h1>Test Content</h1>');
  });

  it('should handle missing optional fields', async () => {
    const minimalBlog = {
      site: {
        title: 'Test Blog',
        description: 'A test blog',
      },
      basics: {
        name: 'Test Author',
      },
      posts: [],
    };

    const files: GeneratedFile[] = await generator(minimalBlog, '/test/path');
    expect(files.length).toBeGreaterThan(0);
  });
});
