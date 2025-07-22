import Handlebars from 'handlebars';
import slugify from 'slugify';
import { Blog, BlogPost, BlogPage, GeneratedFile } from './types';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import RSS from 'rss';
import logger from './logger';

// Import markdown-it using require
const MarkdownIt = require('markdown-it');

// Template files
const templateFiles = {
  index: fs.readFileSync(path.join(__dirname, '../templates/index.hbs'), 'utf8'),
  post: fs.readFileSync(path.join(__dirname, '../templates/post.hbs'), 'utf8'),
  page: fs.readFileSync(path.join(__dirname, '../templates/page.hbs'), 'utf8'),
  layout: fs.readFileSync(path.join(__dirname, '../templates/layout.hbs'), 'utf8'),
  tag: fs.readFileSync(path.join(__dirname, '../templates/tag.hbs'), 'utf8'),
  category: fs.readFileSync(path.join(__dirname, '../templates/category.hbs'), 'utf8'),
};

// CSS file
const mainCss = fs.readFileSync(path.join(__dirname, '../templates/main.css'), 'utf8');

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
});

// Register handlebars helpers
Handlebars.registerHelper('formatDate', (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

Handlebars.registerHelper('slugify', (text: string) => {
  return slugify(text, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g,
  });
});

Handlebars.registerHelper('eq', (a: any, b: any) => {
  return a === b;
});

Handlebars.registerHelper('add', (a: number, b: number) => {
  return a + b;
});

Handlebars.registerHelper('subtract', (a: number, b: number) => {
  return a - b;
});

Handlebars.registerHelper('multiply', (a: number, b: number) => {
  return a * b;
});

Handlebars.registerHelper('gt', (a: number, b: number) => {
  return a > b;
});

Handlebars.registerHelper('lt', (a: number, b: number) => {
  return a < b;
});

// Register partials
Handlebars.registerPartial('layout', templateFiles.layout);
Handlebars.registerPartial('content', '{{> @partial-block }}');

// Fetch file content from URL or local path
async function fetchFile(uri: string, basePath: string): Promise<string | undefined> {
  try {
    if (uri.startsWith('http')) {
      // Remote file
      logger.debug({ uri }, 'Fetching remote file');
      const response = await axios.get(`${uri}?cb=${new Date().getTime()}`, {
        timeout: 30000, // 30 second timeout
        maxContentLength: 10 * 1024 * 1024, // 10MB max
      });
      logger.debug({ uri, status: response.status }, 'Remote file fetched successfully');
      return response.data;
    } else {
      // Local file - resolve relative to blog.json
      logger.debug({ uri, basePath }, 'Reading local file');
      const filePath = path.resolve(basePath, uri.replace(/^\.\//, ''));

      if (!fs.existsSync(filePath)) {
        logger.warn({ filePath }, 'File does not exist');
        return undefined;
      }

      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        // 10MB limit
        logger.warn({ filePath, size: stats.size }, 'File too large, skipping');
        return undefined;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      logger.debug({ filePath, size: content.length }, 'Local file loaded successfully');
      return content;
    }
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      logger.error({ uri, errorCode: error.code }, 'Network error fetching file');
    } else if (error.response?.status) {
      logger.error({ uri, status: error.response.status }, 'HTTP error fetching file');
    } else {
      logger.error({ error, uri }, 'Unexpected error fetching file');
    }
    return undefined;
  }
}

// Process posts or pages
async function processContent<T extends BlogPost | BlogPage>(
  items: T[],
  type: 'post' | 'page',
  basePath: string
): Promise<T[]> {
  if (!items) return [];
  logger.info(`Processing ${items.length} ${type}s`);

  const processedItems = await Promise.all(
    items.map(async (item) => {
      try {
        let content = item.content || '';

        // If source is specified, fetch content from file
        if ('source' in item && item.source) {
          const fetchedContent = await fetchFile(item.source, basePath);
          if (fetchedContent) {
            content = fetchedContent;
          }
        }

        // Return error content if no content found
        if (!content) {
          return {
            ...item,
            content: '<p>Error: No content found</p>',
            slug: slugify(item.title, {
              lower: true,
              strict: true,
              remove: /[*+~.()'"!:@]/g,
            }),
          };
        }

        // Try to render markdown, fallback to error message if it fails
        try {
          const rendered = md.render(String(content));
          return {
            ...item,
            content: rendered,
            slug: slugify(item.title, {
              lower: true,
              strict: true,
              remove: /[*+~.()'"!:@]/g,
            }),
          };
        } catch (error) {
          logger.error({ error, title: item.title }, 'Failed to render markdown');
          return {
            ...item,
            content: '<p>Error: Failed to render content</p>',
            slug: slugify(item.title, {
              lower: true,
              strict: true,
              remove: /[*+~.()'"!:@]/g,
            }),
          };
        }
      } catch (error) {
        logger.error({ error, title: item.title, type }, 'Failed to process content');
        return {
          ...item,
          content: '<p>Error: Failed to process content</p>',
          slug: slugify(item.title, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g,
          }),
        };
      }
    })
  );

  return processedItems.sort((a, b) => {
    if (type === 'post' && 'createdAt' in a && 'createdAt' in b) {
      return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    }
    return 0;
  });
}

const generator = async (blog: Blog, basePath: string): Promise<GeneratedFile[]> => {
  logger.info({ basePath }, 'Starting blog generation');
  const files: GeneratedFile[] = [];

  try {
    // Validate input
    if (!blog) {
      throw new Error('Blog configuration is required');
    }

    if (!blog.site || !blog.site.title) {
      throw new Error('Blog site configuration with title is required');
    }

    if (!blog.basics || !blog.basics.name) {
      throw new Error('Blog basics configuration with author name is required');
    }

    // Process posts and pages
    logger.info('Processing posts...');
    const posts = await processContent(blog.posts, 'post', basePath);
    logger.info(`Posts processed: ${posts.length}`);

    logger.info('Processing pages...');
    const pages = blog.pages ? await processContent(blog.pages, 'page', basePath) : [];
    logger.info(`Pages processed: ${pages.length}`);

    // Compile templates
    const compiledTemplates = {
      index: Handlebars.compile(templateFiles.index),
      post: Handlebars.compile(templateFiles.post),
      page: Handlebars.compile(templateFiles.page),
      tag: Handlebars.compile(templateFiles.tag),
      category: Handlebars.compile(templateFiles.category),
    };

    // Pagination settings
    const postsPerPage = blog.settings?.postsPerPage || 10;
    const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage)); // At least 1 page

    // Generate paginated index pages in parallel
    logger.info('Generating paginated index pages...');
    const paginationTasks = [];

    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      const pagePosts = posts.slice(startIndex, endIndex);

      const pagination = {
        currentPage: page,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
        isFirstPage: page === 1,
        isLastPage: page === totalPages,
      };

      const pageData = {
        blog,
        posts: pagePosts,
        pages,
        pagination,
      };

      if (page === 1) {
        // First page is also the index
        paginationTasks.push(
          Promise.resolve({
            name: 'index.html',
            content: compiledTemplates.index(pageData),
          })
        );
      }

      // Generate numbered page
      paginationTasks.push(
        Promise.resolve({
          name: `page/${page}.html`,
          content: compiledTemplates.index(pageData),
        })
      );
    }

    const paginationFiles = await Promise.all(paginationTasks);
    files.push(...paginationFiles);

    // Generate post pages in parallel
    logger.info('Generating post pages...');
    const postFiles = await Promise.all(
      posts.map(async (post) => {
        logger.debug(`Generating post: ${post.title}`);
        return {
          name: `${post.slug}.html`,
          content: compiledTemplates.post({ blog, post, posts, pages }),
        };
      })
    );
    files.push(...postFiles);

    // Generate pages in parallel
    logger.info('Generating static pages...');
    const pageFiles = await Promise.all(
      pages.map(async (page) => {
        logger.debug(`Generating page: ${page.title}`);
        return {
          name: `${page.slug}.html`,
          content: compiledTemplates.page({ blog, page, posts, pages }),
        };
      })
    );
    files.push(...pageFiles);

    // Generate tag pages
    logger.info('Generating tag pages...');
    const tagMap = new Map<string, BlogPost[]>();

    // Collect all tags
    for (const post of posts) {
      if (post.tags) {
        for (const tag of post.tags) {
          if (!tagMap.has(tag)) {
            tagMap.set(tag, []);
          }
          tagMap.get(tag)!.push(post);
        }
      }
    }

    // Generate tag pages in parallel
    const tagFiles = await Promise.all(
      Array.from(tagMap.entries()).map(async ([tag, tagPosts]) => {
        const tagSlug = slugify(tag, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });
        logger.debug(`Generating tag page: ${tag}`);
        return {
          name: `tag/${tagSlug}.html`,
          content: compiledTemplates.tag({ blog, tag, posts: tagPosts, pages }),
        };
      })
    );
    files.push(...tagFiles);

    // Generate category pages
    logger.info('Generating category pages...');
    const categoryMap = new Map<string, BlogPost[]>();

    // Collect all categories
    for (const post of posts) {
      if (post.categories) {
        for (const category of post.categories) {
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push(post);
        }
      }
    }

    // Generate category pages in parallel
    const categoryFiles = await Promise.all(
      Array.from(categoryMap.entries()).map(async ([category, categoryPosts]) => {
        const categorySlug = slugify(category, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });
        logger.debug(`Generating category page: ${category}`);
        return {
          name: `category/${categorySlug}.html`,
          content: compiledTemplates.category({ blog, category, posts: categoryPosts, pages }),
        };
      })
    );
    files.push(...categoryFiles);

    // Generate RSS feed
    logger.info('Generating RSS feed...');
    const siteUrl = blog.meta?.canonical || 'https://example.com';

    const feed = new RSS({
      title: blog.site.title,
      description: blog.site.description,
      generator: 'JsonBlog Generator',
      feed_url: `${siteUrl}/rss.xml`,
      site_url: siteUrl,
      image_url: blog.basics.image,
      language: 'en',
      pubDate: new Date().toUTCString(),
      ttl: 60,
    });

    // Add posts to RSS feed (limit to 20 most recent)
    const rssPosts = posts.slice(0, 20);
    for (const post of rssPosts) {
      // Strip HTML tags for description
      const stripHtml = (html: string): string => {
        return html.replace(/<[^>]*>/g, '').trim();
      };

      const plainTextContent = post.content ? stripHtml(post.content) : '';
      const description =
        post.description ||
        plainTextContent.substring(0, 200) + (plainTextContent.length > 200 ? '...' : '');

      feed.item({
        title: post.title,
        description: description,
        url: `${siteUrl}/${post.slug}.html`,
        guid: `${siteUrl}/${post.slug}.html`,
        date: post.createdAt || new Date().toISOString(),
        categories: [...(post.tags || []), ...(post.categories || [])],
      });
    }

    files.push({
      name: 'rss.xml',
      content: feed.xml({ indent: true }),
    });

    // Generate sitemap
    logger.info('Generating sitemap...');
    const generateSitemap = (): string => {
      const urls: string[] = [];

      // Add homepage
      urls.push(`  <url>
    <loc>${siteUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`);

      // Add posts
      for (const post of posts) {
        urls.push(`  <url>
    <loc>${siteUrl}/${post.slug}.html</loc>
    <lastmod>${post.updatedAt || post.createdAt || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
      }

      // Add pages
      for (const page of pages) {
        urls.push(`  <url>
    <loc>${siteUrl}/${page.slug}.html</loc>
    <lastmod>${page.updatedAt || page.createdAt || new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
      }

      // Add tag pages
      for (const [tag] of tagMap) {
        const tagSlug = slugify(tag, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });
        urls.push(`  <url>
    <loc>${siteUrl}/tag/${tagSlug}.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);
      }

      // Add category pages
      for (const [category] of categoryMap) {
        const categorySlug = slugify(category, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        });
        urls.push(`  <url>
    <loc>${siteUrl}/category/${categorySlug}.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`);
      }

      // Add pagination pages
      for (let page = 2; page <= totalPages; page++) {
        urls.push(`  <url>
    <loc>${siteUrl}/page/${page}.html</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`);
      }

      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
    };

    files.push({
      name: 'sitemap.xml',
      content: generateSitemap(),
    });

    // Add CSS file
    logger.info('Adding CSS file...');
    files.push({
      name: 'main.css',
      content: mainCss,
    });

    logger.info({ filesGenerated: files.length }, 'Blog generation completed successfully');
    return files;
  } catch (error) {
    logger.error({ error }, 'Blog generation failed');
    throw error;
  }
};

export = generator;
