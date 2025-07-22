import generator from '../index';
import { Blog } from '../types';
import path from 'path';

describe('Parallel Processing', () => {
  test('should process multiple posts efficiently', async () => {
    // Create a blog with many posts to test parallel processing
    const blog: Blog = {
      site: {
        title: 'Test Blog',
        description: 'Testing parallel processing',
      },
      basics: {
        name: 'Test Author',
      },
      posts: Array.from({ length: 50 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content for post ${i + 1}. This is a longer content to simulate real posts with substantial text.`,
        createdAt: new Date(2024, 0, i + 1).toISOString(),
        tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`],
        categories: [`category${i % 3}`],
      })),
      pages: Array.from({ length: 10 }, (_, i) => ({
        title: `Page ${i + 1}`,
        content: `Content for page ${i + 1}`,
      })),
      settings: {
        postsPerPage: 10,
      },
    };

    const startTime = Date.now();
    const files = await generator(blog, path.join(__dirname, '../..'));
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should generate all expected files
    expect(files.length).toBeGreaterThan(60); // 50 posts + 10 pages + index + pagination + tags + categories + RSS + sitemap + CSS
    
    // Verify some specific files exist
    expect(files.some(f => f.name === 'index.html')).toBe(true);
    expect(files.some(f => f.name === 'post-1.html')).toBe(true);
    expect(files.some(f => f.name === 'post-50.html')).toBe(true);
    expect(files.some(f => f.name === 'page-1.html')).toBe(true);
    expect(files.some(f => f.name === 'tag/tag0.html')).toBe(true);
    expect(files.some(f => f.name === 'category/category0.html')).toBe(true);
    expect(files.some(f => f.name === 'rss.xml')).toBe(true);
    expect(files.some(f => f.name === 'sitemap.xml')).toBe(true);
    
    // Performance check - should complete reasonably quickly
    // This is a soft check as performance varies by machine
    expect(duration).toBeLessThan(5000); // Should complete in less than 5 seconds
    
    console.log(`Generated ${files.length} files in ${duration}ms`);
  });

  test('should handle concurrent file generation without errors', async () => {
    const blog: Blog = {
      site: {
        title: 'Concurrent Test',
        description: 'Testing concurrent file generation',
      },
      basics: {
        name: 'Test Author',
      },
      posts: [
        {
          title: 'Post One',
          content: 'Content one',
          tags: ['tag1', 'tag2'],
          categories: ['cat1'],
        },
        {
          title: 'Post Two',
          content: 'Content two',
          tags: ['tag1', 'tag3'],
          categories: ['cat1', 'cat2'],
        },
        {
          title: 'Post Three',
          content: 'Content three',
          tags: ['tag2', 'tag3'],
          categories: ['cat2'],
        },
      ],
    };

    // Run generator multiple times concurrently
    const results = await Promise.all([
      generator(blog, path.join(__dirname, '../..')),
      generator(blog, path.join(__dirname, '../..')),
      generator(blog, path.join(__dirname, '../..')),
    ]);

    // All runs should produce the same number of files
    expect(results[0].length).toBe(results[1].length);
    expect(results[1].length).toBe(results[2].length);
    
    // Verify content consistency
    const firstRunIndex = results[0].find(f => f.name === 'index.html');
    const secondRunIndex = results[1].find(f => f.name === 'index.html');
    expect(firstRunIndex?.content).toBe(secondRunIndex?.content);
  });
});