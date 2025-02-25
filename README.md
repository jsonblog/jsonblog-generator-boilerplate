# JsonBlog Generator Boilerplate

[![npm version](https://badge.fury.io/js/jsonblog-generator-boilerplate.svg)](https://badge.fury.io/js/jsonblog-generator-boilerplate)
[![CI](https://github.com/jsonblog/jsonblog-generator-boilerplate/actions/workflows/ci.yml/badge.svg)](https://github.com/jsonblog/jsonblog-generator-boilerplate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.4.4-blue.svg)](https://www.typescriptlang.org/)

A modern, TypeScript-based generator for JsonBlog that transforms your JSON blog content into a beautiful static website.

## Features

- 🚀 Full TypeScript support
- 📝 Markdown rendering with code highlighting
- 🎨 Clean, minimalist design
- 🔄 Live reload during development
- 🛠️ Customizable templates using Handlebars
- 📱 Responsive layout
- 🔒 Type-safe blog configuration

## Installation

```bash
npm install jsonblog-generator-boilerplate
```

## Usage

1. Create a `blog.json` file:

```json
{
  "site": {
    "title": "My Blog",
    "description": "A blog about my thoughts"
  },
  "posts": [
    {
      "title": "My First Post",
      "content": "# Hello World\n\nThis is my first blog post!",
      "publishedDate": "2025-02-25"
    }
  ]
}
```

2. Use with jsonblog-cli:

```bash
npm install -g jsonblog-cli
jsonblog build blog.json
```

## Development

### Prerequisites

- Node.js >= 16
- npm >= 7

### Setup

```bash
# Clone the repository
git clone https://github.com/jsonblog/jsonblog-generator-boilerplate.git
cd jsonblog-generator-boilerplate

# Install dependencies
npm install

# Build the project
npm run build
```

### Available Scripts

- `npm run build` - Build the TypeScript code
- `npm test` - Run tests
- `npm run lint` - Lint the code
- `npm run format` - Format code with Prettier
- `npm run release:patch` - Release a patch version
- `npm run release:minor` - Release a minor version
- `npm run release:major` - Release a major version

### Release Process

1. Make your changes
2. Run tests and linting: `npm test && npm run lint`
3. Choose the appropriate release command:
   - `npm run release:patch` for bug fixes
   - `npm run release:minor` for new features
   - `npm run release:major` for breaking changes
4. The release will be automatically published to npm when you create a GitHub release

## Templates

The generator uses Handlebars templates located in the `templates` directory:

- `layout.hbs` - Main layout template
- `index.hbs` - Blog index page
- `post.hbs` - Individual post template
- `page.hbs` - Static page template

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## License

MIT 
