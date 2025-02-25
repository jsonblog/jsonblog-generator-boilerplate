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

// Register partials
Handlebars.registerPartial('layout', templateFiles.layout);
Handlebars.registerPartial('content', '{{> @partial-block }}');

// Helper function to format dates
Handlebars.registerHelper('formatDate', function (date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

// Process posts or pages
async function processContent<T extends BlogPost | BlogPage>(
  items: T[],
  type: 'post' | 'page'
): Promise<T[]> {
  if (!items) return [];

  const processedItems = await Promise.all(
    items.map(async (item) => {
      const content = item.content;
      return {
        ...item,
        content: md.render(content),
        slug: item.slug || slugify(item.title, { lower: true }),
      };
    })
  );

  return processedItems.sort((a, b) => {
    if (type === 'post' && 'publishedDate' in a && 'publishedDate' in b) {
      return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
    }
    return 0;
  });
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
