# JsonBlog Generator Boilerplate

[![npm version](https://badge.fury.io/js/jsonblog-generator-boilerplate.svg)](https://badge.fury.io/js/jsonblog-generator-boilerplate)
[![CI](https://github.com/jsonblog/jsonblog-generator-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonblog/jsonblog-generator-boilerplate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue.svg)](https://www.typescriptlang.org/)

A modern, customizable static blog generator that serves as a reference implementation for JsonBlog. This package is used by [jsonblog-cli](https://github.com/jsonblog/jsonblog-cli) to generate clean, modern HTML output.

**Want to create your own blog theme?** Fork this repository and customize it! This boilerplate is designed to be a starting point for your own generator. See the [Creating Your Own Generator](#creating-your-own-generator) section below.

## Features

- 🚀 **Development server** with live reload on port 3500
- 🏷️ **Tags and categories** support for better content organization
- 📄 **Pagination** with configurable posts per page
- 📡 **RSS feed** generation for content syndication
- 🗺️ **Sitemap** generation for SEO
- ⚡ **Parallel processing** for fast content generation
- 🔍 **Enhanced logging** with pino for better debugging
- 🛡️ **Robust error handling** with graceful fallbacks
- 📝 Clean, modern HTML output
- 🎨 Markdown support with code highlighting
- 🔧 Customizable templates using Handlebars
- 📘 TypeScript support
- 📚 Well-documented API
- ✅ Extensive test coverage
- 🎯 Perfect starting point for your own generator

## Installation

```bash
npm install jsonblog-generator-boilerplate
```

## Usage

```typescript
import generator from 'jsonblog-generator-boilerplate';

const blog = {
  site: {
    title: 'My Blog',
    description: 'A blog about my thoughts',
  },
  basics: {
    name: 'John Doe',
  },
  settings: {
    postsPerPage: 5, // Optional: defaults to 10
  },
  posts: [
    {
      title: 'Hello World',
      content: '# My First Post\n\nWelcome to my blog!',
      createdAt: '2025-02-25',
      tags: ['introduction', 'welcome'],
      categories: ['General'],
    },
  ],
};

const files = await generator(blog, './output');
```

## New Features

### Development Server

Start a live development server to preview your blog:

```bash
npm run dev
```

This will:
- Start a server on `http://localhost:3500`
- Watch for changes in templates, source files, and blog.json
- Automatically reload the browser when changes are detected

### Tags and Categories

Organize your content with tags and categories:

```typescript
{
  title: 'My Post',
  content: 'Post content...',
  tags: ['javascript', 'tutorial'],
  categories: ['Programming', 'Web Development']
}
```

This will generate:
- Individual tag pages at `/tag/[tag-name].html`
- Category pages at `/category/[category-name].html`
- Tag and category links on posts and index pages

### Pagination

Control how many posts appear per page:

```typescript
{
  settings: {
    postsPerPage: 5 // defaults to 10
  }
}
```

Pagination pages are generated at:
- `/index.html` (first page)
- `/page/2.html`, `/page/3.html`, etc.

### RSS Feed

An RSS feed is automatically generated at `/rss.xml` with:
- The 20 most recent posts
- Full post metadata
- Proper content encoding

### Sitemap

A sitemap is automatically generated at `/sitemap.xml` including:
- All posts and pages
- Tag and category pages
- Proper priority and change frequency settings

### Enhanced Error Handling

The generator now includes:
- Comprehensive input validation
- Graceful handling of missing content
- Network timeouts for remote content
- File size limits (10MB)
- Detailed error logging with pino

## Development

### Prerequisites

- Node.js >= 20.0.0
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/jsonblog/jsonblog-generator-boilerplate.git
cd jsonblog-generator-boilerplate

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

### Available Scripts

- `npm run build` - Build the TypeScript code
- `npm run dev` - Start development server with live reload on port 3500
- `npm run watch` - Watch TypeScript files for changes
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Release Process

1. Make your changes
2. Run tests and linting: `npm test && npm run lint`
3. Use one of the following commands to create a new version:
   - `npm run release:patch` - Bug fixes (1.0.0 -> 1.0.1)
   - `npm run release:minor` - New features (1.0.0 -> 1.1.0)
   - `npm run release:major` - Breaking changes (1.0.0 -> 2.0.0)
4. Create a new release on GitHub to trigger the publishing workflow

## Creating Your Own Generator

This boilerplate is designed to be forked and customized. Here's how to create your own generator:

### Quick Start

1. Fork this repository
2. Update package.json with your generator name (e.g., `jsonblog-generator-yourname`)
3. Customize the templates in `templates/`
4. Modify the styles in `assets/main.css`
5. Test your changes with the provided test suite
6. Publish to npm!

### What to Customize

- `templates/layout.hbs`: Main layout template with HTML structure
- `templates/index.hbs`: Blog index page template
- `templates/post.hbs`: Individual post template
- `assets/main.css`: Your custom styles
- `src/index.ts`: Generator logic (if needed)

### Generator API

Your generator only needs to implement one function:

```typescript
async function generator(blog: BlogConfig, outputPath: string): Promise<GeneratedFile[]>;
```

The boilerplate handles:

- Markdown rendering
- File management
- Template processing
- Content fetching (local, remote, IPFS)

You just focus on making it look great!

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Related Projects

- [jsonblog-cli](https://github.com/jsonblog/jsonblog-cli) - Command-line interface that uses this generator

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
