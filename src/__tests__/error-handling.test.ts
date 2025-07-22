import generator from '../index';
import { Blog } from '../types';
import path from 'path';

describe('Error Handling', () => {
  const basePath = path.join(__dirname, '../..');

  test('should throw error when blog config is missing', async () => {
    await expect(generator(null as any, basePath)).rejects.toThrow(
      'Blog configuration is required'
    );
  });

  test('should throw error when site config is missing', async () => {
    const invalidBlog: any = {
      basics: { name: 'Author' },
      posts: [],
    };

    await expect(generator(invalidBlog, basePath)).rejects.toThrow(
      'Blog site configuration with title is required'
    );
  });

  test('should throw error when basics config is missing', async () => {
    const invalidBlog: any = {
      site: { title: 'Test Blog', description: 'Test' },
      posts: [],
    };

    await expect(generator(invalidBlog, basePath)).rejects.toThrow(
      'Blog basics configuration with author name is required'
    );
  });

  test('should handle missing post content gracefully', async () => {
    const blog: Blog = {
      site: { title: 'Test Blog', description: 'Test' },
      basics: { name: 'Author' },
      posts: [
        {
          title: 'Post without content',
          // No content or source
        },
      ],
    };

    const files = await generator(blog, basePath);
    const postFile = files.find((f) => f.name === 'post-without-content.html');

    expect(postFile).toBeDefined();
    expect(postFile?.content).toContain('Error: No content found');
  });

  test('should handle invalid markdown gracefully', async () => {
    const blog: Blog = {
      site: { title: 'Test Blog', description: 'Test' },
      basics: { name: 'Author' },
      posts: [
        {
          title: 'Post with invalid content',
          content: null as any, // Invalid content type
        },
      ],
    };

    const files = await generator(blog, basePath);
    const postFile = files.find((f) => f.name === 'post-with-invalid-content.html');

    expect(postFile).toBeDefined();
    // Should either render empty or show error
    expect(postFile?.content).toBeDefined();
  });

  test('should handle missing remote file gracefully', async () => {
    const blog: Blog = {
      site: { title: 'Test Blog', description: 'Test' },
      basics: { name: 'Author' },
      posts: [
        {
          title: 'Post with missing remote',
          source: 'https://nonexistent.example.com/404.md',
        },
      ],
    };

    const files = await generator(blog, basePath);
    const postFile = files.find((f) => f.name === 'post-with-missing-remote.html');

    expect(postFile).toBeDefined();
    expect(postFile?.content).toContain('Error: No content found');
  });

  test('should handle missing local file gracefully', async () => {
    const blog: Blog = {
      site: { title: 'Test Blog', description: 'Test' },
      basics: { name: 'Author' },
      posts: [
        {
          title: 'Post with missing local',
          source: './nonexistent-file.md',
        },
      ],
    };

    const files = await generator(blog, basePath);
    const postFile = files.find((f) => f.name === 'post-with-missing-local.html');

    expect(postFile).toBeDefined();
    expect(postFile?.content).toContain('Error: No content found');
  });

  test('should handle empty posts array', async () => {
    const blog: Blog = {
      site: { title: 'Test Blog', description: 'Test' },
      basics: { name: 'Author' },
      posts: [],
    };

    const files = await generator(blog, basePath);

    // Should still generate index and CSS
    expect(files.some((f) => f.name === 'index.html')).toBe(true);
    expect(files.some((f) => f.name === 'main.css')).toBe(true);
    expect(files.some((f) => f.name === 'rss.xml')).toBe(true);
    expect(files.some((f) => f.name === 'sitemap.xml')).toBe(true);
  });

  test('should continue processing when one post fails', async () => {
    const blog: Blog = {
      site: { title: 'Test Blog', description: 'Test' },
      basics: { name: 'Author' },
      posts: [
        {
          title: 'Good Post',
          content: 'This is good content',
        },
        {
          title: 'Bad Post',
          source: './nonexistent.md',
        },
        {
          title: 'Another Good Post',
          content: 'More good content',
        },
      ],
    };

    const files = await generator(blog, basePath);

    // Should generate all three posts plus pagination page
    expect(
      files.filter(
        (f) => f.name.endsWith('.html') && f.name !== 'index.html' && !f.name.startsWith('page/')
      ).length
    ).toBe(3);

    // Good posts should have content
    const goodPost = files.find((f) => f.name === 'good-post.html');
    expect(goodPost?.content).toContain('This is good content');

    // Bad post should have error message
    const badPost = files.find((f) => f.name === 'bad-post.html');
    expect(badPost?.content).toContain('Error: No content found');
  });
});
