# JsonBlog Generator Boilerplate

A modern, customizable generator for JsonBlog that serves as a reference implementation and starting point for creating your own generators.

## Overview

JsonBlog is designed to be language-agnostic, allowing you to generate your blog using any technology stack. A `generator` is simply a function that takes a parsed `blog.json` file and returns an array of files with their contents. These files are then written to the filesystem to create your blog.

## Features

- 🎨 Modern, responsive design
- 📱 Mobile-friendly layout
- 🌙 Clean typography with Inter font
- ✨ Syntax highlighting for code blocks
- 🚀 Fast and lightweight
- 📦 TypeScript support
- 🔄 Backward compatible with v1

## Installation

```bash
npm install jsonblog-generator-boilerplate
```

## Usage

### Basic Example

```typescript
import generator from 'jsonblog-generator-boilerplate';

const blog = {
  site: {
    title: 'My Blog',
    description: 'A blog about coding and technology'
  },
  basics: {
    name: 'John Doe'
  },
  posts: [
    {
      title: 'Hello World',
      source: 'posts/hello-world.md',
      publishedDate: '2025-02-25'
    }
  ]
};

// Generate blog files
const files = await generator(blog);

// Files will be an array of objects like:
// [
//   { name: 'index.html', content: '...' },
//   { name: 'hello-world.html', content: '...' },
//   { name: 'main.css', content: '...' }
// ]
```

### Creating Your Own Generator

A generator is a function that follows this interface:

```typescript
interface BlogFile {
  name: string;    // Output filename (e.g., 'index.html')
  content: string; // File contents
}

interface Generator {
  (blog: Blog): Promise<BlogFile[]>;
}
```

Here's a minimal generator example:

```typescript
const generator = async (blog) => {
  const files = [];
  
  // Generate index.html
  files.push({
    name: 'index.html',
    content: `
      <h1>${blog.site.title}</h1>
      <p>${blog.site.description}</p>
      <ul>
        ${blog.posts.map(post => `
          <li><a href="${post.slug}.html">${post.title}</a></li>
        `).join('')}
      </ul>
    `
  });

  return files;
};
```

## Template Structure

The boilerplate uses Handlebars for templating with the following structure:

- `layout.hbs` - Main layout template
- `index.hbs` - Home page template
- `post.hbs` - Individual post template
- `page.hbs` - Static page template
- `main.css` - Styles

## Blog.json Schema

```typescript
interface Blog {
  site: {
    title: string;
    description: string;
  };
  basics: {
    name: string;
  };
  posts: Array<{
    title: string;
    source: string;        // Path or URL to markdown file
    publishedDate?: string;
  }>;
  pages?: Array<{
    title: string;
    source: string;        // Path or URL to markdown file
  }>;
}
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Format code
npm run format

# Lint code
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

ISC

## Credits

Built with ❤️ for [JsonBlog](https://github.com/thomasdavis/jsonblog)
