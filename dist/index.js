"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
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
// Register partials
handlebars_1.default.registerPartial('layout', templateFiles.layout);
handlebars_1.default.registerPartial('content', '{{> @partial-block }}');
// Helper function to format dates
handlebars_1.default.registerHelper('formatDate', function (date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
});
// Process posts or pages
async function processContent(items, type) {
    if (!items)
        return [];
    const processedItems = await Promise.all(items.map(async (item) => {
        const content = item.content;
        return {
            ...item,
            content: md.render(content),
            slug: item.slug || (0, slugify_1.default)(item.title, { lower: true }),
        };
    }));
    return processedItems.sort((a, b) => {
        if (type === 'post' && 'publishedDate' in a && 'publishedDate' in b) {
            return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
        }
        return 0;
    });
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
