import Handlebars from 'handlebars';
import slugify from 'slugify';
import { Blog, BlogPost, BlogPage, GeneratedFile } from './types';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Import markdown-it using require
const MarkdownIt = require('markdown-it');

// Template files
const templateFiles = {
  index: fs.readFileSync(path.join(__dirname, '../templates/index.hbs'), 'utf8'),
  post: fs.readFileSync(path.join(__dirname, '../templates/post.hbs'), 'utf8'),
  page: fs.readFileSync(path.join(__dirname, '../templates/page.hbs'), 'utf8'),
  layout: fs.readFileSync(path.join(__dirname, '../templates/layout.hbs'), 'utf8'),
};

// CSS file
const mainCss = fs.readFileSync(path.join(__dirname, '../templates/main.css'), 'utf8');

// Initialize markdown parser
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

// Register handlebars helpers
Handlebars.registerHelper('formatDate', (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Register partials
Handlebars.registerPartial('layout', templateFiles.layout);
Handlebars.registerPartial('content', '{{> @partial-block }}');

// Fetch file content from URL or local path
async function fetchFile(uri: string, basePath: string): Promise<string | undefined> {
  try {
    if (uri.startsWith('http')) {
      // Remote file
      const response = await axios.get(`${uri}?cb=${new Date().getTime()}`);
      return response.data;
    } else {
      // Local file - resolve relative to blog.json
      console.log('Base path:', basePath);
      const filePath = path.resolve(path.dirname(basePath), uri);
      console.log('Resolved file path:', filePath);
      if (!fs.existsSync(filePath)) {
        console.error('File does not exist:', filePath);
        return undefined;
      }
      const content = fs.readFileSync(filePath, 'utf8');
      console.log('File content type:', typeof content);
      console.log('File content length:', content.length);
      return content;
    }
  } catch (e) {
    console.error('Error fetching file:', e);
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
  console.log(`Processing ${type}s, count:`, items.length);

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
              remove: /[*+~.()'"!:@]/g
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
              remove: /[*+~.()'"!:@]/g
            }),
          };
        } catch (error) {
          console.error(`Failed to render markdown for "${item.title}":`, error);
          return {
            ...item,
            content: '<p>Error: Failed to render content</p>',
            slug: slugify(item.title, { 
              lower: true,
              strict: true,
              remove: /[*+~.()'"!:@]/g
            }),
          };
        }
      } catch (error) {
        console.error(`Failed to process ${type} "${item.title}":`, error);
        return {
          ...item,
          content: '<p>Error: Failed to process content</p>',
          slug: slugify(item.title, { 
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
          }),
        };
      }
    })
  );

  return processedItems.sort((a, b) => {
    if (type === 'post' && 'publishedDate' in a && 'publishedDate' in b) {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    }
    return 0;
  });
}

const generator = async (blog: Blog, basePath: string): Promise<GeneratedFile[]> => {
  console.log('Generator running with basePath:', basePath);
  const files: GeneratedFile[] = [];

  // Process posts and pages
  console.log('Processing posts...');
  const posts = await processContent(blog.posts, 'post', basePath);
  console.log('Posts processed:', posts.length);
  
  console.log('Processing pages...');
  const pages = blog.pages ? await processContent(blog.pages, 'page', basePath) : [];
  console.log('Pages processed:', pages.length);

  // Compile templates
  const compiledTemplates = {
    index: Handlebars.compile(templateFiles.index),
    post: Handlebars.compile(templateFiles.post),
    page: Handlebars.compile(templateFiles.page),
  };

  // Generate index page
  console.log('Generating index page...');
  files.push({
    name: 'index.html',
    content: compiledTemplates.index({ blog, posts, pages }),
  });

  // Generate post pages
  console.log('Generating post pages...');
  for (const post of posts) {
    console.log(`- Generating post: ${post.title}`);
    files.push({
      name: `${post.slug}.html`,
      content: compiledTemplates.post({ blog, post, posts, pages }),
    });
  }

  // Generate pages
  console.log('Generating pages...');
  for (const page of pages) {
    console.log(`- Generating page: ${page.title}`);
    files.push({
      name: `${page.slug}.html`,
      content: compiledTemplates.page({ blog, page, posts, pages }),
    });
  }

  // Add CSS file
  console.log('Adding CSS file...');
  files.push({
    name: 'main.css',
    content: mainCss,
  });

  console.log('Generator completed, files generated:', files.length);
  return files;
};

export = generator;
