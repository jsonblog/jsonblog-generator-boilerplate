import generator from '../index';
import { Blog } from '../types';
import path from 'path';

describe('Sitemap Generation', () => {
  const mockBlog: Blog = {
    site: {
      title: 'Test Blog',
      description: 'A test blog',
    },
    basics: {
      name: 'Test Author',
    },
    meta: {
      canonical: 'https://testblog.com',
    },
    settings: {
      postsPerPage: 2,
    },
    posts: [
      {
        title: 'First Post',
        content: 'First post content',
        createdAt: '2024-01-01T00:00:00Z',
        tags: ['test'],
        categories: ['Testing'],
      },
      {
        title: 'Second Post',
        content: 'Second post content',
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      },
      {
        title: 'Third Post',
        content: 'Third post content',
        createdAt: '2024-01-04T00:00:00Z',
      },
    ],
    pages: [
      {
        title: 'About',
        content: 'About page content',
      },
      {
        title: 'Contact',
        content: 'Contact page content',
        updatedAt: '2024-01-05T00:00:00Z',
      },
    ],
  };

  test('should generate sitemap.xml file', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));

    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');
    expect(sitemapFile).toBeDefined();
    expect(sitemapFile?.content).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(sitemapFile?.content).toContain(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    );
  });

  test('should include homepage in sitemap', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/</loc>');
    expect(sitemapFile?.content).toContain('<priority>1.0</priority>');
  });

  test('should include all posts in sitemap', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/first-post.html</loc>');
    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/second-post.html</loc>');
    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/third-post.html</loc>');

    // Check lastmod for post with updatedAt
    expect(sitemapFile?.content).toContain('<lastmod>2024-01-03T00:00:00Z</lastmod>');
  });

  test('should include all pages in sitemap', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/about.html</loc>');
    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/contact.html</loc>');

    // Pages should have lower priority
    const pageUrls = sitemapFile?.content.match(/<url>[\s\S]*?\/about\.html[\s\S]*?<\/url>/);
    expect(pageUrls?.[0]).toContain('<priority>0.6</priority>');
  });

  test('should include tag and category pages', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/tag/test.html</loc>');
    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/category/testing.html</loc>');
    expect(sitemapFile?.content).toContain('<priority>0.5</priority>');
  });

  test('should include pagination pages', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    // With 3 posts and 2 per page, we should have page 2
    expect(sitemapFile?.content).toContain('<loc>https://testblog.com/page/2.html</loc>');
    expect(sitemapFile?.content).toContain('<priority>0.7</priority>');
  });

  test('should set appropriate changefreq values', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    // Homepage should be daily
    const homepageUrl = sitemapFile?.content.match(
      /<url>[\s\S]*?<loc>https:\/\/testblog\.com\/<\/loc>[\s\S]*?<\/url>/
    );
    expect(homepageUrl?.[0]).toContain('<changefreq>daily</changefreq>');

    // Posts should be monthly
    const postUrl = sitemapFile?.content.match(/<url>[\s\S]*?first-post\.html[\s\S]*?<\/url>/);
    expect(postUrl?.[0]).toContain('<changefreq>monthly</changefreq>');

    // Tag pages should be weekly
    const tagUrl = sitemapFile?.content.match(/<url>[\s\S]*?\/tag\/[\s\S]*?<\/url>/);
    expect(tagUrl?.[0]).toContain('<changefreq>weekly</changefreq>');
  });

  test('should handle missing canonical URL', async () => {
    const blogWithoutCanonical: Blog = {
      ...mockBlog,
      meta: undefined,
    };

    const files = await generator(blogWithoutCanonical, path.join(__dirname, '../..'));
    const sitemapFile = files.find((f) => f.name === 'sitemap.xml');

    // Should use default URL
    expect(sitemapFile?.content).toContain('<loc>https://example.com/</loc>');
  });
});
