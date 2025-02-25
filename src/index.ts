import axios from 'axios';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';
import Handlebars from 'handlebars';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { Blog, BlogPost, BlogPage, GeneratedFile } from './types';

// Initialize markdown-it with syntax highlighting
const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  highlight: (str: string, lang: string): string => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${
          hljs.highlight(str, { language: lang }).value
        }</code></pre>`;
      } catch (err) {
        console.error('Highlight.js error:', err);
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  },
});

// Load template files
const templateFiles = {
  index: fs.readFileSync(path.join(__dirname, '../templates/index.hbs'), 'utf8'),
  post: fs.readFileSync(path.join(__dirname, '../templates/post.hbs'), 'utf8'),
  page: fs.readFileSync(path.join(__dirname, '../templates/page.hbs'), 'utf8'),
  layout: fs.readFileSync(path.join(__dirname, '../templates/layout.hbs'), 'utf8'),
};

// Load CSS
const mainCss = fs.readFileSync(
  path.join(__dirname, '../templates/main.css'),
  'utf8'
);

// Register layout partial
Handlebars.registerPartial('layout', templateFiles.layout);

// Helper function to format dates
Handlebars.registerHelper('formatDate', function (date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Helper function for equality comparison
Handlebars.registerHelper('eq', function (a: any, b: any) {
  return a === b;
});

async function fetchFile(uri: string): Promise<string> {
  try {
    if (uri.startsWith('http')) {
      // Add cache buster for remote files
      const separator = uri.includes('?') ? '&' : '?';
      const response = await axios.get(
        `${uri}${separator}cb=${Date.now().toString()}`
      );
      return response.data;
    }
    // Local file
    return fs.readFileSync(uri, 'utf8');
  } catch (error) {
    console.error(`Error fetching file ${uri}:`, error);
    return '';
  }
}

async function processContent<T extends BlogPost | BlogPage>(
  items: T[],
  type: 'post' | 'page'
): Promise<T[]> {
  const processedItems: T[] = [];

  for (const item of items) {
    const content = await fetchFile(item.source);
    if (content) {
      const processedItem = { ...item };
      processedItem.content = md.render(content);
      processedItem.slug = slugify(item.title, { lower: true });
      processedItems.push(processedItem);
    }
  }

  return processedItems;
}

const generator = async (blog: Blog): Promise<GeneratedFile[]> => {
  const files: GeneratedFile[] = [];

  // Process posts and pages
  const posts = await processContent(blog.posts, 'post');
  const pages = blog.pages ? await processContent(blog.pages, 'page') : [];

  // Compile templates
  const compiledTemplates = {
    index: Handlebars.compile(templateFiles.index),
    post: Handlebars.compile(templateFiles.post),
    page: Handlebars.compile(templateFiles.page),
  };

  // Generate index page
  files.push({
    name: 'index.html',
    content: compiledTemplates.index({ blog, posts, pages }),
  });

  // Generate post pages
  for (const post of posts) {
    files.push({
      name: `${post.slug}.html`,
      content: compiledTemplates.post({ blog, post, posts, pages }),
    });
  }

  // Generate pages
  for (const page of pages) {
    files.push({
      name: `${page.slug}.html`,
      content: compiledTemplates.page({ blog, page, posts, pages }),
    });
  }

  // Add CSS file
  files.push({
    name: 'main.css',
    content: mainCss,
  });

  return files;
};

export = generator;
