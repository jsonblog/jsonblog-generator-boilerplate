# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands
- `npm run build` - Compile TypeScript to JavaScript
- `npm run watch` - Watch mode for TypeScript compilation during development
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run format` - Format code with Prettier

### Release Commands
- `npm run release:patch` - Bump patch version (1.2.0 → 1.2.1)
- `npm run release:minor` - Bump minor version (1.2.0 → 1.3.0)
- `npm run release:major` - Bump major version (1.2.0 → 2.0.0)

### Testing Individual Files
- `npm test -- src/__tests__/index.test.ts` - Run specific test file
- `npm test -- --watch` - Run tests in watch mode

## Architecture Overview

This is a JsonBlog generator boilerplate - a reference implementation for creating static blog generators that work with the JsonBlog format. It's designed to be forked and customized.

### Core Flow
1. **Input**: Receives a `Blog` object containing site metadata, posts, and pages
2. **Processing**: 
   - Fetches content from local files, URLs, or inline sources
   - Renders Markdown to HTML using markdown-it
   - Generates URL-friendly slugs
3. **Output**: Returns array of `GeneratedFile` objects with HTML content

### Key Components

**src/index.ts**
- Main generator function that orchestrates the entire process
- Handles content fetching, Markdown rendering, and template compilation
- Exports `generateBlog()` function used by jsonblog-cli

**src/types.ts**
- TypeScript interfaces defining the blog data structure
- Key types: `Blog`, `Post`, `Page`, `GeneratedFile`

**templates/**
- Handlebars templates for HTML generation
- `layout.hbs`: Main HTML structure
- `index.hbs`: Blog homepage
- `post.hbs`: Individual blog posts
- `page.hbs`: Static pages
- `main.css`: Styles

### Integration with jsonblog-cli

This generator is consumed by the jsonblog-cli tool:
1. CLI reads blog.json configuration
2. Passes data to this generator's `generateBlog()` function
3. Writes returned HTML files to disk

### Customization Strategy

When creating a custom generator:
1. Fork this repository
2. Modify templates in `templates/` for custom HTML structure
3. Update `main.css` for custom styling
4. Extend `src/index.ts` for additional features (tags, pagination, RSS)
5. Add new types to `src/types.ts` as needed
6. Publish as npm package for use with jsonblog-cli

### Current Limitations to Consider

- Logger defined but not actively used (only console.log)
- Sequential content processing (could parallelize)
- No built-in support for tags, categories, or pagination
- Basic error handling could be more granular
- Test coverage could be expanded