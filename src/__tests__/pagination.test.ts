import generator from '../index';
import { Blog } from '../types';
import path from 'path';

describe('Pagination', () => {
  const createMockBlog = (postCount: number, postsPerPage = 2): Blog => ({
    site: {
      title: 'Test Blog',
      description: 'A test blog',
    },
    basics: {
      name: 'Test Author',
    },
    settings: {
      postsPerPage,
    },
    posts: Array.from({ length: postCount }, (_, i) => ({
      title: `Post ${i + 1}`,
      content: `Content for post ${i + 1}`,
      createdAt: `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    })),
  });

  test('should generate paginated index pages', async () => {
    const blog = createMockBlog(5, 2); // 5 posts, 2 per page = 3 pages
    const files = await generator(blog, path.join(__dirname, '../..'));

    // Check for index.html (page 1)
    const indexPage = files.find((f) => f.name === 'index.html');
    expect(indexPage).toBeDefined();
    expect(indexPage?.content).toContain('Page 1 of 3');
    expect(indexPage?.content).toContain('Post 5'); // Newest first
    expect(indexPage?.content).toContain('Post 4');
    expect(indexPage?.content).not.toContain('Post 3');

    // Check for page/1.html
    const page1 = files.find((f) => f.name === 'page/1.html');
    expect(page1).toBeDefined();

    // Check for page/2.html
    const page2 = files.find((f) => f.name === 'page/2.html');
    expect(page2).toBeDefined();
    expect(page2?.content).toContain('Page 2 of 3');
    expect(page2?.content).toContain('Post 3');
    expect(page2?.content).toContain('Post 2');

    // Check for page/3.html
    const page3 = files.find((f) => f.name === 'page/3.html');
    expect(page3).toBeDefined();
    expect(page3?.content).toContain('Page 3 of 3');
    expect(page3?.content).toContain('Post 1');
  });

  test('should generate correct pagination links', async () => {
    const blog = createMockBlog(5, 2);
    const files = await generator(blog, path.join(__dirname, '../..'));

    // Page 1 should have next but no prev
    const page1 = files.find((f) => f.name === 'index.html');
    expect(page1?.content).toContain('page/2.html');
    expect(page1?.content).toContain('Next →');
    expect(page1?.content).not.toContain('← Previous');

    // Page 2 should have both prev and next
    const page2 = files.find((f) => f.name === 'page/2.html');
    expect(page2?.content).toContain('/'); // Link to index
    expect(page2?.content).toContain('← Previous');
    expect(page2?.content).toContain('page/3.html');
    expect(page2?.content).toContain('Next →');

    // Page 3 should have prev but no next
    const page3 = files.find((f) => f.name === 'page/3.html');
    expect(page3?.content).toContain('page/2.html');
    expect(page3?.content).toContain('← Previous');
    expect(page3?.content).not.toContain('Next →');
  });

  test('should handle single page correctly', async () => {
    const blog = createMockBlog(2, 5); // 2 posts, 5 per page = 1 page
    const files = await generator(blog, path.join(__dirname, '../..'));

    const indexPage = files.find((f) => f.name === 'index.html');
    expect(indexPage?.content).not.toContain('pagination');
    expect(indexPage?.content).toContain('Post 2');
    expect(indexPage?.content).toContain('Post 1');
  });

  test('should use default posts per page when not specified', async () => {
    const blog: Blog = {
      site: { title: 'Test', description: 'Test' },
      basics: { name: 'Author' },
      posts: Array.from({ length: 15 }, (_, i) => ({
        title: `Post ${i + 1}`,
        content: `Content ${i + 1}`,
      })),
    };

    const files = await generator(blog, path.join(__dirname, '../..'));

    // With default 10 posts per page, 15 posts = 2 pages
    const page2 = files.find((f) => f.name === 'page/2.html');
    expect(page2).toBeDefined();

    const page3 = files.find((f) => f.name === 'page/3.html');
    expect(page3).toBeUndefined();
  });
});
