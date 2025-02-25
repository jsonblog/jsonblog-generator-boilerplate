"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const handlebars_1 = __importDefault(require("handlebars"));
const slugify_1 = __importDefault(require("slugify"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const axios_1 = __importDefault(require("axios"));
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
handlebars_1.default.registerHelper('formatDate', (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});
// Register partials
handlebars_1.default.registerPartial('layout', templateFiles.layout);
handlebars_1.default.registerPartial('content', '{{> @partial-block }}');
// Fetch file content from URL or local path
async function fetchFile(uri, basePath) {
    try {
        if (uri.startsWith('http')) {
            // Remote file
            const response = await axios_1.default.get(`${uri}?cb=${new Date().getTime()}`);
            return response.data;
        }
        else {
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
    }
    catch (e) {
        console.error('Error fetching file:', e);
        return undefined;
    }
}
// Process posts or pages
async function processContent(items, type, basePath) {
    if (!items)
        return [];
    console.log(`Processing ${type}s, count:`, items.length);
    const processedItems = await Promise.all(items.map(async (item) => {
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
                    slug: (0, slugify_1.default)(item.title, {
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
                    slug: (0, slugify_1.default)(item.title, {
                        lower: true,
                        strict: true,
                        remove: /[*+~.()'"!:@]/g
                    }),
                };
            }
            catch (error) {
                console.error(`Failed to render markdown for "${item.title}":`, error);
                return {
                    ...item,
                    content: '<p>Error: Failed to render content</p>',
                    slug: (0, slugify_1.default)(item.title, {
                        lower: true,
                        strict: true,
                        remove: /[*+~.()'"!:@]/g
                    }),
                };
            }
        }
        catch (error) {
            console.error(`Failed to process ${type} "${item.title}":`, error);
            return {
                ...item,
                content: '<p>Error: Failed to process content</p>',
                slug: (0, slugify_1.default)(item.title, {
                    lower: true,
                    strict: true,
                    remove: /[*+~.()'"!:@]/g
                }),
            };
        }
    }));
    return processedItems.sort((a, b) => {
        if (type === 'post' && 'publishedDate' in a && 'publishedDate' in b) {
            return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }
        return 0;
    });
}
const generator = async (blog, basePath) => {
    console.log('Generator running with basePath:', basePath);
    const files = [];
    // Process posts and pages
    console.log('Processing posts...');
    const posts = await processContent(blog.posts, 'post', basePath);
    console.log('Posts processed:', posts.length);
    console.log('Processing pages...');
    const pages = blog.pages ? await processContent(blog.pages, 'page', basePath) : [];
    console.log('Pages processed:', pages.length);
    // Compile templates
    const compiledTemplates = {
        index: handlebars_1.default.compile(templateFiles.index),
        post: handlebars_1.default.compile(templateFiles.post),
        page: handlebars_1.default.compile(templateFiles.page),
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
module.exports = generator;
