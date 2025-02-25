"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const slugify_1 = __importDefault(require("slugify"));
const handlebars_1 = __importDefault(require("handlebars"));
const markdown_it_1 = __importDefault(require("markdown-it"));
const highlight_js_1 = __importDefault(require("highlight.js"));
// Initialize markdown-it with syntax highlighting
const md = new markdown_it_1.default({
    html: true,
    breaks: false,
    linkify: true,
    highlight: (str, lang) => {
        if (lang && highlight_js_1.default.getLanguage(lang)) {
            try {
                return `<pre class="hljs"><code>${highlight_js_1.default.highlight(str, { language: lang }).value}</code></pre>`;
            }
            catch (err) {
                console.error('Highlight.js error:', err);
            }
        }
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
    },
});
// Load template files
const templateFiles = {
    index: fs_1.default.readFileSync(path_1.default.join(__dirname, '../templates/index.hbs'), 'utf8'),
    post: fs_1.default.readFileSync(path_1.default.join(__dirname, '../templates/post.hbs'), 'utf8'),
    page: fs_1.default.readFileSync(path_1.default.join(__dirname, '../templates/page.hbs'), 'utf8'),
    layout: fs_1.default.readFileSync(path_1.default.join(__dirname, '../templates/layout.hbs'), 'utf8'),
};
// Load CSS
const mainCss = fs_1.default.readFileSync(path_1.default.join(__dirname, '../templates/main.css'), 'utf8');
// Register layout partial
handlebars_1.default.registerPartial('layout', templateFiles.layout);
// Helper function to format dates
handlebars_1.default.registerHelper('formatDate', function (date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});
// Helper function for equality comparison
handlebars_1.default.registerHelper('eq', function (a, b) {
    return a === b;
});
async function fetchFile(uri) {
    try {
        if (uri.startsWith('http')) {
            // Add cache buster for remote files
            const separator = uri.includes('?') ? '&' : '?';
            const response = await axios_1.default.get(`${uri}${separator}cb=${Date.now().toString()}`);
            return response.data;
        }
        // Local file
        return fs_1.default.readFileSync(uri, 'utf8');
    }
    catch (error) {
        console.error(`Error fetching file ${uri}:`, error);
        return '';
    }
}
async function processContent(items, type) {
    const processedItems = [];
    for (const item of items) {
        const content = await fetchFile(item.source);
        if (content) {
            const processedItem = { ...item };
            processedItem.content = md.render(content);
            processedItem.slug = (0, slugify_1.default)(item.title, { lower: true });
            processedItems.push(processedItem);
        }
    }
    return processedItems;
}
const generator = async (blog) => {
    const files = [];
    // Process posts and pages
    const posts = await processContent(blog.posts, 'post');
    const pages = blog.pages ? await processContent(blog.pages, 'page') : [];
    // Compile templates
    const compiledTemplates = {
        index: handlebars_1.default.compile(templateFiles.index),
        post: handlebars_1.default.compile(templateFiles.post),
        page: handlebars_1.default.compile(templateFiles.page),
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
module.exports = generator;
