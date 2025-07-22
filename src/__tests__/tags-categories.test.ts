import generator from '../index';
import { Blog } from '../types';
import path from 'path';

describe('Tags and Categories', () => {
  const mockBlog: Blog = {
    site: {
      title: 'Test Blog',
      description: 'A test blog',
    },
    basics: {
      name: 'Test Author',
    },
    posts: [
      {
        title: 'Post with Tags',
        content: 'This is a test post',
        tags: ['javascript', 'tutorial'],
        categories: ['Programming'],
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        title: 'Another Tagged Post',
        content: 'Another test post',
        tags: ['javascript', 'nodejs'],
        categories: ['Programming', 'Backend'],
        createdAt: '2024-01-02T00:00:00Z',
      },
    ],
  };

  test('should generate tag pages', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    
    // Check if tag pages were generated
    const tagPages = files.filter(f => f.name.startsWith('tag/'));
    expect(tagPages.length).toBe(3); // javascript, tutorial, nodejs
    
    // Verify tag page names
    const tagNames = tagPages.map(f => f.name);
    expect(tagNames).toContain('tag/javascript.html');
    expect(tagNames).toContain('tag/tutorial.html');
    expect(tagNames).toContain('tag/nodejs.html');
    
    // Check tag page content
    const jsTagPage = tagPages.find(f => f.name === 'tag/javascript.html');
    expect(jsTagPage?.content).toContain('Posts tagged with "javascript"');
    expect(jsTagPage?.content).toContain('2 post'); // Should have 2 posts
  });

  test('should generate category pages', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    
    // Check if category pages were generated
    const categoryPages = files.filter(f => f.name.startsWith('category/'));
    expect(categoryPages.length).toBe(2); // Programming, Backend
    
    // Verify category page names
    const categoryNames = categoryPages.map(f => f.name);
    expect(categoryNames).toContain('category/programming.html');
    expect(categoryNames).toContain('category/backend.html');
    
    // Check category page content
    const progCategoryPage = categoryPages.find(f => f.name === 'category/programming.html');
    expect(progCategoryPage?.content).toContain('Posts in category "Programming"');
    expect(progCategoryPage?.content).toContain('2 post'); // Should have 2 posts
  });

  test('should display tags and categories on post pages', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    
    const postPage = files.find(f => f.name === 'post-with-tags.html');
    expect(postPage?.content).toContain('Tags:');
    expect(postPage?.content).toContain('javascript');
    expect(postPage?.content).toContain('tutorial');
    expect(postPage?.content).toContain('Categories:');
    expect(postPage?.content).toContain('Programming');
  });

  test('should display tags and categories on index page', async () => {
    const files = await generator(mockBlog, path.join(__dirname, '../..'));
    
    const indexPage = files.find(f => f.name === 'index.html');
    expect(indexPage?.content).toContain('tag/javascript.html');
    expect(indexPage?.content).toContain('category/programming.html');
  });
});