import generator from '../index';
import { Blog } from '../types';
import path from 'path';

describe('RSS Feed Generation', () => {
  const mockBlog: Blog = {
    site: {
      title: 'Test Blog',
      description: 'A test blog for RSS',
    },
    basics: {
      name: 'Test Author',
      image: 'https://example.com/avatar.jpg',
    },
    meta: {
      canonical: 'https://testblog.com',
    },
    posts: [
      {
        title: 'First Post',
        description: 'This is the first post',
        content: '<p>This is the <strong>first</strong> post content with HTML tags.</p>',
        createdAt: '2024-01-01T00:00:00Z',
        tags: ['test', 'rss'],
        categories: ['Testing'],
      },
      {
        title: 'Second Post',
        content:
          '<p>This is a longer post without a description. It contains multiple paragraphs and should be truncated in the RSS feed. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
        createdAt: '2024-01-02T00:00:00Z',
      },
    ],
  };

  test('should generate RSS feed file', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));

    const rssFile = files.find((f) => f.name === 'rss.xml');
    expect(rssFile).toBeDefined();
    expect(rssFile?.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(rssFile?.content).toContain('<rss');
  });

  test('should include blog metadata in RSS', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const rssFile = files.find((f) => f.name === 'rss.xml');

    expect(rssFile?.content).toContain('<title><![CDATA[Test Blog]]></title>');
    expect(rssFile?.content).toContain(
      '<description><![CDATA[A test blog for RSS]]></description>'
    );
    expect(rssFile?.content).toContain('<link>https://testblog.com</link>');
    expect(rssFile?.content).toContain('<generator>JsonBlog Generator</generator>');
  });

  test('should include posts in RSS feed', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const rssFile = files.find((f) => f.name === 'rss.xml');

    // Check first post
    expect(rssFile?.content).toContain('<title><![CDATA[First Post]]></title>');
    expect(rssFile?.content).toContain(
      '<description><![CDATA[This is the first post]]></description>'
    );
    expect(rssFile?.content).toContain('<link>https://testblog.com/first-post.html</link>');

    // Check categories/tags
    expect(rssFile?.content).toContain('<category><![CDATA[test]]></category>');
    expect(rssFile?.content).toContain('<category><![CDATA[rss]]></category>');
    expect(rssFile?.content).toContain('<category><![CDATA[Testing]]></category>');
  });

  test('should strip HTML from content when no description', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const rssFile = files.find((f) => f.name === 'rss.xml');

    // Second post should have stripped HTML content as description
    expect(rssFile?.content).toContain('This is a longer post without a description');
    expect(rssFile?.content).not.toContain('<p>');
    expect(rssFile?.content).not.toContain('</p>');
  });

  test('should limit RSS feed to 20 most recent posts', async () => {
    const blogWithManyPosts: Blog = {
      ...mockBlog,
      posts: Array.from({ length: 25 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content for post ${i + 1}`,
        // Post 1 will have the oldest date, Post 25 the newest
        createdAt: new Date(2024, 0, i + 1).toISOString(),
      })),
    };

    const files = await generator(blogWithManyPosts, path.join(__dirname, '../..'));
    const rssFile = files.find((f) => f.name === 'rss.xml');

    // Count the number of items in the RSS feed
    const itemCount = (rssFile?.content.match(/<item>/g) || []).length;
    expect(itemCount).toBe(20);

    // Verify it has the newest post (Post 25)
    expect(rssFile?.content).toContain('Post 25');
  });

  test('should add RSS link to layout', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const indexPage = files.find((f) => f.name === 'index.html');

    expect(indexPage?.content).toContain('<link rel="alternate" type="application/rss+xml"');
    expect(indexPage?.content).toContain('href="/rss.xml"');
  });
});
